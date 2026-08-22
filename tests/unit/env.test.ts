import { describe, expect, it } from "vitest";
import { readEnv } from "../../src/server/env";

describe("readEnv", () => {
  it("defaults hosted inference to Gemma 4 and keeps mock key-free", () => {
    expect(readEnv({ NODE_ENV: "test" }).GEMMA_MODEL).toBe("gemma-4-26b-a4b-it");
  });

  it("requires a server-side API key only for hosted Gemma", () => {
    expect(() => readEnv({ NODE_ENV: "test", INFERENCE_PROVIDER: "gemma-api" })).toThrow(/GEMINI_API_KEY/);
    expect(readEnv({ NODE_ENV: "test", INFERENCE_PROVIDER: "gemma-api", GEMINI_API_KEY: "test-key" }).INFERENCE_PROVIDER).toBe("gemma-api");
  });
});
