export { Arena };

import { v4 as uuidv4 } from "uuid";

type Direction = "left" | "right" | "up" | "down";

interface Player {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

interface ArenaConfig {
  width: number;
  height: number;
  velocityIncrease: number;
  velocityDecrease: number;
  maxVelocity: number;
}

const arenaConfig = {
  width: 10000,
  height: 10000,
  velocityIncrease: 0.4,
  velocityDecrease: 0.1,
  maxVelocity: 4,
};

class Arena {
  private players: Record<string, Player>;
  private config: ArenaConfig;

  public constructor(config: ArenaConfig = arenaConfig) {
    this.players = {};
    this.config = { ...arenaConfig, ...config };
  }

  public addPlayer(x: number, y: number): string {
    const id = uuidv4();

    this.players[id] = { x, y, velocityX: 0, velocityY: 0 };
    return id;
  }

  public removePlayer(id: string): void {
    delete this.players[id];
  }

  public movePlayer(id: string, directions: Direction[]): void {
    const player = this.players[id];
    const maxVelocity = this.config.maxVelocity;
    const velocityIncrease = this.config.velocityIncrease;
    const velocityDecrease = this.config.velocityDecrease;

    if (directions.includes("down") && player.velocityY < maxVelocity) {
      player.velocityY += velocityIncrease;
    } else if (directions.includes("up") && player.velocityY > -maxVelocity) {
      player.velocityY -= velocityIncrease;
    } else if (player.velocityY < 0) {
      player.velocityY += velocityDecrease;
    } else if (player.velocityY > 0) {
      player.velocityY -= velocityDecrease;
    }

    if (directions.includes("right") && player.velocityX < maxVelocity) {
      player.velocityX += velocityIncrease;
    } else if (directions.includes("left") && player.velocityX > -maxVelocity) {
      player.velocityX -= velocityIncrease;
    } else if (player.velocityX < 0) {
      player.velocityX += velocityDecrease;
    } else if (player.velocityX > 0) {
      player.velocityX -= velocityDecrease;
    }

    if (player.y < 0) {
      player.y = 0;
    } else if (player.y > this.config.height) {
      player.y = this.config.height;
    }

    if (player.x < 0) {
      player.x = 0;
    } else if (player.x > this.config.width) {
      player.x = this.config.width;
    }
  }
}
