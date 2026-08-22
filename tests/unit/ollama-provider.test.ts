import { describe, expect, it, vi } from "vitest";
import { OllamaProvider } from "../../src/server/inference/ollama-provider";

const validLocalCapsule = JSON.stringify({
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

describe("OllamaProvider", () => {
  it("uses native structured generation and keeps identifiers out of the prompt", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { prompt: string };
      expect(request.prompt).not.toContain("#00-0000");
      return new Response(JSON.stringify({ response: validLocalCapsule }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;
    const provider = new OllamaProvider("http://127.0.0.1:11434", "gemma3:4b", fetcher, 1000);
    const capsule = await provider.extract({
      memory: "I repaired radios near Blk 000 #00-0000 in Queenstown in the 1970s.",
    });
    expect(capsule.place).toBe("Queenstown");
    expect(capsule.containsPII).toBe(true);
    expect(capsule.redactions).toContain("exact address");
    expect(capsule.offers).toEqual([]);
    expect(capsule.wants).toEqual([]);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("keeps an offer only when the participant explicitly volunteers it", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ response: validLocalCapsule }), { status: 200 }),
    ) as typeof fetch;
    const provider = new OllamaProvider("http://127.0.0.1:11434", "gemma3:4b", fetcher, 1000);
    const capsule = await provider.extract({
      memory: "I repaired radios in Queenstown, and I would be happy to teach basic radio repair.",
    });
    expect(capsule.offers).toEqual(["teach radio repair"]);
    expect(capsule.wants).toEqual([]);
  });

  it("repairs invalid JSON once", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: "not-json" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: validLocalCapsule }), { status: 200 })) as typeof fetch;
    const provider = new OllamaProvider("http://127.0.0.1:11434", "gemma3:4b", fetcher, 1000);
    const capsule = await provider.extract({ memory: "A fictional Queenstown radio memory from the 1970s." });
    expect(capsule.skills).toContain("radio repair");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
