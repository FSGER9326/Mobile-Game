// Keep the title-screen renderer safe before a save state exists.
const drawTileWithoutStateGuard = drawTile;
drawTile = function guardedDrawTile(map, char, x, y) {
  if (state) return drawTileWithoutStateGuard(map, char, x, y);
  const previousState = state;
  state = { map: 'village' };
  try {
    return drawTileWithoutStateGuard(map, char, x, y);
  } finally {
    state = previousState;
  }
};
