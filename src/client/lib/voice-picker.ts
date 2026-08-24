export type VoiceCandidate = {
  lang: string;
  localService: boolean;
};

/**
 * Locales where the exact BCP-47 region voice is unlikely to exist on-device
 * but a specific other region is a good substitute (same language, widely
 * shipped). Checked as its own tier, above any other same-language voice, so
 * (for example) zh-CN is preferred over zh-TW when picking for "zh-SG".
 */
const REGIONAL_FALLBACK: Partial<Record<string, string>> = {
  "zh-sg": "zh-cn",
  "ta-sg": "ta-in",
};

function languagePrefix(bcp47: string): string {
  return bcp47.split("-")[0]?.toLowerCase() ?? "";
}

function bestOf<T extends VoiceCandidate>(candidates: T[]): T | null {
  if (candidates.length === 0) return null;
  return candidates.find((voice) => voice.localService) ?? candidates[0];
}

/**
 * Picks the best available voice for a BCP-47 locale: exact match, then the
 * locale's regional fallback (see REGIONAL_FALLBACK), then any voice sharing
 * the same language prefix, then null. Within each tier, a localService
 * (on-device) voice is preferred over a cloud one — but tier order always
 * wins over localService, e.g. a cloud regional-fallback voice beats a
 * localService voice from an unrelated same-language region.
 */
export function pickVoice<T extends VoiceCandidate>(voices: readonly T[], locale: string): T | null {
  const normalizedLocale = locale.toLowerCase();
  const exact = bestOf(voices.filter((voice) => voice.lang.toLowerCase() === normalizedLocale));
  if (exact) return exact;

  const fallbackLocale = REGIONAL_FALLBACK[normalizedLocale];
  if (fallbackLocale) {
    const fallback = bestOf(voices.filter((voice) => voice.lang.toLowerCase() === fallbackLocale));
    if (fallback) return fallback;
  }

  const prefix = languagePrefix(locale);
  const sameLanguage = bestOf(voices.filter((voice) => languagePrefix(voice.lang) === prefix));
  if (sameLanguage) return sameLanguage;

  return null;
}

/** The hidden-button contract: read-aloud controls should only render when this is true. */
export function canReadAloud<T extends VoiceCandidate>(voices: readonly T[], locale: string): boolean {
  return pickVoice(voices, locale) !== null;
}
