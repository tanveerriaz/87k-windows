import { randomUUID } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { StoryCapsuleSchema, type StoryCapsule } from "../../shared/schemas";
import { redactMemory, unionRedactionVerdicts } from "../privacy/redact";
import { buildCapsulePrompt } from "./capsule-prompt";
import { keepExplicitConsent } from "./consent-evidence";
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

const JSON_FENCE = /^```(?:json)?\s*|\s*```$/gi;

function decodeCapsuleJson(output: string): Record<string, unknown> {
  const stripped = output.replace(JSON_FENCE, "").trim();
  const parsed = parseJsonObject(stripped);
  if (parsed) return parsed;
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const nested = parseJsonObject(stripped.slice(start, end + 1));
    if (nested) return nested;
  }
  throw new Error("invalid capsule json");
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function nullableText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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

  private async generate(prompt: string): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          abortSignal: AbortSignal.timeout(this.timeoutMs),
          temperature: 0.1,
          maxOutputTokens: 1200,
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
    const parsed = decodeCapsuleJson(output);
    const sourceRedaction = redactMemory(input.memory);
    const merged = unionRedactionVerdicts(sourceRedaction, parsed.containsPII, parsed.redactions);
    const candidate = StoryCapsuleSchema.parse({
      ...parsed,
      id: randomUUID(),
      language: input.language ?? "en",
      place: parsed.place == null ? null : nullableText(parsed.place),
      era: parsed.era == null ? null : nullableText(parsed.era),
      containsPII: merged.containsPII,
      redactions: merged.redactions,
      ...keepExplicitConsent(input.memory, parsed.offers, parsed.wants, input.language),
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
    const firstOutput = await this.generate(buildCapsulePrompt({ memory: safeInput, dialect: "hosted", language: input.language }));
    try {
      return this.parse(firstOutput, input);
    } catch {
      const repairedOutput = await this.generate(
        buildCapsulePrompt({ memory: safeInput, repairOutput: firstOutput, dialect: "hosted", language: input.language }),
      );
      try {
        return this.parse(repairedOutput, input);
      } catch {
        throw new ProviderOutputError("Hosted Gemma returned invalid capsule JSON twice.");
      }
    }
  }
}
