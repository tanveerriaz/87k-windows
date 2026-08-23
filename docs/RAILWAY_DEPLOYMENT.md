# Railway deployment

Use Railway for the public online-review host. The hackathon Google Cloud project was ephemeral (~24 hours); this repo keeps one deployable Node process and the existing `Dockerfile`.

**Important:** room state is in memory. Keep **exactly one replica** in the Railway service settings. Do not scale horizontally without adding shared state (out of scope).

## Project

Railway project ID (from user): `052f7a55-c85f-45d7-8247-f635829b09d0`

Cross-session handoff (Cursor ↔ Claude Code): [`docs/CURSOR_SESSION_HANDOFF.md`](CURSOR_SESSION_HANDOFF.md)

## 1. Create the service

1. [Railway dashboard](https://railway.app/) → open project `052f7a55-c85f-45d7-8247-f635829b09d0` → **Deploy from GitHub repo** → select `87k-windows` (if not already connected).
2. Railway detects `railway.toml` and builds from `Dockerfile`.
3. In **Settings → Deploy**, set **Replicas** to **1**.

Or from the repo root with the [Railway CLI](https://docs.railway.app/develop/cli):

```bash
railway login
railway link --project 052f7a55-c85f-45d7-8247-f635829b09d0
railway up
```

## 2. Set environment variables

In **Variables** (never commit real keys):

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `INFERENCE_PROVIDER` | `openrouter` |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `OPENROUTER_GEMMA_MODEL` | `google/gemma-3-27b-it` |
| `OPENROUTER_GEMINI_MODEL` | `google/gemini-3.6-flash` |
| `GEMINI_FACILITATOR` | `gemini` |
| `ROOM_TTL_MINUTES` | `120` |
| `OPENROUTER_API_KEY` | your OpenRouter key (mark as secret) |

Railway injects `PORT` automatically; the server reads it at startup.

Optional: `DEMO_ADMIN_SECRET` for presenter-only admin actions.

## 3. Verify before sharing

```bash
export RAILWAY_DEMO_URL='https://87k-windows.up.railway.app'
curl -fsS "$RAILWAY_DEMO_URL/health"
RAILWAY_DEMO_URL="$RAILWAY_DEMO_URL" ./scripts/verify-demo-machine.sh
```

Expect `"status":"ok"`, `"provider":"openrouter"`, `"facilitator":"gemini"`. Then open `/join/demo87` on a phone and `/wall/demo87` on the projector.

## 4. Custom domain (optional)

Railway → **Settings → Networking** → generate domain or attach your own. Update README live links after the URL is final.

## Notes

- `trust proxy` is enabled in production for the single Railway edge hop (same pattern as Cloud Run).
- Large video sources under `assets/video/` are excluded from the Docker build via `.dockerignore`; web deliverables live in `public/`.
- Do not put API keys in `VITE_*` variables or the public repository.
