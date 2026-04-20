const Phaser = require("phaser");
const { Direction } = require("./Direction");
const {
  GhostStateMachine,
  ChaseState,
  ScatterState,
} = require("./GhostStateMachine");

/**
 * Ghost Entity
 * Ghost class with State Machine AI using a Sprite
 */
class Ghost extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene - Scene to add the ghost to
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {string} texture - Texture key for the sprite
   * @param {string|number} frame - Initial frame
   */
  constructor(scene, x, y, texture, frame) {
    super(scene, x, y, texture, frame);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    this.body.setCircle(14).setFriction(0, 0);

    // Debug target indicator
    this.targetIndicator = scene.add
      .text(0, 0, "x")
      .setOrigin(0.5)
      .setDepth(1000);
    this.enableTargetMarker(false);

    // State machine (initialized later with hero reference)
    this.stateMachine = null;
    this.hero = null;
    this.board = null;

    // Track position for tile-based movement
    this.lastTilePosition = { x: -1, y: -1 };
    this.lastDirection = Direction.None;
  }

  /**
   * Initialize the ghost with game references
   * @param {Phaser.Physics.Arcade.Sprite} hero - Player reference
   * @param {Phaser.Tilemaps.DynamicTilemapLayer} board - Tilemap layer
   * @param {number} scatterX - Scatter corner X
   * @param {number} scatterY - Scatter corner Y
   */
  init(hero, board, scatterX, scatterY) {
    this.hero = hero;
    this.board = board;

    // Create state machine with Chase and Scatter states
    this.stateMachine = new GhostStateMachine(this, board)
      .addState("chase", new ChaseState(hero, this, board))
      .addState("scatter", new ScatterState(scatterX, scatterY, this, board));
  }

  /**
   * Switch to chase mode
   */
  chase() {
    if (this.stateMachine) {
      this.stateMachine.setState("chase");
    }
  }

  /**
   * Switch to scatter mode
   */
  scatter() {
    if (this.stateMachine) {
      this.stateMachine.setState("scatter");
    }
  }

  /**
   * Enable/disable target marker for debugging
   * @param {boolean} enable
   */
  enableTargetMarker(enable) {
    this.targetIndicator.setVisible(enable);
    return this;
  }

  /**
   * Set ghost color tint
   * @param {number} tint - Hex color value
   * @param {string} colorName - Color name for text
   */
  setTint(tint, colorName) {
    super.setTint(tint);
    this.targetIndicator.setColor(colorName);
    return this;
  }

  makeRed() {
    return this.setTint(0xff0400, "#FF0400");
  }
  makeTeal() {
    return this.setTint(0x0cf9e3, "#0CF9E3");
  }
  makePink() {
    return this.setTint(0xfcb4e3, "#FCB4E3");
  }
  makeOrange() {
    return this.setTint(0xfcb72c, "#FCB72C");
  }

  /**
   * Main update loop - handles tile-based movement
   * @param {number} t - Time
   * @param {number} dt - Delta time
   */
  preUpdate(t, dt) {
    if (!this.stateMachine || !this.hero || !this.board) {
      return;
    }

    // Handle world wrapping (teleport at edges)
    this.scene.physics.world.wrapObject(this, 32);

    const body = this.body;
    const x = body.position.x;
    const y = body.position.y;

    // Skip if outside world bounds (being wrapped)
    if (
      !Phaser.Geom.Rectangle.Contains(this.scene.physics.world.bounds, x, y)
    ) {
      return;
    }

    // Snap to grid
    const gx = Math.floor(x / 32) * 32;
    const gy = Math.floor(y / 32) * 32;

    // Skip if we just handled this position
    if (this.lastTilePosition.x === gx && this.lastTilePosition.y === gy) {
      return;
    }

    // Only process when close to tile center
    if (Math.abs(x - gx) > 4 || Math.abs(y - gy) > 4) {
      return;
    }

    // Snap to tile center
    body.position.x = gx;
    body.position.y = gy;
    this.lastTilePosition.x = gx;
    this.lastTilePosition.y = gy;

    // Get direction from state machine
    const speed = this.stateMachine.speed;
    const dir = this.stateMachine.pickDirection();

    // Update target indicator for debugging
    const tPos = this.stateMachine.targetPosition;
    this.targetIndicator.setPosition(tPos.x, tPos.y);

    // Apply movement based on direction
    switch (dir) {
      case 0: // Left
        body.setVelocity(-speed, 0);
        break;
      case 1: // Right
        body.setVelocity(speed, 0);
        break;
      case 2: // Up
        body.setVelocity(0, -speed);
        break;
      case 3: // Down
        body.setVelocity(0, speed);
        break;
    }

    this.lastDirection = dir;
  }

  /** @returns {number} Current direction */
  get currentDirection() {
    return this.lastDirection;
  }
}

module.exports = { Ghost };
