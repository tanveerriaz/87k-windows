# Architecture

## Runtime

87K Windows is one TypeScript repository and one deployable Node process:

```text
Phone or projector browser
  ├── React and Vite interface
  ├── typed Socket.IO room events
  └── Express JSON endpoints
          ├── Zod validation and in-memory rate limits
          ├── Mock Mode capsule extraction
          ├── MiniSearch top-three retrieval
          └── ephemeral room Map with two-hour expiry
```

In development, Vite runs on port 5173 and proxies API and Socket.IO traffic to Express on port 3001. The production build defaults to port 3000 and is served by Express from the same origin.

## Room lifecycle

1. Every client joins a room and receives its current snapshot.
2. Join Mode submits input to `/api/extract`; raw text and image data are not added to room state.
3. A Zod-validated safe capsule is returned for participant review.
4. Approval sends only the capsule through Socket.IO.
5. The room emits a lit window, starts matching, and broadcasts a match or no-match result.
6. Refresh or reconnection rejoins the room and restores the snapshot.
7. Inactive rooms expire after the configured time.

## Matching

MiniSearch first finds up to three prepared candidates. A deterministic scorer then applies:

- 35% shared place;
- 25% skill or interest relationship;
- 20% shared era;
- 20% complementary offer and want.

A result below `MATCH_THRESHOLD` returns `NO_MATCH`. Mock Mode uses the same shared Zod schemas that future providers must satisfy.

## Privacy boundary

The browser may send a compressed image and one memory to Express, where they are processed in memory. Room state stores only redacted capsules, scene state and invitation text. Logs contain request identifiers and timing only. No database, file upload directory, Redis, authentication or browser-side secret is used.

## Future providers

`INFERENCE_PROVIDER` supports `mock` and the optional native `ollama` path using `gemma3:4b`. Hosted `gemma-api` integration remains deliberately disabled. Hosted credentials will remain server-side when that later milestone begins.

## Machine and deployment decision

- **Project type:** live, room-based AI hackathon prototype.
- **Stage and audience:** local verified slice for judges; synthetic data only.
- **Recommended architecture:** one Railway Node service later, native Ollama on the presentation Mac for offline use, and deterministic Mock Mode as the final safety net.
- **Why this is the smallest suitable design:** a persistent Socket.IO room needs one process; no database, Redis, queue or second cloud service is needed.
- **Build target:** Mac Mini, with GitHub as the only machine-to-machine source bridge.
- **Presentation target:** MacBook Air M4 with 16 GB memory, Node 22 and fresh locked dependencies.
- **Incremental prototype cost:** no new paid product is required for local and Mock modes; Railway uses existing account capacity only after deployment approval.
- **Security and data controls:** safe synthetic fixtures, ephemeral room memory, server-only secrets, request limits and no raw-input logs.
- **Deliberately excluded:** Docker for local inference, Mac Mini-only models, durable storage, public Mac hosting and multi-replica state.
- **Deployment approval status:** NOT REQUESTED.
