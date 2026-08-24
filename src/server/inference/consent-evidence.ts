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
// Chinese negates by inserting a negator immediately before the verb, and a
// negator need not be the immediate preceding character — clause-medial
// insertions (我不 愿意教别人 with a space, 我不，愿意教别人 with a comma) and
// compound negators (我不是很愿意教别人) still negate a phrase several
// characters away. The veto therefore rejects if ANY negator appears
// anywhere between the previous sentence boundary and the match — commas
// and spaces do not stop the scan, only 。！？.!? do. This is deliberately
// fail-closed: a negator earlier in the same clause for an unrelated
// reason (e.g. "别人不知道，我愿意教别人") will also reject a genuine offer.
// That false-rejection is an accepted trade-off in exchange for closing
// the negation bypasses above.
const ZH_NEGATORS = ["不", "没", "未", "无", "甭", "勿", "莫", "并非", "不是", "毫无"];
// "别" alone means "don't" (a negator) but is also the first character of
// "别人" ("other people"), which is the object of nearly every curated
// offer phrase's natural phrasing ("愿意教别人" = "willing to teach
// others"). Counting "别人" itself as a negator hit would reject the
// curated phrases against their own ordinary use, so "别" only counts as a
// negator when NOT immediately followed by "人".
const ZH_BIE_NEGATOR = /别(?!人)/;
const ZH_SENTENCE_BOUNDARY = /[。！？.!?]/;

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
// zh "scan before the match" approach doesn't apply here. Reject a match
// if its own clause (up to the next sentence boundary) contains a negation
// marker, AND also reject if the immediately following sentence contains
// one — a dangling negation ("நான் விரும்புகிறேன். ஆனால் இல்லை." — "I want
// to. But no.") negates the previous sentence's claim from outside its own
// clause. This is deliberately fail-closed: an unrelated negation in the
// following sentence will also reject a genuine want/offer, an accepted
// trade-off for closing the dangling-negation bypass. Two distinct marker
// forms: the verb suffix "வில்லை" (consonant + dependent vowel sign,
// U+0BB5 U+0BBF…) and the standalone negator "இல்லை" (independent vowel,
// U+0B87…) — these are different Unicode sequences despite looking
// similar, so both are checked.
const TA_NEGATION_MARKERS = ["வில்லை", "இல்லை"];
const SENTENCE_BOUNDARY = /[.!?।]/;

function zhClauseBeforeHasNegator(memory: string, matchIndex: number): boolean {
  let boundary = -1;
  for (let i = 0; i < matchIndex; i++) {
    if (ZH_SENTENCE_BOUNDARY.test(memory[i])) boundary = i;
  }
  const span = memory.slice(boundary + 1, matchIndex);
  return ZH_NEGATORS.some((negator) => span.includes(negator)) || ZH_BIE_NEGATOR.test(span);
}

/** True if `phrase` occurs in `memory` at least once with no zh negator anywhere earlier in its clause. */
function zhPhraseHoldsUnnegated(memory: string, phrase: string): boolean {
  let from = 0;
  for (;;) {
    const index = memory.indexOf(phrase, from);
    if (index === -1) return false;
    if (!zhClauseBeforeHasNegator(memory, index)) return true;
    from = index + 1;
  }
}

function taNegatedNearby(memory: string, matchEnd: number): boolean {
  const rest = memory.slice(matchEnd);
  const ownBoundaryOffset = rest.search(SENTENCE_BOUNDARY);
  const ownClause = ownBoundaryOffset === -1 ? rest : rest.slice(0, ownBoundaryOffset);
  if (TA_NEGATION_MARKERS.some((marker) => ownClause.includes(marker))) return true;
  if (ownBoundaryOffset === -1) return false;
  const afterOwnBoundary = rest.slice(ownBoundaryOffset + 1);
  const nextBoundaryOffset = afterOwnBoundary.search(SENTENCE_BOUNDARY);
  const nextSentence = nextBoundaryOffset === -1 ? afterOwnBoundary : afterOwnBoundary.slice(0, nextBoundaryOffset);
  return TA_NEGATION_MARKERS.some((marker) => nextSentence.includes(marker));
}

/** True if `phrase` occurs in `memory` at least once whose own clause and following sentence both hold no …இல்லை negation. */
function taPhraseHoldsUnnegated(memory: string, phrase: string): boolean {
  let from = 0;
  for (;;) {
    const index = memory.indexOf(phrase, from);
    if (index === -1) return false;
    const matchEnd = index + phrase.length;
    if (!taNegatedNearby(memory, matchEnd)) return true;
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
