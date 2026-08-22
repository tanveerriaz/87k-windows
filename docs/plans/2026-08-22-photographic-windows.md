# Photographic Windows Experience Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the fabricated teal wall with a photorealistic, AI-generated housing façade whose window lights communicate witnessed, matched and no-match states across a cohesive application-wide visual system.

**Architecture:** Preserve the existing React, Socket.IO and room-state boundaries. Add one reviewed raster façade and a small pure visual-state adapter; the existing Canvas draws the photograph and live light/thread overlays at normalized coordinates while accessible DOM content communicates the same result. Landing, Join and Admin reuse the same photographic world through CSS and controlled raster crops without changing product behavior.

**Tech Stack:** React 19, TypeScript, Canvas 2D, CSS, Socket.IO, Vitest, Playwright, Codex ImageGen

---

### Task 1: Generate and provenance the master façade

**Files:**
- Create: `assets/prompts/photographic-hdb-wall.md`
- Create: `assets/generated/photographic-hdb-wall.png`
- Modify: `assets/manifest.json`

**Step 1: Write the constrained generation prompt**

Specify a straight-on, 16:9, fictional Singapore public-housing block at night with realistic concrete, humid air, dark unlit windows, two clearly usable window bays, no people, no address, no logos, no text and no documentary claim. Require clear architectural edges so Canvas light masks can align with windows.

**Step 2: Generate the image**

Use the `imagegen` skill and the attached building only as art-direction context. Generate a new original image rather than editing or copying the reference.

**Step 3: Inspect the output**

Open the saved output and reject it if it contains faces, readable signs, identifying details, distorted geometry, pre-lit hero windows or insufficient contrast at 1280 by 720.

**Step 4: Record provenance**

Run:

```bash
shasum -a 256 assets/generated/photographic-hdb-wall.png
```

Add the prompt path, model, MIME type, UTC time and exact SHA-256 to `assets/manifest.json`.

**Step 5: Commit**

```bash
git add assets/prompts/photographic-hdb-wall.md assets/generated/photographic-hdb-wall.png assets/manifest.json
git commit -m "feat: add photographic HDB wall artwork"
```

### Task 2: Define the visual scene contract with TDD

**Files:**
- Create: `src/client/lib/wall-visual-state.ts`
- Create: `tests/unit/wall-visual-state.test.ts`

**Step 1: Write the failing tests**

Cover the five observable outcomes:

```ts
expect(deriveWallVisualState(null)).toEqual({ state: "idle", litWindowIds: [], hasThread: false });
expect(deriveWallVisualState(matchingSnapshot).litWindowIds).toEqual([27]);
expect(deriveWallVisualState(matchedSnapshot)).toMatchObject({ state: "matched", litWindowIds: [27, 64], hasThread: true });
expect(deriveWallVisualState(noMatchSnapshot)).toMatchObject({ state: "no-match", litWindowIds: [27], hasThread: false });
expect(deriveWallVisualState(reviewingSnapshot)).toMatchObject({ state: "idle", hasThread: false });
```

**Step 2: Run the test and confirm failure**

Run: `npm test -- tests/unit/wall-visual-state.test.ts`

Expected: FAIL because `wall-visual-state.ts` does not exist.

**Step 3: Implement the smallest adapter**

Return only display state, ordered lit IDs and whether a grounded match has a valid scene. Never infer a connection from window count alone.

**Step 4: Run the focused test**

Run: `npm test -- tests/unit/wall-visual-state.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/client/lib/wall-visual-state.ts tests/unit/wall-visual-state.test.ts
git commit -m "test: define photographic wall visual states"
```

### Task 3: Render the photograph and live light choreography

**Files:**
- Modify: `src/client/components/hdb-wall-canvas.tsx`
- Modify: `tests/e2e/demo.spec.ts`

**Step 1: Extend the failing E2E expectations**

Require the Canvas to expose stable, accessible diagnostics:

```ts
await expect(wall.locator("canvas")).toHaveAttribute("data-wall-state", "matched");
await expect(wall.locator("canvas")).toHaveAttribute("data-lit-count", "2");
await expect(wall.locator("canvas")).toHaveAttribute("data-has-thread", "true");
```

After the negative fixture require `data-wall-state="no-match"`, `data-lit-count="1"` and `data-has-thread="false"`.

**Step 2: Run the focused E2E test and confirm failure**

Run: `npm run test:e2e -- --grep "two tabs complete"`

Expected: FAIL on the missing Canvas attributes.

**Step 3: Replace fabricated façade drawing**

Load `assets/generated/photographic-hdb-wall.png` through a module import. Draw it with a cover crop into the Canvas. Use a small reviewed array of normalized window rectangles that align with the final image, then render:

- warm amber clipped fills plus radial glow for each approved window;
- one gentle matching breath around the source window;
- a blue-white quadratic connection line only for `MATCH` with a valid scene;
- an immediate stable final frame when `prefers-reduced-motion` is active.

Keep the existing DPR cap and one Canvas element. Add an image-load fallback that draws a near-black concrete gradient.

**Step 4: Expose the visual diagnostics**

Set `data-wall-state`, `data-lit-count` and `data-has-thread` from `deriveWallVisualState`. Update the accessible label to describe a photographic housing façade whose lit windows reflect live room activity.

**Step 5: Run focused verification**

Run:

```bash
npm test -- tests/unit/wall-visual-state.test.ts
npm run test:e2e -- --grep "two tabs complete"
```

Expected: PASS.

**Step 6: Commit**

```bash
git add src/client/components/hdb-wall-canvas.tsx tests/e2e/demo.spec.ts
git commit -m "feat: animate matches through photographic windows"
```

### Task 4: Reveal evidence without hiding the building

**Files:**
- Modify: `src/client/routes/wall-page.tsx`
- Modify: `src/client/styles/global.css`
- Modify: `tests/e2e/demo.spec.ts`

**Step 1: Add failing layout assertions**

Add stable locators or classes for a cinematic match caption, evidence lower-third and narrow Gemini guide. Assert that `NO MATCH YET` remains visible and that the Wall page does not overflow at 1280 by 720.

**Step 2: Run the focused E2E test and confirm failure**

Run: `npm run test:e2e -- --grep "two tabs complete"`

Expected: FAIL on the new layout contract.

**Step 3: Restructure Wall Mode**

Keep the building full bleed. Replace the cream full-stage result composition with:

- a small top-left state caption;
- a bottom evidence band containing the approved memory, evidence path and prepared listener interest;
- a narrow right-side Gemini guide surface that does not cover the two mapped windows;
- a calm one-window no-match caption.

Do not remove any consent, evidence, guide-error or provider-status copy.

**Step 4: Restyle Wall Mode**

Use carbon translucent surfaces, warm bone type, amber state accents and moon-blue connection accents. Ensure text contrast, font sizes and z-indexing remain legible over the photograph.

**Step 5: Run the focused E2E test**

Run: `npm run test:e2e -- --grep "two tabs complete"`

Expected: PASS at 1280 by 720 and 1440 by 900.

**Step 6: Commit**

```bash
git add src/client/routes/wall-page.tsx src/client/styles/global.css tests/e2e/demo.spec.ts
git commit -m "feat: make the building the wall-mode reveal"
```

### Task 5: Carry the photographic system across every mode

**Files:**
- Modify: `src/client/routes/landing-page.tsx`
- Modify: `src/client/routes/join-page.tsx`
- Modify: `src/client/routes/admin-page.tsx`
- Modify: `src/client/styles/global.css`
- Modify: `tests/e2e/demo.spec.ts`

**Step 1: Write failing cross-surface assertions**

Require Landing to use the new generated façade, Join to expose an atmospheric photographic shell without obscuring 48-pixel controls, and Admin to use the same carbon/amber system while preserving QR and provider visibility.

**Step 2: Run E2E and confirm failure**

Run: `npm run test:e2e`

Expected: FAIL on the new visual-shell locators or artwork alt text.

**Step 3: Update Landing**

Replace the previous selected artwork import with the master façade. Keep the human-thread proposition and disclose `Fictional generated artwork`.

**Step 4: Update Join**

Add a purely atmospheric façade layer to the page shell. Keep every participant card opaque, body text at least 18 pixels on mobile and all action targets at least 48 pixels. Replace the prepared radio SVG preview with a crop from the existing generated memory-object artwork or another reviewed raster asset; retain truthful fictional labeling.

**Step 5: Update Admin**

Add the same photographic shell and dark concrete surfaces. Keep the QR code, room status, development-harness warning and provider details high contrast and operationally clear.

**Step 6: Run responsive E2E**

Run: `npm run test:e2e`

Expected: PASS at the existing desktop and mobile viewports with no horizontal overflow.

**Step 7: Commit**

```bash
git add src/client/routes/landing-page.tsx src/client/routes/join-page.tsx src/client/routes/admin-page.tsx src/client/styles/global.css tests/e2e/demo.spec.ts
git commit -m "feat: unify the app around photographic night imagery"
```

### Task 6: Verify motion, fallbacks and the complete room story

**Files:**
- Modify: `tests/e2e/demo.spec.ts`
- Create: `docs/images/photographic-wall-match.png`
- Create: `docs/images/photographic-wall-no-match.png`

**Step 1: Add reduced-motion coverage**

Create a Playwright context with `reducedMotion: "reduce"`. Assert matched and no-match final states render without depending on an animation delay.

**Step 2: Run focused E2E**

Run: `npm run test:e2e`

Expected: PASS.

**Step 3: Exercise the critical flow visually**

Use two tabs. Confirm participant approval updates Wall Mode, the Queenstown/radio fixture produces two believable lights and one thread, and the negative fixture produces one witnessed light with no thread.

**Step 4: Capture public-safe proof images**

Capture the matched and no-match Wall states at 1280 by 720. Inspect both for image artifacts, text collisions, clipped controls and accidental identifying detail.

**Step 5: Run all required gates**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Expected: all commands exit zero.

**Step 6: Review the complete diff and commit**

```bash
git add tests/e2e/demo.spec.ts docs/images/photographic-wall-match.png docs/images/photographic-wall-no-match.png
git commit -m "test: verify the photographic connection experience"
```
