import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const shots = new URL("../../docs/screenshots/", import.meta.url);

async function save(page: Page, name: string) {
  await mkdir(shots, { recursive: true });
  await page.screenshot({
    path: new URL(name, shots).pathname,
    fullPage: true,
  });
}

async function demo(page: Page, label: string) {
  await page.goto("/");
  await page.getByRole("button", { name: label }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
}

test("login and role shells keep their width in English and Traditional Chinese", async ({
  page,
}) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate((expected) => {
      if (document.documentElement.clientWidth !== expected) {
        throw new Error(
          `viewport ${document.documentElement.clientWidth} is not ${expected}`,
        );
      }
    }, width);
    const shell = page.locator(".shell, .auth-shell, body").first();
    const box = await shell.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(width * 0.9);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(overflow).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "繁體中文" }).click();
  const zhWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    shell: document
      .querySelector(".shell, .auth-shell")
      ?.getBoundingClientRect().width,
  }));
  expect(zhWidth.client).toBe(1440);
  expect(zhWidth.shell ?? 0).toBeGreaterThan(1000);
  await save(page, "01-login-zh-1440.png");
});

test("student next lesson does not borrow another handover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await demo(page, "Student");
  const card = page.locator(".next-lesson");
  await expect(card).toBeVisible();
  const text = await card.innerText();
  if (text.includes("→")) {
    const lessonLine = text
      .split("\n")
      .find((line) => /\bP?\d\b|Period/.test(line));
    expect(lessonLine ?? text).not.toMatch(/Friday/i);
  }
  await save(page, "02-student-next-lesson.png");
});

test("a failed conflict check can be retried without clearing the form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await demo(page, "Original teacher");
  await page.getByRole("button", { name: "Handovers" }).click();
  await page.getByRole("button", { name: "New handover" }).click();
  await page.getByLabel("Arrange the lesson").selectOption("move");
  await page.route("**/api/conflicts", (route) =>
    route.fulfill({ status: 500, body: '{"error":"INTERNAL"}' }),
  );
  await page
    .getByRole("textbox", { name: "Reason" })
    .fill("Cover is needed for this lesson.");
  const room = page.getByRole("textbox", { name: "Room", exact: true });
  await room.fill("E2E room");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(room).toHaveValue("E2E room");
  await page.unroute("**/api/conflicts");
  await page.getByRole("button", { name: "Try again" }).click();
  await save(page, "03-teacher-editor.png");
});

test("manifest, home-screen guide, and a phone-width student home", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const manifest = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifest).toContain("manifest.webmanifest");
  const response = await page.request.get("/manifest.webmanifest");
  expect(response.headers()["content-type"]).toContain("json");
  const body = (await response.json()) as {
    display: string;
    start_url: string;
  };
  expect(body.display).toBe("standalone");
  expect(body.start_url).toBe("/");
  const icon = await page.request.get("/icons/icon-192.png");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toContain("png");
  await page.getByRole("button", { name: "Student" }).click();
  await page.locator("summary", { hasText: "Add to Home Screen" }).click();
  await expect(page.getByText(/open this page in Safari/)).toBeVisible();
  await save(page, "05-student-390.png");
  await save(page, "06-install-guide-390.png");
});

test("offline navigation does not pretend a handover was saved", async ({
  page,
}) => {
  await page.goto("/");
  expect((await page.request.get("/sw.js")).status()).toBe(200);
  expect((await page.request.get("/offline.html")).status()).toBe(200);
  const report = await page.evaluate(async () => {
    const started = Date.now();
    let last = "no-service-worker";
    while (Date.now() - started < 8000) {
      const registration = await navigator.serviceWorker.getRegistration();
      const keys = await caches.keys();
      const urls: string[] = [];
      let sample = "";
      for (const key of keys) {
        const cache = await caches.open(key);
        for (const request of await cache.keys()) {
          urls.push(request.url);
          if (request.url.includes("offline")) {
            sample = (await (await cache.match(request))?.text()) ?? "";
          }
        }
      }
      last = JSON.stringify({
        active: Boolean(registration?.active),
        keys,
        urls,
        sample,
      });
      if (
        sample.includes("needs a connection") &&
        sample.includes("交接需要網路") &&
        !urls.some((url) => url.includes("/api/"))
      )
        return "ok";
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return last;
  });
  expect(report).toBe("ok");
  const cachedApi = await page.evaluate(async () => {
    const keys = await caches.keys();
    for (const key of keys) {
      const cache = await caches.open(key);
      const requests = await cache.keys();
      if (requests.some((item) => item.url.includes("/api/"))) return true;
    }
    return false;
  });
  expect(cachedApi).toBe(false);
  await page.getByRole("button", { name: "Student" }).click();
  await expect(
    page.locator("summary", { hasText: "Add to Home Screen" }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(
    page.getByText("You are offline. Changes are not saved"),
  ).toBeVisible();
});

test("dark primary button text stays light on the green control", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await demo(page, "School admin");
  await page.getByRole("button", { name: "Profile" }).click();
  await page.getByLabel("Dark mode").check();
  const button = page.getByRole("button", { name: "Save profile" });
  const colors = await button.evaluate((node) => {
    const style = getComputedStyle(node);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(colors.color).toBe("rgb(255, 255, 255)");
  expect(colors.background).toBe("rgb(36, 107, 86)");
  await save(page, "04-admin-dark.png");
});
