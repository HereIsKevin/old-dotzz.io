export { Route, Router };

import * as http from "http";
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

  public route(path: string, handler: Handler) {
    const parts = path.split("/").filter((x) => x !== "");

    let current = this.tree;

    for (const part of parts) {
      if (typeof current.children[part] === "undefined") {
        current.children[part] = { children: {} };
      }

      current = current.children[part];
    }

    current.handler = handler;
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
