import { Config, defaultConfig } from "shared/config";
import { move as movePlayer, restrict as restrictPlayer } from "shared/player";
import { Arena } from "server/arena";
import { circleCollided, randint } from "server/utilities";
import { Movement, grow } from "shared/player";
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
      // check all food
      this.eatFood();

      for (const player of Object.values(this.arena.players)) {
        // move the player based on velocity and directions
        movePlayer(player);
        // make sure the player is restricted in arena
        restrictPlayer(player);
      }

      // generate as much food as needed
      this.generateFood();
    }, this.config.frameRate);

    // route all static resources
    this.routeStatic();
  }

  private generateFood(): void {
    // find the difference between the maximum amount of food and current food
    const amount = this.config.food - Object.keys(this.arena.food).length;

    for (let index = 0; index < amount; index++) {
      // randomly generate location for food
      const x = randint(0, this.config.width);
      const y = randint(0, this.config.height);
      // create food in arena
      const id = this.arena.createFood(x, y);

      // send message to add food to all clients
      this.sendToAll(JSON.stringify({ kind: "addFood", x, y, id }));
    }
  }

  private eatFood(): void {
    // iterate through all players
    for (const [playerId, player] of Object.entries(this.arena.players)) {
      // iterate through all food
      for (const [foodId, food] of Object.entries(this.arena.food)) {
        // check for collision between food and player
        const collided = circleCollided(
          { x: player.x, y: player.y, radius: player.size },
          { x: food.x, y: food.y, radius: this.config.foodSize }
        );

        if (collided) {
          // remove the food on a collision
          this.arena.removeFood(foodId);

          // increment the player size by growth if not at max
          grow(player, this.config.growth);

          // increment the player score
          player.score++;

          // remove the food from all clients
          this.sendToAll(JSON.stringify({ kind: "removeFood", id: foodId }));
          // resize the current player on all clients
          this.sendToAll(
            JSON.stringify({ kind: "resizePlayer", id: playerId, size: player.size })
          );
          // increment the current player score on all clients
          this.sendToAll(
            JSON.stringify({
              kind: "scorePlayer",
              id: playerId,
              score: player.score,
            })
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
    for (const [id, data] of Object.entries(this.arena.players)) {
      // make sure the player is not the current connection
      if (id !== connectionId) {
        // send the player data to the connection
        connection.send(JSON.stringify({ kind: "addPlayer", id, ...data }));
      }
    }

    // iterate through all food
    for (const [id, food] of Object.entries(this.arena.food)) {
      // send the food data to the connection
      connection.send(
        JSON.stringify({  kind: "addFood", id, x: food.x, y: food.y })
      );
    }

    // send new player to all existing connections
    this.sendToAll(
      JSON.stringify({
        kind: "addPlayer",
        id: connectionId,
        x,
        y,
        size: this.config.baseSize,
        score: 0,
      })
    );

    // provide the new connection with its id
    connection.send(JSON.stringify({ kind: "initialize", id: connectionId }));
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
        kind: "movePlayer",
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
    this.sendToAll(JSON.stringify({ kind: "removePlayer", id: connectionId }));
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

        if (data.kind === "movePlayer") {
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
