#!/usr/bin/env node
/* global Buffer, console */
/**
 * Generate social preview (OG) image and PNG favicons from the window icon + façade still.
 * Synthetic/public-safe assets only. Run: node scripts/generate-social-preview.mjs
 */

import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(root, "public");
const iconsDir = resolve(publicDir, "icons");

const SITE_URL = "https://87k-windows.up.railway.app";
const TITLE = "87K WINDOWS";
const TAGLINE = "One life remembers. Another life needs it.";
const SUBLINE = "Explainable, consented human connection — not an AI companion.";

mkdirSync(iconsDir, { recursive: true });

const facadePath = resolve(publicDir, "assets/landing-facade-still.jpg");
const windowSvgPath = resolve(iconsDir, "window.svg");

async function generateOgImage() {
  const facade = await sharp(facadePath)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .modulate({ brightness: 0.92, saturation: 1.05 })
    .toBuffer();

  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#070b0f" stop-opacity="0.15"/>
      <stop offset="45%" stop-color="#070b0f" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#070b0f" stop-opacity="0.92"/>
    </linearGradient>
    <linearGradient id="amberGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#eda94b" stop-opacity="0"/>
      <stop offset="50%" stop-color="#eda94b" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#eda94b" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#fade)"/>
  <rect x="72" y="520" width="180" height="3" fill="url(#amberGlow)"/>
  <text x="72" y="420" fill="#f4ead8" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" letter-spacing="0.06em">${TITLE}</text>
  <text x="72" y="468" fill="#eda94b" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="400" letter-spacing="0.02em">${TAGLINE}</text>
  <text x="72" y="512" fill="#d5c8b3" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="400">${SUBLINE}</text>
  <text x="72" y="582" fill="#9f9689" font-family="Arial, Helvetica, sans-serif" font-size="18">${SITE_URL.replace("https://", "")}</text>
  <rect x="1020" y="48" width="108" height="108" rx="18" fill="#090909" fill-opacity="0.72" stroke="#3c444c" stroke-width="2"/>
  <rect x="1044" y="72" width="28" height="34" fill="#f1ae49"/>
  <rect x="1078" y="72" width="28" height="34" fill="#82b6e8"/>
  <rect x="1044" y="112" width="28" height="34" fill="#83b9a0"/>
  <rect x="1078" y="112" width="28" height="34" fill="#f1ae49"/>
</svg>`);

  await sharp(facade)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(resolve(publicDir, "og-image.png"));

  console.info("Wrote public/og-image.png (1200×630)");
}

async function generateFavicons() {
  const svg = readFileSync(windowSvgPath);

  const sizes = [
    [16, "favicon-16x16.png"],
    [32, "favicon-32x32.png"],
    [180, "apple-touch-icon.png"],
    [192, "android-chrome-192x192.png"],
    [512, "android-chrome-512x512.png"],
  ];

  for (const [size, name] of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(resolve(publicDir, name));
    console.info(`Wrote public/${name} (${size}×${size})`);
  }

  await sharp(svg)
    .resize(32, 32)
    .png()
    .toFile(resolve(iconsDir, "favicon-32.png"));
}

await generateOgImage();
await generateFavicons();
