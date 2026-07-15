(() => {
  const baseStartBattle = window.startBattle;
  const baseCalculateDamage = window.calculateDamage;
  const baseEnemyCard = window.enemyCard;

  if (typeof baseStartBattle !== 'function' || typeof baseCalculateDamage !== 'function') return;

  const INTENTS = {
    attack: { label: 'Attack', icon: '⚔', tone: 'attack' },
    heavy: { label: 'Heavy Attack', icon: '✦', tone: 'heavy' },
    venom: { label: 'Venom Strike', icon: '☠', tone: 'venom' },
    guard: { label: 'Brace', icon: '◆', tone: 'guard' },
    wave: { label: 'Ruinous Wave', icon: '◉', tone: 'wave' }
  };

  function chooseIntent(enemy, enemyIndex, round) {
    if (enemy.boss && round % 3 === 0) return { type: 'wave', ...INTENTS.wave };
    if (enemy.poisonChance && (round + enemyIndex) % 2 === 0) return { type: 'venom', ...INTENTS.venom };
    if (!enemy.boss && enemy.defense >= enemy.attack && (round + enemyIndex) % 3 === 0) return { type: 'guard', ...INTENTS.guard };
    if ((round + enemyIndex) % 3 === 2 || enemy.boss) return { type: 'heavy', ...INTENTS.heavy };
    return { type: 'attack', ...INTENTS.attack };
  }

  function chooseIntentTarget(enemyIndex, round) {
    const targets = livingHeroes();
    if (!targets.length) return null;
    return targets[(enemyIndex + round - 1) % targets.length];
  }

  function planEnemyIntents() {
    if (!battle?.enemies) return;
    battle.enemies.forEach((enemy, index) => {
      if (enemy.hp <= 0) return;
      const intent = chooseIntent(enemy, index, battle.round);
      if (!['guard', 'wave'].includes(intent.type)) {
        const target = chooseIntentTarget(index, battle.round);
        intent.targetHeroId = target?.id || null;
        intent.targetName = target?.name || null;
      }
      enemy.intent = intent;
    });
  }

  function resolveIntentTarget(intent, targets) {
    if (!targets.length) return null;
    return targets.find(hero => hero.id === intent.targetHeroId) || targets[0];
  }

  function intentMarkup(enemy) {
    const intent = enemy.intent;
    if (!intent || enemy.hp <= 0) return '';
    const target = intent.type === 'wave'
      ? 'All allies'
      : intent.type === 'guard'
        ? 'Self'
        : intent.targetName || 'Unknown target';
    return `<div class="enemy-intent intent-${intent.tone || intent.type}" aria-label="Intent: ${intent.label}, target ${target}"><span class="intent-icon">${intent.icon || '◆'}</span><span><b>${intent.label}</b><small>${target}</small></span></div>`;
  }

  if (typeof baseEnemyCard === 'function') {
    window.enemyCard = function tacticalEnemyCard(enemy, index, targetable = false) {
      const card = baseEnemyCard(enemy, index, targetable);
      return card.replace(/<\/div>$/, `${intentMarkup(enemy)}</div>`);
    };
  }

  window.startBattle = function tacticalStartBattle(encounter) {
    const result = baseStartBattle.apply(this, arguments);
    planEnemyIntents();
    renderBattle();
    return result;
  };

  window.calculateDamage = function tacticalDamage(attacker, defender, power = 1, magic = false, pierce = false) {
    const raw = baseCalculateDamage(attacker, defender, power, magic, pierce);
    if (defender?.statuses?.enemyGuard && !pierce) return Math.max(1, Math.round(raw * (magic ? 0.72 : 0.5)));
    return raw;
  };

  window.enemyPhase = function tacticalEnemyPhase() {
    if (!battle) return;
    const messages = [];

    for (const enemy of livingEnemies()) {
      const targets = livingHeroes();
      if (!targets.length) break;
      const intent = enemy.intent || chooseIntent(enemy, 0, battle.round);

      if (intent.type === 'guard') {
        // Two ticks are required because status durations are reduced at the end
        // of this same enemy phase. One tick remains for the following hero turn.
        enemy.statuses.enemyGuard = 2;
        messages.push(`${enemy.name} braces behind a hardened stance.`);
        continue;
      }

      if (intent.type === 'wave') {
        let total = 0;
        livingHeroes().forEach(hero => {
          const guard = hero.statuses.guard ? 0.5 : 1;
          const weakened = enemy.statuses.weaken ? 0.72 : 1;
          const damage = Math.max(1, Math.round((enemy.attack * 0.68 * weakened - hero.defense * 0.2) * guard));
          hero.hp = Math.max(0, hero.hp - damage);
          total += damage;
        });
        messages.push(`${enemy.name} unleashes a ruinous wave for ${total} total damage.`);
        continue;
      }

      const target = resolveIntentTarget(intent, targets);
      const weakened = enemy.statuses.weaken ? 0.72 : 1;
      const guarded = target.statuses.guard ? 0.46 : 1;
      const power = intent.type === 'heavy' ? 1.38 : intent.type === 'venom' ? 0.92 : 1;
      const damage = Math.max(1, Math.round((enemy.attack * power * weakened - target.defense * 0.48) * (0.9 + Math.random() * 0.2) * guarded));
      target.hp = Math.max(0, target.hp - damage);
      messages.push(`${enemy.name} ${intent.type === 'heavy' ? 'crushes' : 'hits'} ${target.name} for ${damage}.`);

      const venomChance = intent.type === 'venom' ? Math.max(0.65, enemy.poisonChance || 0) : enemy.poisonChance || 0;
      if (venomChance && target.hp > 0 && Math.random() < venomChance) {
        target.statuses.poison = Math.max(target.statuses.poison || 0, 3);
        messages.push(`${target.name} is poisoned.`);
      }
    }

    state.party.forEach(hero => {
      if (hero.statuses.guard) hero.statuses.guard = Math.max(0, hero.statuses.guard - 1);
      if (hero.statuses.empower) hero.statuses.empower = Math.max(0, hero.statuses.empower - 1);
      if (hero.statuses.poison && hero.hp > 0) {
        const poisonDamage = Math.max(3, Math.round(hero.maxHp * 0.05));
        hero.hp = Math.max(0, hero.hp - poisonDamage);
        hero.statuses.poison -= 1;
        messages.push(`${hero.name} suffers ${poisonDamage} poison damage.`);
        if (hero.statuses.poison <= 0) delete hero.statuses.poison;
      }
    });

    battle.enemies.forEach(enemy => {
      if (enemy.statuses.weaken) enemy.statuses.weaken -= 1;
      if (enemy.statuses.weaken <= 0) delete enemy.statuses.weaken;
      if (enemy.statuses.enemyGuard) enemy.statuses.enemyGuard -= 1;
      if (enemy.statuses.enemyGuard <= 0) delete enemy.statuses.enemyGuard;
    });

    if (state.party.every(hero => hero.hp <= 0)) {
      handleDefeat();
      return;
    }

    battle.round += 1;
    battle.heroIndex = state.party.findIndex(hero => hero.hp > 0);
    battle.log = messages.join(' ');
    planEnemyIntents();
    saveGame();
    renderBattle();
  };

  window.AshenBattleTactics = { planEnemyIntents, chooseIntent, chooseIntentTarget, resolveIntentTarget, intentMarkup };
})();
