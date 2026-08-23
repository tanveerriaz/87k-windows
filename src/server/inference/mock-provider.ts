import { randomUUID } from "node:crypto";
import { StoryCapsuleSchema, type StoryCapsule } from "../../shared/schemas";
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

  let capsule: StoryCapsule;
  if (isRadio) {
    capsule = {
      id: randomUUID(),
      observed: ["portable radio", "repair tools"],
      place: "Queenstown",
      era: "1970s",
      skills: ["radio repair"],
      interests: ["electronics", "old radios"],
      offers: ["teach basic radio repair"],
      wants: ["meet someone interested in restoring a radio"],
      safeSummary: "A fictional memory of repairing radios in Queenstown in the 1970s, with an offer to share the skill.",
      containsPII,
      redactions,
      uncertain: ["The prepared illustration suggests repair tools; it does not identify a real person."],
    };
  } else if (isNoMatch) {
    capsule = {
      id: randomUUID(),
      observed: ["text-only synthetic memory"],
      place: "Antarctica",
      era: "2010s",
      skills: ["cloud cataloguing"],
      interests: ["polar weather archives"],
      offers: ["share cloud classifications"],
      wants: ["compare Antarctic field notes"],
      safeSummary: "A fictional memory about cataloguing polar clouds in Antarctica in the 2010s.",
      containsPII,
      redactions,
      uncertain: ["No prepared story contains compatible evidence."],
    };
  } else {
    capsule = {
      id: randomUUID(),
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
