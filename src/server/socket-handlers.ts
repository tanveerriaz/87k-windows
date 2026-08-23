import type { ZodType } from "zod";
import {
  CapsuleApprovedPayloadSchema,
  ConsentDecidedPayloadSchema,
  ProviderChangedPayloadSchema,
  ProviderSchema,
  RoomJoinPayloadSchema,
  RoomOnlyPayloadSchema,
  StorySubmittedPayloadSchema,
} from "../shared/schemas";
import type { EventAck, RoomJoinAck } from "../shared/events";
import type { RoomStore, TypedServer } from "./rooms";

function withValidation<T, A extends { ok: boolean }>(
  schema: ZodType<T>,
  handler: (payload: T, ack?: (result: A) => void) => void,
): (rawPayload: unknown, ack?: (result: A) => void) => void {
  return (rawPayload, ack) => {
    const parsed = schema.safeParse(rawPayload);
    if (!parsed.success) {
      ack?.({ ok: false, message: "Invalid request." } as unknown as A);
      return;
    }
    try {
      handler(parsed.data, ack);
    } catch {
      ack?.({ ok: false, message: "The room could not process that action." } as unknown as A);
    }
  };
}

export type SocketHandlerOptions = {
  adminSecret?: string;
};

export function registerSocketHandlers(io: TypedServer, rooms: RoomStore, options: SocketHandlerOptions = {}): void {
  io.on("connection", (socket) => {
    socket.on(
      "room:join",
      withValidation<typeof RoomJoinPayloadSchema._output, RoomJoinAck>(RoomJoinPayloadSchema, (payload, ack) => {
        const roomCode = payload.roomCode.trim().toLowerCase();
        socket.data.roomCode = roomCode;
        socket.data.role = payload.role;
        socket.data.isAdmin = payload.role === "admin" && Boolean(options.adminSecret) && payload.adminSecret === options.adminSecret;
        void socket.join(roomCode);
        const snapshot = rooms.get(roomCode);
        ack?.({ ok: true, snapshot });
        socket.emit("room:snapshot", snapshot);
      }),
    );

    socket.on(
      "story:submitted",
      withValidation<typeof StorySubmittedPayloadSchema._output, EventAck>(StorySubmittedPayloadSchema, (payload, ack) => {
        (socket.data.participantIds ??= new Set()).add(payload.participantId);
        rooms.markSubmitted(payload.roomCode);
        io.to(payload.roomCode).emit("story:submitted", { participantId: payload.participantId });
        io.to(payload.roomCode).emit("room:snapshot", rooms.get(payload.roomCode));
        ack?.({ ok: true });
      }),
    );

    socket.on(
      "capsule:approved",
      withValidation<typeof CapsuleApprovedPayloadSchema._output, EventAck>(CapsuleApprovedPayloadSchema, (payload, ack) => {
        (socket.data.participantIds ??= new Set()).add(payload.participantId);
        ack?.({ ok: true });
        void rooms.approve(io, payload.roomCode, payload.participantId, payload.capsule).catch(() => {
          const message = "The room could not finish matching. Try the prepared story again.";
          rooms.setLastError(payload.roomCode, message);
          io.to(payload.roomCode).emit("room:error", { message });
          io.to(payload.roomCode).emit("room:snapshot", rooms.get(payload.roomCode));
        });
      }),
    );

    socket.on(
      "consent:decided",
      withValidation<typeof ConsentDecidedPayloadSchema._output, EventAck>(ConsentDecidedPayloadSchema, (payload, ack) => {
        if (!socket.data.participantIds?.has(payload.participantId)) {
          ack?.({ ok: false, message: "You can only answer for yourself." });
          return;
        }
        const result = rooms.decide(io, payload.roomCode, payload.participantId, payload.decision);
        ack?.(result);
      }),
    );

    socket.on(
      "demo:reset",
      withValidation<typeof RoomOnlyPayloadSchema._output, EventAck>(RoomOnlyPayloadSchema, (payload, ack) => {
        if (!socket.data.isAdmin) {
          ack?.({ ok: false, message: "Presenter access required." });
          return;
        }
        const snapshot = rooms.reset(payload.roomCode);
        io.to(payload.roomCode).emit("demo:reset", snapshot);
        io.to(payload.roomCode).emit("room:snapshot", snapshot);
        ack?.({ ok: true });
      }),
    );

    socket.on(
      "demo:inject",
      withValidation<typeof RoomOnlyPayloadSchema._output, EventAck>(RoomOnlyPayloadSchema, (payload, ack) => {
        if (!socket.data.isAdmin) {
          ack?.({ ok: false, message: "Presenter access required." });
          return;
        }
        ack?.({ ok: true });
        void rooms.inject(io, payload.roomCode).catch(() => {
          const message = "The prepared story could not be injected. Reset the room and try again.";
          rooms.setLastError(payload.roomCode, message);
          io.to(payload.roomCode).emit("room:error", { message });
        });
      }),
    );

    socket.on(
      "provider:changed",
      withValidation<typeof ProviderChangedPayloadSchema._output, EventAck>(ProviderChangedPayloadSchema, (payload, ack) => {
        if (!socket.data.isAdmin) {
          ack?.({ ok: false, message: "Presenter access required." });
          return;
        }
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
      }),
    );
  });
}
