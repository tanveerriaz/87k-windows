# Design QA

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
