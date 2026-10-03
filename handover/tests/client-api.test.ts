import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiError,
  api,
  getPendingWriteCount,
  subscribePendingWrites,
} from "../lib/client-api.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("update protection tracks concurrent real writes until their responses settle", async (t) => {
  const first = deferred<Response>();
  const second = deferred<Response>();
  const changes: number[] = [];
  const unsubscribe = subscribePendingWrites(() =>
    changes.push(getPendingWriteCount()),
  );
  t.after(unsubscribe);
  const replies = [first, second];
  t.mock.method(globalThis, "fetch", () => replies.shift()!.promise);
  const accepting = api("/api/requests/pending/respond", {
    decision: "accept",
    comment: "",
  });
  const toggling = api("/api/admin/users/person", { active: false }, "PATCH");
  assert.equal(getPendingWriteCount(), 2);
  first.resolve(Response.json({ ok: true }));
  await accepting;
  assert.equal(getPendingWriteCount(), 1);
  second.resolve(Response.json({ error: "INTERNAL" }, { status: 500 }));
  await assert.rejects(
    toggling,
    (error: unknown) => error instanceof ApiError && error.status === 500,
  );
  assert.equal(getPendingWriteCount(), 0);
  assert.deepEqual(changes, [1, 2, 1, 0]);
});

test("notification, todo, view and reset writes release update protection after network failure", async (t) => {
  const operations = [
    ["/api/notifications/read", { id: "notice" }],
    ["/api/requests/lesson/todo", { key: "materials", done: true }],
    ["/api/requests/lesson/view", {}],
    ["/api/admin/reset", { confirm: "RESET DEMO" }],
  ] as const;
  for (const [path, body] of operations) {
    const reply = deferred<Response>();
    t.mock.method(globalThis, "fetch", () => reply.promise);
    const writing = api(path, body);
    assert.equal(getPendingWriteCount(), 1, path);
    reply.reject(new TypeError("Failed to fetch"));
    await assert.rejects(writing, /Failed to fetch/);
    assert.equal(getPendingWriteCount(), 0, path);
  }
});

test("read-only requests do not block updates and unsubscribed listeners are released", async (t) => {
  const reply = deferred<Response>();
  t.mock.method(globalThis, "fetch", () =>
    reply.promise.then((response) => response.clone()),
  );
  let notifications = 0;
  const unsubscribe = subscribePendingWrites(() => notifications++);
  unsubscribe();
  const reading = api("/api/workspace");
  assert.equal(getPendingWriteCount(), 0);
  reply.resolve(Response.json({ lessons: [] }));
  await reading;
  await api("/api/profile", { name: "New name" }, "PATCH");
  assert.equal(notifications, 0);
  assert.equal(getPendingWriteCount(), 0);
});

test("a write stays pending until its response body is parsed", async (t) => {
  let complete!: () => void;
  const body = new ReadableStream({
    start(controller) {
      complete = () => {
        controller.enqueue(new TextEncoder().encode('{"ok":true}'));
        controller.close();
      };
    },
  });
  t.mock.method(globalThis, "fetch", async () => new Response(body));
  const writing = api("/api/profile", { name: "Updated" }, "PATCH");
  await Promise.resolve();
  assert.equal(getPendingWriteCount(), 1);
  complete();
  await writing;
  assert.equal(getPendingWriteCount(), 0);
});

test("an invalid request body cannot leave the update guard stuck", async () => {
  const body: { cyclic?: unknown } = {};
  body.cyclic = body;
  await assert.rejects(api("/api/profile", body, "PATCH"), TypeError);
  assert.equal(getPendingWriteCount(), 0);
});
