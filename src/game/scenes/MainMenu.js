import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    // Play menu sound (non-looping)
    const menuSound = this.sound.add("menuSound", { loop: false });
    menuSound.play();

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

    this.level1Button = this.add
      .text(112, 160, "Level 1 - Easy", {
        fontFamily: '"Press Start 2P"',
        fontSize: "8px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.level2Button = this.add
      .text(112, 200, "Level 2 - Hard", {
        fontFamily: '"Press Start 2P"',
        fontSize: "8px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Track selected button (0 = Level 1, 1 = Level 2)
    this.selectedLevel = 0;

    // Set initial selection (Level 1)
    this.updateSelection();

    // Mouse click handlers
    this.level1Button.on("pointerdown", () => {
      this.startGame("Game");
    });

    this.level2Button.on("pointerdown", () => {
      this.startGame("GameHard");
    });

    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-ENTER", () => {
      this.selectCurrentLevel();
    });

    // Also stop menu sound on scene shutdown
    this.events.once("shutdown", () => {
      if (menuSound.isPlaying) {
        menuSound.stop();
      }
    });
  }

  update() {
    // Up arrow - select Level 1
    if (this.cursors.up.isDown && this.selectedLevel !== 0) {
      this.selectedLevel = 0;
      this.updateSelection();
      this.cursors.up.isDown = false; // Prevent rapid toggling
    }

    // Down arrow - select Level 2
    if (this.cursors.down.isDown && this.selectedLevel !== 1) {
      this.selectedLevel = 1;
      this.updateSelection();
      this.cursors.down.isDown = false; // Prevent rapid toggling
    }
  }

  updateSelection() {
    // Reset both buttons to white
    this.level1Button.setColor("#ffffff");
    this.level2Button.setColor("#ffffff");

    // Stop any existing tweens
    this.tweens.killTweensOf(this.level1Button);
    this.tweens.killTweensOf(this.level2Button);

    // Highlight selected button in yellow and add blinking tween
    if (this.selectedLevel === 0) {
      this.level1Button.setColor("#ffff00");
      this.tweens.add({
        targets: this.level1Button,
        alpha: { from: 1, to: 0.5 },
        duration: 500,
        repeat: -1,
        yoyo: true,
      });
    } else {
      this.level2Button.setColor("#ffff00");
      this.tweens.add({
        targets: this.level2Button,
        alpha: { from: 1, to: 0.5 },
        duration: 500,
        repeat: -1,
        yoyo: true,
      });
    }
  }

  selectCurrentLevel() {
    if (this.selectedLevel === 0) {
      this.startGame("Game");
    } else {
      this.startGame("GameHard");
    }
  }

  startGame(sceneKey) {
    // Stop menu sound if still playing
    this.sound.stopAll();
    this.scene.start(sceneKey);
  }
}
