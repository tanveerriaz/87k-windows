import { randomUUID } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { StoryCapsuleSchema, type StoryCapsule } from "../../shared/schemas";
import { redactMemory } from "./mock-provider";
import { ProviderOutputError, ProviderTimeoutError, type ExtractInput, type InferenceProvider } from "./provider";

type GenerateRequest = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

export type GemmaApiClient = {
  models: {
    generateContent(request: GenerateRequest): Promise<{ text?: string }>;
  };
};

const CAPSULE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["observed", "place", "era", "skills", "interests", "offers", "wants", "safeSummary", "containsPII", "redactions", "uncertain"],
  properties: {
    observed: { type: "array", items: { type: "string" } },
    place: { anyOf: [{ type: "string" }, { type: "null" }] },
    era: { anyOf: [{ type: "string" }, { type: "null" }] },
    skills: { type: "array", items: { type: "string" } },
    interests: { type: "array", items: { type: "string" } },
    offers: { type: "array", items: { type: "string" } },
    wants: { type: "array", items: { type: "string" } },
    safeSummary: { type: "string" },
    containsPII: { type: "boolean" },
    redactions: { type: "array", items: { type: "string" } },
    uncertain: { type: "array", items: { type: "string" } },
  },
} as const;

const EXPLICIT_OFFER = /\b(i can|i could|i would be happy to|i am happy to|i'm happy to|i am willing to|i'm willing to|i can teach|i can share|i can show|i can help)\b/i;
const EXPLICIT_WANT = /\b(i want|i wish|i hope|i would like|i'm looking for|i am looking for|i miss|i want to learn)\b/i;

export class GemmaApiProvider implements InferenceProvider {
  private readonly client: GemmaApiClient;

  constructor(
    apiKey: string,
    private readonly model: string,
    client?: GemmaApiClient,
    private readonly timeoutMs = 35_000,
  ) {
    if (!apiKey.trim()) throw new Error("A Gemini API key is required for hosted Gemma.");
    this.client = client ?? new GoogleGenAI({ apiKey });
  }

  private prompt(memory: string, repairOutput?: string): string {
    const repair = repairOutput
      ? `\nThe previous JSON was invalid. Correct it using the same evidence. Previous JSON:\n${repairOutput.slice(0, 1200)}`
      : "";
    return `Create a privacy-safe story capsule from this fictional demo memory.
Use only explicit evidence. Never infer identity, age, ethnicity, health, address, relationships, or contact details.
Never turn an activity into an occupation, title, identity, or permanent trait. Phrase safeSummary as "A memory of ...".
Copy explicit place and era wording faithfully; never pad, reformat, or invent years.
Populate offers or wants only when the person explicitly volunteers an offer or states a desire; an activity alone is neither.
Put missing or ambiguous facts in uncertain; use null for an unstated place or era.
Return only the requested JSON. Do not include reasoning, hidden analysis, markdown, or extra keys.
Memory: ${JSON.stringify(memory)}${repair}`;
  }

  private async generate(prompt: string): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          abortSignal: AbortSignal.timeout(this.timeoutMs),
          temperature: 0.1,
          maxOutputTokens: 600,
          responseMimeType: "application/json",
          responseJsonSchema: CAPSULE_JSON_SCHEMA,
        },
      });
      if (!response.text?.trim()) throw new ProviderOutputError("Hosted Gemma returned an empty answer.");
      return response.text;
    } catch (error) {
      if (error instanceof ProviderOutputError) throw error;
      if ((error instanceof DOMException && error.name === "TimeoutError") || (error instanceof Error && error.name === "AbortError")) {
        throw new ProviderTimeoutError("Hosted Gemma took too long to respond.");
      }
      throw new ProviderOutputError("Hosted Gemma is temporarily unavailable.");
    }
  }

  private parse(output: string, input: ExtractInput): StoryCapsule {
    const parsed: unknown = JSON.parse(output.trim());
    const sourceRedaction = redactMemory(input.memory);
    const candidate = StoryCapsuleSchema.parse({
      ...(parsed as Record<string, unknown>),
      id: randomUUID(),
      containsPII: sourceRedaction.containsPII,
      redactions: sourceRedaction.redactions,
      offers: EXPLICIT_OFFER.test(input.memory) ? (parsed as Record<string, unknown>).offers : [],
      wants: EXPLICIT_WANT.test(input.memory) ? (parsed as Record<string, unknown>).wants : [],
    });
    const summaryRedaction = redactMemory(candidate.safeSummary);
    return StoryCapsuleSchema.parse({
      ...candidate,
      safeSummary: summaryRedaction.safeText,
      containsPII: candidate.containsPII || summaryRedaction.containsPII,
      redactions: [...new Set([...candidate.redactions, ...summaryRedaction.redactions])],
    });
  }

  async extract(input: ExtractInput): Promise<StoryCapsule> {
    const safeInput = redactMemory(input.memory).safeText;
    const firstOutput = await this.generate(this.prompt(safeInput));
    try {
      return this.parse(firstOutput, input);
    } catch {
      const repairedOutput = await this.generate(this.prompt(safeInput, firstOutput));
      try {
        return this.parse(repairedOutput, input);
      } catch {
        throw new ProviderOutputError("Hosted Gemma returned invalid capsule JSON twice.");
      }
    }
  }
}
