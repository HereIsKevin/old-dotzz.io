import WebSocket from "ws";

import { Arena, Movement } from "./arena.js";
import { Router } from "./router.js";
import { Server } from "./server.js";

interface DotZZConfig {
  port: number;
  host: string;
}

const dotzzConfig = { port: 8000, host: "192.168.1.196" };

function randint(min: number, max: number) {
  const roundedMin = Math.ceil(min);
  const roundedMax = Math.floor(max);

  return Math.floor(Math.random() * (roundedMax - roundedMin)) + roundedMin;
}

class DotZZ {
  private server: Server;
  private router: Router;
  private socket: WebSocket.Server;
  private arena: Arena;
  private config: DotZZConfig;
  private connectionIds: WeakMap<WebSocket, string>;

  public constructor(config: DotZZConfig = dotzzConfig) {
    this.server = new Server();
    this.router = new Router();
    this.socket = new WebSocket.Server({ server: this.server.server });

    this.arena = new Arena();

    this.config = { ...dotzzConfig, ...config };
    this.connectionIds = new WeakMap();

    this.routeStatic();
  }

  private routeStatic(): void {
    this.router.routeStaticFile("/", "../client/index.html");
    this.router.routeStaticFile("/index.css", "../client/index.css");
    this.router.routeStaticDirectory("/dist/", "../client/dist/");
  }

  private sendToAll(message: string): void {
    for (const client of this.socket.clients) {
      client.send(message);
    }
  }

  private initializePlayer(connection: WebSocket): void {
    const x = randint(0, this.arena.config.width);
    const y = randint(0, this.arena.config.height);

    // create a new player and initialize it
    const connectionId = this.arena.addPlayer(x, y);
    this.connectionIds.set(connection, connectionId);

    // iterate through all players
    for (const [id, location] of Object.entries(this.arena.players)) {
      // make sure the player is not the current connection
      if (id !== connectionId) {
        // send the player data to the connection
        connection.send(JSON.stringify({ kind: "add", id, ...location }));
      }
    }

    this.sendToAll(
      JSON.stringify({
        kind: "add",
        id: connectionId,
        x,
        y,
      })
    );

    connection.send(JSON.stringify({ kind: "id", id: connectionId }));
  }

  private movePlayer(connection: WebSocket, message: Movement): void {
    const connectionId = this.connectionIds.get(connection);

    if (typeof connectionId === "undefined") {
      return;
    }

    const player = this.arena.movePlayer(connectionId, message);

    this.sendToAll(
      JSON.stringify({ kind: "move", id: connectionId, ...player })
    );
  }

  private removePlayer(connection: WebSocket): void {
    const connectionId = this.connectionIds.get(connection);

    if (typeof connectionId === "undefined") {
      return;
    }

    this.sendToAll(JSON.stringify({ kind: "remove", id: connectionId }));
    this.arena.removePlayer(connectionId);
    this.connectionIds.delete(connection);
  }

  public listen(): void {
    this.socket.on("connection", (connection) => {
      // current connection has not been initialized
      if (!this.connectionIds.has(connection)) {
        this.initializePlayer(connection);
      }

      connection.on("close", () => {
        this.removePlayer(connection);
      });

      connection.on("message", (message) => {
        const data = JSON.parse(String(message));

        if (data.kind === "move") {
          this.movePlayer(connection, {
            left: data.left,
            right: data.right,
            up: data.up,
            down: data.down,
          });
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

    this.server.listen(this.config.port, this.config.host);
  }
}

const dotzz = new DotZZ();
dotzz.listen();
