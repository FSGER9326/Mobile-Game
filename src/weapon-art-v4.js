/* Ashen Crown weapon art v4: high-detail hand-authored weapon overlays and Southroad presentation. */
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const baseDrawWorld = drawWorld;
  const basePreview = window.AshenArt?.drawCreatorPreview;

  function path(g, points, close = true) {
    g.beginPath();
    points.forEach(([x, y], index) => index ? g.lineTo(x, y) : g.moveTo(x, y));
    if (close) g.closePath();
  }

  function rgba(hex, alpha) {
    const raw = String(hex || '#888888').replace('#', '');
    const full = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw.padEnd(6, '8').slice(0, 6);
    const value = Number.parseInt(full, 16);
    return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
  }

  function classId(hero) {
    return hero?.appearance?.classId || (state?.party?.[0] === hero ? state?.protagonist?.classId : null) || (hero?.id === 'lyra' ? 'mooncantor' : hero?.id === 'rowan' ? 'thornranger' : hero?.id === 'mira' ? 'wardseeker' : 'ashblade');
  }

  function accent(hero) {
    return hero?.appearance?.accent || hero?.color || '#b65755';
  }

  function orient(g, facing) {
    if (facing === 'left') g.scale(-1, 1);
    if (facing === 'up') g.rotate(Math.PI * .08);
    if (facing === 'right') g.rotate(-Math.PI * .04);
  }

  function drawAshblade(g, hero, facing) {
    const level = Math.max(0, hero?.weaponLevel || state?.upgrades?.weapon || 0);
    const color = accent(hero);
    g.save(); orient(g, facing);
    g.translate(11, -5);
    g.rotate(-.36);
    g.shadowColor = level ? rgba(color, .72) : 'rgba(0,0,0,.42)';
    g.shadowBlur = 3 + level * 1.7;
    const blade = g.createLinearGradient(-4, -24, 5, 19);
    blade.addColorStop(0, '#f4fbff'); blade.addColorStop(.32, '#bfcbd1'); blade.addColorStop(.58, '#eef5f5'); blade.addColorStop(1, '#65717b');
    g.fillStyle = blade; g.strokeStyle = '#202630'; g.lineWidth = 1.1;
    path(g, [[-3, -25], [2, -30], [5, 15], [1, 21], [-2, 15]]); g.fill(); g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,.58)'; g.lineWidth = .8; g.beginPath(); g.moveTo(0, -25); g.lineTo(2, 14); g.stroke();
    g.strokeStyle = rgba(color, .75); g.lineWidth = 1.2;
    for (let i = 0; i < Math.min(5, level + 1); i += 1) { const y = -16 + i * 7; g.beginPath(); g.moveTo(-1, y); g.lineTo(2, y + 3); g.lineTo(0, y + 5); g.stroke(); }
    const guard = g.createLinearGradient(-12, 16, 12, 16);
    guard.addColorStop(0, '#6a4729'); guard.addColorStop(.5, '#e0b56c'); guard.addColorStop(1, '#5b3c25');
    g.fillStyle = guard; g.strokeStyle = '#332217'; g.lineWidth = 1;
    path(g, [[-13, 14], [-4, 11], [0, 14], [5, 11], [14, 14], [5, 18], [-5, 18]]); g.fill(); g.stroke();
    g.fillStyle = '#513624'; g.fillRect(-2.5, 18, 5, 15);
    g.strokeStyle = '#c69755'; for (let y = 19; y < 31; y += 3) { g.beginPath(); g.moveTo(-2, y); g.lineTo(2, y + 2); g.stroke(); }
    g.fillStyle = color; g.beginPath(); g.arc(0, 35, 4.2, 0, TAU); g.fill(); g.strokeStyle = '#3a2720'; g.stroke();
    g.restore();
  }

  function drawMoonStaff(g, hero, facing) {
    const level = Math.max(0, hero?.weaponLevel || state?.upgrades?.weapon || 0);
    const color = accent(hero);
    g.save(); orient(g, facing); g.translate(10, -4); g.rotate(-.18);
    const shaft = g.createLinearGradient(-2, -4, 3, 32);
    shaft.addColorStop(0, '#b68a51'); shaft.addColorStop(.35, '#6b4a31'); shaft.addColorStop(1, '#2e2523');
    g.strokeStyle = shaft; g.lineWidth = 4.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -9); g.lineTo(4, 32); g.stroke();
    g.strokeStyle = '#d6af6c'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, -7); g.lineTo(3, 30); g.stroke();
    g.translate(0, -13); g.strokeStyle = '#dcecf5'; g.lineWidth = 2.2;
    g.beginPath(); g.arc(0, 0, 11, -.9, 1.55); g.stroke(); g.beginPath(); g.arc(3, -1, 8, 2.1, 4.55); g.stroke();
    const glow = g.createRadialGradient(2, 0, 1, 2, 0, 13 + level * 1.8);
    glow.addColorStop(0, '#ffffff'); glow.addColorStop(.25, '#b9e7ff'); glow.addColorStop(.62, rgba(color, .62)); glow.addColorStop(1, rgba(color, 0));
    g.fillStyle = glow; g.beginPath(); g.arc(2, 0, 13 + level, 0, TAU); g.fill();
    g.fillStyle = '#dff6ff'; path(g, [[2, -6], [7, 0], [2, 7], [-3, 0]]); g.fill(); g.strokeStyle = '#8fc8ea'; g.stroke();
    g.restore();
  }

  function drawThornBow(g, hero, facing) {
    const level = Math.max(0, hero?.weaponLevel || state?.upgrades?.weapon || 0);
    const color = accent(hero);
    g.save(); orient(g, facing); g.translate(10, -3); g.rotate(-.08);
    g.strokeStyle = '#3c291d'; g.lineWidth = 4.5; g.beginPath(); g.bezierCurveTo(-3, -18, 14, -12, 9, 1); g.bezierCurveTo(14, 14, -3, 21, 0, 31); g.stroke();
    g.strokeStyle = '#b57a3d'; g.lineWidth = 2.2; g.beginPath(); g.bezierCurveTo(-2, -18, 12, -11, 8, 1); g.bezierCurveTo(12, 14, -2, 20, 1, 31); g.stroke();
    g.strokeStyle = '#e7dcc6'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, -18); g.lineTo(1, 31); g.stroke();
    g.strokeStyle = '#d8e2df'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 5); g.lineTo(-15, 4); g.stroke();
    g.fillStyle = '#d9e4e5'; path(g, [[-16, 4], [-11, 1], [-11, 7]]); g.fill();
    g.fillStyle = color; g.fillRect(-4, 2, 5 + level, 3);
    g.strokeStyle = rgba(color, .68); for (let i = 0; i < Math.min(4, level); i += 1) { g.beginPath(); g.arc(5, 5 + i * 6, 3, -.8, .8); g.stroke(); }
    g.restore();
  }

  function drawWardGlaive(g, hero, facing) {
    const level = Math.max(0, hero?.weaponLevel || state?.upgrades?.weapon || 0);
    const color = accent(hero);
    g.save(); orient(g, facing); g.translate(9, -3); g.rotate(-.22);
    const shaft = g.createLinearGradient(-2, 0, 3, 38);
    shaft.addColorStop(0, '#cdd9dc'); shaft.addColorStop(.5, '#687980'); shaft.addColorStop(1, '#263239');
    g.strokeStyle = shaft; g.lineWidth = 3.4; g.beginPath(); g.moveTo(0, -15); g.lineTo(5, 34); g.stroke();
    const blade = g.createLinearGradient(-7, -27, 12, -7);
    blade.addColorStop(0, '#f4fbff'); blade.addColorStop(.46, '#a8bbc3'); blade.addColorStop(1, '#536771');
    g.fillStyle = blade; g.strokeStyle = '#252e37'; g.lineWidth = 1;
    path(g, [[0, -16], [5, -31], [13, -25], [8, -13], [2, -7]]); g.fill(); g.stroke();
    g.fillStyle = color; path(g, [[4, -24], [8, -25], [7, -18], [3, -15]]); g.fill();
    g.strokeStyle = rgba(color, .76); g.lineWidth = 1.3; g.beginPath(); g.arc(3, -6, 7 + level, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(-2, -6); g.lineTo(3, -11); g.lineTo(8, -6); g.lineTo(3, -1); g.closePath(); g.stroke();
    g.restore();
  }

  function drawWeapon(g, hero, x, y, scale = 1, facing = 'down') {
    if (!hero || hero.hp <= 0) return;
    g.save(); g.translate(x, y); g.scale(scale, scale);
    const id = classId(hero);
    if (id === 'mooncantor') drawMoonStaff(g, hero, facing);
    else if (id === 'thornranger') drawThornBow(g, hero, facing);
    else if (id === 'wardseeker') drawWardGlaive(g, hero, facing);
    else drawAshblade(g, hero, facing);
    g.restore();
  }

  function drawQuestMarker(npc, active, color = '#f3cf78') {
    if (!active) return;
    const x = npc.x * TILE + 16;
    const y = npc.y * TILE - 6 + Math.sin(frameTime * .006 + npc.x) * 2;
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 13);
    glow.addColorStop(0, rgba(color, .75)); glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = color; path(ctx, [[x, y - 7], [x + 6, y], [x, y + 7], [x - 6, y]]); ctx.fill();
    ctx.strokeStyle = '#3b2b1e'; ctx.lineWidth = 1; ctx.stroke();
  }

  function drawSouthroadCamp() {
    if (state?.map !== 'outskirts') return;
    const fireX = 14 * TILE + 16;
    const fireY = 9 * TILE + 19;
    const pulse = .8 + Math.sin(frameTime * .01) * .15;
    const glow = ctx.createRadialGradient(fireX, fireY, 2, fireX, fireY, 42);
    glow.addColorStop(0, `rgba(255,191,82,${pulse})`); glow.addColorStop(1, 'rgba(255,116,44,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(fireX, fireY, 42, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5e4632'; ctx.save(); ctx.translate(fireX, fireY + 8); ctx.rotate(.5); ctx.fillRect(-13, -3, 26, 6); ctx.rotate(-1); ctx.fillRect(-13, -3, 26, 6); ctx.restore();
    ctx.fillStyle = '#f4a34d'; path(ctx, [[fireX - 8, fireY + 7], [fireX - 2, fireY - 15], [fireX + 2, fireY], [fireX + 9, fireY - 10], [fireX + 8, fireY + 8]]); ctx.fill();
    ctx.fillStyle = '#ffe08a'; path(ctx, [[fireX - 3, fireY + 5], [fireX, fireY - 8], [fireX + 4, fireY + 5]]); ctx.fill();

    [[5, 3, '#6f5946'], [23, 3, '#5b5367']].forEach(([tx, ty, tentColor]) => {
      const x = tx * TILE + 16; const y = ty * TILE + 22;
      ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(x, y + 9, 25, 7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = tentColor; ctx.strokeStyle = '#2c2522'; ctx.lineWidth = 2;
      path(ctx, [[x - 25, y + 7], [x, y - 22], [x + 25, y + 7]]); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d8c59d'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y + 7); ctx.stroke();
      ctx.fillStyle = 'rgba(15,14,17,.72)'; path(ctx, [[x - 5, y + 7], [x, y - 5], [x + 6, y + 7]]); ctx.fill();
    });

    for (let i = 0; i < 16; i += 1) {
      const x = (i * 61 + frameTime * .012) % WIDTH;
      const y = 70 + (i * 47) % 360;
      ctx.fillStyle = 'rgba(220,235,193,.16)'; ctx.beginPath(); ctx.arc(x, y + Math.sin(frameTime * .002 + i) * 9, 1.1, 0, TAU); ctx.fill();
    }
  }

  function drawPartyWeapons() {
    if (!state || mode !== 'world') return;
    state.party.slice(1, 4).forEach((hero, index) => {
      const position = trail[(index + 1) * 2 - 1];
      if (position && (position.x !== state.x || position.y !== state.y)) drawWeapon(ctx, hero, position.x * TILE + 16, position.y * TILE + 20, .82, position.facing || state.facing);
    });
    drawWeapon(ctx, state.party[0], state.x * TILE + 16, state.y * TILE + 20, 1.04, state.facing);
  }

  function drawNpcWeaponDetails() {
    if (!state || mode !== 'world') return;
    visibleNpcs().filter(npc => npc.role === 'rhea').forEach(npc => {
      const hero = { id: 'mira', hp: 1, color: npc.color, weaponLevel: Math.max(1, state.upgrades?.weapon || 0), appearance: { classId: 'wardseeker', accent: npc.color } };
      drawWeapon(ctx, hero, npc.x * TILE + 16, npc.y * TILE + 20, .83, 'down');
    });
  }

  function drawMarkers() {
    if (!state) return;
    visibleNpcs().forEach(npc => {
      const active = (npc.id === 'elder' && [0, 5].includes(state.mainStage))
        || (npc.role === 'rhea' && state.mainStage === 1)
        || (npc.id === 'captain' && state.mainStage === 7)
        || (npc.id === 'edda' && state.sideScout === 0)
        || (npc.id === 'mira' && state.sideScout === 1);
      drawQuestMarker(npc, active, npc.id === 'mira' && !npc.role ? '#c8a0f0' : '#f3cf78');
    });
  }

  drawWorld = function weaponArtWorld(timestamp = 0) {
    baseDrawWorld(timestamp);
    drawSouthroadCamp();
    drawNpcWeaponDetails();
    drawPartyWeapons();
    drawMarkers();
  };

  if (basePreview && window.AshenArt) {
    window.AshenArt.drawCreatorPreview = function weaponPreview(canvas, appearance, classDef) {
      basePreview(canvas, appearance, classDef);
      const g = canvas?.getContext?.('2d');
      if (!g) return;
      const hero = { id: classDef.baseId, color: appearance.accent || classDef.color, appearance: { ...appearance }, weaponLevel: 2, hp: 1 };
      drawWeapon(g, hero, canvas.width / 2, canvas.height * .65, 4.25, 'down');
    };
  }
})();