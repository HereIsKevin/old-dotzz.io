export { Arena, ArenaConfig, Movement, Player };

import { v4 as uuidv4 } from "uuid";

interface Player {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  movement: Movement;
}

interface Movement {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface ArenaConfig {
  width: number;
  height: number;
  velocityIncrease: number;
  velocityDecrease: number;
  maxVelocity: number;
  moveInterval: number;
}

const arenaConfig = {
  width: 1000,
  height: 1000,
  velocityIncrease: 0.4,
  velocityDecrease: 0.1,
  maxVelocity: 4,
  moveInterval: 1000 / 60,
};

class Arena {
  public players: Record<string, Player>;
  public config: ArenaConfig;

  public constructor(config: ArenaConfig = arenaConfig) {
    this.players = {};
    this.config = { ...arenaConfig, ...config };

    global.setInterval(() => {
      for (const player of Object.values(this.players)) {
        // change x coordinate by current x velocity
        player.x += player.velocityX;
        // change y coordinate by current y velocity
        player.y += player.velocityY;

        const maxVelocity = this.config.maxVelocity;
        const velocityIncrease = this.config.velocityIncrease;
        const velocityDecrease = this.config.velocityDecrease;

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

        // make sure y is within boundaries
        if (player.y < 0) {
          player.y = 0;
        } else if (player.y > this.config.height) {
          player.y = this.config.height;
        }

        // make sure x is within boundaries
        if (player.x < 0) {
          player.x = 0;
        } else if (player.x > this.config.width) {
          player.x = this.config.width;
        }
      }
    }, this.config.moveInterval);
  }

  public addPlayer(x: number, y: number): string {
    const id = uuidv4();

    this.players[id] = {
      x,
      y,
      velocityX: 0,
      velocityY: 0,
      movement: { down: false, up: false, right: false, left: false },
    };

    return id;
  }

  public removePlayer(id: string): void {
    delete this.players[id];
  }

  public movePlayer(id: string, movement: Movement): Player {
    const player = this.players[id];
    player.movement = movement;

    return player;
  }
}
