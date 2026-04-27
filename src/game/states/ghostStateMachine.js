import * as Phaser from "phaser";
import { ScatterState } from "./scatterState.js";
import { ChaseState } from "./chaseState.js";
import { FlankState } from "./flankState.js";
import { PlayfullChaseState } from "./playfullChaseState.js";
import { CutoffState } from "./cutoffState.js";
import { FrightenedState } from "./frightenedState.js";
import { EatenState } from "./eatenState.js";
import GameManager from "../gameManager.js";

export class GhostStateMachine {
  constructor(
    ghost,
    board,
    hero,
    scatterX,
    scatterY,
    spawnX,
    spawnY,
    ghostName = "",
    blinky = null,
  ) {
    this.ghost = ghost;
    this.board = board;
    this.hero = hero;
    this.scatterX = scatterX;
    this.scatterY = scatterY;
    this.spawnX = spawnX;
    this.spawnY = spawnY;
    this.ghostName = ghostName;
    this.blinky = blinky;

    this.states = {};
    this.currentState = null;
    this.currentStateName = null;

    this.scatterTimer = 0;
    this.hasTransitionedToChase = false;
    // Set scatter duration based on difficulty: Easy=30s, Hard=5s
    const gameManager = GameManager.getInstance();
    this.scatterDuration = gameManager.isHard() ? 5000 : 30000;
    this.frightTimer = 0;
    this.frightDuration = 8000;

    this.previousStateName = null;
  }

  init() {
    this.states.scatter = new ScatterState(
      this.scatterX,
      this.scatterY,
      this.ghost,
      this.board,
    );
    // Each ghost has its unique chase behavior
    if (this.ghostName === "blinky") {
      // Blinky uses standard ChaseState
      this.states.chase = new ChaseState(this.hero, this.ghost, this.board);
    } else if (this.ghostName === "pinky") {
      // Pinky uses FlankState - targets 2 tiles ahead
      this.states.chase = new FlankState(this.hero, this.ghost, this.board);
    } else if (this.ghostName === "inky") {
      // Inky uses CutoffState - uses Blinky as reference for ambush targeting
      this.states.chase = new CutoffState(
        this.hero,
        this.ghost,
        this.board,
        this.blinky,
      );
    } else if (this.ghostName === "sue") {
      // Sue uses PlayfullChaseState - playful proximity-based behavior
      this.states.chase = new PlayfullChaseState(
        this.hero,
        this.ghost,
        this.board,
        this.scatterX,
        this.scatterY,
      );
    }
    this.states.frightened = new FrightenedState(this.ghost, this.board);
    this.states.eaten = new EatenState(
      this.ghost,
      this.board,
      this.spawnX,
      this.spawnY,
    );

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

  get speed() {
    return this.currentState ? this.currentState.speed : 0;
  }

  get targetPosition() {
    return this.currentState
      ? this.currentState.targetPosition
      : { x: this.ghost.x, y: this.ghost.y };
  }

  pickDirection(forceNewDirection = false) {
    if (!this.currentState) {
      return 4; // Direction.None
    }
    return this.currentState.pickDirection(forceNewDirection);
  }

  update(dt) {
    // Handle scatter timer (only if not yet transitioned to chase and not frightened)
    if (!this.hasTransitionedToChase && this.currentStateName === "scatter") {
      this.scatterTimer += dt;
      if (this.scatterTimer >= this.scatterDuration) {
        this.setState("chase");
        this.hasTransitionedToChase = true;
      }
    }
    if (this.currentStateName === "frightened") {
      this.frightTimer += dt;
      if (this.frightTimer >= this.frightDuration) {
        this.unfrighten();
        this.frightTimer = 0;
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
   * Called when ghost is eaten (player in powered state catches ghost)
   * Adds 200 points and transitions to eaten state
   */
  eat() {
    // Add 200 points to score
    if (this.ghost.scene && this.ghost.scene.gameManager) {
      this.ghost.scene.gameManager.addScore(200);
      // Update score display if it exists
      if (this.ghost.scene.scoreText) {
        this.ghost.scene.scoreText.setText(
          "Score: " + this.ghost.scene.gameManager.getScore(),
        );
      }
    }

    // Transition to eaten state - target becomes spawn point
    this.setState("eaten");
  }

  /**
   * Check if ghost is in eaten state
   */
  isEaten() {
    return this.currentStateName === "eaten";
  }

  /**
   * Check if ghost has reached spawn point while in eaten state
   */
  hasReachedSpawn() {
    if (
      this.currentStateName === "eaten" &&
      this.currentState.hasReachedSpawn
    ) {
      return this.currentState.hasReachedSpawn();
    }
    return false;
  }

  unfrighten() {
    // Return to chase if we've already transitioned, otherwise go back to scatter
    if (this.hasTransitionedToChase) {
      this.setState("chase");
    } else {
      this.setState("scatter");
    }
  }

  /**
   * Return to previous state after being eaten and reaching spawn
   * Reuses the same logic as unfrighten
   */
  returnToPreviousState() {
    this.unfrighten();
  }

  isFrightened() {
    return this.currentStateName === "frightened";
  }
}
