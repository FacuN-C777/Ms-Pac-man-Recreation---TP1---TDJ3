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
    this.movementSpeed = 100;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    //this.setCollideWorldBounds(true);

    // 4x4 body for 8x8 tiles (must be after physics.add.existing)
    this.body.setSize(4, 4);
    this.body.setOffset(6, 6);
    //this.body.setCircle(4).setFriction(0, 0);

    // Movement state
    this.queuedMove = Moves.None;
    this.lastKeyDown = Moves.None;
    this.queuedMoveAccumulator = 0;

    // Turn Maker - Cornering assistance
    this.turnTolerance = 8; // pixels - increased from 6 for more lenient turning
    this.lookAheadTiles = 2; // check up to 2 tiles ahead for valid turns
    this.lastIntersectionPos = null; // track last intersection for turn execution

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

  // Helper: check if a tile is walkable (no collision)
  isTileWalkable(tile) {
    // If no tile exists (out of bounds), not walkable
    if (!tile) return false;
    // Check if tile has collision property set to true
    return tile.properties?.Colision !== true;
  }

  handleMovement(dt, cursors, boardLayer) {
    const vel = this.body.velocity;
    const keysDown = this.getKeysDownState(cursors);

    // ========== TURN MAKER LOGIC ==========

    // 1. First, try to process any queued turn when entering turn zone
    const turned = this.processTurnMaker(boardLayer);

    // 2. If we just executed a turn, skip input processing this frame
    // (prevents input from immediately overriding the turn)
    if (!turned) {
      // 3. Check for new input - try to queue a turn
      if (keysDown.left) {
        this.tryQueueTurn(Moves.Left, boardLayer);
      } else if (keysDown.right) {
        this.tryQueueTurn(Moves.Right, boardLayer);
      } else if (keysDown.up) {
        this.tryQueueTurn(Moves.Up, boardLayer);
      } else if (keysDown.down) {
        this.tryQueueTurn(Moves.Down, boardLayer);
      } else {
        // No keys pressed - clear queued move if we're aligned
        // (player changed their mind)
        if (this.isAlignedForTurn(boardLayer)) {
          this.queuedMove = Moves.None;
        }
      }
    }

    // 4. Apply velocity based on lastKeyDown (current direction)
    const speed = this.movementSpeed;
    switch (this.lastKeyDown) {
      case Moves.Left:
        this.setVelocity(-speed, 0);
        break;

      case Moves.Right:
        this.setVelocity(speed, 0);
        break;

      case Moves.Up:
        this.setVelocity(0, -speed);
        break;

      case Moves.Down:
        this.setVelocity(0, speed);
        break;

      default:
        // No valid direction - stop
        this.setVelocity(0, 0);
        break;
    }

    // Update animation - derive direction from velocity
    if (vel.lengthSq() > 0.2) {
      const direction = this.getDirectionFromVelocity(vel);
      PlayerAnimations.playDirection(this, direction);
    } else {
      PlayerAnimations.playStill(this);
    }
  }

  // Derive direction from velocity vector (used by animations)
  getDirectionFromVelocity(vel) {
    if (vel.x < 0) return "left";
    if (vel.x > 0) return "right";
    if (vel.y < 0) return "up";
    if (vel.y > 0) return "down";
    return "right";
  }

  // ========== TURN MAKER - Cornering Assistance ==========

  /**
   * Check if player is at an intersection (tile where multiple directions are possible)
   */
  isAtIntersection(boardLayer) {
    const tile = boardLayer.getTileAtWorldXY(this.x, this.y);
    if (!tile) return false;

    // Count walkable adjacent tiles
    let walkableCount = 0;
    const directions = [
      { dx: -TILE_SIZE, dy: 0, move: Moves.Left },
      { dx: TILE_SIZE, dy: 0, move: Moves.Right },
      { dx: 0, dy: -TILE_SIZE, move: Moves.Up },
      { dx: 0, dy: TILE_SIZE, move: Moves.Down },
    ];

    for (const dir of directions) {
      const adjTile = boardLayer.getTileAtWorldXY(
        this.x + dir.dx,
        this.y + dir.dy,
      );
      if (this.isTileWalkable(adjTile)) {
        walkableCount++;
      }
    }

    // Intersection = more than 2 walkable directions (including current path)
    return walkableCount >= 3;
  }

  /**
   * Get the center position of a specific tile
   */
  getTileCenter(boardLayer, tile) {
    if (!tile) return null;
    return {
      x: tile.pixelX + TILE_SIZE / 2,
      y: tile.pixelY + TILE_SIZE / 2,
    };
  }

  /**
   * Get current tile
   */
  getCurrentTile(boardLayer) {
    return boardLayer.getTileAtWorldXY(this.x, this.y);
  }

  /**
   * Check if player is within the tolerance zone of a tile center
   */
  isInTurnZone(boardLayer) {
    const tile = this.getCurrentTile(boardLayer);
    if (!tile) return false;

    const center = this.getTileCenter(boardLayer, tile);
    const dist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      center.x,
      center.y,
    );
    return dist <= this.turnTolerance;
  }

  /**
   * Check if we're aligned with a tile center (within tolerance) on the axis we're moving
   * This is more lenient - only check alignment on the movement axis
   */
  isAlignedForTurn(boardLayer) {
    const tile = this.getCurrentTile(boardLayer);
    if (!tile) return false;

    const center = this.getTileCenter(boardLayer, tile);
    const vel = this.body.velocity;

    // Check alignment on the axis perpendicular to movement
    if (Math.abs(vel.x) > 0.1) {
      // Moving horizontally - check vertical alignment
      return Math.abs(this.y - center.y) <= this.turnTolerance;
    } else if (Math.abs(vel.y) > 0.1) {
      // Moving vertically - check horizontal alignment
      return Math.abs(this.x - center.x) <= this.turnTolerance;
    }

    // Not moving - use general tolerance
    const dist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      center.x,
      center.y,
    );
    return dist <= this.turnTolerance;
  }

  /**
   * Check if a direction is valid (walkable) at current position
   */
  canMoveInDirection(boardLayer, move) {
    let dx = 0,
      dy = 0;
    switch (move) {
      case Moves.Left:
        dx = -TILE_SIZE;
        break;
      case Moves.Right:
        dx = TILE_SIZE;
        break;
      case Moves.Up:
        dy = -TILE_SIZE;
        break;
      case Moves.Down:
        dy = TILE_SIZE;
        break;
      default:
        return false;
    }

    // Look ahead to check if direction is valid
    const targetTile = boardLayer.getTileAtWorldXY(
      this.x + dx + dx * 0.5, // look ahead a bit
      this.y + dy + dy * 0.5,
    );
    return this.isTileWalkable(targetTile);
  }

  /**
   * Execute a turn - change velocity to new direction
   */
  executeTurn(move) {
    const speed = this.movementSpeed;
    switch (move) {
      case Moves.Left:
        this.setVelocity(-speed, 0);
        this.lastKeyDown = Moves.Left;
        break;
      case Moves.Right:
        this.setVelocity(speed, 0);
        this.lastKeyDown = Moves.Right;
        break;
      case Moves.Up:
        this.setVelocity(0, -speed);
        this.lastKeyDown = Moves.Up;
        break;
      case Moves.Down:
        this.setVelocity(0, speed);
        this.lastKeyDown = Moves.Down;
        break;
    }
  }

  /**
   * Try to queue a turn - called when player presses a direction key
   */
  tryQueueTurn(move, boardLayer) {
    // Only queue if direction is valid
    if (this.canMoveInDirection(boardLayer, move)) {
      this.queuedMove = move;
      return true;
    }
    return false;
  }

  /**
   * Check if there's a valid intersection ahead in the current direction
   */
  getUpcomingIntersection(boardLayer) {
    const vel = this.body.velocity;
    if (vel.lengthSq() < 0.1) return null;

    // Normalize direction
    const dirX = Math.sign(vel.x);
    const dirY = Math.sign(vel.y);

    // Check tiles ahead (1 and 2 tiles ahead)
    for (let i = 1; i <= this.lookAheadTiles; i++) {
      const checkX = this.x + dirX * TILE_SIZE * i;
      const checkY = this.y + dirY * TILE_SIZE * i;
      const tile = boardLayer.getTileAtWorldXY(checkX, checkY);

      if (tile && this.isTileWalkable(tile)) {
        // Check if this tile is an intersection
        if (this.isTileIntersection(boardLayer, checkX, checkY)) {
          return { x: checkX, y: checkY, tile };
        }
      } else {
        // Hit a wall, stop looking
        break;
      }
    }
    return null;
  }

  /**
   * Check if a specific position is an intersection (3+ walkable directions)
   */
  isTileIntersection(boardLayer, x, y) {
    let walkableCount = 0;
    const directions = [
      { dx: -TILE_SIZE, dy: 0 },
      { dx: TILE_SIZE, dy: 0 },
      { dx: 0, dy: -TILE_SIZE },
      { dx: 0, dy: TILE_SIZE },
    ];

    for (const dir of directions) {
      const adjTile = boardLayer.getTileAtWorldXY(x + dir.dx, y + dir.dy);
      if (this.isTileWalkable(adjTile)) {
        walkableCount++;
      }
    }

    return walkableCount >= 3;
  }

  /**
   * Process queued turn - more lenient version
   */
  processTurnMaker(boardLayer) {
    // If we have a queued move and we're aligned for a turn, execute it
    if (this.queuedMove !== Moves.None) {
      // Check multiple conditions for executing the turn:
      // 1. We're aligned with a tile center
      // 2. OR there's an upcoming intersection and we're close to it
      const aligned = this.isAlignedForTurn(boardLayer);
      const upcoming = this.getUpcomingIntersection(boardLayer);

      // Execute if aligned OR if approaching an intersection
      if (aligned || upcoming) {
        // Verify the queued direction is still valid
        if (this.canMoveInDirection(boardLayer, this.queuedMove)) {
          this.executeTurn(this.queuedMove);
          this.queuedMove = Moves.None;
          return true;
        } else {
          // Direction no longer valid, clear queue
          this.queuedMove = Moves.None;
        }
      }
    }
    return false;
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
