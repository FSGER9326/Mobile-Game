const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const grid = value => value.trim().split('\n').map(row => row.trim());
const makeBaseState = () => ({ version: 2, mainStage: 0, map: 'village', x: 14, y: 15, flags: {}, inventory: { potion: 4, bomb: 0 }, gold: 45, party: [], collected: [], shards: 0, sideScout: 0 });
const context = {
  console, Math, Date, JSON, setTimeout: fn => fn(),
  MAPS: {
    village: { exits: [{ x: 14, y: 17, to: 'forest', tx: 14, ty: 1, stage: 1 }, { x: 29, y: 12, to: 'causeway', tx: 1, ty: 12, stage: 5 }] },
    forest: { exits: [{ x: 14, y: 0, to: 'village', tx: 14, ty: 16 }, { x: 18, y: 16, to: 'shrine', tx: 14, ty: 16 }] },
    shrine: {}, gate: {}
  },
  ENCOUNTERS: { shrine: [{ id: 'crownshade', stage: 2 }], gate: [{ id: 'iron-warden', stage: 5 }] },
  NPCS: { village: [], gate: [{ id: 'captain', visible: state => state.mainStage >= 6 }] },
  INTERACTABLES: {}, MAIN_OBJECTIVES: {}, mapFrom: grid,
  state: null, battle: null, mode: 'title', trail: [],
  hud: { classList: { remove() {} } }, document: { querySelector() { return null; } },
  newState: makeBaseState,
  normalizeState(raw) { return { ...makeBaseState(), ...raw, flags: { ...(raw.flags || {}) }, inventory: { potion: 4, bomb: 0, ...(raw.inventory || {}) } }; },
  migrateOldSave(raw) { return { ...makeBaseState(), ...raw }; },
  changeMap(exit) { this.state.map = exit.to; this.state.x = exit.tx; this.state.y = exit.ty; },
  interactNpc() {}, showTitle() {}, enterWorld() {}, handleVictory() {}, journalMenuHtml() { return ''; }, collectShard() {},
  showDialogue() {}, showToast() {}, saveGame() {}, updateHud() {}, addItem() {}, setOverlay() {}, showLocation() {}, visibleNpcs() { return []; }, objectiveText() { return ''; }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname + '/../src/opening-expansion.js', 'utf8'), context);

assert.equal(context.MAPS.outskirts.grid.length, 18);
assert(context.MAPS.outskirts.grid.every(row => row.length === 30));
assert.equal(context.MAPS.village.exits[0].to, 'outskirts');
assert.equal(context.MAPS.forest.exits[0].to, 'outskirts');
assert.equal(context.ENCOUNTERS.shrine[0].stage, 4);
assert.equal(context.ENCOUNTERS.gate[0].stage, 6);
for (const encounter of context.ENCOUNTERS.outskirts) {
  assert.notEqual(context.MAPS.outskirts.grid[encounter.y][encounter.x], '#', `${encounter.id} must be on a passable tile`);
  assert.notEqual(context.MAPS.outskirts.grid[encounter.y][encounter.x], '~', `${encounter.id} must not spawn in water`);
}
assert.equal(context.MAPS.outskirts.exits.length, 4);
const migrated = context.normalizeState({ version: 2, mainStage: 4, map: 'village', flags: {}, inventory: {} });
assert.equal(migrated.mainStage, 5);
assert.equal(migrated.version, 3);
assert.equal(migrated.flags.openingExpansionVersion, 1);
const legacy = context.migrateOldSave({ version: 1, mainStage: 4, map: 'village' });
assert.equal(legacy.mainStage, 5);
assert.equal(legacy.flags.openingExpansionVersion, 1);
const fresh = context.newState();
assert.equal(fresh.inventory.potion, 5);
assert.equal(fresh.inventory.bomb, 1);
console.log('opening expansion tests passed');