import type { SeniorBridge } from "../../shared/schemas";
import { SeniorBridgeSchema } from "../../shared/schemas";
import type { ConnectionFacilitator, FacilitationInput } from "./provider";

export class MockFacilitator implements ConnectionFacilitator {
  readonly mode = "mock" as const;

  async createGuide(input: FacilitationInput): Promise<SeniorBridge> {
    const topic = input.source.skills[0] ?? input.source.interests[0] ?? "this shared memory";
    return SeniorBridgeSchema.parse({
      introduction: `You both have a ${topic} story to explore.`,
      questions: [
        `Would you like to share what made ${topic} memorable?`,
        "Would you like to hear what the other person hopes to learn?",
      ],
      consentReminder: "Either person may pause or stop at any time.",
    });
  }
}
