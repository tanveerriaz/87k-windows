import { randomUUID } from "node:crypto";
import { StoryCapsuleSchema, type Language, type StoryCapsule } from "../../shared/schemas";
import { redactMemory } from "../privacy/redact";
import {
  ProviderOutputError,
  ProviderTimeoutError,
  type ExtractInput,
  type InferenceProvider,
} from "./provider";

function sentenceCase(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`.slice(0, 330);
}

// TRANSLATION REVIEW: machine-drafted, needs native check (short canned
// translations for the mock provider's two demo fixtures only — the mock
// provider cannot translate arbitrary participant-typed text, see the
// fallback branch in buildMockCapsule).
const RADIO_SAFE_SUMMARY: Record<Language, string> = {
  en: "A fictional memory of repairing radios in Queenstown in the 1970s, with an offer to share the skill.",
  zh: "一段关于1970年代在女皇镇修理收音机的虚构记忆，并愿意分享这项技能。",
  ms: "Kenangan fiksyen membaiki radio di Queenstown pada tahun 1970-an, dengan tawaran untuk berkongsi kemahiran ini.",
  ta: "1970களில் குயின்ஸ்டவுனில் ரேடியோக்களை பழுதுபார்த்த ஒரு கற்பனை நினைவு, அந்த திறமையைப் பகிர்ந்து கொள்ளும் ஒரு வாய்ப்புடன்.",
};

// TRANSLATION REVIEW: machine-drafted, needs native check (see RADIO_SAFE_SUMMARY note)
const NO_MATCH_SAFE_SUMMARY: Record<Language, string> = {
  en: "A fictional memory about cataloguing polar clouds in Antarctica in the 2010s.",
  zh: "一段关于2010年代在南极洲编目极地云层的虚构记忆。",
  ms: "Kenangan fiksyen tentang mengkatalog awan kutub di Antartika pada tahun 2010-an.",
  ta: "2010களில் அண்டார்டிகாவில் துருவ மேகங்களை பட்டியலிட்ட ஒரு கற்பனை நினைவு.",
};

export function buildMockCapsule(input: ExtractInput): StoryCapsule {
  if (input.memory.includes("INVALID_PROVIDER_JSON")) {
    throw new ProviderOutputError();
  }
  if (input.memory.includes("CLOUD_TIMEOUT")) {
    throw new ProviderTimeoutError();
  }

  const { safeText, containsPII, redactions } = redactMemory(input.memory);
  const normalized = input.memory.toLowerCase();
  const isRadio = input.fixture === "radio" || /radio|queenstown/.test(normalized);
  const isNoMatch = input.fixture === "no-match" || /antarctica|cloud catalogue/.test(normalized);
  const language: Language = input.language ?? "en";

  let capsule: StoryCapsule;
  if (isRadio) {
    capsule = {
      id: randomUUID(),
      language,
      observed: ["portable radio", "repair tools"],
      place: "Queenstown",
      era: "1970s",
      skills: ["radio repair"],
      interests: ["electronics", "old radios"],
      offers: ["teach basic radio repair"],
      wants: ["meet someone interested in restoring a radio"],
      safeSummary: RADIO_SAFE_SUMMARY[language],
      containsPII,
      redactions,
      uncertain: ["The prepared illustration suggests repair tools; it does not identify a real person."],
    };
  } else if (isNoMatch) {
    capsule = {
      id: randomUUID(),
      language,
      observed: ["text-only synthetic memory"],
      place: "Antarctica",
      era: "2010s",
      skills: ["cloud cataloguing"],
      interests: ["polar weather archives"],
      offers: ["share cloud classifications"],
      wants: ["compare Antarctic field notes"],
      safeSummary: NO_MATCH_SAFE_SUMMARY[language],
      containsPII,
      redactions,
      uncertain: ["No prepared story contains compatible evidence."],
    };
  } else {
    capsule = {
      id: randomUUID(),
      language,
      observed: ["participant-provided memory"],
      place: null,
      era: null,
      skills: [],
      interests: safeText.split(/\W+/).filter((word) => word.length > 5).slice(0, 3),
      offers: [],
      wants: [],
      safeSummary: sentenceCase(safeText),
      containsPII,
      redactions,
      uncertain: ["Place, era and offer/want relationship were not explicit."],
    };
  }

  return StoryCapsuleSchema.parse(capsule);
}

export class MockProvider implements InferenceProvider {
  constructor(private readonly delayMs = 450) {}

  async extract(input: ExtractInput): Promise<StoryCapsule> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
    return buildMockCapsule(input);
  }
}
