# Cursor ↔ Claude Code session handoff

**Updated:** 2026-08-23 late evening.

## Live production (stable — do not redeploy unless intentional)

**https://87k-windows.up.railway.app/**

- Railway project: `052f7a55-c85f-45d7-8247-f635829b09d0`
- Inference: **OpenRouter-hosted Gemma 3 27B + Gemini 3.6 Flash** via `OPENROUTER_API_KEY` (configured in Railway)
- `/health` → `{ "status": "ok" }` only (no provider/model leak)
- OG image + favicons in `public/og-image.png`, `index.html` meta tags

Hackathon Cloud Run is dead (~24h project). Ignore old `run.app` URLs.

## What Claude Code is doing now (separate worktree)

Branch: **`feature/multilingual`** in `.claude/worktrees/multilingual/`

Active plan: `docs/superpowers/plans/2026-08-23-multilingual.md`

Recent commits on that branch:
- Language on capsules; canonical English match fields
- Speech input + read-aloud per selected language (en/zh/ms/ta)
- Join UI translation gaps

**In progress / uncommitted in worktree:** `consent-evidence.ts`, ollama tests, plan doc edits.

**Do not merge or deploy multilingual until** plan tasks + quality gates + e2e pass. Wall/admin stay English per plan.

## What Cursor already landed on `main`

Commit `a673937`: Railway migration, hardened `/health`, social preview, favicons, handoff docs, configure script.

## Coordination rules

| Area | Owner | Notes |
| --- | --- | --- |
| Railway hosting / env | Done | User ran `railway-configure-production.sh` |
| Multilingual feature | Claude worktree | Isolated; merge to `main` when ready |
| Landing film / video assets | Local only | Large files untracked; not blockers |
| Secrets | Railway variables + local `.env` | Never commit |

## Verify production

```bash
curl -fsS https://87k-windows.up.railway.app/health
# → {"status":"ok"}
```

Provider labels visible on Join / Wall / Admin UI only — not on `/health`.
