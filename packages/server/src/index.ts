import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";

import { Router } from "./router.js";
import { Server } from "./server.js";

interface DotZZConfig {
  port: number;
  host: string;
}

interface Player {
  x: number;
  y: number;
}

const dotzzConfig = { port: 8000, host: "localhost" };

class DotZZ {
  private server: Server;
  private router: Router;
  private socket: WebSocket.Server;
  private config: DotZZConfig;
  private connectionIds: WeakMap<WebSocket, string>;
  private players: Record<string, Player>;

  public constructor({
    port = 8000,
    host = "localhost",
  }: DotZZConfig = dotzzConfig) {
    this.server = new Server();
    this.router = new Router();
    this.socket = new WebSocket.Server({ server: this.server.server });
    this.config = { port, host };
    this.connectionIds = new WeakMap();
    this.players = {};

    this.routeStatic();
  }

  private routeStatic() {
    this.router.routeStaticFile("/", "../client/index.html");
    this.router.routeStaticFile("/index.css", "../client/index.css");
    this.router.routeStaticDirectory("/build/", "../client/build/");
  }

  private initializePlayer(id: string, x: number, y: number): void {
    // initialize other players on current client
  }

  public listen() {
    this.socket.on("connection", (connection, request) => {
      if (!this.connectionIds.has(connection)) {
        this.connectionIds.set(connection, uuidv4());
      }

      connection.on("message", (message) => {
        const data = JSON.parse(String(message));
        const connectionId = this.connectionIds.get(connection) as string;

        if (data.kind === "initialize") {
          // console.log("initialize", data);

          for (const [id, location] of Object.entries(this.players)) {
            connection.send(JSON.stringify({ kind: "add", id, ...location }));
          }

          this.players[connectionId] = { x: data.x, y: data.y };

          const response = JSON.stringify({
            kind: "add",
            id: connectionId,
            ...this.players[connectionId],
          });

          for (const client of this.socket.clients.values()) {
            if (client !== connection) {
              client.send(response);
            }
          }
        } else if (data.kind === "move") {
          // console.log("move", data);

          this.players[connectionId] = { x: data.x, y: data.y };

          const response = JSON.stringify({
            kind: "move",
            id: connectionId,
            ...this.players[connectionId],
          });

          for (const client of this.socket.clients.values()) {
            if (client !== connection) {
              client.send(response);
            }
          }
        } else if (data.kind === "remove") {
          // console.log("remove", data);

          const response = JSON.stringify({ kind: "remove", id: connectionId });

          for (const client of this.socket.clients.values()) {
            if (client !== connection) {
              client.send(response);
            }
          }

          delete this.players[connectionId];
          this.connectionIds.delete(connection);
        }
      });
    });

    this.server.use(async (request, response) =>
      this.router.handle(request, response)
    );
    this.server.use(async (request, response) => {
      response.writeHead(404);
      response.end("404 Not Found");
    });

    this.server.listen(8000);
  }
}

const dotzz = new DotZZ();
dotzz.listen();
