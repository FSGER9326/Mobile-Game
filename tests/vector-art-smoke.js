const fs = require('fs');
const vm = require('vm');
const path = require('path');

function gradient() { return { addColorStop() {} }; }
function context() {
  const target = {
    createLinearGradient: gradient,
    createRadialGradient: gradient,
    measureText: () => ({ width: 20 })
  };
  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      if (['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'shadowColor', 'shadowBlur', 'shadowOffsetY', 'font', 'textAlign', 'globalAlpha'].includes(prop)) return obj[prop];
      return () => {};
    },
    set(obj, prop, value) { obj[prop] = value; return true; }
  });
}
function canvas(width = 960, height = 540) {
  const ctx = context();
  const item = { width, height, dataset: {}, getContext: () => ctx };
  ctx.canvas = item;
  return item;
}

const mainCtx = context();
const portraits = [];
const boxed = palette => ({
  palette,
  grid: Array.from({ length: 18 }, (_, y) => y === 0 || y === 17 ? '#'.repeat(30) : `#${'.'.repeat(28)}#`)
});
const sandbox = {
  console,
  Math,
  Number,
  String,
  Uint8ClampedArray,
  document: {
    createElement: tag => tag === 'canvas' ? canvas() : {},
    querySelectorAll: selector => selector.includes('hero-portrait') ? portraits : []
  },
  window: {},
  ctx: mainCtx,
  WIDTH: 960,
  HEIGHT: 540,
  TILE: 32,
  frameTime: 0,
  mode: 'title',
  requestAnimationFrame() {},
  MAPS: {
    village: boxed({ ground: '#6b5745', ground2: '#735f4d', wall: '#252c39', water: '#265a68', path: '#988166' }),
    forest: boxed({ ground: '#2f4a38', ground2: '#365441', wall: '#202b2b', water: '#23596b', path: '#6f6a50' }),
    shrine: boxed({ ground: '#343748', ground2: '#3a3c50', wall: '#1f2230', water: '#294e66', path: '#67677c' }),
    causeway: boxed({ ground: '#4b493f', ground2: '#555147', wall: '#292b30', water: '#2d5660', path: '#77705e' }),
    gate: boxed({ ground: '#50483f', ground2: '#5b5147', wall: '#24262d', water: '#274d57', path: '#81705d' })
  },
  ENEMIES: {
    gloomRat: { color: '#876266' }, ashHusk: { color: '#7b665c' }, moonWisp: { color: '#77a7c6' },
    briarWolf: { color: '#6e7655' }, brokenSentinel: { color: '#756e79' }, crownshade: { color: '#9a6ccc' },
    roadReaver: { color: '#9a6654' }, mireDrake: { color: '#607d62' }, ironWarden: { color: '#a8795d' }
  },
  state: null,
  trail: [],
  visibleInteractables: () => [],
  availableEncounters: () => [],
  visibleNpcs: () => [],
  drawCharacter() {}, drawEnemy() {}, drawInteractable() {}, drawWorld() {}
};
sandbox.window = sandbox;
vm.createContext(sandbox);
const renderer = path.join(__dirname, '..', 'src', 'vector-art-v3.js');
vm.runInContext(fs.readFileSync(renderer, 'utf8'), sandbox, { filename: renderer });

sandbox.drawWorld(0);
sandbox.AshenArt.drawCreatorPreview(canvas(300, 360), {
  accent: '#b65755', skin: '#d8aa82', hair: '#332424', eyes: '#6e9fc4', hairStyle: 'short', body: 'athletic', classId: 'ashblade'
}, { color: '#b65755', baseId: 'kael', name: 'Ashblade', weapon: 'sword' });

sandbox.state = {
  map: 'forest', x: 15, y: 9, facing: 'down', collected: [],
  party: [{ id: 'kael', name: 'Aren', color: '#b65755', appearance: { accent: '#b65755', skin: '#d8aa82', hair: '#332424', eyes: '#6e9fc4', hairStyle: 'short', body: 'athletic', classId: 'ashblade' } }]
};
sandbox.mode = 'world';
sandbox.visibleInteractables = () => [{ id: 'shard', type: 'shard', x: 4, y: 4 }];
sandbox.availableEncounters = () => [{ enemies: ['gloomRat'], x: 5, y: 5 }];
sandbox.visibleNpcs = () => [{ id: 'elder', x: 6, y: 6, color: '#d9c29d' }];
sandbox.drawWorld(1000);
const hud = canvas(52, 52); hud.dataset.heroIndex = '0'; portraits.push(hud);
sandbox.AshenArt.drawHudPortraits();

console.log('vector art smoke test passed');
