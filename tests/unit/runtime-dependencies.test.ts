import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultDependencies } from "../../src/server/app";
import { readEnv } from "../../src/server/env";
import { PREPARED_RADIO_MEMORY } from "../../src/shared/demo";

const capsuleOutput = {
  observed: ["repairing radios", "Queenstown", "1970s"],
  place: "Queenstown",
  era: "1970s",
  skills: ["radio repair"],
  interests: ["old radios"],
  offers: ["teach basic radio repair"],
  wants: [],
  safeSummary: "A memory of repairing radios in Queenstown in the 1970s, with an offer to share the skill.",
  containsPII: false,
  redactions: [],
  uncertain: [],
};

const guideOutput = {
  introduction: "You both have a Queenstown radio story to explore.",
  questions: [
    "Would you like to share what made radios memorable?",
    "Would you like to hear what the other person hopes to learn?",
  ],
  consentReminder: "Either person may pause or stop at any time.",
};

describe("OpenRouter runtime dependencies", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("routes Gemma extraction and post-match Gemini facilitation through one server-side adapter", async () => {
    const requests: Array<Record<string, unknown>> = [];
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      requests.push(body);
      const content = body.model === "google/gemma-3-27b-it" ? capsuleOutput : guideOutput;
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetcher);
    const env = readEnv({
      NODE_ENV: "test",
      INFERENCE_PROVIDER: "openrouter",
      GEMINI_FACILITATOR: "gemini",
      OPENROUTER_API_KEY: "test-key",
    });

    const dependencies = defaultDependencies(env);
    const capsule = await dependencies.provider.extract({ memory: PREPARED_RADIO_MEMORY });
    const match = dependencies.matcher.match(capsule);
    expect(match.decision).toBe("MATCH");
    const candidate = match.candidateId ? dependencies.matcher.getStory(match.candidateId) : undefined;
    expect(candidate).toBeDefined();
    const guide = await dependencies.facilitator.createGuide({ source: capsule, candidate: candidate!, match });

    expect(guide.questions).toHaveLength(2);
    expect(requests.map((request) => request.model)).toEqual([
      "google/gemma-3-27b-it",
      "google/gemini-3.6-flash",
    ]);
    expect(JSON.stringify(requests[0])).not.toContain("test-key");
    expect(dependencies.facilitator.mode).toBe("gemini");
  });
});
