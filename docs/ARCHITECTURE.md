# Architecture

## One room, three surfaces

```text
┌──────────────────┐       HTTPS / Socket.IO       ┌────────────────────────────┐
│ Participant phone│ ────────────────────────────▶ │ One Cloud Run Node process │
│ ask, tell, review│                               │ Express + Socket.IO + Zod  │
└──────────────────┘                               │                            │
                                                   │  ┌──────────────────────┐  │
┌──────────────────┐       live room events        │  │ hosted Gemma 4       │  │
│ Projected wall   │ ◀──────────────────────────── │  │ safe capsule only    │  │
│ light + connect  │                               │  └──────────────────────┘  │
└──────────────────┘                               │            │               │
                                                   │  MiniSearch + score        │
┌──────────────────┐       reset / inject          │  ephemeral room Map        │
│ Presenter admin  │ ◀───────────────────────────▶ │  two-hour expiry           │
└──────────────────┘                               └────────────────────────────┘
```

Development runs Vite on port 5173 and proxies API and Socket.IO traffic to Express on port 3001. Production is one container: Express serves `dist/client`, listens on Cloud Run's `PORT`, and owns the Socket.IO room state.

## Core sequence

1. Join Mode submits a short memory to `/api/extract`.
2. The server removes obvious contact details before any hosted inference call.
3. Gemma returns a schema-constrained capsule: summary, observations, era, place, skills, offer/want, redactions and uncertainty.
4. Zod validates the response. Invalid output gets one repair attempt, then a safe failure.
5. The participant reviews and explicitly approves the capsule.
6. Only the approved capsule enters the ephemeral room and matching pipeline.
7. MiniSearch retrieves up to three fictional candidates; a deterministic weighted scorer either returns a match or `NO MATCH`.
8. Socket.IO lights the wall and sends the invitation back to the phone.

## Inference modes

| Mode | Model | Purpose | Secret/network |
|---|---|---|---|
| `gemma-api` | `gemma-4-26b-a4b-it` | Judged primary path on Cloud Run | server-side `GEMINI_API_KEY` |
| `ollama` | `gemma3:4b` | Native Apple Silicon fallback | no key; local network only |
| `mock` | deterministic fixture | Emergency and reproducible tests | none |

All providers implement the same typed interface and must return the same Zod schema. The model interprets the memory; it does not decide who is safe to contact. Matching remains explainable application logic, and low evidence returns no match.

## Privacy and safety boundary

- No authentication, contact exchange, database, object storage, analytics SDK or raw-input logging.
- Memory and optional compressed image exist only for the request; room state stores only an approved capsule.
- The Gemini key exists only in the server process or Secret Manager.
- Logs contain request ID, method, path, status and duration—not the memory or model response.
- Provider timeout or malformed output creates no room event and shares nothing.
- Public fixtures and generated assets are synthetic and non-identifying.

## Deployment decision record

- **Decision:** one public Cloud Run service in `asia-southeast1`, maximum one instance during the demo.
- **Why:** phone and projector need one public origin, Socket.IO needs a shared room process, and the hackathon credit supports a short judging deployment.
- **Trade-off:** the in-memory room cannot scale across replicas. This is deliberate for a live-room prototype; max instances stays one.
- **Fallbacks:** native Ollama on the M4 MacBook Air, then deterministic Mock Mode.
- **Recovery:** redeploy the last public Git commit or switch the presenter to a local URL; no durable user data needs migration.
- **Excluded:** Redis, databases, queues, vector stores, multi-region hosting, self-hosted GPUs and native mobile packaging.

Cloud deployment still requires the repository owner's explicit confirmation of the hackathon project and service before it is executed.
