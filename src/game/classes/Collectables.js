import * as Phaser from "phaser";

export class Collectable extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key, paths = {}) {
    super(scene, x, y, key);

    this.scene = scene;
    this.key = key; // "cherry", "strawberry", etc.

    // Physics setup
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(8, 8);
    this.body.setOffset(4, 4);

    // Path system
    this.paths = paths; // { entry: [], lap: [], exit: [] }
    this.currentPathName = "entry";
    this.currentWaypointIndex = 0;
    this.currentPath = this.paths[this.currentPathName] || [];

    // Movement
    this.speed = 80; // pixels per second
    this.moveDirection = new Phaser.Math.Vector2(0, 0);

    // Timer system (despawn after ~9.5 seconds)
    this.lifespan = 9500; // milliseconds
    this.elapsedTime = 0;
    this.isActive = true;

    // Lap tracking
    this.lapCount = 0;
    this.maxLaps = 1;

    // Animation
    this.setTint(0xffffff);
    this.pulseTimer = 0;
  }

  init(entryDirection = "left") {
    if (entryDirection === "left") {
      this.currentPathName = "entry";
    } else {
      // Mirror the entry path for right-side entry if needed
      this.currentPathName = "entry";
    }

    this.currentPath = this.paths[this.currentPathName] || [];
    this.currentWaypointIndex = 0;

    if (this.currentPath.length > 0) {
      const firstWaypoint = this.currentPath[0];
      this.setPosition(firstWaypoint.x, firstWaypoint.y);
    }
  }

  update(time, delta) {
    if (!this.isActive) {
      return;
    }

    this.elapsedTime += delta;

    if (this.elapsedTime >= this.lifespan) {
      this.despawn();
      return;
    }

    // Pulse animation (visual feedback)
    this.pulseTimer += delta;
    if (this.pulseTimer > 500) {
      this.pulseTimer = 0;
      this.setAlpha(this.alpha === 1 ? 0.8 : 1);
    }

    if (this.currentPath && this.currentPath.length > 0) {
      this.followPath(delta);
    }
  }

  followPath(delta) {
    const currentWaypoint = this.currentPath[this.currentWaypointIndex];
    if (!currentWaypoint) {
      this.transitionToNextPath();
      return;
    }

    const target = new Phaser.Math.Vector2(
      currentWaypoint.x,
      currentWaypoint.y,
    );
    const current = new Phaser.Math.Vector2(this.x, this.y);
    const direction = target.subtract(current);
    const distance = direction.length();

    // Check if reached waypoint (within 2 pixels)
    if (distance < 2) {
      this.currentWaypointIndex++;
      return;
    }

    // Move toward waypoint
    direction.normalize();
    const moveAmount = this.speed * (delta / 1000); // delta is in milliseconds
    this.x += direction.x * moveAmount;
    this.y += direction.y * moveAmount;
  }

  /**
   * Transition to the next phase of movement
   */
  transitionToNextPath() {
    if (this.currentPathName === "entry") {
      // Finished entry, start lapping around chamber
      this.currentPathName = "lap";
      this.currentPath = this.paths["lap"] || [];
      this.currentWaypointIndex = 0;
      this.lapCount++;
    } else if (this.currentPathName === "lap" && this.lapCount < this.maxLaps) {
      // Continue lapping
      this.currentPath = this.paths["lap"] || [];
      this.currentWaypointIndex = 0;
      this.lapCount++;
    } else if (
      this.currentPathName === "lap" &&
      this.lapCount >= this.maxLaps
    ) {
      // Finished laps, now exit
      this.currentPathName = "exit";
      this.currentPath = this.paths["exit"] || [];
      this.currentWaypointIndex = 0;
    } else if (this.currentPathName === "exit") {
      // Exited the maze, despawn
      this.despawn();
    }
  }

  /**
   * Despawn the collectable (remove from scene)
   */
  despawn() {
    this.isActive = false;
    this.destroy(true);
  }

  /**
   * Called when the player collects this collectable
   * @returns {number} Score value for this collectable
   */
  collect() {
    // Different collectables have different scores
    const scoreValues = {
      holyWater: 100, // Lowest value
      crucifix: 300, // Middle value
      stake: 500, // Highest value
    };

    const score = scoreValues[this.key] || 100;
    this.despawn();
    return score;
  }

  /**
   * Get the score value for this collectable without collecting it
   */
  getScoreValue() {
    const scoreValues = {
      holyWater: 100, // Lowest value
      crucifix: 300, // Middle value
      stake: 500, // Highest value
    };
    return scoreValues[this.key] || 100;
  }

  /**
   * Check if collectable is still active on screen
   */
  isOnScreen() {
    return this.isActive && this.elapsedTime < this.lifespan;
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingTime() {
    return Math.max(0, (this.lifespan - this.elapsedTime) / 1000);
  }
}
