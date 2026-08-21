# Mac Mini to MacBook Air setup

## Roles and source of truth

The Mac Mini is the build machine: it is where changes are implemented, tested and audited for a public repository. GitHub is the only source-of-truth bridge between machines.

The MacBook Air M4 with 16 GB memory is the presentation machine. It receives a fresh Git clone and installs the locked dependencies itself. Never copy `node_modules`, `.env`, Ollama model folders, generated logs or a working directory between Macs.

The day-of-event mode ladder is:

1. **Railway primary** — live phones, one shared Wall Mode and the hosted model after deployment is explicitly authorized.
2. **Ollama offline** — native Ollama with `gemma3:4b` on the MacBook Air. No Docker layer is used, so Apple Silicon acceleration remains available.
3. **Mock emergency** — deterministic prepared stories with no model, credential or network requirement.

## Pinned runtime

The project pins Node.js `22.23.2` in `package.json`, `.node-version`, `.nvmrc` and GitHub Actions. A newer Node version may be present on the build machine, but the clean-clone and presentation-machine verification must use the pinned Node 22 runtime.

## First setup on the MacBook Air

Install Git/Xcode Command Line Tools, Node 22 and—only for Offline Mode—the native macOS Apple Silicon Ollama application yourself. The project scripts deliberately do not install or upgrade Homebrew or system software.

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/tanveerriaz/87k-windows.git
cd 87k-windows
./scripts/setup-macos.sh --with-ollama
./scripts/verify-demo-machine.sh
```

Omit `--with-ollama` when preparing only Mock Mode. The flag checks Ollama 0.6 or newer and downloads `gemma3:4b` only when that exact model is missing. It never selects `gemma3:12b` or another model based on what happens to exist on the Mac Mini.

The setup script runs `npm ci` from the committed lockfile. It does not create or overwrite `.env` or `.env.local`.

## Run the safety nets

```bash
npm run demo:mock
npm run demo:local
npm run verify:machine
```

`demo:local` requires the native Ollama service and `gemma3:4b`. It uses local text extraction; deterministic retrieval and the invitation fallback remain inside the application. `demo:mock` needs neither Ollama nor an internet connection.

To verify the projector after physically checking the 1280 × 720 output:

```bash
./scripts/verify-demo-machine.sh --projector-tested
```

For Railway, set `RAILWAY_DEMO_URL` only in the shell or an ignored local environment file. The verification script checks its `/health` route. It never writes the URL or a secret into the repository.

## Normal update workflow

```bash
git status --short
git pull --ff-only
npm ci
./scripts/verify-demo-machine.sh
```

Stop if local modifications appear. Review them rather than pulling over legitimate work.

## Clean-clone portability check

The release check uses a temporary local clone with Git object hard-linking disabled. Inside that clone, run `npm ci`, the four quality gates, machine verification and the two-browser test under Node 22. Do not copy an existing `node_modules`, environment file, model directory or log into the clone.

## Presentation checklist

- Complete one phone-to-Wall flow on Railway.
- Disconnect Wi-Fi and complete the prepared Ollama flow.
- Stop Ollama and complete the Mock flow.
- Test the real projector at 1280 × 720.
- Keep the MacBook Air awake while plugged in.
- Bring the charger, display adapter and phone hotspot.
- Keep a local 60-second backup recording.

No Railway resource is created or changed by these instructions.
