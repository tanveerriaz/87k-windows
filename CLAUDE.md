# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` contains the binding working agreements, quality gates, experience rules and scope exclusions for this repository. Read it and follow it; this file summarizes commands and architecture and does not replace it.

**Cross-session sync (Cursor ↔ Claude Code):** Before hosting or deploy work, read [`docs/CURSOR_SESSION_HANDOFF.md`](docs/CURSOR_SESSION_HANDOFF.md). It lists in-flight Railway migration state, the user's Railway project ID, and uncommitted Cursor changes to avoid duplicate work.

## What this is

87K Windows is a hackathon prototype (Track 2): a live-room experience where an older person shares a short memory, open Gemma extracts a consented "safe capsule" locally, a transparent deterministic matcher finds (or honestly refuses to find) a listener, and Gemini 3.6 Flash writes a senior-friendly conversation guide only after a valid match. One TypeScript repo, one deployable Node process. All story data is synthetic and clearly fictional.

## Commands

```bash
npm run dev          # Vite client (5173) + tsx watch server (3001); CLIENT_PORT/SERVER_PORT override
npm run lint         # eslint .
npm run typecheck    # tsc --noEmit
npm test             # vitest run (tests/unit + tests/integration)
npm run build        # vite build (dist/client) + tsup server bundle (dist/server)
npm run test:e2e     # Playwright two-tab flow; boots its own dev server on ports 15173/13001 with mock providers
```

Run a single test file: `npx vitest run tests/unit/matcher.test.ts` (or `npx playwright test tests/e2e/demo.spec.ts`).

Quality gates after meaningful code changes (same four as CI): `npm run lint && npm run typecheck && npm test && npm run build`.

Demo launchers (`scripts/run-demo.sh`, macOS Apple Silicon + Node 22 only):

- `npm run demo:judge` — local Ollama `gemma3:4b` extraction + Gemini facilitation (requires `GEMINI_API_KEY`); the Track 2 judging path
- `npm run demo:local` — local Gemma only, facilitator disabled (offline recovery)
- `npm run demo:gemma` — hosted Gemma + Gemini via `GEMINI_API_KEY`
- `npm run demo:mock` — deterministic test harness; never shown during judging

## Architecture

**One process, three surfaces.** Express + Socket.IO serves the built React client and owns all room state in memory (`src/server/rooms.ts`). Client routes (`src/client/routes/`): landing page, `/join/:room` (share → review → approve), `/wall/:room` (projected Canvas HDB wall — `hdb-wall-canvas.tsx`, never 87k DOM nodes), `/admin/:room` (presenter controls). In dev, Vite proxies `/api`, `/health` and `/socket.io` to the server port. There is deliberately no database, queue, auth or vector store; **one hosted instance** (Railway; formerly ephemeral hackathon Cloud Run) because room state is in-memory. Deploy guide: [`docs/RAILWAY_DEPLOYMENT.md`](docs/RAILWAY_DEPLOYMENT.md). Railway project ID: `052f7a55-c85f-45d7-8247-f635829b09d0`.

**Core pipeline** (`src/server/app.ts` routes): `POST /api/extract` → server-side contact-detail redaction → inference provider returns a Zod-validated capsule (one repair attempt, then safe failure) → participant approves over Socket.IO (`capsule:approved`) → `rooms.approve` in `src/server/rooms.ts` scores the pair with the deterministic weighted matcher (`src/server/matching/matcher.ts`, threshold `MATCH_THRESHOLD` default 0.62) → on match only, `rooms.ts` calls the Gemini facilitator for a schema-constrained guide. The REST `POST /api/match` and `POST /api/invite` routes are a stateless test-only surface; `/api/invite` returns a static card and never calls Gemini. Weak evidence returns `NO MATCH YET`; no-match never calls Gemini, and Gemini never receives raw memory text, images or contact data.

**Provider abstraction.** Extraction providers in `src/server/inference/` (`mock`, `ollama`, `gemma-api`, `openrouter`) and facilitation providers in `src/server/facilitation/` (`gemini`, `mock`, `disabled`) implement common typed interfaces and must return the same Zod schemas. Selection and validation happen in `src/server/env.ts` via `INFERENCE_PROVIDER` and `GEMINI_FACILITATOR`; the schema enforces which API keys each combination requires. The local Ollama path allows one in-flight extraction and returns `409 LOCAL_GEMMA_BUSY` otherwise.

**Shared contracts.** `src/shared/` holds the Zod schemas (`schemas.ts`), typed Socket.IO events (`events.ts`) and prepared demo copy (`demo.ts`) used by both client and server. Keep new schemas and event types there.

**Testability.** `createApp(dependencies)` in `src/server/app.ts` takes injected dependencies (`AppDependencies`), so unit/integration tests swap in mock providers without network access. The Playwright spec is the critical flow: participant submission must update Wall Mode in a second tab, produce the Queenstown radio match, survive a wall reload, and return an honest no-match for the negative fixture.

## Hard constraints (from AGENTS.md — see it for the full list)

- Mock/deterministic providers are for tests and UI development only; never present them during judging, and never silently fall back to simulated inference.
- Secrets stay server-side. Never use `VITE_*` for secrets; never commit `.env`, credentials, raw submissions or machine-specific absolute paths. The repo is public — assume every tracked file is visible.
- Synthetic data only; do not persist uploads or raw memory text. Never display hidden chain-of-thought — show evidence, confidence, uncertainty and missing information.
- Public hosting is moving to **Railway** (hackathon Cloud Run expired). Do not deploy/mutate Google Cloud resources, push, open PRs, or add a licence without explicit user authorization. Railway deploy is authorized; see handoff doc.
- Scope exclusions: no auth, payments, contact exchange, permanent storage, vector DBs, queues, microservices, native apps.
- UX: mobile body text ≥ 18 px, touch targets ≥ 48 px, Wall legible at 1280×720, respect `prefers-reduced-motion`.
