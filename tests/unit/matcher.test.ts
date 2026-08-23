import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildMockCapsule } from "../../src/server/inference/mock-provider";
import { StoryMatcher } from "../../src/server/matching/matcher";
import { PREPARED_RADIO_MEMORY } from "../../src/shared/demo";
import { StoryCapsuleSchema, type StoryCapsule } from "../../src/shared/schemas";

// Real capsules captured once from each provider actually reachable in the
// dev environment when Task 12 ran (2026-08-23): `mock` (always available)
// and a local Ollama `gemma3:4b` (reachable at http://127.0.0.1:11434, no
// key required). Hosted Gemma (gemma-api / openrouter) was NOT captured —
// neither OPENROUTER_API_KEY nor GEMINI_API_KEY was set in this environment
// (no .env file, nothing in the shell). See task-12-report.md for the gap.
const FIXTURE_PROVIDERS = ["mock", "ollama"] as const;

function loadFixture(name: string): StoryCapsule {
  const raw: unknown = JSON.parse(readFileSync(resolve(process.cwd(), "tests/fixtures/capsules", name), "utf8"));
  return StoryCapsuleSchema.parse(raw);
}

function minimalCapsule(overrides: Partial<StoryCapsule>): StoryCapsule {
  return {
    id: "fixture",
    language: "en",
    observed: [],
    place: null,
    era: null,
    skills: [],
    interests: [],
    offers: [],
    wants: [],
    safeSummary: "A fictional memory.",
    containsPII: false,
    redactions: [],
    uncertain: [],
    ...overrides,
  };
}

describe("StoryMatcher", () => {
  const matcher = new StoryMatcher();

  function score(a: Partial<StoryCapsule>, b: Partial<StoryCapsule>): number {
    return matcher.score(minimalCapsule(a), minimalCapsule(b)).score;
  }

  const radioFixtureCapsule = buildMockCapsule({ memory: PREPARED_RADIO_MEMORY, fixture: "radio" });
  const listenerFixtureCapsule: StoryCapsule = {
    ...radioFixtureCapsule,
    id: "listener-capsule",
    offers: [],
    wants: ["learn basic radio repair"],
    safeSummary: "A fictional memory from someone who wants to learn radio repair in Queenstown.",
  };

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

  it("gives partial place credit for phrasing variants", () => {
    expect(score({ place: "Queenstown" }, { place: "Queenstown estate" })).toBeGreaterThanOrEqual(0.2);
  });

  it("canonicalizes era phrasings to the decade", () => {
    expect(score({ era: "the 1970s" }, { era: "1970-1979" })).toBeGreaterThanOrEqual(0.2);
  });

  it("still clears the threshold for the Queenstown pair with phrasing drift", () => {
    const drifted = { ...radioFixtureCapsule, place: "Queenstown, Singapore", era: "the 1970s" };
    expect(matcher.matchPair(drifted, listenerFixtureCapsule, "a", "b").decision).toBe("MATCH");
  });

  it.each(FIXTURE_PROVIDERS)("%s radio pairing (real captured capsules) clears the match threshold", (provider) => {
    const radio = loadFixture(`${provider}-radio.json`);
    const listener = loadFixture(`${provider}-radio-listener.json`);
    const result = matcher.matchPair(radio, listener, "a", "b");
    expect(result.decision).toBe("MATCH");
    expect(result.confidence).toBeGreaterThanOrEqual(0.62);
  });

  it.each(FIXTURE_PROVIDERS)("%s no-match pair (real captured capsules) stays below the threshold", (provider) => {
    const radio = loadFixture(`${provider}-radio.json`);
    const noMatch = loadFixture(`${provider}-no-match.json`);
    const result = matcher.matchPair(radio, noMatch, "a", "b");
    expect(result.decision).toBe("NO_MATCH");
  });

  it("matches a real Ollama gemma3:4b zh capsule against the real English listener fixture (captured, not fabricated — see task-4-report.md)", () => {
    const zhCapsule = loadFixture("ollama-radio-zh.json");
    const listener = loadFixture("ollama-radio-listener.json");
    expect(zhCapsule.language).toBe("zh");
    expect(zhCapsule.place).toBe("Queenstown");
    expect(zhCapsule.era).toBe("1970s");
    expect(zhCapsule.skills).toEqual(["radio repair"]);
    const result = matcher.matchPair(zhCapsule, listener, "a", "b");
    expect(result.decision).toBe("MATCH");
    expect(result.confidence).toBeGreaterThanOrEqual(0.62);
  });

  it("matches a zh-language capsule (Chinese safeSummary, canonical English fields) against the English listener fixture", () => {
    const zhCapsule = buildMockCapsule({ memory: PREPARED_RADIO_MEMORY, fixture: "radio", language: "zh" });
    expect(zhCapsule.language).toBe("zh");
    expect(zhCapsule.safeSummary).toMatch(/[一-鿿]/);
    expect(zhCapsule.place).toBe("Queenstown");
    expect(zhCapsule.era).toBe("1970s");
    expect(zhCapsule.skills).toEqual(["radio repair"]);
    const result = matcher.matchPair(zhCapsule, listenerFixtureCapsule, "a", "b");
    expect(result.decision).toBe("MATCH");
    expect(result.confidence).toBeGreaterThanOrEqual(0.62);
  });
});
