import { describe, expect, it } from "vitest";
import { formatMatchWhy } from "../../src/client/lib/match-why";
import type { MatchResult } from "../../src/shared/schemas";

function match(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    decision: "MATCH",
    candidateId: "listener",
    confidence: 0.9,
    evidencePath: ["Queenstown", "1970s", "radio repair", "teach ↔ learn"],
    why: "These memories connect through Queenstown and radio repair. One person offered to share; the other asked to learn.",
    whyEvidence: { place: "Queenstown", era: "1970s", skill: "radio repair", hasComplement: true },
    invitation: "Would you both like to listen and continue this story together?",
    scene: { fromWindow: 27, toWindow: 64, colour: "amber" },
    ...overrides,
  };
}

describe("formatMatchWhy", () => {
  it("returns an empty string when there is no match", () => {
    expect(formatMatchWhy("en", null)).toBe("");
    expect(formatMatchWhy("en", undefined)).toBe("");
  });

  it("renders the no-match line in the participant's language when whyEvidence is null", () => {
    const result = match({ decision: "NO_MATCH", whyEvidence: null });
    expect(formatMatchWhy("zh", result)).toBe("这两份已批准的记忆尚未包含足够的共同和互补证据。");
    expect(formatMatchWhy("en", result)).toBe("These two approved memories do not contain enough shared and complementary evidence yet.");
  });

  it("interpolates canonical-English place/skill into the complement template, translated around them", () => {
    const result = match();
    expect(formatMatchWhy("en", result)).toBe(
      "These memories connect through Queenstown and radio repair. One person offered to share; the other asked to learn.",
    );
    expect(formatMatchWhy("zh", result)).toContain("Queenstown");
    expect(formatMatchWhy("zh", result)).toContain("radio repair");
    expect(formatMatchWhy("zh", result)).not.toContain("{place}");
    expect(formatMatchWhy("zh", result)).not.toContain("{skill}");
  });

  it("interpolates place/era/skill into the shared (non-complement) template", () => {
    const result = match({ whyEvidence: { place: "Queenstown", era: "1970s", skill: "radio repair", hasComplement: false } });
    const en = formatMatchWhy("en", result);
    expect(en).toContain("Queenstown");
    expect(en).toContain("1970s");
    expect(en).toContain("radio repair");
    expect(en).not.toBe(formatMatchWhy("en", match())); // different template than the complement case
  });

  it("falls back to a translated placeholder when place/era/skill are null", () => {
    const result = match({ whyEvidence: { place: null, era: null, skill: null, hasComplement: false } });
    const en = formatMatchWhy("en", result);
    expect(en).not.toContain("null");
    expect(en).not.toContain("{place}");
    expect(en).not.toContain("{era}");
    expect(en).not.toContain("{skill}");
  });

  it("produces a non-empty, placeholder-free string for every language", () => {
    for (const lang of ["en", "zh", "ms", "ta"] as const) {
      const complement = formatMatchWhy(lang, match());
      const shared = formatMatchWhy(lang, match({ whyEvidence: { place: "Queenstown", era: "1970s", skill: "radio repair", hasComplement: false } }));
      const noMatch = formatMatchWhy(lang, match({ decision: "NO_MATCH", whyEvidence: null }));
      for (const text of [complement, shared, noMatch]) {
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toMatch(/\{(place|era|skill)\}/);
      }
    }
  });
});
