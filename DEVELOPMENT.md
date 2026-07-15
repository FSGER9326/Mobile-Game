# Development Notes

## Runtime

Ashen Crown is a static mobile-first canvas/DOM PWA. Scripts are loaded in dependency order from `index.html`; later battle extension files intentionally wrap selected global functions from `battle-a.js` and `battle-b.js`.

## Verification commands

```bash
node --check src/battle-tactics.js
node tests/battle-tactics.test.js
node tests/vector-art-v3.test.js
```

When browser tooling is available, additionally verify the GitHub Pages build at a landscape phone viewport, inspect the console, complete one normal encounter, and reload a saved game.

## Current combat architecture

- `battle-a.js`: battle creation, base renderer, commands and hero actions.
- `battle-b.js`: base enemy phase, victory, defeat and leveling.
- `battle-tactics.js`: enemy intent planning, locked target telegraphs, Brace mitigation and tactical enemy phase.
- `battle-ai.js`, `battle-elements.js`, `battle-stage.js`, `battle-effects.js`: later-loaded extensions; changes must be checked for wrapper ordering conflicts.

## Immediate backlog

1. Add a browser-driven battle smoke test covering intent cards, target names, Guard response and round advancement.
2. Audit all later battle extensions for overwritten globals and document the intended wrapper order.
3. Test character creation, battle, dialogue, inventory and save/reload at representative Android landscape dimensions.
4. Expand enemy roles so intent categories correspond to genuinely distinct behaviours, resistances and party responses.
5. Add a unified test command and GitHub Actions workflow.
