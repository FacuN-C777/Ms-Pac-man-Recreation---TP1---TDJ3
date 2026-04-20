import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    this.add
      .text(112, 60, "Ms. Pac-man", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "16px",
        color: "#e78709",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(112, 160, "Press enter/click to start", {
        fontFamily: '"Press Start 2P"',
        fontSize: "8px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("Game");
    });
  }
}
