import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Workspace } from "../../shared/types";
import { addDays, mondayOnOrBefore } from "../../shared/time";

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
  const button = page.getByRole("button", { name: label, exact: true });
  const signOut = page.getByRole("button", { name: "Sign out" });
  const more = page.getByRole("button", { name: "More" });
  await expect(button.or(signOut).or(more)).toBeVisible();
  if (!(await button.isVisible())) {
    if (await more.isVisible()) await more.click();
    await signOut.click();
    await expect(button).toBeVisible();
  }
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/demo") && response.status() === 200,
  );
  const workspaceResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/workspace") && response.status() === 200,
  );
  await button.click();
  const { user } = (await (await loginResponse).json()) as {
    user: { name: string };
  };
  await workspaceResponse;
  await expect(page.locator(".shell")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    user.name,
  );
  await expect(page.locator(".auth-shell")).toHaveCount(0);
}

async function widthReport(page: Page) {
  return page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: Math.max(
      document.documentElement.scrollWidth,
      document.body ? document.body.scrollWidth : 0,
    ),
    inner: window.innerWidth,
  }));
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
    const measured = await widthReport(page);
    expect(measured.inner).toBe(width);
    expect(measured.scroll).toBeLessThanOrEqual(measured.client);
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

test("student next lesson matches that lesson id, date, and period", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const workspaceResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/workspace") && response.status() === 200,
  );
  await demo(page, "Student");
  const body = (await (await workspaceResponse).json()) as {
    lessons: {
      id: string;
      date: string;
      period: number;
      subject: string;
      requestId?: string;
    }[];
    requests: {
      id: string;
      lessonId: string;
      targetDate: string;
      status: string;
    }[];
  };
  const nextLesson = [...body.lessons]
    .filter(
      (lesson) =>
        lesson.date >=
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Taipei",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()),
    )
    .sort((a, b) =>
      a.date === b.date ? a.period - b.period : a.date.localeCompare(b.date),
    )[0];
  expect(nextLesson?.id).toBeTruthy();
  const card = page.locator(".next-lesson");
  await expect(card).toContainText(nextLesson.date);
  await expect(card).toContainText(String(nextLesson.period));
  await expect(card).toContainText(nextLesson.subject);
  const paired = body.requests.find(
    (item) =>
      item.lessonId === nextLesson.id &&
      (item.status === "Confirmed" || item.status === "Completed"),
  );
  const other = body.requests.find(
    (item) => item.status === "Confirmed" && item.lessonId !== nextLesson.id,
  );
  if (other && other.targetDate !== nextLesson.date)
    await expect(card).not.toContainText(other.targetDate);
  if (paired) {
    await page.getByRole("button", { name: "Open handover" }).click();
    await expect(page.locator("#handover-detail")).toContainText(
      paired.targetDate,
    );
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
  await page.getByRole("button", { name: "Use subject template" }).click();
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
  const recovered = page.waitForResponse(
    (response) =>
      response.url().includes("/api/conflicts") && response.status() === 200,
  );
  await page.getByRole("button", { name: "Try again" }).click();
  await recovered;
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Send for confirmation" }),
  ).toBeEnabled();
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
  await page.getByRole("button", { name: "Student", exact: true }).click();
  const home = await widthReport(page);
  expect(home.inner).toBe(390);
  expect(home.scroll).toBeLessThanOrEqual(home.client);
  await expect(page.locator(".desktop-nav")).toBeHidden();
  await expect(page.locator(".bottom-nav button")).toHaveCount(4);
  await save(page, "05-student-390.png");
  await page.locator("summary", { hasText: "Add to Home Screen" }).click();
  await expect(page.getByText(/Open as Web App/)).toBeVisible();
  await save(page, "06-install-guide-390.png");
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
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "繁體中文" }).click();
  await page.getByRole("button", { name: "總覽" }).click();
  const admin = await widthReport(page);
  expect(admin.scroll).toBeLessThanOrEqual(admin.client);
  await save(page, "04-admin-zh-1440.png");
});

test("logged-in roles keep one phone nav and no horizontal overflow", async ({
  page,
}) => {
  for (const role of ["Student", "Original teacher", "School admin"]) {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await demo(page, role);
      const measured = await widthReport(page);
      expect(measured.inner, role).toBe(width);
      expect(measured.scroll, `${role} ${width}`).toBeLessThanOrEqual(
        measured.client,
      );
      if (width < 768) {
        await expect(page.locator(".desktop-nav")).toBeHidden();
        const buttons = page.locator(".bottom-nav button");
        await expect(buttons).toHaveCount(4);
        for (const button of await buttons.all()) {
          const box = await button.boundingBox();
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
          expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
            width + 1,
          );
        }
        await page.getByRole("button", { name: "More" }).click();
        await expect(page.getByRole("dialog", { name: "More" })).toBeVisible();
        await page.getByRole("button", { name: "Close" }).click();
      } else {
        await expect(page.locator(".desktop-nav")).toBeVisible();
        await expect(page.locator(".bottom-nav")).toBeHidden();
      }
      if (width < 768) await page.getByRole("button", { name: "More" }).click();
      await page.getByRole("button", { name: "繁體中文" }).click();
      const zh = await widthReport(page);
      expect(zh.scroll).toBeLessThanOrEqual(zh.client);
      await page.getByRole("button", { name: "English" }).click();
      if (width < 768)
        await page.getByRole("button", { name: "Close" }).click();
    }
  }
  await page.setViewportSize({ width: 768, height: 1024 });
  await demo(page, "Original teacher");
  await expect(page.locator(".desktop-nav")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Maya");
  await save(page, "07-teacher-768.png");
});

test("simple view stays on the student and keeps the lesson list", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await demo(page, "Student");
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: "Profile" }).click();
  await page.getByLabel("Simple student view").check();
  await page.getByRole("button", { name: "Timetable" }).click();
  await expect(page.locator(".day-list")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".day-list")).toBeVisible();
  await expect(page.locator(".week-grid")).toBeHidden();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page
    .getByRole("button", { name: "Original teacher", exact: true })
    .click();
  await expect(page.locator(".handover-root")).toHaveAttribute(
    "data-simple",
    "false",
  );
  await page.getByRole("button", { name: "Timetable" }).click();
  await expect(page.locator(".week-grid")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("button", { name: "School admin", exact: true }).click();
  await expect(page.getByText("Changes this week").first()).toBeVisible();
  await page.getByRole("button", { name: "Timetable" }).click();
  await expect(page.locator(".week-grid")).toBeVisible();
});

test("detail comments do not leak across handovers and a 401 leaves the shell", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await demo(page, "Original teacher");
  await page.getByRole("button", { name: "Handovers" }).click();
  const note = page.getByRole("textbox", { name: "Add a note" });
  await page
    .locator("article", { hasText: "Confirmed" })
    .getByRole("button", { name: "Open handover" })
    .first()
    .click();
  await note.fill("FIRST-NOTE");
  await page
    .locator("article", { hasText: "Pending" })
    .getByRole("button", { name: "Open handover" })
    .first()
    .click();
  await expect(note).toHaveValue("");
  await save(page, "08-detail-390.png");
  await page.route("**/api/profile", (route) =>
    route.fulfill({ status: 401, body: '{"error":"UNAUTHORIZED"}' }),
  );
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: "Profile" }).click();
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("button", { name: "Student" })).toBeVisible();
});

test("a failed read notification remains visible after opening a different week", async ({
  page,
}) => {
  const initialResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/workspace") && response.status() === 200,
  );
  await demo(page, "Student");
  const initial = (await (await initialResponse).json()) as Workspace;
  const notification = initial.notifications.find(
    (item) =>
      !item.read &&
      initial.requests.some(
        (request) =>
          request.id === item.requestId &&
          ["Confirmed", "Completed"].includes(request.status),
      ),
  );
  expect(
    notification,
    "seed has a real student-visible handover notification",
  ).toBeTruthy();
  const request = initial.requests.find(
    (item) => item.id === notification!.requestId,
  )!;
  const previousWeek = addDays(initial.week, -7);
  expect(mondayOnOrBefore(request.targetDate)).not.toBe(previousWeek);
  await page.getByRole("button", { name: "Timetable", exact: true }).click();
  const previousResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/workspace?week=${previousWeek}`) &&
      response.status() === 200,
  );
  await page.getByRole("button", { name: "Previous week" }).click();
  const previous = (await (await previousResponse).json()) as Workspace;
  const notificationIndex = previous.notifications.findIndex(
    (item) => item.id === notification!.id,
  );
  expect(notificationIndex).toBeGreaterThanOrEqual(0);
  await page
    .getByRole("button", { name: /^Notifications(?: \(\d+\))?$/ })
    .click();
  await page.route("**/api/notifications/read", (route) =>
    route.fulfill({ status: 500, json: { error: "INTERNAL" } }),
  );
  const detailResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/requests/${request.id}`) &&
      response.status() === 200,
  );
  const targetResponse = page.waitForResponse(
    (response) =>
      response
        .url()
        .includes(
          `/api/workspace?week=${mondayOnOrBefore(request.targetDate)}`,
        ) && response.status() === 200,
  );
  await page.locator("section button.lesson").nth(notificationIndex).click();
  await Promise.all([detailResponse, targetResponse]);
  await expect(page.locator("#handover-detail")).toContainText(
    request.targetDate,
  );
  await expect(page.getByRole("alert")).toContainText(/reach the server/);
  const persisted = await page.request.get(
    `/api/workspace?week=${initial.week}`,
  );
  const after = (await persisted.json()) as Workspace;
  expect(
    after.notifications.find((item) => item.id === notification!.id)?.read,
  ).toBe(notification!.read);
});
