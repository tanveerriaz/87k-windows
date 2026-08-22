# 87K Windows — Hackathon Submission

## Tracks

87K Windows is entered in:

1. **Best Use of Gemma**
2. **Best Elderly Hack**

## One-line description

87K Windows is a voice-first living memory wall where Gemma turns a fictional memory into a consented story capsule and gives a transparent matcher evidence for a meaningful connection between two lives.

## The core loop

```text
ask one humane question
    → listen or type
    → Gemma extracts an evidence-grounded capsule
    → the participant approves what can be shared
    → one window lights on the wall
    → a transparent matcher finds a second life
    → two windows glow together with an explainable bridge
```

The phone is the quiet doorway. The projected wall is the shared experience. Gemma is useful because it preserves what was actually said and marks uncertainty; transparent application logic then makes a human connection visible without pretending to be a companion.

## Why Gemma is essential

The primary judging path runs open `gemma3:4b` locally through Ollama on the presentation Mac. An elder's words stay on the community-operated machine, phones join over local Wi-Fi, and the experience remains available without internet access. This makes Gemma's openness essential to privacy, resilience and community control.

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
| Local Gemma | Primary private presentation path through Ollama | Local `gemma3:4b`; no API key or internet required |
| Cloud / hosted Gemma | Public online-review path on Cloud Run | Server-side `GEMINI_API_KEY` |

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

The memorable moment is not a dashboard or a chat transcript. It is a dark wall becoming human: one approved Gemma capsule lights a window, a grounded thread reaches another fictional life, and both windows glow together.
