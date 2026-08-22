# Photographic Windows Experience Design

## Goal

Make the real-looking Singapore housing block the emotional centre of 87K Windows. Window light—not fabricated façade geometry—communicates whether an approved story has found a grounded connection.

## Art direction

Generate one original, fictional and non-identifying night-time public-housing façade. It should read as architectural photography: frontal concrete structure, humid atmosphere, deep carbon shadows, warm lived-in light and restrained moon-blue reflections. It must contain no identifiable residents, address, logo or readable sign.

The application uses a carbon, weathered-concrete, amber, moon-blue and soft-bone palette. It removes heritage teal as the dominant visual field and avoids decorative SVG scenes. Landing, Join, Wall and Admin Mode share crops and tones from the same photographic world, while controls remain on opaque high-contrast surfaces.

## Light choreography

The same building remains visible across room states:

- **Idle:** the façade is quiet and mostly dark.
- **Approved and matching:** the participant's mapped window warms on and breathes gently while evidence is checked.
- **Matched:** a second mapped window illuminates, then a fine blue-white thread travels between the two windows.
- **No match:** the participant's window remains softly illuminated because the story was witnessed; no second light or thread appears.

Reduced-motion mode skips pulsing and traveling transitions and presents the stable final state immediately.

## Rendering architecture

Keep one Canvas for Wall Mode. It draws the photographic master asset first and then renders light masks, glow, the searching pulse and the connection thread at normalized window coordinates. It does not create a DOM element per window. Canvas sizing remains responsive and limited to a device-pixel ratio of two.

The Socket.IO snapshot remains the source of truth. Existing idle, matching, matched and no-match phases map directly to visual scenes; matching rules, consent boundaries, schemas and events do not change. Accessible DOM copy describes every outcome independently of the decorative Canvas.

The other modes reuse deliberate raster crops as atmosphere rather than adding new room state. Landing provides the cinematic premise, Join retains large senior-friendly controls and consent surfaces, and Admin keeps operational information legible over a restrained photographic shell.

## Information hierarchy

Wall Mode keeps the building unobscured. Idle and matching copy uses small cinematic captions. A match introduces restrained lower-third evidence and a narrow guide surface instead of covering the whole façade. No-match copy is calm and explicit rather than punitive.

The positive outcome continues to show approved source and prepared fictional interest, shared evidence, the Gemini guide and the reminder that people choose whether to talk. Provider status stays visible but unobtrusive.

## Failure and safety behavior

- Artwork load failure falls back to a dark, high-contrast scene while all text and controls remain usable.
- Camera denial, invalid model output and provider timeout keep their existing recoverable behavior.
- A timeout or invalid model output never creates a second light.
- Weak evidence remains `NO MATCH YET`; the application never adds a decorative connection.
- No raw memories, uploads, personal photographs or identifying imagery enter generated assets or room state.

## Generated-asset provenance

Store the approved fictional façade under `assets/generated/`, keep its prompt under `assets/prompts/`, and add its model, generation time and SHA-256 hash to `assets/manifest.json`. Move or import only the visually reviewed asset into the application. Generated pixels provide atmosphere; code-rendered light and evidence continue to express live state.

## Verification

Use test-driven implementation. Verify:

- the Queenstown/radio fixture produces two lit windows and a connecting thread;
- the negative fixture leaves one witnessed window lit with no thread;
- reduced motion produces stable lighting without continuous animation;
- Wall Mode remains legible at 1280 by 720;
- Join Mode remains usable at 390 by 844 and 320 by 568;
- Landing, Join, Wall and Admin share the new photographic visual system without obscuring controls;
- lint, typecheck, unit/integration tests, build and the two-tab Playwright flow all pass.
