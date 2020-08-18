import { BorderSprite, FoodSprite, PlayerSprite } from "client/sprites";
import {
  Food,
  Movement,
  Player,
  move as movePlayer,
  restrict as restrictPlayer,
} from "shared/sprites";
import { Game } from "client/game";
import { defaultConfig as config } from "shared/config";

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
  private name: string;
  private id?: string;

  public constructor(target: HTMLCanvasElement, name: string) {
    this.target = target;

    this.game = new Game(this.target);
    this.connection = new WebSocket(`ws://${config.host}:${config.port}`);

    this.players = {};
    this.food = {};

    this.sprites = {};
    this.borders = ["left", "right", "up", "down"].map(
      (x) => new BorderSprite(0, 0, this.target, x)
    );

    this.name = name;
    this.id = undefined;
  }

  private listenKeys(direction: "up" | "down", key: string): void {
    if (this.id === undefined) {
      return;
    }

    const change = direction === "down";
    const movement = this.players[this.id].movement;

    switch (key) {
      case "ArrowUp":
      case "w":
        movement.up = change;
        break;
      case "ArrowDown":
      case "s":
        movement.down = change;
        break;
      case "ArrowRight":
      case "d":
        movement.right = change;
        break;
      case "ArrowLeft":
      case "a":
        movement.left = change;
        break;
    }

    this.move(movement);
  }

  private listenMessage(data: string): void {
    const parsed = JSON.parse(data);

    if (parsed.kind === "addPlayer") {
      const id = parsed.id;
      const player = parsed.player;

      const originX = this.target.width / 2;
      const originY = this.target.height / 2;

      const currentX = this.id !== undefined ? this.players[this.id].x : 0;
      const currentY = this.id !== undefined ? this.players[this.id].y : 0;

      this.players[id] = { ...player, offX: 0, offY: 0 };
      this.sprites[id] = new PlayerSprite(
        originX + (player.x - currentX),
        originY + (player.y - currentY),
        player.mass,
        player.score,
        player.name,
        false
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

      if (id === this.id) {
        window.location.reload();
      }

      delete this.players[id];
      delete this.sprites[id];
    } else if (parsed.kind === "initialize") {
      this.id = parsed.id;
    } else if (parsed.kind === "addFood") {
      const id = parsed.id;
      const food = parsed.food;

      const originX = this.target.width / 2;
      const originY = this.target.height / 2;

      const currentX = this.id !== undefined ? this.players[this.id].x : 0;
      const currentY = this.id !== undefined ? this.players[this.id].y : 0;

      this.food[id] = food;
      this.sprites[id] = new FoodSprite(
        originX + (food.x - currentX),
        originY + (food.y - currentY)
      );
    } else if (parsed.kind === "removeFood") {
      const id = parsed.id;

      delete this.food[id];
      delete this.sprites[id];
    }
  }

  private updatePlayers(): void {
    if (this.id === undefined) {
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
      sprite.mass = player.mass;
      sprite.score = player.score;

      if (id === this.id) {
        sprite.current = true;
      } else {
        sprite.current = false;
      }
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
    for (const [id, player] of Object.entries(this.players)) {
      const resolve = config.resolve;
      const tolerance = config.tolerance;

      console.log(id, player.offX, player.offY);

      if (Math.abs(player.offX) < tolerance) {
        // pass
      } else if (Math.abs(player.offX) > resolve * 10) {
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

      if (Math.abs(player.offY) < tolerance) {
        // pass
      } else if (Math.abs(player.offY) > resolve * 10) {
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
    if (this.id === undefined) {
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

  private move(movement: Movement): void {
    if (this.id === undefined) {
      return;
    }

    this.connection.send(
      JSON.stringify({
        kind: "movePlayer",
        movement: movement,
      })
    );
  }

  private render(context: CanvasRenderingContext2D): void {
    for (const border of this.borders) {
      border.render(context);
    }

    for (const sprite of Object.values(this.sprites).sort(
      (a, b) => a.mass - b.mass
    )) {
      sprite.render(context);
    }
  }

  public run(): void {
    this.connection.addEventListener("message", (event) =>
      this.listenMessage(event.data)
    );

    this.connection.addEventListener("open", () =>
      this.connection.send(
        JSON.stringify({ kind: "initialize", name: this.name })
      )
    );

    window.setInterval(() => {
      console.time("frame");

      this.updatePlayers();
      this.updateBorders();

      console.timeEnd("frame");
    }, config.frameRate);

    window.setInterval(() => {
      console.time("response");

      this.reconcilePlayers();

      if (this.id !== undefined) {
        this.move(this.players[this.id].movement);
      }

      console.timeEnd("response");
    }, config.responseRate);

    this.game.on("keydown", (event) => this.listenKeys("down", event.key));
    this.game.on("keyup", (event) => this.listenKeys("up", event.key));
    this.game.tasks.push((context) => this.render(context));
    this.game.play();
  }
}

const main = document.getElementById("main");
const name = document.getElementById("name");
const play = document.getElementById("play");
const connect = document.getElementById("connect");

if (main === null || name === null || play === null || connect === null) {
  throw new Error("some required elements are missing");
}

if (
  !(main instanceof HTMLCanvasElement) ||
  !(name instanceof HTMLInputElement)
) {
  throw new Error("some required elements have incorrect types");
}

main.hidden = true;
name.focus();

const nameKeyDown = (event: KeyboardEvent): void => {
  if (event.key === "Enter") {
    play.click();
    name.removeEventListener("keydown", nameKeyDown);
    play.removeEventListener("click", playClick);
  }
};

const playClick = (): void => {
  const game = new DotZZ(main, name.value);

  main.hidden = false;
  connect.hidden = true;

  game.run();

  name.removeEventListener("keydown", nameKeyDown);
  play.removeEventListener("click", playClick);
};

name.addEventListener("keydown", nameKeyDown);
play.addEventListener("click", playClick);
