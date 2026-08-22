import { describe, expect, it } from "vitest";
import { readEnv } from "../../src/server/env";

describe("readEnv", () => {
  it("defaults hosted inference to Gemma 4 and leaves Gemini facilitation disabled", () => {
    expect(readEnv({ NODE_ENV: "test" })).toMatchObject({
      GEMMA_MODEL: "gemma-4-26b-a4b-it",
      GEMINI_FACILITATOR: "disabled",
      GEMINI_MODEL: "gemini-3.6-flash",
    });
  });

  it("requires a server-side API key for hosted Gemma or Gemini facilitation", () => {
    expect(() => readEnv({ NODE_ENV: "test", INFERENCE_PROVIDER: "gemma-api" })).toThrow(/GEMINI_API_KEY/);
    expect(readEnv({ NODE_ENV: "test", INFERENCE_PROVIDER: "gemma-api", GEMINI_API_KEY: "test-key" }).INFERENCE_PROVIDER).toBe("gemma-api");
    expect(() => readEnv({ NODE_ENV: "test", INFERENCE_PROVIDER: "ollama", GEMINI_FACILITATOR: "gemini" })).toThrow(/GEMINI_API_KEY/);
    expect(readEnv({
      NODE_ENV: "test",
      INFERENCE_PROVIDER: "ollama",
      GEMINI_FACILITATOR: "gemini",
      GEMINI_API_KEY: "test-key",
    })).toMatchObject({ INFERENCE_PROVIDER: "ollama", GEMINI_FACILITATOR: "gemini" });
  });

  it("requires a server-side OpenRouter key and defaults both routed model slugs", () => {
    expect(() => readEnv({ NODE_ENV: "test", INFERENCE_PROVIDER: "openrouter" })).toThrow(/OPENROUTER_API_KEY/);
    expect(readEnv({
      NODE_ENV: "test",
      INFERENCE_PROVIDER: "openrouter",
      GEMINI_FACILITATOR: "gemini",
      OPENROUTER_API_KEY: "test-key",
    })).toMatchObject({
      INFERENCE_PROVIDER: "openrouter",
      GEMINI_FACILITATOR: "gemini",
      OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
      OPENROUTER_GEMMA_MODEL: "google/gemma-3-27b-it",
      OPENROUTER_GEMINI_MODEL: "google/gemini-3.6-flash",
      GEMINI_API_KEY: "",
    });
  });
});
