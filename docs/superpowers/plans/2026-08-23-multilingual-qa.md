# Multilingual journey — Task 6 QA sweep

**Branch:** `feature/multilingual` · **Owner:** Opus QA pane (`ml-qa`) · **Date:** 2026-08-24
**Scope:** the plan's Task 6 plus the folded-in CR requirements A–E.
**Nothing was fixed outside test files, the new `guide-presentation.ts` extraction (authorised by requirement A) and the zh demo fixture.** Everything else is reported as a finding.

## Verdict per section

| § | Requirement | Result |
|---|---|---|
| **A** | Coverage for the client guide-fallback logic (T5 CR **merge blocker**) | ✅ **PASS** — logic extracted to `src/client/lib/guide-presentation.ts`, 8 unit tests in `tests/unit/guide-presentation.test.ts` |
| **B** | Playwright test stubbing `speechSynthesis.getVoices` (T3 CR) | ✅ **PASS** — 3 e2e tests; hidden with 0 voices, hidden with only `en-*`, visible with `zh-CN` |
| **C** | zh two-tab e2e, screenshot matrix, voice matrix | ✅ **PASS** — e2e green; 40-cell matrix in `qa/screens/`; Mac voice matrix complete. *Phone leg not run (no device) — see §C.3* |
| **D** | Live hosted-path zh extraction | ⛔ **BLOCKED** — no `OPENROUTER_API_KEY`; the `GEMINI_API_KEY` that is present is rejected by Google as `API_KEY_INVALID`. Substitute local evidence gathered instead — see §D |
| **E** | Translation review package | ✅ **PASS** — `.superpowers/sdd/2026-08-23-multilingual/translation-review.md`, 190 rows, high-stakes section first |

**Findings: 6** (3 High, 2 Medium, 1 Low). None of them block Tasks 1–5 from being *correct as built*; F1–F3 should be resolved before a public deploy.

## Quality gates

| Gate | Result |
|---|---|
| `npm run lint` | ✅ clean |
| `npm run typecheck` | ✅ clean |
| `npm test` | ✅ **148 tests / 25 files** (was 106 / 22 before this task) |
| `npm run build` | ✅ client + server |
| `npm run test:e2e` | ✅ **13/13** (was 8) |

---

## A. Guide-fallback coverage — PASS

The T5 CR flagged `showGuideEnglishFallback` / `guideReadingLang` in `join-page.tsx` as having zero coverage. Taking the sanctioned "extract if needed" route, the decision now lives in a pure function:

`src/client/lib/guide-presentation.ts` → `resolveGuidePresentation(guide, viewerLang)` returns `{ showEnglishFallback, readingLang, spokenText }`.

`join-page.tsx` calls it from a `useMemo` and no longer computes any of it inline. `spokenText` was pulled in deliberately: the read-aloud string was assembled inside `speakGuide` and was equally untested, and it is the part that decides whether a listener hears the fallback or the original language.

`tests/unit/guide-presentation.test.ts` — 8 tests covering: no guide; viewer language matches the guide (no fallback, reads the guide's own language); viewer language differs **and** a fallback exists (fallback shown, reads English, exact spoken string asserted); every non-matching viewer language (`en`/`ms`/`ta`), not just English; languages differ but **no** fallback supplied (guide stays readable in its own language rather than disappearing); the consent reminder is spoken in the guide's language and absent from the English fallback; ordering of intro → Q1 → Q2 → reminder; an English guide viewed in English.

## B. Read-aloud feature detection — PASS

`tests/e2e/demo.spec.ts` gains a `stubVoices()` helper using `page.addInitScript` to replace `speechSynthesis.getVoices` before any page script runs. Headless Chromium ships **zero** voices, so both the empty and the populated case have to be stubbed for the test to mean anything.

| test | stubbed voices | expected | result |
|---|---|---|---|
| hidden with no voice | `[]` | no read-aloud button; capsule text still fully visible | ✅ |
| hidden with only a foreign voice | `en-US`, `en-GB` at `?lang=zh` | no read-aloud button | ✅ |
| visible with a Mandarin voice | `en-US`, `zh-CN` at `?lang=zh` | button visible, ≥48px tall | ✅ |

The middle case matters: it proves the gate is *language-aware*, not merely "any voice present". The third also exercises the `zh-SG → zh-CN` regional fallback end-to-end, since `SPEECH_LOCALE.zh` is `zh-SG` and no such voice exists anywhere.

## C. Plan items

### C.1 Mandarin two-tab journey — PASS

`src/shared/demo.ts` gains `PREPARED_RADIO_MEMORY_ZH` (imported by the spec, so the fixture and the test cannot drift):

> 1970年代，我在女皇镇修理收音机。我愿意教别人基本的收音机维修，我想认识喜欢修复老收音机的人。

New e2e *"a Mandarin storyteller and an English listener complete the whole journey"*: zh storyteller types the fixture, English listener runs the normal flow, wall on 1280×720. Asserts the zh review heading, then the Task 4 contract as the participant actually sees it — **Mandarin `safeSummary` alongside canonical-English `Queenstown` / `1970s` / `radio repair` evidence chips** — then approve → 1 window lit → listener submits → both consent screens in their own language → two yeses → 2 windows lit, wall `data-wall-state=matched`, guide panel present with two questions, no horizontal overflow on either participant, guide panel not clipped. Green.

### C.2 Screenshot matrix — PASS (40 cells)

4 languages × {390×844 mobile, 1280×720 judging} × 5 journey screens (welcome, capture, review, consent, guide), committed to **`qa/screens/`** as `{lang}-{viewport}-{n}-{screen}.jpg` (1×, JPEG q68 — 48 MB of 2× PNG compressed to 5.6 MB so the matrix can live in the repo).

Every cell was also audited in the DOM for the senior rules:

| check | result across all 40 cells |
|---|---|
| horizontal document overflow | **0** |
| elements crossing the viewport edge | **0** |
| interactive targets under 48px | **0** |
| text clipped by `overflow:hidden` | 3 per guide screen — the evidence chips, language-independent (F6) |
| leaf text under 18px | present in every cell, identical across languages (F5) |

Panel heights grow as expected with script verbosity and never break: welcome 797–1112px, capture 964–1403px, review 1084–1605px, guide 1331–1941px. Tamil is consistently the tallest (e.g. capture 1352px mobile vs English 1006px) and remains fully scrollable.

No page errors were thrown in any of the 40 cells.

### C.3 Voice matrix — this Mac only

Real Chrome 151 (Playwright `channel: "chrome"`, headed), macOS. **180 voices** exposed; `SpeechRecognition` **and** `webkitSpeechRecognition` both present, so speech input is available for all four languages on this machine.

The shipped `pickVoice()` was then run against that real inventory:

| lang | requested locale | exact voice present? | tier used | voice chosen | read-aloud button |
|---|---|---|---|---|---|
| en | `en-SG` | no | same-language | `en-GB` / Daniel [local] | shown |
| zh | `zh-SG` | no | **regional fallback** | `zh-CN` / Eddy [local] | shown |
| ms | `ms-MY` | **yes** | exact | `ms-MY` / Amira [local] | shown |
| ta | `ta-SG` | no | **regional fallback** | `ta-IN` / Vani [local] | shown |

All four resolve to an on-device voice, and the matrix exercises all three picker tiers. The plan's research prediction is confirmed exactly: **no `en-SG`, `zh-SG` or `ta-SG` voice exists on this machine**, so the `REGIONAL_FALLBACK` table is doing real work rather than being defensive dead code — without it, zh and ta would both hide the read-aloud button on the demo machine.

**Not covered:** the plan's "+ one phone" leg. No phone was available to this session, and iOS in particular differs (voices need a user gesture, and the Tamil/Mandarin set varies by installed language packs). This cell is **untested**, not passed — it should be run on the actual demo phone before the event.

## D. Hosted-path go/no-go — BLOCKED

**The requested check could not be run, and no part of it was simulated.**

| path | status |
|---|---|
| `OPENROUTER_API_KEY` | **absent** — not in the environment, empty in `.env` |
| `GEMINI_API_KEY` (this repo's hosted `gemma-api` provider) | **present but invalid** — Google returns HTTP 400 `API_KEY_INVALID` / `API_KEY_INVALID` for both `gemma-4-26b-a4b-it` and `gemma-3-27b-it` |
| deployed Railway app | not applicable — runs `main`, which has no `language` field (as the brief noted) |

A local server was booted from this branch with `INFERENCE_PROVIDER=gemma-api` and the key loaded via `node --env-file`; `/health` reported `provider: gemma-api` correctly, and `POST /api/extract` returned 502 `INVALID_MODEL_OUTPUT` in 180 ms — too fast for inference, which the direct upstream probe then confirmed as an auth rejection rather than a model or prompt problem.

**So the 27B-class reference remains untested.** To unblock: supply a working `OPENROUTER_API_KEY` (or a valid `GEMINI_API_KEY`) and re-run — one call is enough.

### D.1 Substitute evidence — local models, same prompt (free, no hosted call)

Since the hosted cell is blocked and this is a go/no-go the controller needs, the same Mandarin memory was run through three **local** Ollama models via the real `/api/extract` path with `language: "zh"`. This is **not** a substitute for the hosted reference — it is a lower bound.

| model | `place`/`era`/`skills` canonical EN | `offers`/`wants` canonical EN | `safeSummary` in Mandarin |
|---|---|---|---|
| `gemma3:4b` | ✅ Queenstown / 1970s / radio repair | ✅ | ❌ **English**: "A memory of repairing radios in Queenstown during the 1970s." |
| `gemma3:12b` | ✅ | ❌ **Chinese**: `教别人基本的收音机维修` | ❌ **English** |
| `gemma4:12b-it-qat` | ✅ | ✅ | ❌ **mangled**: `"A memory of ...修理收音机"` |

Two things worth the controller's attention:

1. **The failure is the opposite of what the plan anticipated.** The plan treated canonical-English matching fields as the fragile half. In practice canonicalisation held on 2 of 3 models; it is **`safeSummary` staying in the participant's language that failed on 3 of 3**. `gemma3:12b` additionally leaked Chinese into `offers`/`wants`, which would silently break cross-language matching, since the matcher compares those fields literally.
2. **There is a prompt defect behind it** — see F3. The mangled `"A memory of ...修理收音机"` output is the model trying to obey two contradictory instructions at once, so this is not purely a small-model capability story and the hosted model may well hit it too.

The consent veto behaved correctly on this input across all three models — `我愿意` and `我想` were both present, and `offers`/`wants` survived.

## E. Translation review package — PASS

`.superpowers/sdd/2026-08-23-multilingual/translation-review.md` — **190 reviewable rows**, every one machine-drafted and unverified, with a ✅ column for the reviewer.

- **§1 High stakes first.** §1.1 the consent-detection phrase lists, framed by what a wrong entry *costs* (false negative = missed match, safe; false positive = an offer the person never made enters matching). The `我想` ambiguity is called out explicitly — and, because it was tested rather than assumed, §1.1 now also carries the six live negation leaks from F1, with a specific request that reviewers propose phrasings that survive negation. §1.2 the eleven privacy and consent promises, where a mistranslation changes a commitment rather than a tone. §1.3 the new Mandarin demo fixture, with a note that narrowing `我想` would require updating the fixture too.
- **§2** the full 169-key UI dictionary × zh/ms/ta (507 strings), kept in journey order in 18 blocks rather than one flat wall.
- **§3** the mock provider's canned capsule summaries. **§4** folded into §1.3.

---

## Findings

### F1 — The deterministic consent veto is defeated by negation in Mandarin and Tamil · **High**

`src/server/inference/consent-evidence.ts` describes itself as "a deterministic veto the model cannot talk past": an extracted `offer`/`want` is discarded unless the **raw memory** contains a curated explicit-consent phrase. Probing it with negated and ambiguous sentences, **6 of 12 probes cleared a veto that should have blocked them**:

| lang | probe | means | leaked |
|---|---|---|---|
| zh | `我不愿意教别人。` | "I am **not** willing to teach others" | **offer kept** — `愿意教` matches inside `不愿意教` |
| zh | `我不想学。` | "I do **not** want to learn" | **want kept** — `想学` matches inside `不想学` |
| zh | `我想那是1970年代。` | "I **think** that was the 1970s" | **want kept** — `我想` also means "I think" |
| zh | `我希望他好。` | "I hope **he** is well" | **want kept** — any hope, not a wish to connect |
| ta | `நான் உதவ முடியும் என்று நினைக்கவில்லை.` | "I do **not** think I can help" | **offer kept** |
| ta | `நான் விரும்புகிறேன் என்று சொல்லவில்லை.` | "I did **not** say I want to" | **want kept** |

English and Malay held on all four of their probes (`I cannot teach anyone.`, `I would not like to continue.`, `saya tidak sudi mengajar.`, `saya tidak mahu belajar.`).

**Root cause is structural, not a bad word choice.** The file's comment explains that zh/ta use plain substring alternation because `\b`/`\w` are meaningless for those scripts — correct as far as it goes, but it means the patterns match *anywhere*, and **Chinese and Tamil negate differently from English**: Chinese inserts `不` in the middle of the phrase (`不愿意教` still contains `愿意教`), and Tamil negates clause-finally with `…வில்லை`, after the matched phrase has already occurred. English and Malay happen to negate in a way that breaks their phrase patterns, which is why they pass and hid this.

**Blast radius, stated honestly:** this is a defence-in-depth layer. For a real leak the model must *also* have extracted an offer/want from a negated sentence — the veto is what is supposed to stop that from mattering. For two of four supported languages it currently does not.

### F2 — The consent decision and result screens argue in English to non-English participants · **High**

Deterministic server-generated prose renders untranslated on the two screens that matter most:

- `src/server/matching/matcher.ts:179-181` — the match rationale: *"These memories connect through Queenstown and radio repair. One person offered to share; the other asked to learn."* and *"Would you both like to listen and continue this story together?"*
- `src/server/rooms.ts:234-236` — the invite: *"You both said yes."* (the result `<h1>`) and *"A gentle conversation can begin. Either person may pause or stop at any time."*

The rationale appears on the **consent screen** — see `qa/screens/ta-mobile-4-consent.jpg`, where a Tamil senior is asked *"இந்த உரையாடல் தொடங்க வேண்டுமா?"* and then given the reason to say yes **in English**. It reappears on the result screen (`qa/screens/ta-mobile-5-guide.jpg`) under an English `You both said yes.` headline.

Measured on the result panel: **8 untranslated English lines** in every non-English locale — 68% of characters on the zh screen, 38% on ta (Malay is Latin-script so a character ratio is not meaningful; the same 8 lines are English).

Of those 8, **4 are the mock facilitator's guide body** and would be translated by real Gemini under Task 5. The other **4 are deterministic server strings that stay English with any facilitator**, including the `<h1>` and the consent rationale. This is not a model-capability question; it is four template strings with no dictionary behind them. The plan's Global Constraints list "consent review" and "guide display" as journey-critical, so this is a genuine coverage gap rather than an out-of-scope wall/admin surface.

### F3 — The capsule prompt contains a contradiction that pushes `safeSummary` back into English · **High**

`src/server/inference/capsule-prompt.ts`:

- line 16, in the shared base applied to **every** language: `Phrase safeSummary as "A memory of ...".`
- line 23, in the per-language rules: `Write safeSummary in the participant's language (${language}).`

For any non-English participant these instructions conflict — the model is told to open with a fixed English phrase *and* to write in Mandarin. Three local models resolved the conflict three different ways (§D.1), and `gemma4:12b-it-qat` split the difference literally, emitting `"A memory of ...修理收音机"`.

This is the most likely single cause of the "safeSummary comes back in English" behaviour, and it is a prompt fix rather than a model-capacity one — which also means it is worth fixing **before** spending the hosted call that D is blocked on, so the go/no-go tests the intended prompt. `CAPSULE_PROMPT_VERSION` would need bumping to 4.

### F4 — `MockFacilitator` is not language-aware, so nothing exercises the multilingual guide · **Medium**

`src/server/facilitation/mock-facilitator.ts` returns a hardcoded English guide and never sets `language` (schema-defaulted to `"en"`) or `englishFallback`. Consequences:

- `npm run demo:mock` and **the entire e2e suite** show an English guide body regardless of participant language — visible in all 8 guide screenshots, where Tamil/Mandarin chrome frames English guide content.
- Task 5's cross-language behaviour — a zh guide with an English fallback for the English listener — has **no runtime coverage at all**. Requirement A's unit tests now cover the client half of that decision, but nothing produces a non-English guide end-to-end.
- Because the mock guide is `language: "en"`, a zh viewer computes `showEnglishFallback = false` (languages differ but no fallback exists), so the fallback block is never rendered in any automated run.

Teaching the mock facilitator to echo `input.source.language` and to emit an `englishFallback` when the two participants differ would make the e2e suite cover the real path. That is a production-file change, so it is left as a finding.

### F5 — Journey labels sit at 9–11px on every screen in every language · **Medium, pre-existing**

Quantified across all 40 matrix cells. The Global Constraint is ≥18px body text on mobile.

| element | size | occurrences |
|---|---|---|
| `span.mono-label` (YOUR WORDS, PLACE, ERA, GEMINI · GUIDE …) | **10px** | 64 |
| `p.eyebrow` | **10px** | 40 |
| `span` (evidence chips) | **11px** | 32 |
| `span.prepared-image-badge`, image caption, char counter | **9px** | 24 |
| `p.privacy-note` | **10px** | 8 |
| `small` | 13–16px | 60 |

Sizes are **identical across all four languages**, so this is not a multilingual regression — but it is materially worse in Tamil (complex conjuncts, above- and below-base marks) and Mandarin (dense glyphs) than in the Latin baseline the rule was written against, and `text-transform: uppercase` plus positive `letter-spacing` are Latin-specific treatments applied to Tamil clusters. Interactive targets are all ≥48px, so the touch rule holds.

### F6 — Evidence-path chips clip about 9px of content · **Low, language-independent**

On all 8 guide cells, three chips report `scrollWidth > clientWidth`: `Queenstown` 109/100, `1970s` 61/52, `radio repair` 107/98 — a consistent 9px overhang, most likely the `::after` arrow rather than the label. The chips read correctly in the screenshots, so this is cosmetic. The content is canonical English by design, so it is identical in every locale.

---

## What was verified and is fine

- 40/40 matrix cells: no horizontal overflow, nothing offscreen, no sub-48px touch target, no page errors.
- Mandarin `safeSummary` + canonical English matching fields render together correctly in the UI on the mock path (asserted in e2e, visible in `qa/screens/*-3-review.jpg`).
- Read-aloud feature detection hides and shows correctly, and the `zh-SG → zh-CN` / `ta-SG → ta-IN` fallbacks are load-bearing on the real demo machine.
- The consent veto keeps offers and wants for the intended zh phrasing on all three local models.
- Language selection, URL persistence and the English fallback for invalid `?lang=` values were re-confirmed green (carried over from the Task 2 smoke, unchanged since).

## Recommended order for the controller

1. **F3** (prompt contradiction) — cheap, and it should land *before* the hosted call so D tests the intended prompt.
2. **F1** (consent veto negation) — safety layer, two of four languages.
3. **D** — supply a key, re-run the one call, close the go/no-go.
4. **F2** (English on the consent/result screens) — four template strings plus dictionary keys.
5. **F4** (language-aware mock facilitator) — unlocks real e2e coverage of Task 5.
6. **F5 / F6** — styling pass, and the phone leg of the voice matrix before the event.
7. **User gate:** `translation-review.md` to Tanveer or a native speaker. Not optional — 507 UI strings and the six consent phrase lists are all unverified machine drafts.
