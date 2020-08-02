export { Route, Router };

import * as fs from "fs/promises";
import * as http from "http";
import mime from "mime";
import * as path from "path";
import * as url from "url";

import { Handler } from "./server";

interface Route {
  children: Record<string, Route>;
  handler?: Handler;
}

class Router {
  private tree: Route;

  public constructor() {
    this.tree = { children: {} };
  }

  public route(route: string, handler: Handler) {
    const parts = route.split("/").filter((x) => x !== "");

    let current = this.tree;

    for (const part of parts) {
      if (typeof current.children[part] === "undefined") {
        current.children[part] = { children: {} };
      }

      current = current.children[part];
    }

    current.handler = handler;
  }

  public async routeStaticDirectory(route: string, filePath: string) {
    for (const file of await fs.readdir(filePath)) {
      const currentPath = `${filePath}${path.sep}${file}`;

      if ((await fs.lstat(currentPath)).isDirectory()) {
        this.routeStaticDirectory(route, currentPath);
      } else {
        this.routeStaticFile(
          `${route}/${file.replace("\\", "/")}`,
          currentPath
        );
      }
    }
  }

  public async routeStaticFile(route: string, filePath: string) {
    this.route(route, async (request, response) => {
      response.setHeader(
        "Content-Type",
        mime.getType(filePath) ?? "text/plain"
      );
      response.writeHead(200);
      response.end(await fs.readFile(filePath));
    });
  }

  public async handle(
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): Promise<void> {
    if (typeof request.url === "undefined") {
      return;
    }

    const parts = new url.URL(`https://hostname/${request.url}`).pathname
      .split("/")
      .filter((x) => x !== "");

    let current = this.tree;

    for (const part of parts) {
      const next = current.children[part];

      if (typeof next === "undefined") {
        return;
      }

      current = next;
    }

    if (typeof current.handler !== "undefined") {
      await current.handler(request, response);
    }
  }
}
