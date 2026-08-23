import { describe, expect, it } from "vitest";
import { canReadAloud, pickVoice } from "../../src/client/lib/voice-picker";

type StubVoice = { lang: string; localService: boolean };

function voice(lang: string, localService = true): StubVoice {
  return { lang, localService };
}

describe("pickVoice", () => {
  it("prefers an exact locale match over any other candidate", () => {
    const voices = [voice("zh-TW"), voice("zh-CN"), voice("zh-SG")];
    expect(pickVoice(voices, "zh-SG")).toEqual(voice("zh-SG"));
  });

  it("falls back from zh-SG to zh-CN when the exact region is missing", () => {
    const voices = [voice("en-US"), voice("zh-CN")];
    expect(pickVoice(voices, "zh-SG")).toEqual(voice("zh-CN"));
  });

  it("falls back from ta-SG to ta-IN when the exact region is missing", () => {
    const voices = [voice("ta-IN")];
    expect(pickVoice(voices, "ta-SG")).toEqual(voice("ta-IN"));
  });

  it("prefers the regional fallback over an unrelated same-language variant", () => {
    const voices = [voice("zh-TW", true), voice("zh-CN", false)];
    expect(pickVoice(voices, "zh-SG")).toEqual(voice("zh-CN", false));
  });

  it("falls back to any same-language voice when no exact or regional-fallback match exists", () => {
    const voices = [voice("en-GB")];
    expect(pickVoice(voices, "en-SG")).toEqual(voice("en-GB"));
  });

  it("prefers a localService voice within the same-language tier", () => {
    const voices = [voice("zh-TW", false), voice("zh-HK", true)];
    expect(pickVoice(voices, "zh-SG")).toEqual(voice("zh-HK", true));
  });

  it("prefers a localService voice within the exact-match tier", () => {
    const voices = [voice("zh-SG", false), voice("zh-SG", true)];
    expect(pickVoice(voices, "zh-SG")).toEqual(voice("zh-SG", true));
  });

  it("returns null when no voice matches at any tier", () => {
    const voices = [voice("fr-FR")];
    expect(pickVoice(voices, "ta-SG")).toBeNull();
  });

  it("returns null for an empty voice list", () => {
    expect(pickVoice([], "en-SG")).toBeNull();
  });

  it("matches locale case-insensitively", () => {
    const voices = [voice("ZH-cn")];
    expect(pickVoice(voices, "zh-SG")).toEqual(voice("ZH-cn"));
  });
});

describe("canReadAloud", () => {
  it("is true when pickVoice would resolve a voice", () => {
    expect(canReadAloud([voice("ms-MY")], "ms-MY")).toBe(true);
  });

  it("is false when pickVoice would return null — the hidden-button contract", () => {
    expect(canReadAloud([voice("fr-FR")], "ta-SG")).toBe(false);
  });

  it("is false for an empty voice list", () => {
    expect(canReadAloud([], "en-SG")).toBe(false);
  });
});
