import { describe, expect, it } from "vitest";
import { MockFacilitator } from "../../src/server/facilitation/mock-facilitator";
import type { MatchResult, StoryCapsule } from "../../src/shared/schemas";

function capsule(overrides: Partial<StoryCapsule> = {}): StoryCapsule {
  return {
    id: "fixture",
    language: "en",
    observed: [],
    place: "Queenstown",
    era: "1970s",
    skills: ["radio repair"],
    interests: [],
    offers: ["teach basic radio repair"],
    wants: [],
    safeSummary: "A fictional memory.",
    containsPII: false,
    redactions: [],
    uncertain: [],
    ...overrides,
  };
}

const match: MatchResult = {
  decision: "MATCH",
  candidateId: "listener",
  confidence: 0.9,
  evidencePath: ["Queenstown", "1970s", "radio repair", "teach ↔ learn"],
  why: "test",
  whyEvidence: { place: "Queenstown", era: "1970s", skill: "radio repair", hasComplement: true },
  invitation: "test",
  scene: { fromWindow: 27, toWindow: 64, colour: "amber" },
};

describe("MockFacilitator", () => {
  it("echoes the storyteller's language onto the guide", async () => {
    const facilitator = new MockFacilitator();
    const guide = await facilitator.createGuide({
      source: capsule({ language: "zh" }),
      candidate: capsule({ language: "zh" }),
      match,
    });
    expect(guide.language).toBe("zh");
    expect(guide.introduction).toContain("radio repair");
  });

  it("writes the guide body in the storyteller's language, not always English", async () => {
    const facilitator = new MockFacilitator();
    const guide = await facilitator.createGuide({
      source: capsule({ language: "zh" }),
      candidate: capsule({ language: "en" }),
      match,
    });
    expect(guide.introduction).toMatch(/[一-鿿]/);
  });

  it("omits englishFallback when both participants share the storyteller's language", async () => {
    const facilitator = new MockFacilitator();
    const guide = await facilitator.createGuide({
      source: capsule({ language: "zh" }),
      candidate: capsule({ language: "zh" }),
      match,
    });
    expect(guide.englishFallback).toBeUndefined();
  });

  it("emits an englishFallback when the listener's language differs from the storyteller's", async () => {
    const facilitator = new MockFacilitator();
    const guide = await facilitator.createGuide({
      source: capsule({ language: "zh" }),
      candidate: capsule({ language: "en" }),
      match,
    });
    expect(guide.englishFallback).toBeDefined();
    expect(guide.englishFallback?.questions).toHaveLength(2);
    expect(guide.englishFallback?.introduction).not.toMatch(/[一-鿿]/);
  });

  it("stays English (language 'en', no fallback) for an English storyteller and listener", async () => {
    const facilitator = new MockFacilitator();
    const guide = await facilitator.createGuide({
      source: capsule({ language: "en" }),
      candidate: capsule({ language: "en" }),
      match,
    });
    expect(guide.language).toBe("en");
    expect(guide.englishFallback).toBeUndefined();
    expect(guide.introduction).toBe("You both have a radio repair story to explore.");
  });
});
