const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const overlay = document.querySelector('#overlay');
const hud = document.querySelector('#hud');
const partyHud = document.querySelector('#party-hud');
const objectiveHud = document.querySelector('#objective-hud');
const toastEl = document.querySelector('#toast');
const locationBanner = document.querySelector('#location-banner');
const menuButton = document.querySelector('#menu-button');
const actionButton = document.querySelector('#action-button');
const dashButton = document.querySelector('#dash-button');

const WIDTH = 960;
const HEIGHT = 540;
const TILE = 32;
const COLS = 30;
const ROWS = 18;
const SAVE_KEY = 'ashen-crown-save-v2';
const OLD_SAVE_KEY = 'ac-save';

const mapFrom = value => value.trim().split('\n').map(row => row.trim());

const MAPS = {
  village: {
    name: 'Emberfall Village',
    subtitle: 'Last hearth beneath the dead stars',
    palette: { ground: '#6b5745', ground2: '#735f4d', wall: '#252c39', water: '#265a68', path: '#988166' },
    grid: mapFrom(`
##############################
#............................#
#..####..............####....#
#..#..#..............#..#....#
#..####......====....####....#
#............=..=............#
#....~~~~....====............#
#....~~~~....................#
#..............####..........#
#..............#..#..........#
#..####........####.....####.#
#..#..#.................#..#.#
#..####.................####..
#............................#
#...........======...........#
#............................#
#............................#
##############..##############`),
    exits: [
      { x: 14, y: 17, to: 'forest', tx: 14, ty: 1, stage: 1 },
      { x: 15, y: 17, to: 'forest', tx: 15, ty: 1, stage: 1 },
      { x: 29, y: 12, to: 'causeway', tx: 1, ty: 12, stage: 5 }
    ]
  },
  forest: {
    name: 'Moonroot Forest',
    subtitle: 'Where the old light bleeds through',
    palette: { ground: '#2f4a38', ground2: '#365441', wall: '#202b2b', water: '#23596b', path: '#6f6a50' },
    grid: mapFrom(`
##############..##############
#............................#
#..###....#####........###...#
#..#.#........#........#.#...#
#..###........#........###...#
#............#....~~~~.......#
#..####...........~~~~..####.#
#.....#..........~~~~......#.#
#.....#..###...............#.#
#..~~~~..#.#....######.....#.#
#..~~~~..###....#............#
#..~~~~....######............#
#............................#
#...######...................#
#........#...................#
#........#...................#
#.................>..........#
##############################`),
    exits: [
      { x: 14, y: 0, to: 'village', tx: 14, ty: 16 },
      { x: 15, y: 0, to: 'village', tx: 15, ty: 16 },
      { x: 18, y: 16, to: 'shrine', tx: 14, ty: 16, requires: state => state.shards >= 3, blocked: 'Three Moonshards are required to wake the sealed stair.' }
    ]
  },
  shrine: {
    name: 'The Sunken Shrine',
    subtitle: 'A grave for the first crown',
    palette: { ground: '#343748', ground2: '#3a3c50', wall: '#1f2230', water: '#294e66', path: '#67677c' },
    grid: mapFrom(`
##############################
#............####............#
#............................#
#............................#
#............................#
#............................#
#.....##################.....#
#.....#................#.....#
#.....#................#.....#
#.....#................#.....#
#.....#................#.....#
#.....#................#.....#
#.....########..########.....#
#............................#
#............................#
#............................#
#............................#
##############..##############`),
    exits: [
      { x: 14, y: 17, to: 'forest', tx: 18, ty: 15 },
      { x: 15, y: 17, to: 'forest', tx: 18, ty: 15 }
    ]
  },
  causeway: {
    name: 'Ruined Causeway',
    subtitle: 'The road beyond the wardstones',
    palette: { ground: '#4b493f', ground2: '#555147', wall: '#292b30', water: '#2d5660', path: '#77705e' },
    grid: mapFrom(`
##############################
#............................#
#....~~~~..............~~~~..#
#....~~~~..######......~~~~..#
#..........#....#............#
#..######..#....#..######....#
#..........######............#
#............................#
#....########....########....#
#............................#
#..~~~~................~~~~..#
#..~~~~......======....~~~~..#
..............................
#..~~~~......======....~~~~..#
#..~~~~................~~~~..#
#............................#
#............................#
##############################`),
    exits: [
      { x: 0, y: 12, to: 'village', tx: 28, ty: 12 },
      { x: 29, y: 12, to: 'gate', tx: 1, ty: 12 }
    ]
  },
  gate: {
    name: 'Ironroot Gate',
    subtitle: 'Threshold of the northern dominion',
    palette: { ground: '#50483f', ground2: '#5b5147', wall: '#24262d', water: '#274d57', path: '#81705d' },
    grid: mapFrom(`
##############################
#............................#
#...........######...........#
#...........#....#...........#
#...........#....#...........#
#...........######...........#
#............................#
#....####............####....#
#....#..#............#..#....#
#....####............####....#
#............................#
#...........======...........#
..............................
#...........======...........#
#............................#
#............................#
#............................#
##############################`),
    exits: [
      { x: 0, y: 12, to: 'causeway', tx: 28, ty: 12 }
    ]
  }
};

for (const [id, map] of Object.entries(MAPS)) {
  if (map.grid.length !== ROWS || map.grid.some(row => row.length !== COLS)) {
    throw new Error(`Invalid map dimensions: ${id}`);
  }
}

const HERO_TEMPLATES = {
  kael: {
    id: 'kael', name: 'Kael', className: 'Ashblade', color: '#b65755',
    maxHp: 138, maxMp: 30, attack: 25, defense: 16, agility: 15,
    skillIds: ['emberSlash', 'ironVow', 'cleave']
  },
  lyra: {
    id: 'lyra', name: 'Lyra', className: 'Moon Cantor', color: '#557bb9',
    maxHp: 96, maxMp: 54, attack: 19, defense: 11, agility: 18,
    skillIds: ['moonbolt', 'mend', 'starfall']
  },
  rowan: {
    id: 'rowan', name: 'Rowan', className: 'Thorn Ranger', color: '#5a9268',
    maxHp: 116, maxMp: 38, attack: 22, defense: 13, agility: 23,
    skillIds: ['piercingShot', 'smokeVeil', 'volley']
  },
  mira: {
    id: 'mira', name: 'Mira', className: 'Ward Seeker', color: '#9b75b8',
    maxHp: 124, maxMp: 42, attack: 23, defense: 15, agility: 20,
    skillIds: ['wardSlash', 'spiritSeal', 'moonWard']
  }
};

const SKILLS = {
  emberSlash: { name: 'Ember Slash', cost: 5, level: 1, target: 'enemy', power: 1.65, description: 'A searing single-target strike.' },
  ironVow: { name: 'Iron Vow', cost: 7, level: 2, target: 'self', effect: 'ironVow', description: 'Guard and empower Kael for two turns.' },
  cleave: { name: 'Cinder Cleave', cost: 10, level: 3, target: 'allEnemies', power: 1.08, description: 'A broad attack against every enemy.' },
  moonbolt: { name: 'Moonbolt', cost: 5, level: 1, target: 'enemy', power: 1.75, magic: true, description: 'Focused lunar damage that pierces armor.' },
  mend: { name: 'Mend', cost: 7, level: 1, target: 'ally', heal: 72, description: 'Restore one ally’s HP.' },
  starfall: { name: 'Starfall', cost: 13, level: 3, target: 'allEnemies', power: 1.3, magic: true, description: 'Call falling light upon all enemies.' },
  piercingShot: { name: 'Piercing Shot', cost: 5, level: 1, target: 'enemy', power: 1.55, pierce: true, description: 'A precise shot that ignores most defense.' },
  smokeVeil: { name: 'Smoke Veil', cost: 8, level: 2, target: 'allAllies', effect: 'guardParty', description: 'Reduce the next incoming hit to each ally.' },
  volley: { name: 'Briar Volley', cost: 11, level: 3, target: 'allEnemies', power: 1.0, description: 'Loose a fast volley at all enemies.' },
  wardSlash: { name: 'Ward Slash', cost: 5, level: 1, target: 'enemy', power: 1.48, effect: 'selfGuard', description: 'Strike while raising a brief ward.' },
  spiritSeal: { name: 'Spirit Seal', cost: 8, level: 2, target: 'enemy', power: 1.2, effect: 'weaken', description: 'Damage and weaken an enemy’s attack.' },
  moonWard: { name: 'Moon Ward', cost: 11, level: 3, target: 'allAllies', heal: 38, description: 'Restore HP to the entire party.' }
};

const ENEMIES = {
  gloomRat: { name: 'Gloom Rat', maxHp: 46, attack: 13, defense: 5, agility: 17, xp: 18, gold: 8, color: '#876266' },
  ashHusk: { name: 'Ash Husk', maxHp: 68, attack: 17, defense: 10, agility: 8, xp: 26, gold: 12, color: '#7b665c' },
  moonWisp: { name: 'Moon Wisp', maxHp: 54, attack: 18, defense: 6, agility: 22, xp: 30, gold: 16, color: '#77a7c6', magic: true },
  briarWolf: { name: 'Briar Wolf', maxHp: 84, attack: 21, defense: 8, agility: 24, xp: 38, gold: 18, color: '#6e7655', poisonChance: 0.22 },
  brokenSentinel: { name: 'Broken Sentinel', maxHp: 126, attack: 24, defense: 16, agility: 9, xp: 58, gold: 28, color: '#756e79' },
  crownshade: { name: 'Crownshade Vhal', maxHp: 470, attack: 31, defense: 14, agility: 17, xp: 240, gold: 250, color: '#9a6ccc', boss: true },
  roadReaver: { name: 'Road Reaver', maxHp: 112, attack: 27, defense: 13, agility: 18, xp: 62, gold: 34, color: '#9a6654' },
  mireDrake: { name: 'Mire Drake', maxHp: 145, attack: 29, defense: 15, agility: 13, xp: 78, gold: 42, color: '#607d62' },
  ironWarden: { name: 'Ironroot Warden', maxHp: 610, attack: 36, defense: 20, agility: 14, xp: 360, gold: 420, color: '#a8795d', boss: true }
};

const ENCOUNTERS = {
  forest: [
    { id: 'forest-rats', x: 8, y: 5, enemies: ['gloomRat', 'gloomRat'] },
    { id: 'forest-husks', x: 22, y: 8, enemies: ['ashHusk', 'moonWisp'] },
    { id: 'forest-wolf', x: 5, y: 14, enemies: ['briarWolf', 'briarWolf'] },
    { id: 'forest-deep', x: 25, y: 13, enemies: ['briarWolf', 'moonWisp'] }
  ],
  shrine: [
    { id: 'shrine-entry', x: 8, y: 10, enemies: ['brokenSentinel', 'moonWisp'] },
    { id: 'shrine-guard', x: 21, y: 14, enemies: ['brokenSentinel', 'ashHusk'] },
    { id: 'crownshade', x: 14, y: 4, enemies: ['crownshade'], boss: true, stage: 2 }
  ],
  causeway: [
    { id: 'causeway-reavers', x: 8, y: 12, enemies: ['roadReaver', 'roadReaver'] },
    { id: 'causeway-drake', x: 18, y: 7, enemies: ['mireDrake', 'moonWisp'] },
    { id: 'causeway-ambush', x: 23, y: 13, enemies: ['roadReaver', 'briarWolf', 'roadReaver'] }
  ],
  gate: [
    { id: 'iron-warden', x: 23, y: 12, enemies: ['ironWarden'], boss: true, stage: 5 }
  ]
};

const NPCS = {
  village: [
    { id: 'elder', name: 'Elder Maelin', x: 15, y: 11, color: '#d9c29d' },
    { id: 'merchant', name: 'Tovin', x: 7, y: 11, color: '#d2a26e' },
    { id: 'smith', name: 'Hara', x: 23, y: 11, color: '#bd7665' },
    { id: 'edda', name: 'Edda', x: 5, y: 5, color: '#8fb2a4' }
  ],
  forest: [
    { id: 'mira', name: 'Mira', x: 5, y: 15, color: '#9b75b8', visible: state => state.sideScout >= 1 && !state.flags.miraJoined }
  ],
  gate: [
    { id: 'captain', name: 'Captain Seln', x: 21, y: 12, color: '#b7a17f', visible: state => state.mainStage >= 6 }
  ]
};

const INTERACTABLES = {
  village: [
    { id: 'village-cache', type: 'chest', x: 26, y: 15, rewards: { potion: 2, ether: 1, gold: 35 } },
    { id: 'village-well', type: 'heal', x: 13, y: 6 }
  ],
  forest: [
    { id: 'shard-1', type: 'shard', x: 7, y: 5 },
    { id: 'shard-2', type: 'shard', x: 23, y: 11 },
    { id: 'shard-3', type: 'shard', x: 13, y: 12 },
    { id: 'forest-cache', type: 'chest', x: 5, y: 15, rewards: { potion: 2, ether: 1, bomb: 1, gold: 45 }, hiddenWhen: state => state.sideScout >= 1 && !state.flags.miraJoined },
    { id: 'forest-moonwell', type: 'heal', x: 16, y: 14 }
  ],
  shrine: [
    { id: 'shrine-cache', type: 'chest', x: 24, y: 14, rewards: { potion: 3, ether: 2, bomb: 2, gold: 110 } },
    { id: 'shrine-well', type: 'heal', x: 14, y: 13 }
  ],
  causeway: [
    { id: 'road-cache', type: 'chest', x: 13, y: 4, rewards: { potion: 2, antidote: 2, gold: 140 } },
    { id: 'road-shrine', type: 'heal', x: 15, y: 15 }
  ],
  gate: [
    { id: 'gate-cache', type: 'chest', x: 14, y: 4, rewards: { potion: 4, ether: 3, bomb: 2, gold: 180 } }
  ]
};

const ITEMS = {
  potion: { name: 'Potion', price: 18, description: 'Restore 80 HP to one ally.' },
  ether: { name: 'Ether', price: 28, description: 'Restore 32 MP to one ally.' },
  bomb: { name: 'Cinder Bomb', price: 42, description: 'Deal 52 damage to all enemies.' },
  antidote: { name: 'Antidote', price: 12, description: 'Remove poison from one ally.' }
};

const MAIN_OBJECTIVES = {
  0: 'Speak with Elder Maelin in Emberfall.',
  1: state => `Recover the Moonshards in Moonroot Forest (${state.shards}/3).`,
  2: 'Enter the Sunken Shrine beneath Moonroot.',
  3: 'Defeat Crownshade Vhal.',
  4: 'Return to Elder Maelin.',
  5: 'Cross the Ruined Causeway and reach Ironroot Gate.',
  6: 'Speak with Captain Seln.',
  7: 'Chapter complete — explore, train, and prepare.'
};

let state = null;
let mode = 'title';
let battle = null;
let installedPrompt = null;
let movementTimer = null;
let dashHeld = false;
let toastTimer = null;
let bannerTimer = null;
let frameTime = 0;
let trail = [];
