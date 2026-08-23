import { expect, test, type Page } from "@playwright/test";
import { adminSecret } from "../../playwright.config";

async function submitStory(page: Page, role: "share" | "listen" = "share") {
  if (role === "share") {
    await page.getByRole("button", { name: "Share a prepared memory" }).click();
    await page.getByRole("button", { name: "Create my safe capsule" }).click();
    await expect(page.getByRole("heading", { name: "You decide what enters matching." })).toBeVisible();
    return;
  }
  await page.getByRole("button", { name: "See a safe story invitation" }).click();
  const request = page.getByRole("button", { name: /Prepare my listening request with Gemma/ });
  await expect(request).toBeEnabled();
  await request.click();
}

test("landing page presents the two human roles at mobile size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "87K Windows home, Singapore" })).toBeVisible();
  await expect(page.locator(".two-chairs-visual video")).toHaveAttribute("poster", /landing-story-poster/);
  await expect(page.getByRole("heading", { name: "What story should not disappear?" })).toBeVisible();
  await expect(page.locator("video[src*='landing-story']")).toBeVisible();
  await expect(page.getByRole("link", { name: "I have a story" })).toHaveAttribute("href", "/join/demo87?role=share");
  await expect(page.getByRole("link", { name: "I would like to listen" })).toHaveAttribute("href", "/join/demo87?role=listen");
  await expect(page.getByText("No contact details are shared.", { exact: true })).toBeVisible();
  await expect(page.getByText(/Both people choose yes\./)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("landing fits the judging viewport without scroll", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("/");
  const listen = page.getByRole("link", { name: /I would like to listen/i });
  await expect(listen).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(listen).toBeInViewport({ ratio: 1 });
  await expect(page.getByText("No contact details are shared.")).toBeInViewport();
  await page.close();
});

test("storyteller, listener and wall reach mutual yes only after two independent choices", async ({ browser }) => {
  const roomCode = `three-${Date.now()}`;
  const storytellerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const listenerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const wallContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const storyteller = await storytellerContext.newPage();
  const listener = await listenerContext.newPage();
  const wall = await wallContext.newPage();
  await Promise.all([
    storyteller.goto(`/join/${roomCode}?role=share`),
    listener.goto(`/join/${roomCode}?role=listen`),
    wall.goto(`/wall/${roomCode}`),
  ]);

  await submitStory(storyteller);
  await storyteller.getByRole("button", { name: "Approve and light my window" }).click();
  await expect(storyteller.getByText("Your story is now visible as a warm light.")).toBeVisible();
  await expect(listener.getByRole("button", { name: "See a safe story invitation" })).toBeVisible();
  await expect(wall.getByText("1 WINDOW LIT", { exact: true })).toBeVisible();
  await submitStory(listener, "listen");

  await expect(storyteller.getByRole("heading", { name: "Would you like this conversation to begin?" })).toBeVisible({ timeout: 15_000 });
  await expect(listener.getByRole("heading", { name: "Would you like this conversation to begin?" })).toBeVisible({ timeout: 15_000 });
  await expect(wall.getByText("The approved capsule is being checked against visible evidence.")).toBeVisible({ timeout: 15_000 });
  await expect(wall.locator("canvas")).toHaveAttribute("data-wall-state", "matching");

  await storyteller.getByRole("button", { name: "Yes, I would like to continue" }).click();
  await expect(storyteller.getByRole("heading", { name: "Waiting for the other person." })).toBeVisible();
  await expect(wall.locator("canvas")).toHaveAttribute("data-wall-state", "matching");
  await expect(wall.getByText("You both said yes.")).toHaveCount(0);

  await listener.getByRole("button", { name: "Yes, I would like to continue" }).click();
  await expect(listener.getByRole("heading", { name: "A listening conversation is ready." })).toBeVisible();
  await expect(storyteller.getByRole("heading", { name: "You both said yes." })).toBeVisible();
  await expect(wall.locator("canvas")).toHaveAttribute("data-wall-state", "matched");
  await expect(wall.locator("canvas")).toHaveAttribute("data-has-thread", "true");
  await expect(wall.getByText("2 WINDOWS LIT", { exact: true })).toBeVisible();
  await expect(wall.getByText("LISTENER’S APPROVED REASON")).toBeVisible();
  await expect(wall.getByText("PREPARED FICTIONAL INTEREST")).toHaveCount(0);

  const guide = wall.locator(".wall-guide");
  const clipped = await guide.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
  expect(clipped).toBe(false);
  const chip = wall.locator(".wall-evidence .evidence-path span").first();
  const chipSize = await chip.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(chipSize).toBeGreaterThanOrEqual(20);
  const guideQuestion = wall.locator(".wall-guide ol li").first();
  const guideQuestionSize = await guideQuestion.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(guideQuestionSize).toBeGreaterThanOrEqual(22);
  const railLabel = wall.locator(".wall-journey > span strong").first();
  const railLabelSize = await railLabel.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(railLabelSize).toBeGreaterThanOrEqual(16);
  const stageBox = await wall.locator(".wall-stage").boundingBox();
  const revealBox = await wall.locator(".wall-reveal").boundingBox();
  const facadeRatio = (stageBox!.height - revealBox!.height) / stageBox!.height;
  expect(facadeRatio).toBeGreaterThanOrEqual(0.55);

  await storytellerContext.close();
  await listenerContext.close();
  await wallContext.close();
});

test("a listener decline keeps the two stories separate", async ({ browser }) => {
  const roomCode = `decline-${Date.now()}`;
  const storytellerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const listenerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const storyteller = await storytellerContext.newPage();
  const listener = await listenerContext.newPage();
  await Promise.all([
    storyteller.goto(`/join/${roomCode}?role=share`),
    listener.goto(`/join/${roomCode}?role=listen`),
  ]);
  await submitStory(storyteller);
  await storyteller.getByRole("button", { name: "Approve and light my window" }).click();
  await submitStory(listener, "listen");
  await expect(listener.getByRole("heading", { name: "Would you like this conversation to begin?" })).toBeVisible({ timeout: 15_000 });
  await listener.getByRole("button", { name: "No, not this time" }).click();
  await expect(listener.getByRole("heading", { name: "No connection was opened." })).toBeVisible();
  await expect(storyteller.getByRole("heading", { name: "No connection was opened." })).toBeVisible();
  await expect(storyteller.getByText("Both stories remain separate and no invitation was created.")).toBeVisible();
  await expect(storyteller.getByText("You both said yes.")).toHaveCount(0);
  await storytellerContext.close();
  await listenerContext.close();
});

test("storyteller no-match remains honest", async ({ page }) => {
  const roomCode = `none-${Date.now()}`;
  const storytellerContext = await page.context();
  const listenerContext = await page.context().browser()!.newContext({ viewport: { width: 390, height: 844 } });
  const wallContext = await page.context().browser()!.newContext({ viewport: { width: 1280, height: 720 } });
  const listener = await listenerContext.newPage();
  const wall = await wallContext.newPage();
  await Promise.all([
    page.goto(`/join/${roomCode}?role=share`),
    listener.goto(`/join/${roomCode}?role=listen`),
    wall.goto(`/wall/${roomCode}`),
  ]);
  await page.getByRole("button", { name: "Share a prepared memory" }).click();
  await page.getByRole("button", { name: "Use no-match fixture" }).click();
  await page.getByRole("button", { name: "Create my safe capsule" }).click();
  await expect(page.getByRole("heading", { name: "You decide what enters matching." })).toBeVisible();
  await page.getByRole("button", { name: "Approve and light my window" }).click();
  await expect(page.getByText("Your story is now visible as a warm light.")).toBeVisible();
  await expect(listener.getByRole("button", { name: "See a safe story invitation" })).toBeVisible();

  await listener.getByRole("button", { name: "See a safe story invitation" }).click();
  await listener.getByRole("textbox", { name: "Why would you like to listen?" }).fill("I enjoy quiet gardening and would like to discuss balcony plants.");
  await listener.getByRole("button", { name: /Prepare my listening request with Gemma/ }).click();
  await expect(wall.getByRole("heading", { name: "NO MATCH YET" })).toBeVisible({ timeout: 15_000 });
  await expect(wall.getByText("No invitation was created, and the approved story remains safe.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "NO MATCH YET" })).toBeVisible();
  await expect(listener.getByRole("heading", { name: "No connection was opened." })).toBeVisible();
  await expect(listener.getByRole("button", { name: "Create my safe capsule" })).toHaveCount(0);
  await expect(listener.getByText("What small thing made you happy when you were young?")).toHaveCount(0);
  await expect(page.getByText("You both said yes.")).toHaveCount(0);
  await storytellerContext.close();
  await listenerContext.close();
  await wallContext.close();
});

test("review panel meets AA contrast and offers read-aloud", async ({ page }) => {
  const roomCode = `review-${Date.now()}`;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/join/${roomCode}?role=share`);
  await submitStory(page);

  const reviewPanel = page.locator(".review-panel");
  await expect(reviewPanel.getByRole("button", { name: /read this to me/i })).toBeVisible();

  const cta = page.getByRole("button", { name: /approve and light my window/i });
  const bg = await cta.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(158, 79, 44)"); // #9e4f2c

  const placeLabel = reviewPanel.locator(".capsule-evidence small").first();
  const placeLabelSize = await placeLabel.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(placeLabelSize).toBeGreaterThanOrEqual(16);

  await expect(reviewPanel.locator("details")).toHaveJSProperty("open", true);
  await expect(reviewPanel.getByRole("listitem").first()).toBeVisible();

  const editButton = page.getByRole("button", { name: "Go back and edit" });
  const editBox = await editButton.boundingBox();
  expect(editBox?.height).toBeGreaterThanOrEqual(48);
});

test("admin labels the development harness honestly", async ({ page }) => {
  const roomCode = `admin-${Date.now()}`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`/admin/${roomCode}?key=${adminSecret}`);
  await expect(page.getByRole("heading", { name: "Keep the room moving." })).toBeVisible();
  await expect(page.getByAltText(new RegExp(`QR code for .*${roomCode}`))).toBeVisible();
  await page.getByRole("button", { name: "Run prepared story", exact: true }).click();
  await expect(page.getByText("Phase")).toBeVisible();
  await expect(page.getByText("matching", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Windows lit")).toBeVisible();
  await expect(page.getByText("1", { exact: true })).toBeVisible();
  await expect(page.getByText("Development test harness", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("never judging", { exact: false })).toBeVisible();
});
