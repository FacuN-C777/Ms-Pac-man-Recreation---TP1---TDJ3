import { Scene } from "phaser";
import * as Phaser from "phaser";
import Player from "../classes/Player";

export class Game extends Phaser.Scene {
  constructor() {
    super("Game");
    this.player = null;
    this.cursors = null;
    this.wallLayer = null;
  }

  create() {
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

    //Now the texts, lives & such (UI)

    //Now character & enemies instances
    const playerSpawn = map.findObject(
      "Spawns",
      (obj) => obj.name === "MsPacMan",
    );
    this.player = new Player(this, playerSpawn.x, playerSpawn.y, "player");
    this.add.existing(this.player);

    // Setup cursors for input
    this.cursors = this.input.keyboard.createCursorKeys();

    //Now collisions & such
    this.physics.add.collider(this.player, wallLayer);

    //Miscallenous and other thing down here
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
