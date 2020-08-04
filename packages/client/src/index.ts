import { Game } from "./game.js";
import { BorderSprite, PlayerSprite } from "./sprites.js";

interface Player {
  x: number;
  y: number;
}

const target = document.getElementById("main");

if (target === null || !(target instanceof HTMLCanvasElement)) {
  throw new Error("canvas is missing");
}

const game = new Game(target);

const connection = new WebSocket("ws://localhost:8000/");
const players: Record<string, Player> = {};
const sprites: WeakMap<Player, PlayerSprite> = new WeakMap();

let id: string;

const keys = {
  up: false,
  down: false,
  right: false,
  left: false,
};

game.on("keydown", (event: Event) => {
  switch ((event as KeyboardEvent).key) {
    case "ArrowUp":
      keys.up = true;
      break;
    case "ArrowDown":
      keys.down = true;
      break;
    case "ArrowRight":
      keys.right = true;
      break;
    case "ArrowLeft":
      keys.left = true;
      break;
  }
});

game.on("keyup", (event: Event) => {
  switch ((event as KeyboardEvent).key) {
    case "ArrowUp":
      keys.up = false;
      break;
    case "ArrowDown":
      keys.down = false;
      break;
    case "ArrowRight":
      keys.right = false;
      break;
    case "ArrowLeft":
      keys.left = false;
      break;
  }
});

connection.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.kind === "add") {
    players[data.id] = { x: data.x, y: data.y };
  } else if (data.kind === "move") {
    const current = players[data.id];

    if (typeof current !== "undefined") {
      current.x = data.x;
      current.y = data.y;
    }
  } else if (data.kind === "remove") {
    delete players[data.id];
  } else if (data.kind === "id") {
    id = data.id;
  }
});

connection.addEventListener("open", (event) => {
  game.tasks.push(() => {
    connection.send(
      JSON.stringify({
        kind: "move",
        left: keys.left,
        right: keys.right,
        up: keys.up,
        down: keys.down,
      })
    );
  });

  game.tasks.push(() => {
    const currentPlayer = players[id];

    const originX = target.width / 2;
    const originY = target.height / 2;

    const borderLeft = new BorderSprite(0, 0);

    borderLeft.x = originX + (0 - currentPlayer.x);
    borderLeft.y = originY + (0 - currentPlayer.y);
    borderLeft.direction = "left";
    borderLeft.target = target;

    const borderRight = new BorderSprite(0, 0);

    borderRight.x = originX + (1000 - currentPlayer.x);
    borderRight.y = originY + (0 - currentPlayer.y);
    borderRight.direction = "right";
    borderRight.target = target;

    const borderUp = new BorderSprite(0, 0);

    borderUp.x = originX + (0 - currentPlayer.x);
    borderUp.y = originY + (0 - currentPlayer.y);
    borderUp.direction = "up";
    borderUp.target = target;

    const borderDown = new BorderSprite(0, 0);

    borderDown.x = originX + (0 - currentPlayer.x);
    borderDown.y = originY + (1000 - currentPlayer.y);
    borderDown.direction = "down";
    borderDown.target = target;

    borderLeft.render(game.context);
    borderRight.render(game.context);
    borderUp.render(game.context);
    borderDown.render(game.context);
  })

  game.tasks.push(() => {
    const currentPlayer = players[id];

    const originX = target.width / 2;
    const originY = target.height / 2;

    for (const [id, player] of Object.entries(players)) {
      let sprite = sprites.get(player);

      if (typeof sprite === "undefined") {
        sprite = new PlayerSprite(0, 0);
        sprites.set(player, sprite);
      }

      if (player === currentPlayer) {
        sprite.current = true;
      } else {
        sprite.current = false;
      }

      sprite.x = originX + (player.x - currentPlayer.x);
      sprite.y = originY + (player.y - currentPlayer.y);

      sprite.render(game.context);
    }
  });
});

game.play();
