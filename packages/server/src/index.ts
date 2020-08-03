import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";

import { Arena, Movement } from "./arena.js";
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
  private arena: Arena;
  private config: DotZZConfig;
  private connectionIds: WeakMap<WebSocket, string>;

  public constructor({
    port = 8000,
    host = "localhost",
  }: DotZZConfig = dotzzConfig) {
    this.server = new Server();
    this.router = new Router();
    this.socket = new WebSocket.Server({ server: this.server.server });
    this.arena = new Arena();
    this.config = { port, host };
    this.connectionIds = new WeakMap();

    this.routeStatic();
  }

  private routeStatic(): void {
    this.router.routeStaticFile("/", "../client/index.html");
    this.router.routeStaticFile("/index.css", "../client/index.css");
    this.router.routeStaticDirectory("/build/", "../client/build/");
  }

  private sendToOthers(connecion: WebSocket, message: string): void {
    for (const client of this.socket.clients) {
      if (client !== connecion) {
        client.send(message);
      }
    }
  }

  private sendToAll(message: string): void {
    for (const client of this.socket.clients) {
      client.send(message);
    }
  }

  private initializePlayer(connection: WebSocket): void {
    // create a new player and initialize it
    const connectionId = this.arena.addPlayer(0, 0);
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
      JSON.stringify({ kind: "add", id: connectionId, x: 0, y: 0 })
    );

    connection.send(JSON.stringify({ kind: "id", id: connectionId }));
  }

  private movePlayer(connection: WebSocket, message: Movement): void {
    const connectionId = this.connectionIds.get(connection);

    if (typeof connectionId === "undefined") {
      return;
    }

    const position = this.arena.movePlayer(connectionId, message);

    this.sendToAll(
      JSON.stringify({ kind: "move", id: connectionId, ...position })
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
    this.socket.on("connection", (connection, request) => {
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
