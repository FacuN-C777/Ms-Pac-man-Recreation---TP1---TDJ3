import * as Phaser from "phaser";
import { GhostState } from "./ghostState.js";
import {
  Direction,
  getOrderedDirections,
  getOppositeDirection,
  positionInDirection,
} from "./ghostDirection.js";

/**
 * CutoffState - Inky's behavior
 * Uses Blinky as a reference point to calculate target position
 * Formula: Target = P_ahead + (P_ahead - P_Blinky)
 * Where P_ahead is 2 tiles in front of the player, and P_Blinky is Blinky's position
 * This creates a "shadow" chase that tries to ambush the player
 */
export class CutoffState extends GhostState {
  constructor(hero, ghost, board, blinky) {
    super(ghost, board);
    this.hero = hero;
    this.blinky = blinky;
  }

  get speed() {
    return 75;
  }

  get targetPosition() {
    if (!this.hero || !this.blinky) {
      return { x: this.ghost.x, y: this.ghost.y };
    }

    const TileSize = 8;
    const ahead_distance = 2 * TileSize; // 2 tiles = 16 pixels

    // Get player velocity to determine which direction is "ahead"
    const vel = this.hero.body.velocity;

    // Calculate P_ahead (2 tiles in front of player based on movement direction)
    let P_ahead = { x: this.hero.x, y: this.hero.y };

    if (Math.abs(vel.x) > Math.abs(vel.y)) {
      // Moving horizontally
      P_ahead.x += (vel.x > 0 ? 1 : -1) * ahead_distance;
    } else if (Math.abs(vel.y) > Math.abs(vel.x)) {
      // Moving vertically
      P_ahead.y += (vel.y > 0 ? 1 : -1) * ahead_distance;
    } else {
      // Not moving or moving equally - default to right
      P_ahead.x += ahead_distance;
    }

    // Get Blinky's position
    const P_Blinky = { x: this.blinky.x, y: this.blinky.y };

    // Calculate target using the cutoff formula
    // Target = P_ahead + (P_ahead - P_Blinky)
    // This creates a vector from Blinky to P_ahead, then extends it
    const target = {
      x: P_ahead.x + (P_ahead.x - P_Blinky.x),
      y: P_ahead.y + (P_ahead.y - P_Blinky.y),
    };

    return target;
  }

  pickDirection(forceNewDirection = false) {
    const target = this.targetPosition;

    const backwardsDirection = getOppositeDirection(
      this.ghost.currentDirection,
    );

    // If current direction is None (initial state), don't filter any directions
    // If forceNewDirection is true, also filter out the current direction
    let directions = getOrderedDirections();
    if (backwardsDirection !== Direction.None) {
      directions = directions.filter((dir) => dir !== backwardsDirection);
    }
    if (forceNewDirection && this.ghost.currentDirection !== Direction.None) {
      directions = directions.filter(
        (dir) => dir !== this.ghost.currentDirection,
      );
    }

    return this._determineBestDirection(
      this.ghost.x,
      this.ghost.y,
      target.x,
      target.y,
      directions,
    );
  }

  _determineBestDirection(x, y, targetX, targetY, directions) {
    let closestDirection = Direction.None;
    let closestDistance = -1;

    for (const dir of directions) {
      const position = positionInDirection(x, y, dir);

      // Check for wall collision - only block if Colision is explicitly true
      const tile = this.board.getTileAtWorldXY(position.x, position.y);
      if (tile && tile.properties?.Colision === true) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        position.x,
        position.y,
        targetX,
        targetY,
      );

      if (closestDirection === Direction.None) {
        closestDirection = dir;
        closestDistance = distance;
        continue;
      }

      if (distance < closestDistance) {
        closestDirection = dir;
        closestDistance = distance;
      }
    }

    return closestDirection;
  }
}
