# Multilingual Journey Implementation Plan

> **For agentic workers:** Execution model — Sonnet pane implements task-by-task per brief; Opus pane runs testing/QA; Fable (controller) reviews every task (CR) and runs final review. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A senior can complete the whole journey — choose language, speak or type a memory, review and consent, hear the guide read aloud — in any of Singapore's four official languages (English, Mandarin, Malay, Tamil), and stories in different languages can still match each other.

**Architecture:** Language is a per-participant choice carried from a selector (the listener screen already has one) through the capsule (`language` field) to the Gemini guide. The UI uses a zero-dependency typed dictionary (4 locales × ~60 strings) — no i18n library. Matching stays deterministic by having Gemma emit **canonical English** `place/era/skills/offers/wants` regardless of input language, while `safeSummary` stays in the participant's language. Voice in/out follows the chosen language with feature-detected graceful fallback.

**Tech Stack:** React 19 context + typed dictionary, Web Speech API (BCP-47 langs), existing capsule-prompt/schema/matcher pipeline.

**Spec:** this document; product context `docs/PRODUCT.md`; prior hardening plan `docs/superpowers/plans/2026-08-23-audit-fixes.md`.

## Research basis (per change-requirements rule)

- Chrome SpeechRecognition accepts BCP-47 codes and supports Mandarin/Malay/Tamil variants; availability varies by platform so the UI must fall back gracefully ([MDN lang property](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang), [Chrome Web Speech intro](https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api)).
- speechSynthesis voices depend on the OS; Chrome loads them async (`voiceschanged`), iOS requires a user gesture, and Chinese/Tamil voices may be absent on some devices → detect via `getVoices()` and hide/disable read-aloud rather than speak silence ([Chrome TTS intro](https://developer.chrome.com/blog/web-apps-that-talk-introduction-to-the-speech-synthesis-api), [talkr lessons](https://talkrapp.com/speechSynthesis.html), [Apple forum on iOS voices](https://developer.apple.com/forums/thread/723503)).
- i18n library comparison (react-i18next ~15kB, Lingui ~10kB, typesafe-i18n ~1kB) shows library value is namespacing/lazy-loading at scale; for 4 locales and ~60 strings a typed in-repo dictionary is smaller, simpler to read, and dependency-free — revisit react-i18next only if strings multiply ([Phrase comparison](https://phrase.com/blog/posts/react-i18n-best-libraries/), [2026 honest comparison](https://dev.to/erayg/best-i18n-libraries-for-nextjs-react-react-native-in-2026-honest-comparison-3m8f)).
- Canonicalize-at-ingestion (model emits canonical English match fields) is the standard cross-language retrieval pattern and reuses the existing capsule schema + deterministic matcher unchanged — no embeddings service, no new infra, zero added per-request cost.

## Global Constraints

- Languages: `en` (English), `zh` (Mandarin), `ms` (Malay), `ta` (Tamil). BCP-47 for speech: `en-SG`, `zh-SG` (fallback `zh-CN`), `ms-MY`, `ta-SG` (fallback `ta-IN`).
- **No new npm dependencies.** Translations are typed TS dictionaries in-repo.
- Journey-critical surfaces only: join flow (both roles), consent review, guide display/read-aloud, error messages participants see. **Wall and admin stay English** (public projection), but a lit window shows `safeSummary` in its original language.
- Matching fields (`place`, `era`, `skills`, `offers`, `wants`) are **always canonical English** out of Gemma; `safeSummary` stays in the participant's language; capsule gains `language`.
- Senior rules hold in every locale: ≥18px body text on mobile, ≥48px touch targets, AA contrast; CJK/Tamil scripts must not break layouts (test at 390×844 and 1280×720).
- Cost: no additional model calls per submission; the guide gains at most one extra output field (English fallback) and only when participants' languages differ.
- Quality gates green after every task: `npm run lint && npm run typecheck && npm test && npm run build`; e2e before merge. Every task gets a CR from the controller before the next builds on it.
- Fictional/synthetic data only; translations must be reviewed native-quality (flag any machine-guess strings for the user to verify — do not silently ship unreviewed Tamil/Malay/Mandarin).

---

### Task 1: Language foundation (dictionary + context + selector)

**Files:**
- Create: `src/client/lib/i18n.ts`
- Modify: `src/client/routes/join-page.tsx` (selector for both roles; the listener screen's existing "Language I am comfortable using" dropdown becomes this control)
- Test: `tests/unit/i18n.test.ts`

**Interfaces (produced):**
```ts
export type Lang = "en" | "zh" | "ms" | "ta";
export const SPEECH_LOCALE: Record<Lang, string>; // en-SG / zh-SG / ms-MY / ta-SG
export type UiStringKey = /* union of all keys */;
export function t(lang: Lang, key: UiStringKey): string;
export const LANG_LABELS: Record<Lang, string>; // native-script labels: English / 中文 / Bahasa Melayu / தமிழ்
```
Selection state lives in `join-page.tsx` (`useState<Lang>` initialised from `?lang=` URL param, default `"en"`), passed down as props — no global store needed.

- [ ] Write failing unit test: every `UiStringKey` resolves to a non-empty string in all four langs (iterate `Object.keys`); `t("zh", key)` differs from `t("en", key)` for at least the question string; missing-key fallback returns the English string.
- [ ] Implement `i18n.ts` with the four dictionaries. Seed keys: the memory question, all join-flow buttons/headings/status lines, consent screen labels, error messages from Task 9 of the hardening plan, guide panel labels. Mark every non-English string block with a `// TRANSLATION REVIEW: machine-drafted, needs native check` comment.
- [ ] Add the selector to the storyteller welcome panel (≥48px control, native-script labels) and wire the listener dropdown to the same `Lang` type. Selection updates the URL (`?lang=`) so a reload keeps it.
- [ ] Gates green → commit `feat: language foundation with four-locale dictionary`.

### Task 2: Translate the journey surfaces

**Files:** Modify `src/client/routes/join-page.tsx` (replace hardcoded journey strings with `t(lang, key)`), `src/client/lib/api.ts` + `use-room-socket.ts` (error strings become keys resolved at render).
**Interfaces (consumed):** `t`, `UiStringKey` from Task 1.

- [ ] Failing e2e: `/join/demo87?lang=zh` shows the memory question in Mandarin (`await expect(page.getByText("小时候，什么小事让你开心？")).toBeVisible()` — use the exact dictionary string) and the share button in Mandarin; `?lang=en` unchanged.
- [ ] Replace journey strings; friendly errors from `api.ts`/socket land as keys and render translated. Journey rail, review labels, consent buttons, listening flow — all four locales.
- [ ] Verify CJK/Tamil at 390×844: no overflow of the fixed panels (screenshot all four languages for the report).
- [ ] Gates + e2e green → commit `feat: journey surfaces render in four languages`.

### Task 3: Voice in and read-aloud follow the language

**Files:** Modify `src/client/routes/join-page.tsx` (`captureVoice`, `speakText`).
**Interfaces (consumed):** `SPEECH_LOCALE` from Task 1.

- [ ] `recognition.lang = SPEECH_LOCALE[lang]`; on `onerror`/no-result in non-English, show the translated "voice input isn't available for this language on this phone — please type" hint instead of failing silently.
- [ ] `speakText` sets `utterance.lang = SPEECH_LOCALE[lang]` and picks a matching voice from `getVoices()` (handle Chrome's async `voiceschanged`; prefer `localService`). If no voice matches the language, hide the "Read this to me"/"Read this aloud" buttons for that session (feature detection, not silent failure).
- [ ] Unit-test the voice-picker as a pure function: `pickVoice(voices, "zh-SG")` prefers exact match → same-language → null; test the null → hidden-button contract via a component-free helper.
- [ ] Gates green → commit `feat: speech input and read-aloud follow the selected language`.

### Task 4: Capsule pipeline — any language in, canonical English matching fields out

**Files:** Modify `src/shared/schemas.ts` (`StoryCapsuleSchema` + `ExtractRequestSchema` gain `language`), `src/server/inference/capsule-prompt.ts` (CAPSULE_PROMPT_VERSION → 3), `src/server/inference/mock-provider.ts` (respect `language` for `safeSummary`), `src/client/lib/api.ts` (send `language`).
**Test:** `tests/unit/capsule-prompt.test.ts`, `tests/unit/matcher.test.ts` (cross-language pair), fixtures.

- [ ] Failing tests: prompt for `language: "zh"` instructs — memory may be in any language; write `safeSummary` in the participant's language (zh); write `place/era/skills/offers/wants` in **canonical English** ("Queenstown", "1970s", "radio repair"). Matcher test: a zh capsule (safeSummary in Chinese, canonical English fields) × the English radio listener fixture clears 0.62.
- [ ] Implement: schema field `language: z.enum(["en","zh","ms","ta"]).default("en")`; prompt version 3 with the canonicalization rules in the shared base (both dialects); thread `language` from client → `/api/extract` → provider → capsule. Matcher untouched (it already compares the canonical fields).
- [ ] Capture at least one real non-English fixture via local Ollama (`gemma3:4b`, zh memory) into `tests/fixtures/capsules/`; never fabricate — if the small model can't hold canonical-English fields reliably, record the failure honestly in the report (this is a go/no-go signal for the local path; hosted 27B is the reference).
- [ ] Gates green → commit `feat: capsules carry language; matching fields canonicalized to English`.

### Task 5: Guide in the storyteller's language

**Files:** Modify `src/shared/schemas.ts` (`SeniorBridgeSchema` gains optional `englishFallback` block), `src/server/facilitation/gemini-facilitator.ts` (language param + schema), `src/server/rooms.ts` (pass both participants' languages), `src/client/routes/join-page.tsx` (render + read-aloud in guide language; show English fallback when the viewer's language differs).
**Interfaces (consumed):** capsule `language` from Task 4.

- [ ] Failing unit test: facilitator prompt for a zh storyteller asks for the two questions in Mandarin; when listener language ≠ storyteller language the schema requires the `englishFallback` questions; when equal, no fallback requested (no extra tokens).
- [ ] Implement; guide read-aloud uses the guide's language via Task 3's voice picker.
- [ ] Gates green → commit `feat: Gemini guide speaks the storyteller's language`.

### Task 6: QA sweep (Opus pane owns this)

- [x] Full gates + e2e; new e2e: complete two-tab flow with storyteller `?lang=zh` typing the prepared zh memory (add a zh prepared fixture string to `src/shared/demo.ts`), listener in English — wall lights, guide arrives, no layout breakage. *(gates green: 148 unit / 13 e2e; `PREPARED_RADIO_MEMORY_ZH` added)*
- [x] Manual matrix at 390×844 and 1280×720 for all four languages: screenshots of welcome, capture, review, consent, guide; check ≥18px/≥48px/AA hold (CJK line-height, Tamil descenders). *(40 cells in `qa/screens/`; 0 overflow, 0 sub-48px targets; sub-18px labels filed as F5)*
- [x] Voice matrix on the demo Mac — recognition + read-aloud per language; record which languages had voices available and how fallback behaved. *(all four resolve; `zh-SG→zh-CN` and `ta-SG→ta-IN` fallbacks load-bearing)*
- [ ] Voice matrix on one phone. **Not run — no device available to the QA session.** Must be done on the demo phone before the event.
- [x] File a QA report at `docs/superpowers/plans/2026-08-23-multilingual-qa.md`: pass/fail per cell, screenshots, defects filed as findings for the controller. *(6 findings: 3 High, 2 Medium, 1 Low)*
- [x] Folded-in CR requirements: guide-fallback unit coverage (T5 CR merge blocker) and the `getVoices` stub e2e (T3 CR).
- [ ] Live hosted-path zh extraction. **BLOCKED** — no `OPENROUTER_API_KEY`; the available `GEMINI_API_KEY` is rejected as `API_KEY_INVALID`. Local-model substitute evidence recorded in the QA report §D.1.
- [ ] **User review gate:** the `// TRANSLATION REVIEW` strings go to Tanveer (or a native speaker) before public deploy — machine-drafted Tamil/Malay/Mandarin must not ship silently. *(package ready: `.superpowers/sdd/2026-08-23-multilingual/translation-review.md`, 190 rows)*

## Out of scope (explicit)

- Dialects (Hokkien, Teochew, Cantonese) — browser speech recognition does not support them; revisit with community-partner reading support or a server-side STT service (cost decision for later).
- Translating the wall/admin surfaces.
- Language auto-detection of typed input (the model handles it implicitly; the explicit selector is the senior-friendly control).

## Workflow

Sonnet pane (`ml-coder`) implements Tasks 1–5 sequentially, one commit per task, report per task. Controller (Fable) CRs each task before the next. Opus pane (`ml-qa`) runs Task 6 after Task 5, and additionally smoke-tests after Tasks 2 and 4. Final whole-branch review by Fable, then user reviews translations + merge decision. Work happens on branch `feature/multilingual` in a worktree; main is untouched until CR + QA + user translation review pass.

---

### Task 5b (added 2026-08-23, user-directed): Landing joins the language system + humanized English copy

**Why:** (a) The live landing page has no language choice — a senior meets a page of English before the selector exists (user-reported gap). (b) All English source strings must read as natural human writing before translations are user-reviewed, so translation happens once. Method: the 35 patterns of github.com/blader/humanizer (Wikipedia "Signs of AI writing") — notably: no dramatic clipped fragments ("Be heard."), no forced parallel pairs, simple verbs over "serves as/boasts", no inflated significance, no generic aspirational endings, sentence-case headings, concrete facts over vague claims. Preserve the writer's established voice: the headline "What story should not disappear?" and the two role-card titles are the user's voice — keep them.

**Files:**
- Modify: `src/client/routes/landing-page.tsx` (strings → dictionary; language selector in the nav, native-script labels, ≥48px; `?lang=` carried into the join links), `src/client/lib/i18n.ts` (new landing keys; humanize ALL EN strings; re-align zh/ms/ta translations to the new English), `tests/e2e/demo.spec.ts` (landing language assertions)
- The wall and admin stay English (unchanged scope).

**Steps:**
- [ ] Failing e2e: landing `?lang=zh` renders the headline block and role-card subtitles in Mandarin; selector visible in nav; choosing 中文 rewrites the join links to `?role=…&lang=zh`.
- [ ] Move landing strings into the dictionary; add the nav selector (same `Lang` control as join).
- [ ] Humanizer pass over every EN string (landing + journey): apply the 35 patterns; keep meaning, names, numbers exact; keep the user's voice lines verbatim. List every changed string in the report as `before → after` for the controller to spot-check.
- [ ] Re-align zh/ms/ta for changed strings (TRANSLATION REVIEW comments; translation review gate unchanged).
- [ ] Gates + full e2e green → commit `feat: landing speaks four languages; copy reads human`.
