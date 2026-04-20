export class PlayerAnimations {
  static playDirection(player, direction) {
    switch (direction) {
      case "left":
        player.play("playerLeft", true);
        break;
      case "right":
        player.play("playerRight", true);
        break;
      case "up":
        player.play("playerUp", true);
        break;
      case "down":
        player.play("playerDown", true);
        break;
      default:
        player.play("playerStill", true);
        break;
    }
  }

  static playStill(player) {
    player.play("playerStill", true);
  }
}
