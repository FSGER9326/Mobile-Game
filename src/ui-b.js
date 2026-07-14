function enterWorld(isNew) {
  mode = 'world';
  setOverlay();
  hud.classList.remove('hidden');
  trail = [];
  updateHud();
  showLocation();
  if (isNew) {
    showDialogue('Ashen Crown', [
      'The stars above Veyra died seven nights ago.',
      'At Emberfall, three travelers awaken to a bell ringing beneath the earth.'
    ]);
  }
}

async function requestFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    if (screen.orientation?.lock) await screen.orientation.lock('landscape').catch(() => {});
  } catch (error) {
    console.info('Fullscreen request was not accepted', error);
  }
}

async function installPwa() {
  if (!installedPrompt) {
    showToast('Use Chrome’s menu → Install app / Add to Home screen.');
    return;
  }
  installedPrompt.prompt();
  await installedPrompt.userChoice;
  installedPrompt = null;
  if (mode === 'title') showTitle();
}

function startMovement(direction, button) {
  stopMovement();
  button?.classList.add('pressed');
  const vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const [dx, dy] = vectors[direction];
  move(dx, dy, direction);
  const delay = dashHeld ? 95 : 155;
  movementTimer = setInterval(() => move(dx, dy, direction), delay);
}

function stopMovement() {
  if (movementTimer) clearInterval(movementTimer);
  movementTimer = null;
  document.querySelectorAll('.move-button').forEach(button => button.classList.remove('pressed'));
}

function bindControls() {
  document.querySelectorAll('.move-button').forEach(button => {
    const direction = button.dataset.direction;
    button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture?.(event.pointerId); startMovement(direction, button); });
    button.addEventListener('pointerup', stopMovement);
    button.addEventListener('pointercancel', stopMovement);
    button.addEventListener('pointerleave', event => { if (event.buttons) stopMovement(); });
  });
  dashButton.addEventListener('pointerdown', event => { event.preventDefault(); dashHeld = true; dashButton.classList.add('pressed'); });
  const stopDash = () => { dashHeld = false; dashButton.classList.remove('pressed'); };
  dashButton.addEventListener('pointerup', stopDash);
  dashButton.addEventListener('pointercancel', stopDash);
  dashButton.addEventListener('pointerleave', stopDash);
  actionButton.addEventListener('click', interact);
  menuButton.addEventListener('click', () => openGameMenu());

  window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(key)) event.preventDefault();
    if (event.repeat && ['e', 'm', 'escape', 'enter', ' '].includes(key)) return;
    if (key === 'arrowup' || key === 'w') move(0, -1, 'up');
    else if (key === 'arrowdown' || key === 's') move(0, 1, 'down');
    else if (key === 'arrowleft' || key === 'a') move(-1, 0, 'left');
    else if (key === 'arrowright' || key === 'd') move(1, 0, 'right');
    else if (key === 'e' || key === 'enter' || key === ' ') interact();
    else if (key === 'm' || key === 'escape') openGameMenu();
  });
  window.addEventListener('blur', stopMovement);
  document.addEventListener('visibilitychange', () => {
    stopMovement();
    if (document.hidden) saveGame();
  });
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installedPrompt = event;
  if (mode === 'title') showTitle();
});

window.addEventListener('appinstalled', () => {
  installedPrompt = null;
  showToast('Ashen Crown installed.');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed', error)));
}

setInterval(() => {
  if (state && mode !== 'title') {
    state.playSeconds = (state.playSeconds || 0) + 10;
    saveGame();
  }
}, 10000);

bindControls();
showTitle();
requestAnimationFrame(drawWorld);
