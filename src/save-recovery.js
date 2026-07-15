/* Ashen Crown save resilience layer. Loaded after character-creator.js. */
(() => {
  const RECOVERY_PREFIX = 'ashen-crown-save-recovery-';
  const VALID_HERO_IDS = new Set(Object.keys(HERO_TEMPLATES));
  const VALID_MAPS = new Set(Object.keys(MAPS));
  const baseNormalizeState = normalizeState;

  function finiteNumber(value, fallback, minimum = -Infinity, maximum = Infinity) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
  }

  function sanitizeHero(hero, index) {
    if (!hero || typeof hero !== 'object') return null;
    const requestedTemplate = hero.templateId || hero.id;
    const templateId = VALID_HERO_IDS.has(requestedTemplate)
      ? requestedTemplate
      : index === 0 ? 'kael' : index === 1 ? 'lyra' : index === 2 ? 'rowan' : 'mira';
    const template = HERO_TEMPLATES[templateId];
    const level = Math.round(finiteNumber(hero.level, 1, 1, 99));
    const maxHp = Math.round(finiteNumber(hero.maxHp, template.maxHp, 1, 9999));
    const maxMp = Math.round(finiteNumber(hero.maxMp, template.maxMp, 0, 9999));
    return {
      ...hero,
      id: hero.id === 'protagonist' && index === 0 ? 'protagonist' : templateId,
      templateId,
      name: typeof hero.name === 'string' && hero.name.trim() ? hero.name.slice(0, 32) : template.name,
      level,
      maxHp,
      hp: Math.round(finiteNumber(hero.hp, maxHp, 0, maxHp)),
      maxMp,
      mp: Math.round(finiteNumber(hero.mp, maxMp, 0, maxMp)),
      attack: Math.round(finiteNumber(hero.attack, template.attack, 1, 999)),
      defense: Math.round(finiteNumber(hero.defense, template.defense, 0, 999)),
      agility: Math.round(finiteNumber(hero.agility, template.agility, 1, 999)),
      xp: Math.round(finiteNumber(hero.xp, 0, 0, 9999999)),
      xpNext: Math.round(finiteNumber(hero.xpNext, xpNeeded(level), 1, 9999999)),
      skillIds: Array.isArray(hero.skillIds) ? hero.skillIds.filter(id => SKILLS[id]) : [...template.skillIds],
      statuses: hero.statuses && typeof hero.statuses === 'object' ? { ...hero.statuses } : {}
    };
  }

  function occupiedRecoveryTiles(mapId) {
    const occupied = new Set();
    const add = entity => occupied.add(`${entity.x},${entity.y}`);
    (NPCS[mapId] || []).forEach(add);
    (ENCOUNTERS[mapId] || []).forEach(add);
    return occupied;
  }

  function isSafeRecoveryPosition(mapId, x, y, occupied = occupiedRecoveryTiles(mapId)) {
    const map = MAPS[mapId];
    if (!map || y < 0 || y >= map.grid.length || x < 0 || x >= map.grid[0].length) return false;
    const tile = map.grid[y][x];
    return tile !== '#' && tile !== '~' && !occupied.has(`${x},${y}`);
  }

  function nearestSafePosition(mapId, requestedX, requestedY, fallbackX, fallbackY) {
    const map = MAPS[mapId];
    const occupied = occupiedRecoveryTiles(mapId);
    const clampX = value => Math.min(map.grid[0].length - 1, Math.max(0, Math.round(value)));
    const clampY = value => Math.min(map.grid.length - 1, Math.max(0, Math.round(value)));
    const start = { x: clampX(requestedX), y: clampY(requestedY) };
    if (isSafeRecoveryPosition(mapId, start.x, start.y, occupied)) return start;

    const queue = [start];
    const seen = new Set([`${start.x},${start.y}`]);
    const directions = [[0, -1], [-1, 0], [1, 0], [0, 1]];
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      for (const [dx, dy] of directions) {
        const next = { x: current.x + dx, y: current.y + dy };
        const key = `${next.x},${next.y}`;
        if (seen.has(key) || next.x < 0 || next.y < 0 || next.y >= map.grid.length || next.x >= map.grid[0].length) continue;
        if (isSafeRecoveryPosition(mapId, next.x, next.y, occupied)) return next;
        seen.add(key);
        queue.push(next);
      }
    }

    const fallback = { x: clampX(fallbackX), y: clampY(fallbackY) };
    if (isSafeRecoveryPosition(mapId, fallback.x, fallback.y, occupied)) return fallback;
    throw new Error(`Map ${mapId} has no safe recovery position.`);
  }

  function sanitizeRawState(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Save root is not an object.');
    const fallback = newState();
    const map = VALID_MAPS.has(raw.map) ? raw.map : fallback.map;
    const party = (Array.isArray(raw.party) ? raw.party : [])
      .map(sanitizeHero)
      .filter(Boolean)
      .slice(0, 4);
    const safeParty = party.length ? party : fallback.party;
    const requestedX = finiteNumber(raw.x, fallback.x);
    const requestedY = finiteNumber(raw.y, fallback.y);
    const position = nearestSafePosition(map, requestedX, requestedY, fallback.x, fallback.y);
    return {
      ...raw,
      map,
      x: position.x,
      y: position.y,
      mainStage: Math.round(finiteNumber(raw.mainStage, 0, 0, 99)),
      shards: Math.round(finiteNumber(raw.shards, 0, 0, 3)),
      sideScout: Math.round(finiteNumber(raw.sideScout, 0, 0, 99)),
      gold: Math.round(finiteNumber(raw.gold, fallback.gold, 0, 9999999)),
      playSeconds: Math.round(finiteNumber(raw.playSeconds, 0, 0, 999999999)),
      party: safeParty,
      inventory: raw.inventory && typeof raw.inventory === 'object' ? raw.inventory : {},
      flags: raw.flags && typeof raw.flags === 'object' ? raw.flags : {},
      upgrades: raw.upgrades && typeof raw.upgrades === 'object' ? raw.upgrades : {},
      collected: Array.isArray(raw.collected) ? raw.collected.filter(value => typeof value === 'string') : [],
      defeated: Array.isArray(raw.defeated) ? raw.defeated.filter(value => typeof value === 'string') : []
    };
  }

  normalizeState = function resilientNormalizeState(raw) {
    return baseNormalizeState(sanitizeRawState(raw));
  };

  function quarantineSave(rawText, error) {
    const recoveryKey = `${RECOVERY_PREFIX}${Date.now()}`;
    try { localStorage.setItem(recoveryKey, rawText); } catch (storageError) { console.warn('Save backup could not be written', storageError); }
    localStorage.removeItem(SAVE_KEY);
    console.warn('Save quarantined for recovery', error);
    stopMovement();
    mode = 'title';
    hud.classList.add('hidden');
    setOverlay(`<div class="screen"><div class="window frame title-window"><h1>Journey recovery</h1><p>Your current save could not be opened safely. A recovery copy was preserved on this device instead of deleting it.</p><p class="muted">You can return to the title screen and begin a new journey. The backup remains in Chrome site storage for later repair.</p><div class="button-stack"><button class="ui-button" id="recovery-title">Return to title</button></div></div></div>`);
    document.querySelector('#recovery-title')?.addEventListener('click', showTitle);
  }

  loadGame = function resilientLoadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        state = normalizeState(JSON.parse(saved));
        saveGame();
        return true;
      } catch (error) {
        quarantineSave(saved, error);
        return false;
      }
    }
    const old = localStorage.getItem(OLD_SAVE_KEY);
    if (old) {
      try {
        state = migrateOldSave(JSON.parse(old));
        state = normalizeState(state);
        saveGame();
        return true;
      } catch (error) {
        const recoveryKey = `${RECOVERY_PREFIX}legacy-${Date.now()}`;
        try { localStorage.setItem(recoveryKey, old); } catch (storageError) { console.warn('Legacy save backup could not be written', storageError); }
        localStorage.removeItem(OLD_SAVE_KEY);
        quarantineSave(old, error);
        return false;
      }
    }
    return false;
  };

  window.AshenSaveRecovery = { sanitizeRawState, sanitizeHero, isSafeRecoveryPosition, nearestSafePosition };
})();