import { Game } from "./game.js";
import { BorderSprite, PlayerSprite } from "./sprites.js";

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

interface DotZZConfig {
  host: string;
  port: number;
  width: number;
  height: number;
  velocityIncrease: number;
  velocityDecrease: number;
  maxVelocity: number;
  moveInterval: number;
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
  velocityIncrease: 0.4,
  velocityDecrease: 0.1,
  maxVelocity: 4,
  moveInterval: 1000 / 60,
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
  private lastKeys: Movement;

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
    this.lastKeys = { up: false, down: false, right: false, left: false };
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
        this.addPlayer(
          data.id,
          data.x,
          data.y,
          data.velocityX,
          data.velocityY,
          data.movement
        );
      } else if (data.kind === "move") {
        this.movePlayer(
          data.id,
          data.x,
          data.y,
          data.velocityX,
          data.velocityY,
          data.movement
        );
      } else if (data.kind === "remove") {
        this.removePlayer(data.id);
      } else if (data.kind === "id") {
        this.id = data.id;
      }
    });

    this.connection.addEventListener("open", () => {
      this.connection.send(JSON.stringify({ kind: "move", ...this.keys }));
      this.game.tasks.push(() => this.reportMove());
      this.game.tasks.push(() => this.renderBorders());
      this.game.tasks.push(() => this.renderSprites());
    });

    window.setInterval(() => {
      for (const player of Object.values(this.players)) {
        if (typeof player.movement === "undefined") {
          continue;
        }

        // change x coordinate by current x velocity
        player.x += player.velocityX;
        // change y coordinate by current y velocity
        player.y += player.velocityY;

        const maxVelocity = this.config.maxVelocity;
        const velocityIncrease = this.config.velocityIncrease;
        const velocityDecrease = this.config.velocityDecrease;

        if (player.movement.down && player.velocityY < maxVelocity) {
          // increase y velocity when possible while moving down
          player.velocityY += velocityIncrease;
        } else if (player.movement.up && player.velocityY > -maxVelocity) {
          // increase y velocity when possible while moving up
          player.velocityY -= velocityIncrease;
        } else if (player.velocityY < 0) {
          // decrease y velocity when not moving up
          player.velocityY += velocityDecrease;
        } else if (player.velocityY > 0) {
          // decrease y velocity when not moving down
          player.velocityY -= velocityDecrease;
        }

        if (player.movement.right && player.velocityX < maxVelocity) {
          // increase x velocity when possible while moving right
          player.velocityX += velocityIncrease;
        } else if (player.movement.left && player.velocityX > -maxVelocity) {
          // increase x velocity when possible while moving left
          player.velocityX -= velocityIncrease;
        } else if (player.velocityX < 0) {
          // decrease x velocity when not moving left
          player.velocityX += velocityDecrease;
        } else if (player.velocityX > 0) {
          // decrease y velocity when not moving right
          player.velocityX -= velocityDecrease;
        }

        // make sure y is within boundaries
        if (player.y < 0) {
          player.y = 0;
        } else if (player.y > this.config.height) {
          player.y = this.config.height;
        }

        // make sure x is within boundaries
        if (player.x < 0) {
          player.x = 0;
        } else if (player.x > this.config.width) {
          player.x = this.config.width;
        }
      }
    }, this.config.moveInterval);
  }

  private reportMove(): void {
    if (
      this.lastKeys.down !== this.keys.down ||
      this.lastKeys.up !== this.keys.up ||
      this.lastKeys.right !== this.keys.right ||
      this.lastKeys.left !== this.keys.left
    ) {
      this.connection.send(JSON.stringify({ kind: "move", ...this.keys }));
      this.lastKeys = { ...this.keys };
    }
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

  private addPlayer(
    id: string,
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    movement: Movement
  ): void {
    this.players[id] = { x, y, velocityX, velocityY, movement };
  }

  private movePlayer(
    id: string,
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    movement: Movement
  ): void {
    const player = this.players[id];

    if (Math.round(player.x) + 0.5 < Math.round(x)) {
      player.x = player.x + 0.5;
    } else if (Math.round(player.x) > Math.round(x) + 0.5) {
      player.x = player.x - 0.5;
    }

    if (Math.round(player.y) + 0.5 < Math.round(y)) {
      player.y = player.y + 0.5;
    } else if (Math.round(player.y) > Math.round(y) + 0.5) {
      player.y = player.y - 0.5;
    }

    player.velocityX = velocityX;
    player.velocityY = velocityY;
    player.movement = movement;
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
