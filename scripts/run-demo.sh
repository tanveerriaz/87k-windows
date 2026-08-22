#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-}"
MODEL="gemma3:4b"

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

if [[ "$MODE" == "local" ]]; then
  command -v ollama >/dev/null 2>&1 || { echo "Native Ollama is not installed. Use hosted Gemma or install Ollama for macOS yourself." >&2; exit 1; }
  ollama list 2>/dev/null | awk 'NR > 1 {print $1}' | grep -qx "$MODEL" \
    || { echo "$MODEL is missing. Run ./scripts/setup-macos.sh --with-ollama." >&2; exit 1; }
  curl -fsS --max-time 4 "${OLLAMA_BASE_URL:-http://127.0.0.1:11434}/api/tags" >/dev/null \
    || { echo "Ollama is not responding. Open the native Ollama app, then retry." >&2; exit 1; }
  echo "Starting 87K Windows in OLLAMA OFFLINE mode with $MODEL."
  exec env INFERENCE_PROVIDER=ollama OLLAMA_MODEL="$MODEL" npm run dev
fi

if [[ "$MODE" == "gemma" ]]; then
  [[ -n "${GEMINI_API_KEY:-}" ]] \
    || { echo "GEMINI_API_KEY is missing. Export it from a private shell or ignored .env; never commit it." >&2; exit 1; }
  echo "Starting 87K Windows in HOSTED GEMMA mode. The key remains server-side."
  exec env INFERENCE_PROVIDER=gemma-api npm run dev
fi

echo "Starting the deterministic TEST HARNESS. Never use this mode during judging."
exec env INFERENCE_PROVIDER=mock npm run dev
