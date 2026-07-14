function startBattle(encounter) {
  stopMovement();
  mode = 'battle';
  const enemies = encounter.enemies.map((id, index) => {
    const template = ENEMIES[id];
    return {
      uid: `${encounter.id}-${index}`,
      id,
      ...template,
      hp: template.maxHp,
      statuses: {}
    };
  });
  battle = {
    encounter,
    enemies,
    heroIndex: 0,
    round: 1,
    log: encounter.boss ? `${enemies[0].name} bars the way.` : 'Hostile shapes close in.',
    pending: null
  };
  state.party.forEach(hero => { hero.statuses.guard = 0; });
  renderBattle();
}

function livingHeroes() { return state.party.filter(hero => hero.hp > 0); }
function livingEnemies() { return battle.enemies.filter(enemy => enemy.hp > 0); }

function currentHero() {
  return state.party[battle.heroIndex];
}

function renderBattle() {
  updateHud();
  const hero = currentHero();
  const canFlee = !battle.encounter.boss;
  setOverlay(`<div class="screen"><div class="window frame battle-window">
    <div class="battle-header"><div><h2>${battle.encounter.boss ? 'BOSS — ' : ''}${MAPS[state.map].name}</h2><div class="battle-log">${battle.log}</div></div><div><b>Round ${battle.round}</b></div></div>
    <div class="grid enemy-grid">${battle.enemies.map((enemy, index) => enemyCard(enemy, index)).join('')}</div>
    <div class="turn-banner"><b>${hero.name}</b> · ${hero.className} — HP ${hero.hp}/${hero.maxHp}, MP ${hero.mp}/${hero.maxMp}${hero.statuses.poison ? ' · <span style="color:#9fd47f">Poisoned</span>' : ''}</div>
    <div class="grid command-grid">
      <button class="ui-button" data-command="attack">Attack</button>
      <button class="ui-button" data-command="skills">Skills</button>
      <button class="ui-button" data-command="items">Items</button>
      <button class="ui-button" data-command="guard">Guard</button>
      <button class="ui-button secondary" data-command="inspect">Inspect</button>
      <button class="ui-button secondary" data-command="flee" ${canFlee ? '' : 'disabled'}>Flee</button>
    </div>
  </div></div>`);
  overlay.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => handleBattleCommand(button.dataset.command)));
}

function enemyCard(enemy, index, targetable = false) {
  const hpPct = Math.max(0, enemy.hp / enemy.maxHp * 100);
  return `<div class="card enemy-card ${enemy.boss ? 'boss' : ''} ${enemy.hp <= 0 ? 'dead' : ''} ${targetable && enemy.hp > 0 ? 'targetable' : ''}" data-enemy="${index}"><h3>${enemy.name}</h3><div class="stat-line"><span>HP</span><b>${Math.max(0, enemy.hp)}/${enemy.maxHp}</b></div><div class="bar"><i style="width:${hpPct}%"></i></div>${enemy.statuses.weaken ? '<div class="muted">Weakened</div>' : ''}</div>`;
}

function handleBattleCommand(command) {
  const hero = currentHero();
  if (command === 'attack') {
    chooseEnemyTarget('Choose a target for Attack.', enemy => executeHeroAction({ type: 'attack', hero, enemy }));
  } else if (command === 'skills') {
    renderSkillMenu(hero);
  } else if (command === 'items') {
    renderBattleItemMenu(hero);
  } else if (command === 'guard') {
    hero.statuses.guard = 1;
    battle.log = `${hero.name} takes a guarded stance.`;
    advanceHeroTurn();
  } else if (command === 'inspect') {
    const details = livingEnemies().map(enemy => `${enemy.name}: ATK ${enemy.attack}, DEF ${enemy.defense}, AGI ${enemy.agility}`).join('<br>');
    battle.log = details;
    renderBattle();
  } else if (command === 'flee' && !battle.encounter.boss) {
    if (Math.random() < 0.78) {
      battle = null;
      mode = 'world';
      setOverlay();
      state.x = Math.max(1, state.x - 1);
      showToast('The party escaped.');
      saveGame();
    } else {
      battle.log = 'The retreat is cut off!';
      enemyPhase();
    }
  }
}

function renderSkillMenu(hero) {
  const unlocked = hero.skillIds.map(id => ({ id, ...SKILLS[id] })).filter(skill => hero.level >= skill.level);
  setOverlay(`<div class="screen"><div class="window frame battle-window"><h2>${hero.name} — Skills</h2><div class="grid skill-grid">${unlocked.map(skill => `<button class="ui-button skill-button" data-skill="${skill.id}" ${hero.mp < skill.cost ? 'disabled' : ''}><b>${skill.name}</b> — ${skill.cost} MP<small>${skill.description}</small></button>`).join('')}</div><br><button class="ui-button secondary" id="battle-back">Back</button></div></div>`);
  overlay.querySelectorAll('[data-skill]').forEach(button => button.addEventListener('click', () => selectSkill(hero, button.dataset.skill)));
  document.querySelector('#battle-back').addEventListener('click', renderBattle);
}

function selectSkill(hero, skillId) {
  const skill = SKILLS[skillId];
  if (hero.mp < skill.cost) return;
  if (skill.target === 'enemy') chooseEnemyTarget(`Choose a target for ${skill.name}.`, enemy => executeHeroAction({ type: 'skill', hero, enemy, skillId }));
  else if (skill.target === 'ally') chooseAllyTarget(`Choose an ally for ${skill.name}.`, ally => executeHeroAction({ type: 'skill', hero, ally, skillId }));
  else executeHeroAction({ type: 'skill', hero, skillId });
}

function chooseEnemyTarget(title, onChoose) {
  setOverlay(`<div class="screen"><div class="window frame battle-window"><h2 class="target-title">${title}</h2><div class="grid enemy-grid">${battle.enemies.map((enemy, index) => enemyCard(enemy, index, true)).join('')}</div><button class="ui-button secondary" id="target-back">Back</button></div></div>`);
  overlay.querySelectorAll('[data-enemy]').forEach(card => {
    const enemy = battle.enemies[Number(card.dataset.enemy)];
    if (enemy.hp > 0) card.addEventListener('click', () => onChoose(enemy));
  });
  document.querySelector('#target-back').addEventListener('click', renderBattle);
}

function chooseAllyTarget(title, onChoose) {
  setOverlay(`<div class="screen"><div class="window frame battle-window"><h2>${title}</h2><div class="grid party-grid">${state.party.map((hero, index) => `<button class="ui-button skill-button" data-ally="${index}" ${hero.hp <= 0 ? 'disabled' : ''}><b>${hero.name}</b><small>HP ${hero.hp}/${hero.maxHp} · MP ${hero.mp}/${hero.maxMp}</small></button>`).join('')}</div><br><button class="ui-button secondary" id="target-back">Back</button></div></div>`);
  overlay.querySelectorAll('[data-ally]').forEach(button => button.addEventListener('click', () => onChoose(state.party[Number(button.dataset.ally)])));
  document.querySelector('#target-back').addEventListener('click', renderBattle);
}

function renderBattleItemMenu(hero) {
  const usable = Object.entries(state.inventory).filter(([, count]) => count > 0);
  setOverlay(`<div class="screen"><div class="window frame battle-window"><h2>Items</h2><div class="grid item-grid">${usable.map(([id, count]) => `<button class="ui-button skill-button" data-item="${id}"><b>${ITEMS[id].name} ×${count}</b><small>${ITEMS[id].description}</small></button>`).join('') || '<p>No usable items remain.</p>'}</div><br><button class="ui-button secondary" id="battle-back">Back</button></div></div>`);
  overlay.querySelectorAll('[data-item]').forEach(button => button.addEventListener('click', () => selectBattleItem(hero, button.dataset.item)));
  document.querySelector('#battle-back').addEventListener('click', renderBattle);
}

function selectBattleItem(hero, itemId) {
  if ((state.inventory[itemId] || 0) <= 0) return;
  if (itemId === 'bomb') {
    state.inventory[itemId] -= 1;
    battle.enemies.filter(enemy => enemy.hp > 0).forEach(enemy => enemy.hp = Math.max(0, enemy.hp - 52));
    battle.log = `${hero.name} hurls a Cinder Bomb for 52 damage to all enemies.`;
    checkBattleResolution() || advanceHeroTurn();
  } else {
    chooseAllyTarget(`Use ${ITEMS[itemId].name} on whom?`, ally => {
      if (itemId === 'potion') ally.hp = Math.min(ally.maxHp, ally.hp + 80);
      if (itemId === 'ether') ally.mp = Math.min(ally.maxMp, ally.mp + 32);
      if (itemId === 'antidote') delete ally.statuses.poison;
      state.inventory[itemId] -= 1;
      battle.log = `${hero.name} uses ${ITEMS[itemId].name} on ${ally.name}.`;
      advanceHeroTurn();
    });
  }
}

function executeHeroAction(action) {
  const { hero } = action;
  if (action.type === 'attack') {
    const damage = calculateDamage(hero, action.enemy, 1, false, false);
    action.enemy.hp = Math.max(0, action.enemy.hp - damage);
    battle.log = `${hero.name} strikes ${action.enemy.name} for ${damage} damage.`;
  } else if (action.type === 'skill') {
    const skill = SKILLS[action.skillId];
    hero.mp -= skill.cost;
    if (skill.target === 'enemy') {
      const damage = calculateDamage(hero, action.enemy, skill.power || 1, skill.magic, skill.pierce);
      action.enemy.hp = Math.max(0, action.enemy.hp - damage);
      battle.log = `${hero.name} uses ${skill.name} for ${damage} damage.`;
      if (skill.effect === 'weaken') action.enemy.statuses.weaken = 2;
      if (skill.effect === 'selfGuard') hero.statuses.guard = 1;
    } else if (skill.target === 'ally') {
      const amount = skill.heal + hero.level * 5;
      action.ally.hp = Math.min(action.ally.maxHp, action.ally.hp + amount);
      battle.log = `${hero.name} restores ${amount} HP to ${action.ally.name}.`;
    } else if (skill.target === 'allEnemies') {
      let total = 0;
      livingEnemies().forEach(enemy => {
        const damage = calculateDamage(hero, enemy, skill.power || 1, skill.magic, skill.pierce);
        enemy.hp = Math.max(0, enemy.hp - damage);
        total += damage;
      });
      battle.log = `${hero.name} uses ${skill.name}, dealing ${total} total damage.`;
    } else if (skill.target === 'allAllies') {
      if (skill.heal) {
        state.party.filter(ally => ally.hp > 0).forEach(ally => ally.hp = Math.min(ally.maxHp, ally.hp + skill.heal + hero.level * 3));
        battle.log = `${hero.name} raises ${skill.name} across the party.`;
      }
      if (skill.effect === 'guardParty') {
        state.party.filter(ally => ally.hp > 0).forEach(ally => ally.statuses.guard = 1);
        battle.log = `${hero.name} conceals the party in ${skill.name}.`;
      }
    } else if (skill.target === 'self' && skill.effect === 'ironVow') {
      hero.statuses.guard = 2;
      hero.statuses.empower = 2;
      battle.log = `${hero.name} invokes the Iron Vow.`;
    }
  }
  if (!checkBattleResolution()) advanceHeroTurn();
}

function calculateDamage(attacker, defender, power = 1, magic = false, pierce = false) {
  const attack = attacker.attack * (attacker.statuses?.empower ? 1.25 : 1);
  const defenseFactor = pierce || magic ? 0.15 : 0.55;
  const variance = 0.9 + Math.random() * 0.2;
  return Math.max(1, Math.round((attack * power - defender.defense * defenseFactor) * variance));
}
