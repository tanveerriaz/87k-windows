import { createServer } from "node:http";
import { Server } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "../shared/events";
import { createApp, defaultDependencies } from "./app";
import { readEnv } from "./env";
import { StoryMatcher } from "./matching/matcher";
import { RoomStore } from "./rooms";
import { registerSocketHandlers } from "./socket-handlers";

const env = readEnv();

process.on("uncaughtException", (error) => console.error("uncaught exception", error));
process.on("unhandledRejection", (reason) => console.error("unhandled rejection", reason));

const dependencies = defaultDependencies(env);
const rooms = new RoomStore(
  env.ROOM_TTL_MINUTES,
  new StoryMatcher(undefined, env.MATCH_THRESHOLD),
  dependencies.provider,
  env.INFERENCE_PROVIDER,
  dependencies.facilitator,
);
const app = createApp({ ...dependencies, rooms });
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: env.NODE_ENV === "development" ? { origin: "http://127.0.0.1:5173" } : undefined,
  maxHttpBufferSize: env.MAX_UPLOAD_BYTES,
});

registerSocketHandlers(io, rooms, { adminSecret: env.DEMO_ADMIN_SECRET });

httpServer.listen(env.PORT, "0.0.0.0", () => {
  console.info(`87K Windows server listening on http://0.0.0.0:${env.PORT} with ${env.INFERENCE_PROVIDER} inference and ${env.GEMINI_FACILITATOR} facilitation`);
});
