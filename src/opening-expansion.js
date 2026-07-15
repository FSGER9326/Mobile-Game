/* Ashen Crown opening expansion v1: Southroad Verge, onboarding, character beats, and save migration. */
(() => {
  'use strict';

  const EXPANSION_VERSION = 1;
  const baseNewState = newState;
  const baseNormalizeState = normalizeState;
  const baseMigrateOldSave = migrateOldSave;
  const baseChangeMap = changeMap;
  const baseInteractNpc = interactNpc;
  const baseShowTitle = showTitle;
  const baseHandleVictory = handleVictory;

  const SOUTHROAD_GRID = mapFrom(`
##############..##############
#............................#
#....####......==....####....#
#....#..#......==....#..#....#
#....####....~~~~....####....#
#............~~~~............#
#......====..................#
#............................#
#..######..........######....#
#............................#
#.............==.............#
#.............==.............#
#..####................####..#
#..#..#................#..#..#
#..####....~~~~........####..#
#..........~~~~..............#
#............................#
##############..##############`);

  MAPS.outskirts = {
    name: 'Southroad Verge',
    subtitle: 'Windbent camp beyond Emberfall',
    palette: { ground: '#516245', ground2: '#5d6d4f', wall: '#283328', water: '#2b5d64', path: '#85745d' },
    grid: SOUTHROAD_GRID,
    exits: [
      { x: 14, y: 0, to: 'village', tx: 14, ty: 16 },
      { x: 15, y: 0, to: 'village', tx: 15, ty: 16 },
      { x: 14, y: 17, to: 'forest', tx: 14, ty: 1, requires: current => current.mainStage >= 2, blocked: 'Warden Rhea will not open the Moonroot trail until you hear her report.' },
      { x: 15, y: 17, to: 'forest', tx: 15, ty: 1, requires: current => current.mainStage >= 2, blocked: 'Warden Rhea will not open the Moonroot trail until you hear her report.' }
    ]
  };

  MAPS.village.exits = (MAPS.village.exits || []).map(exit => {
    if (exit.to === 'forest') return { ...exit, to: 'outskirts', tx: exit.x, ty: 1 };
    if (exit.to === 'causeway') return { ...exit, stage: 6 };
    return exit;
  });
  MAPS.forest.exits = (MAPS.forest.exits || []).map(exit => exit.to === 'village'
    ? { ...exit, to: 'outskirts', tx: exit.x, ty: 16 }
    : exit);

  ENCOUNTERS.outskirts = [
    { id: 'outskirts-strays', x: 16, y: 8, enemies: ['gloomRat', 'gloomRat'] },
    { id: 'outskirts-husk', x: 19, y: 14, enemies: ['ashHusk', 'gloomRat'] }
  ];
  if (ENCOUNTERS.shrine) {
    ENCOUNTERS.shrine = ENCOUNTERS.shrine.map(encounter => encounter.id === 'crownshade' ? { ...encounter, stage: 4 } : encounter);
  }
  if (ENCOUNTERS.gate) {
    ENCOUNTERS.gate = ENCOUNTERS.gate.map(encounter => encounter.id === 'iron-warden' ? { ...encounter, stage: 6 } : encounter);
  }

  const addNpc = (mapId, npc) => {
    NPCS[mapId] ||= [];
    if (!NPCS[mapId].some(existing => existing.id === npc.id)) NPCS[mapId].push(npc);
  };
  addNpc('village', { id: 'hale', name: 'Sister Hale', x: 12, y: 14, color: '#b4b8cf' });
  addNpc('village', { id: 'jun', name: 'Jun', x: 20, y: 6, color: '#89a9b7' });
  NPCS.outskirts = [
    { id: 'mira', role: 'rhea', name: 'Warden Rhea', x: 14, y: 10, color: '#c78663' },
    { id: 'pilgrim', name: 'Pilgrim Oren', x: 8, y: 6, color: '#b0b398' }
  ];
  if (NPCS.gate) {
    NPCS.gate = NPCS.gate.map(npc => npc.id === 'captain' ? { ...npc, visible: current => current.mainStage >= 7 } : npc);
  }

  INTERACTABLES.outskirts = [
    { id: 'outskirts-cache', type: 'chest', x: 24, y: 13, rewards: { potion: 1, ether: 1, gold: 25 } },
    { id: 'outskirts-camp', type: 'heal', x: 14, y: 9 }
  ];

  Object.assign(MAIN_OBJECTIVES, {
    0: 'Speak with Elder Maelin in Emberfall.',
    1: 'Meet Warden Rhea at Southroad Verge.',
    2: current => `Recover the Moonshards in Moonroot Forest (${current.shards}/3).`,
    3: 'Enter the Sunken Shrine beneath Moonroot.',
    4: 'Defeat Crownshade Vhal.',
    5: 'Return to Elder Maelin.',
    6: 'Cross the Ruined Causeway and reach Ironroot Gate.',
    7: 'Speak with Captain Seln.',
    8: 'Chapter complete — explore, train, and prepare.'
  });

  function expansionFlags(flags = {}) {
    return {
      rheaMet: false,
      outskirtsEntered: false,
      forestBanterSeen: false,
      openingExpansionVersion: EXPANSION_VERSION,
      ...flags
    };
  }

  function mapLegacyStage(stage) {
    const mapping = { 0: 0, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8 };
    return mapping[stage] ?? stage ?? 0;
  }

  newState = function openingAwareNewState() {
    const fresh = baseNewState();
    fresh.version = Math.max(3, Number(fresh.version) || 0);
    fresh.flags = expansionFlags(fresh.flags);
    fresh.gold = Math.max(55, Number(fresh.gold) || 0);
    fresh.inventory = { ...fresh.inventory, potion: Math.max(5, fresh.inventory?.potion || 0), bomb: Math.max(1, fresh.inventory?.bomb || 0) };
    return fresh;
  };

  normalizeState = function openingAwareNormalize(raw = {}) {
    const normalized = baseNormalizeState(raw);
    const alreadyExpanded = Number(raw?.flags?.openingExpansionVersion || 0) >= EXPANSION_VERSION;
    normalized.version = Math.max(3, Number(normalized.version) || 0);
    normalized.flags = expansionFlags(normalized.flags);
    if (!alreadyExpanded) {
      normalized.mainStage = mapLegacyStage(Number(raw.mainStage) || 0);
      normalized.flags.rheaMet = (Number(raw.mainStage) || 0) >= 1;
    }
    if (!MAPS[normalized.map]) {
      normalized.map = 'village';
      normalized.x = 14;
      normalized.y = 15;
    }
    return normalized;
  };

  migrateOldSave = function openingAwareMigrate(old) {
    return normalizeState(baseMigrateOldSave(old));
  };

  objectiveText = function openingObjectiveText() {
    const objective = MAIN_OBJECTIVES[state?.mainStage] ?? MAIN_OBJECTIVES[8];
    return typeof objective === 'function' ? objective(state) : objective;
  };

  changeMap = function openingAwareChangeMap(exit) {
    const from = state?.map;
    baseChangeMap(exit);
    if (!state) return;

    if (exit.to === 'shrine' && state.mainStage === 3) {
      state.mainStage = 4;
      showToast('Objective updated: Defeat Crownshade Vhal.');
    }

    if (exit.to === 'outskirts' && !state.flags.outskirtsEntered) {
      state.flags.outskirtsEntered = true;
      saveGame();
      showDialogue('Lyra', [
        'The buried bell is louder beyond the village ward. It is not ringing through the air — it is ringing through us.',
        'Rhea’s camp is ahead. Let us learn what survived the road before Moonroot learns our names.'
      ]);
    } else if (exit.to === 'forest' && !state.flags.forestBanterSeen) {
      state.flags.forestBanterSeen = true;
      saveGame();
      showDialogue('Rowan', [
        'Moonroot has gone quiet enough to hear a bowstring settle.',
        'The creatures are visible before they strike. We choose the ground, the order, and the cost of every fight.'
      ]);
    } else if (from !== exit.to) {
      saveGame();
    }
  };

  function elderOpeningDialogue() {
    if (state.mainStage === 0) {
      showDialogue('Elder Maelin', [
        'The stars above Emberfall have gone dark, but something beneath Moonroot has begun to sing.',
        'Go first to Southroad Verge. Warden Rhea is holding the camp beyond the village.',
        'When she has judged the road, enter Moonroot, recover the three Moonshards, and keep the first crown from waking fully.'
      ], () => {
        state.mainStage = 1;
        state.flags.introSeen = true;
        showToast('Objective updated: Meet Warden Rhea.');
      });
    } else if (state.mainStage === 1) {
      showDialogue('Elder Maelin', ['Rhea keeps the road-camp south of the village. Hear her report before you enter Moonroot.']);
    } else if (state.mainStage === 2) {
      showDialogue('Elder Maelin', [`The forest has yielded ${state.shards} of the three Moonshards. Follow the cold light.`]);
    } else if (state.mainStage === 3 || state.mainStage === 4) {
      showDialogue('Elder Maelin', ['The shards remember the path. Descend beneath Moonroot and end the Crownshade.']);
    } else if (state.mainStage === 5) {
      showDialogue('Elder Maelin', [
        'The dead stars are silent again. You have bought Emberfall a dawn.',
        'But the wardstones on the eastern road are failing. Ironroot Gate has sent no messenger in seven nights.',
        'Cross the Ruined Causeway. Find what waits beyond our old border.'
      ], () => {
        state.mainStage = 6;
        state.flags.chapterOneComplete = true;
        showToast('Objective updated: Reach Ironroot Gate.');
      });
    } else {
      showDialogue('Elder Maelin', [state.mainStage >= 8
        ? 'You have carried Emberfall farther than any oath could demand.'
        : 'The eastern ward is open. May the old fire walk beside you.']);
    }
  }

  function rheaDialogue() {
    if (state.mainStage === 1) {
      showDialogue('Warden Rhea', [
        'Good. The Elder sent steel, not prayers.',
        'The verge is no longer empty. What prowls here can be seen before it strikes — choose your fights instead of stumbling into them.',
        'Take these field supplies. Clear the camp road, then enter Moonroot and gather the Moonshards.'
      ], () => {
        addItem('potion', 2);
        addItem('ether', 1);
        state.mainStage = 2;
        state.flags.rheaMet = true;
        showToast('Field supplies received. Moonroot trail opened.');
      });
    } else if (state.mainStage === 2 || state.mainStage === 3) {
      showDialogue('Warden Rhea', ['Moonroot begins where the wind turns cold. Bring the shards back alive, and do not spend strength on every fight.']);
    } else {
      showDialogue('Warden Rhea', ['Southroad holds because you broke the fear of it. That matters more than most victories.']);
    }
  }

  function captainOpeningDialogue() {
    if (state.mainStage === 7) {
      showDialogue('Captain Seln', [
        'The Warden was ours once. Something inside the gate rewrote its oath.',
        'Beyond these doors lies the northern dominion — and the hand that darkened your stars.',
        'For now, hold the threshold. The next road will not be kind.'
      ], () => {
        state.mainStage = 8;
        state.flags.chapterTwoComplete = true;
      });
    } else {
      showDialogue('Captain Seln', ['Ironroot stands because you reached it before the silence became permanent.']);
    }
  }

  interactNpc = function openingAwareInteractNpc(npc) {
    if (npc.id === 'elder') return elderOpeningDialogue();
    if (npc.role === 'rhea') return rheaDialogue();
    if (npc.id === 'hale') return showDialogue('Sister Hale', [state.mainStage < 5
      ? 'The sky went dark, but fear moves faster than darkness. Keep your oath close and your breath slow.'
      : 'You came back with dawn still clinging to you. The village needed that.']);
    if (npc.id === 'jun') return showDialogue('Jun', [state.mainStage < 6
      ? 'I marked the safer Southroad lanes with split-white stones. Circle what you cannot afford to fight.'
      : 'The east road is open, but it feels wrong — like something listened when the stars died.']);
    if (npc.id === 'pilgrim') return showDialogue('Pilgrim Oren', ['When the stars died, the road forgot its distances. I walked one field for a whole morning and never reached its end.']);
    if (npc.id === 'captain') return captainOpeningDialogue();
    return baseInteractNpc(npc);
  };

  collectShard = function openingAwareCollectShard(item) {
    if (state.collected.includes(item.id)) return;
    state.collected.push(item.id);
    state.shards += 1;
    if (state.shards >= 3 && state.mainStage === 2) {
      state.mainStage = 3;
      showToast('Objective updated: Enter the Sunken Shrine.');
    }
    saveGame();
    updateHud();
    showDialogue('Moonshard', [`Cold light settles into the shardbound seal. (${state.shards}/3)`]);
  };

  handleVictory = function openingAwareVictory() {
    const encounterId = battle?.encounter?.id;
    baseHandleVictory();
    if (!state) return;
    if (encounterId === 'crownshade') state.mainStage = 5;
    if (encounterId === 'iron-warden') state.mainStage = 7;
    saveGame();
    updateHud();
  };

  journalMenuHtml = function openingJournalHtml() {
    const quests = [
      { done: state.mainStage >= 6, title: 'The Dead Stars', text: state.mainStage <= 1 ? 'Report to Warden Rhea at Southroad Verge.' : 'Cross the verge, recover the Moonshards, and destroy Crownshade Vhal.' },
      { done: state.mainStage >= 8, title: 'The Eastern Silence', text: 'Cross the Ruined Causeway and restore Ironroot Gate.' },
      { done: state.sideScout >= 3, title: 'The Missing Scout', text: state.sideScout === 0 ? 'Speak with Edda in Emberfall.' : state.sideScout === 1 ? 'Find Mira west of the Moonroot moonwell.' : 'Return to Edda with news of Mira.' }
    ];
    return `<h2>Journal</h2>${quests.map(quest => `<div class="quest-entry ${quest.done ? 'done' : ''}"><h3>${quest.done ? '✓ ' : ''}${quest.title}</h3><p>${quest.text}</p></div>`).join('')}<h3>Current objective</h3><p>${objectiveText()}</p>`;
  };

  enterWorld = function openingEnterWorld(isNew) {
    if (state) state = normalizeState(state);
    mode = 'world';
    setOverlay();
    hud.classList.remove('hidden');
    trail = [];
    updateHud();
    showLocation();
    if (isNew) {
      showDialogue('Ashen Crown', [
        'The stars above Veyra died seven nights ago, and Emberfall has not slept since.',
        'Three travelers wake to a buried bell, a frightened frontier, and a road that no longer remembers where it leads.'
      ]);
    }
  };

  showTitle = function openingTitle() {
    baseShowTitle();
    const build = document.querySelector('.creator-kicker');
    if (build) build.textContent = 'BUILD 0.20 · SOUTHROAD + WEAPON FORGE';
    const blurb = document.querySelector('.title-blurb');
    if (blurb) blurb.textContent = 'A mobile fantasy JRPG of dead stars, frontier camps, visible encounters, party identity, and tactical turn-based combat.';
  };

  showTitle();
})();