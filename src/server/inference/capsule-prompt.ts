import type { Language } from "../../shared/schemas";

export const CAPSULE_PROMPT_VERSION = 4;

export type CapsuleDialect = "ollama" | "hosted";

export type CapsulePromptOptions = {
  memory: string;
  repairOutput?: string;
  dialect: CapsuleDialect;
  language?: Language;
};

const CAPSULE_PROMPT_BASE = `Create a privacy-safe story capsule from this fictional demo memory.
Use only explicit evidence. Never infer identity, age, ethnicity, health, address, relationships, or contact details.
Never turn an activity into an occupation, title, identity, or permanent trait.
Copy explicit place and era wording faithfully; never pad, reformat, or invent years.
Populate offers or wants only when the person explicitly volunteers an offer or states a desire; an activity alone is neither.
Put missing or ambiguous facts in uncertain; use null for an unstated place or era.`;

// QA report F3: the shared base used to tell every language to open
// safeSummary with the fixed English phrase "A memory of ...", which
// directly contradicts writing safeSummary in a non-English language — a
// local 4B model resolved the conflict by emitting "A memory of ...修理收音机".
// zh and ms get their own native opening template; Tamil is head-final
// (the topic precedes "a memory of X", not the other way round), so a
// fixed opening prefix doesn't fit its grammar — the instruction is
// dropped for ta rather than forced.
const SAFE_SUMMARY_OPENING: Record<Language, string> = {
  en: 'Phrase safeSummary starting with "A memory of ...".',
  zh: 'Phrase safeSummary starting with "一段关于...的记忆" (a memory about ...).',
  ms: 'Phrase safeSummary starting with "Kenangan tentang ..." (a memory about ...).',
  ta: "Write a short, natural one-sentence safeSummary in Tamil describing the memory; Tamil's word order does not take a fixed English-style opening phrase.",
};

function languageRules(language: Language): string {
  return `The memory may be written in any language; never reject, refuse, or translate it because of its language.
Write safeSummary in the participant's language (${language}). ${SAFE_SUMMARY_OPENING[language]}
Always write place, era, skills, offers, and wants in canonical English regardless of the memory's language — for example "Queenstown", "1970s", "radio repair" — so matching stays consistent across participants who used different languages.`;
}

const DIALECT_NOTE: Record<CapsuleDialect, string> = {
  ollama: `The input has already had obvious identifiers replaced with [redacted]. Keep those identifiers out of the summary.
Return one JSON object with exactly these keys:
observed (string array), place (string or null), era (string or null), skills (string array), interests (string array), offers (string array), wants (string array), safeSummary (one short string), containsPII (boolean), redactions (string array), uncertain (string array).`,
  hosted: "Return only the requested JSON. Do not include reasoning, hidden analysis, markdown, or extra keys.",
};

export function buildCapsulePrompt({ memory, repairOutput, dialect, language }: CapsulePromptOptions): string {
  const repair = repairOutput
    ? `\nThe previous answer was invalid. Repair it using the same evidence and return JSON only. Previous answer:\n${JSON.stringify(repairOutput.slice(0, 1200))}\n`
    : "";
  return `${CAPSULE_PROMPT_BASE}
${languageRules(language ?? "en")}
${DIALECT_NOTE[dialect]}
Memory: ${JSON.stringify(memory)}${repair}`;
}
