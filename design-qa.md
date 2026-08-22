# Design QA

## Selected HDB artwork landing pass

### Comparison target

- Source visual truth: `assets/generated/submission-thumbnail.jpg`
- Source pixels: 1376 x 768, landscape
- Rendered implementation: `docs/images/landing-selected-artwork.jpg`
- Implementation pixels and CSS viewport: 1280 x 720 at device scale 1 after capture normalization
- State: landing page, default state, selected artwork loaded
- Density normalization: the in-app browser reported a 1280 x 720 CSS viewport at device pixel ratio 2 but returned a half-scale page inside a 1280 x 720 raster. The visible 640 x 360 page region was cropped and resampled to 1280 x 720. DOM measurements independently confirmed 1280 x 720 with no horizontal or vertical overflow.

### Full-view comparison

The selected image remains undistorted at 16:9 and retains the two warm windows, thin blue connection and dark Singapore housing façade. The landing page uses the artwork as the dominant visual counterweight to the product statement rather than turning it into decorative wallpaper. The heritage-teal surface, warm amber thesis and brick-red action inherit the image's restrained night palette.

The source and rendered implementation were opened together in one combined comparison during QA. The source establishes the metaphor; the implementation adds only the product promise, one action and the three-step explanation needed to understand the demo.

### Focused region comparison

- Artwork: full subject, glowing windows and connection line remain visible without cropping or stretching.
- Message and action: the two-line promise is the strongest type after the title, while `Start the demo` remains the sole primary action.
- Responsive state: at 390 x 844 the statement, 53 px primary action and top of the artwork are visible in sequence with no horizontal overflow.

### Required fidelity surfaces

- Fonts and typography: Georgia provides the humane editorial voice; Arial keeps the explanation and controls plain. Hierarchy and wrapping are intentional at desktop and phone sizes.
- Spacing and layout rhythm: the 1280 x 720 landing view has no scrollbars; the image, proof rail and hero occupy distinct regions. Mobile stacks the same regions without clipping.
- Colors and visual tokens: heritage teal, amber, cream and brick red echo the selected night artwork without adding a new token family.
- Image quality and asset fidelity: the original generated JPEG is used directly, at its natural aspect ratio, with a short fictional-artwork label. No placeholder, CSS drawing or duplicate asset was introduced.
- Copy and content: the page explains the human outcome before infrastructure, names Gemma once, and offers one clear next action.

### Comparison history

#### Pass 1 — blocked

- P2: the first desktop capture extended 52 px beyond the 720 px viewport, weakening the single-screen opening.
- Fix: tightened the hero type scale, margins and vertical padding without shrinking the primary message or action.

#### Pass 2 — passed

- The revised 1280 x 720 DOM measures exactly 1280 x 720 with no overflow.
- The artwork is loaded, the primary action navigates to Join Mode, and the phone layout keeps a 53 px target with no horizontal overflow.
- Browser console errors: none.

#### Pass 3 — passed

- Raised both lines of the mobile artwork caption and the three proof sentences to 18 px after independent review flagged them as too small.
- Rechecked at 390 x 844: all mobile body copy computes to at least 18 px, the primary action is 53 px tall and horizontal overflow remains absent.

### Result

No actionable P0, P1 or P2 findings remain for the selected-artwork landing pass.

## Comparison target

- Source visual truth: `assets/generated/queenstown-story-block.jpg`
- Source pixels: 1264 x 848, 3:2 landscape
- Rendered implementation: `docs/images/real-gemma-wall-result.jpg`
- Implementation pixels and CSS viewport: 1280 x 720 at device scale 1
- State: matched Queenstown radio story using the real hosted `gemma-api` provider
- Density normalization: both images were contained in equal 1000 x 700 regions for the combined visual comparison; no crop was used

## Full-view comparison

The implementation preserves the source hierarchy: dark heritage-teal masthead, oversized editorial result, four-step journey, two memory surfaces, a central evidence bridge and a narrow result panel. The layout stays fully visible at 1280 x 720 with no horizontal overflow.

The generated source is a richer exhibition-poster illustration. The implementation deliberately uses a quieter Canvas façade and semantic content surfaces so the wall remains live, readable and maintainable rather than becoming a rasterised mockup.

## Focused region comparison

- Headline and journey: serif scale, teal/brick/cream palette and four beats now match the source intent.
- Memory and listener: the wall shows the active pair's safe summaries and labels the prepared listener as fictional, so it never adds unsupported details or implies a real acceptance.
- Evidence: Queenstown, 1970s, radio repair and teach-to-learn are equally weighted and readable from projector distance.
- Result panel: the positive human outcome and consent boundary are visible without a score or hidden reasoning.

## Required fidelity surfaces

- Fonts and typography: Georgia supplies the editorial display voice; Arial supplies body, labels and controls. The two-family limit is preserved, wrapping is intentional and no important text truncates.
- Spacing and layout rhythm: the main/result split, card grid and journey rail fit the 1280 x 720 wall. Mobile Join Mode has no horizontal overflow and uses at least 18 px body text and 48 px controls.
- Colors and visual tokens: cream paper, heritage teal, brick red, amber and mint map consistently across React and Canvas with readable contrast.
- Image quality and asset fidelity: the source concept and real implementation capture are sharp at their native sizes. Generated imagery remains presentation/reference material; live evidence is code-rendered and never presented as documentary proof.
- Copy and content: the outcome is human and explicit, Gemma's role is visible, the positive and no-match states cannot be confused, and the optional photo is clearly browser-only.
- Accessibility and behavior: semantic headings, labelled regions, keyboard controls, focus styles and reduced-motion handling remain in place.

## Comparison history

### Pass 1 — blocked

- P1: the wall read like a system report because it omitted the four human journey beats.
- P1: the two wall cards repeated long model summaries, weakening projector readability.
- Fix: added You shared, Gemma noticed, You approved and A story matched; kept the active pair's evidence-backed summaries visible.

### Pass 2 — passed

- The corrected 1280 x 720 capture shows the full journey and all evidence without overflow.
- The real hosted Gemma flow produced the positive match in both presenter injection and participant approval paths.
- The real hosted no-match fixture displayed `NO MATCH YET`, `Still listening` and no invitation.
- Browser console errors: none.

### Pass 3 — passed

- Replaced simulated acceptance language with `A story matched` and a clearly labelled prepared fictional interest.
- Bound both result cards to explicit active source/candidate IDs and removed hard-coded details from Wall Mode.
- Raised remaining mobile review body copy to at least 18 px.
- Re-captured the final wall at 1280 x 720 through real hosted Gemma; all revised truthfulness copy fits without overflow.

## Follow-up polish

- P3: the generated concept has more paper grain, tropical illustration and a woven red thread. These are optional presentation refinements; reproducing them now would add decorative asset and layout complexity without improving the judged explanation.

## Final result

final result: passed
---

## Two Chairs mobile reframe

### Comparison target

- Source visual truth: `docs/images/two-chairs-reference.png`
- Source pixels: 853 x 1844; normalized to 390 x 843 for comparison
- Rendered implementation: `docs/images/two-chairs-mobile-final.png`
- Implementation pixels and CSS viewport: 390 x 1136 full-page capture at a 390 x 844 viewport and device scale 1
- Combined comparison: `docs/images/two-chairs-comparison-final.png`
- State: mobile landing, default state, fully loaded
- Density normalization: both source and implementation use equal 390 px columns; black padding appears only below the shorter normalized source

### Full-view comparison

The final implementation preserves the selected direction's hierarchy and emotional thesis: dark HDB context, a large ivory question, a real Two Chairs image with one warm lamp, two cobalt human-role actions, and an explicit two-yes privacy promise. The working product replaces the concept image's date footer with accurate model provenance and a living-wall link.

### Focused region comparison

A separate crop was unnecessary because the title wrapping, hero subjects, action labels, supporting copy, borders and assurance text remain readable at 390 px in the combined comparison.

### Required fidelity surfaces

- Fonts and typography: display serif hierarchy, sans-serif body, uppercase mono labels, readable 18 px body copy and a three-line mobile title match the source intent.
- Spacing and layout rhythm: the final sequence is question, Two Chairs image, explanation, two role actions and consent promise. Touch targets exceed 48 px and no horizontal overflow is present.
- Colors and visual tokens: carbon and ivory foundation, amber lamp, cobalt role actions and restrained blue secondary text match the selected direction with accessible contrast.
- Image quality and asset fidelity: the hero is a dedicated text-free raster generated for the selected direction, not CSS or placeholder art. It is sharp at the target viewport and cropped around both chairs and the lamp.
- Copy and content: the two role labels and safety contract are preserved. The implementation adds accurate Gemma and Gemini role copy and removes the concept image's date and option label.

### Comparison history

#### Iteration 1 — blocked

- P1: the implementation placed the chairs before the question, reversing the selected narrative hierarchy.
- P2: role actions were thin outline rows rather than visually dominant cobalt choices.
- P2: the privacy promise was visually weak and longer than the selected source.
- Fix: reordered the mobile composition, strengthened the title, changed the actions to filled controls and restored the concise contact/two-yes promise.

#### Iteration 2 — blocked

- P2: the full-page façade continued behind every section and reduced the dark-room focus.
- P2: fake text glyphs were used as action icons.
- Fix: limited the HDB photograph to the opening context, removed fake glyphs and kept the dedicated raster hero as the primary image.

#### Final iteration — passed

- No actionable P0, P1 or P2 visual differences remain.
- Browser console warnings/errors: none.
- Storyteller and listener routes opened from their respective actions.
- Real hosted-Gemma extraction completed for both participants.
- Real Gemini 3.6 Flash facilitation returned two structured, senior-friendly questions after minimal-thinking configuration was applied.
- The first yes remained waiting; the second yes opened Mutual Yes.
- No contact details were shown or exchanged.

### Follow-up polish

- P3: a future icon-library pass could add a chair and listening-ear icon if it preserves the current label width and accessibility.
- P3: desktop could enlarge the wordmark to echo the concept poster more strongly without changing mobile hierarchy.

final result: passed
