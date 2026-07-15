(() => {
  const ELEMENTS = {
    physical: { name: 'Steel', icon: '⚔', color: '#d7c6a4' },
    ember: { name: 'Ember', icon: '✹', color: '#ef8a55' },
    moon: { name: 'Moon', icon: '☾', color: '#8fc8ff' },
    thorn: { name: 'Thorn', icon: '❧', color: '#8bcf87' },
    ward: { name: 'Ward', icon: '✦', color: '#c59be8' }
  };

  const SKILL_ELEMENTS = {
    emberSlash: 'ember', ironVow: 'ember', cleave: 'ember',
    moonbolt: 'moon', mend: 'moon', starfall: 'moon',
    piercingShot: 'thorn', smokeVeil: 'thorn', volley: 'thorn',
    wardSlash: 'ward', spiritSeal: 'ward', moonWard: 'ward'
  };

  const ENEMY_AFFINITIES = {
    gloomRat: { weak: ['ember'], resist: ['thorn'] },
    ashHusk: { weak: ['moon'], resist: ['ember'] },
    moonWisp: { weak: ['ward'], resist: ['moon'] },
    briarWolf: { weak: ['ember'], resist: ['thorn'] },
    brokenSentinel: { weak: ['thorn'], resist: ['physical'] },
    crownshade: { weak: ['ward'], resist: ['moon'] },
    roadReaver: { weak: ['thorn'], resist: [] },
    mireDrake: { weak: ['moon'], resist: ['ember'] },
    ironWarden: { weak: ['ember'], resist: ['physical', 'thorn'] }
  };

  let activeElement = 'physical';
  let effectiveness = 1;

  function elementForAction(action) {
    if (action?.type === 'skill') return SKILL_ELEMENTS[action.skillId] || (SKILLS[action.skillId]?.magic ? 'moon' : 'physical');
    if (action?.hero?.id === 'lyra') return 'moon';
    if (action?.hero?.id === 'rowan') return 'thorn';
    if (action?.hero?.id === 'mira') return 'ward';
    if (action?.hero?.id === 'kael') return 'ember';
    return 'physical';
  }

  function affinityFor(enemy, element) {
    const affinity = ENEMY_AFFINITIES[enemy?.id] || { weak: [], resist: [] };
    if (affinity.weak.includes(element)) return 1.35;
    if (affinity.resist.includes(element)) return 0.7;
    return 1;
  }

  const baseCalculateDamage = calculateDamage;
  calculateDamage = function(attacker, defender, power = 1, magic = false, pierce = false) {
    const base = baseCalculateDamage(attacker, defender, power, magic, pierce);
    effectiveness = defender?.id ? affinityFor(defender, activeElement) : 1;
    return Math.max(1, Math.round(base * effectiveness));
  };

  const baseExecuteHeroAction = executeHeroAction;
  executeHeroAction = function(action) {
    activeElement = elementForAction(action);
    effectiveness = 1;
    baseExecuteHeroAction(action);
    const element = ELEMENTS[activeElement];
    if (battle && element && action?.enemy) {
      if (effectiveness > 1) battle.log += ` ${element.name} tears through its weakness!`;
      else if (effectiveness < 1) battle.log += ` ${action.enemy.name} resists ${element.name}.`;
      renderBattle();
    }
    activeElement = 'physical';
    effectiveness = 1;
  };

  function affinityBadges(enemy) {
    const affinity = ENEMY_AFFINITIES[enemy.id] || { weak: [], resist: [] };
    const weak = affinity.weak.map(id => `<span class="affinity-badge weak" title="Weak to ${ELEMENTS[id].name}">${ELEMENTS[id].icon} Weak</span>`).join('');
    const resist = affinity.resist.map(id => `<span class="affinity-badge resist" title="Resists ${ELEMENTS[id].name}">${ELEMENTS[id].icon} Resist</span>`).join('');
    return `<div class="affinity-row">${weak}${resist}</div>`;
  }

  const baseEnemyCard = enemyCard;
  enemyCard = function(enemy, index, targetable = false) {
    const card = baseEnemyCard(enemy, index, targetable);
    return card.replace('</div>', `${affinityBadges(enemy)}</div>`);
  };

  const baseHandleBattleCommand = handleBattleCommand;
  handleBattleCommand = function(command) {
    if (command !== 'inspect') return baseHandleBattleCommand(command);
    battle.log = livingEnemies().map(enemy => {
      const affinity = ENEMY_AFFINITIES[enemy.id] || { weak: [], resist: [] };
      const weak = affinity.weak.length ? affinity.weak.map(id => ELEMENTS[id].name).join(', ') : 'None';
      const resist = affinity.resist.length ? affinity.resist.map(id => ELEMENTS[id].name).join(', ') : 'None';
      return `${enemy.name}: ATK ${enemy.attack}, DEF ${enemy.defense}, AGI ${enemy.agility} · Weak: ${weak} · Resists: ${resist}`;
    }).join('<br>');
    renderBattle();
  };

  const style = document.createElement('style');
  style.textContent = `
    .affinity-row{display:flex;gap:.28rem;flex-wrap:wrap;margin-top:.42rem}
    .affinity-badge{display:inline-flex;align-items:center;gap:.2rem;padding:.12rem .38rem;border-radius:999px;font-size:clamp(.58rem,1.45vw,.72rem);font-weight:800;letter-spacing:.02em;border:1px solid rgba(255,255,255,.16);background:rgba(8,12,19,.72)}
    .affinity-badge.weak{color:#ffd3b8;box-shadow:inset 0 0 0 1px rgba(239,138,85,.18)}
    .affinity-badge.resist{color:#b9d7ff;box-shadow:inset 0 0 0 1px rgba(143,200,255,.15)}
    @media(max-height:430px){.affinity-row{margin-top:.2rem}.affinity-badge{padding:.08rem .28rem}}
  `;
  document.head.appendChild(style);
})();
