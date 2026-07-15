/* Ashen Crown vector art renderer v3. Hand-authored canvas vectors; no generated imagery. */
(() => {
  'use strict';

  const cache = new Map();
  const TAU = Math.PI * 2;
  const MAP_PROPS = {
    village: [
      ['lamp', 10, 14], ['lamp', 19, 14], ['notice', 14, 9], ['wagon', 21, 14],
      ['well', 13, 6], ['hay', 6, 14], ['forge', 23, 13], ['banner', 16, 9]
    ],
    forest: [
      ['moonstone', 14, 3], ['log', 19, 13], ['waystone', 10, 12], ['arch', 18, 15],
      ['mushrooms', 7, 12], ['mushrooms', 24, 4], ['roots', 13, 11], ['shrineLamp', 16, 14]
    ],
    shrine: [
      ['runePillar', 8, 5], ['runePillar', 21, 5], ['brazier', 11, 13], ['brazier', 18, 13],
      ['altar', 14, 4], ['chain', 6, 9], ['chain', 23, 9], ['brokenIdol', 14, 14]
    ],
    causeway: [
      ['brokenPillar', 8, 7], ['brokenPillar', 21, 7], ['warBanner', 15, 10], ['lamp', 12, 15],
      ['bones', 5, 9], ['bones', 24, 14], ['barricade', 10, 12], ['barricade', 20, 12]
    ],
    gate: [
      ['towerBanner', 12, 6], ['towerBanner', 17, 6], ['brazier', 11, 11], ['brazier', 18, 11],
      ['portcullis', 14.5, 4], ['statue', 8, 10], ['statue', 22, 10], ['embers', 14, 12]
    ]
  };

  function hash(x, y, seed = 0) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 31.731) * 43758.5453123;
    return n - Math.floor(n);
  }

  function clamp(value, min = 0, max = 255) { return Math.max(min, Math.min(max, value)); }

  function hexParts(hex) {
    const raw = String(hex || '#888888').replace('#', '');
    const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw.padEnd(6, '8').slice(0, 6);
    const n = Number.parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgba(hex, alpha) {
    const [r, g, b] = hexParts(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function tone(hex, amount) {
    const [r, g, b] = hexParts(hex);
    return `rgb(${clamp(r + amount)},${clamp(g + amount)},${clamp(b + amount)})`;
  }

  function path(g, points, close = true) {
    g.beginPath();
    points.forEach(([x, y], index) => index ? g.lineTo(x, y) : g.moveTo(x, y));
    if (close) g.closePath();
  }

  function tile(mapId, x, y) { return MAPS[mapId]?.grid?.[y]?.[x] || '#'; }
  function same(mapId, x, y, char) { return tile(mapId, x, y) === char; }

  function fillGradient(g, x, y, w, h, a, b, vertical = true) {
    const gradient = g.createLinearGradient(x, y, vertical ? x : x + w, vertical ? y + h : y);
    gradient.addColorStop(0, a); gradient.addColorStop(1, b);
    g.fillStyle = gradient; g.fillRect(x, y, w, h);
  }

  function drawGround(g, mapId, x, y) {
    const map = MAPS[mapId];
    const px = x * TILE; const py = y * TILE;
    const base = hash(x, y, 2) > .52 ? map.palette.ground : map.palette.ground2;
    fillGradient(g, px, py, TILE, TILE, tone(base, 12), tone(base, -10), false);

    const grit = mapId === 'shrine' ? '#9997bd' : mapId === 'causeway' || mapId === 'gate' ? '#b7aa8a' : '#a7c77d';
    for (let i = 0; i < 4; i += 1) {
      const ox = 3 + hash(x, y, 20 + i) * 26;
      const oy = 5 + hash(x, y, 30 + i) * 23;
      g.strokeStyle = rgba(grit, .12 + hash(x, y, 40 + i) * .12);
      g.lineWidth = .65;
      g.beginPath(); g.moveTo(px + ox, py + oy + 4); g.lineTo(px + ox - 1.5, py + oy); g.moveTo(px + ox, py + oy + 4); g.lineTo(px + ox + 2.5, py + oy - 1); g.stroke();
    }
    if (hash(x, y, 60) > .91) {
      g.fillStyle = mapId === 'forest' ? '#d7c1f0' : mapId === 'village' ? '#e6c274' : '#98a9c6';
      g.beginPath(); g.arc(px + 6 + hash(x, y, 61) * 20, py + 7 + hash(x, y, 62) * 19, 1.3, 0, TAU); g.fill();
    }
  }

  function drawPath(g, mapId, x, y) {
    const map = MAPS[mapId]; const px = x * TILE; const py = y * TILE;
    fillGradient(g, px, py, TILE, TILE, tone(map.palette.path, 16), tone(map.palette.path, -13));
    g.fillStyle = 'rgba(38,27,20,.22)';
    for (let i = 0; i < 4; i += 1) {
      const ox = 3 + hash(x, y, 80 + i) * 26; const oy = 4 + hash(x, y, 90 + i) * 24;
      g.beginPath(); g.ellipse(px + ox, py + oy, 1.8 + hash(x, y, 100 + i) * 2.5, 1.1, hash(x, y, 110 + i), 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(255,241,208,.08)'; g.beginPath(); g.moveTo(px + 2, py + 3); g.lineTo(px + 30, py + 3); g.stroke();
    g.strokeStyle = 'rgba(40,25,18,.17)'; g.beginPath(); g.moveTo(px + 2, py + 28); g.lineTo(px + 30, py + 28); g.stroke();
  }

  function drawWaterBase(g, mapId, x, y) {
    const map = MAPS[mapId]; const px = x * TILE; const py = y * TILE;
    fillGradient(g, px, py, TILE, TILE, tone(map.palette.water, 25), tone(map.palette.water, -24));
    g.fillStyle = 'rgba(5,20,27,.18)'; g.fillRect(px, py + 23, TILE, 9);
    if (hash(x, y, 130) > .86) {
      g.fillStyle = 'rgba(166,196,135,.43)';
      g.beginPath(); g.ellipse(px + 7 + hash(x, y, 131) * 18, py + 7 + hash(x, y, 132) * 18, 4.5, 2.2, -.25, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(222,247,247,.20)';
    if (!same(mapId, x, y - 1, '~')) { g.beginPath(); g.moveTo(px, py + 2); g.lineTo(px + TILE, py + 2); g.stroke(); }
    if (!same(mapId, x - 1, y, '~')) { g.beginPath(); g.moveTo(px + 2, py); g.lineTo(px + 2, py + TILE); g.stroke(); }
  }

  function drawForestTrunk(g, x, y) {
    const px = x * TILE; const py = y * TILE;
    g.fillStyle = '#132019'; g.fillRect(px, py, TILE, TILE);
    g.fillStyle = '#493324'; g.beginPath(); g.roundRect(px + 11, py + 10, 10, 24, 4); g.fill();
    g.fillStyle = '#674932'; g.fillRect(px + 14, py + 11, 3, 21);
    g.strokeStyle = '#2d2018'; g.lineWidth = 2; g.beginPath(); g.moveTo(px + 16, py + 25); g.lineTo(px + 6, py + 33); g.moveTo(px + 17, py + 25); g.lineTo(px + 27, py + 33); g.stroke();
  }

  function drawTreeCanopy(g, x, y) {
    const px = x * TILE + 16; const py = y * TILE + 5;
    const dark = hash(x, y, 151) > .5 ? '#203d2b' : '#294931';
    g.save();
    g.shadowColor = 'rgba(0,0,0,.32)'; g.shadowBlur = 7; g.shadowOffsetY = 7;
    g.fillStyle = dark;
    [[-10, 1, 13], [2, -5, 15], [13, 2, 12], [-2, 8, 15]].forEach(([ox, oy, r]) => { g.beginPath(); g.arc(px + ox, py + oy, r, 0, TAU); g.fill(); });
    g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.fillStyle = 'rgba(119,162,84,.22)'; g.beginPath(); g.arc(px - 5, py - 7, 10, 0, TAU); g.fill();
    g.fillStyle = 'rgba(191,215,132,.12)'; g.beginPath(); g.arc(px + 7, py - 9, 7, 0, TAU); g.fill();
    g.restore();
  }

  function drawVillageBuilding(g, mapId, x, y, foreground) {
    const px = x * TILE; const py = y * TILE;
    if (!foreground) {
      g.fillStyle = '#48382f'; g.fillRect(px, py, TILE, TILE);
      g.fillStyle = '#6c5039'; g.fillRect(px + 3, py + 10, TILE - 6, 22);
      g.strokeStyle = 'rgba(28,20,17,.35)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(px + 4, py + 19); g.lineTo(px + 28, py + 19); g.moveTo(px + 10, py + 10); g.lineTo(px + 10, py + 32); g.moveTo(px + 23, py + 10); g.lineTo(px + 23, py + 32); g.stroke();
      if (hash(x, y, 171) > .72) {
        const glow = g.createRadialGradient(px + 16, py + 21, 1, px + 16, py + 21, 15); glow.addColorStop(0, 'rgba(255,195,86,.62)'); glow.addColorStop(1, 'rgba(255,166,54,0)'); g.fillStyle = glow; g.beginPath(); g.arc(px + 16, py + 21, 15, 0, TAU); g.fill();
        g.fillStyle = '#f0b95e'; g.fillRect(px + 12, py + 17, 8, 8);
        g.strokeStyle = '#6b4930'; g.lineWidth = 1; g.strokeRect(px + 12, py + 17, 8, 8);
      }
    } else {
      const roof = hash(x, y, 170) > .48 ? '#513543' : '#37485a';
      g.fillStyle = 'rgba(0,0,0,.24)'; path(g, [[px - 3, py + 15], [px + 16, py + 1], [px + 35, py + 15], [px + 31, py + 19], [px + 1, py + 19]]); g.fill();
      const grad = g.createLinearGradient(px, py, px + TILE, py + 18); grad.addColorStop(0, tone(roof, 19)); grad.addColorStop(1, tone(roof, -13)); g.fillStyle = grad;
      path(g, [[px - 4, py + 12], [px + 16, py - 5], [px + 36, py + 12], [px + 31, py + 17], [px + 1, py + 17]]); g.fill();
      g.strokeStyle = 'rgba(245,220,175,.16)'; g.lineWidth = 1;
      for (let i = -1; i < 5; i += 1) { g.beginPath(); g.moveTo(px + i * 9, py + 13); g.lineTo(px + 16 + i * 4.5, py); g.stroke(); }
    }
  }

  function drawStoneWall(g, mapId, x, y, foreground) {
    const map = MAPS[mapId]; const px = x * TILE; const py = y * TILE;
    if (foreground) return;
    fillGradient(g, px, py, TILE, TILE, tone(map.palette.wall, 24), tone(map.palette.wall, -18));
    g.strokeStyle = 'rgba(7,9,13,.36)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(px, py + 10); g.lineTo(px + 32, py + 10); g.moveTo(px, py + 21); g.lineTo(px + 32, py + 21);
    g.moveTo(px + 8 + (y % 2) * 8, py); g.lineTo(px + 8 + (y % 2) * 8, py + 10);
    g.moveTo(px + 24 - (y % 2) * 8, py + 10); g.lineTo(px + 24 - (y % 2) * 8, py + 21); g.stroke();
    g.fillStyle = 'rgba(232,240,246,.07)'; g.fillRect(px + 2, py + 2, 28, 3);
    if (hash(x, y, 181) > .7) {
      g.strokeStyle = mapId === 'shrine' ? 'rgba(125,157,239,.52)' : 'rgba(67,95,58,.48)';
      g.beginPath(); g.moveTo(px + 6, py + 3); g.lineTo(px + 13, py + 13); g.lineTo(px + 9, py + 25); g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(px, py + 27, TILE, 5);
  }

  function drawStaticTile(g, mapId, char, x, y, foreground = false) {
    if (char === '#') {
      if (mapId === 'forest') foreground ? drawTreeCanopy(g, x, y) : drawForestTrunk(g, x, y);
      else if (mapId === 'village') drawVillageBuilding(g, mapId, x, y, foreground);
      else drawStoneWall(g, mapId, x, y, foreground);
      return;
    }
    if (foreground) return;
    if (char === '~') drawWaterBase(g, mapId, x, y);
    else if (char === '=') drawPath(g, mapId, x, y);
    else drawGround(g, mapId, x, y);
  }

  function drawProp(g, prop, mapId, foreground = false) {
    const [type, tx, ty] = prop; const x = tx * TILE + 16; const y = ty * TILE + 17;
    g.save(); g.translate(x, y);
    const shadow = (rx = 13, ry = 4, oy = 12) => { g.fillStyle = 'rgba(0,0,0,.34)'; g.beginPath(); g.ellipse(0, oy, rx, ry, 0, 0, TAU); g.fill(); };

    if (foreground && !['arch', 'towerBanner', 'portcullis'].includes(type)) { g.restore(); return; }
    if (!foreground && ['arch', 'towerBanner', 'portcullis'].includes(type)) { g.restore(); return; }

    if (type === 'lamp' || type === 'shrineLamp') {
      shadow(9, 3, 14); g.strokeStyle = '#2d251f'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 14); g.lineTo(0, -12); g.lineTo(7, -12); g.stroke();
      const glow = g.createRadialGradient(7, -7, 1, 7, -7, 20); glow.addColorStop(0, 'rgba(255,224,129,.8)'); glow.addColorStop(1, 'rgba(255,177,55,0)'); g.fillStyle = glow; g.beginPath(); g.arc(7, -7, 20, 0, TAU); g.fill();
      g.fillStyle = type === 'shrineLamp' ? '#a8d8ef' : '#f3c769'; g.fillRect(3, -13, 9, 10); g.strokeStyle = '#3c332c'; g.lineWidth = 1; g.strokeRect(3, -13, 9, 10);
    } else if (type === 'banner' || type === 'warBanner') {
      shadow(10, 3, 14); g.strokeStyle = '#33291f'; g.lineWidth = 3; g.beginPath(); g.moveTo(-6, 15); g.lineTo(-6, -21); g.stroke();
      g.fillStyle = type === 'warBanner' ? '#873f3c' : '#75548b'; path(g, [[-5, -19], [16, -16], [12, 3], [-5, 0]]); g.fill();
      g.fillStyle = '#d6b46e'; g.beginPath(); g.arc(3, -9, 4, 0, TAU); g.fill();
    } else if (type === 'towerBanner') {
      g.strokeStyle = '#30251f'; g.lineWidth = 4; g.beginPath(); g.moveTo(-7, 18); g.lineTo(-7, -27); g.stroke();
      g.fillStyle = '#894b3d'; path(g, [[-5, -24], [22, -20], [18, 4], [-5, 0]]); g.fill();
      g.fillStyle = '#e2c078'; path(g, [[4, -17], [11, -14], [8, -7], [2, -10]]); g.fill();
    } else if (type === 'wagon') {
      shadow(16, 5, 12); g.fillStyle = '#735039'; g.fillRect(-15, -5, 29, 13); g.fillStyle = '#936847'; g.fillRect(-12, -11, 24, 8); g.strokeStyle = '#2a211b'; g.lineWidth = 3; [-9, 9].forEach(cx => { g.beginPath(); g.arc(cx, 10, 6, 0, TAU); g.stroke(); });
    } else if (type === 'notice') {
      shadow(12, 3, 14); g.fillStyle = '#5b422f'; g.fillRect(-13, -11, 26, 20); g.strokeStyle = '#2e241e'; g.lineWidth = 3; g.beginPath(); g.moveTo(-9, 9); g.lineTo(-9, 17); g.moveTo(9, 9); g.lineTo(9, 17); g.stroke(); g.fillStyle = '#d7c39b'; g.fillRect(-8, -6, 16, 10); g.fillStyle = '#80684e'; g.fillRect(-5, -3, 10, 1); g.fillRect(-5, 1, 8, 1);
    } else if (type === 'well') {
      shadow(16, 5, 12); g.fillStyle = '#4d5058'; g.beginPath(); g.ellipse(0, 5, 15, 8, 0, 0, TAU); g.fill(); g.fillStyle = '#151c25'; g.beginPath(); g.ellipse(0, 3, 10, 5, 0, 0, TAU); g.fill(); g.strokeStyle = '#72553a'; g.lineWidth = 3; g.beginPath(); g.moveTo(-12, 3); g.lineTo(-12, -14); g.lineTo(12, -14); g.lineTo(12, 3); g.stroke();
    } else if (type === 'hay') {
      shadow(14, 4, 11); g.fillStyle = '#b58a45'; g.beginPath(); g.roundRect(-14, -7, 28, 16, 5); g.fill(); g.strokeStyle = '#d4aa5e'; for (let i = -10; i <= 10; i += 5) { g.beginPath(); g.moveTo(i, -5); g.lineTo(i + 5, 7); g.stroke(); }
    } else if (type === 'forge') {
      shadow(16, 5, 13); g.fillStyle = '#363238'; g.fillRect(-14, -8, 28, 20); const glow = g.createRadialGradient(0, 1, 1, 0, 1, 18); glow.addColorStop(0, 'rgba(255,174,72,.8)'); glow.addColorStop(1, 'rgba(255,92,37,0)'); g.fillStyle = glow; g.beginPath(); g.arc(0, 1, 18, 0, TAU); g.fill(); g.fillStyle = '#f4a34e'; g.fillRect(-8, -3, 16, 8); g.fillStyle = '#6f5540'; g.fillRect(-17, 9, 34, 5);
    } else if (type === 'moonstone') {
      const glow = g.createRadialGradient(0, -2, 1, 0, -2, 28); glow.addColorStop(0, 'rgba(202,237,255,.85)'); glow.addColorStop(1, 'rgba(105,151,231,0)'); g.fillStyle = glow; g.beginPath(); g.arc(0, -2, 28, 0, TAU); g.fill(); g.fillStyle = '#a7c2e3'; path(g, [[0, -22], [11, 7], [2, 17], [-10, 9]]); g.fill(); g.strokeStyle = '#d7efff'; g.beginPath(); g.moveTo(-2, -15); g.lineTo(4, 7); g.stroke();
    } else if (type === 'log') {
      shadow(19, 4, 9); g.rotate(-.32); fillGradient(g, -20, -6, 40, 12, '#704f34', '#4b3527', false); g.fillStyle = '#87a05d'; g.fillRect(-10, -7, 10, 3); g.fillStyle = '#2e211b'; g.beginPath(); g.arc(19, 0, 6, 0, TAU); g.fill();
    } else if (type === 'waystone' || type === 'runePillar' || type === 'brokenPillar') {
      shadow(10, 3, 14); const h = type === 'brokenPillar' ? 24 : 39; fillGradient(g, -7, -h + 14, 14, h, '#858b98', '#535865'); g.fillStyle = '#9aa1ae'; g.fillRect(-10, -h + 11, 20, 5); g.strokeStyle = type === 'waystone' ? '#8ed0b7' : '#93a9f1'; g.lineWidth = 2; g.beginPath(); g.moveTo(-3, -h + 20); g.lineTo(4, -h + 12); g.lineTo(1, -h + 3); g.stroke();
    } else if (type === 'mushrooms') {
      g.fillStyle = '#d5bcdf'; [-8, 0, 8].forEach((mx, index) => { g.fillRect(mx - 1, 5 - index * 2, 2, 7); g.beginPath(); g.arc(mx, 4 - index * 2, 4, Math.PI, TAU); g.fill(); });
    } else if (type === 'roots') {
      g.strokeStyle = '#5a4230'; g.lineWidth = 4; g.beginPath(); g.moveTo(-19, 10); g.quadraticCurveTo(-5, -5, 0, 10); g.quadraticCurveTo(8, -8, 19, 9); g.stroke();
    } else if (type === 'arch') {
      g.strokeStyle = '#59616c'; g.lineWidth = 8; g.beginPath(); g.moveTo(-15, 19); g.lineTo(-15, -4); g.arc(0, -4, 15, Math.PI, 0); g.lineTo(15, 19); g.stroke(); g.strokeStyle = 'rgba(155,183,225,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(0, -4, 10, Math.PI, 0); g.stroke();
    } else if (type === 'brazier') {
      shadow(11, 3, 14); g.fillStyle = '#483b31'; g.fillRect(-9, 3, 18, 6); g.fillRect(-2, 8, 4, 9); const flame = g.createRadialGradient(0, -2, 1, 0, -2, 22); flame.addColorStop(0, 'rgba(255,220,113,.8)'); flame.addColorStop(1, 'rgba(255,94,34,0)'); g.fillStyle = flame; g.beginPath(); g.arc(0, -2, 22, 0, TAU); g.fill(); g.fillStyle = '#f0a04b'; path(g, [[-8, 3], [-3, -14], [1, -2], [7, -11], [8, 3]]); g.fill();
    } else if (type === 'altar') {
      shadow(17, 4, 13); g.fillStyle = '#555a69'; path(g, [[-16, 8], [-11, -8], [11, -8], [16, 8]]); g.fill(); g.fillStyle = '#797f91'; g.fillRect(-13, -12, 26, 6); g.strokeStyle = '#8fa9ee'; g.beginPath(); g.arc(0, -3, 5, 0, TAU); g.stroke();
    } else if (type === 'chain') {
      g.strokeStyle = '#626876'; g.lineWidth = 2; for (let i = -13; i < 15; i += 5) { g.beginPath(); g.ellipse(i, i % 2 ? 2 : 0, 4, 2, .45, 0, TAU); g.stroke(); }
    } else if (type === 'brokenIdol') {
      shadow(15, 4, 12); g.fillStyle = '#5d626f'; path(g, [[-12, 8], [-8, -12], [0, -18], [8, -6], [13, 8]]); g.fill(); g.fillStyle = '#272b35'; g.fillRect(-5, -8, 3, 3); g.fillRect(3, -8, 3, 3);
    } else if (type === 'bones') {
      g.strokeStyle = '#d5c7a7'; g.lineWidth = 3; g.beginPath(); g.moveTo(-12, -5); g.lineTo(12, 8); g.moveTo(-10, 9); g.lineTo(10, -6); g.stroke(); [-12, 12].forEach(bx => { g.beginPath(); g.arc(bx, bx < 0 ? -5 : 8, 3, 0, TAU); g.stroke(); });
    } else if (type === 'barricade') {
      shadow(18, 4, 12); g.strokeStyle = '#62452f'; g.lineWidth = 5; g.beginPath(); g.moveTo(-18, -9); g.lineTo(18, 10); g.moveTo(-18, 10); g.lineTo(18, -9); g.stroke();
    } else if (type === 'portcullis') {
      g.strokeStyle = '#34363d'; g.lineWidth = 4; for (let i = -16; i <= 16; i += 8) { g.beginPath(); g.moveTo(i, -28); g.lineTo(i, 18); g.stroke(); } g.lineWidth = 3; [-18, -3, 12].forEach(gy => { g.beginPath(); g.moveTo(-20, gy); g.lineTo(20, gy); g.stroke(); });
    } else if (type === 'statue') {
      shadow(12, 4, 14); g.fillStyle = '#656975'; g.fillRect(-10, 8, 20, 7); path(g, [[-8, 8], [-6, -12], [0, -20], [7, -11], [8, 8]]); g.fill(); g.fillStyle = '#252833'; g.fillRect(-5, -10, 3, 2); g.fillRect(2, -10, 3, 2);
    } else if (type === 'embers') {
      g.fillStyle = '#f2a052'; for (let i = 0; i < 8; i += 1) { g.beginPath(); g.arc(-18 + i * 5, 6 - (i % 3) * 3, 1.2, 0, TAU); g.fill(); }
    }
    g.restore();
  }

  function buildLayers(mapId) {
    const ground = document.createElement('canvas'); ground.width = WIDTH; ground.height = HEIGHT;
    const foreground = document.createElement('canvas'); foreground.width = WIDTH; foreground.height = HEIGHT;
    const gg = ground.getContext('2d'); const fg = foreground.getContext('2d'); const map = MAPS[mapId];
    map.grid.forEach((row, y) => [...row].forEach((char, x) => {
      drawStaticTile(gg, mapId, char, x, y, false);
      drawStaticTile(fg, mapId, char, x, y, true);
    }));
    (MAP_PROPS[mapId] || []).forEach(prop => { drawProp(gg, prop, mapId, false); drawProp(fg, prop, mapId, true); });
    return { ground, foreground };
  }

  function layers(mapId) {
    if (!cache.has(mapId)) cache.set(mapId, buildLayers(mapId));
    return cache.get(mapId);
  }

  function animateWater(mapId) {
    const map = MAPS[mapId]; const t = frameTime * .0022;
    map.grid.forEach((row, y) => [...row].forEach((char, x) => {
      if (char !== '~') return;
      const px = x * TILE; const py = y * TILE;
      ctx.strokeStyle = 'rgba(205,241,244,.28)'; ctx.lineWidth = 1;
      for (let i = 0; i < 2; i += 1) {
        const yy = 8 + i * 13 + Math.sin(t + x * .76 + y + i) * 2;
        ctx.beginPath(); ctx.moveTo(px + 3, py + yy); ctx.bezierCurveTo(px + 10, py + yy - 3, px + 19, py + yy + 3, px + 29, py + yy); ctx.stroke();
      }
    }));
  }

  function appearance(hero) {
    if (hero?.appearance) return hero.appearance;
    if (state?.party?.[0] === hero && state?.protagonist) return state.protagonist;
    const defaults = {
      kael: { skin: '#d8aa82', hair: '#332424', eyes: '#6e9fc4', hairStyle: 'short', body: 'broad', accent: hero?.color || '#b65755', classId: 'ashblade' },
      lyra: { skin: '#f1cfb2', hair: '#d8d9e5', eyes: '#9f6fb2', hairStyle: 'long', body: 'lean', accent: hero?.color || '#557bb9', classId: 'mooncantor' },
      rowan: { skin: '#aa7558', hair: '#231d24', eyes: '#7db887', hairStyle: 'short', body: 'athletic', accent: hero?.color || '#5a9268', classId: 'thornranger' },
      mira: { skin: '#d8aa82', hair: '#65402f', eyes: '#b78e4d', hairStyle: 'braid', body: 'athletic', accent: hero?.color || '#9b75b8', classId: 'wardseeker' }
    };
    return defaults[hero?.id] || { skin: '#d8aa82', hair: '#3a2825', eyes: '#6e9fc4', hairStyle: 'short', body: 'athletic', accent: hero?.color || '#8c7a68', classId: 'ashblade' };
  }

  function classFor(hero, a) {
    return a.classId || (hero?.id === 'lyra' ? 'mooncantor' : hero?.id === 'rowan' ? 'thornranger' : hero?.id === 'mira' ? 'wardseeker' : 'ashblade');
  }

  function drawHair(g, a, facing) {
    g.fillStyle = a.hair || '#2b2023';
    if (a.hairStyle === 'shaved') { g.beginPath(); g.arc(0, -21, 8.7, Math.PI, TAU); g.fill(); return; }
    if (facing === 'up') {
      g.beginPath(); g.arc(0, -21, 9.7, 0, TAU); g.fill();
    } else {
      g.beginPath(); g.arc(0, -23, 10, Math.PI, TAU); g.lineTo(9, -19); g.quadraticCurveTo(3, -27, -2, -22); g.quadraticCurveTo(-6, -18, -10, -19); g.closePath(); g.fill();
    }
    if (a.hairStyle === 'long') { g.fillRect(-10, -21, 5, 23); g.fillRect(5, -21, 5, 23); }
    if (a.hairStyle === 'braid') { g.strokeStyle = a.hair; g.lineWidth = 4; g.beginPath(); g.moveTo(8, -19); g.quadraticCurveTo(14, -5, 9, 10); g.stroke(); g.fillStyle = '#c29a51'; g.fillRect(7, 8, 4, 4); }
  }

  function drawClassGear(g, classId, accent, facing, walk) {
    const side = facing === 'left' ? -1 : 1;
    if (classId === 'ashblade') {
      g.fillStyle = '#606a76'; path(g, [[-11, -9], [-17, -4], [-12, 2], [-6, -5]]); g.fill();
      g.strokeStyle = '#dce5e8'; g.lineWidth = 3; g.beginPath(); g.moveTo(side * 10, -7); g.lineTo(side * 19, 15 + walk); g.stroke();
      g.strokeStyle = '#a47a42'; g.lineWidth = 4; g.beginPath(); g.moveTo(side * 10, 5); g.lineTo(side * 17, 2); g.stroke();
      g.fillStyle = rgba(accent, .45); path(g, [[-8, 5], [-15, 19], [-6, 14]]); g.fill();
    } else if (classId === 'mooncantor') {
      g.strokeStyle = '#74583a'; g.lineWidth = 3; g.beginPath(); g.moveTo(side * 12, -10); g.lineTo(side * 17, 20); g.stroke();
      const orb = g.createRadialGradient(side * 11, -15, 1, side * 11, -15, 10); orb.addColorStop(0, '#edfaff'); orb.addColorStop(.45, '#9ed3ef'); orb.addColorStop(1, 'rgba(120,180,235,0)'); g.fillStyle = orb; g.beginPath(); g.arc(side * 11, -15, 10, 0, TAU); g.fill();
      g.strokeStyle = '#d5efff'; g.lineWidth = 2; g.beginPath(); g.arc(side * 11, -15, 5, -.8, 2.3); g.stroke();
      g.fillStyle = rgba(accent, .35); path(g, [[-10, 2], [-14, 20], [0, 14], [14, 20], [10, 2]]); g.fill();
    } else if (classId === 'thornranger') {
      g.strokeStyle = '#a77947'; g.lineWidth = 2; g.beginPath(); g.arc(side * 12, 0, 14, -1.2, 1.2); g.stroke(); g.strokeStyle = '#e1cfaa'; g.beginPath(); g.moveTo(side * 16, -13); g.lineTo(side * 16, 13); g.stroke();
      g.fillStyle = '#5f4732'; g.fillRect(-9, -5, 5, 19); g.strokeStyle = '#d8c7a4'; g.lineWidth = 1; for (let i = 0; i < 3; i += 1) { g.beginPath(); g.moveTo(-7, -4 + i * 5); g.lineTo(-12, -11 + i * 4); g.stroke(); }
      g.fillStyle = rgba(accent, .35); path(g, [[-11, -8], [0, -14], [11, -8], [8, 7], [-8, 7]]); g.fill();
    } else {
      g.strokeStyle = '#d1dde2'; g.lineWidth = 3; g.beginPath(); g.moveTo(side * 11, -12); g.lineTo(side * 19, 20); g.stroke();
      g.fillStyle = accent; path(g, [[side * 8, -18], [side * 17, -14], [side * 12, -6]]); g.fill();
      g.strokeStyle = rgba(accent, .6); g.lineWidth = 2; g.beginPath(); g.arc(0, 1, 13, 0, TAU); g.stroke();
    }
  }

  function drawHeroFigure(g, hero, cx, cy, scale = 1, facing = 'down', preview = false) {
    const a = appearance(hero); const classId = classFor(hero, a); const accent = a.accent || hero?.color || '#b65755';
    const bodyWidth = a.body === 'broad' ? 11.8 : a.body === 'lean' ? 8.7 : 10.2;
    const moving = !preview && mode === 'world'; const walk = moving ? Math.sin(frameTime * .012 + cx * .03 + cy * .02) * 2.1 : 0;
    const bob = moving ? Math.abs(Math.sin(frameTime * .012 + cx * .03)) * .9 : 0;
    const side = facing === 'left' ? -1 : 1;
    g.save(); g.translate(cx, cy - 4 + bob); g.scale(scale, scale);

    g.fillStyle = 'rgba(0,0,0,.44)'; g.beginPath(); g.ellipse(0, 21, 14, 5, 0, 0, TAU); g.fill();
    g.strokeStyle = '#171923'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-4, 8); g.lineTo(-5 - walk, 20); g.moveTo(4, 8); g.lineTo(5 + walk, 20); g.stroke();
    g.strokeStyle = '#332a25'; g.lineWidth = 4; g.beginPath(); g.moveTo(-6 - walk, 20); g.lineTo(-11 - walk, 20); g.moveTo(6 + walk, 20); g.lineTo(11 + walk, 20); g.stroke();

    const cloth = g.createLinearGradient(0, -10, 0, 15); cloth.addColorStop(0, tone(accent, 24)); cloth.addColorStop(.5, accent); cloth.addColorStop(1, tone(accent, -28));
    g.fillStyle = cloth; g.strokeStyle = '#171923'; g.lineWidth = 2;
    path(g, [[-bodyWidth, -9], [-bodyWidth - 3, 3], [-bodyWidth + 1, 14], [bodyWidth - 1, 14], [bodyWidth + 3, 3], [bodyWidth, -9]]); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(-bodyWidth + 2, -6, bodyWidth * 2 - 4, 3);
    g.fillStyle = '#b79049'; g.fillRect(-bodyWidth, 6, bodyWidth * 2, 3);
    g.fillStyle = '#332a24'; g.fillRect(-2, 5, 4, 5);

    g.strokeStyle = '#171923'; g.lineWidth = 4; g.beginPath();
    if (facing === 'left' || facing === 'right') { g.moveTo(side * 7, -5); g.lineTo(side * 13, 7 + walk * .4); g.moveTo(-side * 7, -5); g.lineTo(-side * 9, 8 - walk * .4); }
    else { g.moveTo(-7, -5); g.lineTo(-10 - walk * .4, 8); g.moveTo(7, -5); g.lineTo(10 + walk * .4, 8); }
    g.stroke();

    g.fillStyle = a.skin || '#d8aa82'; g.strokeStyle = '#171923'; g.lineWidth = 1.7; g.beginPath(); g.arc(0, -20, 9, 0, TAU); g.fill(); g.stroke();
    drawHair(g, a, facing);
    if (facing !== 'up') {
      const shift = facing === 'left' ? -2.5 : facing === 'right' ? 2.5 : 0;
      g.fillStyle = a.eyes || '#6e9fc4'; g.fillRect(-4 + shift, -20, 2.2, 1.8); g.fillRect(1.8 + shift, -20, 2.2, 1.8);
      g.fillStyle = 'rgba(86,47,42,.45)'; g.fillRect(-1, -16, 2, 1);
    }
    drawClassGear(g, classId, accent, facing, walk);

    if (preview) {
      g.strokeStyle = rgba(accent, .48); g.lineWidth = 1; g.beginPath(); g.arc(0, -2, 31, 0, TAU); g.stroke();
    }
    g.restore();
  }

  function drawNpc(npc) {
    const palette = ['#8c6852', '#5e7187', '#7d5e7d', '#6f7d58'];
    const hero = { id: 'npc', color: npc.color, appearance: { skin: hash(npc.x, npc.y, 1) > .5 ? '#d8aa82' : '#aa7558', hair: hash(npc.x, npc.y, 2) > .5 ? '#3a2825' : '#7b5134', eyes: '#5f493c', hairStyle: hash(npc.x, npc.y, 3) > .64 ? 'long' : 'short', body: hash(npc.x, npc.y, 4) > .72 ? 'broad' : 'athletic', accent: npc.color || palette[Math.floor(hash(npc.x, npc.y, 5) * palette.length)], classId: npc.id === 'smith' ? 'ashblade' : npc.id === 'mira' ? 'wardseeker' : 'mooncantor' } };
    drawHeroFigure(ctx, hero, npc.x * TILE + 16, npc.y * TILE + 20, .83, 'down');
  }

  function enemyShadow(rx, ry = 5, y = 13) { ctx.fillStyle = 'rgba(0,0,0,.43)'; ctx.beginPath(); ctx.ellipse(0, y, rx, ry, 0, 0, TAU); ctx.fill(); }

  function drawSpeciesEnemy(encounter) {
    const key = encounter.enemies[0]; const type = ENEMIES[key]; const boss = Boolean(encounter.boss);
    const cx = encounter.x * TILE + 16; const cy = encounter.y * TILE + 18;
    const pulse = 1 + Math.sin(frameTime * .0045 + encounter.x) * .035;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse * (boss ? 1.08 : 1), pulse * (boss ? 1.08 : 1));
    ctx.strokeStyle = '#151720'; ctx.lineWidth = 2;

    if (key === 'gloomRat') {
      enemyShadow(15); ctx.fillStyle = type.color; ctx.beginPath(); ctx.ellipse(0, 4, 14, 8, -.08, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-9, -5, 5, 0, TAU); ctx.arc(8, -5, 5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e4b0a6'; ctx.beginPath(); ctx.arc(13, 2, 2.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#be9a8d'; ctx.beginPath(); ctx.moveTo(12, 6); ctx.quadraticCurveTo(26, 4, 22, 16); ctx.stroke();
      ctx.fillStyle = '#ffe7b3'; ctx.fillRect(-6, -3, 3, 3); ctx.fillRect(3, -3, 3, 3);
    } else if (key === 'ashHusk') {
      enemyShadow(13); const grad = ctx.createLinearGradient(0, -18, 0, 14); grad.addColorStop(0, tone(type.color, 15)); grad.addColorStop(1, tone(type.color, -24)); ctx.fillStyle = grad;
      path(ctx, [[-11, 12], [-9, -8], [-4, -17], [3, -14], [10, -4], [12, 13], [4, 9], [0, 15], [-5, 9]]); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d77a4d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -9); ctx.lineTo(3, -2); ctx.lineTo(-2, 7); ctx.stroke(); ctx.fillStyle = '#f0a05a'; ctx.fillRect(-6, -6, 3, 3); ctx.fillRect(3, -6, 3, 3);
    } else if (key === 'moonWisp') {
      enemyShadow(11, 3, 15); const glow = ctx.createRadialGradient(0, -1, 2, 0, -1, 24); glow.addColorStop(0, '#eefcff'); glow.addColorStop(.38, rgba(type.color, .8)); glow.addColorStop(1, rgba(type.color, 0)); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, -1, 24, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d7f3ff'; ctx.beginPath(); ctx.arc(0, -4, 8, 0, TAU); ctx.fill(); ctx.strokeStyle = '#b7dff4'; ctx.beginPath(); ctx.moveTo(-4, 3); ctx.quadraticCurveTo(-10, 13, -3, 18); ctx.moveTo(3, 3); ctx.quadraticCurveTo(10, 13, 4, 18); ctx.stroke();
      ctx.fillStyle = '#647ea2'; ctx.fillRect(-4, -6, 2, 2); ctx.fillRect(2, -6, 2, 2);
    } else if (key === 'briarWolf') {
      enemyShadow(17); ctx.fillStyle = type.color; path(ctx, [[-16, 9], [-13, -4], [-5, -10], [7, -9], [15, -2], [16, 10], [9, 13], [5, 6], [-4, 13], [-10, 7]]); ctx.fill(); ctx.stroke();
      path(ctx, [[-9, -7], [-5, -18], [0, -9], [6, -18], [10, -6]]); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#6c8b52'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-20, -7); ctx.moveTo(11, 0); ctx.lineTo(20, -5); ctx.stroke(); ctx.fillStyle = '#f2d57b'; ctx.fillRect(-5, -7, 3, 2); ctx.fillRect(3, -7, 3, 2);
    } else if (key === 'brokenSentinel' || key === 'ironWarden') {
      enemyShadow(boss ? 22 : 17, 6, 15); const grad = ctx.createLinearGradient(0, -23, 0, 16); grad.addColorStop(0, tone(type.color, 22)); grad.addColorStop(1, tone(type.color, -24)); ctx.fillStyle = grad;
      path(ctx, [[-15, 14], [-13, -11], [-6, -23], [7, -22], [15, -9], [16, 15]]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#252832'; ctx.fillRect(-10, -14, 20, 8); ctx.fillStyle = '#f5b86b'; ctx.fillRect(-6, -11, 3, 2); ctx.fillRect(3, -11, 3, 2);
      ctx.fillStyle = '#5a606b'; path(ctx, [[-16, -1], [-25, 6], [-19, 15], [-12, 9]]); ctx.fill(); ctx.stroke();
      if (boss) { const aura = ctx.createRadialGradient(0, -3, 16, 0, -3, 31); aura.addColorStop(0, 'rgba(215,132,79,0)'); aura.addColorStop(1, 'rgba(215,132,79,.32)'); ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, -3, 31, 0, TAU); ctx.fill(); }
    } else if (key === 'roadReaver') {
      enemyShadow(15); ctx.fillStyle = type.color; path(ctx, [[-11, 13], [-10, -8], [0, -17], [10, -8], [12, 13], [4, 9], [0, 15], [-5, 9]]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#372a2b'; path(ctx, [[-10, -8], [0, -20], [11, -8], [7, -2], [-7, -2]]); ctx.fill(); ctx.fillStyle = '#f0d4a6'; ctx.fillRect(-5, -6, 3, 2); ctx.fillRect(3, -6, 3, 2);
      ctx.strokeStyle = '#d7dfe2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(9, -5); ctx.lineTo(18, 14); ctx.stroke();
    } else if (key === 'mireDrake') {
      enemyShadow(19); ctx.fillStyle = type.color; ctx.beginPath(); ctx.ellipse(0, 4, 18, 10, -.1, 0, TAU); ctx.fill(); ctx.stroke();
      path(ctx, [[-8, -4], [-3, -17], [3, -7], [9, -16], [13, -3]]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7d9d73'; path(ctx, [[-12, 4], [-24, -5], [-18, 9]]); ctx.fill(); path(ctx, [[12, 4], [24, -5], [18, 9]]); ctx.fill();
      ctx.strokeStyle = '#5c704f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(15, 6); ctx.quadraticCurveTo(27, 10, 23, 19); ctx.stroke(); ctx.fillStyle = '#e5d47d'; ctx.fillRect(-5, -7, 3, 2); ctx.fillRect(3, -7, 3, 2);
    } else {
      enemyShadow(boss ? 22 : 16); const grad = ctx.createLinearGradient(0, -24, 0, 15); grad.addColorStop(0, tone(type.color, 21)); grad.addColorStop(1, tone(type.color, -30)); ctx.fillStyle = grad;
      path(ctx, [[0, boss ? -25 : -18], [boss ? 18 : 14, -9], [boss ? 15 : 11, 14], [5, 9], [0, 16], [-6, 9], [boss ? -15 : -11, 14], [boss ? -18 : -14, -9]]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = boss ? '#f2d4ff' : '#ffe5b0'; ctx.fillRect(-7, -5, 3, 3); ctx.fillRect(4, -5, 3, 3);
      if (boss) { ctx.strokeStyle = '#c98bee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -3, 26, 0, TAU); ctx.stroke(); ctx.fillStyle = '#b783d4'; path(ctx, [[-13, -15], [-8, -29], [-2, -18], [5, -29], [12, -15]]); ctx.fill(); }
    }
    ctx.restore();
  }

  function drawInteractableV3(item) {
    if (!state || state.collected.includes(item.id)) return;
    const x = item.x * TILE + 16; const y = item.y * TILE + 18; ctx.save(); ctx.translate(x, y);
    if (item.type === 'shard') {
      const bob = Math.sin(frameTime * .005 + item.x) * 3; const glow = ctx.createRadialGradient(0, bob, 2, 0, bob, 25); glow.addColorStop(0, 'rgba(224,251,255,.95)'); glow.addColorStop(1, 'rgba(93,178,255,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, bob, 25, 0, TAU); ctx.fill();
      const grad = ctx.createLinearGradient(-8, -15 + bob, 9, 15 + bob); grad.addColorStop(0, '#f2fdff'); grad.addColorStop(.5, '#9ed9ef'); grad.addColorStop(1, '#6ea7db'); ctx.fillStyle = grad; path(ctx, [[0, -16 + bob], [9, bob], [0, 16 + bob], [-9, bob]]); ctx.fill(); ctx.strokeStyle = '#d9f7ff'; ctx.stroke();
    } else if (item.type === 'chest') {
      ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(0, 12, 15, 4, 0, 0, TAU); ctx.fill(); fillGradient(ctx, -13, -6, 26, 18, '#865737', '#57351f'); ctx.fillStyle = '#c59a4c'; ctx.fillRect(-13, -2, 26, 3); ctx.fillRect(-2, -6, 4, 18); ctx.fillStyle = '#f0d075'; ctx.fillRect(-2, 3, 4, 5); ctx.strokeStyle = '#2c2018'; ctx.strokeRect(-13, -6, 26, 18);
    } else if (item.type === 'heal') {
      const glow = ctx.createRadialGradient(0, 4, 2, 0, 4, 26); glow.addColorStop(0, 'rgba(193,255,235,.92)'); glow.addColorStop(1, 'rgba(70,217,183,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 4, 26, 0, TAU); ctx.fill(); ctx.fillStyle = '#78dcbf'; ctx.beginPath(); ctx.ellipse(0, 10, 15, 7, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#dffff5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 4, 9, 0, TAU); ctx.stroke(); ctx.fillStyle = '#ecfff8'; ctx.fillRect(-2, -9, 4, 18);
    }
    ctx.restore();
  }

  function drawAtmosphere(mapId) {
    const t = frameTime * .001;
    if (mapId === 'forest') {
      for (let i = 0; i < 22; i += 1) { const x = (i * 79 + frameTime * .011) % WIDTH; const y = 50 + ((i * 43 + Math.sin(t + i) * 31) % 420); ctx.fillStyle = i % 3 ? 'rgba(180,219,255,.18)' : 'rgba(216,196,255,.2)'; ctx.beginPath(); ctx.arc(x, y, i % 4 === 0 ? 1.6 : 1, 0, TAU); ctx.fill(); }
    } else if (mapId === 'shrine') {
      for (let i = 0; i < 14; i += 1) { const x = (i * 97 + Math.sin(t + i) * 18) % WIDTH; const y = HEIGHT - ((frameTime * .015 + i * 43) % HEIGHT); ctx.fillStyle = 'rgba(124,151,235,.12)'; ctx.fillRect(x, y, 2, 8); }
    } else if (mapId === 'gate') {
      for (let i = 0; i < 18; i += 1) { const x = 350 + ((i * 41 + frameTime * .018) % 280); const y = 420 - ((i * 29 + frameTime * .024) % 180); ctx.fillStyle = 'rgba(245,137,68,.22)'; ctx.beginPath(); ctx.arc(x, y, 1.2, 0, TAU); ctx.fill(); }
    }
    const px = (state?.x ?? 15) * TILE + 16; const py = (state?.y ?? 9) * TILE + 16;
    const light = ctx.createRadialGradient(px, py, 50, px, py, 440); light.addColorStop(0, 'rgba(255,239,199,0)'); light.addColorStop(.58, 'rgba(12,17,26,.035)'); light.addColorStop(1, 'rgba(3,6,12,.31)'); ctx.fillStyle = light; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 180, WIDTH / 2, HEIGHT / 2, 575); vignette.addColorStop(.56, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,.33)'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function drawPortrait(canvas, hero) {
    if (!canvas || !hero) return;
    const g = canvas.getContext('2d'); const w = canvas.width; const h = canvas.height; const a = appearance(hero); const accent = a.accent || hero.color || '#8c6b5b';
    g.clearRect(0, 0, w, h); const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, tone(accent, -8)); bg.addColorStop(1, '#101521'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.08)'; path(g, [[0, h], [w, h * .48], [w, h]]); g.fill();
    g.save(); g.translate(w / 2, h * .72); g.scale(1.35, 1.35); drawHeroFigure(g, hero, 0, 0, 1, 'down', true); g.restore();
    g.strokeStyle = rgba(accent, .72); g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  }

  function drawHudPortraits() {
    document.querySelectorAll('canvas.hero-portrait[data-hero-index]').forEach(canvas => {
      const hero = state?.party?.[Number(canvas.dataset.heroIndex)]; if (hero) drawPortrait(canvas, hero);
    });
  }

  drawCharacter = function v3Character(x, y, color, scale = 1, facing = 'down') {
    drawHeroFigure(ctx, { id: 'npc', color, appearance: { skin: '#d8aa82', hair: '#3a2825', eyes: '#6e9fc4', hairStyle: 'short', body: 'athletic', accent: color, classId: 'ashblade' } }, x * TILE + 16, y * TILE + 20, scale, facing);
  };
  drawEnemy = drawSpeciesEnemy;
  drawInteractable = drawInteractableV3;

  drawWorld = function vectorArtWorld(timestamp = 0) {
    frameTime = timestamp;
    const mapId = state?.map || 'village'; const scene = layers(mapId);
    ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.drawImage(scene.ground, 0, 0); animateWater(mapId);
    if (state) {
      visibleInteractables().forEach(drawInteractableV3);
      availableEncounters().forEach(drawSpeciesEnemy);
      visibleNpcs().forEach(drawNpc);
      state.party.slice(1, 4).forEach((hero, index) => {
        const pos = trail[(index + 1) * 2 - 1];
        if (pos && (pos.x !== state.x || pos.y !== state.y)) drawHeroFigure(ctx, hero, pos.x * TILE + 16, pos.y * TILE + 20, .82, pos.facing || state.facing);
      });
      drawHeroFigure(ctx, state.party[0], state.x * TILE + 16, state.y * TILE + 20, 1.04, state.facing);
    }
    ctx.drawImage(scene.foreground, 0, 0); drawAtmosphere(mapId); requestAnimationFrame(drawWorld);
  };

  window.AshenArt = {
    drawHeroFigure,
    drawPortrait,
    drawHudPortraits,
    invalidateMapArt() { cache.clear(); },
    drawCreatorPreview(canvas, draft, classDef) {
      if (!canvas) return;
      const g = canvas.getContext('2d'); const w = canvas.width; const h = canvas.height; const accent = draft.accent || classDef.color;
      g.clearRect(0, 0, w, h);
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#18243a'); sky.addColorStop(.48, tone(accent, -34)); sky.addColorStop(1, '#080c14'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      const moon = g.createRadialGradient(w * .72, h * .22, 2, w * .72, h * .22, 55); moon.addColorStop(0, 'rgba(234,247,255,.9)'); moon.addColorStop(.26, 'rgba(169,205,239,.32)'); moon.addColorStop(1, 'rgba(110,150,218,0)'); g.fillStyle = moon; g.beginPath(); g.arc(w * .72, h * .22, 55, 0, TAU); g.fill();
      g.fillStyle = 'rgba(9,14,22,.72)'; path(g, [[0, h * .72], [w * .18, h * .57], [w * .32, h * .69], [w * .54, h * .53], [w * .75, h * .66], [w, h * .48], [w, h], [0, h]]); g.fill();
      g.strokeStyle = 'rgba(242,212,158,.18)'; g.lineWidth = 2; for (let r = 50; r < 175; r += 34) { g.beginPath(); g.arc(w / 2, h * .58, r, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,.48)'; g.beginPath(); g.ellipse(w / 2, h - 34, 86, 18, 0, 0, TAU); g.fill();
      const hero = { id: classDef.baseId, color: accent, appearance: { ...draft } }; drawHeroFigure(g, hero, w / 2, h * .65, 4.25, 'down', true);
      g.fillStyle = 'rgba(7,11,18,.82)'; g.fillRect(17, h - 62, w - 34, 36); g.strokeStyle = rgba(accent, .72); g.strokeRect(17, h - 62, w - 34, 36); g.fillStyle = '#f2d49e'; g.textAlign = 'center'; g.font = '700 15px Georgia'; g.fillText(`${classDef.name.toUpperCase()} · ${classDef.weapon.toUpperCase()}`, w / 2, h - 40);
    }
  };
})();
