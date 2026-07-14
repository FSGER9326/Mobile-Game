function updateHud() {
  if (!state) return;
  partyHud.innerHTML = state.party.map(hero => {
    const hpPct = Math.max(0, Math.min(100, hero.hp / hero.maxHp * 100));
    const mpPct = Math.max(0, Math.min(100, hero.mp / hero.maxMp * 100));
    return `<div class="hero-chip frame">
      <div class="hero-line"><span class="hero-name">${hero.name}</span><span class="level">Lv ${hero.level}</span></div>
      <div class="hero-line"><span>${hero.hp}/${hero.maxHp}</span><span>${hero.mp}/${hero.maxMp}</span></div>
      <div class="bar"><i style="width:${hpPct}%"></i></div>
      <div class="bar mp"><i style="width:${mpPct}%"></i></div>
    </div>`;
  }).join('');
  objectiveHud.innerHTML = `<b>Objective</b><br>${objectiveText()}`;
}

function showToast(text, duration = 1500) {
  clearTimeout(toastTimer);
  toastEl.textContent = text;
  toastEl.classList.remove('hidden');
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), duration);
}

function showLocation(mapId = state.map) {
  clearTimeout(bannerTimer);
  const map = MAPS[mapId];
  locationBanner.innerHTML = `${map.name}<small style="display:block;font-size:.42em;color:#b8ad99;letter-spacing:.08em;margin-top:4px">${map.subtitle}</small>`;
  locationBanner.classList.remove('hidden');
  bannerTimer = setTimeout(() => locationBanner.classList.add('hidden'), 1900);
}

function setOverlay(html = '') {
  overlay.innerHTML = html;
}

function isOverlayOpen() {
  return overlay.children.length > 0;
}

function showDialogue(name, lines, onDone = null) {
  stopMovement();
  mode = 'dialogue';
  let index = 0;
  const render = () => {
    setOverlay(`<div class="dialogue-box"><div class="dialogue-name">${name}</div><div>${lines[index]}</div><span class="dialogue-hint">Tap to continue</span></div>`);
    overlay.firstElementChild.addEventListener('click', () => {
      index += 1;
      if (index < lines.length) render();
      else {
        setOverlay();
        mode = 'world';
        onDone?.();
        updateHud();
        saveGame();
      }
    }, { once: true });
  };
  render();
}

function showChoice(title, text, choices) {
  stopMovement();
  mode = 'menu';
  setOverlay(`<div class="screen"><div class="window frame"><h2>${title}</h2><p>${text}</p><div class="button-stack">${choices.map((choice, i) => `<button class="ui-button" data-choice="${i}">${choice.label}</button>`).join('')}</div></div></div>`);
  overlay.querySelectorAll('[data-choice]').forEach(button => {
    button.addEventListener('click', () => {
      setOverlay();
      mode = 'world';
      choices[Number(button.dataset.choice)].action?.();
    });
  });
}

function changeMap(exit) {
  if (exit.to === 'shrine' && state.mainStage === 2) state.mainStage = 3;
  state.map = exit.to;
  state.x = exit.tx;
  state.y = exit.ty;
  trail = [];
  saveGame();
  updateHud();
  showLocation();
}

function checkExit() {
  const exits = MAPS[state.map].exits || [];
  const exit = exits.find(candidate => candidate.x === state.x && candidate.y === state.y);
  if (!exit) return false;
  if (exit.stage !== undefined && state.mainStage < exit.stage) {
    showToast('The road remains sealed by Maelin’s ward.');
    return true;
  }
  if (exit.requires && !exit.requires(state)) {
    showToast(exit.blocked || 'The way is sealed.');
    return true;
  }
  changeMap(exit);
  return true;
}

function move(dx, dy, facing) {
  if (!state || mode !== 'world' || battle || isOverlayOpen()) return;
  state.facing = facing;
  const nx = state.x + dx;
  const ny = state.y + dy;
  if (isBlocked(nx, ny)) return;

  trail.unshift({ x: state.x, y: state.y, facing: state.facing });
  trail = trail.slice(0, 12);
  state.x = nx;
  state.y = ny;

  const encounter = availableEncounters().find(item => item.x === nx && item.y === ny);
  if (encounter) {
    startBattle(encounter);
    return;
  }

  if (!checkExit()) {
    const current = visibleInteractables().find(item => item.x === nx && item.y === ny && item.type === 'shard' && !state.collected.includes(item.id));
    if (current) collectShard(current);
  }

  saveGame();
  updateHud();
}

function facingPosition() {
  const vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const [dx, dy] = vectors[state.facing] || [0, -1];
  return { x: state.x + dx, y: state.y + dy };
}
