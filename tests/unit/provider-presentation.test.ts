import { describe, expect, it } from "vitest";
import { providerPresentation } from "../../src/client/lib/provider-presentation";

describe("judging provider presentation", () => {
  it("identifies Ollama as the private room-local primary", () => {
    const presentation = providerPresentation("ollama");
    expect(presentation.label).toBe("Local Gemma 3 through Ollama");
    expect(presentation.heading).toContain("room's judging model");
    expect(presentation.detail).toContain("presentation Mac");
    expect(presentation.detail).toContain("install nothing");
  });

  it("identifies the hosted API as the remote fallback", () => {
    const presentation = providerPresentation("gemma-api");
    expect(presentation.heading).toContain("hosted fallback");
  });

  it("keeps the deterministic provider out of the judging story", () => {
    const presentation = providerPresentation("mock");
    expect(presentation.label).toBe("Development test harness");
    expect(presentation.detail).toContain("never judging");
  });
});
