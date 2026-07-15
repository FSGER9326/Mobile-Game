# Development Notes

## Runtime

Ashen Crown is a static mobile-first canvas/DOM PWA. Scripts are loaded in dependency order from `index.html`; later battle and world extension files intentionally wrap selected global functions from the base modules.

Current late-load order:

1. combat extensions and intent presentation;
2. character creation and save recovery;
3. `opening-expansion.js` for the Southroad vertical slice and stage migration;
4. `weapon-art-v4.js` for detailed weapons, camp dressing, and quest markers.

Do not move the opening or weapon extensions ahead of `ui-b.js` without retesting title bindings, creator startup, save normalization, and the active render loop.

## Verification commands

```bash
node --check src/battle-tactics.js
node --check src/opening-expansion.js
node --check src/weapon-art-v4.js
node tests/battle-tactics.test.js
node tests/opening-expansion.test.js
node tests/weapon-art-v4.test.js
```

When browser tooling is available, additionally verify the GitHub Pages build at a landscape phone viewport, inspect the console, complete one Southroad encounter, speak with Warden Rhea, enter Moonroot, and reload both a new save and a migrated pre-expansion save.

## Current combat architecture

- `battle-a.js`: battle creation, base renderer, commands and hero actions.
- `battle-b.js`: base enemy phase, victory, defeat and leveling.
- `battle-tactics.js`: enemy intent planning, locked target telegraphs, Brace mitigation and tactical enemy phase.
- `battle-ai.js`, `battle-elements.js`, `battle-stage.js`, `battle-effects.js`: later-loaded extensions; changes must be checked for wrapper ordering conflicts.

## Current opening architecture

- Emberfall remains the starting hub.
- Southroad Verge is the onboarding field zone between Emberfall and Moonroot.
- `opening-expansion.js` remaps legacy story stages once through `flags.openingExpansionVersion` and preserves the existing local-storage key.
- Warden Rhea opens the Moonroot trail and provides field supplies.
- Area-entry banter introduces Lyra and Rowan before the first major dungeon.
- `weapon-art-v4.js` overlays detailed class weapons without replacing the base vector renderer or combat presentation.

## Immediate backlog

1. Run a real mobile browser playtest of the complete Emberfall → Southroad → Moonroot flow and capture screenshots.
2. Add character portraits and speaker-specific dialogue framing for Elder Maelin, Rhea, Edda, Mira, and the core party.
3. Give Southroad encounters tutorial-specific enemy behaviour and a bespoke first-battle reward.
4. Add equipment definitions so forge upgrades change named weapons, statistics, and visual tiers rather than only global levels.
5. Audit later battle extensions for overwritten globals and add a unified test command plus GitHub Actions workflow.