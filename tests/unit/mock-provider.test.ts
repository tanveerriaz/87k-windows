import { describe, expect, it } from "vitest";
import { buildMockCapsule, MockProvider, redactMemory } from "../../src/server/inference/mock-provider";
import { ProviderOutputError, ProviderTimeoutError } from "../../src/server/inference/provider";

describe("MockProvider", () => {
  it("creates the deterministic Queenstown radio capsule", () => {
    const capsule = buildMockCapsule({ memory: "I used to repair radios around Queenstown in the 1970s." });
    expect(capsule.place).toBe("Queenstown");
    expect(capsule.era).toBe("1970s");
    expect(capsule.skills).toContain("radio repair");
    expect(capsule.containsPII).toBe(false);
  });

  it("redacts a name, exact address and phone number before preview", () => {
    const source = "My name is Fictional Tester. I lived at Blk 000 #00-0000. Call 8000 0000 about Queenstown radios.";
    const redacted = redactMemory(source);
    expect(redacted.containsPII).toBe(true);
    expect(redacted.redactions).toEqual(expect.arrayContaining(["name", "exact address", "phone number"]));
    expect(redacted.safeText).not.toContain("Fictional Tester");
    expect(redacted.safeText).not.toContain("#00-0000");
    expect(redacted.safeText).not.toContain("8000 0000");
  });

  it("exposes recoverable invalid-output and timeout fixtures", async () => {
    const provider = new MockProvider(0);
    await expect(provider.extract({ memory: "INVALID_PROVIDER_JSON fixture" })).rejects.toBeInstanceOf(ProviderOutputError);
    await expect(provider.extract({ memory: "CLOUD_TIMEOUT fixture" })).rejects.toBeInstanceOf(ProviderTimeoutError);
  });
});
