export { Arena, ArenaConfig, Movement, Player };

import { move as movePlayer, restrict as restrictPlayer } from "shared/player";
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
        movePlayer(player);
        restrictPlayer(player);
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
