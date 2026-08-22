# 87K Windows

87K Windows is a live-room experience that turns a short, consented memory into a privacy-safe story capsule, lights one window in a shared Singapore block, and reveals an explainable human connection.

> Not an AI companion. An AI that listens, finds the bridge, and gets out of the way.

![Two illuminated windows connected by a blue thread in a fictional Singapore housing block](assets/generated/submission-thumbnail.jpg)

**Live demo:** [windows-87k-985493069617.asia-southeast1.run.app](https://windows-87k-985493069617.asia-southeast1.run.app)

It is built for the **Best Use of Gemma** and **Best Elderly Hack** tracks. The phone is the doorway, the projected building is the shared moment, and Gemma is the private listener between them.

```text
PHONE                         SERVER                         SHARED WALL
Tell one memory  ────────▶  redact + Gemma 4  ─────────▶  one window lights
review safe capsule  ◀────  structured evidence           a bridge appears
approve to connect  ─────▶  deterministic matching  ───▶  a human invitation
```

All committed stories are clearly fictional. Raw memory text is not placed in room state or persisted. The hackathon runs with real Gemma in two modes:

1. **Cloud Run + hosted Gemma 4** — primary judged experience.
2. **Native Ollama + Gemma 3 4B** — offline MacBook Air fallback.

If neither real model is available, the demo stops honestly. A deterministic provider remains in the repository only for automated tests and UI development; it is not a judging mode.

## Run locally

Requirements: Node.js 22 and npm.

```bash
git clone https://github.com/tanveerriaz/87k-windows.git
cd 87k-windows
npm ci
npm test
```

Start either real-model path:

```bash
npm run demo:gemma  # requires GEMINI_API_KEY in the shell
npm run demo:local  # requires native Ollama and gemma3:4b
```

Then open:

- Join: `http://127.0.0.1:5173/join/demo87`
- Wall: `http://127.0.0.1:5173/wall/demo87`
- Admin: `http://127.0.0.1:5173/admin/demo87`
- Health: `http://127.0.0.1:5173/health`

To run the real hosted model, put the key in your environment—never in the browser, source or a `VITE_*` variable:

```bash
read -s "GEMINI_API_KEY?Gemini API key: "
export GEMINI_API_KEY
npm run demo:gemma
```

The server uses `INFERENCE_PROVIDER=gemma-api` and defaults to `GEMMA_MODEL=gemma-4-26b-a4b-it`. It redacts obvious contact details before inference, requests schema-constrained JSON, validates it again with Zod, attempts one safe repair for malformed output, and times out without sharing anything. It never silently falls back to simulated inference.

## Demonstrate the core loop

1. Put Wall Mode on the projector and open Join Mode on a phone.
2. Tell or type the prepared fictional Queenstown radio memory.
3. Show Gemma turning it into a redacted, evidence-backed capsule.
4. Approve it. A window lights, the evidence bridge appears, and the participant receives a Kopi Card.
5. Reset in Admin Mode and run the no-match fixture to prove the system refuses a weak connection.

The user installs nothing on a phone: scan the room QR and use the browser. The presenter can use the hosted URL, or run the same repository on the MacBook Air.

## Deployment and generated assets

- [Google Cloud Run deployment](docs/GCP_DEPLOYMENT.md)
- [Mac Mini to MacBook Air setup](docs/MAC_SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Product and safety](docs/PRODUCT.md)
- [Nano Banana asset provenance](docs/ASSET_PROVENANCE.md)
- [Submission checklist](docs/SUBMISSION.md)
- [90-second demo script](docs/DEMO_SCRIPT.md)

Nano Banana is used only at build time to create non-personal visual texture and submission artwork. The live interaction remains fast, truthful HTML/Canvas/SVG; generated imagery is not presented as a participant's real memory.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run verify:machine
```

`verify:machine` intentionally requires Node 22 and reports the readiness of Cloud Run, native Ollama, the deterministic test harness and the physical projector check.

## Licence

No software licence has been selected yet.
