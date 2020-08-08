export { Movement, Player, move, restrict };

import { Config, defaultConfig } from "./config.js";

interface Movement {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface Player {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  movement: Movement;
}

function move(player: Player, config: Config = defaultConfig): void {
  // change x coordinate by current x velocity
  player.x += player.velocityX;
  // change y coordinate by current y velocity
  player.y += player.velocityY;

  const maxVelocity = config.maxVelocity;
  const velocityIncrease = config.velocityIncrease;
  const velocityDecrease = config.velocityDecrease;

  if (player.movement.down && player.velocityY < maxVelocity) {
    // increase y velocity when possible while moving down
    player.velocityY += velocityIncrease;
  } else if (player.movement.up && player.velocityY > -maxVelocity) {
    // increase y velocity when possible while moving up
    player.velocityY -= velocityIncrease;
  } else if (player.velocityY < 0) {
    // decrease y velocity when not moving up
    player.velocityY += velocityDecrease;
  } else if (player.velocityY > 0) {
    // decrease y velocity when not moving down
    player.velocityY -= velocityDecrease;
  }

  if (player.movement.right && player.velocityX < maxVelocity) {
    // increase x velocity when possible while moving right
    player.velocityX += velocityIncrease;
  } else if (player.movement.left && player.velocityX > -maxVelocity) {
    // increase x velocity when possible while moving left
    player.velocityX -= velocityIncrease;
  } else if (player.velocityX < 0) {
    // decrease x velocity when not moving left
    player.velocityX += velocityDecrease;
  } else if (player.velocityX > 0) {
    // decrease y velocity when not moving right
    player.velocityX -= velocityDecrease;
  }
}

function restrict(player: Player, config: Config = defaultConfig): void {
  // make sure y is within boundaries
  if (player.y < 0) {
    player.y = 0;
  } else if (player.y > config.height) {
    player.y = config.height;
  }

  // make sure x is within boundaries
  if (player.x < 0) {
    player.x = 0;
  } else if (player.x > config.width) {
    player.x = config.width;
  }
}
