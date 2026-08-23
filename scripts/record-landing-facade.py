#!/usr/bin/env python3
"""Bake a dark façade base plus transparent window-light overlays.

Landing stacks these images. CSS fades overlay opacity, so lights stay locked
to the same pixels as the photograph (no runtime canvas mapping).

Uses the Wall Mode hero bays, plus the floor above/below in those two columns.
Cover-center crop matches the landing strip.

  python3 scripts/record-landing-facade.py
"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
FACADE = ROOT / "assets/generated/photographic-hdb-wall.png"
OUT_DIR = ROOT / "public/assets"

# Measured Wall Mode bays, then one floor up/down in the same columns.
FLOOR_PITCH = 0.098
WINDOWS = [
    ("27-up", 0.356, 0.386 - FLOOR_PITCH, 0.047, 0.056),
    ("27", 0.356, 0.386, 0.047, 0.056),
    ("27-down", 0.356, 0.386 + FLOOR_PITCH, 0.047, 0.056),
    ("64-up", 0.648, 0.386 - FLOOR_PITCH, 0.047, 0.056),
    ("64", 0.648, 0.386, 0.047, 0.056),
    ("64-down", 0.648, 0.386 + FLOOR_PITCH, 0.047, 0.056),
]

BAND_W, BAND_H = 1600, 432


def cover_center(image: Image.Image, width: int, height: int):
    scale = max(width / image.width, height / image.height)
    placed = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    left = (placed.width - width) // 2
    top = (placed.height - height) // 2
    return placed.crop((left, top, left + width, top + height)), placed.width, placed.height, left, top


def paint_window(draw: ImageDraw.ImageDraw, x: float, y: float, w: float, h: float) -> None:
    inset_x, inset_y = w * 0.12, h * 0.10
    box = [x + inset_x, y + inset_y, x + w - inset_x, y + h - inset_y]
    draw.rectangle(box, fill=(255, 215, 154, 180))
    mullion_x = x + w * 0.49
    draw.rectangle(
        [mullion_x, y + inset_y, mullion_x + max(1, w * 0.025), y + h - inset_y],
        fill=(51, 27, 15, 120),
    )
    draw.rectangle(
        [x + w * 0.22, y + h * 0.16, x + w * 0.78, y + h * 0.22],
        fill=(255, 245, 220, 80),
    )


def window_overlay(size: tuple[int, int], placed_w: int, placed_h: int, crop_x: int, crop_y: int, rect) -> Image.Image:
    _name, nx, ny, nw, nh = rect
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    x = nx * placed_w - crop_x
    y = ny * placed_h - crop_y
    w = nw * placed_w
    h = nh * placed_h
    if y + h < 0 or y > size[1] or x + w < 0 or x > size[0]:
        return layer
    paint_window(draw, x, y, w, h)
    glow = layer.filter(ImageFilter.GaussianBlur(radius=3.2))
    return Image.alpha_composite(glow, layer)


def bottom_wash(size: tuple[int, int]) -> Image.Image:
    wash = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(wash)
    height = size[1]
    for yy in range(int(height * 0.72), height):
        fade = ((yy - height * 0.72) / (height * 0.28)) ** 2
        draw.line([(0, yy), (size[0], yy)], fill=(16, 17, 22, int(200 * fade)))
    return wash


def main() -> None:
    os.chdir(ROOT)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    facade = Image.open(FACADE).convert("RGBA")
    band, placed_w, placed_h, crop_x, crop_y = cover_center(facade, BAND_W, BAND_H)
    wash = bottom_wash(band.size)
    base = Image.alpha_composite(band, wash).convert("RGB")
    still = OUT_DIR / "landing-facade-still.jpg"
    base.save(still, quality=86, optimize=True)
    print(f"wrote {still} ({still.stat().st_size} bytes)")

    for index, rect in enumerate(WINDOWS, start=1):
        overlay = window_overlay(band.size, placed_w, placed_h, crop_x, crop_y, rect)
        path = OUT_DIR / f"landing-facade-light-{index}.webp"
        overlay.save(path, "WEBP", lossless=True, method=4)
        print(f"wrote {path} ({path.stat().st_size} bytes)  {rect[0]}")


if __name__ == "__main__":
    main()
