import type { Facilitator, MatchResult, SeniorBridge, StoryCapsule } from "../../shared/schemas";

export type FacilitationInput = {
  source: StoryCapsule;
  candidate: StoryCapsule;
  match: MatchResult;
};

export interface ConnectionFacilitator {
  readonly mode: Facilitator;
  createGuide(input: FacilitationInput): Promise<SeniorBridge>;
}

export class FacilitationUnavailableError extends Error {
  constructor(message = "Gemini could not prepare the conversation guide. The evidence-backed match is still available.") {
    super(message);
    this.name = "FacilitationUnavailableError";
  }
}

export class DisabledFacilitator implements ConnectionFacilitator {
  readonly mode = "disabled" as const;

  async createGuide(): Promise<SeniorBridge> {
    throw new FacilitationUnavailableError("Gemini guidance is not enabled in this runtime.");
  }
}
