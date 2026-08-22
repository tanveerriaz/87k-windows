import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { SeniorBridgeSchema, type SeniorBridge, type StoryCapsule } from "../../shared/schemas";
import { redactMemory } from "../inference/mock-provider";
import { FacilitationUnavailableError, type ConnectionFacilitator, type FacilitationInput } from "./provider";

type GenerateRequest = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

export type GeminiFacilitatorClient = {
  models: {
    generateContent(request: GenerateRequest): Promise<{ text?: string }>;
  };
};

const GUIDE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["introduction", "questions", "consentReminder"],
  properties: {
    introduction: { type: "string" },
    questions: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: { type: "string" },
    },
    consentReminder: { type: "string" },
  },
} as const;

function safeCapsule(capsule: StoryCapsule) {
  const clean = (value: string): string => redactMemory(value).safeText;
  return {
    safeSummary: clean(capsule.safeSummary),
    place: capsule.place ? clean(capsule.place) : null,
    era: capsule.era ? clean(capsule.era) : null,
    skills: capsule.skills.map(clean),
    interests: capsule.interests.map(clean),
    offers: capsule.offers.map(clean),
    wants: capsule.wants.map(clean),
  };
}

export class GeminiFacilitator implements ConnectionFacilitator {
  readonly mode = "gemini" as const;
  private readonly client: GeminiFacilitatorClient;

  constructor(
    apiKey: string,
    private readonly model: string,
    client?: GeminiFacilitatorClient,
    private readonly timeoutMs = 20_000,
  ) {
    if (!apiKey.trim()) throw new Error("A Gemini API key is required for the senior connection guide.");
    this.client = client ?? new GoogleGenAI({ apiKey });
  }

  private prompt(input: FacilitationInput): string {
    const evidence = {
      participant: safeCapsule(input.source),
      preparedFictionalListener: safeCapsule(input.candidate),
      evidencePath: input.match.evidencePath,
      matchExplanation: input.match.why,
    };
    return `Create a short, senior-friendly conversation guide from the approved safe evidence below.
Use plain language, one idea per sentence, and gentle questions that work when read aloud slowly.
Do not diagnose, advise about health, imply friendship, claim acceptance, invent biography, or add facts.
Do not mention scores, AI reasoning, contact details, or hidden analysis.
The introduction must be one short sentence. Return exactly two optional questions and one explicit reminder that either person may pause or stop.
Return only the requested JSON.
Approved evidence: ${JSON.stringify(evidence)}`;
  }

  async createGuide(input: FacilitationInput): Promise<SeniorBridge> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: this.prompt(input),
        config: {
          abortSignal: AbortSignal.timeout(this.timeoutMs),
          maxOutputTokens: 640,
          responseMimeType: "application/json",
          responseJsonSchema: GUIDE_JSON_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
      if (!response.text?.trim()) throw new FacilitationUnavailableError();
      return SeniorBridgeSchema.parse(JSON.parse(response.text.trim()) as unknown);
    } catch (error) {
      if (error instanceof FacilitationUnavailableError) throw error;
      throw new FacilitationUnavailableError();
    }
  }
}
