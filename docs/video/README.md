# 87K Windows video production package

This folder translates the approved 1:50 story into a production-ready film plan. The emotional arc is:

```text
memory -> value -> consent -> usefulness -> connection
```

The film is warm, contemporary and useful rather than elegiac. Older people are shown as holders of knowledge, skill and joy. AI is visible only in its bounded roles: local Gemma prepares a reviewable safe capsule; deterministic code decides `MATCH` or `NO MATCH YET`; Gemini prepares two optional conversation questions only after a grounded match. People create the relationship.

## Deliverables

- `timed-storyboard.md`: the approved 1:50 structure and visual beats.
- `shot-list.md`: recordable and generative shots, framing, duration and editorial use.
- `voiceover-alignment.md`: final narration with breath points and picture cues.
- `continuity-rules.md`: visual, ethical, model-role and animation constraints.
- `video-production-plan.md`: production and review sequence.
- `../../assets/video/prompts/`: one generation brief per story scene.
- `../../assets/video/manifest.json`: render provenance and review status.
- `../../output/video/87k-windows-submission-final.mp4`: submission-ready 1:50 H.264/AAC film.
- `../../assets/video/audio/voiceover-natural.provenance.md`: natural narration provenance and settings.
- `../../assets/video/generated/seedance/`: the two reviewed Seedance atmosphere plates used in the film.

## Production rule

Generated footage provides atmosphere and transitions. Product claims are proved with real recordings of the running application. Never generate fake Join, Wall or Admin interfaces, model labels, evidence, consent controls, guide copy or `NO MATCH YET` results.

## Master format

- 1920 x 1080, 16:9, 24 fps, Rec.709, progressive.
- Exactly 1:50. The final uses a meaning-preserving narration delivered by MiniMax Speech-02 HD, with a deliberate end-card hold.
- Narration is primary. Generated clips have no dialogue and should be delivered without native audio.
- Captions are burned in for review and also exported as an `.srt` in final editorial.
- Keep essential text within the centre 80% title-safe area.

## Final generation track

Two fictional, non-identifying atmosphere plates were generated with Seedance through fal.ai: the opening memory objects and the dark HDB exterior. The product sequence itself uses current 1920 × 1080 captures from the photographic carbon/concrete/amber design. The match is always represented by two stable amber windows and a fine blue thread; `NO MATCH YET` uses one amber window and no thread.

The reviewed final is `output/video/87k-windows-submission-final.mp4`. Its ten-frame audit covers the opening, Join Mode, consent review, matched state, senior guide, honest refusal and end card. Source hashes and generation request IDs are recorded in `assets/video/manifest.json`.
