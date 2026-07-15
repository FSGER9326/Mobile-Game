/* Ashen Crown character creator. Optional fields preserve v2 save compatibility. */
(() => {
  const baseShowTitle = showTitle;
  const baseNewState = newState;
  const baseNormalizeState = normalizeState;

  const CREATOR_CLASSES = {
    ashblade: {
      baseId: 'kael', name: 'Ashblade', subtitle: 'Front-line oathbreaker', color: '#b65755', weapon: 'sword',
      stats: { maxHp: 142, maxMp: 30, attack: 26, defense: 17, agility: 15 },
      skills: ['emberSlash', 'ironVow', 'cleave'],
      text: 'A durable weapon-master who converts pressure into burning momentum.'
    },
    mooncantor: {
      baseId: 'lyra', name: 'Moon Cantor', subtitle: 'Lunar battle-mage', color: '#557bb9', weapon: 'staff',
      stats: { maxHp: 102, maxMp: 58, attack: 20, defense: 11, agility: 18 },
      skills: ['moonbolt', 'mend', 'starfall'],
      text: 'A high-MP caster who restores allies and pierces armor with moonlight.'
    },
    thornranger: {
      baseId: 'rowan', name: 'Thorn Ranger', subtitle: 'Swift hunter', color: '#5a9268', weapon: 'bow',
      stats: { maxHp: 118, maxMp: 40, attack: 23, defense: 13, agility: 24 },
      skills: ['piercingShot', 'smokeVeil', 'volley'],
      text: 'A fast physical striker with precision attacks and party protection.'
    },
    wardseeker: {
      baseId: 'mira', name: 'Ward Seeker', subtitle: 'Runebound guardian', color: '#9b75b8', weapon: 'glaive',
      stats: { maxHp: 128, maxMp: 44, attack: 23, defense: 16, agility: 20 },
      skills: ['wardSlash', 'spiritSeal', 'moonWard'],
      text: 'A balanced guardian who weakens enemies and reinforces the party.'
    }
  };

  const ORIGINS = {
    emberfall: { name: 'Emberfall Foundling', trait: 'Hearthborn', mod: { maxHp: 12, defense: 2 }, text: 'Raised among smiths and wardens. Harder to bring down.' },
    wildborn: { name: 'Moonroot Wildborn', trait: 'Keenstep', mod: { agility: 3, attack: 1 }, text: 'You learned to hunt and read broken ground beneath dead stars.' },
    starless: { name: 'Starless Pilgrim', trait: 'Deep Well', mod: { maxMp: 10, attack: 1 }, text: 'Years on the pilgrim roads sharpened your will and magic.' },
    ruinborn: { name: 'Child of the Ruins', trait: 'Relic Sense', mod: { defense: 1, agility: 1, maxMp: 5 }, text: 'Old wards and forgotten mechanisms answer when you draw near.' }
  };

  const SKINS = ['#f1cfb2', '#d8aa82', '#aa7558', '#704839', '#422d2a'];
  const HAIRS = ['#231d24', '#65402f', '#a24e38', '#d2c3a4', '#d8d9e5', '#31506d'];
  const EYES = ['#6e9fc4', '#7db887', '#b78e4d', '#9f6fb2', '#5c3f31'];
  const ACCENTS = ['#b65755', '#557bb9', '#5a9268', '#9b75b8', '#c29045', '#3e8791'];
  let draft = null;

  const freshDraft = () => ({
    name: 'Aren', pronouns: 'they', classId: 'ashblade', originId: 'emberfall', body: 'athletic',
    skin: SKINS[1], hairStyle: 'short', hair: HAIRS[0], eyes: EYES[0], accent: ACCENTS[0]
  });

  const safeText = value => String(value || '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);

  function defaultProtagonist(hero = null) {
    const template = hero || { name: 'Kael', id: 'kael', color: '#b65755', className: 'Ashblade' };
    const identity = template.templateId || template.id;
    const classId = identity === 'lyra' ? 'mooncantor' : identity === 'rowan' ? 'thornranger' : identity === 'mira' ? 'wardseeker' : 'ashblade';
    return {
      name: template.name || 'Kael', pronouns: 'they', classId, originId: 'emberfall', body: 'athletic',
      skin: SKINS[1], hairStyle: classId === 'mooncantor' ? 'long' : 'short', hair: HAIRS[0], eyes: EYES[0],
      accent: template.color || CREATOR_CLASSES[classId].color
    };
  }

  newState = function creatorAwareNewState() {
    const fresh = baseNewState();
    fresh.protagonist = defaultProtagonist(fresh.party[0]);
    fresh.flags.characterCreated = false;
    return fresh;
  };

  normalizeState = function creatorAwareNormalize(raw) {
    const rawParty = Array.isArray(raw?.party) ? raw.party : null;
    const compatibleRaw = rawParty ? {
      ...raw,
      party: rawParty.map(hero => hero?.id === 'protagonist'
        ? { ...hero, id: hero.templateId || 'kael' }
        : hero)
    } : raw;
    const normalized = baseNormalizeState(compatibleRaw);
    normalized.protagonist = { ...defaultProtagonist(normalized.party[0]), ...(raw?.protagonist || {}) };
    normalized.flags = { ...(normalized.flags || {}), characterCreated: Boolean(raw?.flags?.characterCreated) };
    if (normalized.party[0]) {
      const classTemplate = CREATOR_CLASSES[normalized.protagonist.classId]?.baseId || normalized.party[0].templateId || normalized.party[0].id || 'kael';
      normalized.party[0].appearance = { ...normalized.protagonist };
      normalized.party[0].name = normalized.protagonist.name || normalized.party[0].name;
      if (normalized.flags.characterCreated || rawParty?.[0]?.id === 'protagonist') {
        normalized.party[0].templateId = classTemplate;
        normalized.party[0].id = 'protagonist';
      }
    }
    return normalized;
  };

  function choiceButton(group, value, label, selected) {
    return `<button class="creator-choice ${selected ? 'selected' : ''}" data-creator-group="${group}" data-creator-value="${safeText(value)}">${label}</button>`;
  }

  function swatches(values, group, selected, label) {
    return values.map(value => `<button class="swatch ${selected === value ? 'selected' : ''}" data-creator-group="${group}" data-creator-value="${value}" style="--swatch:${value}" aria-label="${label}"></button>`).join('');
  }

  function currentStats() {
    const cls = CREATOR_CLASSES[draft.classId];
    const origin = ORIGINS[draft.originId];
    return Object.fromEntries(['maxHp', 'maxMp', 'attack', 'defense', 'agility'].map(key => [key, cls.stats[key] + (origin.mod[key] || 0)]));
  }

  function renderCreator() {
    const cls = CREATOR_CLASSES[draft.classId];
    const origin = ORIGINS[draft.originId];
    const stats = currentStats();
    stopMovement();
    mode = 'creator';
    hud.classList.add('hidden');
    setOverlay(`<div class="screen creator-screen"><div class="window frame creator-window">
      <header class="creator-header"><div><span class="creator-kicker">NEW JOURNEY · CREATOR BUILD</span><h1>Forge Your Protagonist</h1><p>Name, class, origin and appearance are used by exploration sprites, portraits, dialogue and combat data.</p></div><button class="ui-button secondary" id="creator-cancel">Back</button></header>
      <div class="creator-layout">
        <section class="creator-preview-panel"><canvas id="creator-preview" width="300" height="360" aria-label="Character preview"></canvas><div class="creator-summary"><h2>${safeText(draft.name || 'Unnamed')}</h2><b>${cls.name}</b><span>${origin.name}</span><small>${origin.trait}</small></div></section>
        <section class="creator-options">
          <div class="creator-section"><label for="creator-name">Name</label><input id="creator-name" maxlength="16" value="${safeText(draft.name)}" autocomplete="off" /></div>
          <div class="creator-section"><h3>Pronouns</h3><div class="creator-row">${['she', 'he', 'they'].map(value => choiceButton('pronouns', value, value === 'she' ? 'She / Her' : value === 'he' ? 'He / Him' : 'They / Them', draft.pronouns === value)).join('')}</div></div>
          <div class="creator-section"><h3>Class</h3><div class="creator-class-grid">${Object.entries(CREATOR_CLASSES).map(([id, item]) => `<button class="creator-card ${draft.classId === id ? 'selected' : ''}" data-creator-group="classId" data-creator-value="${id}"><b>${item.name}</b><span>${item.subtitle}</span><small>${item.text}</small></button>`).join('')}</div></div>
          <div class="creator-section"><h3>Origin</h3><div class="creator-origin-grid">${Object.entries(ORIGINS).map(([id, item]) => `<button class="creator-card compact ${draft.originId === id ? 'selected' : ''}" data-creator-group="originId" data-creator-value="${id}"><b>${item.name}</b><span>${item.trait}</span><small>${item.text}</small></button>`).join('')}</div></div>
          <div class="creator-section"><h3>Build</h3><div class="creator-row">${['lean', 'athletic', 'broad'].map(value => choiceButton('body', value, value[0].toUpperCase() + value.slice(1), draft.body === value)).join('')}</div></div>
          <div class="creator-section"><h3>Hair</h3><div class="creator-row">${['short', 'long', 'braid', 'shaved'].map(value => choiceButton('hairStyle', value, value[0].toUpperCase() + value.slice(1), draft.hairStyle === value)).join('')}</div></div>
          <div class="creator-section swatch-section"><h3>Skin</h3><div class="swatches">${swatches(SKINS, 'skin', draft.skin, 'Skin tone')}</div></div>
          <div class="creator-section swatch-section"><h3>Hair color</h3><div class="swatches">${swatches(HAIRS, 'hair', draft.hair, 'Hair color')}</div></div>
          <div class="creator-section swatch-section"><h3>Eyes</h3><div class="swatches">${swatches(EYES, 'eyes', draft.eyes, 'Eye color')}</div></div>
          <div class="creator-section swatch-section"><h3>Accent</h3><div class="swatches">${swatches(ACCENTS, 'accent', draft.accent, 'Accent color')}</div></div>
          <div class="creator-statline"><span>HP<b>${stats.maxHp}</b></span><span>MP<b>${stats.maxMp}</b></span><span>ATK<b>${stats.attack}</b></span><span>DEF<b>${stats.defense}</b></span><span>AGI<b>${stats.agility}</b></span></div>
          <button class="ui-button creator-begin" id="creator-begin">Begin as ${safeText(draft.name || 'this hero')}</button>
        </section>
      </div>
    </div></div>`);

    const preview = document.querySelector('#creator-preview');
    window.AshenArt?.drawCreatorPreview?.(preview, draft, cls);
    document.querySelector('#creator-cancel').addEventListener('click', showTitle);
    document.querySelector('#creator-name').addEventListener('input', event => {
      draft.name = event.target.value.replace(/[^\p{L}\p{N} '\-]/gu, '').slice(0, 16);
      document.querySelector('.creator-summary h2').textContent = draft.name || 'Unnamed';
      document.querySelector('#creator-begin').textContent = `Begin as ${draft.name || 'this hero'}`;
    });
    overlay.querySelectorAll('[data-creator-group]').forEach(button => button.addEventListener('click', () => {
      draft[button.dataset.creatorGroup] = button.dataset.creatorValue;
      renderCreator();
    }));
    document.querySelector('#creator-begin').addEventListener('click', beginCreatedJourney);
  }

  function buildCreatedState() {
    const cls = CREATOR_CLASSES[draft.classId];
    const origin = ORIGINS[draft.originId];
    const stats = currentStats();
    const created = baseNewState();
    const hero = makeHero(cls.baseId);
    hero.templateId = cls.baseId;
    hero.id = 'protagonist';
    hero.name = draft.name.trim() || 'Aren';
    hero.className = cls.name;
    hero.color = draft.accent || cls.color;
    hero.maxHp = stats.maxHp; hero.hp = stats.maxHp;
    hero.maxMp = stats.maxMp; hero.mp = stats.maxMp;
    hero.attack = stats.attack; hero.defense = stats.defense; hero.agility = stats.agility;
    hero.skillIds = [...cls.skills];
    hero.originId = draft.originId;
    hero.originName = origin.name;
    hero.originTrait = origin.trait;
    hero.pronouns = draft.pronouns;
    hero.appearance = { ...draft, name: hero.name };
    created.party[0] = hero;
    created.protagonist = { ...draft, name: hero.name };
    created.flags.characterCreated = true;
    return created;
  }

  function beginCreatedJourney() {
    state = buildCreatedState();
    saveGame();
    enterWorld(true);
  }

  function openCreator() {
    draft = freshDraft();
    renderCreator();
  }

  showTitle = function creatorAwareTitle() {
    baseShowTitle();
    document.querySelector('.title-sub')?.insertAdjacentHTML('afterend', '<div class="creator-kicker" style="margin-top:8px">BUILD 0.12 · CHARACTER CREATOR + ART REWORK</div>');
    const oldButton = document.querySelector('#new-game');
    if (!oldButton) return;
    const newButton = oldButton.cloneNode(true);
    newButton.textContent = 'Create new hero';
    oldButton.replaceWith(newButton);
    newButton.addEventListener('click', () => {
      if (hasSave()) {
        showChoice('Begin a new journey?', 'The current local save will be replaced after you finish character creation.', [
          { label: 'Cancel', action: showTitle },
          { label: 'Open character creator', action: openCreator }
        ]);
      } else {
        openCreator();
      }
    });
  };
})();