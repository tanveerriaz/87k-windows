import type { Language } from "../../shared/schemas";

const EXPLICIT_OFFER = /\b(i can|i could|i would be happy to|i am happy to|i'm happy to|i am willing to|i'm willing to|i can teach|i can share|i can show|i can help)\b/i;
const EXPLICIT_WANT = /\b(i want|i wish|i hope|i would like|i'm looking for|i am looking for|i miss|i want to learn)\b/i;

/**
 * The regex gate below only recognizes English consent phrasing. For a
 * non-English memory it would always miss and silently zero out real
 * offers/wants, so for language !== "en" we trust the model's own
 * extraction instead — the capsule prompt already instructs it to populate
 * offers/wants only on explicit volunteering, in every language.
 */
export function keepExplicitConsent(memory: string, offers: unknown, wants: unknown, language: Language = "en") {
  if (language !== "en") {
    return { offers, wants };
  }
  return {
    offers: EXPLICIT_OFFER.test(memory) ? offers : [],
    wants: EXPLICIT_WANT.test(memory) ? wants : [],
  };
}
