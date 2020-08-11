import { Config, defaultConfig } from "shared/config";
import { move as movePlayer, restrict as restrictPlayer } from "shared/player";
import { Arena } from "server/arena";
import { circleCollided, randint } from "server/utilities";
import { Movement } from "shared/player";
import { Router } from "server/router";
import { Server } from "server/server";

import WebSocket from "ws";

class DotZZ {
  private server: Server;
  private router: Router;
  private socket: WebSocket.Server;
  private arena: Arena;
  private config: Config;
  private connectionIds: WeakMap<WebSocket, string>;

  public constructor(config: Config = defaultConfig) {
    // initialize server
    this.server = new Server();
    // initialize router
    this.router = new Router();
    // initialize websocket server
    this.socket = new WebSocket.Server({ server: this.server.server });

    // create a new arena
    this.arena = new Arena();

    // merge configurations
    this.config = { ...defaultConfig, ...config };
    // initialize WeakMap of connections and ids
    this.connectionIds = new WeakMap();

    // execute tasks at every frame
    global.setInterval(() => {
      this.eatFood();

      for (const player of Object.values(this.arena.players)) {
        // move the player based on velocity and directions
        movePlayer(player);
        // make sure the player is restricted in arena
        restrictPlayer(player);
      }

      if (Object.keys(this.arena.food).length < this.config.maxFood) {
        this.generateFood();
      }
    }, this.config.frameRate);

    // route all static resources
    this.routeStatic();
  }

  private generateFood(): void {
    for (let index = 0; index < this.config.foodIncrease; index++) {
      const x = randint(0, this.config.width);
      const y = randint(0, this.config.height);
      const id = this.arena.createFood(x, y);

      this.sendToAll(JSON.stringify({ kind: "addFood", x, y, id }));
    }
  }

  private eatFood(): void {
    for (const [playerId, player] of Object.entries(this.arena.players)) {
      for (const [foodId, food] of Object.entries(this.arena.food)) {
        const collided = circleCollided(
          { x: player.x, y: player.y, radius: player.size },
          { x: food.x, y: food.y, radius: this.config.foodSize }
        );

        if (collided) {
          this.arena.removeFood(foodId);
          player.size = Math.min(this.config.maxSize, player.size + 1);

          this.sendToAll(JSON.stringify({ kind: "removeFood", id: foodId }));

          this.sendToAll(
            JSON.stringify({ kind: "resize", id: playerId, size: player.size })
          );
        }
      }
    }
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
    // generate random location for player
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

    for (const [id, food] of Object.entries(this.arena.food)) {
      connection.send(
        JSON.stringify({ kind: "addFood", id, x: food.x, y: food.y })
      );
    }

    // send new player to all existing connections
    this.sendToAll(
      JSON.stringify({
        kind: "add",
        id: connectionId,
        x,
        y,
      })
    );

    // provide the new connection with its id
    connection.send(JSON.stringify({ kind: "id", id: connectionId }));
  }

  private movePlayer(connection: WebSocket, message: Movement): void {
    // find the connection id with the WeakMap
    const connectionId = this.connectionIds.get(connection);

    // do not move unassigned players
    if (typeof connectionId === "undefined") {
      return;
    }

    // move player
    this.arena.movePlayer(connectionId, message);

    // update player location on all clients
    this.sendToAll(
      JSON.stringify({
        kind: "move",
        id: connectionId,
        ...this.arena.players[connectionId],
      })
    );
  }

  private removePlayer(connection: WebSocket): void {
    // find the connection id with the WeakMap
    const connectionId = this.connectionIds.get(connection);

    // do not move unassigned players
    if (typeof connectionId === "undefined") {
      return;
    }

    // send id of the removed player to all clients
    this.sendToAll(JSON.stringify({ kind: "remove", id: connectionId }));
    // remove the player from the arena
    this.arena.removePlayer(connectionId);
    // remove the connection from the WeakMap
    this.connectionIds.delete(connection);
  }

  public listen(): void {
    this.socket.on("connection", (connection) => {
      // initialize current connection is not initialized
      if (!this.connectionIds.has(connection)) {
        this.initializePlayer(connection);
      }

      connection.on("close", () => {
        // remove player on connection close
        this.removePlayer(connection);
      });

      connection.on("message", (message) => {
        const data = JSON.parse(String(message));

        if (data.kind === "move") {
          // move player on a move message
          this.movePlayer(connection, {
            left: data.left,
            right: data.right,
            up: data.up,
            down: data.down,
          });
        }
      });
    });

    // use router middleware in server
    this.server.use(async (request, response) =>
      this.router.handle(request, response)
    );

    // default to 404 not found for all failed connections
    this.server.use(async (request, response) => {
      response.writeHead(404);
      response.end("404 Not Found");
    });

    // make server listen
    this.server.listen(this.config.port, this.config.host);
  }
}

const dotzz = new DotZZ();
dotzz.listen();
