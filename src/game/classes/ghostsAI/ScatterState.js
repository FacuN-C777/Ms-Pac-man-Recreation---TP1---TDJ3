const { GhostState } = require("./GhostState");
const {
  Direction,
  getOrderedDirections,
  getOppositeDirection,
} = require("./IGhostAI");
const {
  determineDirectionFromTarget,
} = require("./determineDirectionFromTarget");

/**
 * Scatter State - Ghost moves to a fixed corner position
 * Each ghost has a unique corner they retreat to when not chasing
 */
class ScatterState extends GhostState {
  /**
   * @param {number} targetX - X position of scatter corner
   * @param {number} targetY - Y position of scatter corner
   * @param {Phaser.GameObjects.Container} ghost - The ghost entity
   * @param {Phaser.Tilemaps.DynamicTilemapLayer} board - Tilemap layer
   */
  constructor(targetX, targetY, ghost, board) {
    super(ghost, board);
    this.targetX = targetX;
    this.targetY = targetY;
  }

  /** @override */
  get targetPosition() {
    return { x: this.targetX, y: this.targetY };
  }

  /**
   * Pick direction toward scatter corner, avoiding 180° turns
   * @override
   */
  pickDirection() {
    // Get all directions except the one we came from (no 180° turns)
    const backwardsDirection = getOppositeDirection(
      this.ghost.currentDirection,
    );
    const directions = getOrderedDirections(
      (dir) => dir !== backwardsDirection,
    );

    return determineDirectionFromTarget(
      this.ghost.x,
      this.ghost.y,
      this.targetX,
      this.targetY,
      directions,
      this.board,
    );
  }
}

module.exports = { ScatterState };
