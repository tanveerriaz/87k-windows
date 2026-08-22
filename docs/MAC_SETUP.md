# Mac Mini to MacBook Air setup

GitHub is the bridge between the build Mac Mini and the presentation MacBook Air M4 with 16 GB memory. Clone cleanly on the Air; never copy `node_modules`, `.env`, Ollama model folders, logs or an old working directory between machines.

## Day-of-event ladder

1. **Cloud Run + hosted Gemma** — phones scan a QR; nothing is installed on them.
2. **Ollama offline** — the MacBook Air runs native `gemma3:4b` with Apple Silicon acceleration.
3. **Mock emergency** — prepared deterministic story; no model, key or network.

## First setup on the MacBook Air

Use the pinned Node 22 runtime. Install Git/Xcode Command Line Tools and Node yourself. Install native Ollama only if you want the offline fallback.

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/tanveerriaz/87k-windows.git
cd 87k-windows
./scripts/setup-macos.sh --with-ollama
./scripts/verify-demo-machine.sh
```

Omit `--with-ollama` for Mock/Cloud-only preparation. The setup script runs `npm ci`; it does not install system software or create/overwrite environment files.

## Run each safety net

```bash
npm run demo:mock
npm run demo:local
```

For a local hosted-Gemma check, keep the key out of shell history:

```bash
read -s "GEMINI_API_KEY?Gemini API key: "
export GEMINI_API_KEY
npm run demo:gemma
unset GEMINI_API_KEY
```

Set `CLOUD_RUN_DEMO_URL` only in the current shell or an ignored environment file, then run `npm run verify:machine`; it checks that `/health` reports `gemma-api`.

```bash
export CLOUD_RUN_DEMO_URL='https://YOUR-SERVICE-URL'
./scripts/verify-demo-machine.sh
```

After physically checking the real 1280 × 720 output:

```bash
./scripts/verify-demo-machine.sh --projector-tested
```

## Normal update workflow

```bash
git status --short
git pull --ff-only
npm ci
./scripts/verify-demo-machine.sh
```

Stop if local modifications appear. Review them rather than pulling over legitimate work.

## Presentation checklist

- Complete one phone-to-wall flow on Cloud Run.
- Disconnect Wi-Fi and complete the prepared Ollama flow.
- Stop Ollama and complete the Mock flow.
- Test the real projector at 1280 × 720.
- Keep the Air awake and plugged in.
- Bring the charger, display adapter and phone hotspot.
- Keep a local 60-second backup recording and the public commit SHA.
