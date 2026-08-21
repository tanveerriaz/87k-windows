#!/usr/bin/env bash

set -euo pipefail

WITH_OLLAMA=0
MODEL="gemma3:4b"

usage() {
  cat <<'USAGE'
Usage: ./scripts/setup-macos.sh [--with-ollama]

Checks the Mac and installs project dependencies from package-lock.json.
--with-ollama also verifies native Ollama and pulls gemma3:4b only when missing.
The script never installs Homebrew, Node, npm, Git, Ollama or other system software.
USAGE
}

for argument in "$@"; do
  case "$argument" in
    --with-ollama) WITH_OLLAMA=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $argument" >&2; usage >&2; exit 2 ;;
  esac
done

fail() {
  echo "SETUP FAILED: $1" >&2
  exit 1
}

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

[[ "$(uname -s)" == "Darwin" ]] || fail "macOS is required. No system changes were made."
[[ "$(uname -m)" == "arm64" ]] || fail "Apple Silicon (arm64) is required for the presentation workflow."
command -v git >/dev/null 2>&1 || fail "Git is missing. Install Xcode Command Line Tools yourself, then rerun."
command -v node >/dev/null 2>&1 || fail "Node.js is missing. Install the pinned Node 22 release yourself, then rerun."
command -v npm >/dev/null 2>&1 || fail "npm is missing. Install Node.js 22 with npm yourself, then rerun."

NODE_VERSION="$(node --version)"
NODE_MAJOR="${NODE_VERSION#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"
[[ "$NODE_MAJOR" == "22" ]] || fail "Node 22 is required; found $NODE_VERSION. Use .nvmrc or .node-version, then rerun."
[[ -f package-lock.json ]] || fail "package-lock.json is required for a reproducible install."

echo "macOS: $(sw_vers -productVersion)"
echo "Architecture: $(uname -m)"
echo "Node: $NODE_VERSION"
echo "npm: $(npm --version)"

if [[ -e .env || -e .env.local ]]; then
  echo "Environment file detected and preserved unchanged."
else
  echo "No environment file created; Mock and Local modes use safe defaults."
fi

echo "Installing the exact locked dependencies with npm ci..."
npm ci

if command -v ollama >/dev/null 2>&1; then
  OLLAMA_VERSION="$(ollama_version)"
  if [[ -z "$OLLAMA_VERSION" ]] || ! ollama_supported "$OLLAMA_VERSION"; then
    if [[ "$WITH_OLLAMA" == "1" ]]; then
      fail "Ollama 0.6 or newer is required. Upgrade it yourself; this script will not modify system software."
    fi
    echo "Ollama: installed, but version 0.6 or newer was not confirmed (optional setup skipped)."
  else
    echo "Ollama: $OLLAMA_VERSION"
  fi
elif [[ "$WITH_OLLAMA" == "1" ]]; then
  fail "Ollama is not installed. Install the native macOS Apple Silicon app yourself, then rerun with --with-ollama."
else
  echo "Ollama: not installed (optional; rerun with --with-ollama after installing it natively)."
fi

if [[ "$WITH_OLLAMA" == "1" ]]; then
  OLLAMA_VERSION="$(ollama_version)"
  ollama_supported "$OLLAMA_VERSION" || fail "Ollama 0.6 or newer is required."
  if ollama list 2>/dev/null | awk 'NR > 1 {print $1}' | grep -qx "$MODEL"; then
    echo "$MODEL is already present; no model download is needed."
  else
    echo "Pulling the approved MacBook Air fallback model: $MODEL"
    ollama pull "$MODEL"
  fi
fi

echo "Setup complete. Run ./scripts/verify-demo-machine.sh next."
