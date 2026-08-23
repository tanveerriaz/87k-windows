import { describe, expect, it, vi } from "vitest";
import { OpenRouterGenAiClient } from "../../src/server/openrouter-client";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["safeSummary"],
  properties: { safeSummary: { type: "string" } },
} as const;

function request() {
  return {
    model: "google/gemma-3-27b-it",
    contents: "Prepare a safe capsule.",
    config: {
      temperature: 0.1,
      maxOutputTokens: 1200,
      responseMimeType: "application/json",
      responseJsonSchema: responseSchema,
      abortSignal: AbortSignal.timeout(1_000),
    },
  };
}

describe("OpenRouterGenAiClient", () => {
  it("translates a structured generation request into an authenticated chat completion", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{\"safeSummary\":\"A memory of radio repair.\"}" } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const client = new OpenRouterGenAiClient("https://openrouter.ai/api/v1/", "test-key", fetcher);
    const generatedRequest = request();

    await expect(client.models.generateContent(generatedRequest)).resolves.toEqual({
      text: "{\"safeSummary\":\"A memory of radio repair.\"}",
    });

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
      "X-Title": "87K Windows",
    });
    expect(init?.signal).toBe(generatedRequest.config.abortSignal);
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "google/gemma-3-27b-it",
      messages: [{ role: "user", content: "Prepare a safe capsule." }],
      temperature: 0.1,
      max_tokens: 1200,
      stream: false,
      provider: { require_parameters: true, order: ["deepinfra"] },
      response_format: {
        type: "json_schema",
        json_schema: { name: "structured_response", strict: true, schema: responseSchema },
      },
    });
  });

  it("fails safely for upstream errors or missing message content", async () => {
    const rejected = new OpenRouterGenAiClient(
      "https://openrouter.ai/api/v1",
      "test-key",
      vi.fn<typeof fetch>().mockResolvedValue(new Response("billing detail must not be surfaced", { status: 402 })),
    );
    await expect(rejected.models.generateContent(request())).rejects.toThrow("OpenRouter request failed with status 402");

    const empty = new OpenRouterGenAiClient(
      "https://openrouter.ai/api/v1",
      "test-key",
      vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [] }), { status: 200 })),
    );
    await expect(empty.models.generateContent(request())).rejects.toThrow("OpenRouter returned no message content");
  });

  it("keeps mandatory Gemini reasoning minimal so the short guide fits its output budget", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{\"introduction\":\"Hello\"}" } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const client = new OpenRouterGenAiClient("https://openrouter.ai/api/v1", "test-key", fetcher);

    await client.models.generateContent({ ...request(), model: "google/gemini-3.6-flash" });

    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(body.reasoning).toEqual({ effort: "minimal", exclude: true });
  });

  it("preserves abort errors for the provider timeout mapping", async () => {
    const aborted = new Error("aborted");
    aborted.name = "AbortError";
    const client = new OpenRouterGenAiClient(
      "https://openrouter.ai/api/v1",
      "test-key",
      vi.fn<typeof fetch>().mockRejectedValue(aborted),
    );
    await expect(client.models.generateContent(request())).rejects.toBe(aborted);
  });
});
