import { Scene } from "phaser";
import * as Phaser from "phaser";
import Player from "../classes/Player";
import { Ghost } from "../classes/Ghosts";
import { DotManager } from "../classes/utilities/DotManager";

export class Game extends Phaser.Scene {
  constructor() {
    super("Game");
    this.player = null;
    this.cursors = null;
    this.wallLayer = null;
  }

  create() {
    // Enable physics debug visualization
    this.physics.world.createDebugGraphic();
    this.physics.world.drawDebug = true;

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

    //Now the texts, lives & such (UI)

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
    this.pinky.init(this.player, wallLayer, 0, 0);
    this.inky.init(this.player, wallLayer, 224, 248);
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
  }
}
