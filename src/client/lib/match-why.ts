import type { MatchResult } from "../../shared/schemas";
import { t, type Lang } from "./i18n";

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(value),
    template,
  );
}

/**
 * Builds the participant-facing "why this connects" sentence entirely
 * client-side: the server only supplies structured evidence (whyEvidence),
 * never per-viewer prose (QA F2). place/era/skill are canonical-English
 * matching-field values (Task 4) and are interpolated as-is; everything
 * around them — including the fallback words when a field is null — comes
 * from the dictionary in the participant's own language.
 */
export function formatMatchWhy(lang: Lang, match: MatchResult | null | undefined): string {
  if (!match) return "";
  if (!match.whyEvidence) return t(lang, "matchWhyNoMatch");
  const { place, era, skill, hasComplement } = match.whyEvidence;
  const vars = {
    place: place ?? t(lang, "matchPlaceFallback"),
    era: era ?? t(lang, "matchEraFallback"),
    skill: skill ?? t(lang, "matchSkillFallback"),
  };
  const template = t(lang, hasComplement ? "matchWhyComplement" : "matchWhyShared");
  return fillTemplate(template, vars);
}
