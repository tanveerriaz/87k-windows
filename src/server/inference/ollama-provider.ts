import { randomUUID } from "node:crypto";
import { StoryCapsuleSchema, type StoryCapsule } from "../../shared/schemas";
import { redactMemory, unionRedactionVerdicts } from "../privacy/redact";
import { buildCapsulePrompt } from "./capsule-prompt";
import { keepExplicitConsent } from "./consent-evidence";
import { ProviderBusyError, ProviderOutputError, ProviderTimeoutError, type ExtractInput, type InferenceProvider } from "./provider";

type FetchLike = typeof fetch;

type OllamaResponse = {
  response?: string;
};

const JSON_FENCE = /^```(?:json)?\s*|\s*```$/gi;

export class OllamaProvider implements InferenceProvider {
  private busy = false;

  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly fetcher: FetchLike = fetch,
    private readonly timeoutMs = 35_000,
  ) {}

  private async generate(prompt: string): Promise<string> {
    let response: Response;
    try {
      response = await this.fetcher(`${this.baseUrl.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt,
          format: "json",
          stream: false,
          keep_alive: "30m",
          options: { temperature: 0.1, num_ctx: 4096, num_predict: 240 },
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") throw new ProviderTimeoutError();
      throw new ProviderOutputError("The local Gemma service is not reachable.");
    }
    if (!response.ok) throw new ProviderOutputError(`Local Gemma returned HTTP ${response.status}.`);
    const body = (await response.json()) as OllamaResponse;
    if (!body.response) throw new ProviderOutputError("Local Gemma returned an empty answer.");
    return body.response;
  }

  private parse(output: string, input: ExtractInput): StoryCapsule {
    const parsed = JSON.parse(output.replace(JSON_FENCE, "").trim()) as Record<string, unknown>;
    const sourceRedaction = redactMemory(input.memory);
    const merged = unionRedactionVerdicts(sourceRedaction, parsed.containsPII, parsed.redactions);
    const candidate = StoryCapsuleSchema.parse({
      ...parsed,
      id: randomUUID(),
      language: input.language ?? "en",
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
    if (this.busy) throw new ProviderBusyError();
    this.busy = true;
    try {
      const safeInput = redactMemory(input.memory).safeText;
      const firstOutput = await this.generate(buildCapsulePrompt({ memory: safeInput, dialect: "ollama", language: input.language }));
      try {
        return this.parse(firstOutput, input);
      } catch {
        const repairedOutput = await this.generate(
          buildCapsulePrompt({ memory: safeInput, repairOutput: firstOutput, dialect: "ollama", language: input.language }),
        );
        try {
          return this.parse(repairedOutput, input);
        } catch {
          throw new ProviderOutputError("Local Gemma returned invalid capsule JSON twice.");
        }
      }
    } finally {
      this.busy = false;
    }
  }
}
