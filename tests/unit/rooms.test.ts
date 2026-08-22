import { describe, expect, it, vi } from "vitest";
import { buildMockCapsule } from "../../src/server/inference/mock-provider";
import type { InferenceProvider } from "../../src/server/inference/provider";
import { StoryMatcher } from "../../src/server/matching/matcher";
import { RoomStore, type TypedServer } from "../../src/server/rooms";

describe("RoomStore prepared story", () => {
  it("uses the process inference provider instead of constructing a mock provider", async () => {
    vi.useFakeTimers();
    const capsule = buildMockCapsule({
      memory: "I used to repair radios around Queenstown in the 1970s.",
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
      memory: "I used to repair radios around Queenstown in the 1970s, and I would be happy to teach someone basic radio repair.",
      fixture: "radio",
    });
    expect(rooms.get("real87")).toMatchObject({ provider: "gemma-api", phase: "matched" });
    vi.useRealTimers();
  });
});
