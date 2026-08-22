# Gemini Senior Bridge Design

## Decision

87K Windows uses both model families for different, visible jobs. Local open Gemma converts raw spoken or typed memories into evidence-grounded capsules for participant review. After approval, deterministic code decides `MATCH` or `NO MATCH YET`. Only for a valid match, Gemini 3.6 Flash receives the approved safe capsule, the fictional candidate capsule, and the visible evidence path to create a short senior-friendly conversation guide.

## Safety boundary

Gemini never receives raw memory text, images, contact details, or unmatched submissions. It cannot select a person, change match confidence, override `NO MATCH YET`, or claim that the fictional candidate accepted. Its structured output contains a short welcome, two gentle questions, and a consent reminder. Invalid output or timeout produces an explicit unavailable state; it does not create an invented fallback.

## Experience

The matched Join result labels the guide `GEMINI · SENIOR CONNECTION GUIDE`. Large controls let the participant read it aloud slowly or stop playback using browser speech synthesis. Text remains visible and usable if speech synthesis is unavailable. Admin and status surfaces identify whether real Gemini, the deterministic test facilitator, or no facilitator is active.

## Runtime

`npm run demo:judge` runs local `gemma3:4b` for capsule extraction and server-side `gemini-3.6-flash` for the senior bridge. It requires Ollama, the local model, a trusted private hotspot, and `GEMINI_API_KEY`. `demo:local` remains an offline Gemma-only recovery path; `demo:gemma` uses hosted Gemma plus Gemini for online reviewers. Secrets remain server-side.

## Verification

Unit tests cover Gemini prompts, structured validation, timeout/failure, and the rule that no-match never calls Gemini. E2E covers the labelled bridge and read-aloud control alongside the existing two-tab match and no-match flow. Full lint, typecheck, test, build, E2E, and machine checks remain required.
