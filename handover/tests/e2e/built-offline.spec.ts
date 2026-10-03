import { expect, test } from "@playwright/test";

test("built worker offline reload shows the public page, not a synthetic event", async ({
  page,
}) => {
  const probed = await page.request.get("/offline.html", { maxRedirects: 0 });
  const location = probed.headers()["location"] ?? "";
  console.log(
    `offline.html status ${probed.status()} location ${location || "(none)"} redirected-fallback ${probed.status() === 307 ? "seen" : "not seen"}`,
  );

  await page.goto("/");
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const workspace = page.waitForResponse(
    (response) =>
      response.url().includes("/api/workspace") && response.status() === 200,
  );
  await page.getByRole("button", { name: "Student" }).click();
  await expect(page.getByRole("navigation").first()).toBeVisible();
  await workspace;
  const detail = page.waitForResponse(
    (response) =>
      response.url().includes("/api/requests/") && response.status() === 200,
  );
  await page
    .getByRole("heading", { name: "Changes this week" })
    .locator("xpath=..")
    .getByRole("button")
    .click();
  await detail;

  const cacheReport = await page.evaluate(async () => {
    const keys = await caches.keys();
    const urls: string[] = [];
    const bodies: string[] = [];
    let redirected = false;
    for (const key of keys) {
      const cache = await caches.open(key);
      for (const request of await cache.keys()) {
        urls.push(request.url);
        const response = await cache.match(request);
        if (!response) continue;
        if (response.redirected) redirected = true;
        if (request.url.includes("offline")) bodies.push(await response.text());
      }
    }
    return { keys, urls, redirected, bodies };
  });
  expect(
    cacheReport.urls.some((url) => url.includes("/api/")),
    cacheReport.urls.join("\n"),
  ).toBe(false);
  expect(cacheReport.bodies.join("\n")).not.toContain("PRIVATE_TEACHER_NOTE");
  expect(cacheReport.redirected).toBe(false);
  expect(cacheReport.bodies.join("\n")).toContain("needs a connection");
  expect(cacheReport.bodies.join("\n")).toContain("交接需要網路");

  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByText("needs a connection")).toBeVisible();
  await expect(page.getByText("交接需要網路")).toBeVisible();
  await expect(page.getByText("PRIVATE_TEACHER_NOTE")).toHaveCount(0);

  await page.context().setOffline(false);
  await page.getByRole("button", { name: /Try again/ }).click();
  const student = page.getByRole("button", { name: "Student" });
  const shell = page.locator(".handover-root");
  await expect(student.or(shell)).toBeVisible();
  if (await student.isVisible()) await student.click();
  await page.getByRole("button", { name: "Profile" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Offline Probe");
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("alert")).toContainText(
    /reach the server|無法連線/,
  );
  await expect(page.getByText("Saved")).toHaveCount(0);
  await page.context().setOffline(false);
  await page.reload();
  await expect(page.locator(".handover-root")).toBeVisible();
  if (await student.isVisible()) await student.click();
  await page.getByRole("button", { name: "Profile" }).click();
  await expect(
    page.getByRole("textbox", { name: "Full name" }),
  ).not.toHaveValue("Offline Probe");
});
