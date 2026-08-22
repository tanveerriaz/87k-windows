import type { GoogleGenAI } from "@google/genai";
import { z } from "zod";

type GenerateRequest = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

const OpenRouterResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().nullable() }),
  })),
});

export class OpenRouterGenAiClient {
  readonly models = {
    generateContent: (request: GenerateRequest): Promise<{ text?: string }> => this.generateContent(request),
  };

  private readonly chatCompletionsUrl: string;

  constructor(
    baseUrl: string,
    private readonly apiKey: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    if (!apiKey.trim()) throw new Error("An OpenRouter API key is required.");
    this.chatCompletionsUrl = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  }

  private async generateContent(request: GenerateRequest): Promise<{ text?: string }> {
    if (typeof request.contents !== "string") {
      throw new Error("OpenRouter requests require plain text contents.");
    }
    const schema = request.config?.responseJsonSchema;
    if (!schema) throw new Error("OpenRouter requests require a response JSON schema.");

    const response = await this.fetcher(this.chatCompletionsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "87K Windows",
      },
      signal: request.config?.abortSignal,
      body: JSON.stringify({
        model: request.model,
        messages: [{ role: "user", content: request.contents }],
        temperature: request.config?.temperature,
        max_tokens: request.config?.maxOutputTokens,
        stream: false,
        reasoning: request.model.includes("/gemini-")
          ? { effort: "minimal", exclude: true }
          : undefined,
        provider: {
          require_parameters: true,
          only: request.model === "google/gemma-3-27b-it" ? ["deepinfra"] : undefined,
        },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "structured_response",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed with status ${response.status}.`);
    }
    const parsed = OpenRouterResponseSchema.parse(await response.json());
    const content = parsed.choices[0]?.message.content;
    if (!content?.trim()) throw new Error("OpenRouter returned no message content.");
    return { text: content };
  }
}
