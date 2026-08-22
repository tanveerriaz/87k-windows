# Generated asset provenance

Nano Banana is a build-time art tool in 87K Windows, not part of the participant inference loop. This keeps the live story truthful and fast while giving the public demo a distinctive visual world.

The prompts in `assets/prompts/` generate only fictional, non-identifying imagery:

- a front-facing night-time Singapore housing façade texture;
- a small atlas of symbolic memory objects;
- a submission thumbnail showing two illuminated windows.

No personal photograph, real resident, address, name, logo or private memory may be supplied. Generated outputs belong in `assets/generated/` and must be visually reviewed before they are moved into `public/generated/` for use by the app. Record the model, prompt file, UTC time and output hash in `assets/manifest.json`.

Run with a server-side/developer shell key:

```bash
read -s "GEMINI_API_KEY?Gemini API key: "
export GEMINI_API_KEY
npm run assets:generate
unset GEMINI_API_KEY
```

The default image model is `gemini-3.1-flash-image`; override it with `NANO_BANANA_MODEL` only when the hackathon account exposes a different approved Nano Banana model. The generator never reads `.env` or writes a key.

Generated pixels are used as atmosphere. Window state, evidence lines and human connections remain code-rendered, so the demonstration never implies that an AI-generated scene is documentary evidence.
