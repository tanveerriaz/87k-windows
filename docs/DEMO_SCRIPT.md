# 87K Windows — 90-second Track 2 demo

Use one browser window for `/wall/<room>` and one phone for `/join/<room>`. Launch with `npm run demo:judge`; the status must show `LOCAL GEMMA + GEMINI`. Use only the prepared fictional fixtures.

The organizer permits a maximum three-minute video. This version proves the complete senior-facing Gemini loop in 90 seconds.

## 0:00–0:12 — Set the stakes

**Show:** The dark wall.

**Say:**

> Every dark window is a life we have not asked about. 87K Windows is not an AI companion. It helps an older person turn one memory into a safe beginning with another human being.

## 0:12–0:30 — Voice-first, patient and consented

**Show:** The large question and voice/type controls. Use the prepared fictional Queenstown radio memory. Show the editable text and review screen.

**Say:**

> There is one question at a time. A participant can speak slowly, pause, type or edit. Local Gemma turns the raw memory into a small evidence capsule on this Mac. The participant—not the model—approves what may be shared.

Point to the safe summary, offer, uncertainty and approval button. Do not show or use real personal data.

## 0:30–0:45 — Reliability before emotion

**Show:** Approve. The first window lights, evidence appears and the grounded match is revealed.

**Say:**

> Transparent code decides whether the evidence holds. It can return `NO MATCH YET`; Gemini cannot force a connection or change the confidence. Here, Queenstown, the 1970s, radio repair and teach-to-learn form the visible bridge.

## 0:45–1:08 — Gemini for seniors

**Show:** The `GEMINI · SENIOR CONNECTION GUIDE` on the wall and phone. Press `Read this aloud`.

**Say:**

> Now Gemini 3.6 Flash does the Track 2 work. It sees only the two approved safe capsules and this visible evidence—not the raw memory, photo or contact details. It creates two optional, plain-language questions and an explicit reminder that either person may pause or stop. The guide can be read aloud slowly, but it always stays visible.

> Gemini creates the beginning. The people create the relationship.

## 1:08–1:20 — Prove the refusal

**Show:** Briefly use the prepared no-match fixture, or cut to its recorded result.

**Say:**

> With weak evidence, there is no invitation and Gemini is never called. Empathy without reliability is manipulation; this product refuses that.

## 1:20–1:30 — Close on feasibility

**Show:** Admin Mode’s Track 2 model panel, then the completed wall.

**Say:**

> Phones install nothing. Local Gemma protects the memory, server-side Gemini helps seniors begin, and one community Mac runs the room. AI steps back as soon as two humans can step forward.

## If judges ask

- **Why both?** Gemma is the private local interpreter; Gemini is the context-aware senior facilitator. Neither is decorative.
- **Why not Gemini Live?** The hackathon slice prioritizes reliable editable input and a visible read-aloud guide. It never hides meaning in an ephemeral voice exchange.
- **Who chooses the match?** Deterministic application logic with a visible threshold. Gemini only runs after `MATCH`.
- **What reaches Gemini?** Two approved safe capsules, the evidence path and match explanation. No raw memory, image, contact data or unmatched submission.
- **Where is the key?** A server-side environment variable only—never browser code or the public repository.

## Before recording

- [ ] Run `npm run demo:judge`; confirm `LOCAL GEMMA + GEMINI` and real Gemini 3.6 Flash in Admin Mode.
- [ ] Confirm Ollama has `gemma3:4b` loaded and the server has `GEMINI_API_KEY` without printing it.
- [ ] Use a trusted private hotspot, never shared event Wi-Fi.
- [ ] Test `Read this aloud`, Stop, large controls and 18 px mobile copy.
- [ ] Test Queenstown/radio, wall reconnect and `NO MATCH YET`.
- [ ] Use fictional fixtures only; remove real photos and recordings.
- [ ] Keep the final video below three minutes and put the working core loop first.
- [ ] Run lint, typecheck, tests, build and E2E before uploading.
