import { useEffect, useRef } from "react";
import type { RoomSnapshot } from "../../shared/schemas";

const COLOURS = {
  amber: "#f1ae49",
  mint: "#5ecfb0",
  violet: "#9e84f5",
};

type Point = { x: number; y: number };

function pointForWindow(id: number, columns: number, rows: number, width: number, height: number): Point {
  const index = Math.abs(id) % (columns * rows);
  const column = index % columns;
  const row = Math.floor(index / columns);
  const gutterX = width * 0.055;
  const top = height * 0.12;
  const fieldWidth = width - gutterX * 2;
  const fieldHeight = height * 0.72;
  return {
    x: gutterX + ((column + 0.5) / columns) * fieldWidth,
    y: top + ((row + 0.5) / rows) * fieldHeight,
  };
}

export function HdbWallCanvas({ snapshot }: { snapshot: RoomSnapshot | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matchStartedAt = useRef(performance.now());

  useEffect(() => {
    matchStartedAt.current = performance.now();
  }, [snapshot?.phase, snapshot?.match?.candidateId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
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

      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#07111d");
      sky.addColorStop(1, "#030609");
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      const left = width * 0.045;
      const top = height * 0.075;
      const facadeWidth = width * 0.91;
      const facadeHeight = height * 0.82;
      context.fillStyle = "#0e151c";
      context.fillRect(left, top, facadeWidth, facadeHeight);
      context.strokeStyle = "#283039";
      context.lineWidth = 1;
      context.strokeRect(left, top, facadeWidth, facadeHeight);

      const columns = width < 700 ? 44 : 72;
      const rows = width < 700 ? 24 : 30;
      const cellWidth = (width * 0.89) / columns;
      const cellHeight = (height * 0.7) / rows;
      context.fillStyle = "#17202a";

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const x = width * 0.055 + column * cellWidth + cellWidth * 0.25;
          const y = height * 0.12 + row * cellHeight + cellHeight * 0.24;
          context.fillRect(x, y, Math.max(2, cellWidth * 0.42), Math.max(2, cellHeight * 0.42));
        }
      }

      const lit = snapshot?.windows ?? [];
      for (const windowState of lit) {
        const point = pointForWindow(windowState.windowId, columns, rows, width, height);
        const pulse = reducedMotion ? 1 : 0.85 + Math.sin(frame / 14 + windowState.windowId) * 0.15;
        context.save();
        context.shadowColor = COLOURS[windowState.colour];
        context.shadowBlur = 20 * pulse;
        context.fillStyle = COLOURS[windowState.colour];
        context.fillRect(point.x - cellWidth * 0.28, point.y - cellHeight * 0.28, cellWidth * 0.56, cellHeight * 0.56);
        context.restore();
      }

      if (snapshot?.phase === "matching" && lit[0]) {
        const point = pointForWindow(lit[0].windowId, columns, rows, width, height);
        const radius = reducedMotion ? 28 : 18 + ((frame * 1.2) % 42);
        context.strokeStyle = `rgba(241,174,73,${reducedMotion ? 0.55 : Math.max(0, 0.8 - radius / 65)})`;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.stroke();
      }

      if (snapshot?.match?.scene && snapshot.match.decision === "MATCH") {
        const from = pointForWindow(snapshot.match.scene.fromWindow, columns, rows, width, height);
        const to = pointForWindow(snapshot.match.scene.toWindow, columns, rows, width, height);
        const elapsed = performance.now() - matchStartedAt.current;
        const progress = reducedMotion ? 1 : Math.min(1, elapsed / 1100);
        const currentX = from.x + (to.x - from.x) * progress;
        const currentY = from.y + (to.y - from.y) * progress;
        context.save();
        context.strokeStyle = COLOURS[snapshot.match.scene.colour];
        context.shadowColor = COLOURS[snapshot.match.scene.colour];
        context.shadowBlur = 14;
        context.lineWidth = 3;
        context.setLineDash([7, 8]);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.quadraticCurveTo(width * 0.5, Math.min(from.y, to.y) - height * 0.12, currentX, currentY);
        context.stroke();
        context.restore();
      }

      context.fillStyle = "rgba(244,244,240,.48)";
      context.font = "10px ui-monospace, monospace";
      context.fillText(`${columns * rows} DRAWN WINDOWS · 87,200 STORIES IMPLIED`, left + 12, top + facadeHeight + 24);

      frame += 1;
      animationFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [snapshot]);

  return <canvas ref={canvasRef} className="wall-canvas" aria-label="An HDB façade with illuminated windows showing live room activity" />;
}
