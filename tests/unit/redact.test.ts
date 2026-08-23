import { describe, expect, it } from "vitest";
import { redactMemory, unionRedactionVerdicts } from "../../src/server/privacy/redact";

describe("redactMemory", () => {
  it("redacts a name, exact address and phone number before preview", () => {
    const source = "My name is Fictional Tester. I lived at Blk 000 #00-0000. Call 8000 0000 about Queenstown radios.";
    const redacted = redactMemory(source);
    expect(redacted.containsPII).toBe(true);
    expect(redacted.redactions).toEqual(expect.arrayContaining(["name", "exact address", "phone number"]));
    expect(redacted.safeText).not.toContain("Fictional Tester");
    expect(redacted.safeText).not.toContain("#00-0000");
    expect(redacted.safeText).not.toContain("8000 0000");
  });

  it("redacts an email address, a web link and a postal code before preview", () => {
    const source = "Reach me at fictional.tester@example.com or www.example.com/profile, Singapore 123456.";
    const redacted = redactMemory(source);
    expect(redacted.containsPII).toBe(true);
    expect(redacted.redactions).toEqual(expect.arrayContaining(["email address", "web link", "postal code"]));
    expect(redacted.safeText).not.toContain("fictional.tester@example.com");
    expect(redacted.safeText).not.toContain("www.example.com/profile");
    expect(redacted.safeText).not.toContain("123456");
  });

  it("leaves ordinary text with no PII untouched", () => {
    const source = "I repaired radios in Queenstown in the 1970s.";
    const redacted = redactMemory(source);
    expect(redacted.containsPII).toBe(false);
    expect(redacted.redactions).toEqual([]);
    expect(redacted.safeText).toBe(source);
  });
});

describe("unionRedactionVerdicts", () => {
  it("keeps a model-flagged verdict even when the regex scan finds nothing", () => {
    const regexResult = { containsPII: false, redactions: [] };
    const merged = unionRedactionVerdicts(regexResult, true, ["inferred identity clue"]);
    expect(merged.containsPII).toBe(true);
    expect(merged.redactions).toEqual(["inferred identity clue"]);
  });

  it("keeps a regex-flagged verdict even when the model reports none", () => {
    const regexResult = { containsPII: true, redactions: ["phone number"] };
    const merged = unionRedactionVerdicts(regexResult, false, []);
    expect(merged.containsPII).toBe(true);
    expect(merged.redactions).toEqual(["phone number"]);
  });

  it("de-duplicates overlapping redaction labels and ignores non-string model entries", () => {
    const regexResult = { containsPII: true, redactions: ["phone number"] };
    const merged = unionRedactionVerdicts(regexResult, true, ["phone number", "name", 42, null]);
    expect(merged.redactions.sort()).toEqual(["name", "phone number"]);
  });

  it("tolerates a model verdict that is not a boolean or an array", () => {
    const regexResult = { containsPII: false, redactions: [] };
    const merged = unionRedactionVerdicts(regexResult, "yes", "not-an-array");
    expect(merged.containsPII).toBe(true);
    expect(merged.redactions).toEqual([]);
  });
});
