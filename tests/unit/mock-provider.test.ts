import { describe, expect, it } from "vitest";
import { buildMockCapsule, MockProvider } from "../../src/server/inference/mock-provider";
import { ProviderOutputError, ProviderTimeoutError } from "../../src/server/inference/provider";
import { PREPARED_RADIO_MEMORY } from "../../src/shared/demo";

describe("MockProvider", () => {
  it("creates the deterministic Queenstown radio capsule", () => {
    const capsule = buildMockCapsule({ memory: PREPARED_RADIO_MEMORY });
    expect(capsule.place).toBe("Queenstown");
    expect(capsule.era).toBe("1970s");
    expect(capsule.skills).toContain("radio repair");
    expect(capsule.containsPII).toBe(false);
  });

  it("flags PII on the capsule via the shared redaction module", () => {
    const capsule = buildMockCapsule({
      memory: "My name is Fictional Tester. I lived at Blk 000 #00-0000. Call 8000 0000 about Queenstown radios.",
    });
    expect(capsule.containsPII).toBe(true);
    expect(capsule.redactions).toEqual(expect.arrayContaining(["name", "exact address", "phone number"]));
  });

  it("exposes recoverable invalid-output and timeout fixtures", async () => {
    const provider = new MockProvider(0);
    await expect(provider.extract({ memory: "INVALID_PROVIDER_JSON fixture" })).rejects.toBeInstanceOf(ProviderOutputError);
    await expect(provider.extract({ memory: "CLOUD_TIMEOUT fixture" })).rejects.toBeInstanceOf(ProviderTimeoutError);
  });
});
