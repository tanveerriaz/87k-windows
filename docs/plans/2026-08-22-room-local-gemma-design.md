# Room-Local Gemma Design

## Decision

The judged primary path runs `gemma3:4b` through native Ollama on the presentation M4 MacBook Air with 16 GB memory. Participant phones remain zero-install browser clients and connect to the Mac over the room Wi-Fi or hotspot. Hosted Gemma remains the remote-demo and internet fallback; mock inference remains test-only.

## Architecture

The Mac builds and serves the existing React client from the existing Express/Socket.IO process on `0.0.0.0`. Only the Node server calls Ollama on `127.0.0.1`, so the model service is never exposed to participant devices. The launcher discovers usable private IPv4 addresses and prints phone, wall, and admin URLs for the shared room.

Before opening the room, the launcher verifies the approved model and performs a short warm-up inference. Admin Mode truthfully identifies local Gemma as the judging provider. The current consent, redaction, Zod validation, repair, deterministic matching, no-match, ephemeral-state, and synthetic-data boundaries remain unchanged.

## Failure handling

- No LAN address: stop with instructions to connect the Mac and phones to the same Wi-Fi or hotspot.
- Ollama or model missing: stop before showing the room.
- Warm-up failure: stop rather than use mock inference.
- Internet unavailable: local judging continues.
- Local inference unavailable: use the separately launched hosted Gemma path or the prerecorded real-Gemma demo.

## Verification

Test network-address selection deterministically, exercise the two-tab match and no-match flow, and run lint, typecheck, unit/integration tests, build, E2E, and machine verification. Physically scan the printed LAN join URL from a phone before judging.
