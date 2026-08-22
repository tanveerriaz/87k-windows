import { describe, expect, it } from "vitest";
import { FacilitatorSchema, SeniorBridgeSchema } from "../../src/shared/schemas";

describe("senior bridge schema", () => {
  it("accepts a concise two-question Gemini guide", () => {
    const guide = SeniorBridgeSchema.parse({
      introduction: "You both have a Queenstown radio story to explore.",
      questions: [
        "Would you like to share what made those radios memorable?",
        "Would you like to hear what the other person hopes to learn?",
      ],
      consentReminder: "Either person may pause or stop at any time.",
    });

    expect(guide.questions).toHaveLength(2);
    expect(FacilitatorSchema.parse("gemini")).toBe("gemini");
  });

  it("rejects an incomplete or overlong guide", () => {
    expect(() => SeniorBridgeSchema.parse({
      introduction: "A".repeat(241),
      questions: ["Only one question"],
      consentReminder: "Pause whenever you wish.",
    })).toThrow();
  });
});
