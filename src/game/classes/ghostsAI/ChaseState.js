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
 * Chase State - Ghost directly pursues the player (Pac-Man)
 */
class ChaseState extends GhostState {
  /**
   * @param {Phaser.Physics.Arcade.Sprite} hero - The player entity
   * @param {Phaser.Physics.Arcade.Sprite} ghost - The ghost entity
   * @param {Phaser.Tilemaps.DynamicTilemapLayer} board - Tilemap layer
   */
  constructor(hero, ghost, board) {
    super(ghost, board);
    this.hero = hero;
  }

  /** @override */
  get targetPosition() {
    return {
      x: this.hero.x,
      y: this.hero.y,
    };
  }

  /**
   * Pick direction toward the hero, avoiding 180° turns
   * @override
   */
  pickDirection() {
    // Get hero's current position
    const targetX = this.hero.x;
    const targetY = this.hero.y;

    // Get all directions except backwards (no 180° turns)
    const backwardsDirection = getOppositeDirection(
      this.ghost.currentDirection,
    );
    const directions = getOrderedDirections(
      (dir) => dir !== backwardsDirection,
    );

    return determineDirectionFromTarget(
      this.ghost.x,
      this.ghost.y,
      targetX,
      targetY,
      directions,
      this.board,
    );
  }
}

module.exports = { ChaseState };
