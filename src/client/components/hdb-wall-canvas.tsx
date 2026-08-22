import { useEffect, useRef } from "react";
import facadeArtwork from "../../../assets/generated/photographic-hdb-wall.png";
import type { RoomSnapshot } from "../../shared/schemas";
import { deriveWallVisualState } from "../lib/wall-visual-state";

type WindowRect = { x: number; y: number; width: number; height: number };
type ImagePlacement = { x: number; y: number; width: number; height: number };

const WINDOW_COLOURS = {
  amber: { core: "#ffd79a", edge: "#e8912f", glow: "rgba(255, 168, 67, .72)" },
  mint: { core: "#d4f4dc", edge: "#75b99d", glow: "rgba(117, 185, 157, .62)" },
  violet: { core: "#f0c3b5", edge: "#be7765", glow: "rgba(190, 119, 101, .62)" },
};

// Coordinates are normalized to the reviewed generated façade, not the viewport.
const HERO_WINDOWS = new Map<number, WindowRect>([
  [27, { x: 0.356, y: 0.386, width: 0.047, height: 0.056 }],
  [64, { x: 0.648, y: 0.386, width: 0.047, height: 0.056 }],
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

function windowRect(id: number): WindowRect {
  return HERO_WINDOWS.get(id) ?? fallbackWindow(id);
}

function coverPlacement(image: HTMLImageElement, width: number, height: number): ImagePlacement {
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

function placedWindow(rect: WindowRect, placement: ImagePlacement): WindowRect {
  return {
    x: placement.x + rect.x * placement.width,
    y: placement.y + rect.y * placement.height,
    width: rect.width * placement.width,
    height: rect.height * placement.height,
  };
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, value)), 3);
}

function drawFallback(context: CanvasRenderingContext2D, width: number, height: number) {
  const concrete = context.createLinearGradient(0, 0, 0, height);
  concrete.addColorStop(0, "#071018");
  concrete.addColorStop(0.58, "#101a22");
  concrete.addColorStop(1, "#030607");
  context.fillStyle = concrete;
  context.fillRect(0, 0, width, height);
}

function drawWindowLight(
  context: CanvasRenderingContext2D,
  rect: WindowRect,
  palette: (typeof WINDOW_COLOURS)[keyof typeof WINDOW_COLOURS],
  reveal: number,
  pulse: number,
) {
  if (reveal <= 0) return;
  const revealWidth = rect.width * reveal;
  const revealX = rect.x + (rect.width - revealWidth) / 2;

  context.save();
  context.globalCompositeOperation = "screen";
  context.shadowColor = palette.glow;
  context.shadowBlur = Math.max(22, rect.width * 0.72) * pulse;
  const light = context.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
  light.addColorStop(0, palette.core);
  light.addColorStop(0.56, palette.edge);
  light.addColorStop(1, "#7a3d16");
  context.fillStyle = light;
  context.fillRect(revealX, rect.y, revealWidth, rect.height);
  context.shadowBlur = 0;

  context.globalAlpha = 0.34;
  context.fillStyle = "#fff5dc";
  context.fillRect(revealX + revealWidth * 0.1, rect.y + rect.height * 0.08, revealWidth * 0.8, rect.height * 0.08);
  context.globalAlpha = 0.42;
  context.fillStyle = "#331b0f";
  context.fillRect(rect.x + rect.width * 0.49, rect.y, Math.max(1, rect.width * 0.025), rect.height);
  context.restore();

  context.save();
  context.globalCompositeOperation = "screen";
  const bloom = context.createRadialGradient(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    0,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    rect.width * 1.8,
  );
  bloom.addColorStop(0, `rgba(255, 169, 76, ${0.22 * reveal * pulse})`);
  bloom.addColorStop(1, "rgba(255, 169, 76, 0)");
  context.fillStyle = bloom;
  context.fillRect(rect.x - rect.width * 1.6, rect.y - rect.height, rect.width * 4.2, rect.height * 3);
  context.restore();
}

export function HdbWallCanvas({ snapshot }: { snapshot: RoomSnapshot | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneStartedAt = useRef(performance.now());
  const visual = deriveWallVisualState(snapshot);

  useEffect(() => {
    sceneStartedAt.current = performance.now();
  }, [visual.state, snapshot?.match?.candidateId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    image.decoding = "async";
    image.src = facadeArtwork;
    let imageReady = false;
    let frame = 0;
    let animationFrame = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(bounds.width * ratio) || canvas.height !== Math.round(bounds.height * ratio)) {
        canvas.width = Math.round(bounds.width * ratio);
        canvas.height = Math.round(bounds.height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const width = bounds.width;
      const height = bounds.height;
      context.clearRect(0, 0, width, height);

      let placement: ImagePlacement = { x: 0, y: 0, width, height };
      if (imageReady) {
        placement = coverPlacement(image, width, height);
        context.drawImage(image, placement.x, placement.y, placement.width, placement.height);
      } else {
        drawFallback(context, width, height);
      }

      const elapsed = performance.now() - sceneStartedAt.current;
      for (const windowState of snapshot?.windows ?? []) {
        const rect = placedWindow(windowRect(windowState.windowId), placement);
        const isCandidate = windowState.participantId === snapshot?.activeCandidateId;
        const reveal = reducedMotion
          ? 1
          : easeOutCubic((elapsed - (isCandidate ? 280 : 0)) / (isCandidate ? 760 : 560));
        const pulse = reducedMotion || visual.state !== "matching"
          ? 1
          : 0.9 + Math.sin(frame / 18) * 0.1;
        drawWindowLight(context, rect, WINDOW_COLOURS[windowState.colour], reveal, pulse);
      }

      if (visual.hasThread && snapshot?.match?.scene) {
        const fromRect = placedWindow(windowRect(snapshot.match.scene.fromWindow), placement);
        const toRect = placedWindow(windowRect(snapshot.match.scene.toWindow), placement);
        const from = { x: fromRect.x + fromRect.width / 2, y: fromRect.y + fromRect.height / 2 };
        const to = { x: toRect.x + toRect.width / 2, y: toRect.y + toRect.height / 2 };
        const progress = reducedMotion ? 1 : easeOutCubic((elapsed - 720) / 1100);
        const current = { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
        context.save();
        context.globalCompositeOperation = "screen";
        context.strokeStyle = "rgba(155, 205, 255, .9)";
        context.shadowColor = "rgba(89, 167, 255, .8)";
        context.shadowBlur = 12;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.quadraticCurveTo(width * 0.5, Math.min(from.y, to.y) - height * 0.045, current.x, current.y);
        context.stroke();
        context.restore();
      }

      const vignette = context.createRadialGradient(width / 2, height / 2, height * 0.18, width / 2, height / 2, width * 0.7);
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(0, 0, 0, .44)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);

      frame += 1;
      animationFrame = requestAnimationFrame(draw);
    };

    image.addEventListener("load", () => {
      imageReady = true;
    });
    image.addEventListener("error", () => {
      imageReady = false;
    });
    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [snapshot, visual.hasThread, visual.state]);

  return (
    <canvas
      ref={canvasRef}
      className="wall-canvas"
      data-wall-state={visual.state}
      data-lit-count={visual.litWindowIds.length}
      data-has-thread={String(visual.hasThread)}
      aria-label={`A photographic housing façade with ${visual.litWindowIds.length} lit ${visual.litWindowIds.length === 1 ? "window" : "windows"} showing live room activity`}
    />
  );
}
