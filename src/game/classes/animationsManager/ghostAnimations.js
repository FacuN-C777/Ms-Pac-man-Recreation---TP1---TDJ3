export class GhostAnimations {
  static playDirection(ghost, direction) {
    const animKey = this.getAnimationKey(ghost.ghostName, direction);
    if (animKey) {
      ghost.play(animKey, true);
    }
  }

  static playFrightened(ghost) {
    ghost.play("ghostFrightened", true);
  }

  static playEaten(ghost, direction) {
    const animKey = this.getEatenAnimationKey(direction);
    if (animKey) {
      ghost.play(animKey, true);
    }
  }

  static getAnimationKey(ghostName, direction) {
    const animations = {
      blinky: {
        right: "blinkyRight",
        left: "blinkyLeft",
        up: "blinkyUp",
        down: "blinkyDown",
      },
      pinky: {
        right: "pinkyRight",
        left: "pinkyLeft",
        up: "pinkyUp",
        down: "pinkyDown",
      },
      inky: {
        right: "inkyRight",
        left: "inkyLeft",
        up: "inkyUp",
        down: "inkyDown",
      },
      sue: {
        right: "sueRight",
        left: "sueLeft",
        up: "sueUp",
        down: "sueDown",
      },
    };

    const ghostAnimations = animations[ghostName];
    if (!ghostAnimations) {
      return null;
    }

    return ghostAnimations[direction] || null;
  }

  static getEatenAnimationKey(direction) {
    const eatenAnimations = {
      right: "ghostEatenRight",
      left: "ghostEatenLeft",
      up: "ghostEatenUp",
      down: "ghostEatenDown",
    };

    return eatenAnimations[direction] || "ghostEatenRight";
  }

  static getDirectionFromAngle(angle) {
    if (angle === 0 || angle === 360) {
      return "right";
    }
    if (angle === 180 || angle === -180) {
      return "left";
    }
    if (angle === -90) {
      return "up";
    }
    if (angle === 90) {
      return "down";
    }
    return "right";
  }
}
