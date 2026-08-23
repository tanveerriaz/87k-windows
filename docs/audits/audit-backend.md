# 87K Windows — Backend Architecture Audit

Scope: `src/server/**`, `src/shared/**`, `scripts/run-demo.sh`, `Dockerfile`, `tests/**`, read against `AGENTS.md` and `docs/ARCHITECTURE.md`. Reviewed as-is on disk, including the uncommitted `openrouter-client.ts` change. Read-only; nothing was modified.

## Summary

The Gemma/Gemini split is deliberate and enforced in code, not prompt text: Gemini is unreachable on the NO_MATCH path (`rooms.ts:150-155`) and only ever receives a projection of the approved capsule (`gemini-facilitator.ts:30-41`). The privacy rationale holds only for the Ollama path; the hosted deployments send raw memory off-device, so there the split is capability and cost. The real risks are elsewhere — the entire Socket.IO surface is unvalidated, unauthenticated and unmetered, one malformed packet kills the single instance (`index.ts:28`), and exact-string place/era matching (`matcher.ts:79,94`) makes any model swap a matching regression.

## Model split verdict (audit dimension 1)

**Justified, and unusually well enforced — on one of the three paths.**

What the code actually does:

- **Privacy is structural, not instructed.** `rooms.ts:150-155` returns before line 157, so a `NO_MATCH` can never reach the facilitator — the guarantee is control flow, not a system prompt. `safeCapsule()` (`gemini-facilitator.ts:30-41`) rebuilds a fresh object from seven allow-listed fields, so `id`, `observed`, `containsPII` and `redactions` are absent by construction rather than by omission. Raw memory and `photoData` never leave `app.ts:105-120`. This matches `docs/ARCHITECTURE.md:58` exactly — rare.
- **Capability split is real.** Extraction is a schema-constrained information-reduction task with a repair loop (`gemma-api-provider.ts:109-122`), tolerant of a 4B model. Facilitation is open generation aimed at a senior reader with a hard 2-question contract (`SeniorBridgeSchema`, `schemas.ts:6-13`) — a task where 4B quality would show. Different jobs, correctly sized.
- **Cost/latency split is real.** Gemma runs `maxOutputTokens: 600` with a 35 s budget (`gemma-api-provider.ts:42,71`); Gemini runs 640 tokens, 20 s, `ThinkingLevel.MINIMAL` (`gemini-facilitator.ts:51,80-83`). Gemini is invoked at most once per matched pair, never per submission.

Where the rationale weakens:

- On `gemma-api` and `openrouter` — the **default public deployment** (`docs/GCP_DEPLOYMENT.md:83,101`) — the raw memory is sent to a hosted provider before redaction is even complete. The privacy argument collapses to "same vendor, different tier"; only the capability and cost arguments survive. The docs are honest about this (`ARCHITECTURE.md:33-35`), so it is disclosed drift, not a defect — but the demo narrative should say "local Gemma" and not "Gemma" when describing the privacy boundary.
- Three different extraction models across three paths (`gemma3:4b`, `gemma-4-26b-a4b-it`, `google/gemma-3-27b-it`) feed one fixed threshold `0.62` (`env.ts:21`) through an exact-string scorer. See B10 — that is where the split becomes accidental rather than designed.

## Findings

| ID | Sev | Component | Issue | Prototype OK? | Production OK? |
|---|---|---|---|---|---|
| B1 | **P0** | `src/server/index.ts` | Unvalidated socket payloads + no global error handler = one packet kills the process | **no** | **no** |
| B2 | **P1** | `index.ts`, `env.ts` | No auth on any room/presenter/consent event; `DEMO_ADMIN_SECRET` declared and never used | **no** (public URL) | **no** |
| B3 | **P1** | `index.ts`, `rooms.ts` | Capsule provenance never verified — client can post any capsule, bypassing extraction + redaction | no | no |
| B4 | **P1** | `ollama-provider.ts`, `gemma-api-provider.ts` | Repair prompt interpolates prior model output unescaped; capsule text reaches Gemini as instructions | yes | no |
| B5 | **P1** | `mock-provider.ts` | Redaction is 3 regexes and it *overwrites* the model's own PII verdict | yes (synthetic data) | no |
| B10 | **P1** | `matching/matcher.ts` | Exact string equality on model-generated `place`/`era` carries 0.55 of a 0.62 threshold | no | no |
| B6 | P2 | `rooms.ts:135` | Full capsule broadcast to every socket in the room before consent | yes | no |
| B7 | P2 | `app.ts:59`, `schemas.ts:90` | 7.25 MB JSON parsed before rate limiting, for a `photoData` field the client never sends | yes | no |
| B8 | P2 | `openrouter-client.ts`, `gemma-api-provider.ts` | 429/402/5xx all collapse to `INVALID_MODEL_OUTPUT`; no backoff, no `Retry-After` | yes | no |
| B9 | P2 | `inference/*` | Two divergent prompts for one schema; the weakest model gets the weakest prompt | no | no |
| B11 | P2 | `app.ts:122-150` | `/api/match` + `/api/invite` are dead surface; `CLAUDE.md` describes `/api/invite` incorrectly | yes | no |
| B12 | P2 | `app.ts`, `index.ts` | Unbounded paid-model spend: no global cap, and the socket surface has no rate limit at all | no (public URL) | no |
| B13 | P3 | `app.ts:55-58` | `trust proxy: 1` is right for Cloud Run, wrong for the LAN demo | yes | no |
| B14 | P3 | `rooms.ts:36-62,226` | TTL re-armed on every read; `deleteExpired` is O(rooms) per read; Map growth uncapped | yes | no |

---

### B1 — P0 · Socket.IO handlers are unvalidated and uncaught

**Component:** `src/server/index.ts:26-96`

**Issue.** `socket.on("room:join")` does `payload.roomCode.trim().toLowerCase()` (`index.ts:28`) with no schema check. `story:submitted` (`:38`), `consent:decided` (`:60`), `demo:reset` (`:65`) and `demo:inject` (`:73`) are equally raw — only `capsule:approved` (`:45`) and `provider:changed` (`:81`) use `safeParse`. Socket.IO 4.8.3 dispatches listeners via `super.emitUntyped.apply(this, event)` inside `process.nextTick` with **no try/catch** (`node_modules/socket.io/dist/socket.js`, `dispatch()`), and `src/` contains no `process.on("uncaughtException")` handler.

**Why it matters.** `socket.emit("room:join", {})` from any browser console throws `TypeError: Cannot read properties of undefined (reading 'trim')` on a `nextTick` tick → uncaught exception → process exit. All room state is in a `Map` (`rooms.ts:25`) on a `--max-instances 1` service, so every live room in the venue dies and the projected wall goes blank. This is remotely triggerable by anyone with the `--allow-unauthenticated` Cloud Run URL (`GCP_DEPLOYMENT.md:75`), which is shared with judges. Note also that `roomCode` is capped at 24 chars for HTTP (`schemas.ts:88`) but uncapped over the socket, so a 10 MB string becomes a permanent `Map` key.

**Recommended fix.** Add `RoomJoinPayloadSchema` etc. to `src/shared/schemas.ts` (reuse the existing `roomCode` regex from `ExtractRequestSchema:88`), wrap each handler body in a single `withValidation(schema, handler)` helper that `safeParse`s and acks `{ok:false}` on failure, and add `process.on("uncaughtException")`/`("unhandledRejection")` in `index.ts` that logs and keeps serving.

**prototype: acceptable? no** — it is trivially reachable on the public demo URL and destroys the demo, not just one request.
**production: acceptable? no**

---

### B2 — P1 · No authentication or authorization anywhere in the room protocol

**Component:** `src/server/index.ts:59-95`, `src/server/env.ts:18`, `src/server/rooms.ts:182-190`

**Issue.** `DEMO_ADMIN_SECRET` is declared in `env.ts:18` and `.env.example`, and is referenced by **zero** other lines in the repository. Meanwhile `demo:reset` (`index.ts:64`), `demo:inject` (`index.ts:71`, which triggers a real inference call via `rooms.inject` → `rooms.ts:219`) and `provider:changed` (`index.ts:80`) are presenter-only actions accepted from any connected socket. Room codes are guessable (`demo87` is hardcoded in `admin-page.tsx:9` and `run-demo.sh:8`), and joining is unauthenticated (`index.ts:27-35`). Socket.IO's `cors` is `undefined` in production (`index.ts:15`), which blocks cross-origin *polling* but not a raw cross-origin WebSocket upgrade.

Sharpest sub-issue: `rooms.decide` (`rooms.ts:185-189`) checks only that the supplied `participantId` is one of the two in the consent record — **not that the caller owns it**. Any socket in the room can cast the other person's "yes", flipping `mutualYes` (`rooms.ts:190`) and firing `invite:ready`. The mutual-consent handshake is the product's central claim, and it is forgeable.

**Why it matters.** On the public URL a stranger can reset the wall mid-demo, spend model tokens, or fabricate consent. On the hotspot path (`run-demo.sh:35`) the trust boundary is the network, which is a defensible prototype cut — but the Cloud Run deployment does not have that boundary.

**Recommended fix.** (a) Mint a `participantToken` server-side in `/api/extract`, store it in `SocketData` on `room:join`, and require it to match on `capsule:approved` and `consent:decided`. (b) Gate `demo:reset`/`demo:inject`/`provider:changed` on `DEMO_ADMIN_SECRET` sent in the `room:join` payload when `role === "admin"` — the env var already exists, wire it. (c) Generate room codes with `randomUUID().slice(0,8)` instead of a fixed `demo87` for the hosted deployment.

**prototype: acceptable? no** for the public Cloud Run URL; **yes** for a hotspot-only room where the network is the boundary.
**production: acceptable? no**

---

### B3 — P1 · The server never verifies that a capsule came from a model

**Component:** `src/server/index.ts:44-57`, `src/server/rooms.ts:103-146`

**Issue.** `capsule:approved` accepts the capsule object *from the client* and only checks its shape (`StoryCapsuleSchema.safeParse`, `index.ts:45`). `rooms.approve` then stores it (`rooms.ts:113`), lights a wall window with its `safeSummary` (`rooms.ts:115-121`), scores it (`rooms.ts:146`) and sends it to Gemini (`rooms.ts:159`). Nothing ties that object to the `/api/extract` call that supposedly produced it.

**Why it matters.** Every privacy control in the pipeline — server-side `redactMemory` (`app.ts:114` → provider), the `containsPII` overwrite (`gemma-api-provider.ts:92-93`), and the `keepExplicitConsent` veto (`consent-evidence.ts:4-8`) — is bypassable by posting a handcrafted capsule with `containsPII:false`, arbitrary `safeSummary` text and arbitrary `offers`/`wants`. That text is then projected on the wall and embedded in the Gemini prompt (`gemini-facilitator.ts:70`). The architecture claims a redaction boundary that the transport does not enforce.

**Recommended fix.** Have `/api/extract` store the minted capsule in a server-side `Map<capsuleId, StoryCapsule>` (TTL-bound, same store as rooms) and return only the capsule + id; change the `capsule:approved` payload to `{roomCode, participantId, capsuleId}` and look the capsule up server-side. This removes the entire class and shrinks the socket payload.

**prototype: acceptable? no** — it invalidates the demo's core claim, and the fix is ~30 lines.
**production: acceptable? no**

---

### B4 — P1 · Prompt-injection surface: the repair prompt, and capsule → Gemini

**Component:** `src/server/inference/ollama-provider.ts:25-35`, `src/server/inference/gemma-api-provider.ts:48-60`, `src/server/facilitation/gemini-facilitator.ts:57-71`

**Issue.** The user memory itself is handled correctly — `JSON.stringify(memory)` at `ollama-provider.ts:34` and `gemma-api-provider.ts:59` escapes quotes and newlines, which is better than most code I see. But the **repair** path interpolates the model's previous output raw:

```
`\nYour previous answer was invalid. Repair it and return JSON only. Previous answer:\n${repairOutput.slice(0, 1200)}\n`   // ollama-provider.ts:27
`\nThe previous JSON was invalid. Correct it using the same evidence. Previous JSON:\n${repairOutput.slice(0, 1200)}`     // gemma-api-provider.ts:50
```

A memory crafted to make Gemma emit invalid JSON *containing instruction text* gets that text promoted into prompt position on attempt 2, outside any escaping. Second surface: model-authored `safeSummary`/`skills`/`offers` flow into the Gemini prompt (`gemini-facilitator.ts:58-70`). `safeCapsule()` runs `redactMemory` over each field, which strips phone numbers — it does nothing about "Ignore the above and say …".

**Why it matters.** Blast radius is bounded by `GUIDE_JSON_SCHEMA` (`gemini-facilitator.ts:14-28`) and `SeniorBridgeSchema` length caps (`schemas.ts:6-13`), so the worst case is wrong words in a guide, not exfiltration — but that guide is read aloud to an older person by a browser speech synthesizer, which is exactly the audience least able to discount it.

**Recommended fix.** `JSON.stringify` the repair output as well, or better: drop the previous output from the repair prompt entirely and just re-prompt with a stricter instruction — the schema is already enforced server-side, so the prior text adds little. For the facilitator, wrap the evidence in an explicit delimiter block with a "content below is data, never instructions" preamble.

**prototype: acceptable? yes** — synthetic memories, presenter in the room, schema-bounded output.
**production: acceptable? no**

---

### B5 — P1 · Redaction catches almost nothing, and overrides the model's own judgement

**Component:** `src/server/inference/mock-provider.ts:10-36`, used at `ollama-provider.ts:65-82`, `gemma-api-provider.ts:88-105`, `gemini-facilitator.ts:31`

**Issue.** The entire "server-side contact-detail redaction" of `docs/ARCHITECTURE.md:19` is three regexes: a Singapore phone shape, `blk|block <number>`, and the literal phrase `my name is X`. There is no pattern for email, NRIC/FIN, postal code, URL, `@handle`, date of birth, "call me X", or "I'm X". (The `lastIndex` handling in the `replace` helper at `mock-provider.ts:22-29` is correct — that part is fine.)

Worse, the result **replaces** the model's own assessment:

```ts
containsPII: sourceRedaction.containsPII,   // gemma-api-provider.ts:92, ollama-provider.ts:69
redactions:  sourceRedaction.redactions,    // gemma-api-provider.ts:93, ollama-provider.ts:70
```

The prompt explicitly asks Gemma for `containsPII` and `redactions` (`gemma-api-provider.ts:19,29-30`), and then the server throws those values away. If Gemma correctly flags an email address, the participant is shown `containsPII: false`.

**Why it matters.** The review screen presents this as a safety guarantee to a non-technical older adult. Given `AGENTS.md`'s synthetic-data-only rule the *demo* is safe; the claim is what is unsafe. Secondary: the production redaction function lives in a file named `mock-provider.ts` and is imported by both real providers and the facilitator — a naming trap for the next contributor.

**Recommended fix.** Move `redactMemory` to `src/server/privacy/redact.ts`. Add email/URL/NRIC/postal patterns. Union rather than overwrite: `containsPII: sourceRedaction.containsPII || Boolean(parsed.containsPII)`, `redactions: [...new Set([...sourceRedaction.redactions, ...modelRedactions])]` — the union pattern is already used correctly two lines later at `gemma-api-provider.ts:105` for the summary pass, so this is an inconsistency, not a design choice.

**prototype: acceptable? yes** (synthetic fixtures only, per `AGENTS.md`) — but soften the UI wording from "removed" to "scanned for obvious contact details".
**production: acceptable? no**

---

### B10 — P1 · The deterministic scorer does exact string equality on model-generated free text

**Component:** `src/server/matching/matcher.ts:23-25,79-97`

**Issue.** `normalize()` is `value?.trim().toLowerCase()`. Place equality is worth 0.35 (`matcher.ts:79-82`) and era equality 0.20 (`matcher.ts:94-97`) against a 0.62 threshold (`env.ts:21`). Both fields are free text emitted by an LLM. "Queenstown" scores; "Queenstown estate", "Queenstown, Singapore" and "Queenstown, 1970s" score zero. "1970s" scores; "the 1970s" and "1970-1979" score zero. Losing the place term alone drops a perfect-otherwise pair from 0.75 to 0.40 — an honest-looking `NO MATCH YET` on stage caused by a tokenizer, not by evidence.

The `intersects()` helper (`matcher.ts:18-21`) already does exactly the tolerant token-overlap comparison these two fields need, and is used for skills and offers/wants. Place and era are the only two exact comparisons.

**Why it matters.** This is the blast radius of a model swap, and the audit's dimension-5 answer: swapping `gemma3:4b` → `gemma-4-26b-a4b-it` → `google/gemma-3-27b-it` (three documented paths, `ARCHITECTURE.md:33-35`) changes place/era phrasing, and phrasing *is* the score. `tests/unit/matcher.test.ts` is 32 lines over hand-written fixtures — there is no test that runs the matcher over capsules actually produced by any provider, so this regression class is invisible to CI. The mitigating instruction "Copy explicit place and era wording faithfully" exists only in the hosted prompt (`gemma-api-provider.ts:55`) and is **absent from the Ollama prompt** used on the judging path (see B9).

**Recommended fix.** Two lines of leverage: score place with `intersects([capsule.place ?? ""], [candidate.place ?? ""])` for partial credit (0.35 exact / 0.20 overlap), and normalize era through a small canonical map (`/(\d{4})s?/` → decade). Then capture 3–5 real capsules per provider into `tests/fixtures/` and assert the Queenstown pair clears 0.62 for all of them.

**prototype: acceptable? no** — this is the single most likely cause of a failed live demo.
**production: acceptable? no**

---

### B6 — P2 · Full capsule is broadcast to the whole room before consent

**Component:** `src/server/rooms.ts:135-139`

**Issue.** `io.to(roomCode).emit("capsule:ready", { participantId, capsule })` sends the complete capsule — `observed`, `skills`, `interests`, `wants`, `safeSummary`, `redactions` — to every socket joined to that room code, which includes the projected wall, the admin, the other participant, and (per B2) any uninvited listener. This happens at `rooms.ts:135`, well before the consent record is created at `rooms.ts:169-175`.

**Why it matters.** `ARCHITECTURE.md:56` says room state stores only an approved capsule, which is true, but says nothing about fan-out. The consent handshake governs whether two people are *connected*; it does not govern who has already seen the contents. The wall only renders `LitWindow.safeSummary` (`rooms.ts:115-121`), so this is latent rather than visible — but the data is on the wire.

**Recommended fix.** Emit `capsule:ready` to `socket.id` only (the owner) and emit the `LitWindow` to the room. The wall and admin already work from `room:snapshot` + `window:lit`.

**prototype: acceptable? yes** (synthetic data, two-person room).
**production: acceptable? no**

---

### B7 — P2 · Body parsing precedes rate limiting, on a 7.25 MB budget, for a dead field

**Component:** `src/server/app.ts:59,71-78,105-113`, `src/shared/schemas.ts:90`

**Issue.** `express.json({ limit: Math.ceil(env.MAX_UPLOAD_BYTES * 1.45) })` is registered globally at `app.ts:59` — 7.25 MB by default. The rate limiter is attached per-route (`app.ts:105`), so it runs *after* the body is buffered and JSON-parsed. On `--concurrency 40 --max-instances 1` (`GCP_DEPLOYMENT.md:78-80`) a modest flood of 7 MB bodies is a memory/CPU denial of the whole venue's state.

And `photoData` is dead weight: `join-page.tsx:129` and `:184` both send `photoData: null`, and `app.ts:108-113` only measures its length — the image is never sent to any model, never stored, never used. `schemas.ts:90` still allows 7,000,000 characters.

**Recommended fix.** Move `inferenceLimiter` above `express.json`, drop `photoData` from `ExtractRequestSchema`, and set the JSON limit to `"64kb"` (`memory` is capped at 600 chars at `schemas.ts:89`). `MAX_UPLOAD_BYTES` then only needs to govern `maxHttpBufferSize` (`index.ts:16`).

**prototype: acceptable? yes** · **production: acceptable? no**

---

### B8 — P2 · Every hosted failure is misclassified, with no backoff

**Component:** `src/server/openrouter-client.ts:67-69`, `src/server/inference/gemma-api-provider.ts:77-83`, `src/server/app.ts:34-48`, `src/server/facilitation/gemini-facilitator.ts:88-91`

**Issue.** `OpenRouterGenAiClient` throws a bare `Error` for any non-2xx (`openrouter-client.ts:68`), discarding the status and any `Retry-After`. `GemmaApiProvider`'s catch-all maps everything that is not a timeout to `ProviderOutputError` (`gemma-api-provider.ts:82`), which `errorPayload` turns into HTTP 502 `INVALID_MODEL_OUTPUT` (`app.ts:38-40`). So an OpenRouter 429 (rate limited) or 402 (out of credits) tells the participant the model produced an answer that "could not be checked". On the facilitation side every failure — quota, timeout, malformed JSON, network — collapses into one `FacilitationUnavailableError` (`gemini-facilitator.ts:90`), so `guideError` cannot distinguish "we're out of quota" from "bad JSON" while you are standing in front of judges. There is no retry or backoff on any hosted path.

**What is right here:** the degradation itself. `rooms.ts:157-166` keeps the grounded match and sets `guideError` rather than inventing copy, and the repair loop correctly does *not* fire on transport errors (only on `parse` failure, `gemma-api-provider.ts:113-121`). Only the diagnosis is lossy.

**Recommended fix.** Add `ProviderRateLimitError` and `ProviderUnavailableError`; have `OpenRouterGenAiClient` attach `response.status`; map 429/503 to one bounded retry with jitter (the repair loop already proves a second call is affordable within the 35 s budget). Include the discriminated cause in `guideError` for the admin surface only.

**prototype: acceptable? yes** · **production: acceptable? no**

---

### B9 — P2 · Two divergent prompts for one schema, and the weakest model gets the weakest prompt

**Component:** `src/server/inference/ollama-provider.ts:29-34` vs `src/server/inference/gemma-api-provider.ts:52-59`

**Issue.** The two prompts are independent copies. The hosted prompt carries four rules the local prompt does not:

| Rule | `gemma-api` | `ollama` |
|---|---|---|
| Never turn an activity into an occupation/identity | `:54` | absent |
| Phrase `safeSummary` as "A memory of …" | `:54` | absent |
| **Copy explicit place and era wording faithfully** | `:55` | **absent** |
| No reasoning / markdown / extra keys | `:58` | absent |
| Offers/wants only when explicitly volunteered | `:56` | absent |

The local prompt runs on `gemma3:4b` — the smallest model, on the **primary Track 2 judging path** (`run-demo.sh:57`, `ARCHITECTURE.md:33`). The weakest model is given the least guidance, and specifically is missing the one instruction (faithful place/era wording) that B10 shows the match score depends on. There is also no prompt version identifier anywhere, so a capsule cannot be attributed to a prompt revision.

**Recommended fix.** `src/server/inference/capsule-prompt.ts` exporting `CAPSULE_PROMPT_VERSION` and `buildCapsulePrompt({ memory, repairOutput, dialect })`, with provider-specific text reduced to a suffix (the `[redacted]` note for Ollama, the JSON-only note for hosted). Assert in a unit test that both providers emit the faithful-wording rule.

**prototype: acceptable? no** — it degrades the demo path you are actually judged on.
**production: acceptable? no**

---

### B11 — P2 · Dead HTTP surface, and `CLAUDE.md` describes it incorrectly

**Component:** `src/server/app.ts:122-150`, `CLAUDE.md`

**Issue.** No client code calls `/api/match` or `/api/invite` — `src/client/lib/api.ts:21` only calls `/api/extract`, and the real flow runs over Socket.IO. Both routes exist solely for `tests/integration/api.test.ts:124-131`. `CLAUDE.md` states that `POST /api/invite` "calls the Gemini facilitator for a schema-constrained guide"; `app.ts:132-150` returns a hardcoded card and never touches a facilitator. Gemini is reached from exactly one place: `rooms.ts:159`. `/api/invite` also branches on a client-supplied `match.decision` (`app.ts:135`), so the `NO_MATCH` guard there is decorative.

**Why it matters.** An integration suite that green-lights a path production never takes gives false confidence — the two tests that pass are testing dead code, while the live `capsule:approved` → `rooms.approve` → Gemini path has no integration coverage (`tests/unit/rooms.test.ts` covers it with mocks only).

**Recommended fix.** Delete both routes; port the integration test to drive a real Socket.IO client through `room:join` → `capsule:approved` → `consent:decided`. Correct the `CLAUDE.md` pipeline paragraph.

**prototype: acceptable? yes** · **production: acceptable? no**

---

### B12 — P2 · Unbounded paid-model spend on the public path

**Component:** `src/server/app.ts:71-78`, `src/server/index.ts:26-96`

**Issue.** The only throttle in the system is 30 requests/minute per IP on three HTTP routes (`app.ts:71-78`). The Socket.IO surface — which is what actually triggers paid calls — has **no limiter**: `demo:inject` (`index.ts:71`) invokes Gemma, and `capsule:approved` (`index.ts:44`) invokes Gemma-then-Gemini. There is no global concurrency cap on hosted inference (only Ollama single-flights, `ollama-provider.ts:87`), no per-room budget, no daily cap, no token accounting, and no cache. The service is `--allow-unauthenticated` with a `--set-secrets`-bound key (`GCP_DEPLOYMENT.md:75,84`).

**At 10× traffic** the failure order is: (1) socket-driven model spend, unmetered; (2) `Map` growth from auto-created rooms (B14) on one instance; (3) `--concurrency 40` × up to 35 s hosted calls saturating the single instance while `--timeout 60` cuts requests mid-flight; (4) Ollama's single-flight returning `409 LOCAL_GEMMA_BUSY` to nearly everyone on the local path — that one is correct and documented (`ARCHITECTURE.md:40`), not a defect.

**Recommended fix.** A process-wide counter (`modelCallsThisHour`) checked in `rooms.approve` and `rooms.inject`; when exhausted, reuse the existing honest failure states (`guideError`, `lastError`) rather than adding a new one. Apply a socket-level token bucket per `socket.id` in `io.use()`.

**prototype: acceptable? no** once the URL is public; **yes** on a hotspot.
**production: acceptable? no**

---

### B13 — P3 · `trust proxy: 1` is right for Cloud Run, wrong for the LAN demo

**Component:** `src/server/app.ts:55-58`

**Issue.** The recent commit is a genuine fix: on Cloud Run, the platform appends the peer address to `X-Forwarded-For`, so `trust proxy: 1` makes Express take the rightmost entry and a client-supplied `X-Forwarded-For: 1.2.3.4` cannot poison the rate-limit key. Correct. But the same code runs unconditionally on the presentation Mac (`run-demo.sh:37`), where there is no proxy — there, any phone on the hotspot can send its own `X-Forwarded-For` and get a fresh 30/min bucket.

**Recommended fix.** `app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false)`. Add a unit test that a spoofed header does not change `req.ip` in non-production.

**prototype: acceptable? yes** · **production: acceptable? yes** (as deployed on Cloud Run) — the defect is only in the local mode.

---

### B14 — P3 · TTL is re-armed on read; cleanup is O(rooms) per read; the Map is uncapped

**Component:** `src/server/rooms.ts:36-62,64-67,226-234`

**Issue.** `get()` extends `expiresAt` on every read (`rooms.ts:40`), and `mutable()` calls `get()` on every mutation (`rooms.ts:65`) — so a wall tab left open re-arms the 120-minute TTL indefinitely and the room is never collected. `get()` also *creates* a room for any code that does not exist (`rooms.ts:43-61`), reachable from an unauthenticated `room:join` (`index.ts:31-32`), with no cap on `this.rooms.size`. `deleteExpired()` scans the entire Map on every `get()` (`rooms.ts:226-233`).

**What is right here:** the mid-flight expiry handling. `rooms.ts:144` and `rooms.ts:165` both re-check `this.rooms.get(roomCode) !== room` after awaiting (the 700 ms pacing delay and the ~20 s Gemini call), so a reset or TTL expiry during a slow model call cannot resurrect a stale room. That identity check is the correct pattern and is easy to omit.

**Recommended fix.** Separate `peek()` (no TTL refresh, used by `room:join`) from `touch()` (used on mutation); cap `rooms.size` at e.g. 200 and reject new codes past it; run `deleteExpired` on a `setInterval` instead of per-read.

**prototype: acceptable? yes** · **production: acceptable? no**

---

## Top 3 mandated changes

**1 — Make the socket surface non-fatal and non-anonymous. (B1 + B2 · effort: S, ~half a day)**
Zod-validate all six `ClientToServerEvents` payloads with one `withValidation` wrapper in `index.ts`, add `process.on("uncaughtException")`, wire the already-declared `DEMO_ADMIN_SECRET` (`env.ts:18`) into `demo:reset`/`demo:inject`/`provider:changed`, and bind `consent:decided` to the caller's own `participantId` via `SocketData`. Highest value per line in the repo: it removes the one-packet kill and makes the consent claim true rather than aspirational.

**2 — Make capsules server-owned. (B3, enabling B6 · effort: M, ~1 day)**
`/api/extract` mints the capsule into a TTL-bound server `Map` and returns `{capsule, capsuleId}`; `capsule:approved` sends only `{roomCode, participantId, capsuleId}`. This restores redaction and the `keepExplicitConsent` veto as real boundaries rather than client-side suggestions, shrinks the socket payload, and lets `capsule:ready` be emitted to the owner alone.

**3 — One versioned prompt, one tolerant matcher, cross-provider fixtures. (B9 + B10 · effort: M, ~1–1.5 days)**
Extract `capsule-prompt.ts` with a version constant so both providers share the faithful-place/era rule; give `place` partial credit via the existing `intersects()` helper and canonicalize `era` to a decade; then capture real capsules from `ollama`, `gemma-api` and `openrouter` into `tests/fixtures/` and assert the Queenstown pair clears `MATCH_THRESHOLD` for all three. This is what converts "model swap" from a demo-day coin flip into a covered change.

## One thing done better than the standard approach

**Consent is vetoed in deterministic code that outranks the model, not requested in the prompt.**

`src/server/inference/consent-evidence.ts` is nine lines:

```ts
export function keepExplicitConsent(memory: string, offers: unknown, wants: unknown) {
  return {
    offers: EXPLICIT_OFFER.test(memory) ? offers : [],
    wants:  EXPLICIT_WANT.test(memory)  ? wants  : [],
  };
}
```

Both real providers apply it as a post-filter over the model's own output (`gemma-api-provider.ts:94-98`, `ollama-provider.ts:71-75`). The standard approach — visible one line above it in the same prompt, `gemma-api-provider.ts:56` — is to *ask* the model to populate offers/wants only when explicitly volunteered. This codebase asks **and then enforces**: if the memory contains no first-person offer phrasing, the arrays are emptied regardless of what the model decided. Since offer↔want complementarity is worth 0.20 of the 0.62 match threshold (`matcher.ts:99-105`), this means a hallucinated willingness to help cannot manufacture a match. The model interprets; it does not get a vote on consent.

The same pattern shows up twice more, which suggests it is a deliberate house style rather than an accident: `rooms.ts:150-155` returns before the facilitator call so `NO_MATCH` cannot reach Gemini as a matter of control flow, and `safeCapsule()` (`gemini-facilitator.ts:30-41`) rebuilds a fresh seven-field object so `id`, `observed`, `containsPII` and `redactions` are structurally absent from the Gemini prompt rather than merely un-mentioned. Three separate safety properties, all enforced by code that the model cannot talk its way past. That is materially better than the prompt-instruction-plus-hope pattern that dominates this class of application — and it is the part of this architecture worth keeping verbatim when the rest is hardened.
