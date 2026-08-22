---
name: changing-87k-experience
description: Use when changing Join, Wall, or Admin Mode, room events, matching behavior, accessibility, or the participant journey in 87K Windows.
---

# Changing the 87K Experience

Preserve informed consent and a consistent live-room experience across every layer a behavior change touches.

## Before Changing Behavior

Read `AGENTS.md`, `docs/PRODUCT.md`, and `docs/ARCHITECTURE.md`, then inspect the relevant source and tests. Treat repository docs as authoritative; use this skill to find the decisions that need tracing, not as a substitute for those docs.

Trace impact through shared schemas and event types, server room state, Socket.IO handlers, and every Join, Wall, and Admin consumer. Do not assume a UI request is client-only.

## Product Boundaries

- Draft content may be edited locally before approval.
- Approval is a state boundary. If approved content changes, it must return to participant review and receive renewed approval before it enters, replaces, or triggers an update to shared room state. Never directly broadcast post-approval edits.
- Keep room state and logs free of raw text and images. Preserve ephemeral processing and do not persist uploads or raw memories.
- Do not send images to Gemma unless the product and architecture documentation explicitly change.
- Weak evidence produces `NO MATCH YET`; do not force a connection.

## Quick Reference

| Change | Trace and verify |
|---|---|
| Draft or approval flow | Local draft → review → approval → shared state; changed approved content repeats review and approval |
| Room event or matching | Shared schema/event → server state → Socket.IO → Join/Wall/Admin consumers |
| Wall rendering | Keep the HDB wall on Canvas; verify 1280 × 720 legibility and reduced motion |
| Participant interaction | Preserve mobile body text, 48 px targets, consent, privacy, and failure/no-match states |

## Development and Verification

Use TDD for behavior changes: write and observe the focused failing test, implement the smallest change, then run proportionate checks. Run the repository quality gates after meaningful code changes.

For critical-flow changes, exercise two tabs and verify participant submission updates Wall Mode, the Queenstown/radio fixture matches, and the negative fixture produces an honest no-match.

## Common Mistakes

- Editing only one screen while leaving event contracts or other consumers stale.
- Treating prior approval as permission to publish revised content.
- Logging raw input for debugging or placing it in room state.
- Replacing Canvas with per-window DOM nodes.
- Testing only the happy path, one tab, or motion-enabled desktop layouts.
