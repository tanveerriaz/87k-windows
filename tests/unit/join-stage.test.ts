import { describe, expect, it } from "vitest";
import type { RoomSnapshot } from "../../src/shared/schemas";
import { resolveJoinDisplacement } from "../../src/client/lib/join-stage";

function snapshot(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    roomCode: "demo87",
    provider: "gemma-api",
    facilitator: "gemini",
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
    updatedAt: "2026-08-23T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveJoinDisplacement", () => {
  it("keeps a listener on the honest no-match result instead of the storyteller capture form", () => {
    expect(resolveJoinDisplacement({
      stage: "result",
      listenerEntry: true,
      participantId: "listener",
      snapshot: snapshot({
        phase: "no-match",
        activeSourceId: "storyteller",
        activeCandidateId: "listener",
      }),
    })).toBeNull();
  });

  it("moves a listening request with weak evidence to the no-match result", () => {
    expect(resolveJoinDisplacement({
      stage: "listen-requested",
      listenerEntry: true,
      participantId: "listener",
      snapshot: snapshot({
        phase: "no-match",
        activeSourceId: "storyteller",
        activeCandidateId: "listener",
      }),
    })).toEqual({ stage: "result", error: null });
  });

  it("does not treat a missing snapshot as the room having moved", () => {
    expect(resolveJoinDisplacement({
      stage: "result",
      listenerEntry: true,
      participantId: "listener",
      snapshot: null,
    })).toBeNull();
  });

  it("returns a storyteller to capture only after a later story replaces their result", () => {
    const next = resolveJoinDisplacement({
      stage: "result",
      listenerEntry: false,
      participantId: "previous-source",
      snapshot: snapshot({
        phase: "matching",
        activeSourceId: "new-source",
        activeCandidateId: null,
      }),
    });
    expect(next).toMatchObject({ stage: "capture" });
    expect(next?.error).toContain("moved to another story");
  });

  it("returns a displaced listener to the listening profile, not the storyteller form", () => {
    const next = resolveJoinDisplacement({
      stage: "result",
      listenerEntry: true,
      participantId: "listener",
      snapshot: snapshot({
        phase: "matching",
        activeSourceId: "new-source",
        activeCandidateId: null,
      }),
    });
    expect(next).toMatchObject({ stage: "listen-profile" });
    expect(next?.error).toContain("moved to another story");
  });

  it("shows the storyteller their own no-match instead of calling it displacement", () => {
    expect(resolveJoinDisplacement({
      stage: "waiting",
      listenerEntry: false,
      participantId: "storyteller",
      snapshot: snapshot({
        phase: "no-match",
        activeSourceId: "storyteller",
        activeCandidateId: "listener",
      }),
    })).toEqual({ stage: "result", error: null });
  });

  it("shows the second person their own no-match instead of sending them back to capture", () => {
    expect(resolveJoinDisplacement({
      stage: "waiting",
      listenerEntry: false,
      participantId: "listener",
      snapshot: snapshot({
        phase: "no-match",
        activeSourceId: "storyteller",
        activeCandidateId: "listener",
      }),
    })).toEqual({ stage: "result", error: null });
  });
});
