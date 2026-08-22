import { expect, test } from "@playwright/test";

const syntheticPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

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
  await expect(join.getByText("teach basic radio repair", { exact: false })).toBeVisible();
  await join.getByRole("button", { name: "Approve and light my window" }).click();

  await expect(wall.getByRole("heading", { name: "A neighbour is ready to listen." })).toBeVisible({ timeout: 15_000 });
  await expect(wall.getByText("YOUR MEMORY", { exact: true })).toBeVisible();
  await expect(wall.getByText("THEIR INTEREST", { exact: true })).toBeVisible();
  await expect(wall.getByText("Queenstown", { exact: true })).toBeVisible();
  await expect(wall.getByText("teach ↔ learn", { exact: true })).toBeVisible();
  await expect(join.getByRole("heading", { name: "A neighbour is ready to listen." })).toBeVisible();
  await expect(wall.locator("canvas")).toHaveCount(1);

  await wall.reload();
  await expect(wall.getByRole("heading", { name: "A neighbour is ready to listen." })).toBeVisible();

  await join.getByRole("button", { name: "Run the demo again" }).click();
  await join.getByRole("button", { name: "Use no-match fixture" }).click();
  await join.getByRole("button", { name: "Create my safe capsule" }).click();
  await expect(join.getByRole("heading", { name: "You decide what enters matching." })).toBeVisible();
  await join.getByRole("button", { name: "Approve and light my window" }).click();
  await expect(join.getByRole("heading", { name: "NO MATCH YET" })).toBeVisible({ timeout: 15_000 });
  await expect(join.getByText("We haven’t found the right listener yet.")).toBeVisible();
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
  await expect(page.getByText("never judging", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mock" })).toHaveCount(0);
});
