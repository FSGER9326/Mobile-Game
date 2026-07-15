const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const noop = () => {};
const gradient = { addColorStop: noop };
const ctx = new Proxy({ createLinearGradient: () => gradient, createRadialGradient: () => gradient }, {
  get(target, prop) { return prop in target ? target[prop] : noop; },
  set(target, prop, value) { target[prop] = value; return true; }
});
const context = {
  console, Math, WIDTH: 960, HEIGHT: 540, TILE: 32, frameTime: 1000,
  ctx, mode: 'world',
  state: {
    map: 'outskirts', x: 10, y: 10, facing: 'down', protagonist: { classId: 'ashblade' }, upgrades: { weapon: 2 },
    party: [
      { id: 'kael', hp: 10, color: '#b65755', weaponLevel: 2 },
      { id: 'lyra', hp: 10, color: '#557bb9', weaponLevel: 1 }
    ],
    flags: {}, sideScout: 0, mainStage: 1
  },
  trail: [{ x: 9, y: 10, facing: 'right' }],
  visibleNpcs: () => [{ id: 'mira', role: 'rhea', x: 14, y: 10, color: '#c78663' }],
  drawWorld() {}, document: { querySelectorAll: () => [] }, window: { AshenArt: { drawCreatorPreview() {} } }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname + '/../src/weapon-art-v4.js', 'utf8'), context);
assert.equal(typeof context.drawWorld, 'function');
assert.equal(typeof context.window.AshenArt.drawCreatorPreview, 'function');
assert.doesNotThrow(() => context.drawWorld(1000));
console.log('weapon art tests passed');