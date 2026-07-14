function openGameMenu(initialTab = 'party') {
  if (!state || mode === 'battle' || mode === 'dialogue') return;
  stopMovement();
  mode = 'menu';
  renderGameMenu(initialTab);
}

function renderGameMenu(tab) {
  const content = tab === 'party' ? partyMenuHtml()
    : tab === 'inventory' ? inventoryMenuHtml()
      : tab === 'journal' ? journalMenuHtml()
        : systemMenuHtml();
  setOverlay(`<div class="screen"><div class="window frame"><h1>Ashen Crown</h1><div class="tabs">
    ${['party', 'inventory', 'journal', 'system'].map(id => `<button class="ui-button tab ${tab === id ? 'active' : ''}" data-tab="${id}">${id[0].toUpperCase() + id.slice(1)}</button>`).join('')}
  </div><div>${content}</div><br><button class="ui-button secondary" id="menu-close">Return to game</button></div></div>`);
  overlay.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => renderGameMenu(button.dataset.tab)));
  document.querySelector('#menu-close').addEventListener('click', closeOverlayToWorld);
  overlay.querySelectorAll('[data-field-item]').forEach(button => button.addEventListener('click', () => useFieldItem(button.dataset.fieldItem)));
  document.querySelector('#save-now')?.addEventListener('click', () => saveGame(true));
  document.querySelector('#fullscreen-now')?.addEventListener('click', requestFullscreen);
  document.querySelector('#title-now')?.addEventListener('click', () => showTitle());
  document.querySelector('#reset-now')?.addEventListener('click', confirmReset);
  document.querySelector('#install-now')?.addEventListener('click', installPwa);
}

function partyMenuHtml() {
  return `<div class="grid party-grid">${state.party.map(hero => {
    const xpPct = hero.xp / hero.xpNext * 100;
    const skills = hero.skillIds.map(id => SKILLS[id]).filter(skill => hero.level >= skill.level).map(skill => skill.name).join(', ');
    return `<div class="card"><h3 style="color:${hero.color}">${hero.name} — ${hero.className}</h3><div class="stat-line"><span>Level</span><b>${hero.level}</b></div><div class="stat-line"><span>HP / MP</span><b>${hero.hp}/${hero.maxHp} · ${hero.mp}/${hero.maxMp}</b></div><div class="stat-line"><span>Attack / Defense</span><b>${hero.attack} / ${hero.defense}</b></div><div class="stat-line"><span>Agility</span><b>${hero.agility}</b></div><div class="bar xp"><i style="width:${xpPct}%"></i></div><p class="muted">XP ${hero.xp}/${hero.xpNext}<br>Skills: ${skills}</p></div>`;
  }).join('')}</div>`;
}

function inventoryMenuHtml() {
  return `<h2>Inventory — ${state.gold} crowns</h2><div class="grid item-grid">${Object.entries(ITEMS).map(([id, item]) => `<div class="card"><h3>${item.name} ×${state.inventory[id] || 0}</h3><p class="muted">${item.description}</p><button class="ui-button" data-field-item="${id}" ${(state.inventory[id] || 0) <= 0 || id === 'bomb' ? 'disabled' : ''}>Use</button></div>`).join('')}</div>`;
}

function journalMenuHtml() {
  const quests = [
    { done: state.mainStage >= 5, title: 'The Dead Stars', text: 'Recover the Moonshards and defeat Crownshade Vhal beneath Moonroot.' },
    { done: state.mainStage >= 7, title: 'The Eastern Silence', text: 'Cross the Ruined Causeway and restore Ironroot Gate.' },
    { done: state.sideScout >= 3, title: 'The Missing Scout', text: state.sideScout === 0 ? 'Speak with Edda in Emberfall.' : 'Find Mira in western Moonroot and return word to Edda.' }
  ];
  return `<h2>Journal</h2>${quests.map(quest => `<div class="quest-entry ${quest.done ? 'done' : ''}"><h3>${quest.done ? '✓ ' : ''}${quest.title}</h3><p>${quest.text}</p></div>`).join('')}<h3>Current objective</h3><p>${objectiveText()}</p>`;
}

function systemMenuHtml() {
  return `<h2>System</h2><p class="muted">The game autosaves after movement, dialogue, purchases, and battles. Installed PWA saves remain in Chrome’s site storage.</p><div class="button-stack">
    <button class="ui-button" id="save-now">Save now</button>
    <button class="ui-button" id="fullscreen-now">Fullscreen</button>
    ${installedPrompt ? '<button class="ui-button" id="install-now">Install on device</button>' : ''}
    <button class="ui-button secondary" id="title-now">Return to title</button>
    <button class="ui-button danger" id="reset-now">Erase journey</button>
  </div>`;
}

function useFieldItem(id) {
  if ((state.inventory[id] || 0) <= 0 || id === 'bomb') return;
  const candidates = state.party.filter(hero => {
    if (id === 'potion') return hero.hp < hero.maxHp;
    if (id === 'ether') return hero.mp < hero.maxMp;
    if (id === 'antidote') return hero.statuses.poison;
    return false;
  });
  if (!candidates.length) {
    showToast('No party member needs that item.');
    return;
  }
  showChoice(`Use ${ITEMS[id].name}`, 'Choose a party member.', candidates.map(hero => ({
    label: `${hero.name} — HP ${hero.hp}/${hero.maxHp}, MP ${hero.mp}/${hero.maxMp}`,
    action: () => {
      if (id === 'potion') hero.hp = Math.min(hero.maxHp, hero.hp + 80);
      if (id === 'ether') hero.mp = Math.min(hero.maxMp, hero.mp + 32);
      if (id === 'antidote') delete hero.statuses.poison;
      state.inventory[id] -= 1;
      saveGame();
      openGameMenu('inventory');
    }
  })));
}

function confirmReset() {
  showChoice('Erase journey?', 'This permanently deletes the current local save.', [
    { label: 'Cancel', action: () => openGameMenu('system') },
    { label: 'Erase save', action: () => { clearSave(); state = null; showTitle(); } }
  ]);
}

function showHowToPlay() {
  setOverlay(`<div class="screen"><div class="window frame"><h2>How to Play</h2><p><b>Move:</b> Hold the on-screen direction buttons, use arrow keys, or WASD.</p><p><b>Interact:</b> Face a person or object and press ✦, Space, Enter, or E.</p><p><b>Run:</b> Hold RUN while moving for faster repeat movement.</p><p><b>Battle:</b> Choose commands, skills, items, and targets. Guard sharply reduces the next incoming attack.</p><p><b>Install:</b> In Android Chrome, use “Install app” or “Add to Home screen” for fullscreen offline play.</p><button class="ui-button" id="help-close">Back</button></div></div>`);
  document.querySelector('#help-close').addEventListener('click', showTitle);
}

function showTitle() {
  stopMovement();
  mode = 'title';
  hud.classList.add('hidden');
  const continueButton = hasSave() ? '<button class="ui-button" id="continue-game">Continue journey</button>' : '';
  const installButton = installedPrompt ? '<button class="ui-button" id="install-title">Install game</button>' : '';
  setOverlay(`<div class="screen"><div class="window frame title-window"><div class="title-mark">ASHEN<br>CROWN</div><div class="title-sub">ECHOES OF VEYRA</div><p class="title-blurb">A mobile fantasy JRPG of dead stars, broken oaths, visible encounters, party progression, and turn-based combat.</p><div class="button-stack">${continueButton}<button class="ui-button" id="new-game">New journey</button>${installButton}<button class="ui-button secondary" id="how-play">How to play</button><button class="ui-button secondary" id="full-title">Fullscreen</button></div><p class="install-note">For Android Chrome: open this page, then choose “Install app” or “Add to Home screen.”</p></div></div>`);
  document.querySelector('#continue-game')?.addEventListener('click', () => {
    if (loadGame()) enterWorld(false);
  });
  document.querySelector('#new-game').addEventListener('click', () => {
    if (hasSave()) {
      showChoice('Begin a new journey?', 'The current local save will be replaced.', [
        { label: 'Cancel', action: showTitle },
        { label: 'Begin', action: () => { clearSave(); state = newState(); saveGame(); enterWorld(true); } }
      ]);
    } else {
      state = newState();
      saveGame();
      enterWorld(true);
    }
  });
  document.querySelector('#install-title')?.addEventListener('click', installPwa);
  document.querySelector('#how-play').addEventListener('click', showHowToPlay);
  document.querySelector('#full-title').addEventListener('click', requestFullscreen);
}
