import { describe, expect, it } from "vitest";
import type { RoomSnapshot } from "../../src/shared/schemas";
import { deriveWallVisualState } from "../../src/client/lib/wall-visual-state";

function snapshot(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    roomCode: "visual87",
    provider: "mock",
    facilitator: "mock",
    phase: "idle",
    windows: [],
    activeSourceId: null,
    activeCandidateId: null,
    match: null,
    invite: null,
    guide: null,
    guideError: null,
    lastError: null,
    updatedAt: "2026-08-22T00:00:00.000Z",
    ...overrides,
  };
}

const sourceWindow = {
  participantId: "source",
  windowId: 27,
  colour: "amber" as const,
  safeSummary: "A fictional approved memory.",
};

const listenerWindow = {
  participantId: "listener",
  windowId: 64,
  colour: "amber" as const,
  safeSummary: "A fictional prepared interest.",
};

describe("deriveWallVisualState", () => {
  it("keeps an empty room dark", () => {
    expect(deriveWallVisualState(null)).toEqual({
      state: "idle",
      litWindowIds: [],
      hasThread: false,
    });
  });

  it("lights only the approved participant window while matching", () => {
    expect(deriveWallVisualState(snapshot({
      phase: "matching",
      windows: [sourceWindow],
      activeSourceId: "source",
    }))).toEqual({
      state: "matching",
      litWindowIds: [27],
      hasThread: false,
    });
  });

  it("lights two windows and draws a thread only for a grounded match", () => {
    expect(deriveWallVisualState(snapshot({
      phase: "matched",
      windows: [sourceWindow, listenerWindow],
      activeSourceId: "source",
      activeCandidateId: "listener",
      match: {
        decision: "MATCH",
        candidateId: "listener",
        confidence: 0.9,
        evidencePath: ["Queenstown", "radio repair"],
        why: "The approved evidence is complementary.",
        invitation: "Share a radio story.",
        scene: { fromWindow: 27, toWindow: 64, colour: "amber" },
      },
    }))).toEqual({
      state: "matched",
      litWindowIds: [27, 64],
      hasThread: true,
    });
  });

  it("keeps a witnessed story lit without inventing a no-match connection", () => {
    expect(deriveWallVisualState(snapshot({
      phase: "no-match",
      windows: [sourceWindow],
      activeSourceId: "source",
      match: {
        decision: "NO_MATCH",
        candidateId: null,
        confidence: 0,
        evidencePath: [],
        why: "There is not enough shared evidence yet.",
        invitation: null,
        scene: null,
      },
    }))).toEqual({
      state: "no-match",
      litWindowIds: [27],
      hasThread: false,
    });
  });

  it("does not light unapproved reviewing content", () => {
    expect(deriveWallVisualState(snapshot({
      phase: "reviewing",
      windows: [],
      activeSourceId: null,
    }))).toEqual({
      state: "idle",
      litWindowIds: [],
      hasThread: false,
    });
  });
});
