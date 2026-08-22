import { describe, expect, it, vi } from "vitest";
import { GemmaApiProvider, type GemmaApiClient } from "../../src/server/inference/gemma-api-provider";
import { ProviderOutputError, ProviderTimeoutError } from "../../src/server/inference/provider";

const validCapsule = JSON.stringify({
  observed: ["memory text about a radio"],
  place: "Queenstown",
  era: "1970s",
  skills: ["radio repair"],
  interests: ["electronics"],
  offers: ["teach radio repair"],
  wants: ["meet a learner"],
  safeSummary: "A fictional Queenstown radio-repair memory from the 1970s.",
  containsPII: false,
  redactions: [],
  uncertain: [],
});

function clientWith(generateContent: GemmaApiClient["models"]["generateContent"]): GemmaApiClient {
  return { models: { generateContent } };
}

describe("GemmaApiProvider", () => {
  it("redacts identifiers before hosted inference and requests schema-constrained JSON", async () => {
    const generateContent = vi.fn(async (request) => {
      expect(String(request.contents)).not.toContain("#00-0000");
      expect(String(request.contents)).toContain("Never turn an activity into an occupation");
      expect(request.model).toBe("gemma-4-26b-a4b-it");
      expect(request.config).toMatchObject({ responseMimeType: "application/json", temperature: 0.1 });
      return { text: validCapsule };
    });
    const provider = new GemmaApiProvider("test-key", "gemma-4-26b-a4b-it", clientWith(generateContent));
    const capsule = await provider.extract({ memory: "I repaired radios near Blk 000 #00-0000 in Queenstown in the 1970s." });
    expect(capsule.containsPII).toBe(true);
    expect(capsule.redactions).toContain("exact address");
    expect(capsule.offers).toEqual([]);
    expect(generateContent).toHaveBeenCalledOnce();
  });

  it("keeps only explicit offers and wants from the person's own words", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: validCapsule });
    const provider = new GemmaApiProvider("test-key", "gemma-4-26b-a4b-it", clientWith(generateContent));
    const capsule = await provider.extract({ memory: "I can teach radio repair and I want to learn how to restore old speakers." });
    expect(capsule.offers).toEqual(["teach radio repair"]);
    expect(capsule.wants).toEqual(["meet a learner"]);
  });

  it("accepts markdown-fenced capsule JSON from a listening request", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: `\`\`\`json\n${validCapsule}\n\`\`\`` });
    const provider = new GemmaApiProvider("test-key", "gemma-4-26b-a4b-it", clientWith(generateContent));
    const capsule = await provider.extract({
      memory: "I can listen in English. I can offer one short conversation this week. I want to learn radio repair.",
    });
    expect(capsule.safeSummary).toContain("radio-repair");
    expect(generateContent).toHaveBeenCalledOnce();
  });

  it("coerces omitted place and era to null instead of failing the capsule", async () => {
    const incomplete = JSON.parse(validCapsule) as Record<string, unknown>;
    delete incomplete.place;
    delete incomplete.era;
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(incomplete) });
    const provider = new GemmaApiProvider("test-key", "gemma-4-26b-a4b-it", clientWith(generateContent));
    await expect(provider.extract({ memory: "I want to learn radio repair." })).resolves.toMatchObject({
      place: null,
      era: null,
    });
  });

  it("repairs invalid output once without asking for chain-of-thought", async () => {
    const generateContent = vi.fn()
      .mockResolvedValueOnce({ text: "not-json" })
      .mockResolvedValueOnce({ text: validCapsule });
    const provider = new GemmaApiProvider("test-key", "gemma-4-26b-a4b-it", clientWith(generateContent));
    await expect(provider.extract({ memory: "A fictional radio memory from Queenstown." })).resolves.toMatchObject({ place: "Queenstown" });
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(generateContent.mock.calls)).not.toContain("chain-of-thought");
  });

  it("maps aborts and repeated invalid output to safe provider errors", async () => {
    const aborted = new Error("aborted");
    aborted.name = "AbortError";
    const timeoutProvider = new GemmaApiProvider("test-key", "model", clientWith(vi.fn().mockRejectedValue(aborted)));
    await expect(timeoutProvider.extract({ memory: "A long enough fictional memory." })).rejects.toBeInstanceOf(ProviderTimeoutError);

    const invalidProvider = new GemmaApiProvider("test-key", "model", clientWith(vi.fn().mockResolvedValue({ text: "{}" })));
    await expect(invalidProvider.extract({ memory: "A long enough fictional memory." })).rejects.toBeInstanceOf(ProviderOutputError);
  });
});
