function interact() {
  if (!state || mode !== 'world' || battle || isOverlayOpen()) return;
  const ahead = facingPosition();
  const positions = [ahead, { x: state.x, y: state.y }];

  for (const pos of positions) {
    const npc = visibleNpcs().find(candidate => candidate.x === pos.x && candidate.y === pos.y);
    if (npc) return interactNpc(npc);
    const item = visibleInteractables().find(candidate => candidate.x === pos.x && candidate.y === pos.y);
    if (item) return interactObject(item);
  }
  showToast('Nothing answers.');
}

function interactNpc(npc) {
  switch (npc.id) {
    case 'elder': return elderDialogue();
    case 'merchant': return openShop();
    case 'smith': return openSmith();
    case 'edda': return eddaDialogue();
    case 'mira': return miraDialogue();
    case 'captain': return captainDialogue();
    default: return showDialogue(npc.name, ['The stranger offers a guarded nod.']);
  }
}

function elderDialogue() {
  if (state.mainStage === 0) {
    showDialogue('Elder Maelin', [
      'The stars above Emberfall have gone dark, but something beneath Moonroot has begun to sing.',
      'Recover the three Moonshards. Together they will open the stair to the Sunken Shrine.',
      'Whatever wears the first crown must not wake fully.'
    ], () => {
      state.mainStage = 1;
      state.flags.introSeen = true;
    });
  } else if (state.mainStage === 1) {
    showDialogue('Elder Maelin', [`The forest has yielded ${state.shards} of the three Moonshards. Follow the cold light.`]);
  } else if (state.mainStage === 2 || state.mainStage === 3) {
    showDialogue('Elder Maelin', ['The shards remember the path. Descend beneath Moonroot and end the Crownshade.']);
  } else if (state.mainStage === 4) {
    showDialogue('Elder Maelin', [
      'The dead stars are silent again. You have bought Emberfall a dawn.',
      'But the wardstones on the eastern road are failing. Ironroot Gate has sent no messenger in seven nights.',
      'Cross the Ruined Causeway. Find what waits beyond our old border.'
    ], () => {
      state.mainStage = 5;
      state.flags.chapterOneComplete = true;
    });
  } else {
    showDialogue('Elder Maelin', [state.mainStage >= 7 ? 'You have carried Emberfall farther than any oath could demand.' : 'The eastern ward is open. May the old fire walk beside you.']);
  }
}

function eddaDialogue() {
  if (state.sideScout === 0) {
    showChoice('Edda’s Request', 'My sister Mira went into Moonroot before the shadows rose. Will you look for her?', [
      { label: 'We will find her.', action: () => { state.sideScout = 1; saveGame(); showDialogue('Edda', ['She carries a violet wardblade. Bring her home, or bring me the truth.']); } },
      { label: 'Not yet.', action: () => showDialogue('Edda', ['Then I will keep the hearth lit.']) }
    ]);
  } else if (state.sideScout === 1) {
    showDialogue('Edda', ['Mira knows the forest paths. Look west of the moonwell.']);
  } else if (state.sideScout === 2) {
    showDialogue('Edda', ['Mira lives? Then there is still mercy in this world. Take these supplies.'], () => {
      state.sideScout = 3;
      addItem('potion', 3);
      addItem('ether', 2);
      state.gold += 90;
      showToast('Received supplies and 90 crowns.');
    });
  } else {
    showDialogue('Edda', ['Mira always needed a road larger than Emberfall. Keep each other alive.']);
  }
}

function miraDialogue() {
  if (!state.defeated.includes('forest-wolf')) {
    showDialogue('Mira', ['The briar wolves have me pinned. Break the pack and I can still fight.']);
    return;
  }
  showDialogue('Mira', [
    'You came through the wolves for a stranger. That is either courage or terrible judgment.',
    'My wardblade can open paths your steel cannot. I am coming with you.'
  ], () => {
    state.flags.miraJoined = true;
    state.sideScout = 2;
    const averageLevel = Math.max(1, Math.round(state.party.reduce((sum, hero) => sum + hero.level, 0) / state.party.length));
    state.party.push(makeHero('mira', averageLevel));
    showToast('Mira joined the party.');
  });
}

function captainDialogue() {
  if (state.mainStage === 6) {
    showDialogue('Captain Seln', [
      'The Warden was ours once. Something inside the gate rewrote its oath.',
      'Beyond these doors lies the northern dominion — and the hand that darkened your stars.',
      'For now, hold the threshold. The next road will not be kind.'
    ], () => {
      state.mainStage = 7;
      state.flags.chapterTwoComplete = true;
    });
  } else {
    showDialogue('Captain Seln', ['Ironroot stands because you reached it before the silence became permanent.']);
  }
}

function interactObject(item) {
  if (item.type === 'shard') return collectShard(item);
  if (item.type === 'chest') return openChest(item);
  if (item.type === 'heal') {
    restoreParty();
    showToast('The party is restored.');
    saveGame();
  }
}

function collectShard(item) {
  if (state.collected.includes(item.id)) return;
  state.collected.push(item.id);
  state.shards += 1;
  if (state.shards >= 3 && state.mainStage === 1) state.mainStage = 2;
  saveGame();
  updateHud();
  showDialogue('Moonshard', [`Cold light settles into the shardbound seal. (${state.shards}/3)`]);
}

function openChest(item) {
  if (state.collected.includes(item.id)) {
    showToast('The cache is empty.');
    return;
  }
  state.collected.push(item.id);
  const gained = [];
  for (const [key, value] of Object.entries(item.rewards || {})) {
    if (key === 'gold') {
      state.gold += value;
      gained.push(`${value} crowns`);
    } else {
      addItem(key, value);
      gained.push(`${value} ${ITEMS[key]?.name || key}`);
    }
  }
  saveGame();
  showDialogue('Ancient Cache', [`Found ${gained.join(', ')}.`]);
}

function addItem(id, amount = 1) {
  state.inventory[id] = (state.inventory[id] || 0) + amount;
}

function restoreParty() {
  state.party.forEach(hero => {
    hero.hp = hero.maxHp;
    hero.mp = hero.maxMp;
    hero.statuses = {};
  });
  updateHud();
}

function openShop() {
  stopMovement();
  mode = 'menu';
  const render = () => {
    setOverlay(`<div class="screen"><div class="window frame"><h2>Tovin’s Road Goods</h2><p>Crowns: <b>${state.gold}</b></p><div class="grid item-grid">${Object.entries(ITEMS).map(([id, item]) => `<div class="card"><h3>${item.name}</h3><p class="muted">${item.description}</p><div class="stat-line"><span>Owned</span><b>${state.inventory[id] || 0}</b></div><button class="ui-button" data-buy="${id}" ${state.gold < item.price ? 'disabled' : ''}>Buy — ${item.price}</button></div>`).join('')}</div><br><button class="ui-button secondary" id="shop-close">Leave shop</button></div></div>`);
    overlay.querySelectorAll('[data-buy]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.buy;
      const item = ITEMS[id];
      if (state.gold < item.price) return;
      state.gold -= item.price;
      addItem(id, 1);
      saveGame();
      render();
    }));
    document.querySelector('#shop-close').addEventListener('click', closeOverlayToWorld);
  };
  render();
}

function openSmith() {
  stopMovement();
  mode = 'menu';
  const render = () => {
    const weaponCost = 120 + state.upgrades.weapon * 110;
    const armorCost = 110 + state.upgrades.armor * 100;
    setOverlay(`<div class="screen"><div class="window frame"><h2>Hara’s Emberforge</h2><p>Permanent party-wide equipment improvements. Crowns: <b>${state.gold}</b></p><div class="grid item-grid">
      <div class="card"><h3>Temper Weapons +${state.upgrades.weapon}</h3><p class="muted">Increase every hero’s Attack by 3.</p><button class="ui-button" id="weapon-up" ${state.gold < weaponCost || state.upgrades.weapon >= 5 ? 'disabled' : ''}>${state.upgrades.weapon >= 5 ? 'Maximum' : `Forge — ${weaponCost}`}</button></div>
      <div class="card"><h3>Reinforce Armor +${state.upgrades.armor}</h3><p class="muted">Increase every hero’s Defense by 2 and Max HP by 8.</p><button class="ui-button" id="armor-up" ${state.gold < armorCost || state.upgrades.armor >= 5 ? 'disabled' : ''}>${state.upgrades.armor >= 5 ? 'Maximum' : `Forge — ${armorCost}`}</button></div>
    </div><br><button class="ui-button secondary" id="smith-close">Leave forge</button></div></div>`);
    document.querySelector('#weapon-up')?.addEventListener('click', () => {
      if (state.gold < weaponCost || state.upgrades.weapon >= 5) return;
      state.gold -= weaponCost;
      state.upgrades.weapon += 1;
      state.party.forEach(hero => { hero.attack += 3; hero.weaponLevel = state.upgrades.weapon; });
      saveGame(); render();
    });
    document.querySelector('#armor-up')?.addEventListener('click', () => {
      if (state.gold < armorCost || state.upgrades.armor >= 5) return;
      state.gold -= armorCost;
      state.upgrades.armor += 1;
      state.party.forEach(hero => { hero.defense += 2; hero.maxHp += 8; hero.hp += 8; hero.armorLevel = state.upgrades.armor; });
      saveGame(); render();
    });
    document.querySelector('#smith-close').addEventListener('click', closeOverlayToWorld);
  };
  render();
}

function closeOverlayToWorld() {
  setOverlay();
  mode = 'world';
  updateHud();
}
