import { GhostState } from "./ghostState.js";
import {
  Direction,
  getOrderedDirections,
  getOppositeDirection,
  positionInDirection,
} from "./ghostDirection.js";

export class ChaseState extends GhostState {
  constructor(hero, ghost, board) {
    super(ghost, board);
    this.hero = hero;
  }

  get targetPosition() {
    return {
      x: this.hero.x,
      y: this.hero.y,
    };
  }

  pickDirection() {
    const targetX = this.hero.x;
    const targetY = this.hero.y;

    const backwardsDirection = getOppositeDirection(
      this.ghost.currentDirection,
    );
    const directions = getOrderedDirections().filter(
      (dir) => dir !== backwardsDirection,
    );

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
