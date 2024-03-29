export {
  Food,
  Movement,
  Player,
  Sprite,
  Weapon,
  massToSize,
  move,
  restrict,
  sizeToMass,
};

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
  mass: number;
  movement: Movement;
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
  name: string;
  score: number;
  weapons: Weapon[];
}

function massToSize(mass: number): number {
  // calculate size by using the mass with a modifier
  return Math.sqrt((mass * config.sizeModifier) / Math.PI) + config.sizeBase;
}

function sizeToMass(size: number): number {
  // calculate mass by using the size and reverting with the modifier
  return ((size - config.sizeBase) ** 2 * Math.PI) / config.sizeModifier;
}

function move(sprite: Sprite): void {
  sprite.x += sprite.velocityX;
  sprite.y += sprite.velocityY;

  const modifier = 1 - 0.005 * (Math.min(sprite.mass, 100) / 100);

  const maxVelocity = config.velocityMax * modifier;
  const velocityIncrease = config.velocityIncrease * modifier;
  const velocityDecrease = config.velocityDecrease * modifier;

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
