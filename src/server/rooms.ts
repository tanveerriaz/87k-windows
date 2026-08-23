import { randomUUID } from "node:crypto";
import type { Server } from "socket.io";
import { PREPARED_RADIO_MEMORY } from "../shared/demo";
import { RoomSnapshotSchema, type ConsentDecision, type LitWindow, type Provider, type RoomSnapshot, type StoryCapsule } from "../shared/schemas";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "../shared/events";
import {
  DisabledFacilitator,
  FacilitationUnavailableError,
  type ConnectionFacilitator,
} from "./facilitation/provider";
import type { InferenceProvider } from "./inference/provider";
import type { StoryMatcher } from "./matching/matcher";

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

type RoomRecord = RoomSnapshot & { expiresAt: number };

function providerName(provider: Provider): string {
  if (provider === "ollama") return "Local";
  if (provider === "gemma-api") return "Cloud";
  if (provider === "openrouter") return "OpenRouter";
  return "Mock";
}

export class RoomStore {
  private readonly rooms = new Map<string, RoomRecord>();
  private readonly capsules = new Map<string, Map<string, StoryCapsule>>();
  private readonly mintedCapsules = new Map<string, { capsule: StoryCapsule; expiresAt: number }>();

  constructor(
    private readonly ttlMinutes: number,
    private readonly matcher: StoryMatcher,
    private readonly inferenceProvider: InferenceProvider,
    private readonly initialProvider: Provider = "mock",
    private readonly facilitator: ConnectionFacilitator = new DisabledFacilitator(),
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
      facilitator: this.facilitator.mode,
      phase: "idle",
      windows: [],
      activeSourceId: null,
      activeCandidateId: null,
      connectionConsent: null,
      match: null,
      invite: null,
      guide: null,
      guideError: null,
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
    this.capsules.delete(roomCode);
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
    const activeName = providerName(this.initialProvider);
    room.lastError = available ? null : `${providerName(requested)} Mode is not active in this process. ${activeName} Mode is still active.`;
    room.updatedAt = new Date().toISOString();
    return {
      snapshot: RoomSnapshotSchema.parse(room),
      available,
      message: available ? `${activeName} Mode is active.` : (room.lastError ?? "That provider is not available."),
    };
  }

  registerCapsule(capsule: StoryCapsule): string {
    this.deleteExpiredCapsules();
    const id = randomUUID();
    this.mintedCapsules.set(id, { capsule, expiresAt: Date.now() + this.ttlMinutes * 60_000 });
    return id;
  }

  takeCapsule(capsuleId: string): StoryCapsule | undefined {
    const entry = this.mintedCapsules.get(capsuleId);
    this.mintedCapsules.delete(capsuleId);
    if (!entry || entry.expiresAt <= Date.now()) return undefined;
    return entry.capsule;
  }

  async approve(io: TypedServer, roomCode: string, participantId: string, capsuleId: string): Promise<void> {
    const capsule = this.takeCapsule(capsuleId);
    const room = this.mutable(roomCode);
    if (!capsule) {
      room.lastError = "That story could not be verified. Please share it again.";
      room.updatedAt = new Date().toISOString();
      io.to(roomCode).emit("room:error", { message: room.lastError });
      io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));
      return;
    }
    const roomCapsules = this.capsules.get(roomCode) ?? new Map<string, StoryCapsule>();
    if (!roomCapsules.has(participantId) && roomCapsules.size >= 2) {
      room.lastError = "This room already has two participants. Start a new room for another conversation.";
      room.updatedAt = new Date().toISOString();
      io.to(roomCode).emit("room:error", { message: room.lastError });
      io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));
      return;
    }
    roomCapsules.set(participantId, capsule);
    this.capsules.set(roomCode, roomCapsules);
    const sourceWindow: LitWindow = {
      participantId,
      windowId: room.windows.find((window) => window.participantId === participantId)?.windowId
        ?? (room.windows.length === 0 ? 27 : 64 + room.windows.length - 1),
      colour: "amber",
      safeSummary: capsule.safeSummary,
    };
    room.windows = [...room.windows.filter((window) => window.participantId !== participantId), sourceWindow];
    const otherParticipant = [...roomCapsules.entries()].find(([id]) => id !== participantId);
    room.activeSourceId = otherParticipant?.[0] ?? participantId;
    room.activeCandidateId = null;
    room.phase = "matching";
    room.match = null;
    room.connectionConsent = null;
    room.invite = null;
    room.guide = null;
    room.guideError = null;
    room.lastError = null;
    room.updatedAt = new Date().toISOString();

    io.to(roomCode).emit("capsule:approved", { participantId });
    io.to(roomCode).emit("window:lit", sourceWindow);
    io.to(roomCode).emit("match:started", { participantId });
    io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));

    if (!otherParticipant) return;

    await new Promise((resolve) => setTimeout(resolve, 700));
    if (this.rooms.get(roomCode) !== room || !roomCapsules.has(participantId)) return;
    const [sourceParticipantId, sourceCapsule] = otherParticipant;
    const result = this.matcher.matchPair(sourceCapsule, capsule, sourceParticipantId, participantId);
    room.match = result;
    room.updatedAt = new Date().toISOString();

    if (result.decision === "NO_MATCH") {
      room.phase = "no-match";
      io.to(roomCode).emit("match:none", result);
      io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));
      return;
    }

    room.activeSourceId = sourceParticipantId;
    room.activeCandidateId = participantId;
    room.connectionConsent = {
      sourceParticipantId,
      candidateParticipantId: participantId,
      sourceDecision: "pending",
      candidateDecision: "pending",
      mutualYes: false,
    };
    room.phase = "matching";
    io.to(roomCode).emit("match:found", result);
    io.to(roomCode).emit("consent:requested", { sourceParticipantId, candidateParticipantId: participantId, match: result });
    io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));

    if (this.facilitator.mode !== "disabled") {
      void this.facilitator.createGuide({ source: sourceCapsule, candidate: capsule, match: result })
        .then((guide) => {
          if (this.rooms.get(roomCode) !== room) return;
          room.guide = guide;
          room.updatedAt = new Date().toISOString();
          io.to(roomCode).emit("guide:ready", guide);
          io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));
        })
        .catch((error) => {
          if (this.rooms.get(roomCode) !== room) return;
          room.guideError = error instanceof FacilitationUnavailableError
            ? error.message
            : "Gemini could not prepare the conversation guide. The evidence-backed match is still available.";
          io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));
        });
    }
  }

  decide(io: TypedServer, roomCode: string, participantId: string, decision: Exclude<ConsentDecision, "pending">): { ok: boolean; message?: string } {
    const room = this.mutable(roomCode);
    const consent = room.connectionConsent;
    if (!consent || (participantId !== consent.sourceParticipantId && participantId !== consent.candidateParticipantId)) {
      return { ok: false, message: "There is no consent request for this participant." };
    }
    if (participantId === consent.sourceParticipantId) consent.sourceDecision = decision;
    else consent.candidateDecision = decision;
    consent.mutualYes = consent.sourceDecision === "yes" && consent.candidateDecision === "yes";
    room.updatedAt = new Date().toISOString();

    if (consent.sourceDecision === "no" || consent.candidateDecision === "no") {
      room.phase = "no-match";
      room.invite = null;
      room.guide = null;
      room.guideError = null;
      room.match = room.match ? { ...room.match, invitation: null, scene: null } : null;
      room.lastError = "The proposed conversation did not receive two yes decisions. Nothing was connected.";
    } else if (consent.mutualYes && room.match) {
      room.phase = "matched";
      room.invite = {
        title: "You both said yes.",
        invitation: room.match.invitation ?? "Listen and continue the story together?",
        activity: "A gentle conversation can begin. Either person may pause or stop at any time.",
        roomCode,
      };
      room.lastError = null;
      io.to(roomCode).emit("bridge:animate", room.match);
      io.to(roomCode).emit("invite:ready", room.invite);
      if (room.guide) io.to(roomCode).emit("guide:ready", room.guide);
    }
    io.to(roomCode).emit("consent:updated", room.connectionConsent);
    io.to(roomCode).emit("room:snapshot", RoomSnapshotSchema.parse(room));
    return { ok: true };
  }

  async inject(io: TypedServer, roomCode: string): Promise<void> {
    const capsule = await this.inferenceProvider.extract({
      memory: PREPARED_RADIO_MEMORY,
      fixture: "radio",
    });
    const capsuleId = this.registerCapsule(capsule);
    await this.approve(io, roomCode, "presenter-demo", capsuleId);
  }

  private deleteExpired(): void {
    const now = Date.now();
    for (const [roomCode, room] of this.rooms) {
      if (room.expiresAt <= now) {
        this.rooms.delete(roomCode);
        this.capsules.delete(roomCode);
      }
    }
  }

  private deleteExpiredCapsules(): void {
    const now = Date.now();
    for (const [id, entry] of this.mintedCapsules) {
      if (entry.expiresAt <= now) this.mintedCapsules.delete(id);
    }
  }
}
