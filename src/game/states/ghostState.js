export class GhostState {
  constructor(ghost, board) {
    this.ghost = ghost;
    this.board = board;
  }

  get speed() {
    return 100;
  }

  get targetPosition() {
    return { x: this.ghost.x, y: this.ghost.y };
  }

  pickDirection() {
    throw new Error("pickDirection must be implemented by subclass");
  }

  enter() {}

  exit() {}
}
