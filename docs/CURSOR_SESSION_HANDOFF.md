# Cursor → Claude Code session handoff

**Updated:** 2026-08-23 (Cursor). Read this before continuing deploy or hosting work so you do not redo or conflict with in-flight changes.

## Live app

**https://87k-windows.up.railway.app/**

Railway project ID: `052f7a55-c85f-45d7-8247-f635829b09d0`

## ⚠️ Action needed: inference env vars

Site serves static UI (200 on `/`, join, wall, landing film) but **`/health` currently reports `provider: mock` and `facilitator: disabled`**. Set Railway variables per `docs/RAILWAY_DEPLOYMENT.md` (especially `INFERENCE_PROVIDER=openrouter` and `OPENROUTER_API_KEY`), then redeploy. Target health:

`"provider":"openrouter"`, `"facilitator":"gemini"`

## Background

Hackathon Cloud Run (`windows-87k-5etw2y36yq-as.a.run.app`) is **503** — GCP project was ~24h only.

## Cursor repo changes (may be uncommitted)

| File | Change |
| --- | --- |
| `railway.toml` | Dockerfile build, `/health` check |
| `docs/RAILWAY_DEPLOYMENT.md` | Deploy guide + env vars |
| `docs/CURSOR_SESSION_HANDOFF.md` | This file |
| `.dockerignore` | Exclude heavy `assets/video/`, etc. |
| `.env.example` | `RAILWAY_DEMO_URL` |
| `scripts/verify-demo-machine.sh` | `RAILWAY_DEMO_URL` support |
| `README.md` / `AGENTS.md` / `CLAUDE.md` | Live Railway URL + handoff pointers |

## Verify after env fix

```bash
curl -fsS https://87k-windows.up.railway.app/health
RAILWAY_DEMO_URL=https://87k-windows.up.railway.app ./scripts/verify-demo-machine.sh
```

## Coordination

- Do not redeploy GCP. Set secrets only in Railway variables, never in repo.
- Preserve unrelated user files unless user requests commit.
