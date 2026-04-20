const { Direction } = require("./Direction");
const { positionInDirection } = require("./positionInDirection");

/**
 * Determines the best direction to move toward a target position
 * @param {number} x - Current x position
 * @param {number} y - Current y position
 * @param {number} targetX - Target x position
 * @param {number} targetY - Target y position
 * @param {Direction[]} directions - Allowed directions to consider
 * @param {Phaser.Tilemaps.DynamicTilemapLayer} board - Tilemap layer for collision
 * @returns {Direction} Best direction to move
 */
function determineDirectionFromTarget(
  x,
  y,
  targetX,
  targetY,
  directions,
  board,
) {
  let closestDirection = Direction.None;
  let closestDistance = -1;

  for (const dir of directions) {
    const position = positionInDirection(x, y, dir);

    // Check for wall collision
    if (board.getTileAtWorldXY(position.x, position.y)) {
      continue;
    }

    const distance = Phaser.Math.Distance.Between(
      position.x,
      position.y,
      targetX,
      targetY,
    );

    if (closestDirection === Direction.None) {
      // First valid direction found
      closestDirection = dir;
      closestDistance = distance;
      continue;
    }

    if (distance < closestDistance) {
      closestDirection = dir;
      closestDistance = distance;
    }
  }

  return closestDirection;
}

module.exports = { determineDirectionFromTarget };
