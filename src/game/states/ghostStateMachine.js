import * as Phaser from "phaser";
import { ScatterState } from "./scatterState.js";
import { ChaseState } from "./chaseState.js";
import { FrightenedState } from "./frightenedState.js";

export class GhostStateMachine {
  constructor(ghost, board, hero, scatterX, scatterY) {
    this.ghost = ghost;
    this.board = board;
    this.hero = hero;
    this.scatterX = scatterX;
    this.scatterY = scatterY;

    this.states = {};
    this.currentState = null;
    this.currentStateName = null;

    this.scatterTimer = 0;
    this.hasTransitionedToChase = false;
    this.scatterDuration = 30000;

    this.previousStateName = null;
  }

  init() {
    this.states.scatter = new ScatterState(
      this.scatterX,
      this.scatterY,
      this.ghost,
      this.board,
    );
    this.states.chase = new ChaseState(this.hero, this.ghost, this.board);
    this.states.frightened = new FrightenedState(this.ghost, this.board);

    this.setState("scatter");
  }

  setState(stateName) {
    const newState = this.states[stateName];
    if (!newState) {
      console.warn(`State "${stateName}" not found`);
      return;
    }

    // Exit current state
    if (this.currentState) {
      this.currentState.exit();
    }

    // Store previous state (unless already frightened)
    if (stateName !== "frightened" && this.currentStateName) {
      this.previousStateName = this.currentStateName;
    }

    // Enter new state
    this.currentStateName = stateName;
    this.currentState = newState;

    // Set hero reference for frightened state
    if (stateName === "frightened") {
      this.currentState.setHero(this.hero);
    }

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
   * @param {boolean} forceNewDirection - If true, try to avoid the current direction
   * @returns {number} Direction enum value
   */
  pickDirection(forceNewDirection = false) {
    if (!this.currentState) {
      return 4; // Direction.None
    }
    return this.currentState.pickDirection(forceNewDirection);
  }

  /**
   * Update the state machine (handles timer for scatter->chase transition)
   * @param {number} dt - Delta time in ms
   */
  update(dt) {
    // Handle scatter timer (only if not yet transitioned to chase and not frightened)
    if (!this.hasTransitionedToChase && this.currentStateName === "scatter") {
      this.scatterTimer += dt;
      if (this.scatterTimer >= this.scatterDuration) {
        this.setState("chase");
        this.hasTransitionedToChase = true;
      }
    }
  }

  /**
   * Trigger frightened mode (called when player eats power dot)
   */
  frighten() {
    this.setState("frightened");
  }

  /**
   * Return to previous state after frightened mode ends
   */
  unfrighten() {
    // Return to chase if we've already transitioned, otherwise go back to scatter
    if (this.hasTransitionedToChase) {
      this.setState("chase");
    } else {
      this.setState("scatter");
    }
  }

  /**
   * Check if currently in frightened mode
   * @returns {boolean}
   */
  isFrightened() {
    return this.currentStateName === "frightened";
  }
}
