export { Arena };

import { circleCollided } from "server/utilities";
import { Config, defaultConfig } from "shared/config";
import { Food } from "shared/food";
import { Movement, Player, Weapon, stats, size } from "shared/player";
import { v4 as uuidv4 } from "uuid";

class Arena {
  public players: Record<string, Player>;
  public food: Record<string, Food>;
  public weapons: Record<string, Weapon>;
  public config: Config;

  public constructor(config: Config = defaultConfig) {
    this.players = {};
    this.food = {};
    this.weapons = {};
    this.config = { ...defaultConfig, ...config };
  }

  public addFood(x: number, y: number): string {
    const id = uuidv4();

    // create food at current location
    this.food[id] = { x, y };

    return id;
  }

  public removeFood(id: string): void {
    // permanantly remove food
    delete this.food[id];
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
      movement: {
        down: false,
        up: false,
        right: false,
        left: false,
      },
      role: "basic",
      stats: {
        damage: 0,
        speed: 0,
        regen: 0,
        size: 0,
      },
      modifiers: stats.basic,
      size: this.config.baseSize,
      maxSize: this.config.baseSize,
      score: 0,
      weapons: [],
    };

    return id;
  }

  public sizePlayer(id: string, change: number): void {
    size(this.players[id], change, this.config);
  }

  public scorePlayer(id: string, change: number): void {
    this.players[id].score += change;
  }

  public removePlayer(id: string): void {
    // permanently remove player
    delete this.players[id];
  }

  public movePlayer(id: string, movement: Movement): void {
    // update player movement directions
    this.players[id].movement = movement;
  }

  public addWeapon(playerId: string): string {
    if (player.role === "basic") {
    }
  }

  public eatFood(playerId: string): string[] {
    // find player based on player id
    const player = this.players[playerId];
    // extract comparison stats from player
    const playerStats = { x: player.x, y: player.y, radius: player.size };
    // keep a record of collided food
    const collided = [];

    for (const [foodId, food] of Object.entries(this.food)) {
      // extract comparison stats from food
      const foodStats = { x: food.x, y: food.y, radius: this.config.foodSize };

      // record food id on collision
      if (circleCollided(playerStats, foodStats)) {
        collided.push(foodId);
      }
    }

    return collided;
  }
}
