export const Direction = {
  Left: 0,
  Right: 1,
  Up: 2,
  Down: 3,
  None: 4,
};

export function getOrderedDirections() {
  return [Direction.Left, Direction.Right, Direction.Up, Direction.Down];
}

export function getOppositeDirection(direction) {
  switch (direction) {
    case Direction.Left:
      return Direction.Right;
    case Direction.Right:
      return Direction.Left;
    case Direction.Up:
      return Direction.Down;
    case Direction.Down:
      return Direction.Up;
    default:
      return Direction.None;
  }
}

export const TileSize = 16;

export function positionInDirection(x, y, direction) {
  switch (direction) {
    case Direction.Up:
      return { x, y: y - TileSize };
    case Direction.Left:
      return { x: x - TileSize, y };
    case Direction.Down:
      return { x, y: y + TileSize };
    case Direction.Right:
      return { x: x + TileSize, y };
    default:
      return { x, y };
  }
}
