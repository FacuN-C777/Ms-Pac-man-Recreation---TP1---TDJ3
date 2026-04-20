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

  pickDirection() {
    const backwardsDirection = getOppositeDirection(
      this.ghost.currentDirection,
    );
    const directions = getOrderedDirections().filter(
      (dir) => dir !== backwardsDirection,
    );

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

      // Check for wall collision
      if (this.board.getTileAtWorldXY(position.x, position.y)) {
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
