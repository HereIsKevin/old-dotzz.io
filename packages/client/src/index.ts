import { BorderSprite, PlayerSprite } from "client/sprites";
import { Config, defaultConfig } from "shared/config";
import {
  Movement,
  Player,
  move as movePlayer,
  restrict as restrictPlayer,
} from "shared/player";
import { Game } from "client/game";

interface ClientPlayer extends Player {
  offX: number;
  offY: number;
}

function equalObjects<
  T extends Record<string, unknown>,
  R extends Record<string, unknown>
>(object1: T, object2: R): boolean {
  const keys1 = Object.getOwnPropertyNames(object1).sort();
  const keys2 = Object.getOwnPropertyNames(object2).sort();

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let index = 0; index < keys1.length; index++) {
    const key1 = keys1[index];
    const key2 = keys2[index];

    if (key1 !== key2) {
      return false;
    } else if (object1[key1] !== object2[key2]) {
      return false;
    }
  }

  return true;
}

class DotZZ {
  private target: HTMLCanvasElement;
  private config: Config;
  private game: Game;
  private connection: WebSocket;
  private players: Record<string, ClientPlayer>;
  private sprites: WeakMap<ClientPlayer, PlayerSprite>;
  private borders: BorderSprite[];
  private keys: Movement;
  private id?: string;

  public constructor(
    target: HTMLCanvasElement,
    config: Config = defaultConfig
  ) {
    this.target = target;
    this.config = { ...defaultConfig, ...config };

    this.game = new Game(this.target);
    this.connection = new WebSocket(
      `ws://${this.config.host}:${this.config.port}`
    );

    this.players = {};
    this.sprites = new WeakMap();
    this.borders = ["left", "right", "up", "down"].map(
      (x) => new BorderSprite(0, 0, this.target, x, this.config)
    );

    this.keys = { up: false, down: false, right: false, left: false };
    this.id = undefined;

    this.game.on("keydown", (event) => this.listenKeys("down", event.key));
    this.game.on("keyup", (event) => this.listenKeys("up", event.key));

    this.connection.addEventListener("message", (event) =>
      this.listenMessage(event.data)
    );

    this.connection.addEventListener("open", () => {
      this.connection.send(JSON.stringify({ kind: "move", ...this.keys }));
    });

    window.setInterval(() => {
      this.movePlayers();
      this.moveBorders();
    }, this.config.frameRate);

    window.setInterval(() => {
      this.connection.send(JSON.stringify({ kind: "move", ...this.keys }));
    }, this.config.responseRate);
  }

  private movePlayers(): void {
    for (const player of Object.values(this.players)) {
      if (typeof player.movement === "undefined") {
        continue;
      }

      movePlayer(player);

      const resolve = this.config.resolve;
      const tolerance = this.config.tolerance;

      if (Math.abs(player.offX) > tolerance) {
        player.x -= player.offX;
        player.offX = 0;
      } else if (player.offX < resolve && player.offX > -resolve) {
        player.x += player.offX;
        player.offX = 0;
      } else if (player.offX > resolve) {
        player.x -= resolve;
        player.offX -= resolve;
      } else if (player.offX < -resolve) {
        player.x += resolve;
        player.offX += resolve;
      }

      if (Math.abs(player.offY) > tolerance) {
        player.y -= player.offY;
        player.offY = 0;
      } else if (player.offY < resolve && player.offY > -resolve) {
        player.y += player.offY;
        player.offY = 0;
      } else if (player.offY > resolve) {
        player.y -= resolve;
        player.offY -= resolve;
      } else if (player.offY < -resolve) {
        player.y += resolve;
        player.offY += resolve;
      }

      restrictPlayer(player);
    }
  }

  private moveBorders(): void {
    if (typeof this.id === "undefined") {
      return;
    }

    const currentPlayer = this.players[this.id];

    const originX = this.target.width / 2;
    const originY = this.target.height / 2;

    this.borders[0].x = originX + (0 - currentPlayer.x);
    this.borders[0].y = originY + (0 - currentPlayer.y);

    this.borders[1].x = originX + (this.config.width - currentPlayer.x);
    this.borders[1].y = originY + (0 - currentPlayer.y);

    this.borders[2].x = originX + (0 - currentPlayer.x);
    this.borders[2].y = originY + (0 - currentPlayer.y);

    this.borders[3].x = originX + (0 - currentPlayer.x);
    this.borders[3].y = originY + (this.config.height - currentPlayer.y);
  }

  private listenMessage(data: string) {
    const parsed = JSON.parse(data);

    if (parsed.kind === "add") {
      this.players[parsed.id] = {
        x: parsed.x,
        y: parsed.y,
        offX: 0,
        offY: 0,
        velocityX: parsed.velocityX,
        velocityY: parsed.velocityY,
        movement: parsed.movement,
      };
    } else if (parsed.kind === "move") {
      const player = this.players[parsed.id];

      player.offX = player.x - parsed.x;
      player.offY = player.y - parsed.y;
      player.velocityX = parsed.velocityX;
      player.velocityY = parsed.velocityY;
      player.movement = parsed.movement;
    } else if (parsed.kind === "remove") {
      delete this.players[parsed.id];
    } else if (parsed.kind === "id") {
      this.id = parsed.id;
      this.connection.send(JSON.stringify({ kind: "move", ...this.keys }));
      this.game.tasks.push((context) => {
        this.renderBorders(context);
        this.renderSprites(context);
      });
    }
  }

  private listenKeys(direction: "up" | "down", key: string): void {
    const change = direction === "down";
    const oldKeys = { ...this.keys };

    switch (key) {
      case "ArrowUp":
      case "w":
        this.keys.up = change;
        break;
      case "ArrowDown":
      case "s":
        this.keys.down = change;
        break;
      case "ArrowRight":
      case "d":
        this.keys.right = change;
        break;
      case "ArrowLeft":
      case "a":
        this.keys.left = change;
        break;
    }
  }

  private renderBorders(context: CanvasRenderingContext2D): void {
    for (const border of this.borders) {
      border.render(context);
    }
  }

  private renderSprites(context: CanvasRenderingContext2D): void {
    // do not render anything if the current player id is unknown
    if (typeof this.id === "undefined") {
      return;
    }

    // fetch the current player based on the id
    const currentPlayer = this.players[this.id];

    // origin is displayed at the center of the canvas
    const originX = this.target.width / 2;
    const originY = this.target.height / 2;

    for (const player of Object.values(this.players)) {
      let sprite = this.sprites.get(player);

      // create new sprite if the current player does not have one
      if (typeof sprite === "undefined") {
        sprite = new PlayerSprite(0, 0);
        this.sprites.set(player, sprite);
      }

      // mark as current if sprite is the current player
      if (player === currentPlayer) {
        sprite.current = true;
      } else {
        sprite.current = false;
      }

      // 0 for x is x coordinate of the current player, then center visually
      sprite.x = originX + (player.x - currentPlayer.x);
      // 0 for y is y coordinate of the current player, then center visually
      sprite.y = originY + (player.y - currentPlayer.y);

      // render sprite on canvas
      sprite.render(context);
    }
  }

  public run(): void {
    this.game.play();
  }
}

let target = document.getElementById("main");

if (target === null) {
  target = new HTMLCanvasElement();
  target.id = "main";

  document.body.prepend(target);
}

const dotzz = new DotZZ(target as HTMLCanvasElement);
dotzz.run();
