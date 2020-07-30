import { Router } from "./router.js";
import { Server } from "./server.js";

const server = new Server();
const router = new Router();

router.route("/", async (request, response) => response.end("Hello, world!"));

server.use(async (request, response) => router.handle(request, response));
server.use(async (request, response) => response.end("404 Not Found"));

server.listen(8000);
