class GameManager {
  static instance;

  constructor() {
    if (GameManager.instance) {
      return GameManager.instance;
    }
    this.playerLives = 3;
    this.score = 0;
    this.difficulty = 1;
    GameManager.instance = this;
  }

  static getInstance() {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  addLives(amount) {
    this.playerLives += amount;
    this.score += amount;
  }

  loseLives() {
    this.playerLives -= 1;
  }

  getLives() {
    return this.playerLives;
  }

  resetLives() {
    this.playerLives = 3;
  }

  addScore(amount) {
    this.score += amount;
  }

  getScore() {
    return this.score;
  }

  resetScore() {
    this.score = 0;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  getDifficulty() {
    return this.difficulty;
  }
}

export default GameManager;
