import { Game } from "./game.js";
import { Basic } from "./sprites.js";

const target = document.getElementById("main");

if (target === null || !(target instanceof HTMLCanvasElement)) {
  throw new Error("canvas is missing");
}

const game = new Game(target);

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
}

const player = new Basic(0, 0);

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
});

game.play();
