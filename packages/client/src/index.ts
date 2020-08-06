import { Game } from "./game.js";
import { BorderSprite, PlayerSprite } from "./sprites.js";

interface Player {
  x: number;
  y: number;
}

interface DotZZConfig {
  host: string;
  port: number;
  width: number;
  height: number;
}

interface Keys {
  up: boolean;
  down: boolean;
  right: boolean;
  left: boolean;
}

const dotzzConfig = {
  port: 8000,
  host: "192.168.1.196",
  width: 1000,
  height: 1000,
};

class DotZZ {
  private target: HTMLCanvasElement;
  private config: DotZZConfig;
  private game: Game;
  private connection: WebSocket;
  private players: Record<string, Player>;
  private sprites: WeakMap<Player, PlayerSprite>;
  private borders: BorderSprite[];
  private keys: Keys;
  private id?: string;

  public constructor(
    target: HTMLCanvasElement,
    config: DotZZConfig = dotzzConfig
  ) {
    this.target = target;
    this.config = config;

    this.game = new Game(this.target);
    this.connection = new WebSocket(
      `ws://${this.config.host}:${this.config.port}`
    );

    this.players = {};
    this.sprites = new WeakMap();
    this.borders = [
      new BorderSprite(
        0,
        0,
        this.target,
        "left",
        this.config.height,
        this.config.width
      ),
      new BorderSprite(
        0,
        0,
        this.target,
        "right",
        this.config.height,
        this.config.width
      ),
      new BorderSprite(
        0,
        0,
        this.target,
        "up",
        this.config.height,
        this.config.width
      ),
      new BorderSprite(
        0,
        0,
        this.target,
        "down",
        this.config.height,
        this.config.width
      ),
    ];

    this.keys = { up: false, down: false, right: false, left: false };
    this.id = undefined;

    this.game.on("keydown", (event) => {
      const key = event.key;

      if (key === "ArrowUp") {
        this.keys.up = true;
      } else if (key === "ArrowDown") {
        this.keys.down = true;
      } else if (key === "ArrowRight") {
        this.keys.right = true;
      } else if (key === "ArrowLeft") {
        this.keys.left = true;
      }
    });

    this.game.on("keyup", (event) => {
      const key = event.key;

      if (key === "ArrowUp") {
        this.keys.up = false;
      } else if (key === "ArrowDown") {
        this.keys.down = false;
      } else if (key === "ArrowRight") {
        this.keys.right = false;
      } else if (key === "ArrowLeft") {
        this.keys.left = false;
      }
    });

    this.connection.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (data.kind === "add") {
        this.addPlayer(data.id, data.x, data.y);
      } else if (data.kind === "move") {
        this.movePlayer(data.id, data.x, data.y);
      } else if (data.kind === "remove") {
        this.removePlayer(data.id);
      } else if (data.kind === "id") {
        this.id = data.id;
      }
    });

    this.connection.addEventListener("open", () => {
      this.game.tasks.push(() => this.reportMove());
      this.game.tasks.push(() => this.renderBorders());
      this.game.tasks.push(() => this.renderSprites());
    });
  }

  private reportMove(): void {
    this.connection.send(JSON.stringify({ kind: "move", ...this.keys }));
  }

  private renderBorders(): void {
    if (typeof this.id === "undefined") {
      return;
    }

    const currentPlayer = this.players[this.id];

    const originX = this.target.width / 2;
    const originY = this.target.height / 2;

    this.borders[0].x = originX + (0 - currentPlayer.x);
    this.borders[0].y = originY + (0 - currentPlayer.y);

    this.borders[1].x = originX + (1000 - currentPlayer.x);
    this.borders[1].y = originY + (0 - currentPlayer.y);

    this.borders[2].x = originX + (0 - currentPlayer.x);
    this.borders[2].y = originY + (0 - currentPlayer.y);

    this.borders[3].x = originX + (0 - currentPlayer.x);
    this.borders[3].y = originY + (1000 - currentPlayer.y);

    this.borders[0].render(this.game.context);
    this.borders[1].render(this.game.context);
    this.borders[2].render(this.game.context);
    this.borders[3].render(this.game.context);
  }

  private renderSprites(): void {
    if (typeof this.id === "undefined") {
      return;
    }

    const currentPlayer = this.players[this.id];

    const originX = this.target.width / 2;
    const originY = this.target.height / 2;

    for (const player of Object.values(this.players)) {
      let sprite = this.sprites.get(player);

      if (typeof sprite === "undefined") {
        sprite = new PlayerSprite(0, 0);
        this.sprites.set(player, sprite);
      }

      if (player === currentPlayer) {
        sprite.current = true;
      } else {
        sprite.current = false;
      }

      if (player.x < 0) {
        player.x = 0;
      } else if (player.x > this.config.width) {
        player.x = this.config.width;
      }

      if (player.y < 0) {
        player.y = 0;
      } else if (player.y > this.config.height) {
        player.y = this.config.height;
      }

      sprite.x = originX + (player.x - currentPlayer.x);
      sprite.y = originY + (player.y - currentPlayer.y);

      sprite.render(this.game.context);
    }
  }

  private addPlayer(id: string, x: number, y: number): void {
    this.players[id] = { x, y };
  }

  private movePlayer(id: string, x: number, y: number): void {
    const player = this.players[id];

    player.x = x;
    player.y = y;
  }

  private removePlayer(id: string): void {
    delete this.players[id];
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
