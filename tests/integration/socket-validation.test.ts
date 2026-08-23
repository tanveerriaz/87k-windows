import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { Server } from "socket.io";
import { io as clientIo, type Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerSocketHandlers } from "../../src/server/socket-handlers";
import { RoomStore } from "../../src/server/rooms";
import { StoryMatcher } from "../../src/server/matching/matcher";
import { MockProvider } from "../../src/server/inference/mock-provider";
import { DisabledFacilitator } from "../../src/server/facilitation/provider";

describe("socket payload validation", () => {
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let client: Socket;

  beforeAll(async () => {
    httpServer = createServer();
    const io = new Server(httpServer);
    const rooms = new RoomStore(120, new StoryMatcher(undefined, 0.62), new MockProvider(), "mock", new DisabledFacilitator());
    registerSocketHandlers(io, rooms);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    client?.disconnect();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it("rejects a room:join with no roomCode instead of crashing", async () => {
    client = clientIo(url, { transports: ["websocket"] });
    const ack = await new Promise((resolve) => {
      client.emit("room:join", {}, (result: unknown) => resolve(result));
    });
    expect(ack).toMatchObject({ ok: false });
    // The server is still alive: a valid join still works.
    const snapshot = await new Promise((resolve) => {
      client.emit("room:join", { roomCode: "demo87", role: "join" }, (result: unknown) => resolve(result));
    });
    expect(snapshot).toMatchObject({ ok: true });
  });

  it("rejects an oversized roomCode", async () => {
    const ack = await new Promise((resolve) => {
      client.emit("room:join", { roomCode: "x".repeat(10_000), role: "join" }, (r: unknown) => resolve(r));
    });
    expect(ack).toMatchObject({ ok: false });
  });
});
