export { Movement, Sprite, Food, Weapon, Player, move, restrict };

import { defaultConfig as config } from "shared/config";

interface Movement {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface Sprite {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  movement: Movement;
  mass: number;
}

interface Food extends Sprite {
  role: "dot";
}

interface Weapon extends Sprite {
  role: "absorber";
  duration: number;
}

interface Player extends Sprite {
  role: "basic";
  score: number;
  weapons: Weapon[];
}

function move(sprite: Sprite): void {
  sprite.x += sprite.velocityX;
  sprite.y += sprite.velocityY;

  const maxVelocity = config.velocityMax;
  const velocityIncrease = config.velocityIncrease;
  const velocityDecrease = config.velocityDecrease;

  if (sprite.movement.down && sprite.velocityY < maxVelocity) {
    // increase y velocity when possible while moving down
    sprite.velocityY += velocityIncrease;
  } else if (sprite.movement.up && sprite.velocityY > -maxVelocity) {
    // increase y velocity when possible while moving up
    sprite.velocityY -= velocityIncrease;
  } else if (sprite.velocityY < 0) {
    // decrease y velocity when not moving up
    sprite.velocityY += velocityDecrease;
  } else if (sprite.velocityY > 0) {
    // decrease y velocity when not moving down
    sprite.velocityY -= velocityDecrease;
  }

  if (sprite.movement.right && sprite.velocityX < maxVelocity) {
    // increase x velocity when possible while moving right
    sprite.velocityX += velocityIncrease;
  } else if (sprite.movement.left && sprite.velocityX > -maxVelocity) {
    // increase x velocity when possible while moving left
    sprite.velocityX -= velocityIncrease;
  } else if (sprite.velocityX < 0) {
    // decrease x velocity when not moving left
    sprite.velocityX += velocityDecrease;
  } else if (sprite.velocityX > 0) {
    // decrease y velocity when not moving right
    sprite.velocityX -= velocityDecrease;
  }

  // limit x velocity to max velocity
  if (sprite.velocityX > maxVelocity) {
    sprite.velocityX = maxVelocity;
  } else if (sprite.velocityX < -maxVelocity) {
    sprite.velocityX = -maxVelocity;
  }

  // limit y velocity to max velocity
  if (sprite.velocityY > maxVelocity) {
    sprite.velocityY = maxVelocity;
  } else if (sprite.velocityY < -maxVelocity) {
    sprite.velocityY = -maxVelocity;
  }

  // make x velocity 0 when it is near 0
  if (
    sprite.velocityX > -velocityDecrease &&
    sprite.velocityX < velocityDecrease
  ) {
    sprite.velocityX = 0;
  }

  // make y velocity 0 when it is near 0
  if (
    sprite.velocityY > -velocityDecrease &&
    sprite.velocityY < velocityDecrease
  ) {
    sprite.velocityY = 0;
  }
}

function restrict(sprite: Sprite): void {
  // make sure y is within boundaries
  if (sprite.y < 0) {
    sprite.y = 0;
  } else if (sprite.y > config.height) {
    sprite.y = config.height;
  }

  // make sure x is within boundaries
  if (sprite.x < 0) {
    sprite.x = 0;
  } else if (sprite.x > config.width) {
    sprite.x = config.width;
  }
}
