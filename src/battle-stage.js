(() => {
  const style = document.createElement('style');
  style.textContent = `
    .battle-window{position:relative;overflow:hidden;isolation:isolate}
    .battle-window::before{content:"";position:absolute;inset:0;z-index:-2;background:linear-gradient(180deg,#182231 0%,#253a35 47%,#17231f 48%,#0d1316 100%)}
    .battle-window[data-biome="village"]::before{background:linear-gradient(180deg,#263244,#4f4b3d 47%,#30281f 48%,#151416)}
    .battle-window[data-biome="forest"]::before{background:linear-gradient(180deg,#142b2a,#31513a 47%,#1b3225 48%,#0d1713)}
    .battle-window[data-biome="ruins"]::before{background:linear-gradient(180deg,#28243a,#50445f 47%,#302d3b 48%,#15141d)}
    .battle-window[data-biome="cave"]::before{background:linear-gradient(180deg,#151622,#292536 47%,#181820 48%,#090a0f)}
    .battle-stage{display:grid;grid-template-columns:minmax(190px,.8fr) minmax(260px,1.25fr);gap:18px;align-items:end;margin:10px 0 14px;min-height:190px}
    .hero-formation{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-content:end;padding:12px}
    .battle-hero{position:relative;min-height:72px;padding:8px 8px 8px 58px;border:1px solid rgba(235,214,164,.24);border-radius:14px;background:linear-gradient(135deg,rgba(16,21,30,.9),rgba(38,45,55,.64));box-shadow:0 8px 18px rgba(0,0,0,.32)}
    .battle-hero.active{outline:2px solid #f0d48c;transform:translateY(-4px);box-shadow:0 0 22px rgba(240,212,140,.28)}
    .battle-hero.fallen{filter:grayscale(1);opacity:.5}
    .hero-figure{position:absolute;left:12px;bottom:8px;width:34px;height:49px;filter:drop-shadow(0 6px 4px rgba(0,0,0,.5))}
    .hero-figure::before{content:"";position:absolute;left:8px;top:0;width:18px;height:18px;border-radius:50%;background:var(--hair,#805f3e);box-shadow:inset 0 -5px 0 #e0ad81}
    .hero-figure::after{content:"";position:absolute;left:3px;top:16px;width:28px;height:31px;border-radius:10px 10px 7px 7px;background:linear-gradient(135deg,var(--cloak,#486582),#202936);clip-path:polygon(15% 0,85% 0,100% 100%,0 100%)}
    .battle-hero:nth-child(2) .hero-figure{--hair:#d8d5d0;--cloak:#66528b}.battle-hero:nth-child(3) .hero-figure{--hair:#3b2e27;--cloak:#416248}.battle-hero:nth-child(4) .hero-figure{--hair:#d8b36b;--cloak:#894a4d}
    .battle-hero b,.battle-hero small{display:block}.battle-hero small{color:#c4c7cb;font-size:.72rem;margin-top:3px}
    .battle-enemies{align-self:stretch;display:flex;align-items:end}.battle-enemies .enemy-grid{width:100%}
    .enemy-card{position:relative;padding-top:86px!important;overflow:visible!important}
    .enemy-card::before{content:"";position:absolute;left:50%;top:7px;width:62px;height:68px;transform:translateX(-50%);border-radius:48% 52% 40% 40%;background:radial-gradient(circle at 40% 28%,#ffcf8b 0 4%,transparent 5%),radial-gradient(circle at 63% 28%,#ffcf8b 0 4%,transparent 5%),linear-gradient(145deg,#4c5961,#171c23 70%);filter:drop-shadow(0 10px 5px rgba(0,0,0,.5));animation:enemy-idle 2.2s ease-in-out infinite}
    .enemy-card[data-kind*="wolf"]::before,.enemy-card[data-kind*="hound"]::before{clip-path:polygon(0 30%,18% 0,35% 20%,70% 12%,100% 36%,83% 58%,90% 100%,55% 76%,18% 95%,25% 58%)}
    .enemy-card[data-kind*="shade"]::before{background:radial-gradient(circle at 40% 30%,#d6b3ff 0 4%,transparent 5%),radial-gradient(circle at 62% 30%,#d6b3ff 0 4%,transparent 5%),linear-gradient(#56406f,#171221);box-shadow:0 0 25px rgba(153,104,211,.55)}
    .enemy-card[data-kind*="warden"]::before,.enemy-card.boss::before{width:82px;height:82px;background:radial-gradient(circle at 40% 27%,#ff835c 0 4%,transparent 5%),radial-gradient(circle at 62% 27%,#ff835c 0 4%,transparent 5%),linear-gradient(145deg,#766550,#28231e);box-shadow:0 0 28px rgba(185,92,56,.48)}
    .battle-intent{position:absolute;right:8px;top:8px;padding:3px 7px;border-radius:999px;background:#181c24;border:1px solid #9a8359;color:#f2d49e;font-size:.68rem;letter-spacing:.04em}.battle-intent[data-tone="heavy"]{border-color:#c56b52;color:#ffc0a6}.battle-intent[data-tone="venom"]{border-color:#739c55;color:#bde990}.battle-intent[data-tone="guard"]{border-color:#6e91bb;color:#b8d7ff}.battle-intent[data-tone="wave"]{border-color:#9a6ac2;color:#e1c2ff;box-shadow:0 0 12px rgba(157,105,205,.35)}
    @keyframes enemy-idle{50%{transform:translate(-50%,-5px) scale(1.03)}}
    @media(max-width:760px),(max-height:460px){.battle-stage{grid-template-columns:170px 1fr;min-height:140px;gap:8px}.hero-formation{padding:4px;gap:4px}.battle-hero{min-height:54px;padding:5px 4px 4px 42px}.hero-figure{transform:scale(.75);transform-origin:left bottom}.battle-hero small{font-size:.62rem}.enemy-card{padding-top:62px!important}.enemy-card::before{width:48px;height:51px}.enemy-card.boss::before{width:62px;height:62px}}
  `;
  document.head.appendChild(style);

  const originalRenderBattle = window.renderBattle;
  if (typeof originalRenderBattle !== 'function') return;

  function biomeForMap() {
    const id = String(state?.map || '').toLowerCase();
    if (id.includes('cave') || id.includes('mine')) return 'cave';
    if (id.includes('ruin') || id.includes('gate') || id.includes('ward')) return 'ruins';
    if (id.includes('forest') || id.includes('wild') || id.includes('grove')) return 'forest';
    return 'village';
  }

  function enhanceBattleScreen() {
    const windowEl = overlay?.querySelector('.battle-window');
    const enemyGrid = windowEl?.querySelector('.enemy-grid');
    const turnBanner = windowEl?.querySelector('.turn-banner');
    if (!windowEl || !enemyGrid || !turnBanner || windowEl.querySelector('.battle-stage')) return;
    windowEl.dataset.biome = biomeForMap();

    [...enemyGrid.children].forEach((card, index) => {
      const enemy = battle?.enemies?.[index];
      if (!enemy) return;
      card.dataset.kind = String(enemy.id || enemy.name || '').toLowerCase();
      const intent = enemy.intent || { label: 'Attack', icon: '⚔', tone: 'attack' };
      const badge = document.createElement('span');
      badge.className = 'battle-intent';
      badge.dataset.tone = intent.tone || intent.type || 'attack';
      badge.textContent = `${intent.icon || '⚔'} ${intent.label || 'Attack'}`;
      badge.setAttribute('aria-label', `Enemy intent: ${intent.label || 'Attack'}`);
      card.appendChild(badge);
    });

    const formation = document.createElement('div');
    formation.className = 'hero-formation';
    formation.innerHTML = state.party.map((hero, index) => `
      <div class="battle-hero ${index === battle.heroIndex ? 'active' : ''} ${hero.hp <= 0 ? 'fallen' : ''}">
        <span class="hero-figure" aria-hidden="true"></span>
        <b>${hero.name}</b><small>${hero.className}</small><small>HP ${hero.hp}/${hero.maxHp}</small>
      </div>`).join('');

    const stage = document.createElement('div');
    stage.className = 'battle-stage';
    const enemyWrap = document.createElement('div');
    enemyWrap.className = 'battle-enemies';
    enemyGrid.parentNode.insertBefore(stage, enemyGrid);
    stage.appendChild(formation);
    stage.appendChild(enemyWrap);
    enemyWrap.appendChild(enemyGrid);
  }

  window.renderBattle = function enhancedRenderBattle(...args) {
    const result = originalRenderBattle.apply(this, args);
    enhanceBattleScreen();
    return result;
  };
})();
