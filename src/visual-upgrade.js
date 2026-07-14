/* Ashen Crown visual upgrade layer. Pure rendering overrides: no save/schema changes. */
(() => {
  const baseDrawTile = drawTile;
  const baseDrawWorld = drawWorld;

  function noise(x, y, seed = 0) {
    return hashNoise(x, y, seed);
  }

  function drawGrass(px, py, x, y) {
    const n = noise(x, y, 8);
    if (n < 0.62) return;
    ctx.save();
    ctx.strokeStyle = n > 0.88 ? 'rgba(203,226,143,.42)' : 'rgba(90,139,78,.38)';
    ctx.lineWidth = 1;
    const ox = 5 + Math.floor(noise(x, y, 9) * 20);
    const oy = 19 + Math.floor(noise(x, y, 10) * 9);
    ctx.beginPath();
    ctx.moveTo(px + ox, py + oy + 5);
    ctx.lineTo(px + ox - 2, py + oy);
    ctx.moveTo(px + ox, py + oy + 5);
    ctx.lineTo(px + ox + 2, py + oy - 2);
    ctx.moveTo(px + ox, py + oy + 5);
    ctx.lineTo(px + ox + 4, py + oy + 1);
    ctx.stroke();
    if (n > 0.93) {
      ctx.fillStyle = noise(x, y, 11) > .5 ? '#d7c5ed' : '#f0dca4';
      ctx.beginPath();
      ctx.arc(px + ox + 2, py + oy - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStone(px, py, x, y) {
    if (noise(x, y, 13) < .84) return;
    const ox = 5 + Math.floor(noise(x, y, 14) * 20);
    const oy = 7 + Math.floor(noise(x, y, 15) * 18);
    ctx.fillStyle = 'rgba(26,31,34,.32)';
    ctx.beginPath();
    ctx.ellipse(px + ox + 1, py + oy + 3, 4, 2, -.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(157,164,154,.38)';
    ctx.beginPath();
    ctx.ellipse(px + ox, py + oy, 3.5, 2.5, -.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWallDetail(px, py, x, y) {
    ctx.strokeStyle = 'rgba(10,12,15,.24)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 11);
    ctx.lineTo(px + TILE, py + 11);
    ctx.moveTo(px, py + 22);
    ctx.lineTo(px + TILE, py + 22);
    const offset = (y % 2) * 8;
    ctx.moveTo(px + 8 + offset, py);
    ctx.lineTo(px + 8 + offset, py + 11);
    ctx.moveTo(px + 22 + offset, py + 11);
    ctx.lineTo(px + 22 + offset, py + 22);
    ctx.stroke();
    ctx.fillStyle = 'rgba(225,238,215,.05)';
    ctx.fillRect(px + 2, py + 2, TILE - 4, 3);
    if (noise(x, y, 18) > .73) {
      ctx.strokeStyle = 'rgba(82,116,66,.45)';
      ctx.beginPath();
      ctx.moveTo(px + 4, py + 4);
      ctx.quadraticCurveTo(px + 8, py + 13, px + 5, py + 23);
      ctx.stroke();
      ctx.fillStyle = 'rgba(104,143,74,.42)';
      ctx.beginPath();
      ctx.arc(px + 7, py + 13, 2, 0, Math.PI * 2);
      ctx.arc(px + 4, py + 20, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWaterDetail(px, py, x, y) {
    const t = frameTime * .002;
    ctx.save();
    ctx.globalAlpha = .35;
    for (let i = 0; i < 2; i += 1) {
      const waveY = 8 + i * 13 + Math.sin(t + x * .7 + y + i) * 2;
      ctx.strokeStyle = i ? '#b7e1de' : '#76b9c8';
      ctx.beginPath();
      ctx.moveTo(px + 3, py + waveY);
      ctx.bezierCurveTo(px + 10, py + waveY - 3, px + 18, py + waveY + 3, px + 29, py + waveY);
      ctx.stroke();
    }
    if (noise(x, y, 20) > .9) {
      ctx.fillStyle = 'rgba(226,246,229,.38)';
      ctx.beginPath();
      ctx.ellipse(px + 10, py + 19, 4, 2, -.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawTile = function upgradedTile(map, char, x, y) {
    baseDrawTile(map, char, x, y);
    const px = x * TILE;
    const py = y * TILE;
    ctx.save();
    if (char === '#') drawWallDetail(px, py, x, y);
    else if (char === '~') drawWaterDetail(px, py, x, y);
    else if (char === '=') {
      ctx.fillStyle = 'rgba(62,46,33,.11)';
      ctx.beginPath();
      ctx.ellipse(px + 8 + noise(x, y, 22) * 16, py + 9 + noise(x, y, 23) * 14, 3, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      drawStone(px, py, x, y);
    } else {
      drawGrass(px, py, x, y);
      drawStone(px, py, x, y);
    }
    ctx.restore();
  };

  drawCharacter = function upgradedCharacter(x, y, color, scale = 1, facing = 'down', outline = '#17131b') {
    const cx = x * TILE + TILE / 2;
    const cy = y * TILE + TILE / 2;
    const bob = Math.sin(frameTime * .005 + x * .8 + y) * .7;
    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, 8); ctx.lineTo(-5, 14);
    ctx.moveTo(4, 8); ctx.lineTo(5, 14);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -1);
    ctx.quadraticCurveTo(-10, 7, -7, 12);
    ctx.lineTo(7, 12);
    ctx.quadraticCurveTo(10, 7, 7, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(-5, 1, 10, 2);
    ctx.fillStyle = '#b99049';
    ctx.fillRect(-7, 7, 14, 2);
    ctx.fillStyle = '#d8b593';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#28222d';
    ctx.beginPath();
    ctx.arc(0, -9, 7.3, Math.PI, 0);
    ctx.lineTo(6, -6);
    ctx.quadraticCurveTo(2, -10, -1, -8);
    ctx.quadraticCurveTo(-4, -5, -7, -6);
    ctx.closePath();
    ctx.fill();
    if (facing !== 'up') {
      const eyeShift = facing === 'left' ? -2 : facing === 'right' ? 2 : 0;
      ctx.fillStyle = '#17131b';
      ctx.fillRect(-3 + eyeShift, -7, 1.5, 1.5);
      ctx.fillRect(2 + eyeShift, -7, 1.5, 1.5);
    }
    ctx.strokeStyle = '#c9d4da';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (facing === 'left') { ctx.moveTo(-8, 2); ctx.lineTo(-13, 8); }
    else if (facing === 'right') { ctx.moveTo(8, 2); ctx.lineTo(13, 8); }
    else { ctx.moveTo(7, 0); ctx.lineTo(11, 9); }
    ctx.stroke();
    ctx.restore();
  };

  drawEnemy = function upgradedEnemy(encounter) {
    const type = ENEMIES[encounter.enemies[0]];
    const cx = encounter.x * TILE + TILE / 2;
    const cy = encounter.y * TILE + TILE / 2;
    const boss = Boolean(encounter.boss);
    const pulse = 1 + Math.sin(frameTime * .004 + encounter.x) * .035;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(0, 11, boss ? 17 : 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = type.color;
    ctx.strokeStyle = '#17131b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, boss ? -17 : -12);
    ctx.quadraticCurveTo(boss ? 17 : 12, -8, boss ? 14 : 10, 11);
    ctx.quadraticCurveTo(7, 7, 3, 13);
    ctx.lineTo(0, 9);
    ctx.lineTo(-4, 13);
    ctx.quadraticCurveTo(-8, 7, boss ? -14 : -10, 11);
    ctx.quadraticCurveTo(boss ? -17 : -12, -8, 0, boss ? -17 : -12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = boss ? '#f4d7ff' : '#f5e5bc';
    ctx.beginPath();
    ctx.moveTo(-7, -4); ctx.lineTo(-2, -2); ctx.lineTo(-6, 0); ctx.closePath();
    ctx.moveTo(7, -4); ctx.lineTo(2, -2); ctx.lineTo(6, 0); ctx.closePath();
    ctx.fill();
    if (boss) {
      const glow = .22 + Math.sin(frameTime * .004) * .08;
      ctx.strokeStyle = `rgba(203,145,255,${glow + .35})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -1, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#c59ce8';
      ctx.beginPath();
      ctx.moveTo(-12, -10); ctx.lineTo(-8, -21); ctx.lineTo(-3, -12);
      ctx.moveTo(12, -10); ctx.lineTo(8, -21); ctx.lineTo(3, -12);
      ctx.fill();
    }
    ctx.restore();
  };

  drawWorld = function upgradedWorld(timestamp = 0) {
    baseDrawWorld(timestamp);
    if (!state) return;
    const playerX = state.x * TILE + TILE / 2;
    const playerY = state.y * TILE + TILE / 2;
    const light = ctx.createRadialGradient(playerX, playerY, TILE, playerX, playerY, Math.max(WIDTH, HEIGHT) * .72);
    light.addColorStop(0, 'rgba(255,244,209,0)');
    light.addColorStop(.55, 'rgba(22,27,37,.045)');
    light.addColorStop(1, 'rgba(8,10,18,.24)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * .22, WIDTH / 2, HEIGHT / 2, WIDTH * .68);
    vignette.addColorStop(.55, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,.2)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  };
})();
