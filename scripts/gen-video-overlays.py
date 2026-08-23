#!/usr/bin/env python3
"""Render transparent text overlays for the landing story film (ffmpeg build lacks drawtext)."""
from PIL import Image, ImageDraw, ImageFont
import os, re

A = os.path.join(os.path.dirname(__file__), "..", "assets", "video", "landing", "overlays")
os.makedirs(A, exist_ok=True)

GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf"
GEORGIA_B = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
HELV = "/System/Library/Fonts/Helvetica.ttc"

CREAM = (232, 220, 200, 255)
MUTED = (184, 174, 156, 255)
FAINT = (138, 129, 114, 255)
AMBER = (217, 142, 74, 255)

def card(name, lines):
    """lines: list of (text, font_path, size, color, extra_gap)"""
    img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rendered = []
    total_h = 0
    for text, fp, size, color, gap in lines:
        f = ImageFont.truetype(fp, size)
        box = d.textbbox((0, 0), text, font=f)
        w, h = box[2] - box[0], box[3] - box[1]
        rendered.append((text, f, w, h, color, gap, box[1]))
        total_h += h + gap
    y = (1080 - total_h) // 2
    for text, f, w, h, color, gap, oy in rendered:
        d.text(((1920 - w) // 2, y - oy), text, font=f, fill=color,
               stroke_width=2, stroke_fill=(0, 0, 0, 140))
        y += h + gap
    img.save(os.path.join(A, name))

card("num-2015.png", [
    ("41,200", GEORGIA_B, 150, CREAM, 34),
    ("seniors living alone · 2015", GEORGIA, 42, MUTED, 0),
])
card("num-2025.png", [
    ("88,400", GEORGIA_B, 150, CREAM, 30),
    ("2025 · one in nine of all seniors", GEORGIA, 42, MUTED, 22),
    ("Source: MSF Family Trends Report 2026", GEORGIA, 26, FAINT, 0),
])
card("num-87k.png", [("87,000", GEORGIA_B, 170, AMBER, 0)])
card("title.png", [("87K WINDOWS", GEORGIA_B, 110, CREAM, 0)])

# Captions: parse the SRT, render one bottom-anchored PNG per cue.
srt = open(os.path.join(A, "..", "captions.srt")).read()
cues = re.findall(r"(\d+)\n(\d\d:\d\d:\d\d,\d\d\d) --> (\d\d:\d\d:\d\d,\d\d\d)\n(.+?)(?:\n\n|\n?$)", srt, re.S)
font = ImageFont.truetype(HELV, 34)

def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= maxw:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

timings = []
for idx, start, end, text in cues:
    text = " ".join(text.split())
    img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    lines = wrap(d, text, font, 1400)
    lh = 46
    y = 1080 - 52 - lh * len(lines)
    for line in lines:
        w = d.textlength(line, font=font)
        d.text(((1920 - w) // 2, y), line, font=font, fill=(240, 236, 224, 235),
               stroke_width=3, stroke_fill=(0, 0, 0, 200))
        y += lh
    img.save(os.path.join(A, f"cap-{int(idx):02d}.png"))
    def s(ts):
        h, m, rest = ts.split(":"); sec, ms = rest.split(",")
        return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
    timings.append((int(idx), s(start), s(end)))

with open(os.path.join(A, "captions-timing.txt"), "w") as f:
    for idx, start, end in timings:
        f.write(f"{idx} {start} {end}\n")
print(f"rendered {4 + len(timings)} overlays")
