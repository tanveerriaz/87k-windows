const EXPLICIT_OFFER = /\b(i can|i could|i would be happy to|i am happy to|i'm happy to|i am willing to|i'm willing to|i can teach|i can share|i can show|i can help)\b/i;
const EXPLICIT_WANT = /\b(i want|i wish|i hope|i would like|i'm looking for|i am looking for|i miss|i want to learn)\b/i;

export function keepExplicitConsent(memory: string, offers: unknown, wants: unknown) {
  return {
    offers: EXPLICIT_OFFER.test(memory) ? offers : [],
    wants: EXPLICIT_WANT.test(memory) ? wants : [],
  };
}
