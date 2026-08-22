import { describe, expect, it } from "vitest";
import { facilitatorPresentation, providerPresentation } from "../../src/client/lib/provider-presentation";

describe("judging provider presentation", () => {
  it("identifies Ollama as the private room-local primary", () => {
    const presentation = providerPresentation("ollama");
    expect(presentation.label).toBe("Local Gemma 3 through Ollama");
    expect(presentation.heading).toContain("raw memory local");
    expect(presentation.detail).toContain("presentation Mac");
    expect(presentation.detail).toContain("install nothing");
    expect(presentation.detail).toContain("trusted private hotspot");
  });

  it("identifies the hosted API as the remote fallback", () => {
    const presentation = providerPresentation("gemma-api");
    expect(presentation.heading).toContain("privacy-layer fallback");
  });

  it("keeps the deterministic provider out of the judging story", () => {
    const presentation = providerPresentation("mock");
    expect(presentation.label).toBe("Development test harness");
    expect(presentation.detail).toContain("never judging");
  });

  it("makes Gemini the senior-facing Track 2 intelligence", () => {
    const presentation = facilitatorPresentation("gemini");
    expect(presentation.label).toContain("Gemini 3.6 Flash");
    expect(presentation.heading).toContain("seniors");
    expect(presentation.detail).toContain("read-aloud questions");
    expect(presentation.detail).toContain("never receives the raw memory");
    expect(presentation.realGemini).toBe(true);
  });
});
