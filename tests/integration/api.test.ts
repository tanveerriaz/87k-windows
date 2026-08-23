import { createServer, type Server } from "node:http";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/server/app";
import { readEnv } from "../../src/server/env";
import { MockProvider } from "../../src/server/inference/mock-provider";
import { ProviderBusyError } from "../../src/server/inference/provider";
import type { InferenceProvider } from "../../src/server/inference/provider";
import { StoryMatcher } from "../../src/server/matching/matcher";
import { RoomStore } from "../../src/server/rooms";
import { PREPARED_RADIO_MEMORY } from "../../src/shared/demo";

describe("Express API", () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const env = readEnv({ NODE_ENV: "test", PORT: "3000", MATCH_THRESHOLD: "0.62" });
    const matcher = new StoryMatcher();
    const provider = new MockProvider(0);
    const app = createApp({ env, provider, matcher, rooms: new RoomStore(120, matcher, provider) });
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
    expect(body).toMatchObject({
      status: "ok",
      provider: "mock",
      facilitator: "disabled",
      geminiModel: null,
      mode: "test",
      inference: {
        configured: true,
        selected: "mock",
        fallback: "explicit-process-restart-only",
      },
    });
    expect(JSON.stringify(body)).not.toContain("GEMINI_API_KEY");
  });

  it("reports the routed Gemma and Gemini models without the OpenRouter secret", async () => {
    const routedEnv = readEnv({
      NODE_ENV: "test",
      PORT: "3000",
      INFERENCE_PROVIDER: "openrouter",
      GEMINI_FACILITATOR: "gemini",
      OPENROUTER_API_KEY: "test-openrouter-key",
    });
    const routedMatcher = new StoryMatcher();
    const routedProvider = new MockProvider(0);
    const routedServer = createServer(createApp({
      env: routedEnv,
      provider: routedProvider,
      matcher: routedMatcher,
      rooms: new RoomStore(120, routedMatcher, routedProvider),
    }));
    try {
      await new Promise<void>((resolve) => routedServer.listen(0, "127.0.0.1", resolve));
      const address = routedServer.address();
      if (!address || typeof address === "string") throw new Error("Routed test server did not bind.");
      const response = await fetch(`http://127.0.0.1:${address.port}/health`);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({
        provider: "openrouter",
        facilitator: "gemini",
        gemmaModel: "google/gemma-3-27b-it",
        geminiModel: "google/gemini-3.6-flash",
      });
      expect(JSON.stringify(body)).not.toContain("test-openrouter-key");
    } finally {
      await new Promise<void>((resolve, reject) => routedServer.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("serves the SPA entry from a hidden worktree path", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "87k-hidden-static-"));
    const hiddenRoot = join(temporaryRoot, ".worktree");
    const clientDirectory = join(hiddenRoot, "dist", "client");
    await mkdir(clientDirectory, { recursive: true });
    await writeFile(join(clientDirectory, "index.html"), "<!doctype html><div id=\"root\"></div>");
    const matcher = new StoryMatcher();
    const hiddenProvider = new MockProvider(0);
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(hiddenRoot);
    const hiddenEnv = readEnv({ NODE_ENV: "test", PORT: "3000" });
    const hiddenApp = createApp({ env: hiddenEnv, provider: hiddenProvider, matcher, rooms: new RoomStore(120, matcher, hiddenProvider) });
    cwd.mockRestore();
    const hiddenServer = createServer(hiddenApp);

    try {
      await new Promise<void>((resolve) => hiddenServer.listen(0, "127.0.0.1", resolve));
      const address = hiddenServer.address();
      if (!address || typeof address === "string") throw new Error("Hidden-path server did not bind.");
      const response = await fetch(`http://127.0.0.1:${address.port}/wall/demo87`);
      expect(response.status).toBe(200);
      await expect(response.text()).resolves.toContain("id=\"root\"");
    } finally {
      await new Promise<void>((resolve, reject) => hiddenServer.close((error) => (error ? reject(error) : resolve())));
      await rm(temporaryRoot, { recursive: true, force: true });
    }
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
    expect(extracted.capsuleId).toEqual(expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));

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

  it("returns a recoverable busy response from the shared local provider", async () => {
    const provider: InferenceProvider = {
      extract: vi.fn().mockRejectedValue(new ProviderBusyError()),
    };
    const localEnv = readEnv({ NODE_ENV: "test", PORT: "3000", INFERENCE_PROVIDER: "ollama" });
    const localMatcher = new StoryMatcher();
    const localServer = createServer(createApp({ env: localEnv, provider, matcher: localMatcher, rooms: new RoomStore(120, localMatcher, provider) }));
    await new Promise<void>((resolve) => localServer.listen(0, "127.0.0.1", resolve));
    const address = localServer.address();
    if (!address || typeof address === "string") throw new Error("Local test server did not bind to a TCP port.");
    const localUrl = `http://127.0.0.1:${address.port}`;

    const busy = await fetch(`${localUrl}/api/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: "local87", memory: PREPARED_RADIO_MEMORY }),
    });
    expect(busy.status).toBe(409);
    await expect(busy.json()).resolves.toMatchObject({ code: "LOCAL_GEMMA_BUSY" });
    await new Promise<void>((resolve, reject) => localServer.close((error) => (error ? reject(error) : resolve())));
  });
});
