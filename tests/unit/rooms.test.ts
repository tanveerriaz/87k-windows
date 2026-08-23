import { describe, expect, it, vi } from "vitest";
import type { ConnectionFacilitator } from "../../src/server/facilitation/provider";
import { buildMockCapsule } from "../../src/server/inference/mock-provider";
import type { InferenceProvider } from "../../src/server/inference/provider";
import { StoryMatcher } from "../../src/server/matching/matcher";
import { RoomStore, type TypedServer } from "../../src/server/rooms";
import { PREPARED_RADIO_MEMORY } from "../../src/shared/demo";
import type { StoryCapsule } from "../../src/shared/schemas";

function testIo() {
  const emit = vi.fn();
  return { emit, io: { to: vi.fn(() => ({ emit })) } as unknown as TypedServer };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function approveCapsule(rooms: RoomStore, io: TypedServer, roomCode: string, participantId: string, capsule: StoryCapsule) {
  return rooms.approve(io, roomCode, participantId, rooms.registerCapsule(capsule));
}

function radioCapsules() {
  const source = buildMockCapsule({ memory: PREPARED_RADIO_MEMORY, fixture: "radio" });
  const candidate = {
    ...source,
    id: "listener-capsule",
    offers: [],
    wants: ["learn basic radio repair"],
    safeSummary: "A fictional memory from someone who wants to learn radio repair in Queenstown.",
  };
  return { source, candidate };
}

describe("RoomStore mutual consent", () => {
  it("keeps one approved memory witnessed without fabricating a listener", async () => {
    const { io, emit } = testIo();
    const rooms = new RoomStore(120, new StoryMatcher(), { extract: vi.fn() }, "gemma-api");
    const { source } = radioCapsules();
    await approveCapsule(rooms, io, "one87", "person-a", source);
    expect(rooms.get("one87")).toMatchObject({
      phase: "matching", activeSourceId: "person-a", activeCandidateId: null,
      match: null, connectionConsent: null, windows: [{ participantId: "person-a" }],
    });
    expect(emit).not.toHaveBeenCalledWith("bridge:animate", expect.anything());
  });

  it("connects only after two independent yes decisions", async () => {
    vi.useFakeTimers();
    const { io, emit } = testIo();
    const rooms = new RoomStore(120, new StoryMatcher(), { extract: vi.fn() }, "gemma-api");
    const { source, candidate } = radioCapsules();
    await approveCapsule(rooms, io, "pair87", "person-a", source);
    const second = approveCapsule(rooms, io, "pair87", "person-b", candidate);
    await vi.advanceTimersByTimeAsync(700);
    await second;
    expect(rooms.get("pair87")).toMatchObject({
      phase: "matching", match: { decision: "MATCH", candidateId: "person-b" },
      connectionConsent: { sourceDecision: "pending", candidateDecision: "pending", mutualYes: false },
    });
    expect(emit).not.toHaveBeenCalledWith("bridge:animate", expect.anything());
    expect(rooms.decide(io, "pair87", "person-a", "yes")).toEqual({ ok: true });
    expect(rooms.get("pair87")).toMatchObject({ phase: "matching", connectionConsent: { mutualYes: false } });
    expect(rooms.decide(io, "pair87", "person-b", "yes")).toEqual({ ok: true });
    expect(rooms.get("pair87")).toMatchObject({
      phase: "matched", connectionConsent: { sourceDecision: "yes", candidateDecision: "yes", mutualYes: true },
      invite: { title: "You both said yes." },
    });
    expect(emit).toHaveBeenCalledWith("bridge:animate", expect.objectContaining({ decision: "MATCH" }));
    vi.useRealTimers();
  });

  it("honours either person's no without creating a bridge", async () => {
    vi.useFakeTimers();
    const { io, emit } = testIo();
    const rooms = new RoomStore(120, new StoryMatcher(), { extract: vi.fn() }, "ollama");
    const { source, candidate } = radioCapsules();
    await approveCapsule(rooms, io, "no87", "person-a", source);
    const second = approveCapsule(rooms, io, "no87", "person-b", candidate);
    await vi.advanceTimersByTimeAsync(700);
    await second;
    rooms.decide(io, "no87", "person-b", "no");
    expect(rooms.get("no87")).toMatchObject({
      phase: "no-match", invite: null, connectionConsent: { candidateDecision: "no", mutualYes: false },
    });
    expect(emit).not.toHaveBeenCalledWith("bridge:animate", expect.anything());
    vi.useRealTimers();
  });

  it("returns no match for two weakly related approved memories", async () => {
    vi.useFakeTimers();
    const { io } = testIo();
    const rooms = new RoomStore(120, new StoryMatcher(), { extract: vi.fn() });
    const { source } = radioCapsules();
    const unrelated = buildMockCapsule({ memory: "I catalogued polar clouds in Antarctica in the 2010s.", fixture: "no-match" });
    await approveCapsule(rooms, io, "weak87", "person-a", source);
    const second = approveCapsule(rooms, io, "weak87", "person-b", unrelated);
    await vi.advanceTimersByTimeAsync(700);
    await second;
    expect(rooms.get("weak87")).toMatchObject({ phase: "no-match", connectionConsent: null, match: { decision: "NO_MATCH" } });
    vi.useRealTimers();
  });

  it("asks the facilitator only for a grounded two-person proposal", async () => {
    vi.useFakeTimers();
    const { io } = testIo();
    const { source, candidate } = radioCapsules();
    const facilitator: ConnectionFacilitator = {
      mode: "gemini",
      createGuide: vi.fn().mockResolvedValue({
        introduction: "You both have a radio story to explore.",
        questions: ["Would you like to share first?", "Would you like to listen next?"],
        consentReminder: "Either person may pause or stop.",
      }),
    };
    const rooms = new RoomStore(120, new StoryMatcher(), { extract: vi.fn() }, "ollama", facilitator);
    await approveCapsule(rooms, io, "guide87", "person-a", source);
    const second = approveCapsule(rooms, io, "guide87", "person-b", candidate);
    await vi.advanceTimersByTimeAsync(700);
    await second;
    expect(facilitator.createGuide).toHaveBeenCalledWith(expect.objectContaining({ source, candidate }));
    expect(rooms.get("guide87")).toMatchObject({ phase: "matching", guide: { introduction: expect.any(String) } });
    vi.useRealTimers();
  });

  it("uses the configured process provider and never silently switches", async () => {
    const { io } = testIo();
    const { source } = radioCapsules();
    const provider: InferenceProvider = { extract: vi.fn().mockResolvedValue(source) };
    const rooms = new RoomStore(120, new StoryMatcher(), provider, "gemma-api");
    await rooms.inject(io, "real87");
    expect(provider.extract).toHaveBeenCalledOnce();
    expect(rooms.providerRequest("real87", "ollama")).toMatchObject({ available: false, snapshot: { provider: "gemma-api" } });
  });

  it("rejects outsiders and clears ephemeral state on reset", async () => {
    vi.useFakeTimers();
    const { io } = testIo();
    const rooms = new RoomStore(120, new StoryMatcher(), { extract: vi.fn() });
    const { source, candidate } = radioCapsules();
    await approveCapsule(rooms, io, "reset87", "person-a", source);
    const second = approveCapsule(rooms, io, "reset87", "person-b", candidate);
    await vi.advanceTimersByTimeAsync(700);
    await second;
    expect(rooms.decide(io, "reset87", "stranger", "yes")).toMatchObject({ ok: false });
    await approveCapsule(rooms, io, "reset87", "person-c", source);
    expect(rooms.get("reset87")).toMatchObject({
      lastError: "This room already has two participants. Start a new room for another conversation.",
      windows: [{ participantId: "person-a" }, { participantId: "person-b" }],
    });
    expect(rooms.reset("reset87")).toMatchObject({ phase: "idle", windows: [], connectionConsent: null });
    vi.useRealTimers();
  });

  it("approve only accepts capsules minted by the server", async () => {
    const { io } = testIo();
    const rooms = new RoomStore(120, new StoryMatcher(), { extract: vi.fn() });
    const { source } = radioCapsules();
    const id = rooms.registerCapsule(source);
    await rooms.approve(io, "demo87", "p1", id);
    expect(rooms.get("demo87").windows).toHaveLength(1);
    await rooms.approve(io, "demo87", "p2", "forged-id");
    expect(rooms.get("demo87").windows).toHaveLength(1);
  });

  it("emits consent:requested before the guide resolves", async () => {
    const order: string[] = [];
    const { io } = testIo();
    io.to = (() => ({ emit: (event: string) => order.push(event) })) as unknown as TypedServer["to"];
    let guideResolved: () => void = () => {};
    const guideDone = new Promise<void>((resolve) => { guideResolved = resolve; });
    const fixtureGuide = {
      language: "en" as const,
      introduction: "You both have a radio story to explore.",
      questions: ["Would you like to share first?", "Would you like to listen next?"] as [string, string],
      consentReminder: "Either person may pause or stop.",
    };
    const facilitator: ConnectionFacilitator = {
      mode: "gemini",
      createGuide: vi.fn(async () => {
        order.push("guide-start");
        await delay(50);
        order.push("guide-end");
        guideResolved();
        return fixtureGuide;
      }),
    };
    const rooms = new RoomStore(120, new StoryMatcher(), { extract: vi.fn() }, "ollama", facilitator);
    const { source, candidate } = radioCapsules();
    await approveCapsule(rooms, io, "order87", "person-a", source);
    const secondCapsuleId = rooms.registerCapsule(candidate);
    await rooms.approve(io, "order87", "person-b", secondCapsuleId);
    await guideDone;
    expect(order.indexOf("consent:requested")).toBeLessThan(order.indexOf("guide-end"));
  });
});
