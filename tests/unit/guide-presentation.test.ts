import { describe, expect, it } from "vitest";
import { resolveGuidePresentation } from "../../src/client/lib/guide-presentation";
import type { SeniorBridge } from "../../src/shared/schemas";

function guide(overrides: Partial<SeniorBridge> = {}): SeniorBridge {
  return {
    language: "zh",
    introduction: "你们都有一段关于收音机的故事。",
    questions: ["你愿意分享是什么让收音机让人难忘吗？", "你想听听对方希望学到什么吗？"],
    consentReminder: "任何一方都可以随时暂停或停止。",
    ...overrides,
  };
}

const ENGLISH_FALLBACK = {
  introduction: "You both have a radio story to explore.",
  questions: ["Would you like to share what made radios memorable?", "Would you like to hear what they hope to learn?"],
} satisfies NonNullable<SeniorBridge["englishFallback"]>;

describe("resolveGuidePresentation", () => {
  it("returns an empty presentation when there is no guide", () => {
    expect(resolveGuidePresentation(null, "zh")).toEqual({
      showEnglishFallback: false,
      readingLang: null,
      spokenText: null,
    });
    expect(resolveGuidePresentation(undefined, "en").readingLang).toBeNull();
  });

  it("shows no fallback to a viewer who shares the guide's language", () => {
    const result = resolveGuidePresentation(guide({ englishFallback: ENGLISH_FALLBACK }), "zh");

    expect(result.showEnglishFallback).toBe(false);
    expect(result.readingLang).toBe("zh");
    expect(result.spokenText).toContain("你们都有一段关于收音机的故事。");
    expect(result.spokenText).not.toContain("You both have a radio story");
  });

  it("shows the fallback to a viewer whose language differs and reads it in English", () => {
    const result = resolveGuidePresentation(guide({ englishFallback: ENGLISH_FALLBACK }), "en");

    expect(result.showEnglishFallback).toBe(true);
    expect(result.readingLang).toBe("en");
    expect(result.spokenText).toBe(
      "You both have a radio story to explore. Would you like to share what made radios memorable? Would you like to hear what they hope to learn?",
    );
  });

  it("shows the fallback to any non-matching viewer language, not just English viewers", () => {
    for (const viewer of ["en", "ms", "ta"] as const) {
      const result = resolveGuidePresentation(guide({ englishFallback: ENGLISH_FALLBACK }), viewer);
      expect(result.showEnglishFallback).toBe(true);
      expect(result.readingLang).toBe("en");
    }
  });

  it("keeps the guide readable in its own language when languages differ but no fallback was supplied", () => {
    const result = resolveGuidePresentation(guide(), "en");

    expect(result.showEnglishFallback).toBe(false);
    expect(result.readingLang).toBe("zh");
    expect(result.spokenText).toContain("你们都有一段关于收音机的故事。");
  });

  it("reads the consent reminder aloud in the guide's own language but omits it from the English fallback", () => {
    const own = resolveGuidePresentation(guide(), "zh");
    const fallback = resolveGuidePresentation(guide({ englishFallback: ENGLISH_FALLBACK }), "en");

    expect(own.spokenText).toContain("任何一方都可以随时暂停或停止。");
    // The schema requests only an introduction and two questions for the
    // fallback, so there is no English consent reminder to speak.
    expect(fallback.spokenText).not.toContain("任何一方都可以随时暂停或停止。");
  });

  it("speaks the introduction, both questions and the reminder in order", () => {
    const result = resolveGuidePresentation(
      guide({ language: "en", introduction: "Intro.", questions: ["Q1?", "Q2?"], consentReminder: "Reminder." }),
      "en",
    );

    expect(result.spokenText).toBe("Intro. Q1? Q2? Reminder.");
  });

  it("treats an English guide viewed by an English speaker as needing no fallback", () => {
    const result = resolveGuidePresentation(guide({ language: "en", englishFallback: ENGLISH_FALLBACK }), "en");

    expect(result.showEnglishFallback).toBe(false);
    expect(result.readingLang).toBe("en");
  });
});
