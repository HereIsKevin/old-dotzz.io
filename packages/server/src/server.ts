export { Handler, Server };

import * as http from "http";

type Handler = (
  request: http.IncomingMessage,
  response: http.ServerResponse
) => void;

class Server {
  private server: http.Server;
  private handlers: Handler[];

  public constructor() {
    this.server = new http.Server();
    this.handlers = [];

    this.server.on("request", this.handle.bind(this));
  }

  private async handle(
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): Promise<void> {
    for (const handler of this.handlers) {
      await handler(request, response);

      if (response.finished) {
        break;
      }
    }
  }

  public use(handler: Handler): void {
    this.handlers.push(handler);
  }

  public listen(port: number): void {
    this.server.listen(port);
  }
}
