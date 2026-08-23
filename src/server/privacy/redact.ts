const PHONE_PATTERN = /(?:\+?65[\s-]?)?[689]\d{3}[\s-]?\d{4}/g;
const ADDRESS_PATTERN = /\b(?:blk|block)\s+\d+[a-z]?(?:\s*,?\s*#\d{1,2}-\d{1,4})?/gi;
const NAME_PATTERN = /\bmy name is\s+[a-z]+(?:\s+[a-z]+)?/gi;
const EMAIL_PATTERN = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi;
const POSTAL_PATTERN = /\b(?:singapore|s'pore|postal code)\s*:?\s*\d{6}\b/gi;

export function redactMemory(memory: string): {
  safeText: string;
  containsPII: boolean;
  redactions: string[];
} {
  const redactions: string[] = [];
  let safeText = memory;

  const replace = (pattern: RegExp, label: string) => {
    if (pattern.test(safeText)) {
      redactions.push(label);
      pattern.lastIndex = 0;
      safeText = safeText.replace(pattern, "[redacted]");
    }
    pattern.lastIndex = 0;
  };

  replace(PHONE_PATTERN, "phone number");
  replace(ADDRESS_PATTERN, "exact address");
  replace(NAME_PATTERN, "name");
  replace(EMAIL_PATTERN, "email address");
  replace(URL_PATTERN, "web link");
  replace(POSTAL_PATTERN, "postal code");

  return { safeText, containsPII: redactions.length > 0, redactions };
}

/**
 * A model's own capsule output may flag PII the regex scan missed (or vice
 * versa); the honest verdict is the union of both, not either one alone.
 */
export function unionRedactionVerdicts(
  regexResult: { containsPII: boolean; redactions: string[] },
  modelContainsPII: unknown,
  modelRedactions: unknown,
): { containsPII: boolean; redactions: string[] } {
  const modelRedactionList = Array.isArray(modelRedactions)
    ? modelRedactions.filter((item): item is string => typeof item === "string")
    : [];
  return {
    containsPII: regexResult.containsPII || Boolean(modelContainsPII),
    redactions: [...new Set([...regexResult.redactions, ...modelRedactionList])],
  };
}
