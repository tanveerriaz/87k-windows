#!/usr/bin/env bash
# Configure Railway production env for 87k-windows (real inference, not mock).
# Requires: railway login, OPENROUTER_API_KEY or GEMINI_API_KEY in .env (never commit .env).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_ID="052f7a55-c85f-45d7-8247-f635829b09d0"

if ! command -v railway >/dev/null 2>&1; then
  echo "Install Railway CLI: https://docs.railway.app/develop/cli" >&2
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "Run: railway login" >&2
  exit 1
fi

railway link --project "$PROJECT_ID"

if [[ ! -f .env ]]; then
  echo "Missing .env with OPENROUTER_API_KEY or GEMINI_API_KEY" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

COMMON=(
  --set "NODE_ENV=production"
  --set "ROOM_TTL_MINUTES=120"
  --set "GEMINI_FACILITATOR=gemini"
)

if [[ -n "${OPENROUTER_API_KEY:-}" ]]; then
  echo "Configuring OpenRouter path…"
  railway variables \
    "${COMMON[@]}" \
    --set "INFERENCE_PROVIDER=openrouter" \
    --set "OPENROUTER_BASE_URL=${OPENROUTER_BASE_URL:-https://openrouter.ai/api/v1}" \
    --set "OPENROUTER_GEMMA_MODEL=${OPENROUTER_GEMMA_MODEL:-google/gemma-3-27b-it}" \
    --set "OPENROUTER_GEMINI_MODEL=${OPENROUTER_GEMINI_MODEL:-google/gemini-3.6-flash}" \
    --set "OPENROUTER_API_KEY=${OPENROUTER_API_KEY}"
elif [[ -n "${GEMINI_API_KEY:-}" ]]; then
  echo "Configuring hosted Gemma + Gemini path (GEMINI_API_KEY)…"
  railway variables \
    "${COMMON[@]}" \
    --set "INFERENCE_PROVIDER=gemma-api" \
    --set "GEMMA_MODEL=${GEMMA_MODEL:-gemma-4-26b-a4b-it}" \
    --set "GEMINI_MODEL=${GEMINI_MODEL:-gemini-3.6-flash}" \
    --set "GEMINI_API_KEY=${GEMINI_API_KEY}"
else
  echo "Set OPENROUTER_API_KEY or GEMINI_API_KEY in .env first." >&2
  exit 1
fi

echo "Waiting for redeploy…"
sleep 15
URL="${RAILWAY_DEMO_URL:-https://87k-windows.up.railway.app}"
echo "Health:"
curl -fsS "${URL%/}/health" | python3 -m json.tool
