export { Arena };

import { Food, Movement, Player } from "shared/sprites";
import { defaultConfig as config } from "shared/config";
import { v4 as uuidv4 } from "uuid";

class Arena {
  public players: Record<string, Player | undefined>;
  public food: Record<string, Food | undefined>;

  public constructor() {
    this.players = {};
    this.food = {};
  }

  public addFood(x: number, y: number): string {
    const id = uuidv4();

    this.food[id] = {
      role: "dot",
      x,
      y,
      velocityX: 0,
      velocityY: 0,
      mass: config.foodMass,
      movement: { left: false, right: false, up: false, down: false },
    };

    return id;
  }

  public removeFood(id: string): void {
    delete this.food[id];
  }

  public addPlayer(name: string, x: number, y: number): string {
    const id = uuidv4();

    this.players[id] = {
      role: "basic",
      x,
      y,
      name,
      velocityX: 0,
      velocityY: 0,
      mass: config.playerMass,
      movement: { left: false, right: false, up: false, down: false },
      score: 0,
      weapons: [],
    };

    return id;
  }

  public massPlayer(id: string, change: number): void {
    const player = this.players[id];

    if (player !== undefined) {
      player.mass += change;
    }
  }

  public scorePlayer(id: string, change: number): void {
    const player = this.players[id];

    if (player !== undefined) {
      player.score += change;
    }
  }

  public movePlayer(id: string, movement: Movement): void {
    const player = this.players[id];

    if (player !== undefined) {
      player.movement = movement;
    }
  }

  public removePlayer(id: string): void {
    delete this.players[id];
  }
}
