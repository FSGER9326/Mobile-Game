const fs = require('fs');
const assert = require('assert');

const css = fs.readFileSync('creator.css', 'utf8');

function ruleContains(selector, expected) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]]+)\\}`, 's'));
  assert(match, `Missing CSS rule for ${selector}`);
  assert(match[1].includes(expected), `${selector} must include: ${expected}`);
}

ruleContains('.creator-screen', 'overflow: hidden');
ruleContains('.creator-window', 'height: min(95dvh');
ruleContains('.creator-window', 'overflow: hidden');
ruleContains('.creator-layout', 'min-width: 0');
ruleContains('.creator-layout', 'min-height: 0');
ruleContains('.creator-options', 'overflow-y: auto');
ruleContains('.creator-options', 'touch-action: pan-y');
ruleContains('.creator-options', '-webkit-overflow-scrolling: touch');
ruleContains('.creator-begin', 'position: sticky');
ruleContains('.creator-begin', 'bottom: 0');

assert(!css.includes('minmax(390px, 1fr)'), 'Small-screen layout must not force the options panel beyond the viewport');
assert(!css.includes('minmax(420px, 1fr)'), 'Compact layout must not retain the previous hard minimum width');
assert(css.includes('@media (max-height: 390px)'), 'Very short landscape screens need an explicit compact mode');

console.log('creator layout tests passed');
