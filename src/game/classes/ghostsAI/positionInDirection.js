const { Direction } = require("./Direction");
const { TileSize } = require("./TileConfig");

/**
 * Calculates the position resulting from moving in a given direction
 * @param {number} x - Current x position
 * @param {number} y - Current y position
 * @param {Direction} direction - Direction to move
 * @returns {{x: number, y: number}} New position
 */
function positionInDirection(x, y, direction) {
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

module.exports = { positionInDirection };
