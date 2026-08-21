#!/usr/bin/env bash

set -uo pipefail

PROJECTOR_TESTED=0
for argument in "$@"; do
  case "$argument" in
    --projector-tested) PROJECTOR_TESTED=1 ;;
    -h|--help)
      echo "Usage: ./scripts/verify-demo-machine.sh [--projector-tested]"
      exit 0
      ;;
    *) echo "Unknown option: $argument" >&2; exit 2 ;;
  esac
done

RAILWAY_STATUS="NOT READY"
OLLAMA_STATUS="NOT READY"
MOCK_STATUS="NOT READY"
PROJECTOR_STATUS="NOT TESTED"
VERIFY_LOG="$(mktemp -t 87k-windows-verify.XXXXXX)"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$VERIFY_LOG"
}
trap cleanup EXIT INT TERM

ollama_version() {
  local output
  output="$(ollama --version 2>&1 || true)"
  echo "$output" | grep -Eo '[0-9]+\.[0-9]+(\.[0-9]+)?' | tail -n 1
}

ollama_supported() {
  local version="$1" major minor patch
  IFS='.' read -r major minor patch <<< "$version"
  major="${major:-0}"
  minor="${minor:-0}"
  (( major > 0 || (major == 0 && minor >= 6) ))
}

if [[ -n "${RAILWAY_DEMO_URL:-}" ]] && command -v curl >/dev/null 2>&1; then
  if curl -fsS --max-time 8 "${RAILWAY_DEMO_URL%/}/health" 2>/dev/null | grep -q '"status":"ok"'; then
    RAILWAY_STATUS="READY"
  fi
fi

if [[ "$(uname -s)" == "Darwin" && "$(uname -m)" == "arm64" ]] && command -v ollama >/dev/null 2>&1; then
  OLLAMA_VERSION="$(ollama_version)"
  if [[ -n "$OLLAMA_VERSION" ]] && ollama_supported "$OLLAMA_VERSION" \
    && ollama list 2>/dev/null | awk 'NR > 1 {print $1}' | grep -qx 'gemma3:4b' \
    && curl -fsS --max-time 4 "${OLLAMA_BASE_URL:-http://127.0.0.1:11434}/api/tags" 2>/dev/null | grep -q 'gemma3:4b'; then
    OLLAMA_STATUS="READY"
  fi
fi

NODE_VERSION="$(node --version 2>/dev/null || true)"
NODE_MAJOR="${NODE_VERSION#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"
if [[ "$(uname -s)" == "Darwin" && "$(uname -m)" == "arm64" && "$NODE_MAJOR" == "22" \
  && -f package-lock.json && -d node_modules && -x node_modules/.bin/vite && -x node_modules/.bin/tsx ]]; then
  if npm run lint >"$VERIFY_LOG" 2>&1 \
    && npm run typecheck >>"$VERIFY_LOG" 2>&1 \
    && npm test >>"$VERIFY_LOG" 2>&1 \
    && npm run build >>"$VERIFY_LOG" 2>&1; then
    DEMO_PORT=$((31000 + RANDOM % 1000))
    PORT="$DEMO_PORT" INFERENCE_PROVIDER=mock node dist/server/index.js >>"$VERIFY_LOG" 2>&1 &
    SERVER_PID=$!
    for _attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
      if curl -fsS --max-time 2 "http://127.0.0.1:${DEMO_PORT}/health" 2>/dev/null | grep -q '"provider":"mock"'; then
        MOCK_STATUS="READY"
        break
      fi
      sleep 0.25
    done
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    SERVER_PID=""
  fi
fi

if [[ "$PROJECTOR_TESTED" == "1" || "${PROJECTOR_TESTED_1280X720:-0}" == "1" ]]; then
  PROJECTOR_STATUS="READY"
fi

printf 'RAILWAY PRIMARY: %s\n' "$RAILWAY_STATUS"
printf 'OLLAMA OFFLINE: %s\n' "$OLLAMA_STATUS"
printf 'MOCK EMERGENCY: %s\n' "$MOCK_STATUS"
printf 'PROJECTOR 1280x720: %s\n' "$PROJECTOR_STATUS"

if [[ "$MOCK_STATUS" != "READY" ]]; then
  echo "Mock verification details:" >&2
  tail -n 24 "$VERIFY_LOG" >&2
  exit 1
fi
