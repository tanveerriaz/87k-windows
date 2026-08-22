# OpenRouter Recovery Design

## Decision

Use a dedicated server-side OpenRouter adapter for both model roles in the Cloud Run review path:

- `google/gemma-3-27b-it` prepares the privacy-safe capsule.
- A configurable Google Gemini model prepares the senior conversation guide only after a grounded match.
- MiniSearch and the deterministic evidence scorer continue to decide `MATCH` or `NO MATCH YET`.

The participant journey, approval boundary, room state and Canvas wall remain unchanged. Raw memory is redacted before it reaches OpenRouter, and only approved safe capsule fields reach the Gemini guide.

## Alternatives considered

1. Raise the Gemini Developer API billing cap. This is the smallest operational fix, but the cap is controlled outside the application and remains a single-provider failure point.
2. Repoint `@google/genai` at OpenRouter. Rejected because OpenRouter exposes an OpenAI-compatible chat-completions protocol, not Google's `generateContent` paths.
3. Add a dedicated OpenRouter adapter. Selected because it is explicit, testable, keeps real Gemma in the judging story and leaves the existing Gemini API and local Ollama paths intact.

## Configuration

The server accepts:

- `INFERENCE_PROVIDER=openrouter`
- `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- `OPENROUTER_API_KEY` from Cloud Secret Manager
- `OPENROUTER_GEMMA_MODEL=google/gemma-3-27b-it`
- `GEMINI_FACILITATOR=openrouter`
- `OPENROUTER_GEMINI_MODEL` for the configured Gemini route

No OpenRouter setting uses the `VITE_` prefix. The browser receives provider/model names only through the existing health and room-status surfaces; it never receives the key.

## Request and validation flow

The adapter posts to `/chat/completions` with a single user message, `response_format.type=json_schema`, strict schemas, and `provider.require_parameters=true`. It reads `choices[0].message.content`, validates with Zod, and preserves the hosted provider's one-repair-attempt behavior. Timeouts, invalid output and upstream errors map to the existing safe failure types, so nothing is shared on failure.

## Verification

Tests cover redaction, strict structured-output requests, one repair attempt, timeout/error mapping, safe facilitator inputs, environment validation and honest provider labels. The final check runs lint, typecheck, unit/integration tests, production build, two-tab E2E, a direct Cloud Run extraction, the radio match and the deliberate no-match fixture.
