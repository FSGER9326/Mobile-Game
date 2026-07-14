function advanceHeroTurn() {
  saveGame();
  let next = battle.heroIndex + 1;
  while (next < state.party.length && state.party[next].hp <= 0) next += 1;
  if (next >= state.party.length) enemyPhase();
  else {
    battle.heroIndex = next;
    renderBattle();
  }
}

function enemyPhase() {
  if (!battle) return;
  const messages = [];
  for (const enemy of livingEnemies()) {
    const targets = livingHeroes();
    if (!targets.length) break;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const weakenedMultiplier = enemy.statuses.weaken ? 0.72 : 1;
    const guardMultiplier = target.statuses.guard ? 0.46 : 1;
    let damage = Math.max(1, Math.round((enemy.attack * weakenedMultiplier - target.defense * 0.48) * (0.9 + Math.random() * 0.2) * guardMultiplier));

    if (enemy.boss && battle.round % 3 === 0) {
      let total = 0;
      livingHeroes().forEach(hero => {
        const aoeGuard = hero.statuses.guard ? 0.5 : 1;
        const aoe = Math.max(1, Math.round(enemy.attack * 0.62 * aoeGuard - hero.defense * 0.2));
        hero.hp = Math.max(0, hero.hp - aoe);
        total += aoe;
      });
      messages.push(`${enemy.name} unleashes a ruinous wave for ${total} total damage.`);
    } else {
      target.hp = Math.max(0, target.hp - damage);
      messages.push(`${enemy.name} hits ${target.name} for ${damage}.`);
      if (enemy.poisonChance && target.hp > 0 && Math.random() < enemy.poisonChance) {
        target.statuses.poison = 3;
        messages.push(`${target.name} is poisoned.`);
      }
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
  });

  if (state.party.every(hero => hero.hp <= 0)) {
    handleDefeat();
    return;
  }

  battle.round += 1;
  battle.heroIndex = state.party.findIndex(hero => hero.hp > 0);
  battle.log = messages.join(' ');
  renderBattle();
}

function checkBattleResolution() {
  if (livingEnemies().length > 0) return false;
  handleVictory();
  return true;
}

function handleVictory() {
  const encounter = battle.encounter;
  const defeatedEnemies = battle.enemies;
  const totalXp = defeatedEnemies.reduce((sum, enemy) => sum + enemy.xp, 0);
  const totalGold = defeatedEnemies.reduce((sum, enemy) => sum + enemy.gold, 0);
  state.defeated.push(encounter.id);
  state.gold += totalGold;
  const levelMessages = [];
  state.party.forEach(hero => {
    if (hero.hp <= 0) hero.hp = 1;
    hero.hp = Math.min(hero.maxHp, hero.hp + Math.round(hero.maxHp * 0.12));
    hero.mp = Math.min(hero.maxMp, hero.mp + Math.round(hero.maxMp * 0.14));
    hero.xp += totalXp;
    while (hero.xp >= hero.xpNext) {
      hero.xp -= hero.xpNext;
      levelUp(hero);
      levelMessages.push(`${hero.name} reached level ${hero.level}.`);
    }
  });

  if (encounter.id === 'crownshade') {
    state.mainStage = 4;
  }
  if (encounter.id === 'iron-warden') {
    state.mainStage = 6;
  }

  battle = null;
  saveGame();
  updateHud();
  mode = 'menu';
  setOverlay(`<div class="screen"><div class="window frame title-window"><div class="title-mark">VICTORY</div><p>Earned <b>${totalXp} XP</b> and <b>${totalGold} crowns</b>.</p>${levelMessages.length ? `<p style="color:#f2d49e">${levelMessages.join('<br>')}</p>` : ''}<button class="ui-button" id="victory-continue">Continue</button></div></div>`);
  document.querySelector('#victory-continue').addEventListener('click', () => {
    closeOverlayToWorld();
    if (encounter.id === 'crownshade') showDialogue('The First Crown', ['The Crownshade collapses into black glass. Far to the east, an ancient wardstone cracks.']);
    else if (encounter.id === 'iron-warden') showDialogue('Ironroot Gate', ['The Warden’s oath fades. A living voice calls from behind the gate.']);
  });
}

function levelUp(hero) {
  hero.level += 1;
  hero.xpNext = xpNeeded(hero.level);
  hero.maxHp += 14;
  hero.hp = hero.maxHp;
  hero.maxMp += 5;
  hero.mp = hero.maxMp;
  hero.attack += 3;
  hero.defense += 2;
  hero.agility += 2;
}

function handleDefeat() {
  battle = null;
  state.party.forEach(hero => {
    hero.hp = Math.max(1, Math.round(hero.maxHp * 0.6));
    hero.mp = Math.round(hero.maxMp * 0.5);
    hero.statuses = {};
  });
  state.gold = Math.max(0, state.gold - Math.min(35, Math.round(state.gold * 0.1)));
  state.map = 'village';
  state.x = 14;
  state.y = 15;
  saveGame();
  mode = 'dialogue';
  showDialogue('Defeat', ['The party awakens beside Emberfall’s hearth. Some crowns are missing, but the journey is not over.']);
}
