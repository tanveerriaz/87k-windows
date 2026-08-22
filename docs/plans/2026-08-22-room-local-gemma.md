# Room-Local Gemma Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make local Gemma on the presentation Mac the reliable, zero-install primary judging path for participant phones.

**Architecture:** Serve the built client and Socket.IO from one production Node process reachable on the LAN while Ollama stays bound to loopback. Discover room URLs with a tested TypeScript helper, warm Gemma before launch, and keep hosted Gemma as an explicit fallback.

**Tech Stack:** TypeScript, Node.js 22, React/Vite, Express, Socket.IO, Ollama, Vitest, Playwright

---

### Task 1: Test and implement room URL discovery

**Files:**
- Create: `scripts/show-room-urls.ts`
- Create: `tests/unit/show-room-urls.test.ts`
- Modify: `tsconfig.json`

1. Write tests proving loopback and internal interfaces are excluded, private IPv4 addresses are deduplicated, and join/wall/admin URLs use the selected port and room.
2. Run `npm test -- tests/unit/show-room-urls.test.ts` and confirm failure.
3. Implement the minimal network-interface parser and CLI output.
4. Rerun the focused test and confirm it passes.

### Task 2: Make real-model launch modes production and LAN ready

**Files:**
- Modify: `scripts/run-demo.sh`
- Modify: `scripts/verify-demo-machine.sh`

1. Add shell syntax/behavior assertions to the focused URL tests where practical.
2. Build the app before real-model launch, require a LAN address, warm local Gemma with a bounded request, print all room URLs, and start one production Node process on port 3000.
3. Change machine readiness output to identify local Gemma as primary and hosted Gemma as fallback.
4. Run `bash -n scripts/run-demo.sh scripts/verify-demo-machine.sh` and the focused tests.

### Task 3: Make the judged-provider UI truthful

**Files:**
- Modify: `src/client/routes/admin-page.tsx`
- Modify: `tests/e2e/demo.spec.ts`

1. Add an E2E assertion for the real-Gemma versus test-harness wording.
2. Update Admin Mode so Ollama is described as the primary private room model and hosted Gemma as the remote fallback, without exposing provider switching.
3. Run `npm run test:e2e`.

### Task 4: Align public documentation and rehearse

**Files:**
- Modify: `README.md`
- Modify: `docs/PRODUCT.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEMO_SCRIPT.md`
- Modify: `docs/SUBMISSION.md`
- Modify: `docs/MAC_SETUP.md`

1. Replace hosted-primary claims with room-local-primary wording and document the printed LAN URLs.
2. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e`.
3. Run `npm run verify:machine`; then physically verify a phone and wall at 1280 x 720 when the presentation Mac is available.
