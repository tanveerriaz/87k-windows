# Architecture

## One room, three surfaces

```text
Participant phone ── private hotspot ──▶ Presentation Mac
Projected wall   ◀── room events ───  Express + Socket.IO + Zod
Presenter admin  ─── controls ─────▶  Open Gemma via Ollama
                                      MiniSearch + score
                                      Gemini 3.6 Flash API
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
8. On `NO MATCH`, the server returns `NO MATCH YET` and never calls Gemini.
9. On `MATCH`, Gemini 3.6 Flash receives only the two approved safe capsules, visible evidence path and match explanation, then returns a schema-constrained senior guide: one introduction, exactly two questions and a pause/stop reminder.
10. Socket.IO lights the wall and sends the invitation and guide back to the phone. Browser speech synthesis can read the same visible guide aloud at a slower cadence.

## Inference modes

| Mode | Model | Purpose | Secret/network |
|---|---|---|---|
| `ollama` | `gemma3:4b` | Primary on-device judging path on Apple Silicon | no key; trusted hotspot only |
| `gemma-api` | `gemma-4-26b-a4b-it` | Public online-review path on Cloud Run | server-side `GEMINI_API_KEY` |
| `mock` | deterministic fixture | Automated tests and UI development only | none |

All providers implement the same typed interface and must return the same Zod schema. The model interprets the memory; it does not decide who is safe to contact. Matching remains explainable application logic, and low evidence returns no match.

The local Ollama path permits one in-flight extraction. A second submission receives `409 LOCAL_GEMMA_BUSY` and may retry when the first capsule is ready. This is an explicit prototype limit for the presentation Mac, not a scaling claim.

## Facilitation modes

| Mode | Model | Purpose | Secret/network |
|---|---|---|---|
| `gemini` | `gemini-3.6-flash` | Track 2 senior connection guide after a valid match | server-side `GEMINI_API_KEY` |
| `disabled` | none | Offline Gemma-only recovery | none |
| `mock` | deterministic guide | Automated tests only | none |

The facilitator is separate from inference so both model roles remain visible. A Gemini timeout or invalid response sets `guideError`; it never removes the grounded match or substitutes invented copy.

## Privacy and safety boundary

- No authentication, contact exchange, database, object storage, analytics SDK or raw-input logging.
- Local inference stays on the Mac, but phone-to-Mac traffic is plain HTTP; use a trusted private hotspot, never shared event Wi-Fi.
- Memory and optional compressed image exist only for the request; room state stores only an approved capsule.
- The Gemini key exists only in the server process or Secret Manager.
- Gemini receives no raw memory, images, contact data, capsule IDs, redaction details or unmatched submissions.
- Logs contain request ID, method, path, status and duration—not the memory or model response.
- Provider timeout or malformed output creates no room event and shares nothing.
- Public fixtures and generated assets are synthetic and non-identifying.

## Deployment decision record

- **Decision:** target Track 2 with local Gemma as the private extraction layer and Gemini 3.6 Flash as the senior facilitator; keep one public Cloud Run service in `asia-southeast1` for online review.
- **Why:** participants install nothing, raw memories stay on the community Mac during judging, and Gemini still performs a visible, context-aware senior task.
- **Trade-off:** the in-memory room cannot scale across replicas. This is deliberate for a live-room prototype; max instances stays one.
- **Recovery:** use the explicitly labelled hosted Gemma + Gemini URL if local Ollama fails. The Gemma-only local mode is an offline partial recovery, not the complete Track 2 demo. Never simulate inference during judging.
- **Excluded:** Redis, databases, queues, vector stores, multi-region hosting, self-hosted GPUs and native mobile packaging.

Cloud deployment still requires the repository owner's explicit confirmation of the hackathon project and service before it is executed.
