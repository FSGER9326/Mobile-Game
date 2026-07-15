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

const sandbox = {
  console,
  Math,
  window: {},
  battle: { enemies: [enemy], round: 1, heroIndex: 0, log: '' },
  state: { party: [hero] },
  startBattle() {},
  calculateDamage: () => 40,
  livingEnemies: () => enemy.hp > 0 ? [enemy] : [],
  livingHeroes: () => hero.hp > 0 ? [hero] : [],
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

console.log('battle tactics tests passed');
