import { expect, test } from "@playwright/test";

const syntheticPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test("landing page leads with the 87K Windows artwork and a working demo action", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  await expect(page.getByAltText("Two illuminated windows connected across a Singapore housing block at night")).toBeVisible();
  await expect(page.getByText("Two windows. One human thread.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileCaptionSizes = await page.locator(".landing-visual figcaption").evaluate((caption) => ({
    caption: Number.parseFloat(getComputedStyle(caption).fontSize),
    disclosure: Number.parseFloat(getComputedStyle(caption.querySelector("span")!).fontSize),
    proof: Number.parseFloat(getComputedStyle(document.querySelector(".landing-proof p")!).fontSize),
  }));
  expect(mobileCaptionSizes.caption).toBeGreaterThanOrEqual(18);
  expect(mobileCaptionSizes.disclosure).toBeGreaterThanOrEqual(18);
  expect(mobileCaptionSizes.proof).toBeGreaterThanOrEqual(18);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("link", { name: "Start the demo" }).click();
  await expect(page).toHaveURL(/\/join\/demo87$/);
});

test("two tabs complete the match, reconnect and honest no-match flow", async ({ browser }) => {
  const roomCode = `e2e-${Date.now()}`;
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const projectorContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const join = await phoneContext.newPage();
  const wall = await projectorContext.newPage();

  await Promise.all([
    wall.goto(`/wall/${roomCode}`),
    join.goto(`/join/${roomCode}`),
  ]);
  await expect(wall.getByText("Scan. Share. Watch the wall light up.")).toBeVisible();
  await join.getByRole("button", { name: "Share a prepared memory" }).click();
  await expect(join.getByText("Prepared demo image selected")).toBeVisible();
  await expect(join.getByText("Your words", { exact: true })).toBeInViewport();
  await expect(join.getByText("If camera access is denied")).toBeVisible();

  await join.locator('input[type="file"]').setInputFiles({
    name: "fictional-radio-cue.png",
    mimeType: "image/png",
    buffer: syntheticPng,
  });
  await expect(join.getByAltText("Chosen preview; it has not been shared")).toBeVisible();
  await join.getByRole("button", { name: "Restore prepared demo image" }).click();
  await expect(join.getByText("Prepared demo image selected")).toBeVisible();

  await join.getByRole("button", { name: "Create my safe capsule" }).click();
  await expect(join.getByRole("heading", { name: "You decide what enters matching." })).toBeVisible();
  await expect(join.getByText("OFFER", { exact: true })).toBeVisible();
  await expect(join.locator(".capsule-evidence").getByText("teach basic radio repair", { exact: false })).toBeVisible();
  await join.getByRole("button", { name: "Approve and light my window" }).click();

  await expect(wall.getByRole("heading", { name: "A potential listener match was found." })).toBeVisible({ timeout: 15_000 });
  await expect(wall.getByText("You shared", { exact: true })).toBeVisible();
  await expect(wall.getByText("Gemma protected", { exact: true })).toBeVisible();
  await expect(wall.getByText("You approved", { exact: true })).toBeVisible();
  await expect(wall.getByText("A story matched", { exact: true })).toBeVisible();
  await expect(wall.getByText("Gemini guides", { exact: true })).toBeVisible();
  await expect(wall.getByText("YOUR MEMORY", { exact: true })).toBeVisible();
  await expect(wall.getByText("A fictional memory of repairing radios in Queenstown in the 1970s, with an offer to share the skill.", { exact: true })).toBeVisible();
  await expect(wall.getByText("A fictional Queenstown hobbyist is restoring an old radio cabinet and wants to learn basic radio repair.", { exact: true })).toBeVisible();
  await expect(wall.getByText("PREPARED FICTIONAL INTEREST", { exact: true })).toBeVisible();
  await expect(wall.getByText("Queenstown", { exact: true })).toBeVisible();
  await expect(wall.getByText("teach ↔ learn", { exact: true })).toBeVisible();
  await expect(join.getByRole("heading", { name: "A potential listener match was found." })).toBeVisible();
  await expect(join.getByText("GEMINI · SENIOR CONNECTION GUIDE", { exact: true })).toBeVisible();
  await expect(join.getByText("You both have a radio repair story to explore.", { exact: true })).toBeVisible();
  await expect(join.getByRole("button", { name: "Read this aloud" })).toBeVisible();
  await expect(wall.getByText("GEMINI · SENIOR CONNECTION GUIDE", { exact: true })).toBeVisible();
  await expect(join.getByText("This prepared story has not accepted.", { exact: false })).toBeVisible();
  await expect(wall.locator("canvas")).toHaveCount(1);

  await wall.reload();
  await expect(wall.getByRole("heading", { name: "A potential listener match was found." })).toBeVisible();

  await join.getByRole("button", { name: "Run the demo again" }).click();
  await join.getByRole("button", { name: "Use no-match fixture" }).click();
  await join.getByRole("button", { name: "Create my safe capsule" }).click();
  await expect(join.getByRole("heading", { name: "You decide what enters matching." })).toBeVisible();
  await join.getByRole("button", { name: "Approve and light my window" }).click();
  await expect(join.getByRole("heading", { name: "NO MATCH YET" })).toBeVisible({ timeout: 15_000 });
  await expect(join.getByText("We haven’t found the right listener yet.")).toBeVisible();
  await expect(join.getByText("Still listening", { exact: true })).toBeVisible();
  await expect(join.getByText("A story matched", { exact: true })).toHaveCount(0);
  await expect(join.getByText("GEMINI · SENIOR CONNECTION GUIDE", { exact: true })).toHaveCount(0);
  await expect(wall.getByRole("heading", { name: "NO MATCH YET" })).toBeVisible();
  await expect(wall.getByText("We haven’t found the right listener yet.")).toBeVisible();

  await join.setViewportSize({ width: 320, height: 568 });
  expect(await join.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await wall.setViewportSize({ width: 1440, height: 900 });
  expect(await wall.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await phoneContext.close();
  await projectorContext.close();
});

test("Admin Mode exposes safe controls and labels the development harness honestly", async ({ page }) => {
  const roomCode = `admin-${Date.now()}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`/admin/${roomCode}`);
  await expect(page.getByRole("heading", { name: "Keep the room moving." })).toBeVisible();
  await expect(page.getByAltText(new RegExp(`QR code for .*${roomCode}`))).toBeVisible();
  await page.getByRole("button", { name: "Run prepared story", exact: true }).click();
  await expect(page.getByText("MATCH", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Development test harness", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Mock Gemini guide", { exact: true })).toBeVisible();
  await expect(page.getByText("never judging", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mock" })).toHaveCount(0);
});
