# Architecture

## One room, three surfaces

```text
Participant phone ── local Wi-Fi ──▶ Presentation Mac
Projected wall   ◀── room events ───  Express + Socket.IO + Zod
Presenter admin  ─── controls ─────▶  Open Gemma via Ollama
                                      MiniSearch + score
                                      ephemeral room Map
```

Development runs Vite on port 5173 and proxies API and Socket.IO traffic to Express on port 3001. Judging uses the production build on the presentation Mac: Express serves `dist/client` on port 3000 and owns the Socket.IO room state. The same production process runs on Cloud Run for online review.

## Core sequence

1. Join Mode submits a short memory to `/api/extract`.
2. The server removes obvious contact details before inference; in judging mode, the request stays on the local Mac.
3. Gemma returns a schema-constrained capsule: summary, observations, era, place, skills, offer/want, redactions and uncertainty.
4. Zod validates the response. Invalid output gets one repair attempt, then a safe failure.
5. The participant reviews and explicitly approves the capsule.
6. Only the approved capsule enters the ephemeral room and matching pipeline.
7. MiniSearch retrieves up to three fictional candidates; a deterministic weighted scorer either returns a match or `NO MATCH`.
8. Socket.IO lights the wall and sends the invitation back to the phone.

## Inference modes

| Mode | Model | Purpose | Secret/network |
|---|---|---|---|
| `ollama` | `gemma3:4b` | Primary private judging path on Apple Silicon | no key; local network only |
| `gemma-api` | `gemma-4-26b-a4b-it` | Public online-review path on Cloud Run | server-side `GEMINI_API_KEY` |
| `mock` | deterministic fixture | Automated tests and UI development only | none |

All providers implement the same typed interface and must return the same Zod schema. The model interprets the memory; it does not decide who is safe to contact. Matching remains explainable application logic, and low evidence returns no match.

## Privacy and safety boundary

- No authentication, contact exchange, database, object storage, analytics SDK or raw-input logging.
- Memory and optional compressed image exist only for the request; room state stores only an approved capsule.
- The Gemini key exists only in the server process or Secret Manager.
- Logs contain request ID, method, path, status and duration—not the memory or model response.
- Provider timeout or malformed output creates no room event and shares nothing.
- Public fixtures and generated assets are synthetic and non-identifying.

## Deployment decision record

- **Decision:** run open Gemma and the production app on one presentation Mac for judging; keep one public Cloud Run service in `asia-southeast1` for online review.
- **Why:** local inference keeps memories under community control and works without internet; the hosted path remains easy for remote reviewers to access.
- **Trade-off:** the in-memory room cannot scale across replicas. This is deliberate for a live-room prototype; max instances stays one.
- **Recovery:** use the explicitly labelled hosted Gemma URL if local Ollama fails. If neither real model works, stop rather than simulate inference.
- **Excluded:** Redis, databases, queues, vector stores, multi-region hosting, self-hosted GPUs and native mobile packaging.

Cloud deployment still requires the repository owner's explicit confirmation of the hackathon project and service before it is executed.
