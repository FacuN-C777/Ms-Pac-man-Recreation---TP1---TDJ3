import { Scene } from "phaser";
import * as Phaser from "phaser";
import Player from "../classes/Player";
import { Ghost } from "../classes/Ghosts";
import { DotManager } from "../classes/utilities/DotManager";
import GameManager from "../gameManager";
import { Direction } from "../states/ghostDirection.js";

export class Game extends Phaser.Scene {
  constructor() {
    super("Game");
    this.player = null;
    this.cursors = null;
    this.wallLayer = null;
  }

  create() {
    // Enable physics debug visualization
    /*this.physics.world.createDebugGraphic();
    this.physics.world.drawDebug = true;*/

    //start with maze creation (walls & teleports)
    const map = this.make.tilemap({ key: "mapMaze1" });
    const paredes = map.addTilesetImage("Mazmora 1 - Limpia", "wallTiles");
    const puntos = map.addTilesetImage("Puntos", "dotTiles");
    const wallLayer = map.createLayer("Paredes", paredes, 0, 0);
    const dotsLayer = map.createLayer("Puntos", puntos, 0, 0);
    const spawnsLayer = map.getObjectLayer("Spawns");

    wallLayer.setCollisionByProperty({ Colision: true });
    this.wallLayer = wallLayer;

    //Now come the points for collection, score & power-ups
    this.dotManager = new DotManager(this);
    this.dotManager.createFromTilemap(dotsLayer, puntos);

    //Now the texts, lives & such (UI)
    this.scoreText = this.add.text(2, 2, "Score: 0", {
      fontFamily: '"Press Start 2P"',
      fontSize: "8px",
      color: "#ffffff",
      align: "left",
    });
    this.LivesText = this.add.text(90, 2, "Lives: 3", {
      fontFamily: '"Press Start 2P"',
      fontSize: "8px",
      color: "#ffffff",
      align: "center",
    });

    // Initialize GameManager and reset score for new game
    this.gameManager = GameManager.getInstance();
    this.gameManager.resetScore();
    this.gameManager.resetLives();

    //Now character & enemies instances
    const playerSpawn = map.findObject(
      "Spawns",
      (obj) => obj.name === "MsPacMan",
    );
    this.player = new Player(this, playerSpawn.x, playerSpawn.y, "player");
    this.add.existing(this.player);

    const blinkySpawn = map.findObject(
      "Spawns",
      (obj) => obj.name === "Blinky",
    );
    const pinkySpawn = map.findObject("Spawns", (obj) => obj.name === "Pinky");
    const inkySpawn = map.findObject("Spawns", (obj) => obj.name === "Inky");
    const sueSpawn = map.findObject("Spawns", (obj) => obj.name === "Sue");

    this.blinky = new Ghost(
      this,
      blinkySpawn.x,
      blinkySpawn.y,
      "ghosts",
      "blinky",
    );
    this.pinky = new Ghost(this, pinkySpawn.x, pinkySpawn.y, "ghosts", "pinky");
    this.inky = new Ghost(this, inkySpawn.x, inkySpawn.y, "ghosts", "inky");
    this.sue = new Ghost(this, sueSpawn.x, sueSpawn.y, "ghosts", "sue");

    this.blinky.init(this.player, wallLayer, 224, 0);
    this.pinky.init(this.player, wallLayer, 224, 248);
    this.inky.init(this.player, wallLayer, 0, 0, this.blinky);
    this.sue.init(this.player, wallLayer, 0, 248);
    this.add.existing(this.blinky);
    this.add.existing(this.pinky);
    this.add.existing(this.inky);
    this.add.existing(this.sue);

    //Now collisions & such
    this.physics.add.collider(this.player, wallLayer);
    this.physics.add.collider(this.blinky, wallLayer);
    this.physics.add.collider(this.pinky, wallLayer);
    this.physics.add.collider(this.inky, wallLayer);
    this.physics.add.collider(this.sue, wallLayer);

    // Ghost vs Player collision (for eating ghosts when powered)
    this.physics.add.overlap(
      this.player,
      this.blinky,
      this.handleGhostCollision,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.pinky,
      this.handleGhostCollision,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.inky,
      this.handleGhostCollision,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.sue,
      this.handleGhostCollision,
      null,
      this,
    );

    // Setup dot collection
    this.dotManager.setupCollision(
      this.player,
      (player, dot) => {
        this.dotManager.removeDot(dot);
        this.gameManager.addScore(10);
        this.scoreText.setText("Score: " + this.gameManager.getScore());
        this.checkWinCondition();
      },
      (player, dot) => {
        this.dotManager.removeDot(dot);
        this.gameManager.addScore(50);
        this.scoreText.setText("Score: " + this.gameManager.getScore());
        this.blinky.frighten();
        this.pinky.frighten();
        this.inky.frighten();
        this.sue.frighten();
        this.checkWinCondition();
      },
      DotManager.canEatDot,
    );

    //Miscallenous and other thing down here
    // Setup cursors for input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.once("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }

  update(time, delta) {
    if (this.player) {
      this.player.handleMovement(delta, this.cursors, this.wallLayer);
    }

    // Check if any eaten ghosts have reached their spawn point
    this.checkGhostsSpawnReturn();
  }

  /**
   * Handle collision between player and ghost
   */
  handleGhostCollision(player, ghost) {
    // If ghost is frightened, eat it (add 200 points, send to spawn)
    if (ghost.isFrightened()) {
      ghost.eat();
      return;
    }

    // If ghost is already eaten, ignore (it's returning to spawn)
    if (ghost.isEaten()) {
      return;
    }

    // Ghost is in chase or scatter state - player gets caught
    this.handlePlayerCaught();
  }

  /**
   * Handle player being caught by a ghost
   */
  handlePlayerCaught() {
    // Decrease lives
    this.gameManager.loseLives();
    this.LivesText.setText("Lives: " + this.gameManager.getLives());

    // Check if game over
    if (this.gameManager.playerLives <= 0) {
      this.scene.start("MainMenu");
      return;
    }

    // Reset positions
    this.resetPositions();
  }

  /**
   * Reset player and ghosts to their spawn positions
   */
  resetPositions() {
    // Get spawn positions from tilemap
    const map = this.make.tilemap({ key: "mapMaze1" });
    const spawnsLayer = map.getObjectLayer("Spawns");

    const playerSpawn = map.findObject(
      "Spawns",
      (obj) => obj.name === "MsPacMan",
    );
    const blinkySpawn = map.findObject(
      "Spawns",
      (obj) => obj.name === "Blinky",
    );
    const pinkySpawn = map.findObject("Spawns", (obj) => obj.name === "Pinky");
    const inkySpawn = map.findObject("Spawns", (obj) => obj.name === "Inky");
    const sueSpawn = map.findObject("Spawns", (obj) => obj.name === "Sue");

    // Reset player position and direction
    this.player.setPosition(playerSpawn.x, playerSpawn.y);
    this.player.body.setVelocity(0, 0);
    this.player.lastKeyDown = 0; // Reset to no direction
    this.player.queuedMove = 0;

    // Reset each ghost to their spawn
    this.blinky.setPosition(blinkySpawn.x, blinkySpawn.y);
    this.blinky.currentDirection = Direction.Right;
    this.blinky.lastValidDirection = Direction.Right;
    this.blinky.hasAppliedInitialDirection = false;
    this.blinky.stateMachine.setState("scatter");
    this.blinky.stateMachine.hasTransitionedToChase = false;
    this.blinky.stateMachine.scatterTimer = 0;

    this.pinky.setPosition(pinkySpawn.x, pinkySpawn.y);
    this.pinky.currentDirection = Direction.Right;
    this.pinky.lastValidDirection = Direction.Right;
    this.pinky.hasAppliedInitialDirection = false;
    this.pinky.stateMachine.setState("scatter");
    this.pinky.stateMachine.hasTransitionedToChase = false;
    this.pinky.stateMachine.scatterTimer = 0;

    this.inky.setPosition(inkySpawn.x, inkySpawn.y);
    this.inky.currentDirection = Direction.Right;
    this.inky.lastValidDirection = Direction.Right;
    this.inky.hasAppliedInitialDirection = false;
    this.inky.stateMachine.setState("scatter");
    this.inky.stateMachine.hasTransitionedToChase = false;
    this.inky.stateMachine.scatterTimer = 0;

    this.sue.setPosition(sueSpawn.x, sueSpawn.y);
    this.sue.currentDirection = Direction.Right;
    this.sue.lastValidDirection = Direction.Right;
    this.sue.hasAppliedInitialDirection = false;
    this.sue.stateMachine.setState("scatter");
    this.sue.stateMachine.hasTransitionedToChase = false;
    this.sue.stateMachine.scatterTimer = 0;
  }

  /**
   * Check if any eaten ghosts have reached their spawn point
   */
  checkGhostsSpawnReturn() {
    const ghosts = [this.blinky, this.pinky, this.inky, this.sue];
    for (const ghost of ghosts) {
      if (ghost.isEaten() && ghost.hasReachedSpawn()) {
        ghost.returnToPreviousState();
      }
    }
  }

  checkWinCondition() {
    if (this.dotManager.isComplete()) {
      this.scene.start("MainMenu");
    }
  }

  counstScore() {}
}
