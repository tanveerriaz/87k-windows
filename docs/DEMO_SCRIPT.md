# 87K Windows — 90-second demo script

Use one browser window for `/wall/<room>` and one phone-sized window for `/join/<room>`. Keep the provider label visible but unobtrusive. Use only the prepared fictional fixtures.

## 0:00–0:15 — Set the stakes

**Show:** The wall is dark.

**Say:**

> Every dark window stands for a life we have not asked about yet. 87K Windows gives an older person one gentle question, listens to the answer, and makes a respectful connection visible.

> Older people are not profiles to complete. They are witnesses, makers and teachers. The question is whether someone is ready to listen and learn.

## 0:15–0:30 — Ask and share

**Show:** Join Mode with the large question and voice/type controls. Choose the prepared fictional radio memory if live voice is not available.

**Say:**

> The participant does not fill out a profile or chat with a bot. They answer one question and review what can be shared. Today’s story is fictional: a Queenstown radio-repair memory.

Submit the memory and show the capsule review. Point out the observed evidence, safe summary, redactions and uncertainty. Approve it.

## 0:30–0:48 — Gemma does the useful work

**Show:** The first window lights and the capsule appears on the wall.

**Say:**

> Open Gemma runs here on the presentation Mac. The elder's words do not leave the local network. It is not writing a personality or inventing a biography. It extracts only what the memory supports, keeps uncertainty visible, and gives the matcher evidence it can explain.

If asked about credentials, say:

> The Gemini API key is a server-side environment variable; it is never shipped to the browser or committed to this public repository.

## 0:48–1:05 — Reveal the connection

**Show:** A second prepared fictional window lights and the bridge animates.

**Say:**

> The matcher now finds a second fictional life with a grounded shared thread. The two windows glow together because the evidence connects them—not because the model guessed a person’s identity.

> One person remembers how. Another wants to learn. That is the bridge.

Point briefly to the evidence path and suggested invitation. Make clear that the second story is a fictional fixture, not a person who has already accepted. In a real community room, both people would still choose whether to listen. If using the no-match fixture, show `NO MATCH YET` and say that the system refuses to force a weak connection.

## 1:05–1:20 — Explain reliability and access

**Show:** The provider status or admin provider panel.

**Say:**

> Live judging uses open Gemma locally through Ollama, so the community controls where memories are interpreted and the demo can continue offline. Cloud Run uses hosted Gemma for online reviewers. Both paths are explicit real-model modes; neither falls back to simulation.

## 1:20–1:30 — Close

**Show:** The completed wall with both windows glowing.

**Say:**

> The phone is the doorway, Gemma is the careful listener, transparent matching draws the bridge, and the wall is the collective memory. Ask, listen, light a window, and discover which lives are connected.

## Before recording

- [ ] Use fictional fixtures only; remove real photos and recordings from the demo.
- [ ] Confirm the displayed provider matches the actual server mode.
- [ ] Confirm the status reads `LOCAL GEMMA · PRIVATE` and Ollama has `gemma3:4b` loaded.
- [ ] Open Wall Mode before Join Mode so the first glow is visible.
- [ ] Keep the prepared radio story and no-match fixture ready.
- [ ] Test the positive match and `NO MATCH YET` paths once.
- [ ] Record the core loop first; explain the separate Cloud Run online-review path afterward.
- [ ] Check that the public repository URL is included in the submission.
- [ ] Run lint, typecheck, tests, build and E2E before uploading.
