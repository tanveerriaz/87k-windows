# 87K Windows

87K Windows is a live-room hackathon prototype that turns a synthetic memory into a privacy-safe story capsule, shows the participant what can be shared, and then finds an explainable human connection.

> Not an AI companion. An AI that gets out of the way and helps people find one another.

Milestone 1 runs entirely in deterministic Mock Mode. It needs no model credentials, database or cloud service.

The optional MacBook Air fallback uses native Ollama with `gemma3:4b`; see [Mac setup](docs/MAC_SETUP.md). Railway remains the planned primary presentation mode, but no deployment is part of this milestone.

## Local setup

Requirements: Node.js 22.12 or newer and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Open these local routes:

- Landing: `http://127.0.0.1:5173/`
- Join Mode: `http://127.0.0.1:5173/join/demo87`
- Wall Mode: `http://127.0.0.1:5173/wall/demo87`
- Admin Mode: `http://127.0.0.1:5173/admin/demo87`
- Health: `http://127.0.0.1:5173/health`

## Demonstrate the vertical slice

1. Open Wall Mode and Join Mode in separate tabs.
2. In Join Mode, choose **Use prepared photo** and keep the prepared Queenstown radio memory.
3. Create the safe capsule and review the redactions/evidence.
4. Approve it. The wall lights a window, reveals the evidence path and draws the bridge.
5. Join Mode receives the Kopi Card.
6. Reset from Admin Mode, then choose **Use no-match fixture** in Join Mode to verify `NO MATCH YET`.

Admin Mode also provides the room QR, join URL, deterministic injection and room reset controls. Cloud and Local modes are visible but deliberately unavailable during Milestone 1.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run verify:machine
```

All fixture names, places and stories are fictional demo content. Do not replace them with real participant information.

## Architecture

One Express and Socket.IO process holds ephemeral rooms and serves the production Vite build. The client has Join, Wall and Admin modes. Shared Zod schemas and event types keep the browser/server contract explicit. MiniSearch narrows prepared candidates before a deterministic weighted score chooses a match or returns no match.

See [Product](docs/PRODUCT.md) and [Architecture](docs/ARCHITECTURE.md) for the public design record.

For day-of-event launch commands:

```bash
npm run demo:mock
npm run demo:local
```

## Future Railway setup

Deployment is intentionally inactive. When the repository owner explicitly authorizes it:

1. Run the quality gates and public-content audit again.
2. Create one Railway service from this repository using Node.js 22.
3. Use `npm run build` as the build command and `npm run start` as the start command.
4. Configure one replica, health check `/health`, and keep Serverless sleep off during judging.
5. Add secrets only through Railway Variables. Never commit them or expose them through `VITE_*` variables.
6. Generate one public domain and encode its `/join/:roomCode` URL in the Admin Mode QR.

No Railway resource is required or created by Milestone 1.

## Licence

No software licence has been selected yet.
