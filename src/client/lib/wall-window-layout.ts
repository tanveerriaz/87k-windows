export type WindowRect = { x: number; y: number; width: number; height: number };
export type ImageSize = { naturalWidth: number; naturalHeight: number };
export type ImagePlacement = { x: number; y: number; width: number; height: number };

// Coordinates are normalized to the reviewed generated façade, not the viewport.
// Hero bays were measured against the dark glass openings in photographic-hdb-wall.png.
const HERO_WINDOWS = new Map<number, WindowRect>([
  [27, { x: 0.356, y: 0.393, width: 0.036, height: 0.05 }],
  [64, { x: 0.654, y: 0.39, width: 0.046, height: 0.048 }],
]);

function fallbackWindow(id: number): WindowRect {
  const columns = 14;
  const rows = 7;
  const index = Math.abs(id) % (columns * rows);
  return {
    x: 0.075 + (index % columns) * 0.061,
    y: 0.115 + Math.floor(index / columns) * 0.095,
    width: 0.042,
    height: 0.052,
  };
}

export function windowRect(id: number): WindowRect {
  return HERO_WINDOWS.get(id) ?? fallbackWindow(id);
}

export function coverPlacement(image: ImageSize, width: number, height: number): ImagePlacement {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  return {
    x: (width - imageWidth) / 2,
    y: (height - imageHeight) / 2,
    width: imageWidth,
    height: imageHeight,
  };
}

export function placedWindow(rect: WindowRect, placement: ImagePlacement): WindowRect {
  return {
    x: placement.x + rect.x * placement.width,
    y: placement.y + rect.y * placement.height,
    width: rect.width * placement.width,
    height: rect.height * placement.height,
  };
}
