export { Handler, Server };

import http from "http";

type Handler = (
  request: http.IncomingMessage,
  response: http.ServerResponse
) => void;

class Server {
  public server: http.Server;
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

      if (response.writableEnded) {
        break;
      }
    }
  }

  public use(handler: Handler): void {
    this.handlers.push(handler);
  }

  public listen(port: number, host: string = "localhost"): void {
    this.server.listen(port, host);
  }
}
