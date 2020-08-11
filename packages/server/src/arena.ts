export { Arena };

import { randint } from "server/utilities";
import { Config, defaultConfig } from "shared/config";
import { Food } from "shared/food";
import { Movement, Player } from "shared/player";
import { v4 as uuidv4 } from "uuid";

class Arena {
  public players: Record<string, Player>;
  public food: Record<string, Food>;
  public config: Config;

  public constructor(config: Config = defaultConfig) {
    this.players = {};
    this.food = {};
    this.config = { ...defaultConfig, ...config };
  }

  public createFood(x: number, y: number): string {
    const id = uuidv4();

    for (let index = 0; index < this.config.foodIncrease; index++) {
      this.food[id] = { x, y };
    }

    return id;
  }

  public removeFood(id: string): void {
    delete this.food[id];
  }

  public addPlayer(x: number, y: number): string {
    // generate unique id for new player
    const id = uuidv4();

    // create new empty player
    this.players[id] = {
      x,
      y,
      size: this.config.minSize,
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
