#!/usr/bin/env python3
"""Creative overlays for the v2 parallel-action landing film."""
from PIL import Image, ImageDraw, ImageFont
import os

A = os.path.join(os.path.dirname(__file__), "..", "assets", "video", "landing", "overlays")
os.makedirs(A, exist_ok=True)

GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf"
GEORGIA_B = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
HELV = "/System/Library/Fonts/Helvetica.ttc"

CREAM = (232, 220, 200, 255)
MUTED = (184, 174, 156, 255)
FAINT = (138, 129, 114, 255)
AMBER = (217, 142, 74, 255)
WHITE = (245, 240, 230, 230)


def card(name, lines, size=(1920, 1080)):
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rendered, total_h = [], 0
    for text, fp, sz, color, gap in lines:
        f = ImageFont.truetype(fp, sz)
        box = d.textbbox((0, 0), text, font=f)
        w, h = box[2] - box[0], box[3] - box[1]
        rendered.append((text, f, w, h, color, gap, box[1]))
        total_h += h + gap
    y = (size[1] - total_h) // 2
    for text, f, w, h, color, gap, oy in rendered:
        d.text(((size[0] - w) // 2, y - oy), text, font=f, fill=color,
               stroke_width=2, stroke_fill=(0, 0, 0, 150))
        y += h + gap
    img.save(os.path.join(A, name))


def seam(name="seam-amber.png"):
    img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = 960
    for i, a in enumerate([40, 90, 160, 90, 40]):
        d.line([(x - 2 + i, 0), (x - 2 + i, 1080)], fill=(217, 142, 74, a), width=1)
    img.save(os.path.join(A, name))


def role_labels(name="roles.png"):
    img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(GEORGIA, 28)
    for text, cx in [("storyteller", 480), ("listener", 1440)]:
        box = d.textbbox((0, 0), text, font=f)
        w = box[2] - box[0]
        d.text((cx - w // 2, 48), text, font=f, fill=AMBER,
               stroke_width=2, stroke_fill=(0, 0, 0, 160))
    img.save(os.path.join(A, name))


def metres(name="metres.png"):
    card(name, [
        ("thirty metres apart", GEORGIA, 54, CREAM, 0),
    ])


def caption(name, text):
    img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(HELV, 34)

    def wrap(t, maxw=1500):
        words, lines, cur = t.split(), [], ""
        for w in words:
            trial = (cur + " " + w).strip()
            if d.textlength(trial, font=f) <= maxw:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    lines = wrap(text)
    lh = 46
    y = 1080 - 56 - lh * len(lines)
    for line in lines:
        w = d.textlength(line, font=f)
        d.text(((1920 - w) // 2, y), line, font=f, fill=WHITE,
               stroke_width=3, stroke_fill=(0, 0, 0, 200))
        y += lh
    img.save(os.path.join(A, name))


# Number cards
card("num-2015.png", [
    ("41,200", GEORGIA_B, 150, CREAM, 28),
    ("seniors living alone  ·  2015", GEORGIA, 40, MUTED, 0),
])
card("num-2025.png", [
    ("88,400", GEORGIA_B, 150, CREAM, 24),
    ("2025  ·  one in nine of all seniors", GEORGIA, 40, MUTED, 18),
    ("Source: MSF Family Trends Report 2026", GEORGIA, 26, FAINT, 0),
])
card("num-87k.png", [("87,000", GEORGIA_B, 170, AMBER, 0)])
card("title.png", [("87K WINDOWS", GEORGIA_B, 110, CREAM, 18),
                   ("one window for every senior living alone", GEORGIA, 36, MUTED, 0)])

seam()
role_labels()
metres()

# Captions aligned to natural VO (~62.5s) + picture holds
CUES = [
    (1, "In 2015, Singapore counted 41,200 seniors living alone."),
    (2, "Ten years later: 88,400. One in nine of every senior."),
    (3, "Somewhere in between, the number passed 87,000. Nobody marked the day."),
    (4, "Behind one window — a man who still knows how to fix what others throw away."),
    (5, "Behind another — someone new, holding something broken."),
    (6, "They live thirty metres apart. They will never meet."),
    (7, "Not because they don't want to — because nothing tells either of them the other exists."),
    (8, "So we built the missing sentence."),
    (9, "One person says: I have a story. Another says: I have time."),
    (10, "The teller approves every word that leaves the room."),
    (11, "And when the fit is real — two windows light."),
    (12, "This is 87K Windows. One window for every senior who lives alone."),
    (13, "The count is still rising. The windows don't have to stay dark."),
    (14, "So — which are you? Someone with a story? Or someone with time to listen?"),
]
for idx, text in CUES:
    caption(f"cap-{idx:02d}.png", text)

# Timing file: idx start end (picture timeline, VO delayed 0.6s at head)
# Visual timeline ~75s: act1 0-16, act2 16-46, silence 46-50, act3 50-64, act4 64-75
TIMING = """1 0.6 5.8
2 6.0 11.5
3 11.8 15.8
4 16.5 24.0
5 24.2 31.5
6 31.8 38.5
7 38.8 45.5
8 45.8 50.0
9 50.2 55.5
10 55.8 60.0
11 60.2 64.5
12 64.8 69.0
13 69.2 75.5
14 75.8 82.5
"""
open(os.path.join(A, "captions-timing-v2.txt"), "w").write(TIMING)
print("overlays ready in", A)
