import { GhostState } from "./ghostState.js";
import {
  Direction,
  getOrderedDirections,
  getOppositeDirection,
  positionInDirection,
} from "./ghostDirection.js";

export class FrightenedState extends GhostState {
  constructor(ghost, board) {
    super(ghost, board);
    this.hero = null;
  }

  setHero(hero) {
    this.hero = hero;
  }

  get speed() {
    return 50;
  }

  get targetPosition() {
    if (!this.hero) {
      return { x: this.ghost.x, y: this.ghost.y };
    }
    return {
      x: this.ghost.x * 2 - this.hero.x,
      y: this.ghost.y * 2 - this.hero.y,
    };
  }

  pickDirection() {
    const backwardsDirection = getOppositeDirection(
      this.ghost.currentDirection,
    );
    const validDirections = getOrderedDirections().filter(
      (dir) => dir !== backwardsDirection,
    );

    // Filter out directions that lead to walls
    const availableDirections = [];
    for (const dir of validDirections) {
      const position = positionInDirection(this.ghost.x, this.ghost.y, dir);
      if (!this.board.getTileAtWorldXY(position.x, position.y)) {
        availableDirections.push(dir);
      }
    }

    // If no available directions, try backwards (better than stopping)
    if (availableDirections.length === 0) {
      const backPos = positionInDirection(
        this.ghost.x,
        this.ghost.y,
        backwardsDirection,
      );
      if (!this.board.getTileAtWorldXY(backPos.x, backPos.y)) {
        return backwardsDirection;
      }
      return Direction.None;
    }

    // Pick random available direction
    const randomIndex = Math.floor(Math.random() * availableDirections.length);
    return availableDirections[randomIndex];
  }
}
