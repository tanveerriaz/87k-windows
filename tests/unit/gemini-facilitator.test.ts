import { describe, expect, it, vi } from "vitest";
import type { MatchResult, StoryCapsule } from "../../src/shared/schemas";
import { GeminiFacilitator, type GeminiFacilitatorClient } from "../../src/server/facilitation/gemini-facilitator";
import { FacilitationUnavailableError } from "../../src/server/facilitation/provider";

const source: StoryCapsule = {
  id: "PRIVATE-SOURCE-ID",
  observed: ["do not forward this observation"],
  place: "Queenstown",
  era: "1970s",
  skills: ["radio repair"],
  interests: ["old radios"],
  offers: ["teach basic radio repair", "call +65 9123 4567"],
  wants: [],
  safeSummary: "A fictional memory of repairing radios in Queenstown.",
  containsPII: false,
  redactions: ["do not forward redaction metadata"],
  uncertain: [],
};

const candidate: StoryCapsule = {
  ...source,
  id: "PRIVATE-CANDIDATE-ID",
  safeSummary: "A fictional hobbyist wants to learn radio repair.",
  offers: [],
  wants: ["learn radio repair"],
};

const match: MatchResult = {
  decision: "MATCH",
  candidateId: candidate.id,
  confidence: 0.87,
  evidencePath: ["Queenstown", "1970s", "radio repair", "teach ↔ learn"],
  why: "The safe capsules contain complementary radio-repair evidence.",
  invitation: "Kopi and a radio repair story?",
  scene: { fromWindow: 27, toWindow: 64, colour: "amber" },
};

function clientWith(generateContent: GeminiFacilitatorClient["models"]["generateContent"]): GeminiFacilitatorClient {
  return { models: { generateContent } };
}

describe("GeminiFacilitator", () => {
  it("uses only approved safe capsule fields and visible match evidence", async () => {
    const generateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        introduction: "You both have a Queenstown radio story to explore.",
        questions: ["Would you like to share what made radios memorable?", "Would you like to hear what the other person hopes to learn?"],
        consentReminder: "Either person may pause or stop at any time.",
      }),
    });
    const facilitator = new GeminiFacilitator("test-key", "gemini-3.6-flash", clientWith(generateContent));

    const guide = await facilitator.createGuide({ source, candidate, match });

    expect(guide.questions).toHaveLength(2);
    const request = generateContent.mock.calls[0]?.[0];
    expect(request.model).toBe("gemini-3.6-flash");
    expect(request.contents).toContain(source.safeSummary);
    expect(request.contents).toContain("teach ↔ learn");
    expect(request.contents).not.toContain(source.id);
    expect(request.contents).not.toContain(source.observed[0]);
    expect(request.contents).not.toContain(source.redactions[0]);
    expect(request.contents).not.toContain("9123 4567");
    expect(request.contents).toContain("[redacted]");
  });

  it("fails explicitly when Gemini returns invalid structured output", async () => {
    const facilitator = new GeminiFacilitator(
      "test-key",
      "gemini-3.6-flash",
      clientWith(vi.fn().mockResolvedValue({ text: "{}" })),
    );

    await expect(facilitator.createGuide({ source, candidate, match })).rejects.toBeInstanceOf(FacilitationUnavailableError);
  });
});
