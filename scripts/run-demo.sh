#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-}"
MODEL="gemma3:4b"
DEMO_PORT="${DEMO_PORT:-3000}"
ROOM_CODE="${ROOM_CODE:-demo87}"

if [[ "$MODE" != "mock" && "$MODE" != "local" && "$MODE" != "gemma" ]]; then
  echo "Usage: ./scripts/run-demo.sh mock|local|gemma" >&2
  exit 2
fi

[[ "$(uname -s)" == "Darwin" ]] || { echo "The presentation launcher supports macOS only." >&2; exit 1; }
[[ "$(uname -m)" == "arm64" ]] || { echo "The presentation launcher requires Apple Silicon." >&2; exit 1; }

NODE_VERSION="$(node --version 2>/dev/null || true)"
NODE_MAJOR="${NODE_VERSION#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"
[[ "$NODE_MAJOR" == "22" ]] || { echo "Node 22 is required; found ${NODE_VERSION:-none}. Use .nvmrc or .node-version." >&2; exit 1; }
[[ -d node_modules ]] || { echo "Dependencies are missing. Run ./scripts/setup-macos.sh first." >&2; exit 1; }

room_urls() {
  ./node_modules/.bin/tsx scripts/show-room-urls.ts "$DEMO_PORT" "$ROOM_CODE" "${ROOM_HOST:-}"
}

start_real_room() {
  local provider="$1" label="$2" urls
  urls="$(room_urls)" || exit 1
  echo "$label"
  echo "Building the single-process room application..."
  npm run build
  echo "$urls"
  echo "Use a trusted private hotspot, never shared event Wi-Fi."
  echo "Open the ADMIN URL on the Mac, put WALL on the projector, and let participants scan the QR."
  exec env NODE_ENV=production PORT="$DEMO_PORT" INFERENCE_PROVIDER="$provider" npm start
}

if [[ "$MODE" == "local" ]]; then
  command -v ollama >/dev/null 2>&1 || { echo "Native Ollama is not installed. Use hosted Gemma or install Ollama for macOS yourself." >&2; exit 1; }
  ollama list 2>/dev/null | awk 'NR > 1 {print $1}' | grep -qx "$MODEL" \
    || { echo "$MODEL is missing. Run ./scripts/setup-macos.sh --with-ollama." >&2; exit 1; }
  curl -fsS --max-time 4 "${OLLAMA_BASE_URL:-http://127.0.0.1:11434}/api/tags" >/dev/null \
    || { echo "Ollama is not responding. Open the native Ollama app, then retry." >&2; exit 1; }
  echo "Warming local Gemma before the room opens..."
  curl -fsS --max-time 120 "${OLLAMA_BASE_URL:-http://127.0.0.1:11434}/api/generate" \
    -H 'Content-Type: application/json' \
    --data "{\"model\":\"$MODEL\",\"prompt\":\"Reply READY\",\"stream\":false,\"keep_alive\":\"30m\",\"options\":{\"num_predict\":8}}" >/dev/null \
    || { echo "Local Gemma warm-up failed. Nothing has been shown to participants." >&2; exit 1; }
  export OLLAMA_MODEL="$MODEL"
  start_real_room ollama "Starting 87K Windows with LOCAL GEMMA PRIMARY on this Mac."
fi

if [[ "$MODE" == "gemma" ]]; then
  [[ -n "${GEMINI_API_KEY:-}" ]] \
    || { echo "GEMINI_API_KEY is missing. Export it from a private shell or ignored .env; never commit it." >&2; exit 1; }
  start_real_room gemma-api "Starting 87K Windows with HOSTED GEMMA FALLBACK. The key remains server-side."
fi

echo "Starting the deterministic TEST HARNESS. Never use this mode during judging."
exec env INFERENCE_PROVIDER=mock npm run dev
