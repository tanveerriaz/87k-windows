import { randomUUID } from "node:crypto";
import { StoryCapsuleSchema, type StoryCapsule } from "../../shared/schemas";
import { keepExplicitConsent } from "./consent-evidence";
import { redactMemory } from "./mock-provider";
import { ProviderOutputError, ProviderTimeoutError, type ExtractInput, type InferenceProvider } from "./provider";

type FetchLike = typeof fetch;

type OllamaResponse = {
  response?: string;
};

const JSON_FENCE = /^```(?:json)?\s*|\s*```$/gi;

export class OllamaProvider implements InferenceProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly fetcher: FetchLike = fetch,
    private readonly timeoutMs = 35_000,
  ) {}

  private prompt(memory: string, repairOutput?: string): string {
    const repair = repairOutput
      ? `\nYour previous answer was invalid. Repair it and return JSON only. Previous answer:\n${repairOutput.slice(0, 1200)}\n`
      : "";
    return `You create a privacy-safe story capsule from one fictional demo memory.
Use only explicit evidence. Do not guess a name, age, ethnicity, health, address, relationship or contact detail.
Return one JSON object with exactly these keys:
observed (string array), place (string or null), era (string or null), skills (string array), interests (string array), offers (string array), wants (string array), safeSummary (one short string), containsPII (boolean), redactions (string array), uncertain (string array).
The input has already had obvious identifiers replaced with [redacted]. Keep those identifiers out of the summary.
Memory: ${JSON.stringify(memory)}${repair}`;
  }

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
    const parsed: unknown = JSON.parse(output.replace(JSON_FENCE, "").trim());
    const sourceRedaction = redactMemory(input.memory);
    const candidate = StoryCapsuleSchema.parse({
      ...(parsed as Record<string, unknown>),
      id: randomUUID(),
      containsPII: sourceRedaction.containsPII,
      redactions: sourceRedaction.redactions,
      ...keepExplicitConsent(
        input.memory,
        (parsed as Record<string, unknown>).offers,
        (parsed as Record<string, unknown>).wants,
      ),
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
        throw new ProviderOutputError("Local Gemma returned invalid capsule JSON twice.");
      }
    }
  }
}
