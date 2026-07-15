(() => {
  const tactics = window.AshenBattleTactics;
  if (!tactics || typeof window.enemyPhase !== 'function') return;

  const ABILITIES = {
    gloomRat: { name: 'Pack Gnaw', type: 'execute' },
    ashHusk: { name: 'Ashen Grasp', type: 'drain' },
    moonWisp: { name: 'Lunar Lance', type: 'arcane' },
    briarWolf: { name: 'Briar Pounce', type: 'venom' },
    brokenSentinel: { name: 'Shield Ram', type: 'stagger' },
    crownshade: { name: 'Crown of Night', type: 'bossHex' },
    roadReaver: { name: 'Marauder’s Mark', type: 'mark' },
    mireDrake: { name: 'Mire Breath', type: 'mireBreath' },
    ironWarden: { name: 'Ironroot Edict', type: 'bossWard' }
  };

  function hpRatio(hero) {
    return hero.maxHp ? hero.hp / hero.maxHp : 1;
  }

  function chooseTarget(enemy, intent) {
    const heroes = livingHeroes();
    if (!heroes.length) return null;

    if (enemy.id === 'gloomRat' || intent.type === 'venom') {
      return [...heroes].sort((a, b) => hpRatio(a) - hpRatio(b))[0];
    }
    if (enemy.id === 'moonWisp') {
      return [...heroes].sort((a, b) => b.maxMp - a.maxMp || a.hp - b.hp)[0];
    }
    if (enemy.id === 'brokenSentinel' || enemy.id === 'ironWarden') {
      return [...heroes].sort((a, b) => b.attack - a.attack || a.hp - b.hp)[0];
    }
    if (enemy.id === 'roadReaver') {
      return [...heroes].sort((a, b) => (b.statuses.marked || 0) - (a.statuses.marked || 0) || a.defense - b.defense)[0];
    }
    if (enemy.id === 'crownshade') {
      return [...heroes].sort((a, b) => b.mp - a.mp || a.hp - b.hp)[0];
    }
    return heroes[Math.floor(Math.random() * heroes.length)];
  }

  function directDamage(enemy, target, power = 1, defenseScale = 0.48) {
    const weakened = enemy.statuses.weaken ? 0.72 : 1;
    const guarded = target.statuses.guard ? 0.46 : 1;
    const marked = target.statuses.marked ? 1.18 : 1;
    const variance = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.round((enemy.attack * power * weakened - target.defense * defenseScale) * guarded * marked * variance));
  }

  function useSpeciesAbility(enemy, target, messages) {
    const ability = ABILITIES[enemy.id];
    if (!ability || !target) return false;

    if (ability.type === 'execute' && hpRatio(target) <= 0.42) {
      const damage = directDamage(enemy, target, 1.28);
      target.hp = Math.max(0, target.hp - damage);
      messages.push(`${enemy.name} uses ${ability.name}, savaging wounded ${target.name} for ${damage}.`);
      return true;
    }

    if (ability.type === 'drain' && battle.round % 3 === 0) {
      const damage = directDamage(enemy, target, 0.92, 0.35);
      target.hp = Math.max(0, target.hp - damage);
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.max(4, Math.round(damage * 0.45)));
      messages.push(`${enemy.name} uses ${ability.name}, draining ${damage} HP from ${target.name}.`);
      return true;
    }

    if (ability.type === 'arcane' && battle.round % 2 === 0) {
      const damage = directDamage(enemy, target, 1.16, 0.18);
      target.hp = Math.max(0, target.hp - damage);
      target.mp = Math.max(0, target.mp - 6);
      messages.push(`${enemy.name} casts ${ability.name} for ${damage} and burns 6 MP from ${target.name}.`);
      return true;
    }

    if (ability.type === 'venom' && battle.round % 2 === 0) {
      const damage = directDamage(enemy, target, 1.04);
      target.hp = Math.max(0, target.hp - damage);
      if (target.hp > 0) target.statuses.poison = Math.max(target.statuses.poison || 0, 3);
      messages.push(`${enemy.name} uses ${ability.name} on ${target.name} for ${damage}${target.hp > 0 ? ', inflicting poison' : ''}.`);
      return true;
    }

    if (ability.type === 'stagger' && battle.round % 3 === 1) {
      const damage = directDamage(enemy, target, 1.08);
      target.hp = Math.max(0, target.hp - damage);
      target.statuses.stagger = 1;
      messages.push(`${enemy.name} uses ${ability.name} for ${damage}; ${target.name} is staggered.`);
      return true;
    }

    if (ability.type === 'bossHex' && battle.round % 4 === 2) {
      state.party.filter(hero => hero.hp > 0).forEach(hero => {
        hero.statuses.crownHex = 2;
        hero.mp = Math.max(0, hero.mp - 5);
      });
      messages.push(`${enemy.name} invokes ${ability.name}, draining 5 MP and hexing the party.`);
      return true;
    }

    if (ability.type === 'mark' && !target.statuses.marked) {
      target.statuses.marked = 2;
      messages.push(`${enemy.name} places ${ability.name} on ${target.name}; follow-up attacks will hit harder.`);
      return true;
    }

    if (ability.type === 'mireBreath' && battle.round % 3 === 0) {
      let total = 0;
      livingHeroes().forEach(hero => {
        const damage = directDamage(enemy, hero, 0.58, 0.22);
        hero.hp = Math.max(0, hero.hp - damage);
        if (hero.hp > 0) hero.statuses.poison = Math.max(hero.statuses.poison || 0, 2);
        total += damage;
      });
      messages.push(`${enemy.name} exhales ${ability.name} for ${total} total damage and spreads poison.`);
      return true;
    }

    if (ability.type === 'bossWard' && battle.round % 4 === 1 && !enemy.statuses.enemyGuard) {
      enemy.statuses.enemyGuard = 2;
      enemy.statuses.ironroot = 2;
      messages.push(`${enemy.name} proclaims ${ability.name}, gaining a reinforced ward.`);
      return true;
    }

    return false;
  }

  function tickStatuses(messages) {
    state.party.forEach(hero => {
      if (hero.statuses.guard) hero.statuses.guard = Math.max(0, hero.statuses.guard - 1);
      if (hero.statuses.empower) hero.statuses.empower = Math.max(0, hero.statuses.empower - 1);
      if (hero.statuses.marked) {
        hero.statuses.marked -= 1;
        if (hero.statuses.marked <= 0) delete hero.statuses.marked;
      }
      if (hero.statuses.crownHex) {
        hero.statuses.crownHex -= 1;
        if (hero.statuses.crownHex <= 0) delete hero.statuses.crownHex;
      }
      if (hero.statuses.stagger) {
        hero.statuses.stagger -= 1;
        if (hero.statuses.stagger <= 0) delete hero.statuses.stagger;
      }
      if (hero.statuses.poison && hero.hp > 0) {
        const poisonDamage = Math.max(3, Math.round(hero.maxHp * 0.05));
        hero.hp = Math.max(0, hero.hp - poisonDamage);
        hero.statuses.poison -= 1;
        messages.push(`${hero.name} suffers ${poisonDamage} poison damage.`);
        if (hero.statuses.poison <= 0) delete hero.statuses.poison;
      }
    });

    battle.enemies.forEach(enemy => {
      for (const status of ['weaken', 'enemyGuard', 'ironroot']) {
        if (!enemy.statuses[status]) continue;
        enemy.statuses[status] -= 1;
        if (enemy.statuses[status] <= 0) delete enemy.statuses[status];
      }
    });
  }

  window.enemyPhase = function intelligentEnemyPhase() {
    if (!battle) return;
    const messages = [];

    for (const enemy of livingEnemies()) {
      if (!livingHeroes().length) break;
      const intent = enemy.intent || tactics.chooseIntent(enemy, 0, battle.round);
      const target = chooseTarget(enemy, intent);

      if (useSpeciesAbility(enemy, target, messages)) continue;

      if (intent.type === 'guard') {
        enemy.statuses.enemyGuard = 1;
        messages.push(`${enemy.name} braces behind a hardened stance.`);
        continue;
      }

      if (intent.type === 'wave') {
        let total = 0;
        livingHeroes().forEach(hero => {
          const damage = directDamage(enemy, hero, 0.68, 0.2);
          hero.hp = Math.max(0, hero.hp - damage);
          total += damage;
        });
        messages.push(`${enemy.name} unleashes a ruinous wave for ${total} total damage.`);
        continue;
      }

      const power = intent.type === 'heavy' ? 1.38 : intent.type === 'venom' ? 0.92 : 1;
      const damage = directDamage(enemy, target, power);
      target.hp = Math.max(0, target.hp - damage);
      messages.push(`${enemy.name} ${intent.type === 'heavy' ? 'crushes' : 'hits'} ${target.name} for ${damage}.`);

      const venomChance = intent.type === 'venom' ? Math.max(0.65, enemy.poisonChance || 0) : enemy.poisonChance || 0;
      if (venomChance && target.hp > 0 && Math.random() < venomChance) {
        target.statuses.poison = Math.max(target.statuses.poison || 0, 3);
        messages.push(`${target.name} is poisoned.`);
      }
    }

    tickStatuses(messages);

    if (state.party.every(hero => hero.hp <= 0)) {
      handleDefeat();
      return;
    }

    battle.round += 1;
    battle.heroIndex = state.party.findIndex(hero => hero.hp > 0 && !hero.statuses.stagger);
    if (battle.heroIndex < 0) battle.heroIndex = state.party.findIndex(hero => hero.hp > 0);
    battle.log = messages.join(' ');
    tactics.planEnemyIntents();
    saveGame();
    renderBattle();
  };

  window.AshenBattleAI = { ABILITIES, chooseTarget };
})();