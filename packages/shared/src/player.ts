export {
  Movement,
  Sprite,
  Weapon,
  Stats,
  Player,
  stats,
  calculateStat,
  move,
  size,
  regen,
  restrict,
};

import { Config, defaultConfig } from "shared/config";

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
}

interface Weapon extends Sprite {
  kind: "projectile" | "minion";
  size: number;
  damage: number;
  duration: number;
}

interface Stats {
  damage: number;
  speed: number;
  regen: number;
  size: number;
}

interface Player extends Sprite {
  role: "basic" | "tank" | "sniper" | "controller" | "blaster";
  stats: Stats;
  modifiers: Stats;
  size: number;
  maxSize: number;
  score: number;
  weapons: Weapon[];
}

const stats: Record<string, Stats> = {
  basic: {
    damage: 2,
    speed: 2,
    regen: 2,
    size: 2,
  },
  tank: {
    damage: 2,
    speed: 1,
    regen: 1.5,
    size: 2,
  },
  sniper: {
    damage: 1.5,
    speed: 2,
    regen: 0.5,
    size: 0.75,
  },
  controller: {
    damage: 1.5,
    speed: 0.75,
    regen: 1,
    size: 0.75,
  },
  blaster: {
    damage: 3,
    speed: 0.5,
    regen: 0.5,
    size: 1,
  },
};

function calculateStat(value: number): number {
  return 1 + value * (1 / 9);
}

function move(player: Player, config: Config = defaultConfig): void {
  // calculate modifier for defaults based on stats and role
  const modifier = calculateStat(player.stats.speed) * player.modifiers.speed;

  // change x coordinate by current x velocity
  player.x += player.velocityX;
  // change y coordinate by current y velocity
  player.y += player.velocityY;

  // calculate new constants with modifier
  const maxVelocity = config.velocity.max * modifier;
  const velocityIncrease = config.velocity.increase * modifier;
  const velocityDecrease = config.velocity.decrease * modifier;

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

  // limit x velocity to max velocity
  if (player.velocityX > maxVelocity) {
    player.velocityX = maxVelocity;
  } else if (player.velocityX < -maxVelocity) {
    player.velocityX = -maxVelocity;
  }

  // limit y velocity to max velocity
  if (player.velocityY > maxVelocity) {
    player.velocityY = maxVelocity;
  } else if (player.velocityY < -maxVelocity) {
    player.velocityY = -maxVelocity;
  }

  // make x velocity 0 when it is near 0
  if (
    player.velocityX > -velocityDecrease &&
    player.velocityX < velocityDecrease
  ) {
    player.velocityX = 0;
  }

  // make y velocity 0 when it is near 0
  if (
    player.velocityY > -velocityDecrease &&
    player.velocityY < velocityDecrease
  ) {
    player.velocityY = 0;
  }
}

function size(
  player: Player,
  change: number,
  config: Config = defaultConfig
): void {
  // calculate maximum size based on stats, change, and base size
  const maxSize =
    calculateStat(player.stats.size) * config.sizeChange + config.baseSize;

  // change size by amount of change
  player.size += change;
  // update player maximum size if needed
  player.maxSize = Math.max(player.size, player.maxSize);

  // make sure player is not larger than maximum size
  if (player.size > maxSize) {
    player.size = maxSize;
  }
}

function regen(player: Player, config: Config = defaultConfig): void {
  if (player.size < player.maxSize) {
    player.size += player.stats.regen;
  } else {
    player.size = player.maxSize;
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
