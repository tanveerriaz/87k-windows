import type { SeniorBridge } from "../../shared/schemas";
import type { Lang } from "./i18n";

export type GuidePresentation = {
  /** Render the English fallback block beneath the guide. */
  showEnglishFallback: boolean;
  /** Language the guide should be read aloud in, or null when there is no guide. */
  readingLang: Lang | null;
  /** Exact text read aloud, or null when there is no guide. */
  spokenText: string | null;
};

/**
 * Decides what a viewer sees and hears for a guide written in the
 * storyteller's language.
 *
 * The guide itself is always written in the storyteller's language. A viewer
 * whose own language matches reads it directly. A viewer whose language
 * differs reads the English fallback — but only when the facilitator actually
 * supplied one, since it is requested only for cross-language pairs. When the
 * languages differ and no fallback exists, the guide is still shown and read
 * in its own language rather than hidden.
 */
export function resolveGuidePresentation(guide: SeniorBridge | null | undefined, viewerLang: Lang): GuidePresentation {
  if (!guide) {
    return { showEnglishFallback: false, readingLang: null, spokenText: null };
  }

  const showEnglishFallback = guide.language !== viewerLang && guide.englishFallback !== undefined;
  const readingLang: Lang = showEnglishFallback ? "en" : guide.language;
  const spokenText = showEnglishFallback && guide.englishFallback
    ? [guide.englishFallback.introduction, ...guide.englishFallback.questions].join(" ")
    : [guide.introduction, ...guide.questions, guide.consentReminder].join(" ");

  return { showEnglishFallback, readingLang, spokenText };
}
