import { Game } from "./game.js";
import { Person } from "./sprites.js";

const target = document.getElementById("main");

if (target === null || !(target instanceof HTMLCanvasElement)) {
  throw new Error("canvas is missing");
}

const game = new Game(target);

const connection = new WebSocket("ws://localhost:8000/");
const players: Record<string, Person> = {};

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
    players[data.id] = new Person(data.x, data.y);
  } else if (data.kind === "move") {
    const current = players[data.id];

    if (typeof current !== "undefined") {
      current.x = data.x;
      current.y = data.y;
    }
  } else if (data.kind === "remove") {
    delete players[data.id];
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
});

game.tasks.push(() => {
  for (const player of Object.values(players)) {
    player.render(game.context);
  }
});

game.play();
