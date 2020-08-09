export { Route, Router };

import { Handler } from "server/server";

import fs from "fs/promises";
import http from "http";
import mime from "mime";
import path from "path";

interface Route {
  children: Record<string, Route>;
  handler?: Handler;
}

interface StaticCache {
  buffer: Buffer;
  mimeType: string;
}

class Router {
  private tree: Route;
  private staticCache: Record<string, StaticCache>;

  public constructor() {
    this.tree = { children: {} };
    this.staticCache = {};
  }

  public route(route: string, handler: Handler): void {
    // build tree from parts of the route excluding empty parts
    const parts = route.split("/").filter((x) => x !== "");

    // set current section to root of the tree
    let current = this.tree;

    for (const part of parts) {
      // create new child of current section if needed
      if (typeof current.children[part] === "undefined") {
        current.children[part] = { children: {} };
      }

      // current child is now current section
      current = current.children[part];
    }

    // add handler to current section
    current.handler = handler;
  }

  public async routeStaticDirectory(
    route: string,
    filePath: string
  ): Promise<void> {
    // iterate through all items in directory
    for (const file of await fs.readdir(filePath)) {
      // find path of the current file based on routed path
      const currentPath = `${filePath}${path.sep}${file}`;

      if ((await fs.lstat(currentPath)).isDirectory()) {
        // recursively route directories
        this.routeStaticDirectory(route, currentPath);
      } else {
        // route as a file otherwise
        this.routeStaticFile(
          `${route}/${file.replace("\\", "/")}`,
          currentPath
        );
      }
    }
  }

  public async routeStaticFile(route: string, filePath: string): Promise<void> {
    // create new route for current file
    this.route(route, async (request, response) => {
      // try to find cached file and mime type
      let cached = this.staticCache[filePath];

      if (typeof cached === "undefined") {
        // read file and find mime type if cache does not exist
        cached = {
          buffer: await fs.readFile(filePath),
          mimeType: mime.getType(filePath) ?? "text/plain",
        };
      }

      // write mime type and status to header
      response.setHeader("Content-Type", cached.mimeType);
      response.writeHead(200);

      // end response with file buffer
      response.end(cached.buffer);
    });
  }

  public async handle(
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): Promise<void> {
    if (typeof request.url === "undefined") {
      return;
    }

    // parse path of url if url is available
    const parts = new URL(`https://hostname/${request.url}`).pathname
      .split("/")
      .filter((x) => x !== "");

    // start at the root of the tree
    let current = this.tree;

    for (const part of parts) {
      // descend down into the next section
      const next = current.children[part];

      // stop and exit if next section is missing
      if (typeof next === "undefined") {
        return;
      }

      // current becomes the current section
      current = next;
    }

    // handle the route if a handler exists for it
    if (typeof current.handler !== "undefined") {
      await current.handler(request, response);
    }
  }
}
