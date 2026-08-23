# "87K" — landing-page story film (parallel action, ~1:15)

Purpose: a landing-page story that explains **why the product is named 87K Windows** and
resolves into the landing page's real choice — storyteller or listener. This is not the
submission film; the submission film remains `../../output/video/87k-windows-submission-final.mp4`.

## Creative spine (v2 — low budget, high craft)

**One metaphor:** two windows in the same block, thirty metres apart, holding the same
broken thing (a radio) for opposite reasons — one person can fix it; one person needs it
fixed. The product is the missing sentence that lets them find each other.

**Budget rules:** reuse existing approved motion (dark façade, Heng ×3, Mei drawer);
regenerate only the two missing Mei motion beats; natural Minimax VO (not macOS `say`);
all typography/counter/seam craft is local ffmpeg + PIL. No paid music regen — keep
Kevin MacLeod "Wholesome" (CC BY 4.0).

## Continuity rules

- **Human faces are shown.** Both characters are fictional, AI-generated people. Every
  generated shot is recorded in `../../assets/video/manifest.json` as synthetic.
- Product claims use only real UI captures. No generated interfaces.
- Background music: open-license; license + source URL in the manifest.
- Narration: Minimax Speech (Wise_Woman / warm documentary) via Genspark → fal route.

## Characters (fictional)

- **Uncle Heng** — Singaporean Chinese man, mid-70s, silver hair, short-sleeved shirt.
  Repaired radios in Queenstown in the 1970s. Warm, precise hands. Dignified, never frail.
- **Mei** — Singaporean Chinese woman, late 20s, casual tee, hair tied back. Just moved in.
  Curious, a little unmoored.

## Act 1 — The count (0:00–0:18) · single frame

| Time | Picture | Narration | On-screen |
| --- | --- | --- | --- |
| 0:00–0:06 | Dark HDB façade, blue hour. One warm window. | "In 2015, Singapore counted forty-one thousand two hundred seniors living alone." | `41,200 · 2015` |
| 0:06–0:13 | Slow push; counter climbs across the dark windows. | "Ten years later: eighty-eight thousand four hundred. One in nine of every senior." | climbing counter → `88,400` · MSF source |
| 0:13–0:18 | Counter settles on amber. Hold. | "Somewhere in between, the number passed eighty-seven thousand. Nobody marked the day." | `87,000` |

## Act 2 — Two lives, one block (0:18–0:46) · true split screen

Vertical seam with a soft amber hairline. Brief labels fade: LEFT *storyteller* / RIGHT *listener*.

| Time | LEFT — Heng | RIGHT — Mei | Narration |
| --- | --- | --- | --- |
| 0:18–0:26 | Evening flat. Shelf, radio, kopi. Face visible. | Daylight, moving boxes. Drawer opens on a silent inherited radio. | "Behind one window — a man who still knows how to fix what others throw away." |
| 0:26–0:34 | Hands tune; radio sings; small smile. | She turns the dead radio over; looks toward the window. | "Behind another — someone new, holding something broken." |
| 0:34–0:42 | At his window, looking out (mirrored). | At her window, looking out (mirrored). | "They live thirty metres apart. They will never meet. Not because they don't want to — because nothing tells either of them the other exists." |
| 0:42–0:46 | Exterior: two dark windows side by side. Silence. | *(hold)* | *(silence)* |

## Act 3 — The missing sentence (0:46–1:02)

| Time | Picture | Narration |
| --- | --- | --- |
| 0:46–0:52 | Split: real Join **"I have a story to tell"** \| **"I would like to listen"** | "So we built the missing sentence. One person says: I have a story. Another says: I have time." |
| 0:52–0:57 | Split: consent capsule \| listener-safe view | "The teller approves every word that leaves the room." |
| 0:57–1:02 | **Seam dissolves** into Wall Mode: two windows warm; blue thread. | "And when the fit is real — two windows light." |

## Act 4 — Reveal, then the question (1:02–1:15)

| Time | Picture | Narration | On-screen |
| --- | --- | --- | --- |
| 1:02–1:08 | Pull back: façade with a scatter of warm windows. | "This is Eighty-Seven K Windows. One window for every senior who lives alone. The count is still rising. The windows don't have to stay dark." | `87K WINDOWS` |
| 1:08–1:15 | End card = landing choice cards. | "So — which are you? Someone with a story? Or someone with time to listen?" | real UI copy |

## Statistics and sources (verified 2026-08-23)

- **41,200** (2015) and **88,400** (2025) — MSF Family Trends Report 2026:
  <https://www.asiaone.com/lifestyle/family-trends-report-2026-elderly-living-alone>
- Count crossed ~87,000 around 2024 (SingStat living-arrangement series).

## Delivery

- 1920×1080 master + 1280×720 web encode ≤ ~8 MB, poster, burned captions + `.srt`.
- Embedded on `/` above the role-choice cards.
