import { Game } from "./game.js";
import { Person } from "./sprites.js";

const target = document.getElementById("main");

if (target === null || !(target instanceof HTMLCanvasElement)) {
  throw new Error("canvas is missing");
}

const game = new Game(target);

const connection = new WebSocket("ws://localhost:8000/");
const players: Record<string, Person> = {};

const maxSpeed = 4;
const acceleraion = 0.4;
const deceleration = 0.1;

const keys = {
  up: false,
  down: false,
  right: false,
  left: false,
};

const speed = {
  y: 0,
  x: 0,
};

const player = new Person(0, 0);

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

let movable = false;

connection.addEventListener("open", (event) => {
  connection.send(
    JSON.stringify({ kind: "initialize", x: player.x, y: player.y })
  );
  movable = true;
});

game.sprites.push(player);

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

game.tasks.push(() => {
  player.x += speed.x;
  player.y += speed.y;

  if (keys.down && speed.y < maxSpeed) {
    speed.y += acceleraion;
  } else if (keys.up && speed.y > -maxSpeed) {
    speed.y -= acceleraion;
  } else if (speed.y < 0) {
    speed.y += deceleration;
  } else if (speed.y > 0) {
    speed.y -= deceleration;
  }

  if (keys.right && speed.x < maxSpeed) {
    speed.x += acceleraion;
  } else if (keys.left && speed.x > -maxSpeed) {
    speed.x -= acceleraion;
  } else if (speed.x < 0) {
    speed.x += deceleration;
  } else if (speed.x > 0) {
    speed.x -= deceleration;
  }

  if (player.y < 0) {
    player.y = 0;
  } else if (player.y > window.innerHeight) {
    player.y = window.innerHeight;
  }

  if (player.x < 0) {
    player.x = 0;
  } else if (player.x > window.innerWidth) {
    player.x = window.innerWidth;
  }

  if (movable) {
    connection.send(JSON.stringify({ kind: "move", x: player.x, y: player.y }));
  }
});

game.tasks.push(() => {
  for (const thing of Object.values(players)) {
    thing.render(game.context);
  }
});

window.addEventListener("beforeunload", () => {
  connection.send(JSON.stringify({ kind: "remove" }));
});

game.play();
