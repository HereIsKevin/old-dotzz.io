export { Arena };

// shared configuration
import { Config, defaultConfig } from "shared/config";

// shared player movement helpers
import {
  Movement,
  Player,
  move as movePlayer,
  restrict as restrictPlayer,
} from "shared/player";

// unique id generator
import { v4 as uuidv4 } from "uuid";

class Arena {
  public players: Record<string, Player>;
  public config: Config;

  public constructor(config: Config = defaultConfig) {
    this.players = {};
    this.config = { ...defaultConfig, ...config };

    // move all players every frame
    global.setInterval(() => {
      for (const player of Object.values(this.players)) {
        // move the player based on velocity and directions
        movePlayer(player);
        // make sure the player is restricted in arena
        restrictPlayer(player);
      }
    }, this.config.frameRate);
  }

  public addPlayer(x: number, y: number): string {
    // generate unique id for new player
    const id = uuidv4();

    // create new empty player
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
    // permanently remove player
    delete this.players[id];
  }

  public movePlayer(id: string, movement: Movement): void {
    // update player movement directions
    this.players[id].movement = movement;
  }
}
