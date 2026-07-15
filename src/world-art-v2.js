/* Game Studio world renderer v2: cached environments, custom hero art, species silhouettes. */
(() => {
  const mapCache = new Map();
  const LANDMARKS = {
    village: [
      { type: 'lantern', x: 10, y: 14 }, { type: 'lantern', x: 19, y: 14 },
      { type: 'banner', x: 14, y: 9 }, { type: 'cart', x: 21, y: 14 }
    ],
    forest: [
      { type: 'moonstone', x: 14, y: 3 }, { type: 'fallenLog', x: 19, y: 13 },
      { type: 'lantern', x: 10, y: 12 }, { type: 'arch', x: 18, y: 15 }
    ],
    shrine: [
      { type: 'runePillar', x: 8, y: 5 }, { type: 'runePillar', x: 21, y: 5 },
      { type: 'brazier', x: 11, y: 13 }, { type: 'brazier', x: 18, y: 13 }
    ],
    causeway: [
      { type: 'brokenPillar', x: 8, y: 7 }, { type: 'brokenPillar', x: 21, y: 7 },
      { type: 'banner', x: 15, y: 10 }, { type: 'lantern', x: 12, y: 15 }
    ],
    gate: [
      { type: 'towerBanner', x: 12, y: 6 }, { type: 'towerBanner', x: 17, y: 6 },
      { type: 'brazier', x: 11, y: 11 }, { type: 'brazier', x: 18, y: 11 }
    ]
  };

  function rng(x, y, seed = 0) { return hashNoise(x, y, seed); }
  function rgba(hex, alpha) {
    const value = hex.replace('#', '');
    const full = value.length === 3 ? value.split('').map(v => v + v).join('') : value;
    const num = Number.parseInt(full, 16);
    return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
  }
  function shade(hex, amount) {
    const value = hex.replace('#', '');
    const full = value.length === 3 ? value.split('').map(v => v + v).join('') : value;
    const num = Number.parseInt(full, 16);
    const clamp = channel => Math.max(0, Math.min(255, channel + amount));
    return `rgb(${clamp((num >> 16) & 255)},${clamp((num >> 8) & 255)},${clamp(num & 255)})`;
  }

  function drawGround(g, map, x, y, mapId) {
    const px = x * TILE; const py = y * TILE;
    const base = rng(x, y, 1) > .5 ? map.palette.ground : map.palette.ground2;
    const gradient = g.createLinearGradient(px, py, px + TILE, py + TILE);
    gradient.addColorStop(0, shade(base, 10));
    gradient.addColorStop(1, shade(base, -8));
    g.fillStyle = gradient; g.fillRect(px, py, TILE, TILE);
    for (let i = 0; i < 3; i += 1) {
      const ox = 4 + rng(x, y, 20 + i) * 24;
      const oy = 7 + rng(x, y, 30 + i) * 20;
      g.strokeStyle = mapId === 'shrine' ? 'rgba(154,151,193,.13)' : 'rgba(170,206,131,.20)';
      g.lineWidth = .8;
      g.beginPath(); g.moveTo(px + ox, py + oy + 4); g.lineTo(px + ox - 1.8, py + oy); g.moveTo(px + ox, py + oy + 4); g.lineTo(px + ox + 2.2, py + oy - 1); g.stroke();
    }
    if (rng(x, y, 88) > .88) {
      g.fillStyle = mapId === 'forest' ? '#d9c4f2' : '#e4c78c';
      g.beginPath(); g.arc(px + 5 + rng(x, y, 89) * 22, py + 8 + rng(x, y, 90) * 18, 1.4, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,.025)'; g.strokeRect(px, py, TILE, TILE);
  }

  function drawPath(g, map, x, y) {
    const px = x * TILE; const py = y * TILE;
    const gradient = g.createLinearGradient(px, py, px, py + TILE);
    gradient.addColorStop(0, shade(map.palette.path, 13)); gradient.addColorStop(1, shade(map.palette.path, -11));
    g.fillStyle = gradient; g.fillRect(px, py, TILE, TILE);
    g.fillStyle = 'rgba(56,39,27,.18)';
    for (let i = 0; i < 3; i += 1) {
      const ox = 4 + rng(x, y, 100 + i) * 24; const oy = 5 + rng(x, y, 110 + i) * 22;
      g.beginPath(); g.ellipse(px + ox, py + oy, 2.2 + rng(x, y, 120 + i) * 2, 1.2, rng(x, y, 130 + i), 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(255,245,220,.07)'; g.beginPath(); g.moveTo(px + 2, py + 3); g.lineTo(px + TILE - 2, py + 3); g.stroke();
  }

  function drawWater(g, map, x, y) {
    const px = x * TILE; const py = y * TILE;
    const gradient = g.createLinearGradient(px, py, px, py + TILE);
    gradient.addColorStop(0, shade(map.palette.water, 18)); gradient.addColorStop(.55, map.palette.water); gradient.addColorStop(1, shade(map.palette.water, -18));
    g.fillStyle = gradient; g.fillRect(px, py, TILE, TILE);
    if (rng(x, y, 50) > .84) {
      g.fillStyle = 'rgba(180,211,146,.42)'; g.beginPath(); g.ellipse(px + 8 + rng(x, y, 51) * 16, py + 8 + rng(x, y, 52) * 16, 4, 2, -.25, 0, Math.PI * 2); g.fill();
    }
  }

  function drawForestWall(g, x, y) {
    const px = x * TILE; const py = y * TILE;
    g.fillStyle = '#17271f'; g.fillRect(px, py, TILE, TILE);
    g.fillStyle = '#4b3627'; g.fillRect(px + 12, py + 14, 8, 19);
    g.fillStyle = '#2c4d32'; g.beginPath(); g.arc(px + 16, py + 10, 15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3f6a40'; g.beginPath(); g.arc(px + 9, py + 9, 10, 0, Math.PI * 2); g.arc(px + 23, py + 8, 11, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(173,208,124,.18)'; g.beginPath(); g.arc(px + 11, py + 5, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(px, py + 28, TILE, 4);
  }

  function drawBuiltWall(g, map, x, y, mapId) {
    const px = x * TILE; const py = y * TILE;
    const wall = map.palette.wall;
    const gradient = g.createLinearGradient(px, py, px, py + TILE);
    gradient.addColorStop(0, shade(wall, 22)); gradient.addColorStop(1, shade(wall, -16));
    g.fillStyle = gradient; g.fillRect(px, py, TILE, TILE);
    if (mapId === 'village') {
      const roof = rng(x, y, 3) > .48 ? '#4f3440' : '#3d495a';
      g.fillStyle = roof; g.beginPath(); g.moveTo(px - 2, py + 12); g.lineTo(px + 16, py - 3); g.lineTo(px + 34, py + 12); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(236,210,165,.18)'; for (let i = 0; i < 4; i += 1) { g.beginPath(); g.moveTo(px + i * 9, py + 10); g.lineTo(px + 16 + i * 5, py); g.stroke(); }
      g.fillStyle = '#604632'; g.fillRect(px + 5, py + 12, 22, 20);
      if (rng(x, y, 4) > .7) { g.fillStyle = '#e7b45a'; g.fillRect(px + 11, py + 18, 7, 7); g.fillStyle = 'rgba(255,204,108,.22)'; g.fillRect(px + 8, py + 15, 13, 13); }
    } else {
      g.strokeStyle = 'rgba(8,10,14,.32)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(px, py + 10); g.lineTo(px + TILE, py + 10); g.moveTo(px, py + 21); g.lineTo(px + TILE, py + 21); g.moveTo(px + 8 + (y % 2) * 8, py); g.lineTo(px + 8 + (y % 2) * 8, py + 10); g.moveTo(px + 23 - (y % 2) * 8, py + 10); g.lineTo(px + 23 - (y % 2) * 8, py + 21); g.stroke();
      g.fillStyle = 'rgba(219,227,240,.06)'; g.fillRect(px + 2, py + 2, TILE - 4, 3);
      if (mapId === 'shrine' && rng(x, y, 6) > .72) { g.strokeStyle = 'rgba(135,154,234,.5)'; g.beginPath(); g.arc(px + 16, py + 15, 5, 0, Math.PI * 2); g.stroke(); }
      if (mapId !== 'shrine' && rng(x, y, 7) > .74) { g.fillStyle = 'rgba(83,116,69,.38)'; g.beginPath(); g.arc(px + 7, py + 8, 3, 0, Math.PI * 2); g.arc(px + 11, py + 12, 2, 0, Math.PI * 2); g.fill(); }
    }
  }

  function drawStaticTile(g, map, char, x, y, mapId) {
    if (char === '#') {
      if (mapId === 'forest') drawForestWall(g, x, y); else drawBuiltWall(g, map, x, y, mapId);
    } else if (char === '~') drawWater(g, map, x, y);
    else if (char === '=') drawPath(g, map, x, y);
    else drawGround(g, map, x, y, mapId);
  }

  function drawLandmark(g, landmark, mapId) {
    const px = landmark.x * TILE + TILE / 2; const py = landmark.y * TILE + TILE / 2;
    g.save(); g.translate(px, py);
    if (landmark.type === 'lantern') {
      g.strokeStyle = '#33291f'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 13); g.lineTo(0, -10); g.lineTo(7, -10); g.stroke();
      const glow = g.createRadialGradient(7, -6, 1, 7, -6, 16); glow.addColorStop(0, 'rgba(255,213,113,.75)'); glow.addColorStop(1, 'rgba(255,183,73,0)'); g.fillStyle = glow; g.beginPath(); g.arc(7, -6, 16, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f3c769'; g.fillRect(3, -11, 8, 9);
    } else if (landmark.type === 'banner' || landmark.type === 'towerBanner') {
      g.strokeStyle = '#32291f'; g.lineWidth = 3; g.beginPath(); g.moveTo(-5, 14); g.lineTo(-5, -20); g.stroke();
      g.fillStyle = mapId === 'gate' ? '#8c4c3d' : '#704f83'; g.beginPath(); g.moveTo(-4, -18); g.lineTo(15, -15); g.lineTo(12, 2); g.lineTo(-4, 0); g.closePath(); g.fill();
      g.fillStyle = 'rgba(246,219,158,.6)'; g.fillRect(2, -12, 2, 8);
    } else if (landmark.type === 'cart') {
      g.fillStyle = '#75513a'; g.fillRect(-13, -4, 25, 11); g.strokeStyle = '#2a211b'; g.lineWidth = 3; g.beginPath(); g.arc(-8, 9, 5, 0, Math.PI * 2); g.arc(8, 9, 5, 0, Math.PI * 2); g.stroke();
    } else if (landmark.type === 'fallenLog') {
      g.save(); g.rotate(-.3); g.fillStyle = '#59412d'; g.fillRect(-18, -5, 36, 10); g.fillStyle = '#759050'; g.fillRect(-10, -6, 9, 3); g.restore();
    } else if (landmark.type === 'moonstone') {
      const glow = g.createRadialGradient(0, 0, 1, 0, 0, 21); glow.addColorStop(0, 'rgba(180,220,255,.75)'); glow.addColorStop(1, 'rgba(100,150,230,0)'); g.fillStyle = glow; g.beginPath(); g.arc(0, 0, 21, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#9fbadb'; g.beginPath(); g.moveTo(0, -16); g.lineTo(9, 8); g.lineTo(0, 14); g.lineTo(-9, 8); g.closePath(); g.fill();
    } else if (landmark.type === 'arch') {
      g.strokeStyle = '#59606a'; g.lineWidth = 7; g.beginPath(); g.moveTo(-13, 15); g.lineTo(-13, -3); g.arc(0, -3, 13, Math.PI, 0); g.lineTo(13, 15); g.stroke();
    } else if (landmark.type === 'runePillar' || landmark.type === 'brokenPillar') {
      g.fillStyle = '#5d6170'; g.fillRect(-7, -18, 14, landmark.type === 'brokenPillar' ? 24 : 36); g.fillStyle = '#8a8f9f'; g.fillRect(-10, -20, 20, 5); g.strokeStyle = '#92a7ed'; g.beginPath(); g.moveTo(-3, -10); g.lineTo(4, -3); g.lineTo(-2, 5); g.stroke();
    } else if (landmark.type === 'brazier') {
      g.fillStyle = '#47392e'; g.fillRect(-8, 4, 16, 5); g.fillRect(-2, 8, 4, 8); g.fillStyle = '#f2a34c'; g.beginPath(); g.moveTo(-7, 4); g.quadraticCurveTo(-1, -17, 1, 0); g.quadraticCurveTo(9, -12, 7, 4); g.closePath(); g.fill();
    }
    g.restore();
  }

  function buildMapLayer(mapId) {
    const map = MAPS[mapId];
    const layer = document.createElement('canvas'); layer.width = WIDTH; layer.height = HEIGHT;
    const g = layer.getContext('2d');
    map.grid.forEach((row, y) => [...row].forEach((char, x) => drawStaticTile(g, map, char, x, y, mapId)));
    (LANDMARKS[mapId] || []).forEach(landmark => drawLandmark(g, landmark, mapId));
    return layer;
  }

  function mapLayer(mapId) {
    if (!mapCache.has(mapId)) mapCache.set(mapId, buildMapLayer(mapId));
    return mapCache.get(mapId);
  }

  function drawAnimatedWater(mapId) {
    const map = MAPS[mapId]; const t = frameTime * .002;
    map.grid.forEach((row, y) => [...row].forEach((char, x) => {
      if (char !== '~') return;
      const px = x * TILE; const py = y * TILE;
      ctx.strokeStyle = 'rgba(199,237,239,.28)'; ctx.lineWidth = 1;
      for (let i = 0; i < 2; i += 1) {
        const wave = 8 + i * 13 + Math.sin(t + x * .8 + y + i) * 2;
        ctx.beginPath(); ctx.moveTo(px + 3, py + wave); ctx.bezierCurveTo(px + 10, py + wave - 3, px + 20, py + wave + 3, px + 29, py + wave); ctx.stroke();
      }
    }));
  }

  function appearanceFor(hero) {
    if (hero?.appearance) return hero.appearance;
    if (state?.party?.[0] === hero && state?.protagonist) return state.protagonist;
    const defaults = {
      kael: { skin: '#d8aa82', hair: '#3a2825', eyes: '#6e9fc4', hairStyle: 'short', body: 'athletic', accent: hero?.color || '#b65755', classId: 'ashblade' },
      lyra: { skin: '#f1cfb2', hair: '#d8d9e5', eyes: '#9f6fb2', hairStyle: 'long', body: 'lean', accent: hero?.color || '#557bb9', classId: 'mooncantor' },
      rowan: { skin: '#aa7558', hair: '#231d24', eyes: '#7db887', hairStyle: 'short', body: 'athletic', accent: hero?.color || '#5a9268', classId: 'thornranger' },
      mira: { skin: '#d8aa82', hair: '#65402f', eyes: '#b78e4d', hairStyle: 'braid', body: 'athletic', accent: hero?.color || '#9b75b8', classId: 'wardseeker' }
    };
    return defaults[hero?.id] || { skin: '#d8aa82', hair: '#3a2825', eyes: '#6e9fc4', hairStyle: 'short', body: 'athletic', accent: hero?.color || '#8c7a68', classId: 'ashblade' };
  }

  function drawHair(g, style, color) {
    g.fillStyle = color;
    if (style === 'shaved') { g.beginPath(); g.arc(0, -13, 8.5, Math.PI, Math.PI * 2); g.fill(); return; }
    g.beginPath(); g.arc(0, -14, 9.5, Math.PI, Math.PI * 2); g.lineTo(8, -10); g.quadraticCurveTo(3, -17, -2, -13); g.quadraticCurveTo(-6, -9, -9, -10); g.closePath(); g.fill();
    if (style === 'long') { g.fillRect(-9, -13, 5, 20); g.fillRect(4, -13, 5, 20); }
    if (style === 'braid') { g.strokeStyle = color; g.lineWidth = 4; g.beginPath(); g.moveTo(7, -10); g.quadraticCurveTo(12, 0, 8, 12); g.stroke(); g.fillStyle = '#b9934b'; g.fillRect(6, 10, 4, 3); }
  }

  function drawWeapon(g, classId, accent, facing) {
    g.save();
    if (facing === 'left') g.scale(-1, 1);
    if (classId === 'mooncantor') {
      g.strokeStyle = '#6e5436'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -2); g.lineTo(14, 18); g.stroke();
      g.fillStyle = '#a9d5ef'; g.beginPath(); g.moveTo(10, -7); g.lineTo(16, -1); g.lineTo(12, 5); g.lineTo(6, -1); g.closePath(); g.fill();
    } else if (classId === 'thornranger') {
      g.strokeStyle = '#a87948'; g.lineWidth = 2; g.beginPath(); g.arc(9, 3, 11, -1.2, 1.2); g.stroke(); g.strokeStyle = '#d8c6a3'; g.beginPath(); g.moveTo(13, -7); g.lineTo(13, 13); g.stroke();
    } else if (classId === 'wardseeker') {
      g.strokeStyle = '#c9d6dc'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -6); g.lineTo(15, 18); g.stroke(); g.fillStyle = accent; g.beginPath(); g.moveTo(8, -11); g.lineTo(16, -8); g.lineTo(12, -2); g.closePath(); g.fill();
    } else {
      g.strokeStyle = '#d9e0e4'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -4); g.lineTo(15, 13); g.stroke(); g.strokeStyle = '#9b713d'; g.lineWidth = 4; g.beginPath(); g.moveTo(9, 7); g.lineTo(16, 5); g.stroke();
    }
    g.restore();
  }

  function drawHeroFigure(g, hero, cx, cy, scale = 1, facing = 'down', preview = false) {
    const a = appearanceFor(hero); const classId = a.classId || (hero?.id === 'lyra' ? 'mooncantor' : hero?.id === 'rowan' ? 'thornranger' : hero?.id === 'mira' ? 'wardseeker' : 'ashblade');
    const accent = a.accent || hero?.color || '#b65755'; const body = a.body || 'athletic';
    const width = body === 'broad' ? 11 : body === 'lean' ? 8 : 9.5;
    const bob = preview ? 0 : Math.sin(frameTime * .006 + cx * .02 + cy * .015) * .6;
    g.save(); g.translate(cx, cy + bob); g.scale(scale, scale);
    g.fillStyle = 'rgba(0,0,0,.42)'; g.beginPath(); g.ellipse(0, 15, 13, 5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#141721'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-4, 7); g.lineTo(-5, 15); g.moveTo(4, 7); g.lineTo(5, 15); g.stroke();
    g.strokeStyle = '#2c2523'; g.lineWidth = 3; g.beginPath(); g.moveTo(-6, 15); g.lineTo(-10, 15); g.moveTo(6, 15); g.lineTo(10, 15); g.stroke();
    const cloth = g.createLinearGradient(0, -4, 0, 12); cloth.addColorStop(0, shade(accent, 20)); cloth.addColorStop(1, shade(accent, -22)); g.fillStyle = cloth; g.strokeStyle = '#171923'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-width, -2); g.quadraticCurveTo(-width - 3, 6, -width + 1, 12); g.lineTo(width - 1, 12); g.quadraticCurveTo(width + 3, 6, width, -2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = rgba('#ffffff', .16); g.fillRect(-width + 2, 0, width * 2 - 4, 2);
    g.fillStyle = '#b8934f'; g.fillRect(-width, 7, width * 2, 2);
    g.fillStyle = a.skin || '#d8aa82'; g.strokeStyle = '#171923'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, -10, 8.5, 0, Math.PI * 2); g.fill(); g.stroke();
    drawHair(g, a.hairStyle || 'short', a.hair || '#2a2023');
    if (facing !== 'up') {
      const shift = facing === 'left' ? -2 : facing === 'right' ? 2 : 0;
      g.fillStyle = a.eyes || '#6e9fc4'; g.fillRect(-3.7 + shift, -10, 2, 1.7); g.fillRect(1.8 + shift, -10, 2, 1.7);
    }
    drawWeapon(g, classId, accent, facing);
    if (preview) {
      g.strokeStyle = rgba(accent, .45); g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 25, 0, Math.PI * 2); g.stroke();
    }
    g.restore();
  }

  function drawNpc(npc) {
    const hero = { id: 'npc', color: npc.color, appearance: { skin: '#d8aa82', hair: '#4b362e', eyes: '#5f493c', hairStyle: rng(npc.x, npc.y, 3) > .5 ? 'short' : 'long', body: 'athletic', accent: npc.color, classId: 'ashblade' } };
    drawHeroFigure(ctx, hero, npc.x * TILE + 16, npc.y * TILE + 17, .86, 'down');
  }

  function drawSpeciesEnemy(encounter) {
    const key = encounter.enemies[0]; const type = ENEMIES[key]; const cx = encounter.x * TILE + 16; const cy = encounter.y * TILE + 17; const boss = Boolean(encounter.boss); const pulse = 1 + Math.sin(frameTime * .005 + encounter.x) * .04;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.beginPath(); ctx.ellipse(0, 11, boss ? 18 : 13, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = type.color; ctx.strokeStyle = '#171923'; ctx.lineWidth = 2;
    if (key === 'gloomRat') {
      ctx.beginPath(); ctx.ellipse(0, 3, 11, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-8, -4, 4, 0, Math.PI * 2); ctx.arc(8, -4, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#b69a8a'; ctx.beginPath(); ctx.moveTo(9, 4); ctx.quadraticCurveTo(20, 4, 17, 13); ctx.stroke();
    } else if (key === 'briarWolf' || key === 'mireDrake') {
      ctx.beginPath(); ctx.moveTo(-13, 7); ctx.quadraticCurveTo(-11, -6, 0, -5); ctx.quadraticCurveTo(13, -6, 14, 8); ctx.lineTo(8, 12); ctx.lineTo(3, 7); ctx.lineTo(-4, 12); ctx.lineTo(-9, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-4, -14); ctx.lineTo(0, -6); ctx.lineTo(5, -14); ctx.lineTo(9, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (key === 'moonWisp') {
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 20); glow.addColorStop(0, 'rgba(210,242,255,.85)'); glow.addColorStop(.45, rgba(type.color, .65)); glow.addColorStop(1, rgba(type.color, 0)); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#cfefff'; ctx.beginPath(); ctx.arc(0, -1, 7, 0, Math.PI * 2); ctx.fill();
    } else if (key === 'brokenSentinel' || key === 'ironWarden') {
      ctx.fillStyle = type.color; ctx.beginPath(); ctx.moveTo(-12, 10); ctx.lineTo(-10, -9); ctx.lineTo(-4, -16); ctx.lineTo(5, -16); ctx.lineTo(11, -8); ctx.lineTo(13, 11); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a2530'; ctx.fillRect(-8, -10, 16, 7); ctx.fillStyle = '#f3b769'; ctx.fillRect(-5, -8, 3, 2); ctx.fillRect(2, -8, 3, 2); if (boss) { ctx.strokeStyle = '#d49568'; ctx.beginPath(); ctx.arc(0, -2, 20, 0, Math.PI * 2); ctx.stroke(); }
    } else {
      ctx.beginPath(); ctx.moveTo(0, boss ? -18 : -13); ctx.quadraticCurveTo(boss ? 18 : 13, -7, boss ? 14 : 10, 12); ctx.lineTo(4, 8); ctx.lineTo(0, 14); ctx.lineTo(-5, 8); ctx.lineTo(boss ? -14 : -10, 12); ctx.quadraticCurveTo(boss ? -18 : -13, -7, 0, boss ? -18 : -13); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = boss ? '#f0d2ff' : '#ffe5b0'; ctx.fillRect(-6, -3, 3, 3); ctx.fillRect(3, -3, 3, 3);
    ctx.restore();
  }

  function drawEnhancedInteractable(item) {
    if (state.collected.includes(item.id)) return;
    const px = item.x * TILE + 16; const py = item.y * TILE + 17;
    ctx.save(); ctx.translate(px, py);
    if (item.type === 'shard') {
      const bob = Math.sin(frameTime * .005 + item.x) * 3; const glow = ctx.createRadialGradient(0, bob, 2, 0, bob, 22); glow.addColorStop(0, 'rgba(210,247,255,.95)'); glow.addColorStop(1, 'rgba(100,190,255,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, bob, 22, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c6efff'; ctx.beginPath(); ctx.moveTo(0, -14 + bob); ctx.lineTo(9, bob); ctx.lineTo(0, 14 + bob); ctx.lineTo(-9, bob); ctx.closePath(); ctx.fill();
    } else if (item.type === 'chest') {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 11, 14, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6d4228'; ctx.fillRect(-12, -5, 24, 17); ctx.fillStyle = '#c49345'; ctx.fillRect(-12, -2, 24, 3); ctx.fillRect(-2, -5, 4, 17); ctx.fillStyle = '#f4d077'; ctx.fillRect(-2, 2, 4, 5);
    } else if (item.type === 'heal') {
      const glow = ctx.createRadialGradient(0, 5, 2, 0, 5, 22); glow.addColorStop(0, 'rgba(173,255,228,.9)'); glow.addColorStop(1, 'rgba(95,220,196,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 5, 22, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8ee7cb'; ctx.beginPath(); ctx.ellipse(0, 9, 14, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e2fff7'; ctx.fillRect(-2, -9, 4, 16);
    }
    ctx.restore();
  }

  function atmosphere(mapId) {
    if (mapId === 'forest') {
      ctx.fillStyle = 'rgba(181,215,255,.18)';
      for (let i = 0; i < 18; i += 1) { const x = (i * 83 + frameTime * .008) % WIDTH; const y = (i * 47 + Math.sin(frameTime * .001 + i) * 30 + 80) % HEIGHT; ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill(); }
    }
    const playerX = (state?.x ?? 15) * TILE + 16; const playerY = (state?.y ?? 9) * TILE + 16;
    const light = ctx.createRadialGradient(playerX, playerY, 45, playerX, playerY, 430); light.addColorStop(0, 'rgba(255,238,196,0)'); light.addColorStop(.6, 'rgba(12,17,26,.035)'); light.addColorStop(1, 'rgba(4,7,13,.30)'); ctx.fillStyle = light; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 170, WIDTH / 2, HEIGHT / 2, 570); vignette.addColorStop(.58, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,.30)'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  drawCharacter = function artV2Character(x, y, color, scale = 1, facing = 'down') {
    drawHeroFigure(ctx, { id: 'npc', color, appearance: { skin: '#d8aa82', hair: '#3a2825', eyes: '#6e9fc4', hairStyle: 'short', body: 'athletic', accent: color, classId: 'ashblade' } }, x * TILE + 16, y * TILE + 17, scale, facing);
  };
  drawEnemy = drawSpeciesEnemy;
  drawInteractable = drawEnhancedInteractable;

  drawWorld = function artV2World(timestamp = 0) {
    frameTime = timestamp;
    const mapId = state?.map || 'village';
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(mapLayer(mapId), 0, 0);
    drawAnimatedWater(mapId);
    if (state) {
      visibleInteractables().forEach(drawEnhancedInteractable);
      availableEncounters().forEach(drawSpeciesEnemy);
      visibleNpcs().forEach(drawNpc);
      state.party.slice(1, 4).forEach((hero, index) => {
        const position = trail[(index + 1) * 2 - 1];
        if (position && (position.x !== state.x || position.y !== state.y)) drawHeroFigure(ctx, hero, position.x * TILE + 16, position.y * TILE + 17, .82, position.facing || state.facing);
      });
      drawHeroFigure(ctx, state.party[0], state.x * TILE + 16, state.y * TILE + 17, 1.08, state.facing);
    }
    atmosphere(mapId);
    requestAnimationFrame(drawWorld);
  };

  window.AshenArt = {
    drawHeroFigure,
    drawCreatorPreview(canvas, appearance, classDef) {
      const g = canvas.getContext('2d'); const w = canvas.width; const h = canvas.height; g.clearRect(0, 0, w, h);
      const accent = appearance.accent || classDef.color; const bg = g.createRadialGradient(w / 2, h * .35, 5, w / 2, h * .45, 190); bg.addColorStop(0, rgba(accent, .72)); bg.addColorStop(.44, '#27354a'); bg.addColorStop(1, '#090d16'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(242,212,158,.20)'; g.lineWidth = 2; for (let radius = 45; radius < 160; radius += 34) { g.beginPath(); g.arc(w / 2, h * .55, radius, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(w / 2, h - 35, 82, 18, 0, 0, Math.PI * 2); g.fill();
      const hero = { id: classDef.baseId, color: accent, appearance: { ...appearance } };
      drawHeroFigure(g, hero, w / 2, h * .63, 4.2, 'down', true);
      g.fillStyle = 'rgba(9,13,22,.72)'; g.fillRect(18, h - 61, w - 36, 33); g.strokeStyle = rgba(accent, .65); g.strokeRect(18, h - 61, w - 36, 33); g.fillStyle = '#f2d49e'; g.textAlign = 'center'; g.font = '700 15px Georgia'; g.fillText(`${classDef.name.toUpperCase()} · ${classDef.weapon.toUpperCase()}`, w / 2, h - 40);
    }
  };
})();
