import * as Phaser from "phaser";
import { PlayerAnimations } from "./animationsManager/playerAnimations.js";

const TILE_SIZE = 8;

const Moves = {
  None: 0,
  Left: 1,
  Right: 2,
  Up: 3,
  Down: 4,
};

const PlayerState = {
  Normal: 0,
  Powered: 1,
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key) {
    super(scene, x, y, key);

    this.scene = scene;
    this.movementSpeed = 200;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);

    // 4x4 body for 8x8 tiles (must be after physics.add.existing)
    this.body.setSize(4, 4);
    this.body.setOffset(2, 2);
    this.body.setCircle(4).setFriction(0, 0);

    // Movement state
    this.queuedMove = Moves.None;
    this.lastKeyDown = Moves.None;
    this.queuedMoveAccumulator = 0;

    // Power-up state
    this.playerState = PlayerState.Normal;
    this.poweredAccumulator = 0;
    this.playerAI = null;
  }

  setAI(ai) {
    this.playerAI = ai;
  }

  get isPowered() {
    return this.playerState === PlayerState.Powered;
  }

  get facingVector() {
    const vec = new Phaser.Math.Vector2();
    vec.setToPolar(this.rotation);
    return vec;
  }

  canEatDot(dot) {
    const playerPos = this.body.position;
    const body = dot.body;
    const dotPos = body.position.clone();
    dotPos.x -= body.offset.x;
    dotPos.y -= body.offset.y;

    return Phaser.Math.Distance.BetweenPointsSquared(playerPos, dotPos) <= 25;
  }

  eatPowerDot(dot) {
    this.playerState = PlayerState.Powered;
    this.poweredAccumulator = 0;
    dot.destroy(true);

    this.scene.events.emit("powered-start");
  }

  preUpdate(t, dt) {
    super.preUpdate(t, dt);

    this.scene.physics.world.wrapObject(this, TILE_SIZE);

    if (this.playerState === PlayerState.Normal) {
      return;
    }

    this.poweredAccumulator += dt;
    if (this.poweredAccumulator >= 8000) {
      this.playerState = PlayerState.Normal;
      this.poweredAccumulator = 0;

      this.scene.events.emit("powered-end");
    }
  }

  handleMovement(dt, cursors, boardLayer) {
    const halfTile = TILE_SIZE / 2;
    const vel = this.body.velocity;

    // Update animation based on movement
    if (vel.lengthSq() > 0.2) {
      const direction = this.getDirectionFromAngle(this.angle);
      PlayerAnimations.playDirection(this, direction);
    } else {
      PlayerAnimations.playStill(this);
    }

    const keysDown = this.getKeysDownState(cursors);

    // If we have a queued move waiting at intersection, use it
    if (this.queuedMove !== Moves.None) {
      this.queuedMoveAccumulator += dt;
      if (this.queuedMoveAccumulator >= 200) {
        this.queuedMove = Moves.None;
        this.queuedMoveAccumulator = 0;
      }
    }

    // Check for new input - simpler logic that works when stopped
    let newMove = Moves.None;

    if (keysDown.left) {
      const tileLeft = boardLayer.getTileAtWorldXY(this.x - TILE_SIZE, this.y);
      if (!tileLeft) {
        newMove = Moves.Left;
      }
    } else if (keysDown.right) {
      const tileRight = boardLayer.getTileAtWorldXY(this.x + TILE_SIZE, this.y);
      if (!tileRight) {
        newMove = Moves.Right;
      }
    } else if (keysDown.up) {
      const tileUp = boardLayer.getTileAtWorldXY(this.x, this.y - TILE_SIZE);
      if (!tileUp) {
        newMove = Moves.Up;
      }
    } else if (keysDown.down) {
      const tileDown = boardLayer.getTileAtWorldXY(this.x, this.y + TILE_SIZE);
      if (!tileDown) {
        newMove = Moves.Down;
      }
    }

    // If not currently moving, take the new input immediately
    // If moving, queue the input for next intersection
    if (vel.lengthSq() < 0.2) {
      // Not moving - start immediately
      this.lastKeyDown = newMove;
      this.queuedMove = Moves.None;
      this.queuedMoveAccumulator = 0;
    } else {
      // Already moving - queue for intersection
      if (newMove !== Moves.None && this.queuedMove === Moves.None) {
        this.queuedMove = newMove;
        this.queuedMoveAccumulator = 0;
      }
    }

    // Apply velocity based on lastKeyDown
    const speed = this.movementSpeed;
    switch (this.lastKeyDown) {
      case Moves.Left: {
        const tileY =
          Math.floor((this.body.y + halfTile) / TILE_SIZE) * TILE_SIZE;
        this.body.y = tileY;
        this.setVelocity(-speed, 0);
        this.setAngle(180);
        break;
      }

      case Moves.Right: {
        const tileY =
          Math.floor((this.body.y + halfTile) / TILE_SIZE) * TILE_SIZE;
        this.body.y = tileY;
        this.setVelocity(speed, 0);
        this.setAngle(0);
        break;
      }

      case Moves.Up: {
        const tileX =
          Math.floor((this.body.x + halfTile) / TILE_SIZE) * TILE_SIZE;
        this.body.x = tileX;
        this.setVelocity(0, -speed);
        this.setAngle(-90);
        break;
      }

      case Moves.Down: {
        const tileX =
          Math.floor((this.body.x + halfTile) / TILE_SIZE) * TILE_SIZE;
        this.body.x = tileX;
        this.setVelocity(0, speed);
        this.setAngle(90);
        break;
      }

      default: {
        // No input - stop
        this.setVelocity(0, 0);
        break;
      }
    }
  }

  getDirectionFromAngle(angle) {
    if (angle === 0 || angle === 360) {
      return "right";
    }
    if (angle === 180 || angle === -180) {
      return "left";
    }
    if (angle === -90) {
      return "up";
    }
    if (angle === 90) {
      return "down";
    }
    return "right";
  }

  getKeysDownState(cursors) {
    if (this.playerAI) {
      return this.playerAI.getKeysDownState();
    }

    return {
      left: cursors.left?.isDown,
      right: cursors.right?.isDown,
      up: cursors.up?.isDown,
      down: cursors.down?.isDown,
    };
  }
}
