import { describe, expect, it } from "vitest";
import { coverPlacement, placedWindow, windowRect } from "../../src/client/lib/wall-window-layout";

describe("photographic window layout", () => {
  it("keeps hero window 27 inside its photographed glass opening", () => {
    const rect = windowRect(27);
    expect(rect.x).toBeGreaterThan(0.352);
    expect(rect.x + rect.width).toBeLessThan(0.393);
    expect(rect.y).toBeGreaterThan(0.390);
    expect(rect.y + rect.height).toBeLessThan(0.446);
    expect(rect.width).toBeGreaterThan(0.03);
    expect(rect.height).toBeGreaterThan(0.04);
  });

  it("keeps hero window 64 inside its photographed glass opening", () => {
    const rect = windowRect(64);
    expect(rect.x).toBeGreaterThan(0.649);
    expect(rect.x + rect.width).toBeLessThan(0.704);
    expect(rect.y).toBeGreaterThan(0.386);
    expect(rect.y + rect.height).toBeLessThan(0.442);
    expect(rect.width).toBeGreaterThan(0.03);
    expect(rect.height).toBeGreaterThan(0.04);
  });

  it("accounts for the façade's slight perspective instead of sharing one floor line", () => {
    expect(windowRect(27).y).not.toBe(windowRect(64).y);
  });

  it("maps image-normalized windows through a cover crop", () => {
    const placement = coverPlacement({ naturalWidth: 1672, naturalHeight: 941 }, 1280, 600);
    expect(placement.width).toBeCloseTo(1280);
    expect(placement.y).toBeLessThan(0);
    const placed = placedWindow(windowRect(27), placement);
    expect(placed.x).toBeCloseTo(placement.x + windowRect(27).x * placement.width);
    expect(placed.y).toBeCloseTo(placement.y + windowRect(27).y * placement.height);
  });
});
