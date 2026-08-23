import { afterEach, describe, expect, it, vi } from "vitest";
import { extractCapsule } from "../../src/client/lib/api";

describe("extractCapsule error handling", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps a non-JSON 503 body to a friendly message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<!doctype html>", { status: 503 })));
    await expect(extractCapsule({ roomCode: "demo87", memory: "m".repeat(20), photoData: null })).rejects.toThrow(/couldn't reach|try again/i);
  });

  it("surfaces LOCAL_GEMMA_BUSY as a retryable message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ code: "LOCAL_GEMMA_BUSY", message: "busy" }, { status: 409 })));
    await expect(extractCapsule({ roomCode: "demo87", memory: "m".repeat(20), photoData: null })).rejects.toMatchObject({ code: "LOCAL_GEMMA_BUSY" });
  });
});
