import Phaser from "phaser";
import { GhostStateMachine } from "../states/ghostStateMachine.js";
import { GhostAnimations } from "./animationsManager/ghostAnimations.js";
import {
  Direction,
  positionInDirection,
  TileSize,
} from "../states/ghostDirection.js";

export class Ghost extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key, ghostName = "blinky") {
    super(scene, x, y, key);

    this.ghostName = ghostName;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 4x4 body for 8x8 tiles
    this.body.setSize(4, 4);
    this.body.setOffset(2, 2);
    this.body.setCircle(4).setFriction(0, 0);

    // State machine
    this.stateMachine = null;
    this.hero = null;
    this.board = null;

    // Track position for tile-based movement
    this.lastTilePosition = { x: -1, y: -1 };
    this.currentDirection = Direction.None;
    this.lastValidDirection = Direction.None;

    // Movement speed
    this.movementSpeed = 100;
  }

  init(hero, board, scatterX, scatterY) {
    this.hero = hero;
    this.board = board;

    this.stateMachine = new GhostStateMachine(
      this,
      board,
      hero,
      scatterX,
      scatterY,
    );
    this.stateMachine.init();
  }

  chase() {
    if (this.stateMachine) {
      this.stateMachine.setState("chase");
    }
  }

  scatter() {
    if (this.stateMachine) {
      this.stateMachine.setState("scatter");
    }
  }

  frighten() {
    if (this.stateMachine) {
      this.stateMachine.frighten();
      this.movementSpeed = 50;
    }
  }

  unfrighten() {
    if (this.stateMachine) {
      this.stateMachine.unfrighten();
      this.movementSpeed = 100;
    }
  }

  isFrightened() {
    return this.stateMachine ? this.stateMachine.isFrightened() : false;
  }

  preUpdate(t, dt) {
    super.preUpdate(t, dt);

    if (!this.stateMachine || !this.hero || !this.board) {
      return;
    }

    this.stateMachine.update(dt);

    // Handle world wrapping
    this.scene.physics.world.wrapObject(this, TileSize);

    const body = this.body;
    const x = body.position.x;
    const y = body.position.y;

    // Skip if outside world bounds
    if (
      !Phaser.Geom.Rectangle.Contains(this.scene.physics.world.bounds, x, y)
    ) {
      return;
    }

    // Snap to grid
    const gx = Math.floor(x / TileSize) * TileSize;
    const gy = Math.floor(y / TileSize) * TileSize;

    // Skip if we just handled this position
    if (this.lastTilePosition.x === gx && this.lastTilePosition.y === gy) {
      return;
    }

    // Only process when close to tile center
    if (Math.abs(x - gx) > 2 || Math.abs(y - gy) > 2) {
      return;
    }

    // We've reached a new tile - pick a new direction
    this.lastTilePosition = { x: gx, y: gy };

    const newDirection = this.stateMachine.pickDirection();

    if (newDirection !== Direction.None) {
      this.currentDirection = newDirection;
      this.lastValidDirection = newDirection;
      this.applyDirection(newDirection);
    } else if (this.lastValidDirection !== Direction.None) {
      const testPos = positionInDirection(
        this.x,
        this.y,
        this.lastValidDirection,
      );
      if (!this.board.getTileAtWorldXY(testPos.x, testPos.y)) {
        this.currentDirection = this.lastValidDirection;
        this.applyDirection(this.lastValidDirection);
      }
    }

    // Update animation based on state
    this.updateAnimation();
  }

  updateAnimation() {
    if (this.isFrightened()) {
      GhostAnimations.playFrightened(this);
    } else {
      const directionStr = GhostAnimations.getDirectionFromAngle(this.angle);
      GhostAnimations.playDirection(this, directionStr);
    }
  }

  applyDirection(direction) {
    const speed = this.stateMachine
      ? this.stateMachine.speed
      : this.movementSpeed;

    switch (direction) {
      case Direction.Up:
        this.setVelocity(0, -speed);
        this.setAngle(-90);
        break;
      case Direction.Down:
        this.setVelocity(0, speed);
        this.setAngle(90);
        break;
      case Direction.Left:
        this.setVelocity(-speed, 0);
        this.setAngle(180);
        break;
      case Direction.Right:
        this.setVelocity(speed, 0);
        this.setAngle(0);
        break;
      default:
        this.setVelocity(0, 0);
        break;
    }
  }
}
