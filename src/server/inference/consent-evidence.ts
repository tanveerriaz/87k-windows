import type { Language } from "../../shared/schemas";

const EXPLICIT_OFFER_EN = /\b(i can|i could|i would be happy to|i am happy to|i'm happy to|i am willing to|i'm willing to|i can teach|i can share|i can show|i can help)\b/i;
const EXPLICIT_WANT_EN = /\b(i want|i wish|i hope|i would like|i'm looking for|i am looking for|i miss|i want to learn)\b/i;

// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_OFFER_ZH = /(我愿意|我可以|愿意教)/;
// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_WANT_ZH = /(我想|我希望|想学)/;

// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_OFFER_MS = /\b(saya boleh|saya sudi|saya sanggup)\b/i;
// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_WANT_MS = /\b(saya mahu|saya ingin|saya berharap)\b/i;

// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_OFFER_TA = /(நான் கற்பிக்க தயார்|நான் உதவ முடியும்|நான் பகிர தயார்)/;
// TRANSLATION REVIEW: machine-drafted, needs native check
const EXPLICIT_WANT_TA = /(நான் கற்க விரும்புகிறேன்|நான் விரும்புகிறேன்|எனக்கு ஆசை)/;

/**
 * A deterministic veto the model cannot talk past: offers/wants only
 * survive when the RAW memory contains one of a curated, per-language,
 * high-confidence explicit-consent phrase — regardless of what the model
 * itself extracted. Every supported language gets its own list; none is
 * trusted unconditionally. English's list uses \b word-boundary matching
 * (space-delimited script); zh/ta use plain substring alternation since
 * \b/\w are meaningless for their scripts in a non-unicode-mode regex.
 */
const EXPLICIT_CONSENT_PATTERNS: Record<Language, { offer: RegExp; want: RegExp }> = {
  en: { offer: EXPLICIT_OFFER_EN, want: EXPLICIT_WANT_EN },
  zh: { offer: EXPLICIT_OFFER_ZH, want: EXPLICIT_WANT_ZH },
  ms: { offer: EXPLICIT_OFFER_MS, want: EXPLICIT_WANT_MS },
  ta: { offer: EXPLICIT_OFFER_TA, want: EXPLICIT_WANT_TA },
};

export function keepExplicitConsent(memory: string, offers: unknown, wants: unknown, language: Language = "en") {
  const { offer, want } = EXPLICIT_CONSENT_PATTERNS[language];
  return {
    offers: offer.test(memory) ? offers : [],
    wants: want.test(memory) ? wants : [],
  };
}
