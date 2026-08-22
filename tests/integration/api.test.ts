import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/server/app";
import { readEnv } from "../../src/server/env";
import { buildMockCapsule, MockProvider } from "../../src/server/inference/mock-provider";
import type { InferenceProvider } from "../../src/server/inference/provider";
import { StoryMatcher } from "../../src/server/matching/matcher";
import { PREPARED_RADIO_MEMORY } from "../../src/shared/demo";

describe("Express API", () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const env = readEnv({ NODE_ENV: "test", PORT: "3000", MATCH_THRESHOLD: "0.62" });
    const app = createApp({ env, provider: new MockProvider(0), matcher: new StoryMatcher() });
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port.");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it("reports health without secrets", async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: "ok", provider: "mock", mode: "test" });
    expect(JSON.stringify(body)).not.toContain("GEMINI_API_KEY");
  });

  it("extracts, validates and matches the prepared story", async () => {
    const extraction = await fetch(`${baseUrl}/api/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode: "demo87",
        memory: PREPARED_RADIO_MEMORY,
        fixture: "radio",
      }),
    });
    expect(extraction.status).toBe(200);
    const extracted = await extraction.json();

    const matching = await fetch(`${baseUrl}/api/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capsule: extracted.capsule }),
    });
    expect(matching.status).toBe(200);
    const matched = await matching.json();
    expect(matched.match).toMatchObject({ decision: "MATCH", candidateId: "story-07" });
  });

  it("turns invalid provider output and timeout into recoverable responses", async () => {
    for (const [memory, status, code] of [
      ["INVALID_PROVIDER_JSON fixture", 502, "INVALID_MODEL_OUTPUT"],
      ["CLOUD_TIMEOUT fixture", 504, "PROVIDER_TIMEOUT"],
    ] as const) {
      const response = await fetch(`${baseUrl}/api/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: "demo87", memory }),
      });
      expect(response.status).toBe(status);
      const body = await response.json();
      expect(body.code).toBe(code);
      expect(body.message).toContain("Nothing was shared");
    }
  });

  it("allows only one local Gemma extraction at a time", async () => {
    let releaseExtraction: () => void = () => undefined;
    const provider: InferenceProvider = {
      extract: vi.fn(async () => {
        await new Promise<void>((resolve) => { releaseExtraction = resolve; });
        return buildMockCapsule({ memory: PREPARED_RADIO_MEMORY, fixture: "radio" });
      }),
    };
    const localEnv = readEnv({ NODE_ENV: "test", PORT: "3000", INFERENCE_PROVIDER: "ollama" });
    const localServer = createServer(createApp({ env: localEnv, provider, matcher: new StoryMatcher() }));
    await new Promise<void>((resolve) => localServer.listen(0, "127.0.0.1", resolve));
    const address = localServer.address();
    if (!address || typeof address === "string") throw new Error("Local test server did not bind to a TCP port.");
    const localUrl = `http://127.0.0.1:${address.port}`;

    const first = fetch(`${localUrl}/api/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: "local87", memory: PREPARED_RADIO_MEMORY }),
    });
    await vi.waitFor(() => expect(provider.extract).toHaveBeenCalledOnce());

    const busy = await fetch(`${localUrl}/api/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: "local87", memory: PREPARED_RADIO_MEMORY }),
    });
    expect(busy.status).toBe(409);
    await expect(busy.json()).resolves.toMatchObject({ code: "LOCAL_GEMMA_BUSY" });

    releaseExtraction();
    await expect(first.then((response) => response.status)).resolves.toBe(200);
    await new Promise<void>((resolve, reject) => localServer.close((error) => (error ? reject(error) : resolve())));
  });
});
