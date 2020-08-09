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

    // add event listener for server request
    this.server.on("request", (request, response) =>
      this.handle(request, response)
    );
  }

  private async handle(
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): Promise<void> {
    // go through all request handlers
    for (const handler of this.handlers) {
      // wait for the handler to finish
      await handler(request, response);

      // stop if the handler succeeded
      if (response.writableEnded) {
        break;
      }
    }
  }

  public use(handler: Handler): void {
    // add new handlers sequentially
    this.handlers.push(handler);
  }

  public listen(port: number, host: string = "localhost"): void {
    // run the server event loop
    this.server.listen(port, host);
  }
}
