import * as Phaser from "phaser";
import { GhostState } from "./ghostState.js";
import {
  Direction,
  getOrderedDirections,
  getOppositeDirection,
  positionInDirection,
} from "./ghostDirection.js";

export class ScatterState extends GhostState {
  constructor(targetX, targetY, ghost, board) {
    super(ghost, board);
    this.targetX = targetX;
    this.targetY = targetY;
  }

  get targetPosition() {
    return { x: this.targetX, y: this.targetY };
  }

  pickDirection(forceNewDirection = false) {
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
      this.targetX,
      this.targetY,
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
