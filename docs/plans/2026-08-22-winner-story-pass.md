# Winner Story Pass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the judged real-Gemma journey visually memorable, immediately understandable, and honest while keeping the repository small.

**Architecture:** Keep the existing Join, Wall, Admin, Express, Socket.IO and Canvas structure. Centralise only the prepared demo copy that must stay identical on client and server; express every other improvement in the existing route files and stylesheet. The selected HDB-window artwork is the landing and README brand image, the Queenstown concept remains a build-time visual reference, and the real result capture remains the proof of the working flow.

**Tech Stack:** React 19, TypeScript, Express, Socket.IO, Canvas, Vitest, Playwright

---

### Task 1: Make the real prepared story complementary

**Files:**
- Create: `src/shared/demo.ts`
- Modify: `src/client/routes/join-page.tsx`
- Modify: `src/server/rooms.ts`
- Modify: `tests/unit/rooms.test.ts`

1. Change the room test to require the explicit fictional offer: `I would be happy to teach someone basic radio repair.`
2. Run `npm test -- tests/unit/rooms.test.ts` and confirm the assertion fails.
3. Add the two prepared memory constants in `src/shared/demo.ts` and use them in Join Mode and presenter injection.
4. Re-run the focused test and confirm it passes.

### Task 2: Clarify photo selection and the human outcome

**Files:**
- Modify: `tests/e2e/demo.spec.ts`
- Modify: `src/client/routes/join-page.tsx`
- Modify: `src/client/routes/wall-page.tsx`
- Modify: `src/server/rooms.ts`
- Modify: `src/client/styles/global.css`

1. Extend the critical E2E flow to require a visible prepared-image state, synthetic upload, restore action, four journey beats, visible Gemma offer evidence, the humane positive headline, and the humane no-match explanation.
2. Run the focused E2E test and confirm it fails on the missing prepared-image state.
3. Implement the smallest state and copy changes in the existing route components.
4. Re-run the focused E2E test and confirm it passes.

### Task 3: Translate the Queenstown visual direction

**Files:**
- Modify: `src/client/components/hdb-wall-canvas.tsx`
- Modify: `src/client/styles/global.css`
- Add: `assets/generated/queenstown-story-block.jpg`
- Add: `assets/prompts/queenstown-story-block.md`
- Modify: `assets/manifest.json`

1. Add the already generated, synthetic concept and its provenance.
2. Translate its cream, heritage teal, brick red and amber palette into the existing UI and Canvas; keep the DOM and folder structure unchanged.
3. Verify matched, no-match, mobile and 1280 x 720 states in the in-app browser.
4. Record the source-to-implementation comparison in `design-qa.md`, fixing all P0-P2 findings before passing.

### Task 4: Make the public repository judge-friendly

**Files:**
- Modify: `README.md`
- Modify: `docs/DEMO_SCRIPT.md`

1. Rebuild the README hierarchy around a concise hero, badges, live demo links, the four-beat story, visible Gemma boundary, architecture, quick start, safety and verification.
2. Keep setup commands accurate and secrets server-side; do not add marketing dependencies or duplicate architecture prose.
3. Run secret scanning plus lint, typecheck, unit/integration tests, build and E2E.
4. Review the complete diff, request code review, fix critical/important findings, commit, push and create the PR.
