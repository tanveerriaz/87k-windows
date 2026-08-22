# OpenRouter Recovery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore the complete hosted capsule-to-guide flow through OpenRouter while preserving real Gemma extraction, Gemini facilitation, consent and deterministic matching.

**Architecture:** Add one OpenAI-compatible transport adapter that translates the two existing Google-style structured-generation requests into OpenRouter chat completions. Reuse `GemmaApiProvider` and `GeminiFacilitator` for prompts, redaction, repair, Zod validation and safe errors; select the adapter only when `INFERENCE_PROVIDER=openrouter`.

**Tech Stack:** TypeScript, native `fetch`, Express, Zod, Vitest, Cloud Run and Secret Manager.

---

### Task 1: Declare and present the OpenRouter runtime

**Files:**
- Modify: `src/shared/schemas.ts`
- Modify: `src/server/env.ts`
- Modify: `src/client/lib/provider-presentation.ts`
- Modify: `src/client/components/status-badge.tsx`
- Test: `tests/unit/env.test.ts`
- Test: `tests/unit/provider-presentation.test.ts`

1. Add failing tests for `INFERENCE_PROVIDER=openrouter`, required `OPENROUTER_API_KEY`, default model slugs and a real-Gemma OpenRouter presentation.
2. Run `npm test -- tests/unit/env.test.ts tests/unit/provider-presentation.test.ts` and confirm the new cases fail because `openrouter` is not accepted.
3. Add the provider enum, server-only URL/key/model settings and visible labels.
4. Re-run the focused tests and confirm they pass.

### Task 2: Translate structured requests to OpenRouter

**Files:**
- Create: `src/server/openrouter-client.ts`
- Create: `tests/unit/openrouter-client.test.ts`

1. Add failing tests that expect `POST <base>/chat/completions`, bearer authentication, the selected model, strict `json_schema`, `provider.require_parameters=true`, and extraction of `choices[0].message.content`.
2. Add failing tests for non-2xx responses, empty content and abort propagation without logging prompts or keys.
3. Run `npm test -- tests/unit/openrouter-client.test.ts` and confirm failure because the adapter does not exist.
4. Implement the smallest injected-`fetch` adapter with normalized base URLs and the existing abort signal.
5. Re-run the focused test and confirm it passes.

### Task 3: Wire both model roles through the adapter

**Files:**
- Modify: `src/server/app.ts`
- Test: `tests/unit/runtime-dependencies.test.ts`
- Test: `tests/integration/api.test.ts`

1. Add a failing dependency-selection test showing OpenRouter constructs real Gemma extraction and real Gemini facilitation without `GEMINI_API_KEY`.
2. Add health assertions for the OpenRouter Gemma and Gemini model slugs.
3. Run the focused tests and confirm the runtime still falls back to the mock provider.
4. Instantiate the shared OpenRouter adapter for both existing structured-generation classes and report the correct health fields.
5. Re-run the focused tests and confirm they pass.

### Task 4: Document and verify the deployment

**Files:**
- Modify: `.env.example`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/GCP_DEPLOYMENT.md`
- Modify: `README.md`

1. Document empty server-side settings, the two model roles, and Secret Manager deployment without recording credentials.
2. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
3. Run `npm run test:e2e` and verify the matched two-light state plus the one-light no-match state.
4. Commit and push the feature branch and `main`.
5. Add the existing local key as a new Secret Manager version without printing it, deploy `INFERENCE_PROVIDER=openrouter` to the authorized service, and verify `/health`, real extraction, radio match, Gemini guide and `NO MATCH YET`.
