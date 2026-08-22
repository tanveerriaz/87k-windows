# 87K Windows — Hackathon Submission

## Organizer requirements

The [official participant guide](https://65labs-gemini-hack.notion.site/) sets a **3:30 PM SGT sharp** submission deadline. The team target remains 3:00 PM so there is a safety margin.

- Public GitHub repository
- Demo video no longer than 3 minutes
- Project name and one-line description
- No more than two selected tracks

## Tracks

87K Windows is entered in:

1. **Best Elderly Hack — Silver AI: Designing Gemini for Seniors** (**primary Track 2 target**)
2. **Best Use of Gemma** (secondary)

## One-line description

87K Windows uses Gemini to give seniors a voice-accessible, consent-first way to begin a real human conversation, while local Gemma protects the raw memory before matching.

## The core loop

```text
ask one humane question
    → listen or type
    → Gemma extracts an evidence-grounded capsule
    → the participant approves what can be shared
    → one window lights on the wall
    → a transparent matcher finds a second life
    → only after a valid match, Gemini prepares two gentle questions
    → the guide can be read aloud slowly
    → two windows glow while the people choose whether to talk
```

The phone is the quiet doorway. The projected wall is the shared experience. Gemini is the context-aware senior facilitator: it turns two approved capsules and their visible evidence into a short, read-aloud conversation bridge. It does not imitate a friend. Gemma is the local privacy layer that preserves what was actually said and marks uncertainty before anything can reach matching or Gemini.

## Why Gemini is essential to Track 2

Gemini 3.6 Flash performs the senior-facing task that static templates cannot: after a grounded match, it adapts a plain-language introduction and exactly two optional questions to the two approved memories. The result includes an explicit reminder that either person may pause or stop and a large `Read this aloud` control with a slower cadence.

This role is load-bearing and bounded:

- Gemini receives only the approved safe capsules, the visible evidence path and the match explanation;
- Gemini never receives raw memory text, photos, identifiers, contact details or unmatched submissions;
- deterministic code—not Gemini—decides `MATCH` or `NO MATCH YET`;
- Gemini cannot change confidence, invent acceptance or override a refusal;
- if Gemini is unavailable, the evidence-backed match remains visible and the guide is honestly marked unavailable.

## Why Gemma is essential

The primary judging path runs open `gemma3:4b` locally through Ollama on the presentation Mac. Raw-memory interpretation stays on the community-operated machine and phones join through a trusted private hotspot. Gemma extraction can continue without internet as an explicitly labelled partial recovery, while the complete Track 2 guide requires Gemini connectivity. The prototype's phone-to-Mac HTTP transport is not encrypted, so shared event Wi-Fi is explicitly out of scope.

The online-review path calls hosted Gemma server-side through the Gemini API. Its key never enters browser code or a public fixture. Both providers return the same constrained capsule, which the server validates before anything can enter matching.

Gemma's role is deliberately narrow and visible:

- identify observations, skills, interests, offers and wants from the submitted memory;
- keep names, dates, locations and other details that were not stated as unknown;
- produce a short safe summary and uncertainty notes;
- provide the evidence that the matcher can use to find a connection;
- return a safe failure when the model times out or produces invalid output.

Both paths use a real Gemma model and display the active provider. There is no automatic provider switching; if the selected real model is unavailable, the demo stops rather than simulating inference.

## Why it fits the Elderly Hack

The interaction is designed for an older participant: one question at a time, large controls, a calm review step, and no requirement to understand AI terminology. Voice dictation and typed input lead to the same editable review step, so speaking is optional. The wall turns a private recollection into a respectful invitation to connect.

The experience maps directly to Track 2's published judging weights:

| Criterion | Weight | Evidence in the demo |
| --- | ---: | --- |
| Empathy and usability | 40% | One gentle prompt; editable voice/text input; at least 18 px mobile copy; at least 48 px targets; slower read-aloud Gemini guide; explicit pause/stop language |
| Contextual safety and reliability | 30% | Participant approval; raw/safe data boundary; visible evidence and uncertainty; Gemini only after `MATCH`; honest `NO MATCH YET`; explicit guide failure |
| Real-world impact and feasibility | 30% | Zero-install phones; one community Mac and one Node process; local Gemma privacy layer; server-side Gemini; no database, accounts or permanent storage |

It also maps to the track themes: voice-first accessibility through editable speech input and slow read-aloud output; context-aware caregiving without medical claims; and family/community connection through an intergenerational oral-history bridge.

## What judges can verify quickly

1. Start with the prepared fictional radio memory.
2. See local `gemma3:4b` extract a capsule and keep uncertainty visible.
3. Approve the capsule before matching begins.
4. Read the exact Queenstown, 1970s, radio-repair and teach-to-learn evidence.
5. See Gemini 3.6 Flash prepare two optional questions and use `Read this aloud`.
6. Run the negative fixture and see both the product refuse a weak connection and Gemini remain unused.

## Privacy and safety

- The repository contains synthetic fictional stories only.
- Do not use real family stories, personal photographs, recordings, contact details or identifying information in the demo.
- The participant approves a capsule before it enters matching.
- Raw memory text and image data are processed ephemerally; they are not part of the committed fixtures.
- API keys and cloud credentials are server-side environment variables only.
- Generated output is shown as observations, evidence, uncertainty and safe summary—not hidden chain-of-thought.
- A weak match returns `NO MATCH YET`; the system does not invent a connection.

## Runtime modes

| Mode | Purpose | Credential requirement |
| --- | --- | --- |
| Track 2 judging | Local Gemma extraction + Gemini 3.6 senior guide | Local `gemma3:4b`, trusted hotspot and server-side `GEMINI_API_KEY` |
| Online review | Hosted Gemma extraction + Gemini 3.6 senior guide | Server-side `GEMINI_API_KEY` |
| Offline recovery | Local Gemma extraction; Gemini guide disabled | Local `gemma3:4b`; incomplete Track 2 fallback |

The deterministic provider is restricted to automated tests and UI development. It is not part of the hackathon presentation.

Cloud Run is the public application host. The application listens on the platform-provided `PORT`, keeps room state ephemeral, and exposes `/health`. No database, vector store, queue, or persistent audio store is needed for the hackathon slice.

## Public-repository checklist

- [ ] Repository visibility is Public.
- [ ] README explains setup, demo routes, provider modes and the model choice.
- [ ] `.env` and credential files are ignored and absent from Git history for this submission.
- [ ] `.env.example` contains names only, with empty secret values.
- [ ] Fixtures and screenshots are fictional and synthetic.
- [ ] No personal photographs, recordings, raw submissions or machine-specific paths are committed.
- [ ] Cloud Run health endpoint responds successfully.
- [ ] The active provider label is truthful during the demo.
- [ ] Final gates pass: lint, typecheck, unit/integration tests, build and E2E.
- [ ] The demo video shows the core loop before explaining infrastructure.

## Final handoff

The memorable moment is not a dashboard or a chat transcript. It is a dark wall becoming human: Gemma protects one memory, evidence reaches another fictional life, and Gemini gives the two people a gentle way to begin—then gets out of the conversation.
