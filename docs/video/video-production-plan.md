# 87K Windows Film Implementation Plan

> **For the production editor:** Work through the tasks in order and stop at each review gate. Do not publish unreviewed generated footage.

**Goal:** Produce a 1:50 consent-first film showing lived experience becoming useful through a truthful, evidence-backed human connection.

**Architecture:** Build the film from three layers: generated fictional atmosphere, real application captures, and editorial typography. Lock a single photographic world across generated clips, prove every product claim with the actual app, and preserve model-role boundaries in narration and picture.

**Production stack:** 1920 x 1080 / 24 fps timeline, image-to-video generation, lossless or high-bitrate app screen capture, NLE compositing, separate narration and captions.

---

### Task 1: Lock narration and timing

1. Record the approved narration in `voiceover-alignment.md` at a calm, conversational pace.
2. Leave the marked breath spaces intact; do not speed up the consent or refusal sections.
3. Edit pauses before changing words. Any wording change must preserve Gemma, deterministic matching and Gemini role boundaries.
4. Export a dry WAV at 48 kHz / 24-bit and a caption transcript.
5. Review for a target duration of 108-110 seconds.

### Task 2: Capture the real product proof

1. Launch the real judging path with local Gemma and Gemini; do not use the deterministic provider.
2. Record Join Mode at a readable mobile aspect ratio and Wall Mode at 1280 x 720 or higher.
3. Capture the Queenstown/radio flow from question through participant approval, evidence-backed match and Gemini guide.
4. Capture the negative fixture separately and confirm the wall contains one witnessed light, no second light and no thread.
5. Capture a clean read-aloud interaction and the visible pause/stop reminder.
6. Reject any take with a mock provider label, personal data, a real photograph, notification, credential or browser chrome that reveals private information.

### Task 3: Generate the fictional atmosphere plates

1. Use the eight scene prompts in `assets/video/prompts/`.
2. Use reviewed fictional stills as image-to-video anchors wherever architectural continuity matters.
3. Disable generated speech and audio.
4. Generate the shortest useful take first: 5-8 seconds for an insert, 10-15 seconds only for a continuous building plate.
5. Record model, endpoint, prompt, generation time, source asset, output hash and review status in `assets/video/manifest.json`.
6. Reject clips with identifiable people, readable addresses, fake UI, warped architecture, extra lit windows or unrequested effects.

### Task 4: Assemble the emotional arc

1. Cut the object discovery on tactile details and warm room tone.
2. Move from individual objects to the wide dark façade at 0:18.
3. Introduce real Join Mode at 0:31; keep controls large enough to read.
4. Hold on participant approval before the first light appears.
5. At 0:58, intercut real evidence with the first light, then reveal the second light and connection pulse.
6. At 1:14, let Gemini's two optional questions remain readable for at least four seconds.
7. At 1:28, remove the second light and thread; keep the participant's light warm behind the real `NO MATCH YET` result.
8. End on the stable two-window façade, then add the title card in the edit—not inside generated footage.

### Task 5: Sound, typography and accessibility

1. Build one subtle sound world: distant evening ambience, low room tone, a soft electrical warmth and one quiet connection tone.
2. Keep music under narration and avoid sentimental piano cues, heartbeats or alarm sounds.
3. Add editorial text in soft bone with amber and moon-blue accents; do not ask a generator to render text.
4. Caption every spoken word and describe meaningful non-speech audio in the caption file.
5. Check captions, UI labels and evidence on a 13-inch laptop and at 1280 x 720.

### Task 6: Final truth and safety review

1. Confirm all people, stories and imagery are fictional or non-identifying.
2. Confirm local Gemma is credited only with capsule extraction.
3. Confirm deterministic matching is credited with match/refusal.
4. Confirm Gemini appears only after a valid match and prepares exactly two optional questions plus a pause/stop reminder.
5. Confirm no-match leaves one light on, creates no invitation and never invokes Gemini.
6. Confirm every product UI shot is a real capture and every generative clip has a manifest entry.
7. Export a review master, watch it once without sound for visual comprehension, once audio-only for narrative clarity, and once with captions.
