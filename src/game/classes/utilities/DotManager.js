import * as Phaser from "phaser";
/**
 * Dot Manager - Handles creation and collection of dots/pellets
 *
 * Dots are created from a Tilemap layer in Tiled format:
 * - Tile ID 898 = small dot (regular pellet)
 * - Tile ID 926 = power dot (large pellet, gives ghost vulnerability)
 */
export class DotManager {
  constructor(scene) {
    this.scene = scene;
    this.dots = null; // Group for small dots
    this.powerDots = null; // Group for power dots
    this.totalDots = 0;
    this.collectedDots = 0;
    this.score = 0;

    // Callbacks for collectable spawning
    this.onDotsReached70 = null;
    this.onDotsReached170 = null;
    this.milestoneReached70 = false;
    this.milestoneReached170 = false;
  }

  createFromTilemap(dotsLayer, tileset) {
    // Create small dots (tile ID 898)
    const smallDots = dotsLayer.createFromTiles(898, -1, {
      key: "dot",
      origin: -0.5, // Center the sprite anchor
    });

    this.dots = this.scene.physics.add.group();
    smallDots.forEach((dot) => {
      this.dots.add(dot);
      const body = dot.body;
      // Center the circle on the 8x8 tile: offset = -radius
      body.setCircle(4, -2, -2);
    });

    // Create power dots (tile ID 926)
    const powerDots = dotsLayer.createFromTiles(926, -1, {
      key: "powerDot",
      origin: 0,
    });

    this.PowerDots = this.scene.physics.add.group();
    powerDots.forEach((dot) => {
      this.PowerDots.add(dot);
      const body = dot.body;
      // Center the circle on the 8x8 tile: offset = -radius
      body.setCircle(8, -4, -4);

      // Animate power dots (pulsing effect)
      this.scene.tweens.add({
        targets: dot,
        alpha: 0,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    });

    this.totalDots = this.dots.getLength() + this.PowerDots.getLength();
    this.collectedDots = 0;

    console.log(
      `Created ${this.dots.getLength()} small dots and ${this.PowerDots.getLength()} power dots`,
    );
  }

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
      this.PowerDots,
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

  removeDot(dot) {
    dot.destroy(true);
    this.collectedDots++;

    // Check for milestone at 70 dots
    if (this.collectedDots === 70 && !this.milestoneReached70) {
      this.milestoneReached70 = true;
      if (this.onDotsReached70) {
        this.onDotsReached70();
      }
    }

    // Check for milestone at 170 dots
    if (this.collectedDots === 170 && !this.milestoneReached170) {
      this.milestoneReached170 = true;
      if (this.onDotsReached170) {
        this.onDotsReached170();
      }
    }
  }

  setMilestoneCallbacks(onReached70, onReached170) {
    this.onDotsReached70 = onReached70;
    this.onDotsReached170 = onReached170;
  }

  getRemainingDots() {
    return this.totalDots - this.collectedDots;
  }

  getProgress() {
    if (this.totalDots === 0) return 100;
    return (this.collectedDots / this.totalDots) * 100;
  }

  isComplete() {
    return this.collectedDots >= this.totalDots;
  }
}
