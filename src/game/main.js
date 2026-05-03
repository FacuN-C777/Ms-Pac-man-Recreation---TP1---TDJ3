import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { GameHard } from "./scenes/GameHard";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import * as Phaser from "phaser";
import { AUTO, Game } from "phaser";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
  type: Phaser.AUTO,
  width: 224,
  height: 256,
  parent: "game-container",
  backgroundColor: "#000000",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [Boot, Preloader, MainMenu, MainGame, GameHard],
};

const StartGame = (parent) => {
  return new Game({ ...config, parent });
};

export default StartGame;
