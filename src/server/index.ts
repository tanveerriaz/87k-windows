import { createServer } from "node:http";
import { Server } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "../shared/events";
import { ProviderSchema, StoryCapsuleSchema } from "../shared/schemas";
import { createApp, defaultDependencies } from "./app";
import { readEnv } from "./env";
import { StoryMatcher } from "./matching/matcher";
import { RoomStore } from "./rooms";

const env = readEnv();
const dependencies = defaultDependencies(env);
const app = createApp(dependencies);
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: env.NODE_ENV === "development" ? { origin: "http://127.0.0.1:5173" } : undefined,
  maxHttpBufferSize: env.MAX_UPLOAD_BYTES,
});
const rooms = new RoomStore(env.ROOM_TTL_MINUTES, new StoryMatcher(undefined, env.MATCH_THRESHOLD), env.INFERENCE_PROVIDER);

io.on("connection", (socket) => {
  socket.on("room:join", (payload, ack) => {
    const roomCode = payload.roomCode.trim().toLowerCase();
    socket.data.roomCode = roomCode;
    socket.data.role = payload.role;
    void socket.join(roomCode);
    const snapshot = rooms.get(roomCode);
    ack(snapshot);
    socket.emit("room:snapshot", snapshot);
  });

  socket.on("story:submitted", (payload, ack) => {
    rooms.markSubmitted(payload.roomCode);
    io.to(payload.roomCode).emit("story:submitted", { participantId: payload.participantId });
    io.to(payload.roomCode).emit("room:snapshot", rooms.get(payload.roomCode));
    ack?.({ ok: true });
  });

  socket.on("capsule:approved", (payload, ack) => {
    const parsed = StoryCapsuleSchema.safeParse(payload.capsule);
    if (!parsed.success) {
      ack?.({ ok: false, message: "The safe capsule could not be validated." });
      return;
    }
    ack?.({ ok: true });
    void rooms.approve(io, payload.roomCode, payload.participantId, parsed.data).catch(() => {
      const message = "The room could not finish matching. Try the prepared story again.";
      rooms.setLastError(payload.roomCode, message);
      io.to(payload.roomCode).emit("room:error", { message });
      io.to(payload.roomCode).emit("room:snapshot", rooms.get(payload.roomCode));
    });
  });

  socket.on("demo:reset", (payload, ack) => {
    const snapshot = rooms.reset(payload.roomCode);
    io.to(payload.roomCode).emit("demo:reset", snapshot);
    io.to(payload.roomCode).emit("room:snapshot", snapshot);
    ack?.({ ok: true });
  });

  socket.on("demo:inject", (payload, ack) => {
    ack?.({ ok: true });
    void rooms.inject(io, payload.roomCode).catch(() => {
      const message = "The prepared story could not be injected. Reset the room and try again.";
      rooms.setLastError(payload.roomCode, message);
      io.to(payload.roomCode).emit("room:error", { message });
    });
  });

  socket.on("provider:changed", (payload, ack) => {
    const parsed = ProviderSchema.safeParse(payload.provider);
    if (!parsed.success) {
      ack?.({ ok: false, message: "Unknown provider." });
      return;
    }
    const result = rooms.providerRequest(payload.roomCode, parsed.data);
    io.to(payload.roomCode).emit("provider:changed", {
      provider: result.snapshot.provider,
      requested: parsed.data,
      available: result.available,
      message: result.message,
    });
    io.to(payload.roomCode).emit("room:snapshot", result.snapshot);
    ack?.({ ok: result.available, message: result.message });
  });
});

httpServer.listen(env.PORT, "0.0.0.0", () => {
  console.info(`87K Windows server listening on http://0.0.0.0:${env.PORT} in ${env.INFERENCE_PROVIDER} mode`);
});
