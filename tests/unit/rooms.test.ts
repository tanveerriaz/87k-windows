import { describe, expect, it, vi } from "vitest";
import { buildMockCapsule } from "../../src/server/inference/mock-provider";
import type { InferenceProvider } from "../../src/server/inference/provider";
import { StoryMatcher } from "../../src/server/matching/matcher";
import { RoomStore, type TypedServer } from "../../src/server/rooms";
import { PREPARED_RADIO_MEMORY } from "../../src/shared/demo";
import type { ConnectionFacilitator } from "../../src/server/facilitation/provider";

describe("RoomStore prepared story", () => {
  it("reports OpenRouter as the active cloud mode", () => {
    const provider: InferenceProvider = { extract: vi.fn() };
    const rooms = new RoomStore(120, new StoryMatcher(), provider, "openrouter");

    expect(rooms.providerRequest("router87", "openrouter")).toMatchObject({
      available: true,
      message: "OpenRouter Mode is active.",
      snapshot: { provider: "openrouter", lastError: null },
    });
  });

  it("asks the facilitator only after a grounded match", async () => {
    vi.useFakeTimers();
    const emit = vi.fn();
    const io = { to: vi.fn(() => ({ emit })) } as unknown as TypedServer;
    const provider: InferenceProvider = { extract: vi.fn() };
    const createGuide = vi.fn().mockResolvedValue({
      introduction: "You both have a radio story to explore.",
      questions: ["Would you like to share first?", "Would you like to hear what the other person hopes to learn?"],
      consentReminder: "Either person may pause or stop.",
    });
    const facilitator: ConnectionFacilitator = { mode: "gemini", createGuide };
    const rooms = new RoomStore(120, new StoryMatcher(), provider, "ollama", facilitator);
    const capsule = buildMockCapsule({ memory: PREPARED_RADIO_MEMORY, fixture: "radio" });

    const approval = rooms.approve(io, "dual87", "participant-one", capsule);
    await vi.advanceTimersByTimeAsync(700);
    await approval;

    expect(createGuide).toHaveBeenCalledOnce();
    expect(createGuide).toHaveBeenCalledWith(expect.objectContaining({
      source: capsule,
      candidate: expect.objectContaining({ id: "story-07" }),
      match: expect.objectContaining({ decision: "MATCH" }),
    }));
    expect(rooms.get("dual87")).toMatchObject({
      facilitator: "gemini",
      phase: "matched",
      guide: { introduction: "You both have a radio story to explore." },
      guideError: null,
    });
    vi.useRealTimers();
  });

  it("never asks the facilitator to manufacture a no-match bridge", async () => {
    vi.useFakeTimers();
    const emit = vi.fn();
    const io = { to: vi.fn(() => ({ emit })) } as unknown as TypedServer;
    const provider: InferenceProvider = { extract: vi.fn() };
    const facilitator: ConnectionFacilitator = { mode: "gemini", createGuide: vi.fn() };
    const rooms = new RoomStore(120, new StoryMatcher(), provider, "ollama", facilitator);
    const capsule = buildMockCapsule({ memory: "I catalogued polar clouds in Antarctica in the 2010s.", fixture: "no-match" });

    const approval = rooms.approve(io, "none87", "participant-one", capsule);
    await vi.advanceTimersByTimeAsync(700);
    await approval;

    expect(facilitator.createGuide).not.toHaveBeenCalled();
    expect(rooms.get("none87")).toMatchObject({ phase: "no-match", guide: null });
    vi.useRealTimers();
  });

  it("keeps the grounded match when Gemini guidance is unavailable", async () => {
    vi.useFakeTimers();
    const emit = vi.fn();
    const io = { to: vi.fn(() => ({ emit })) } as unknown as TypedServer;
    const provider: InferenceProvider = { extract: vi.fn() };
    const facilitator: ConnectionFacilitator = {
      mode: "gemini",
      createGuide: vi.fn().mockRejectedValue(new Error("network details must not leak")),
    };
    const rooms = new RoomStore(120, new StoryMatcher(), provider, "ollama", facilitator);
    const capsule = buildMockCapsule({ memory: PREPARED_RADIO_MEMORY, fixture: "radio" });

    const approval = rooms.approve(io, "fallback87", "participant-one", capsule);
    await vi.advanceTimersByTimeAsync(700);
    await approval;

    expect(rooms.get("fallback87")).toMatchObject({
      phase: "matched",
      match: { decision: "MATCH" },
      guide: null,
      guideError: "Gemini could not prepare the conversation guide. The evidence-backed match is still available.",
    });
    expect(JSON.stringify(rooms.get("fallback87"))).not.toContain("network details must not leak");
    vi.useRealTimers();
  });

  it("uses the process inference provider instead of constructing a mock provider", async () => {
    vi.useFakeTimers();
    const capsule = buildMockCapsule({
      memory: PREPARED_RADIO_MEMORY,
      fixture: "radio",
    });
    const provider: InferenceProvider = { extract: vi.fn().mockResolvedValue(capsule) };
    const emit = vi.fn();
    const io = { to: vi.fn(() => ({ emit })) } as unknown as TypedServer;
    const rooms = new RoomStore(120, new StoryMatcher(), provider, "gemma-api");

    const injection = rooms.inject(io, "real87");
    await vi.advanceTimersByTimeAsync(700);
    await injection;

    expect(provider.extract).toHaveBeenCalledOnce();
    expect(provider.extract).toHaveBeenCalledWith({
      memory: PREPARED_RADIO_MEMORY,
      fixture: "radio",
    });
    expect(rooms.get("real87")).toMatchObject({ provider: "gemma-api", phase: "matched" });
    vi.useRealTimers();
  });

  it("keeps simultaneous approvals bound to the latest active participant", async () => {
    vi.useFakeTimers();
    const emit = vi.fn();
    const io = { to: vi.fn(() => ({ emit })) } as unknown as TypedServer;
    const provider: InferenceProvider = { extract: vi.fn() };
    const rooms = new RoomStore(120, new StoryMatcher(), provider, "gemma-api");
    const first = buildMockCapsule({ memory: PREPARED_RADIO_MEMORY, fixture: "radio" });
    const second = { ...first, id: "second-capsule", safeSummary: "The latest approved fictional radio story." };

    const firstApproval = rooms.approve(io, "busy87", "participant-one", first);
    const secondApproval = rooms.approve(io, "busy87", "participant-two", second);
    await vi.advanceTimersByTimeAsync(700);
    await Promise.all([firstApproval, secondApproval]);

    const snapshot = rooms.get("busy87");
    expect(snapshot.activeSourceId).toBe("participant-two");
    expect(snapshot.activeCandidateId).toBe("story-07");
    expect(snapshot.windows.findLast((window) => window.participantId === snapshot.activeSourceId)?.safeSummary)
      .toBe("The latest approved fictional radio story.");
    vi.useRealTimers();
  });

  it("does not emit a ghost match after the presenter resets the room", async () => {
    vi.useFakeTimers();
    const emit = vi.fn();
    const io = { to: vi.fn(() => ({ emit })) } as unknown as TypedServer;
    const provider: InferenceProvider = { extract: vi.fn() };
    const rooms = new RoomStore(120, new StoryMatcher(), provider, "gemma-api");
    const capsule = buildMockCapsule({ memory: PREPARED_RADIO_MEMORY, fixture: "radio" });

    const approval = rooms.approve(io, "reset87", "participant-one", capsule);
    rooms.reset("reset87");
    await vi.advanceTimersByTimeAsync(700);
    await approval;

    expect(rooms.get("reset87")).toMatchObject({ phase: "idle", activeSourceId: null, activeCandidateId: null });
    expect(emit).not.toHaveBeenCalledWith("match:found", expect.anything());
    vi.useRealTimers();
  });
});
