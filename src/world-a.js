function makeHero(id, level = 1) {
  const t = HERO_TEMPLATES[id];
  const growth = level - 1;
  return {
    id, name: t.name, className: t.className, color: t.color,
    level, xp: 0, xpNext: xpNeeded(level),
    maxHp: t.maxHp + growth * 14,
    hp: t.maxHp + growth * 14,
    maxMp: t.maxMp + growth * 5,
    mp: t.maxMp + growth * 5,
    attack: t.attack + growth * 3,
    defense: t.defense + growth * 2,
    agility: t.agility + growth * 2,
    skillIds: [...t.skillIds],
    weaponLevel: 0,
    armorLevel: 0,
    statuses: {}
  };
}

function xpNeeded(level) {
  return Math.round(70 + level * level * 32);
}

function newState() {
  return {
    version: 2,
    map: 'village', x: 14, y: 15, facing: 'up',
    mainStage: 0, shards: 0, sideScout: 0,
    gold: 45,
    inventory: { potion: 4, ether: 2, bomb: 0, antidote: 1 },
    party: [makeHero('kael'), makeHero('lyra'), makeHero('rowan')],
    collected: [], defeated: [],
    flags: { miraJoined: false, chapterOneComplete: false, chapterTwoComplete: false, introSeen: false },
    upgrades: { weapon: 0, armor: 0 },
    playSeconds: 0,
    savedAt: Date.now()
  };
}

function migrateOldSave(old) {
  const fresh = newState();
  fresh.map = MAPS[old.map] ? old.map : 'village';
  fresh.x = Number.isFinite(old.x) ? old.x : fresh.x;
  fresh.y = Number.isFinite(old.y) ? old.y : fresh.y;
  fresh.shards = Math.min(3, old.shards || 0);
  fresh.mainStage = old.boss ? 4 : fresh.shards >= 3 ? 2 : old.seen ? 1 : 0;
  fresh.gold = old.gold || fresh.gold;
  fresh.inventory.potion = old.items?.Potion ?? fresh.inventory.potion;
  fresh.inventory.ether = old.items?.Ether ?? fresh.inventory.ether;
  fresh.collected = old.col || [];
  fresh.defeated = old.wins || [];
  if (old.boss && !fresh.defeated.includes('crownshade')) fresh.defeated.push('crownshade');
  return fresh;
}

function hasSave() {
  return Boolean(localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY));
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = normalizeState(parsed);
      return true;
    } catch (error) {
      console.warn('Save could not be loaded', error);
    }
  }
  const old = localStorage.getItem(OLD_SAVE_KEY);
  if (old) {
    try {
      state = migrateOldSave(JSON.parse(old));
      saveGame();
      return true;
    } catch (error) {
      console.warn('Old save could not be migrated', error);
    }
  }
  return false;
}

function normalizeState(raw) {
  const fresh = newState();
  const merged = { ...fresh, ...raw };
  merged.inventory = { ...fresh.inventory, ...(raw.inventory || {}) };
  merged.flags = { ...fresh.flags, ...(raw.flags || {}) };
  merged.upgrades = { ...fresh.upgrades, ...(raw.upgrades || {}) };
  merged.collected = Array.isArray(raw.collected) ? raw.collected : [];
  merged.defeated = Array.isArray(raw.defeated) ? raw.defeated : [];
  merged.party = (Array.isArray(raw.party) && raw.party.length ? raw.party : fresh.party).map(hero => {
    const base = makeHero(hero.id || 'kael', hero.level || 1);
    return { ...base, ...hero, statuses: { ...(hero.statuses || {}) } };
  });
  return merged;
}

function saveGame(showNotice = false) {
  if (!state) return;
  state.savedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (showNotice) showToast('Journey saved.');
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(OLD_SAVE_KEY);
}

function objectiveText() {
  const objective = MAIN_OBJECTIVES[state.mainStage] ?? MAIN_OBJECTIVES[7];
  return typeof objective === 'function' ? objective(state) : objective;
}

function visibleNpcs(mapId = state.map) {
  return (NPCS[mapId] || []).filter(npc => !npc.visible || npc.visible(state));
}

function visibleInteractables(mapId = state.map) {
  return (INTERACTABLES[mapId] || []).filter(item => !item.hiddenWhen || !item.hiddenWhen(state));
}

function availableEncounters(mapId = state.map) {
  return (ENCOUNTERS[mapId] || []).filter(encounter => {
    if (state.defeated.includes(encounter.id)) return false;
    if (encounter.stage !== undefined && state.mainStage < encounter.stage) return false;
    return true;
  });
}

function getTile(x, y, mapId = state.map) {
  return MAPS[mapId]?.grid[y]?.[x] || '#';
}

function isBlocked(x, y) {
  const tile = getTile(x, y);
  if (tile === '#' || tile === '~') return true;
  if (visibleNpcs().some(npc => npc.x === x && npc.y === y)) return true;
  return false;
}

function hashNoise(x, y, seed = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 19.19) * 43758.5453;
  return n - Math.floor(n);
}

function drawTile(map, char, x, y) {
  const px = x * TILE;
  const py = y * TILE;
  let color = map.palette.ground;
  if (char === '#') color = map.palette.wall;
  else if (char === '~') color = map.palette.water;
  else if (char === '=') color = map.palette.path;
  else if (hashNoise(x, y) > 0.52) color = map.palette.ground2;

  ctx.fillStyle = color;
  ctx.fillRect(px, py, TILE, TILE);

  if (char === '#') {
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(px + 2, py + 2, TILE - 4, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.23)';
    ctx.fillRect(px, py + TILE - 5, TILE, 5);
    if (hashNoise(x, y, 2) > 0.55) {
      ctx.fillStyle = 'rgba(91,125,96,0.25)';
      ctx.fillRect(px + 4, py + 4, 6, 4);
    }
  } else if (char === '~') {
    const wave = (frameTime * 0.002 + x * 0.7 + y) % 2;
    ctx.strokeStyle = 'rgba(180,225,232,0.22)';
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 10 + wave);
    ctx.lineTo(px + 15, py + 8 + wave);
    ctx.lineTo(px + 27, py + 11 + wave);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + 7, py + 23 - wave);
    ctx.lineTo(px + 18, py + 21 - wave);
    ctx.lineTo(px + 28, py + 23 - wave);
    ctx.stroke();
  } else if (char === '=') {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(px + 2, py + 15, TILE - 4, 2);
  } else if (state.map === 'forest' && hashNoise(x, y, 4) > 0.84) {
    ctx.fillStyle = 'rgba(160,191,122,0.25)';
    ctx.fillRect(px + 7, py + 20, 2, 6);
    ctx.fillRect(px + 11, py + 18, 2, 8);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.strokeRect(px, py, TILE, TILE);
}

function drawCharacter(x, y, color, scale = 1, facing = 'down', outline = '#17131b') {
  const cx = x * TILE + TILE / 2;
  const cy = y * TILE + TILE / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.ellipse(0, 11, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(-8, -1, 16, 17);
  ctx.fillStyle = '#d8b593';
  ctx.beginPath();
  ctx.arc(0, -7, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#25202a';
  ctx.beginPath();
  ctx.arc(0, -9, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#12131b';
  const eyeY = -6;
  if (facing !== 'up') {
    const offset = facing === 'left' ? -2 : facing === 'right' ? 2 : 0;
    ctx.fillRect(-4 + offset, eyeY, 2, 2);
    ctx.fillRect(2 + offset, eyeY, 2, 2);
  }
  ctx.restore();
}

function drawEnemy(encounter) {
  const enemyKey = encounter.enemies[0];
  const type = ENEMIES[enemyKey];
  const cx = encounter.x * TILE + 16;
  const cy = encounter.y * TILE + 16;
  const pulse = 1 + Math.sin(frameTime * 0.004 + encounter.x) * 0.07;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 10, encounter.boss ? 16 : 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = type.color;
  ctx.beginPath();
  ctx.arc(0, 0, encounter.boss ? 14 : 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = encounter.boss ? '#f0dcff' : '#fff0d9';
  ctx.fillRect(-5, -3, 3, 3);
  ctx.fillRect(2, -3, 3, 3);
  if (encounter.boss) {
    ctx.strokeStyle = '#c49aef';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawInteractable(item) {
  if (state.collected.includes(item.id)) return;
  const px = item.x * TILE;
  const py = item.y * TILE;
  if (item.type === 'shard') {
    const bob = Math.sin(frameTime * 0.004 + item.x) * 2;
    ctx.fillStyle = 'rgba(158,226,255,0.2)';
    ctx.beginPath();
    ctx.arc(px + 16, py + 16 + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c6efff';
    ctx.beginPath();
    ctx.moveTo(px + 16, py + 3 + bob);
    ctx.lineTo(px + 25, py + 16 + bob);
    ctx.lineTo(px + 16, py + 29 + bob);
    ctx.lineTo(px + 7, py + 16 + bob);
    ctx.closePath();
    ctx.fill();
  } else if (item.type === 'chest') {
    ctx.fillStyle = '#6d4228';
    ctx.fillRect(px + 5, py + 10, 22, 17);
    ctx.fillStyle = '#c49345';
    ctx.fillRect(px + 5, py + 14, 22, 3);
    ctx.fillRect(px + 14, py + 10, 4, 17);
  } else if (item.type === 'heal') {
    const glow = 0.45 + Math.sin(frameTime * 0.003) * 0.15;
    ctx.fillStyle = `rgba(95,220,196,${glow})`;
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 21, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220,255,244,0.65)';
    ctx.fillRect(px + 14, py + 8, 4, 14);
  }
}

function drawWorld(timestamp = 0) {
  frameTime = timestamp;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const map = MAPS[state?.map || 'village'];
  map.grid.forEach((row, y) => {
    [...row].forEach((char, x) => drawTile(map, char, x, y));
  });

  if (state) {
    visibleInteractables().forEach(drawInteractable);
    availableEncounters().forEach(drawEnemy);
    visibleNpcs().forEach(npc => drawCharacter(npc.x, npc.y, npc.color, 0.96, 'down'));

    const followers = state.party.slice(1, 4);
    followers.forEach((hero, index) => {
      const position = trail[(index + 1) * 2 - 1];
      if (position && (position.x !== state.x || position.y !== state.y)) {
        drawCharacter(position.x, position.y, hero.color, 0.78, position.facing || state.facing, '#10131a');
      }
    });
    drawCharacter(state.x, state.y, state.party[0].color, 1, state.facing);
  }

  requestAnimationFrame(drawWorld);
}
