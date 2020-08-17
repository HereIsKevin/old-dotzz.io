import { Movement, Player, move, restrict } from "shared/sprites";
import { collided, contained, randint } from "server/utilities";
import { Arena } from "server/arena";
import { Router } from "server/router";
import { Server } from "server/server";
import WebSocket from "ws";
import { defaultConfig as config } from "shared/config";

class DotZZ {
  private server: Server;
  private router: Router;
  private socket: WebSocket.Server;
  private arena: Arena;
  private connectionIds: WeakMap<WebSocket, string>;

  public constructor() {
    this.server = new Server();
    this.router = new Router();
    this.socket = new WebSocket.Server({ server: this.server.server });

    this.arena = new Arena();
    this.connectionIds = new WeakMap();

    global.setInterval(() => {
      for (const [id, player] of Object.entries(this.arena.players)) {
        if (player === undefined) {
          delete this.arena.players[id];
        } else {
          this.eatFood(id, player);
        }
      }

      let index = 0;

      while (index < Object.keys(this.arena.players).length) {
        const id = Object.keys(this.arena.players)[index];
        const player = this.arena.players[id];

        if (player === undefined) {
          delete this.arena.players[id];
        } else {
          this.eatPlayers(id, player);
          index++;
        }
      }

      for (const player of Object.values(this.arena.players)) {
        if (player !== undefined) {
          move(player);
          restrict(player);
        }
      }

      this.generateFood();
    }, config.frameRate);

    this.routeStatic();
  }

  private generateFood(): void {
    const amount = config.food - Object.keys(this.arena.food).length;

    for (let index = 0; index < amount; index++) {
      const x = randint(0, config.width + 1);
      const y = randint(0, config.height + 1);
      const id = this.arena.addFood(x, y);

      this.sendToAll({ kind: "addFood", id, food: this.arena.food[id] });
    }
  }

  private eatFood(playerId: string, player: Player): void {
    let index = 0;

    while (index < Object.keys(this.arena.food).length) {
      const foodId = Object.keys(this.arena.food)[index];
      const food = this.arena.food[foodId];

      if (food === undefined) {
        delete this.arena.food[foodId];
      } else if (collided(player, food)) {
        this.arena.removeFood(foodId);
        this.arena.massPlayer(playerId, food.mass);
        this.arena.scorePlayer(playerId, food.mass);

        this.sendToAll({ kind: "removeFood", id: foodId });
        this.sendToAll({
          kind: "massPlayer",
          id: playerId,
          mass: player.mass,
        });
        this.sendToAll({
          kind: "scorePlayer",
          id: playerId,
          score: player.score,
        });
      } else {
        index++;
      }
    }
  }

  private eatPlayers(id: string, player: Player): void {
    let index = 0;

    while (index < Object.keys(this.arena.players).length) {
      const spriteId = Object.keys(this.arena.players)[index];
      const sprite = this.arena.players[spriteId];

      if (sprite === undefined) {
        delete this.arena.players[spriteId];
      } else if (player !== sprite && contained(player, sprite)) {
        this.arena.removePlayer(spriteId);
        this.arena.massPlayer(id, sprite.mass);
        this.arena.scorePlayer(id, sprite.mass);

        this.sendToAll({ kind: "removePlayer", id: spriteId });
        this.sendToAll({
          kind: "massPlayer",
          id: id,
          mass: player.mass,
        });
        this.sendToAll({
          kind: "scorePlayer",
          id: id,
          score: player.score,
        });
      } else {
        index++;
      }
    }
  }

  private routeStatic(): void {
    this.router.routeStaticFile("/", "../client/index.html");
    this.router.routeStaticFile("/index.css", "../client/index.css");
    this.router.routeStaticDirectory("/dist/", "../client/dist/");
  }

  private sendToAll(message: unknown): void {
    const stringified = JSON.stringify(message);

    for (const client of this.socket.clients) {
      client.send(stringified);
    }
  }

  private initializePlayer(connection: WebSocket, name: string): void {
    const x = randint(0, config.width);
    const y = randint(0, config.height);

    const connectionId = this.arena.addPlayer(name, x, y);
    this.connectionIds.set(connection, connectionId);

    for (const [id, data] of Object.entries(this.arena.players)) {
      if (id !== connectionId) {
        connection.send(
          JSON.stringify({ kind: "addPlayer", id, player: data })
        );
      }
    }

    for (const [id, food] of Object.entries(this.arena.food)) {
      connection.send(JSON.stringify({ kind: "addFood", id, food }));
    }

    this.sendToAll({
      kind: "addPlayer",
      id: connectionId,
      player: this.arena.players[connectionId],
    });

    connection.send(JSON.stringify({ kind: "initialize", id: connectionId }));
  }

  private movePlayer(connection: WebSocket, message: Movement): void {
    const connectionId = this.connectionIds.get(connection);

    if (connectionId === undefined) {
      return;
    }

    const player = this.arena.players[connectionId];

    if (player === undefined) {
      return;
    }

    this.arena.movePlayer(connectionId, message);
    this.sendToAll({
      kind: "movePlayer",
      id: connectionId,
      movement: message,
      velocityX: player.velocityX,
      velocityY: player.velocityY,
      x: player.x,
      y: player.y,
    });
  }

  private removePlayer(connection: WebSocket): void {
    const connectionId = this.connectionIds.get(connection);

    if (connectionId === undefined) {
      return;
    }

    this.sendToAll({ kind: "removePlayer", id: connectionId });
    this.arena.removePlayer(connectionId);
    this.connectionIds.delete(connection);
  }

  public listen(): void {
    this.socket.on("connection", (connection) => {
      connection.on("close", () => {
        this.removePlayer(connection);
      });

      connection.on("message", (message) => {
        const data = JSON.parse(String(message));

        if (data.kind === "initialize" && !this.connectionIds.has(connection)) {
          this.initializePlayer(
            connection,
            data.name.trim() === "" ? "unknown" : data.name.trim()
          );
        } else if (data.kind === "movePlayer") {
          this.movePlayer(connection, data.movement);
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

    this.server.listen(config.port, config.host);
  }
}

const dotzz = new DotZZ();
dotzz.listen();
