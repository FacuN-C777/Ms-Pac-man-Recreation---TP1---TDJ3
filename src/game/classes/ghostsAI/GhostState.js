/**
 * Base class for Ghost AI States
 * Implements the State pattern for ghost behavior
 */
class GhostState {
  constructor(ghost, board) {
    this.ghost = ghost;
    this.board = board;
  }

  /** @returns {number} Movement speed */
  get speed() {
    return 100;
  }

  /** @returns {{x: number, y: number}} Target position for debug visualization */
  get targetPosition() {
    return { x: this.ghost.x, y: this.ghost.y };
  }

  /**
   * Choose the next direction to move
   * @returns {number} Direction enum value
   */
  pickDirection() {
    throw new Error("pickDirection must be implemented by subclass");
  }

  /**
   * Called when entering this state
   */
  enter() {}

  /**
   * Called when exiting this state
   */
  exit() {}
}

module.exports = { GhostState };
