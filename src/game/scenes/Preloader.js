import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, "background");
    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);
    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");
    this.load.image("logo", "logo.png");
    this.load.image("dot", "Punto.png");
    this.load.image("powerDot", "Ajo_Power-Up.png");
    this.load.image("holyWater", "Agua_Colectable.png");
    this.load.image("crucifix", "Crucifico_Colecionable.png");
    this.load.image("stake", "Estaca_Colectable.png");

    this.load.font(
      "Press Start 2P",
      "/fonts/PressStart2P-Regular.ttf",
      "truetype",
    );

    this.load.spritesheet("player", "Player-Spritesheet.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet("ghosts", "Bats-SpriteSheet.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.tilemapTiledJSON("mapMaze1", "tilemaps/Mapa Mazmora 1.json");
    this.load.image("wallTiles", "Mazmora 1 - Limpia.png");
    this.load.image("dotTiles", "Mazmora 1.png");
    this.load.tilemapTiledJSON("mapMaze2", "tilemaps/Mapa Mazmorra 2.json");
    this.load.image("wallTiles2", "Mazmora 2 - Limpia.png");
    this.load.image("dotTiles2", "Mazmora 2.png");

    this.load.audio("eatCollectable", "sounds/eatFruit.wav");
    this.load.audio("enemyEaten", "sounds/enemyEaten.wav");
    this.load.audio("enemyFrightened", "sounds/enemyFright.wav");
    this.load.audio("menuSound", "sounds/menuStart.wav");
    this.load.audio("playerDeath", "sounds/playerDeath.wav");
    this.load.audio("playerEatEnemy", "sounds/playerEatEnemy.wav");
    this.load.audio("playerEatPower", "sounds/PlayerEatPower.wav");
    this.load.audio("playerWalk", "sounds/playerWalk.wav");
    this.load.audio("startGame", "sounds/startGame.wav");
  }

  create() {
    //First the player animations
    this.anims.create({
      key: "playerStill",
      frames: [{ key: "player", frame: 7 }],
    });
    this.anims.create({
      key: "playerRight",
      frames: [
        { key: "player", frame: 6 },
        { key: "player", frame: 7 },
        { key: "player", frame: 8 },
        { key: "player", frame: 7 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "playerLeft",
      frames: [
        { key: "player", frame: 9 },
        { key: "player", frame: 10 },
        { key: "player", frame: 11 },
        { key: "player", frame: 10 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "playerDown",
      frames: [
        { key: "player", frame: 0 },
        { key: "player", frame: 1 },
        { key: "player", frame: 2 },
        { key: "player", frame: 1 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "playerUp",
      frames: [
        { key: "player", frame: 3 },
        { key: "player", frame: 4 },
        { key: "player", frame: 5 },
        { key: "player", frame: 4 },
      ],
      frameRate: 8,
      repeat: -1,
    });

    //Now the enemies' animations
    //First when scared(Player powered-up)
    this.anims.create({
      key: "ghostFrightened",
      frames: [
        { key: "ghosts", frame: 32 },
        { key: "ghosts", frame: 33 },
        { key: "ghosts", frame: 34 },
        { key: "ghosts", frame: 35 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    //Then when they´re eaten
    this.anims.create({
      key: "ghostEatenLeft",
      frames: [{ key: "ghosts", frame: 38 }],
    });
    this.anims.create({
      key: "ghostEatenRight",
      frames: [{ key: "ghosts", frame: 39 }],
    });
    this.anims.create({
      key: "ghostEatenDown",
      frames: [{ key: "ghosts", frame: 36 }],
    });
    this.anims.create({
      key: "ghostEatenUp",
      frames: [{ key: "ghosts", frame: 37 }],
    });
    //Now Blinky´s animation's
    this.anims.create({
      key: "blinkyRight",
      frames: [
        { key: "ghosts", frame: 4 },
        { key: "ghosts", frame: 5 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "blinkyLeft",
      frames: [
        { key: "ghosts", frame: 6 },
        { key: "ghosts", frame: 7 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "blinkyDown",
      frames: [
        { key: "ghosts", frame: 0 },
        { key: "ghosts", frame: 1 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "blinkyUp",
      frames: [
        { key: "ghosts", frame: 2 },
        { key: "ghosts", frame: 3 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    //Now goes Pinky
    this.anims.create({
      key: "pinkyRight",
      frames: [
        { key: "ghosts", frame: 12 },
        { key: "ghosts", frame: 13 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "pinkyLeft",
      frames: [
        { key: "ghosts", frame: 14 },
        { key: "ghosts", frame: 15 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "pinkyDown",
      frames: [
        { key: "ghosts", frame: 8 },
        { key: "ghosts", frame: 9 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "pinkyUp",
      frames: [
        { key: "ghosts", frame: 10 },
        { key: "ghosts", frame: 11 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    //Then Inky
    this.anims.create({
      key: "inkyRight",
      frames: [
        { key: "ghosts", frame: 20 },
        { key: "ghosts", frame: 21 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "inkyLeft",
      frames: [
        { key: "ghosts", frame: 22 },
        { key: "ghosts", frame: 23 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "inkyDown",
      frames: [
        { key: "ghosts", frame: 16 },
        { key: "ghosts", frame: 17 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "inkyUp",
      frames: [
        { key: "ghosts", frame: 18 },
        { key: "ghosts", frame: 19 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    //Lastly... Sue... What a name
    this.anims.create({
      key: "sueRight",
      frames: [
        { key: "ghosts", frame: 28 },
        { key: "ghosts", frame: 29 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "sueLeft",
      frames: [
        { key: "ghosts", frame: 30 },
        { key: "ghosts", frame: 31 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "sueDown",
      frames: [
        { key: "ghosts", frame: 24 },
        { key: "ghosts", frame: 25 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "sueUp",
      frames: [
        { key: "ghosts", frame: 26 },
        { key: "ghosts", frame: 27 },
      ],
      frameRate: 8,
      repeat: -1,
    });

    this.scene.start("MainMenu");
  }
}
