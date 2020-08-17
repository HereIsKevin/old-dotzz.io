import { BorderSprite, FoodSprite, PlayerSprite } from "client/sprites";
import { defaultConfig as config } from "shared/config";
import {
  Food,
  Movement,
  Player,
  move as movePlayer,
  restrict as restrictPlayer,
} from "shared/sprites";
import { Game } from "client/game";

interface ClientPlayer extends Player {
  offX: number;
  offY: number;
}

class DotZZ {
  private target: HTMLCanvasElement;
  private game: Game;
  private connection: WebSocket;
  private players: Record<string, ClientPlayer>;
  private food: Record<string, Food>;
  private sprites: Record<string, FoodSprite | PlayerSprite>;
  private borders: BorderSprite[];
  private id?: string;

  public constructor(target: HTMLCanvasElement) {
    this.target = target;

    this.game = new Game(this.target);
    this.connection = new WebSocket(`ws://${config.host}:${config.port}`);

    this.players = {};
    this.food = {};

    this.sprites = {};
    this.borders = ["left", "right", "up", "down"].map(
      (x) => new BorderSprite(0, 0, this.target, x)
    );

    this.id = undefined;
  }

  private listenKeys(direction: "up" | "down", key: string): void {
    if (typeof this.id === "undefined") {
      return;
    }

    const change = direction === "down";
    const player = this.players[this.id];

    switch (key) {
      case "ArrowUp":
      case "w":
        player.movement.up = change;
        break;
      case "ArrowDown":
      case "s":
        player.movement.down = change;
        break;
      case "ArrowRight":
      case "d":
        player.movement.right = change;
        break;
      case "ArrowLeft":
      case "a":
        player.movement.left = change;
        break;
    }
  }

  private listenMessage(data: string) {
    const parsed = JSON.parse(data);

    if (parsed.kind === "addPlayer") {
      const id = parsed.id;
      const player = parsed.player;

      this.players[id] = { ...player, offX: 0, offY: 0 };
      this.sprites[id] = new PlayerSprite(
        player.x,
        player.y,
        player.mass,
        player.score,
        id === this.id
      );
    } else if (parsed.kind === "movePlayer") {
      const player = this.players[parsed.id];

      player.offX = parsed.x - player.x;
      player.offY = parsed.y - player.y;
      player.velocityX = parsed.velocityX;
      player.velocityY = parsed.velocityY;
      player.movement = parsed.movement;
    } else if (parsed.kind === "massPlayer") {
      this.players[parsed.id].mass = parsed.mass;
    } else if (parsed.kind === "scorePlayer") {
      this.players[parsed.id].score = parsed.score;
    } else if (parsed.kind === "removePlayer") {
      const id = parsed.id;

      delete this.players[id];
      delete this.sprites[id];
    } else if (parsed.kind === "initialize") {
      this.id = parsed.id;
      this.move();
    } else if (parsed.kind === "addFood") {
      const id = parsed.id;
      const food = parsed.food;

      console.log(id, food)

      this.food[id] = food;
      this.sprites[id] = new FoodSprite(food.x, food.y);
    } else if (parsed.kind === "removeFood") {
      const id = parsed.id;

      delete this.food[id];
      delete this.sprites[id];
    }
  }

  private updatePlayers(): void {
    if (typeof this.id === "undefined") {
      return;
    }

    const currentPlayer = this.players[this.id];

    const originX = this.target.width / 2;
    const originY = this.target.height / 2;

    for (const [id, player] of Object.entries(this.players)) {
      movePlayer(player);
      restrictPlayer(player);

      const sprite = this.sprites[id];

      if (!(sprite instanceof PlayerSprite)) {
        continue;
      }

      sprite.x = originX + (player.x - currentPlayer.x);
      sprite.y = originY + (player.y - currentPlayer.y);
      sprite.size = player.mass;
      sprite.score = player.score;
    }

    for (const [id, food] of Object.entries(this.food)) {
      const sprite = this.sprites[id];

      if (!(sprite instanceof FoodSprite)) {
        continue;
      }

      sprite.x = originX + (food.x - currentPlayer.x);
      sprite.y = originY + (food.y - currentPlayer.y);
    }
  }

  private reconcilePlayers(): void {
    for (const player of Object.values(this.players)) {
      const resolve = config.resolve;
      const tolerance = config.tolerance;

      if (Math.abs(player.offX) > resolve * 5) {
        player.x += player.offX;
        player.offX = 0;
      } else if (player.offX < resolve && player.offX > -resolve) {
        player.x += player.offX;
        player.offX = 0;
      } else if (player.offX > resolve) {
        player.x += resolve;
        player.offX += resolve;
      } else if (player.offX < -resolve) {
        player.x -= resolve;
        player.offX -= resolve;
      }

      if (Math.abs(player.offY) > resolve * 5) {
        player.y += player.offY;
        player.offY = 0;
      } else if (player.offY < resolve && player.offY > -resolve) {
        player.y += player.offY;
        player.offY = 0;
      } else if (player.offY > resolve) {
        player.y += resolve;
        player.offY += resolve;
      } else if (player.offY < -resolve) {
        player.y -= resolve;
        player.offY -= resolve;
      }
    }
  }

  private updateBorders(): void {
    if (typeof this.id === "undefined") {
      return;
    }

    const currentPlayer = this.players[this.id];

    const originX = this.target.width / 2;
    const originY = this.target.height / 2;

    this.borders[0].x = originX + (0 - currentPlayer.x);
    this.borders[0].y = originY + (0 - currentPlayer.y);

    this.borders[1].x = originX + (config.width - currentPlayer.x);
    this.borders[1].y = originY + (0 - currentPlayer.y);

    this.borders[2].x = originX + (0 - currentPlayer.x);
    this.borders[2].y = originY + (0 - currentPlayer.y);

    this.borders[3].x = originX + (0 - currentPlayer.x);
    this.borders[3].y = originY + (config.height - currentPlayer.y);
  }

  private move(): void {
    if (typeof this.id === "undefined") {
      return;
    }

    this.connection.send(
      JSON.stringify({
        kind: "movePlayer",
        movement: this.players[this.id].movement,
      })
    );
  }

  private render(context: CanvasRenderingContext2D): void {
    for (const border of this.borders) {
      border.render(context);
    }

    for (const sprite of Object.values(this.sprites)) {
      sprite.render(context);
    }
  }

  public run(): void {
    this.connection.addEventListener("message", (event) =>
      this.listenMessage(event.data)
    );

    window.setInterval(() => {
      this.updatePlayers();
      this.updateBorders();
    }, config.frameRate);

    window.setInterval(() => {
      this.move();
      this.reconcilePlayers();
    }, config.responseRate);

    this.game.on("keydown", (event) => this.listenKeys("down", event.key));
    this.game.on("keyup", (event) => this.listenKeys("up", event.key));
    this.game.tasks.push((context) => this.render(context));
    this.game.play();
  }
}

const target = document.getElementById("main");

if (target === null || !(target instanceof HTMLCanvasElement)) {
  throw new Error("target cannot be found");
}

const dotzz = new DotZZ(target);
dotzz.run();
