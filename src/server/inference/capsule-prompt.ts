import type { Language } from "../../shared/schemas";

export const CAPSULE_PROMPT_VERSION = 3;

export type CapsuleDialect = "ollama" | "hosted";

export type CapsulePromptOptions = {
  memory: string;
  repairOutput?: string;
  dialect: CapsuleDialect;
  language?: Language;
};

const CAPSULE_PROMPT_BASE = `Create a privacy-safe story capsule from this fictional demo memory.
Use only explicit evidence. Never infer identity, age, ethnicity, health, address, relationships, or contact details.
Never turn an activity into an occupation, title, identity, or permanent trait. Phrase safeSummary as "A memory of ...".
Copy explicit place and era wording faithfully; never pad, reformat, or invent years.
Populate offers or wants only when the person explicitly volunteers an offer or states a desire; an activity alone is neither.
Put missing or ambiguous facts in uncertain; use null for an unstated place or era.`;

function languageRules(language: Language): string {
  return `The memory may be written in any language; never reject, refuse, or translate it because of its language.
Write safeSummary in the participant's language (${language}).
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
