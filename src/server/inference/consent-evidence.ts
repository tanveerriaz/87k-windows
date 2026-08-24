import type { Language } from "../../shared/schemas";

const EXPLICIT_OFFER_EN = /\b(i can|i could|i would be happy to|i am happy to|i'm happy to|i am willing to|i'm willing to|i can teach|i can share|i can show|i can help)\b/i;
const EXPLICIT_WANT_EN = /\b(i want|i wish|i hope|i would like|i'm looking for|i am looking for|i miss|i want to learn)\b/i;

// TRANSLATION REVIEW: machine-drafted, needs native check.
// 我想 and 我希望 were dropped: 我想 alone also means "I think" (QA F1: "我想
// 那是1970年代" leaked as a want), and bare 我希望 matches any well-wish, not
// specifically a wish to connect (QA F1: "我希望他好" leaked). 我想要 is more
// specific to "want [something]" and less likely to read as "I think".
const EXPLICIT_OFFER_ZH = ["我愿意", "我可以", "愿意教"];
const EXPLICIT_WANT_ZH = ["我想要", "想学"];
// Chinese negates by inserting a negator immediately before the verb, so a
// curated phrase like 愿意教 still occurs as a substring of 不愿意教 — the
// veto must reject a match with one of these immediately before it.
const ZH_NEGATORS = ["不", "没", "别", "未", "无"];

// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_OFFER_MS = /\b(saya boleh|saya sudi|saya sanggup)\b/i;
// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_WANT_MS = /\b(saya mahu|saya ingin|saya berharap)\b/i;

// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_OFFER_TA = ["நான் கற்பிக்க தயார்", "நான் உதவ முடியும்", "நான் பகிர தயார்"];
// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_WANT_TA = ["நான் கற்க விரும்புகிறேன்", "நான் விரும்புகிறேன்", "எனக்கு ஆசை"];
// Tamil negates clause-finally (a verb suffixed with …வில்லை, e.g.
// நினைக்கவில்லை "did not think", சொல்லவில்லை "did not say"), after the
// matched phrase has already occurred, not immediately before it — so the
// zh "check the preceding character" approach doesn't apply here. Instead,
// reject a match if its own clause (up to the next sentence boundary) also
// contains a negation marker. Two distinct forms: the verb suffix "வில்லை"
// (consonant + dependent vowel sign, U+0BB5 U+0BBF…) and the standalone
// negator "இல்லை" (independent vowel, U+0B87…) — these are different
// Unicode sequences despite looking similar, so both are checked.
const TA_NEGATION_MARKERS = ["வில்லை", "இல்லை"];
const SENTENCE_BOUNDARY = /[.!?।]/;

/** True if `phrase` occurs in `memory` at least once with no zh negator immediately before it. */
function zhPhraseHoldsUnnegated(memory: string, phrase: string): boolean {
  let from = 0;
  for (;;) {
    const index = memory.indexOf(phrase, from);
    if (index === -1) return false;
    const precedingChar = memory[index - 1];
    if (precedingChar === undefined || !ZH_NEGATORS.includes(precedingChar)) return true;
    from = index + 1;
  }
}

/** True if `phrase` occurs in `memory` at least once whose containing clause has no …இல்லை negation after it. */
function taPhraseHoldsUnnegated(memory: string, phrase: string): boolean {
  let from = 0;
  for (;;) {
    const index = memory.indexOf(phrase, from);
    if (index === -1) return false;
    const matchEnd = index + phrase.length;
    const rest = memory.slice(matchEnd);
    const boundaryOffset = rest.search(SENTENCE_BOUNDARY);
    const clauseTail = boundaryOffset === -1 ? rest : rest.slice(0, boundaryOffset);
    if (!TA_NEGATION_MARKERS.some((marker) => clauseTail.includes(marker))) return true;
    from = index + 1;
  }
}

function anyZh(memory: string, phrases: string[]): boolean {
  return phrases.some((phrase) => zhPhraseHoldsUnnegated(memory, phrase));
}

function anyTa(memory: string, phrases: string[]): boolean {
  return phrases.some((phrase) => taPhraseHoldsUnnegated(memory, phrase));
}

/**
 * A deterministic veto the model cannot talk past: offers/wants only
 * survive when the RAW memory contains one of a curated, per-language,
 * high-confidence explicit-consent phrase — regardless of what the model
 * itself extracted. zh and ta additionally reject a negated occurrence
 * (see QA report F1) rather than trusting any substring match.
 */
export function keepExplicitConsent(memory: string, offers: unknown, wants: unknown, language: Language = "en") {
  if (language === "zh") {
    return {
      offers: anyZh(memory, EXPLICIT_OFFER_ZH) ? offers : [],
      wants: anyZh(memory, EXPLICIT_WANT_ZH) ? wants : [],
    };
  }
  if (language === "ta") {
    return {
      offers: anyTa(memory, EXPLICIT_OFFER_TA) ? offers : [],
      wants: anyTa(memory, EXPLICIT_WANT_TA) ? wants : [],
    };
  }
  const offerPattern = language === "ms" ? EXPLICIT_OFFER_MS : EXPLICIT_OFFER_EN;
  const wantPattern = language === "ms" ? EXPLICIT_WANT_MS : EXPLICIT_WANT_EN;
  return {
    offers: offerPattern.test(memory) ? offers : [],
    wants: wantPattern.test(memory) ? wants : [],
  };
}
