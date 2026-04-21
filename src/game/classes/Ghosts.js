import * as Phaser from "phaser";
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
    this.body.setOffset(6, 6);
    //this.body.setCircle(4).setFriction(0, 0);

    // State machine
    this.stateMachine = null;
    this.hero = null;
    this.board = null;

    // Track position for tile-based movement
    this.lastTilePosition = { x: -1, y: -1 };
    this.currentDirection = Direction.Right;
    this.lastValidDirection = Direction.Right;
    this.hasAppliedInitialDirection = false;

    // Tile snapping tolerance (same as Player class)
    this.turnTolerance = 8;
    this.lastProcessedTile = null;

    // Movement speed
    this.movementSpeed = 75;
  }

  init(hero, board, scatterX, scatterY) {
    this.hero = hero;
    this.board = board;

    // Store actual spawn point (different from scatter target)
    this.spawnX = this.x;
    this.spawnY = this.y;

    this.stateMachine = new GhostStateMachine(
      this,
      board,
      hero,
      scatterX,
      scatterY,
      this.spawnX,
      this.spawnY,
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
      this.movementSpeed = 75;
    }
  }

  isFrightened() {
    return this.stateMachine ? this.stateMachine.isFrightened() : false;
  }

  isEaten() {
    return this.stateMachine ? this.stateMachine.isEaten() : false;
  }

  eat() {
    if (this.stateMachine) {
      this.stateMachine.eat();
    }
  }

  hasReachedSpawn() {
    return this.stateMachine ? this.stateMachine.hasReachedSpawn() : false;
  }

  returnToPreviousState() {
    if (this.stateMachine) {
      this.stateMachine.returnToPreviousState();
    }
  }

  preUpdate(t, dt) {
    super.preUpdate(t, dt);

    if (!this.stateMachine || !this.hero || !this.board) {
      return;
    }

    this.stateMachine.update(dt);

    // Handle world wrapping
    this.scene.physics.world.wrapObject(this, TileSize);

    // Apply initial direction only once at start
    if (!this.hasAppliedInitialDirection) {
      this.applyDirection(this.currentDirection);
      this.hasAppliedInitialDirection = true;
    }

    const body = this.body;
    const x = body.position.x;
    const y = body.position.y;

    // Skip if outside world bounds
    if (
      !Phaser.Geom.Rectangle.Contains(this.scene.physics.world.bounds, x, y)
    ) {
      return;
    }

    // Get current tile (may be null if in a corridor with no wall tile)
    const currentTile = this.board.getTileAtWorldXY(x, y);

    // Determine if we're at a new tile position
    // Handle both cases: when tile exists and when it's null (walkable corridor)
    let isNewTile = false;
    if (currentTile) {
      isNewTile =
        !this.lastProcessedTile ||
        currentTile.x !== this.lastProcessedTile.x ||
        currentTile.y !== this.lastProcessedTile.y;
    } else {
      // No tile = walkable corridor, use world position to detect new tile
      const currentTilePos = {
        x: Math.floor(x / TileSize),
        y: Math.floor(y / TileSize),
      };
      isNewTile =
        !this.lastProcessedTile ||
        currentTilePos.x !== this.lastProcessedTile.x ||
        currentTilePos.y !== this.lastProcessedTile.y;
    }

    // Check alignment - use currentTile if available, otherwise use last known
    const isAligned = currentTile
      ? this.isAlignedForTurn(x, y, currentTile)
      : this.isAlignedForTurn(x, y, null);

    // Check if physics blocked our movement (velocity is zero but we have a direction)
    const vel = body.velocity;
    const isBlocked =
      Math.abs(vel.x) < 0.1 &&
      Math.abs(vel.y) < 0.1 &&
      this.currentDirection !== Direction.None;

    // Process direction change at new tiles, when aligned, OR when blocked by wall
    if ((isNewTile && isAligned) || isBlocked) {
      // Track position whether we have a tile or not
      if (currentTile) {
        this.lastProcessedTile = { x: currentTile.x, y: currentTile.y };
      } else {
        this.lastProcessedTile = {
          x: Math.floor(x / TileSize),
          y: Math.floor(y / TileSize),
        };
      }

      // Pick new direction from state machine
      // If blocked, force a different direction by clearing current temporarily
      const wasBlocked = isBlocked;
      const newDirection = this.stateMachine.pickDirection(wasBlocked);

      if (newDirection !== Direction.None) {
        this.currentDirection = newDirection;
        this.lastValidDirection = newDirection;
        this.applyDirection(newDirection);
      } else if (this.lastValidDirection !== Direction.None) {
        // Keep going in last valid direction if no new direction
        const testPos = positionInDirection(
          this.x,
          this.y,
          this.lastValidDirection,
        );
        const testTile = this.board.getTileAtWorldXY(testPos.x, testPos.y);
        // Only block if tile has Colision property
        if (!testTile || testTile.properties?.Colision !== true) {
          this.currentDirection = this.lastValidDirection;
          this.applyDirection(this.lastValidDirection);
        }
      }
    }

    // Update animation every frame
    this.updateAnimation();
  }

  // Check if ghost is aligned with tile center (tolerance-based, like Player)
  isAlignedForTurn(x, y, currentTile) {
    // If no tile, use grid-based alignment check
    if (!currentTile) {
      const tileX = Math.floor(x / TileSize) * TileSize + TileSize / 2;
      const tileY = Math.floor(y / TileSize) * TileSize + TileSize / 2;
      const vel = this.body.velocity;

      if (Math.abs(vel.x) > 0.1) {
        return Math.abs(y - tileY) <= this.turnTolerance;
      } else if (Math.abs(vel.y) > 0.1) {
        return Math.abs(x - tileX) <= this.turnTolerance;
      }
      const dist = Phaser.Math.Distance.Between(x, y, tileX, tileY);
      return dist <= this.turnTolerance;
    }

    const tileCenterX = currentTile.pixelX + TileSize / 2;
    const tileCenterY = currentTile.pixelY + TileSize / 2;

    const vel = this.body.velocity;

    // More lenient alignment check based on movement direction
    if (Math.abs(vel.x) > 0.1) {
      // Moving horizontally - check vertical alignment
      return Math.abs(y - tileCenterY) <= this.turnTolerance;
    } else if (Math.abs(vel.y) > 0.1) {
      // Moving vertically - check horizontal alignment
      return Math.abs(x - tileCenterX) <= this.turnTolerance;
    }

    // Not moving - use general tolerance
    const dist = Phaser.Math.Distance.Between(x, y, tileCenterX, tileCenterY);
    return dist <= this.turnTolerance;
  }

  // Update animation every frame - use velocity-based direction (like Player)
  updateAnimation() {
    const vel = this.body.velocity;

    if (this.isEaten()) {
      // Eaten state - use ghostEaten animation set
      const direction = this.getDirectionFromVelocity(vel);
      GhostAnimations.playEaten(this, direction);
    } else if (this.isFrightened()) {
      GhostAnimations.playFrightened(this);
    } else if (Math.abs(vel.x) > 0.1 || Math.abs(vel.y) > 0.1) {
      // Derive direction from velocity (same as Player class)
      const direction = this.getDirectionFromVelocity(vel);
      GhostAnimations.playDirection(this, direction);
    }
  }

  // Derive direction from velocity vector (same as Player class)
  getDirectionFromVelocity(vel) {
    if (vel.x < 0) return "left";
    if (vel.x > 0) return "right";
    if (vel.y < 0) return "up";
    if (vel.y > 0) return "down";
    return "right";
  }

  applyDirection(direction) {
    const speed = this.stateMachine
      ? this.stateMachine.speed
      : this.movementSpeed;

    switch (direction) {
      case Direction.Up:
        this.setVelocity(0, -speed);
        break;
      case Direction.Down:
        this.setVelocity(0, speed);
        break;
      case Direction.Left:
        this.setVelocity(-speed, 0);
        break;
      case Direction.Right:
        this.setVelocity(speed, 0);
        break;
      default:
        this.setVelocity(0, 0);
        break;
    }
  }
}
