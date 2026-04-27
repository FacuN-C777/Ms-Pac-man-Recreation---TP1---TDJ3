class GameManager {
  static instance;

  constructor() {
    if (GameManager.instance) {
      return GameManager.instance;
    }
    this.playerLives = 3;
    this.score = 0;
    this.difficulty = 1; // 1 = Easy, 2 = Hard
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
    // 1 = Easy (30s scatter, ghosts frighten)
    // 2 = Hard (5s scatter, ghosts don't frighten)
    this.difficulty = difficulty;
  }

  getDifficulty() {
    return this.difficulty;
  }

  isEasy() {
    return this.difficulty === 1;
  }

  isHard() {
    return this.difficulty === 2;
  }
}

export default GameManager;
