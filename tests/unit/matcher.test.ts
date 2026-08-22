import { describe, expect, it } from "vitest";
import { buildMockCapsule } from "../../src/server/inference/mock-provider";
import { StoryMatcher } from "../../src/server/matching/matcher";
import { PREPARED_RADIO_MEMORY } from "../../src/shared/demo";

describe("StoryMatcher", () => {
  const matcher = new StoryMatcher();

  it("connects the Queenstown radio teacher to the prepared learner", () => {
    const capsule = buildMockCapsule({
      memory: PREPARED_RADIO_MEMORY,
      fixture: "radio",
    });
    const result = matcher.match(capsule);
    expect(result.decision).toBe("MATCH");
    expect(result.candidateId).toBe("story-07");
    expect(result.confidence).toBeGreaterThanOrEqual(0.62);
    expect(result.evidencePath).toEqual(["Queenstown", "1970s", "radio repair", "teach ↔ learn"]);
  });

  it("returns NO_MATCH for the deliberate polar-cloud fixture", () => {
    const capsule = buildMockCapsule({
      memory: "I catalogued polar clouds in Antarctica in the 2010s.",
      fixture: "no-match",
    });
    const result = matcher.match(capsule);
    expect(result.decision).toBe("NO_MATCH");
    expect(result.candidateId).toBeNull();
    expect(result.invitation).toBeNull();
    expect(result.scene).toBeNull();
  });
});
