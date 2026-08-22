# Demo Image Selection Design

## Goal

Keep both image paths in Join Mode: a prepared fictional demo image that is active by default and an upload control for a participant-selected image. Make the active choice obvious so the prepared-image control never appears broken.

## Interaction

- The prepared fictional radio image is visible and selected when the capture step opens.
- The image area identifies the prepared image as selected instead of presenting an inert action.
- `Add an old photo` continues to open the browser's file or camera picker.
- After a custom image is prepared locally, the image area shows that preview and offers `Restore prepared demo image`.
- Restoring the prepared image clears the local custom preview and visibly returns the selected state.
- The no-match fixture remains text-only and can still return to the prepared radio fixture.

## Privacy and data flow

The prepared image and uploaded preview remain browser-only memory cues. Neither image is sent to Gemma. The fictional radio memory text continues through the active real Gemma provider, preserving the existing public privacy claim and avoiding misleading multimodal behavior.

## Error handling

Existing camera-denied and image-compression errors remain recoverable. A failed upload leaves the current prepared image available. Restoring the prepared image clears stale upload errors.

## Verification

Extend the two-tab Playwright flow to verify that the prepared image begins selected, a synthetic uploaded image becomes active, and the prepared image can be restored. Run lint, typecheck, unit/integration tests, build, and E2E before completion.
