# 87K Windows — Repository Instructions

## Product

Build a visual-first, live-room hackathon prototype that uses Gemma to create explainable, consented human connections from synthetic memories. The AI must facilitate real human connection, not imitate companionship.

## Working agreements

- Read the sanitized project documentation and inspect the visual references before changing product behavior.
- Lead with a runnable vertical slice. Keep the deterministic provider for tests only; never present it during judging.
- Keep one TypeScript repository and one deployable Node process.
- Use React/Vite, Express, Socket.IO, Zod, MiniSearch and Vitest.
- Keep shared schemas and Socket.IO event types in `src/shared/`.
- Use one hosted instance (Railway); do not add Redis or a database.
- Keep all Google and admin secrets server-side. Never use `VITE_` for secrets.
- Use synthetic data only. Do not persist uploads or raw memory text.
- Never display hidden chain-of-thought. Show evidence, confidence, uncertainty and missing information instead.
- A weak connection must return `NO MATCH YET`.
- Do not deploy or mutate Google Cloud resources until the user explicitly authorizes the exact project and deployment.
- The repository is public. Assume every tracked file, fixture, screenshot, diff and log is externally visible.
- Never commit `.env`, secrets, Google credentials, raw submissions, personal photographs, personal data or machine-specific absolute paths.
- Keep `.env.example` values empty and synthetic fixtures clearly labelled fictional.
- Do not commit the private CLI handoff; maintain sanitized public product and architecture documentation.
- Do not push, open a pull request or configure GitHub/Cloud Run integration until the user explicitly authorizes publishing.
- Do not add a licence without the user's choice.
- Preserve unrelated user files and changes.

## Quality gates

After meaningful code changes, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions must run the same four gates for every pushed branch and pull request once publishing is authorized.

Test the critical flow with at least two tabs: participant submission must update Wall Mode, produce the Queenstown/radio match and produce an honest no-match for the negative fixture.

## Experience rules

- Mobile body text is at least 18 px and targets at least 48 px.
- Wall Mode must remain legible at 1280 × 720.
- Use Canvas for the HDB wall; do not create 87,200 DOM elements.
- Respect `prefers-reduced-motion`.
- Provide camera-denied, invalid-model-output, cloud-timeout and no-match states.
- Keep Mock, Cloud and Local provider status visible but unobtrusive.

## Scope exclusions

Do not add native mobile apps, authentication, payments, contact exchange, permanent storage, vector databases, queues, microservices or a self-hosted cloud GPU unless the user changes the scope.

## Learned User Preferences

- Keep the 87K WINDOWS wordmark as a sitewide home link, with a small Singapore flag beside it.
- Credit Tanveer Riaz as the hackathon creator with tanveerriaz.me, the exact tagline **Curious mind. Builder mode! 🇸🇬**, and the public GitHub repo.
- Landing facade window lights must be real windows lighting in the actual glass with continuous natural animation aligned to the frames, not synthetic overlay or canvas glows that miss the frames.
- Landing page and landing-story audio must use natural human voiceover, not robotic system TTS (e.g. macOS Samantha).
- Landing story film should use parallel split-screen action (two windows in the same block), not a stiff slideshow assembly.

## Learned Workspace Facts

- Public GitHub repository: https://github.com/tanveerriaz/87k-windows
- Creator site for attribution: https://tanveerriaz.me/
- Public app: https://87k-windows.up.railway.app/ (Railway project `052f7a55-c85f-45d7-8247-f635829b09d0`; see `docs/RAILWAY_DEPLOYMENT.md`).
