(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    .battle-window { position: relative; overflow: hidden; }
    .battle-fx-layer { position: absolute; inset: 0; pointer-events: none; z-index: 30; overflow: hidden; }
    .battle-fx-flash { position: absolute; inset: 0; opacity: 0; animation: fxFlash .34s ease-out; }
    .battle-fx-flash.hit { background: radial-gradient(circle at 65% 42%, rgba(255,236,184,.58), rgba(211,68,58,.18) 18%, transparent 46%); }
    .battle-fx-flash.magic { background: radial-gradient(circle at 62% 42%, rgba(181,151,255,.62), rgba(74,108,255,.18) 22%, transparent 50%); }
    .battle-fx-flash.heal { background: radial-gradient(circle at 28% 62%, rgba(176,255,188,.55), rgba(71,207,142,.15) 25%, transparent 52%); }
    .battle-fx-flash.poison { background: radial-gradient(circle at 30% 60%, rgba(184,255,107,.42), rgba(89,132,42,.13) 28%, transparent 54%); }
    .battle-float { position: absolute; left: 58%; top: 38%; transform: translate(-50%,-50%); font: 900 clamp(20px,4vw,42px)/1 system-ui,sans-serif; color: #ffe7ad; text-shadow: 0 3px 0 #5c201b,0 0 12px rgba(255,224,140,.8); animation: fxFloat .82s cubic-bezier(.17,.84,.3,1) forwards; white-space: nowrap; }
    .battle-float.heal { left: 31%; top: 60%; color: #baffc7; text-shadow: 0 3px 0 #1c5b39,0 0 12px rgba(113,255,164,.75); }
    .battle-float.poison { left: 31%; top: 58%; color: #c8ff79; text-shadow: 0 3px 0 #385421,0 0 12px rgba(160,255,77,.7); }
    .battle-float.status { font-size: clamp(15px,2.8vw,27px); color: #d8c8ff; }
    .battle-spark { position: absolute; width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 10px currentColor; animation: fxSpark .65s ease-out forwards; }
    .battle-window.fx-shake { animation: fxShake .24s linear; }
    .enemy-card.fx-hit { animation: fxEnemyHit .32s ease-out; }
    .party-combatant.fx-hit, .party-stage-member.fx-hit { animation: fxHeroHit .34s ease-out; }
    @keyframes fxFlash { 0%{opacity:0} 18%{opacity:1} 100%{opacity:0} }
    @keyframes fxFloat { 0%{opacity:0;transform:translate(-50%,8px) scale(.65)} 18%{opacity:1;transform:translate(-50%,-8px) scale(1.15)} 100%{opacity:0;transform:translate(-50%,-58px) scale(.96)} }
    @keyframes fxSpark { from{opacity:1;transform:translate(0,0) scale(1)} to{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.2)} }
    @keyframes fxShake { 0%,100%{transform:translate(0)} 20%{transform:translate(-5px,2px)} 40%{transform:translate(5px,-2px)} 60%{transform:translate(-3px,-1px)} 80%{transform:translate(3px,1px)} }
    @keyframes fxEnemyHit { 0%,100%{transform:translate(0);filter:none} 35%{transform:translate(7px,-2px);filter:brightness(1.8)} 60%{transform:translate(-4px,1px)} }
    @keyframes fxHeroHit { 0%,100%{transform:translate(0);filter:none} 35%{transform:translate(-7px,1px);filter:brightness(1.7) saturate(.7)} 60%{transform:translate(4px,-1px)} }
    @media (prefers-reduced-motion: reduce) {
      .battle-window.fx-shake,.enemy-card.fx-hit,.party-combatant.fx-hit,.party-stage-member.fx-hit { animation:none !important; }
      .battle-float { animation-duration:.12s; }
    }
  `;
  document.head.appendChild(style);

  let previousLog = '';
  let pendingFx = null;

  function classify(log) {
    if (!log || log === previousLog) return null;
    const lower = log.toLowerCase();
    const numbers = [...log.matchAll(/(?:for|restores?|suffers?|dealing)\s+(\d+)/gi)].map(match => Number(match[1]));
    const amount = numbers.length ? numbers[numbers.length - 1] : null;
    if (lower.includes('restores') || lower.includes('potion') || lower.includes('raises')) return { kind: 'heal', amount, label: amount ? `+${amount}` : 'RESTORE' };
    if (lower.includes('poison')) return { kind: 'poison', amount, label: amount ? `-${amount}` : 'POISON' };
    if (lower.includes('guard') || lower.includes('brace') || lower.includes('weaken')) return { kind: 'status', amount, label: lower.includes('weaken') ? 'WEAKENED' : 'GUARD' };
    if (lower.includes('uses') || lower.includes('wave') || lower.includes('spell')) return { kind: 'magic', amount, label: amount ? `-${amount}` : 'ARCANA' };
    if (lower.includes('damage') || lower.includes('hits') || lower.includes('strikes')) return { kind: 'hit', amount, label: amount ? `-${amount}` : 'HIT' };
    return null;
  }

  function sparks(layer, kind) {
    const color = kind === 'heal' ? '#93ffbd' : kind === 'poison' ? '#b9f36b' : kind === 'magic' ? '#bfa7ff' : '#ffd58a';
    const centerX = kind === 'heal' || kind === 'poison' ? 31 : 61;
    const centerY = kind === 'heal' || kind === 'poison' ? 60 : 42;
    for (let i = 0; i < 10; i += 1) {
      const particle = document.createElement('i');
      const angle = Math.PI * 2 * i / 10;
      const distance = 24 + Math.random() * 42;
      particle.className = 'battle-spark';
      particle.style.left = `${centerX}%`;
      particle.style.top = `${centerY}%`;
      particle.style.color = color;
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      layer.appendChild(particle);
    }
  }

  function playFx(fx) {
    const windowEl = document.querySelector('.battle-window');
    if (!windowEl || !fx) return;
    let layer = windowEl.querySelector('.battle-fx-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'battle-fx-layer';
      windowEl.appendChild(layer);
    }
    layer.replaceChildren();

    const flash = document.createElement('div');
    flash.className = `battle-fx-flash ${fx.kind}`;
    layer.appendChild(flash);

    const floating = document.createElement('div');
    floating.className = `battle-float ${fx.kind}`;
    floating.textContent = fx.label;
    layer.appendChild(floating);
    sparks(layer, fx.kind);

    if (fx.kind === 'hit' || fx.kind === 'magic') {
      windowEl.classList.remove('fx-shake');
      void windowEl.offsetWidth;
      windowEl.classList.add('fx-shake');
      const enemy = windowEl.querySelector('.enemy-card:not(.dead)');
      if (enemy) enemy.classList.add('fx-hit');
    } else if (fx.kind === 'poison') {
      const hero = windowEl.querySelector('.party-combatant:not(.fallen), .party-stage-member:not(.fallen)');
      if (hero) hero.classList.add('fx-hit');
    }
    setTimeout(() => layer.replaceChildren(), 900);
  }

  const baseRenderBattle = window.renderBattle;
  if (typeof baseRenderBattle === 'function') {
    window.renderBattle = function enhancedBattleRender(...args) {
      const currentLog = window.battle?.log || '';
      pendingFx = classify(currentLog);
      previousLog = currentLog;
      const result = baseRenderBattle.apply(this, args);
      if (pendingFx) requestAnimationFrame(() => playFx(pendingFx));
      return result;
    };
  }
})();
