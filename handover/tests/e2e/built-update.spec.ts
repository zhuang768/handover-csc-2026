import { expect, test, type Page, type Route } from "@playwright/test";
import type { Workspace } from "../../shared/types";

// Focused UI seam: waiting/controller are provided, while sessions and writes
// use the real built Worker API. This is not a two-version installation test.
async function waitingWorker(page: Page) {
  await page.addInitScript(() => {
    const calls: string[] = [];
    const serviceWorker = new EventTarget();
    const registration = Object.assign(new EventTarget(), {
      waiting: { postMessage: (message: string) => calls.push(message) },
      installing: null,
    });
    Object.assign(serviceWorker, {
      controller: {},
      getRegistration: async () => registration,
      register: async () => registration,
    });
    Object.defineProperty(navigator, "serviceWorker", { value: serviceWorker });
    Object.assign(window, { updateMessages: calls });
  });
}

async function signIn(page: Page, role: string) {
  await page.goto("/");
  const login = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/demo") && response.status() === 200,
  );
  const workspace = page.waitForResponse(
    (response) =>
      response.url().includes("/api/workspace") && response.status() === 200,
  );
  await page.getByRole("button", { name: role, exact: true }).click();
  const { user } = (await (await login).json()) as { user: { name: string } };
  const data = (await (await workspace).json()) as Workspace;
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    user.name,
  );
  await expect(page.locator(".auth-shell")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reload the new version" }),
  ).toBeVisible();
  return data;
}

function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

async function delayedWrite(page: Page, path: string, method = "POST") {
  const started = gate();
  const held = gate();
  let calls = 0;
  await page.route(path, async (route: Route) => {
    if (route.request().method() !== method) return route.continue();
    calls++;
    started.release();
    await held.promise;
    const response = await route.fetch();
    await route.fulfill({ response });
  });
  return {
    started: started.promise,
    release: held.release,
    calls: () => calls,
  };
}

async function blocked(page: Page) {
  await expect(
    page.getByRole("button", { name: "Reload the new version" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("A change is being saved.", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { updateMessages?: string[] }).updateMessages,
    ),
  ).toEqual([]);
}

async function settled(page: Page) {
  await expect(
    page.getByRole("button", { name: "Reload the new version" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { updateMessages?: string[] }).updateMessages,
    ),
  ).toEqual([]);
}

async function updateAllowed(page: Page) {
  await settled(page);
  await page.getByRole("button", { name: "Reload the new version" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { updateMessages?: string[] }).updateMessages,
      ),
    )
    .toEqual(["skip-waiting"]);
}

test("a blank-comment acceptance blocks updates while the real response is pending", async ({
  page,
}) => {
  await waitingWorker(page);
  const workspace = await signIn(page, "Covering teacher");
  const pending = workspace.requests.find(
    (request) =>
      request.status === "Pending" && request.recipientId === workspace.user.id,
  );
  expect(
    pending,
    "seed provides a pending request for the actual recipient",
  ).toBeTruthy();
  await page.getByRole("button", { name: "Handovers", exact: true }).click();
  await page
    .locator("article", { hasText: "Pending" })
    .filter({ hasText: pending!.subject })
    .filter({ hasText: pending!.targetDate })
    .getByRole("button", { name: "Open handover" })
    .first()
    .click();
  await expect(
    page.getByRole("textbox", { name: "Response / comment" }),
  ).toHaveValue("");
  const write = await delayedWrite(
    page,
    `**/api/requests/${pending!.id}/respond`,
  );
  const response = page.waitForResponse(
    (result) => result.url().endsWith("/respond") && result.status() === 200,
  );
  await page.getByRole("button", { name: "Accept handover" }).click();
  try {
    await write.started;
    await blocked(page);
    expect(write.calls()).toBe(1);
  } finally {
    write.release();
  }
  await response;
  await expect(page.locator("#handover-detail .badge").first()).toContainText(
    "Confirmed",
  );
  await updateAllowed(page);
});

test("user activation writes block updates without a profile draft", async ({
  page,
}) => {
  await waitingWorker(page);
  await signIn(page, "School admin");
  await page.getByRole("button", { name: "People", exact: true }).click();
  // A spare demo teacher is not one of the accounts used by the core flow.
  const row = page
    .getByRole("row")
    .filter({ hasText: "kenji.watanabe@demo.handover.school" });
  await expect(row).toHaveCount(1);
  const button = row.getByRole("button", { name: /Disable|Enable/ });
  const before = await button.textContent();
  const write = await delayedWrite(page, "**/api/admin/users/*", "PATCH");
  const response = page.waitForResponse(
    (result) =>
      result.url().includes("/api/admin/users/") && result.status() === 200,
  );
  await button.click();
  try {
    await write.started;
    await blocked(page);
    await expect(button).toBeDisabled();
    expect(write.calls()).toBe(1);
  } finally {
    write.release();
  }
  await response;
  await expect(button).toHaveText(
    before?.trim() === "Disable" ? "Enable" : "Disable",
  );
  await updateAllowed(page);
});

test("notification read writes block updates until their real response settles", async ({
  page,
}) => {
  await waitingWorker(page);
  await signIn(page, "Student");
  await page
    .getByRole("button", { name: /^Notifications(?: \(\d+\))?$/ })
    .click();
  const write = await delayedWrite(page, "**/api/notifications/read");
  const response = page.waitForResponse(
    (result) =>
      result.url().endsWith("/api/notifications/read") &&
      result.status() === 200,
  );
  await page.getByRole("button", { name: "Mark all as read" }).click();
  try {
    await write.started;
    await blocked(page);
    expect(write.calls()).toBe(1);
  } finally {
    write.release();
  }
  await response;
  await updateAllowed(page);
});

test("student todo writes block updates without teacher text input", async ({
  page,
}) => {
  await waitingWorker(page);
  await signIn(page, "Student");
  await page.getByRole("button", { name: "Handovers", exact: true }).click();
  await page
    .locator("article", { hasText: "Confirmed" })
    .getByRole("button", { name: "Open handover" })
    .first()
    .click();
  const todo = page.getByRole("checkbox", {
    name: "I have the teaching materials",
  });
  await expect(todo).toBeVisible();
  await settled(page); // Any read-receipt write must finish first.
  const write = await delayedWrite(page, "**/api/requests/*/todo");
  const response = page.waitForResponse(
    (result) => result.url().endsWith("/todo") && result.status() === 200,
  );
  await todo.click();
  try {
    await write.started;
    await blocked(page);
    expect(write.calls()).toBe(1);
  } finally {
    write.release();
  }
  await response;
  await updateAllowed(page);
});

test("demo reset blocks updates without changing any profile field", async ({
  page,
}) => {
  await waitingWorker(page);
  await signIn(page, "School admin");
  await page.getByRole("button", { name: "My profile", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Reset demo", exact: true })
    .fill("RESET DEMO");
  await settled(page);
  const write = await delayedWrite(page, "**/api/admin/reset");
  const response = page.waitForResponse(
    (result) =>
      result.url().endsWith("/api/admin/reset") && result.status() === 200,
  );
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  try {
    await write.started;
    await blocked(page);
    expect(write.calls()).toBe(1);
  } finally {
    write.release();
  }
  await response;
  await updateAllowed(page);
});
