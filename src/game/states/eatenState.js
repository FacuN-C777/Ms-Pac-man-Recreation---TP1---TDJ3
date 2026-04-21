import * as Phaser from "phaser";
import { GhostState } from "./ghostState.js";
import {
  Direction,
  getOrderedDirections,
  getOppositeDirection,
  positionInDirection,
} from "./ghostDirection.js";

export class EatenState extends GhostState {
  constructor(ghost, board, spawnX, spawnY) {
    super(ghost, board);
    this.spawnX = spawnX;
    this.spawnY = spawnY;
  }

  get speed() {
    return 150; // Faster than normal when returning home
  }

  get targetPosition() {
    return { x: this.spawnX, y: this.spawnY };
  }

  /**
   * Check if ghost has reached its spawn point
   */
  hasReachedSpawn() {
    const dist = Phaser.Math.Distance.Between(
      this.ghost.x,
      this.ghost.y,
      this.spawnX,
      this.spawnY,
    );
    return dist <= 8; // Within 8 pixels of spawn
  }

  pickDirection() {
    // Always move toward spawn point - use simple direction selection
    const currentPos = { x: this.ghost.x, y: this.ghost.y };
    const targetPos = { x: this.spawnX, y: this.spawnY };

    // Get all valid directions except backwards
    const backwardsDirection = getOppositeDirection(
      this.ghost.currentDirection,
    );
    const validDirections =
      backwardsDirection === Direction.None
        ? getOrderedDirections()
        : getOrderedDirections().filter((dir) => dir !== backwardsDirection);

    // Find direction that gets us closer to spawn
    let bestDirection = Direction.None;
    let bestDistance = Infinity;

    for (const dir of validDirections) {
      const position = positionInDirection(currentPos.x, currentPos.y, dir);
      const tile = this.board.getTileAtWorldXY(position.x, position.y);

      // Skip walls
      if (tile && tile.properties?.Colision === true) {
        continue;
      }

      const dist = Phaser.Math.Distance.Between(
        position.x,
        position.y,
        targetPos.x,
        targetPos.y,
      );

      if (dist < bestDistance) {
        bestDistance = dist;
        bestDirection = dir;
      }
    }

    return bestDirection;
  }
}
