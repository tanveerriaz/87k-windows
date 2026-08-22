import type { Server } from "socket.io";
import { RoomSnapshotSchema, type LitWindow, type Provider, type RoomSnapshot, type StoryCapsule } from "../shared/schemas";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "../shared/events";
import type { InferenceProvider } from "./inference/provider";
import type { StoryMatcher } from "./matching/matcher";

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

type RoomRecord = RoomSnapshot & { expiresAt: number };

export class RoomStore {
  private readonly rooms = new Map<string, RoomRecord>();

  constructor(
    private readonly ttlMinutes: number,
    private readonly matcher: StoryMatcher,
    private readonly inferenceProvider: InferenceProvider,
    private readonly initialProvider: Provider = "mock",
  ) {}

  get(roomCode: string): RoomSnapshot {
    this.deleteExpired();
    const existing = this.rooms.get(roomCode);
    if (existing) {
      existing.expiresAt = Date.now() + this.ttlMinutes * 60_000;
      return RoomSnapshotSchema.parse(existing);
    }
    const room: RoomRecord = {
      roomCode,
      provider: this.initialProvider,
      phase: "idle",
      windows: [],
      match: null,
      invite: null,
      lastError: null,
      updatedAt: new Date().toISOString(),
      expiresAt: Date.now() + this.ttlMinutes * 60_000,
    };
    this.rooms.set(roomCode, room);
    return RoomSnapshotSchema.parse(room);
  }

  private mutable(roomCode: string): RoomRecord {
    this.get(roomCode);
    return this.rooms.get(roomCode) as RoomRecord;
  }

  reset(roomCode: string): RoomSnapshot {
    this.rooms.delete(roomCode);
    return this.get(roomCode);
  }

  markSubmitted(roomCode: string): RoomSnapshot {
    const room = this.mutable(roomCode);
    room.phase = "reviewing";
    room.updatedAt = new Date().toISOString();
    return RoomSnapshotSchema.parse(room);
  }

  setLastError(roomCode: string, message: string | null): RoomSnapshot {
    const room = this.mutable(roomCode);
    room.lastError = message;
    room.updatedAt = new Date().toISOString();
    return RoomSnapshotSchema.parse(room);
  }

  providerRequest(roomCode: string, requested: Provider): { snapshot: RoomSnapshot; available: boolean; message: string } {
    const room = this.mutable(roomCode);
    const available = requested === this.initialProvider;
    room.provider = this.initialProvider;
    const activeName = this.initialProvider === "ollama" ? "Local" : this.initialProvider === "gemma-api" ? "Cloud" : "Mock";
    room.lastError = available ? null : `${requested === "ollama" ? "Local" : requested === "gemma-api" ? "Cloud" : "Mock"} Mode is not active in this process. ${activeName} Mode is still active.`;
    room.updatedAt = new Date().toISOString();
    return {
      snapshot: RoomSnapshotSchema.parse(room),
      available,
      message: available ? `${activeName} Mode is active.` : (room.lastError ?? "That provider is not available."),
    };
  }

  async approve(io: TypedServer, roomCode: string, participantId: string, capsule: StoryCapsule): Promise<void> {
    const room = this.mutable(roomCode);
    const sourceWindow: LitWindow = {
      participantId,
      windowId: 27,
      colour: "amber",
      safeSummary: capsule.safeSummary,
    };
    room.windows = [...room.windows.filter((window) => window.participantId !== participantId), sourceWindow];
    room.phase = "matching";
    room.match = null;
    room.invite = null;
    room.lastError = null;
    room.updatedAt = new Date().toISOString();

    io.to(roomCode).emit("capsule:ready", { participantId, capsule });
    io.to(roomCode).emit("capsule:approved", { participantId });
    io.to(roomCode).emit("window:lit", sourceWindow);
    io.to(roomCode).emit("match:started", { participantId });
    io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));

    await new Promise((resolve) => setTimeout(resolve, 700));
    const result = this.matcher.match(capsule);
    room.match = result;
    room.updatedAt = new Date().toISOString();

    if (result.decision === "NO_MATCH") {
      room.phase = "no-match";
      io.to(roomCode).emit("match:none", result);
      io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));
      return;
    }

    const candidate = result.candidateId ? this.matcher.getStory(result.candidateId) : undefined;
    const targetWindow: LitWindow = {
      participantId: result.candidateId ?? "prepared-story",
      windowId: result.scene?.toWindow ?? 64,
      colour: result.scene?.colour ?? "amber",
      safeSummary: candidate?.safeSummary ?? "A prepared fictional story.",
    };
    room.windows.push(targetWindow);
    room.phase = "matched";
    room.invite = {
      title: "A small bridge, ready when you are",
      invitation: result.invitation ?? "Kopi and a shared story?",
      activity: "Meet at the community table for 30 minutes. Bring the radio story; tools are optional.",
      roomCode,
    };

    io.to(roomCode).emit("window:lit", targetWindow);
    io.to(roomCode).emit("match:found", result);
    io.to(roomCode).emit("bridge:animate", result);
    io.to(roomCode).emit("invite:ready", room.invite);
    io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));
  }

  async inject(io: TypedServer, roomCode: string): Promise<void> {
    const capsule = await this.inferenceProvider.extract({
      memory: "I used to repair radios around Queenstown in the 1970s.",
      fixture: "radio",
    });
    await this.approve(io, roomCode, "presenter-demo", capsule);
  }

  private deleteExpired(): void {
    const now = Date.now();
    for (const [roomCode, room] of this.rooms) {
      if (room.expiresAt <= now) this.rooms.delete(roomCode);
    }
  }
}
