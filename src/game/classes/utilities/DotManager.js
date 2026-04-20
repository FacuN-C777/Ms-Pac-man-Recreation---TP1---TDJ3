import * as Phaser from "phaser";
/**
 * Dot Manager - Handles creation and collection of dots/pellets
 *
 * Dots are created from a Tilemap layer in Tiled format:
 * - Tile ID 898 = small dot (regular pellet)
 * - Tile ID 926 = power dot (large pellet, gives ghost vulnerability)
 */

const Phaser = require("phaser");

/**
 * Dot Manager Class
 * Creates dots from a tilemap layer and handles collision detection
 */
class DotManager {
  /**
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    this.scene = scene;
    this.dots = null; // Group for small dots
    this.powerDots = null; // Group for power dots
    this.totalDots = 0;
    this.collectedDots = 0;
  }

  /**
   * Create dots from a tilemap layer
   * @param {Phaser.Tilemaps.DynamicTilemapLayer} dotsLayer - The Dots layer from Tiled
   * @param {Phaser.Tilemaps.Tileset} tileset - The tileset containing dot sprites
   */
  createFromTilemap(dotsLayer, tileset) {
    // Create small dots (tile ID 898)
    const smallDots = dotsLayer.createFromTiles(898, -1, {
      key: "tiles",
      frame: "Punto.png",
      origin: 0,
    });

    this.dots = this.scene.physics.add.group();
    smallDots.forEach((dot) => {
      this.dots.add(dot);
      const body = dot.body;
      body.setCircle(4, 12, 12);
    });

    // Create power dots (tile ID 926)
    const powerDotData = dotsLayer.createFromTiles(926, -1, {
      key: "tiles",
      frame: "PuntoPower.png",
      origin: 0,
    });

    this.powerDots = this.scene.physics.add.group();
    powerDotData.forEach((dot) => {
      this.powerDots.add(dot);
      const body = dot.body;
      body.setCircle(8, 8, 8);

      // Animate power dots (pulsing effect)
      this.scene.tweens.add({
        targets: dot,
        alpha: 0,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    });

    this.totalDots = this.dots.getLength() + this.powerDots.getLength();
    this.collectedDots = 0;

    console.log(
      `Created ${this.dots.getLength()} small dots and ${this.powerDots.getLength()} power dots`,
    );
  }

  /**
   * Set up collision overlap with the player
   * @param {Phaser.GameObjects.Container} player - The player (Pac-Man)
   * @param {Function} onEatDot - Callback when a small dot is eaten
   * @param {Function} onEatPowerDot - Callback when a power dot is eaten
   * @param {Function} [canEatDot] - Optional predicate to check if dot can be eaten
   */
  setupCollision(player, onEatDot, onEatPowerDot, canEatDot) {
    // Overlap with small dots
    this.scene.physics.add.overlap(
      player,
      this.dots,
      (obj1, obj2) => {
        // Check if player is close enough to eat
        if (canEatDot && !canEatDot(obj1, obj2)) {
          return;
        }
        onEatDot(obj1, obj2);
      },
      null,
      this.scene,
    );

    // Overlap with power dots
    this.scene.physics.add.overlap(
      player,
      this.powerDots,
      (obj1, obj2) => {
        if (canEatDot && !canEatDot(obj1, obj2)) {
          return;
        }
        onEatPowerDot(obj1, obj2);
      },
      null,
      this.scene,
    );
  }

  /**
   * Check if player can eat a specific dot
   * Uses distance check - player must be close enough
   * @param {Phaser.GameObjects.Container} player
   * @param {Phaser.Physics.Arcade.Sprite} dot
   * @returns {boolean}
   */
  static canEatDot(player, dot) {
    const playerPos = player.body.position;
    const dotBody = dot.body;

    // Calculate dot's world position accounting for offset
    const dotPos = {
      x: dotBody.position.x - dotBody.offset.x,
      y: dotBody.position.y - dotBody.offset.y,
    };

    // Check if within eating range (10px = 100 squared distance)
    return Phaser.Math.Distance.BetweenPointsSquared(playerPos, dotPos) <= 100;
  }

  /**
   * Remove a dot from the game
   * @param {Phaser.Physics.Arcade.Sprite} dot
   */
  removeDot(dot) {
    dot.destroy(true);
    this.collectedDots++;
  }

  /**
   * Get remaining dot count
   * @returns {number}
   */
  getRemainingDots() {
    return this.totalDots - this.collectedDots;
  }

  /**
   * Get collection progress as percentage
   * @returns {number} 0-100
   */
  getProgress() {
    if (this.totalDots === 0) return 100;
    return (this.collectedDots / this.totalDots) * 100;
  }

  /**
   * Check if all dots have been collected
   * @returns {boolean}
   */
  isComplete() {
    return this.collectedDots >= this.totalDots;
  }
}

module.exports = { DotManager };
