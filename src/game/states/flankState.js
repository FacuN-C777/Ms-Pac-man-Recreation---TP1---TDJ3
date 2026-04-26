import * as Phaser from "phaser";
import { GhostState } from "./ghostState.js";
import {
  Direction,
  getOrderedDirections,
  getOppositeDirection,
  positionInDirection,
} from "./ghostDirection.js";

export class FlankState extends GhostState {
  constructor(hero, ghost, board) {
    super(ghost, board);
    this.hero = hero;
  }

  get speed() {
    return 75; // Same as chase state
  }

  get targetPosition() {
    // Calculate position 4 tiles (32 pixels) ahead of player based on velocity
    const vel = this.hero.body.velocity;
    const tileDistance = 32; // 4 tiles * 8 pixels per tile

    let targetX = this.hero.x;
    let targetY = this.hero.y;

    // Determine direction from velocity and add offset
    if (Math.abs(vel.x) > 0.1) {
      // Moving horizontally
      targetX += vel.x > 0 ? tileDistance : -tileDistance;
    } else if (Math.abs(vel.y) > 0.1) {
      // Moving vertically
      targetY += vel.y > 0 ? tileDistance : -tileDistance;
    }
    // If not moving, use current position as fallback

    return { x: targetX, y: targetY };
  }

  pickDirection(forceNewDirection = false) {
    const target = this.targetPosition;
    const targetX = target.x;
    const targetY = target.y;

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
      targetX,
      targetY,
      directions,
    );
  }

  _determineBestDirection(x, y, targetX, targetY, directions) {
    let closestDirection = Direction.None;
    let closestDistance = -1;

    for (const dir of directions) {
      const position = positionInDirection(x, y, dir);

      // Check for wall collision - only block if Colision is explicitly true
      // This matches Phaser's setCollisionByProperty({ Colision: true }) behavior
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
