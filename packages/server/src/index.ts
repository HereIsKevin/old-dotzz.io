import * as http from "http";
import * as fs from "fs/promises";
import WebSocket from "ws";

import { Router } from "./router.js";
import { Server } from "./server.js";

const server = new Server();
const router = new Router();

const websocket = new WebSocket.Server({ server: server.server });

let id = 0;
const connections: WebSocket[] = [];
const players: { [key: number]: { x: number; y: number } } = {};

websocket.on("connection", (socket) => {
  socket.on("close", () => {});

  socket.on("message", (message) => {
    const data = JSON.parse(String(message));

    if (data.kind === "request") {
      connections[id] = socket;
      id++;

      players[id] = { x: data.x, y: data.y };

      socket.send(JSON.stringify({ kind: "assign", id }));

      const response = JSON.stringify({
        kind: "add",
        id,
        x: data.x,
        y: data.y,
      });

      for (const connection of connections) {
        if (connection !== connections[id]) {
          connection.send(response);
        }
      }

      for (const [id, player] of Object.entries(players)) {
        socket.send(JSON.stringify({ kind: "add", id, x: player.x, y: player.y }));
      }
    } else if (data.kind === "move") {
      players[data.id] = { x: data.x, y: data.y };

      const response = JSON.stringify({
        x: data.x,
        y: data.y,
        id: data.id,
        kind: "move",
      });

      for (const connection of connections) {
        connection.send(response);
      }
    } else if (data.kind === "dead") {
      const response = JSON.stringify({ kind: "remove", id: data.id });

      for (const connection of connections) {
        if (connection !== connections[data.id]) {
          connection.send(response);
        }
      }

      delete players[data.id];
    }
  });
});

async function sendFile(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  type: string,
  path: string
) {
  response.setHeader("Content-Type", type);
  response.writeHead(200);
  response.end(await fs.readFile(path));
}

router.route("/", async (request, response) =>
  sendFile(request, response, "text/html", "../client/index.html")
);

router.route("/build/index.js", async (request, response) =>
  sendFile(request, response, "text/javascript", "../client/build/index.js")
);

router.route("/build/game.js", async (request, response) =>
  sendFile(request, response, "text/javascript", "../client/build/game.js")
);

router.route("/build/sprites.js", async (request, response) =>
  sendFile(request, response, "text/javascript", "../client/build/sprites.js")
);

router.route("/index.css", async (request, response) =>
  sendFile(request, response, "text/css", "../client/index.css")
);

server.use(async (request, response) => router.handle(request, response));
server.use(async (request, response) => response.end("404 Not Found"));

server.listen(80);
