# Product

## The problem

Loneliness is often framed as a lack of people. The harder problem is that a lifetime of useful stories, places and skills is invisible to the people nearby. Conventional chatbots answer the older person; 87K Windows uses AI to create a reason for two real people to meet.

The title imagines roughly 87,000 windows across Singapore. Each lit window is not a metric. It is a small, consented piece of lived experience becoming visible.

## The promise

```text
ASK          PROTECT          CONSENT          MATCH           BEGIN
voice or  →  local Gemma  →   participant  →   evidence  →    Gemini guide
text          safe capsule     approval         or refusal     read aloud
```

The demo begins with a clearly fictional memory about repairing radios in Queenstown in the 1970s. Gemma extracts a privacy-safe capsule for review. Approval lights a window and finds a fictional complementary story. After a strong connection, Gemini prepares two senior-friendly questions and a pause/stop reminder; weak evidence produces `NO MATCH YET` without calling Gemini.

## Why Gemini is essential

The product is built for **Best Elderly Hack — Silver AI: Designing Gemini for Seniors**. Gemini 3.6 Flash turns approved context into a short conversation bridge with plain language, exactly two optional questions and a consent reminder. The guide stays visible and can be read aloud at a slower rate. Gemini facilitates a human-to-human beginning; it does not act as the participant's companion.

Gemini's role starts only after deterministic code has found a strong evidence-backed match. It never sees raw memories, photos, identifiers or no-match submissions, and it cannot alter confidence or manufacture a connection.

## Why Gemma is essential

Gemma handles the ambiguity that rules cannot: a short, conversational memory may contain place, era, a practical skill, something the person can offer and something they miss. It turns this into a strict, reviewable structure without inventing contact details or exposing hidden reasoning.

Because Gemma is open, that interpretation can run on a community-centre Mac through Ollama. Raw-memory extraction stays available as an offline partial recovery; the complete Track 2 demo adds server-side Gemini facilitation. Hosted Gemma is the separate public-review extraction path. Phones use a trusted private hotspot because the prototype's local HTTP transport is not encrypted.

The application then uses deterministic retrieval and scoring. This division is intentional:

- Gemma understands human language.
- The participant controls consent.
- Transparent code controls matching and refusal.
- Gemini adapts a voice-accessible, consent-first beginning.
- The wall makes collective belonging visible.

## Experience and safety principles

- AI facilitates human connection; it never imitates friendship or dependency.
- Consent is a full product step, not fine print.
- Show short evidence and uncertainty, never chain-of-thought.
- The participant may edit or stop before anything reaches the wall.
- Weak evidence is an honest no-match, not a forced emotional result.
- Phone controls are large, plain and high contrast.
- The wall reveals a theme and connection, not raw private testimony.
- Public code and the judged demo use fictional data only.

## Scope

The hackathon build includes mobile Join Mode, projected Wall Mode, presenter Admin Mode, local `gemma3:4b` through Ollama, `gemini-3.6-flash` for senior facilitation, hosted Gemma 4 for online review, Cloud Run packaging, twelve fictional stories and a deliberate no-match fixture. Deterministic providers exist only as automated-test harnesses and are never used during judging.

It deliberately excludes native mobile installation, medical or welfare advice, authentication, permanent storage, contact exchange, social scoring and autonomous outreach. A production pilot would require community-partner moderation, retention controls, accessibility research and explicit safeguarding—not merely more model capability.
