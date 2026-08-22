# Demo Image Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep upload and prepared-demo-image options while making the active image source and restore action unambiguous.

**Architecture:** Keep image selection as local React state in Join Mode. Derive whether the prepared image is active from `fixture === "radio" && photoData === null`; never include image data in the extraction request. Cover the user-visible state transitions in the existing Playwright critical-flow test.

**Tech Stack:** React 19, TypeScript, Playwright, Vitest, Vite

---

### Task 1: Specify the two image-selection paths

**Files:**
- Modify: `tests/e2e/demo.spec.ts`

**Step 1: Write the failing E2E assertions**

In the existing two-tab test, after opening the capture stage, assert that the prepared image is visible and that the UI says `Prepared demo image selected`. Upload an in-memory synthetic PNG through the hidden file input, assert that the custom preview and `Restore prepared demo image` control appear, click restore, and assert that the prepared image and selected status return.

```ts
await expect(join.getByAltText("Prepared fictional illustration of a radio and repair tools")).toBeVisible();
await expect(join.getByText("Prepared demo image selected")).toBeVisible();

await join.locator('input[type="file"]').setInputFiles({
  name: "fictional-radio-cue.png",
  mimeType: "image/png",
  buffer: syntheticPng,
});
await expect(join.getByAltText("Chosen preview; it has not been shared")).toBeVisible();
await join.getByRole("button", { name: "Restore prepared demo image" }).click();
await expect(join.getByText("Prepared demo image selected")).toBeVisible();
```

Use a tiny valid PNG buffer declared in the test so no personal or machine-specific fixture is added.

**Step 2: Run the test and verify it fails**

Run: `npm run test:e2e -- --grep "two tabs complete"`

Expected: FAIL because `Prepared demo image selected` does not exist.

### Task 2: Make image selection state explicit

**Files:**
- Modify: `src/client/routes/join-page.tsx`
- Modify: `src/client/styles/global.css`

**Step 1: Add a dedicated restore action**

Add a function that returns to the radio fixture, clears `photoData`, restores the prepared label, and clears stale errors.

```ts
const restorePreparedImage = () => {
  chooseFixture("radio");
  setError(null);
};
```

**Step 2: Render the active state or restore control**

When the prepared radio image is active, render a non-interactive status such as:

```tsx
<span className="prepared-image-status" role="status">✓ Prepared demo image selected</span>
```

When a custom image is active, render:

```tsx
<button className="text-button" type="button" onClick={restorePreparedImage}>
  Restore prepared demo image
</button>
```

Keep `Add an old photo` present in both cases. Keep `photoData: null` in `extractCapsule(...)` so neither image path is silently sent to Gemma.

**Step 3: Style the selected status**

Add `.prepared-image-status` beside the existing capture actions with at least a 48 px readable/touch-safe row height, muted mint text, and no pointer styling.

**Step 4: Run the focused E2E test**

Run: `npm run test:e2e -- --grep "two tabs complete"`

Expected: PASS for prepared selection, upload preview, restore, positive match, and no-match flow.

### Task 3: Verify and commit the implementation

**Files:**
- Modify: `docs/plans/2026-08-22-demo-image-selection.md` only if implementation details require correction

**Step 1: Run repository quality gates**

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Expected: all commands exit 0.

**Step 2: Inspect the capture stage at mobile size**

Verify at 390 × 844 that both `Add an old photo` and the prepared-image state/restore control are visible, readable, and do not cause horizontal overflow.

**Step 3: Commit**

```bash
git add src/client/routes/join-page.tsx src/client/styles/global.css tests/e2e/demo.spec.ts docs/plans/2026-08-22-demo-image-selection.md
git commit -m "fix: clarify prepared demo image selection"
```
