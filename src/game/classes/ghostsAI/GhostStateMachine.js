const { GhostState } = require("./GhostState");
const { ChaseState } = require("./ChaseState");
const { ScatterState } = require("./ScatterState");

/**
 * Ghost State Machine
 * Manages transitions between different AI behaviors
 */
class GhostStateMachine {
  /**
   * @param {Phaser.GameObjects.Container} ghost - The ghost entity
   * @param {Phaser.Tilemaps.DynamicTilemapLayer} board - Tilemap layer
   */
  constructor(ghost, board) {
    this.ghost = ghost;
    this.board = board;
    this.states = {};
    this.currentState = null;
  }

  /**
   * Add a state to the state machine
   * @param {string} name - State identifier
   * @param {GhostState} state - State instance
   * @returns {GhostStateMachine} this (for chaining)
   */
  addState(name, state) {
    this.states[name] = state;
    return this;
  }

  /**
   * Transition to a new state
   * @param {string} stateName - Name of state to switch to
   */
  setState(stateName) {
    const newState = this.states[stateName];
    if (!newState) {
      console.warn(`State "${stateName}" not found`);
      return;
    }

    if (this.currentState) {
      this.currentState.exit();
    }

    this.currentState = newState;
    this.currentState.enter();
  }

  /**
   * Get the current state's movement speed
   * @returns {number}
   */
  get speed() {
    return this.currentState ? this.currentState.speed : 0;
  }

  /**
   * Get the current state's target position (for visualization)
   * @returns {{x: number, y: number}}
   */
  get targetPosition() {
    return this.currentState
      ? this.currentState.targetPosition
      : { x: this.ghost.x, y: this.ghost.y };
  }

  /**
   * Have the current state pick a direction
   * @returns {number} Direction enum value
   */
  pickDirection() {
    if (!this.currentState) {
      return 4; // Direction.None
    }
    return this.currentState.pickDirection();
  }
}

module.exports = {
  GhostStateMachine,
  ChaseState,
  ScatterState,
};
