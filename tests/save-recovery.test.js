const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const MAPS = {
  village: { grid: ['#####', '#...#', '#.~.#', '#...#', '#####'] },
  sealed: { grid: ['###', '###', '###'] }
};
const HERO_TEMPLATES = {
  kael: { name: 'Kael', maxHp: 100, maxMp: 20, attack: 10, defense: 8, agility: 7, skillIds: ['slash'] },
  lyra: { name: 'Lyra', maxHp: 80, maxMp: 40, attack: 8, defense: 5, agility: 9, skillIds: ['mend'] },
  rowan: { name: 'Rowan', maxHp: 90, maxMp: 25, attack: 9, defense: 6, agility: 10, skillIds: ['shot'] },
  mira: { name: 'Mira', maxHp: 95, maxMp: 30, attack: 9, defense: 7, agility: 8, skillIds: ['ward'] }
};
const storage = new Map();
const context = {
  MAPS,
  HERO_TEMPLATES,
  SKILLS: { slash: {}, mend: {}, shot: {}, ward: {} },
  NPCS: { village: [{ x: 1, y: 1 }] },
  ENCOUNTERS: { village: [{ x: 2, y: 1 }] },
  normalizeState: raw => raw,
  newState: () => ({ map: 'village', x: 3, y: 3, gold: 45, party: [{ id: 'kael' }] }),
  xpNeeded: level => level * 100,
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  },
  SAVE_KEY: 'save',
  OLD_SAVE_KEY: 'old',
  stopMovement() {},
  mode: 'title',
  hud: { classList: { add() {} } },
  setOverlay() {},
  document: { querySelector() { return null; } },
  showTitle() {},
  saveGame() {},
  migrateOldSave: value => value,
  console,
  window: {}
};

vm.createContext(context);
vm.runInContext(fs.readFileSync('src/save-recovery.js', 'utf8'), context);
const api = context.window.AshenSaveRecovery;
const plain = value => JSON.parse(JSON.stringify(value));

assert.deepStrictEqual(plain(api.nearestSafePosition('village', 1, 1, 3, 3)), { x: 1, y: 2 });
assert.deepStrictEqual(plain(api.nearestSafePosition('village', 2, 2, 3, 3)), { x: 1, y: 2 });
assert.deepStrictEqual(plain(api.nearestSafePosition('village', -99, 99, 3, 3)), { x: 1, y: 3 });
assert.strictEqual(api.isSafeRecoveryPosition('village', 3, 3), true);
assert.strictEqual(api.isSafeRecoveryPosition('village', 2, 2), false);

const repaired = api.sanitizeRawState({
  map: 'village',
  x: 2,
  y: 2,
  party: [{ id: 'kael', hp: 999, maxHp: 100 }]
});
assert.deepStrictEqual({ x: repaired.x, y: repaired.y }, { x: 1, y: 2 });
assert.strictEqual(repaired.party[0].hp, 100);
assert.throws(() => api.nearestSafePosition('sealed', 1, 1, 1, 1), /no safe recovery position/);

console.log('save recovery tests passed');
