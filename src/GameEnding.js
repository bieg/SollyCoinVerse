// ===================================================================================
// ==  DEPRECATED - Old GameEnding disabled                                         ==
// ==  Use GameEndingCinematic.js instead (Ctrl+0)                                  ==
// ===================================================================================

// Empty stub to prevent errors if something tries to call it
class GameEnding {
  constructor() {
    console.warn('⚠️ Old GameEnding is disabled. Use triggerCinematicEnding() instead.');
  }
  start() {}
  cleanup() {}
}

window.GameEnding = GameEnding;
window.triggerGameEnding = function () {
  console.warn('⚠️ triggerGameEnding is disabled. Use triggerCinematicEnding() instead.');
};
