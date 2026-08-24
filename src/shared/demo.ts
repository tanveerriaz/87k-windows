export const PREPARED_RADIO_MEMORY =
  "I used to repair radios around Queenstown in the 1970s, and I would be happy to teach someone basic radio repair.";

export const PREPARED_NO_MATCH_MEMORY =
  "I catalogued polar clouds in Antarctica in the 2010s.";

// TRANSLATION REVIEW: machine-drafted, needs native check (Singapore Mandarin).
// Mirrors PREPARED_RADIO_MEMORY so a zh storyteller can be matched against the
// English radio listener. Deliberately contains the explicit-consent phrases
// 我愿意 (offer) and 我想 (want) so the deterministic consent veto in
// consent-evidence.ts keeps offers/wants on the real providers too.
export const PREPARED_RADIO_MEMORY_ZH =
  "1970年代，我在女皇镇修理收音机。我愿意教别人基本的收音机维修，我想认识喜欢修复老收音机的人。";
