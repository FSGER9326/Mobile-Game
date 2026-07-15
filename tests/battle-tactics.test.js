const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const enemy = {
  id: 'sentinel', name: 'Sentinel', hp: 100, maxHp: 100,
  attack: 12, defense: 20, statuses: {}, intent: { type: 'guard', label: 'Brace' }
};
const hero = {
  id: 'kael', name: 'Kael', hp: 100, maxHp: 100,
  mp: 20, maxMp: 20, attack: 24, defense: 12, statuses: {}
};
const secondHero = {
  id: 'lyra', name: 'Lyra', hp: 80, maxHp: 80,
  mp: 30, maxMp: 30, attack: 18, defense: 9, statuses: {}
};

const sandbox = {
  console,
  Math,
  window: {},
  battle: { enemies: [enemy], round: 1, heroIndex: 0, log: '' },
  state: { party: [hero, secondHero] },
  startBattle() {},
  calculateDamage: () => 40,
  enemyCard: currentEnemy => `<div class="enemy-card"><h3>${currentEnemy.name}</h3></div>`,
  livingEnemies: () => enemy.hp > 0 ? [enemy] : [],
  livingHeroes: () => sandbox.state.party.filter(member => member.hp > 0),
  renderBattle() {},
  saveGame() {},
  handleDefeat() { throw new Error('Unexpected defeat'); }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
const source = path.join(__dirname, '..', 'src', 'battle-tactics.js');
vm.runInContext(fs.readFileSync(source, 'utf8'), sandbox, { filename: source });

sandbox.enemyPhase();
assert.equal(enemy.statuses.enemyGuard, 1, 'Brace must remain active for the following hero turn');
assert.equal(sandbox.calculateDamage(hero, enemy, 1, false, false), 20, 'Brace must halve physical damage');
assert.equal(sandbox.calculateDamage(hero, enemy, 1, true, false), 29, 'Brace must reduce magic damage to 72%');
assert.equal(sandbox.calculateDamage(hero, enemy, 1, false, true), 40, 'Piercing attacks must bypass Brace');

sandbox.battle.round = 1;
enemy.defense = 5;
enemy.attack = 20;
enemy.intent = null;
sandbox.AshenBattleTactics.planEnemyIntents();
assert.equal(enemy.intent.type, 'attack', 'Round one should produce a normal attack for this enemy');
assert.equal(enemy.intent.targetHeroId, hero.id, 'Intent planning must lock a deterministic living target');
assert.equal(enemy.intent.targetName, hero.name, 'Intent planning must expose the target name for UI rendering');
assert.match(sandbox.enemyCard(enemy, 0), /Attack[\s\S]*Kael/, 'Enemy card must display intent and target');
assert.equal(sandbox.AshenBattleTactics.chooseIntentTarget(1, 1), secondHero, 'Target rotation must distribute threats across living heroes');

const lockedIntent = { type: 'heavy', targetHeroId: secondHero.id };
assert.equal(sandbox.AshenBattleTactics.resolveIntentTarget(lockedIntent, [hero, secondHero]), secondHero, 'Living locked targets must be preserved');
secondHero.hp = 0;
assert.equal(sandbox.AshenBattleTactics.resolveIntentTarget(lockedIntent, [hero]), hero, 'Defeated locked targets must safely retarget');

console.log('battle tactics tests passed');
