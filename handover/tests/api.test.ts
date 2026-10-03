import { test, before } from "node:test";
import assert from "node:assert/strict";
import { handleApi } from "../server/service.ts";
import { testDatabase } from "./sqlite-d1.ts";
import { addDays } from "../shared/time.ts";
import type {
  User,
  Workspace,
  RequestInput,
  ChangeRequest,
} from "../shared/types.ts";

let db: D1Database;
const origin = "http://localhost:5173";
const config = {
  TEACHER_INVITE_CODE: "test-teacher-invitation",
  DEMO_MODE: "true",
};
class Client {
  cookie = "";
  readonly database: D1Database;
  constructor(database: D1Database = db) {
    this.database = database;
  }
  async call(path: string, method = "GET", body?: unknown) {
    const headers = new Headers({ Origin: origin });
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (this.cookie) headers.set("Cookie", this.cookie);
    const response = await handleApi(
      new Request(origin + "/api" + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      this.database,
      config,
    );
    const cookie = response.headers.get("Set-Cookie");
    if (cookie) this.cookie = cookie.split(";")[0];
    let data: Record<string, unknown> = {};
    if (response.headers.get("content-type")?.includes("application/json"))
      data = (await response.json()) as Record<string, unknown>;
    return { response, data };
  }
  async demo(role: string, teacherIndex = 0) {
    const result = await this.call("/auth/demo", "POST", {
      role,
      teacherIndex,
    });
    assert.equal(result.response.status, 200, JSON.stringify(result.data));
    return result.data.user as User;
  }
}
before(() => {
  db = testDatabase();
});
const fullHandover = {
  progress: "Quadratic equations, page 42",
  plan: "Solve two worked examples, then pair practice.",
  materials: [
    { title: "Practice worksheet", url: "https://example.org/worksheet" },
  ],
  assessment: "Bring the worksheet. Quiz postponed to Friday.",
  equipment: "Room whiteboard and projector",
  studentReminder: "Bring a calculator and ask for help when needed.",
  teacherNotes: "Offer a quiet space to anyone needing extra processing time.",
};

test("API: real teacher → recipient → student → admin workflow and security boundaries", async (t) => {
  const teacher = new Client(),
    recipient = new Client(),
    student = new Client(),
    admin = new Client();
  const original = await teacher.demo("teacher");
  const receiver = await recipient.demo("teacher", 1);
  const pupil = await student.demo("student");
  await admin.demo("admin");
  const workspace = (await teacher.call("/workspace"))
    .data as unknown as Workspace;
  const source = workspace.lessons.find(
    (l) =>
      l.teacherId === original.id &&
      l.classId === pupil.classId &&
      !l.changed &&
      !workspace.requests.some(
        (r) =>
          r.lessonId === l.id &&
          ["Pending", "Confirmed", "Completed"].includes(r.status),
      ),
  );
  assert.ok(
    source,
    "Seed must provide an editable lesson for the demo teacher and student class.",
  );
  let input: RequestInput = {
    lessonId: source.id,
    kind: "substitute",
    targetDate: source.date,
    targetPeriod: source.period,
    targetRoom: source.room,
    recipientId: receiver.id,
    reasonCategory: "medical",
    reason: "A medical appointment",
    handover: fullHandover,
  };
  let requestId = "";
  await t.test(
    "sessions persist and unauthenticated requests are rejected",
    async () => {
      assert.equal((await teacher.call("/auth/me")).response.status, 200);
      assert.equal(
        (await new Client().call("/workspace")).response.status,
        401,
      );
      assert.match(teacher.cookie, /=.+/);
    },
  );
  await t.test(
    "student only sees own class, never teacher notes or school user records",
    async () => {
      const sw = (await student.call("/workspace"))
        .data as unknown as Workspace;
      assert.ok(sw.lessons.every((l) => l.classId === pupil.classId));
      assert.ok(
        sw.requests.every(
          (r) => r.classId === pupil.classId && !r.handover.teacherNotes,
        ),
      );
      assert.equal((await student.call("/admin/users")).response.status, 403);
      assert.equal((await student.call("/admin/audit")).response.status, 403);
      assert.equal((await student.call("/admin/impact")).response.status, 403);
    },
  );
  await t.test(
    "teacher draft can be saved incomplete; backend prevents incomplete submission",
    async () => {
      const partial = { ...input, handover: { ...fullHandover, progress: "" } };
      const result = await teacher.call("/requests", "POST", partial);
      assert.equal(result.response.status, 200, JSON.stringify(result.data));
      requestId = (result.data.request as ChangeRequest).id;
      const rejected = await teacher.call(
        "/requests/" + requestId + "/submit",
        "POST",
        {},
      );
      assert.equal(
        rejected.response.status,
        422,
        JSON.stringify(rejected.data),
      );
    },
  );
  await t.test(
    "student cannot mutate requests, impersonate teacher, or reset demo",
    async () => {
      for (const [path, method, body] of [
        ["/requests", "POST", input],
        ["/requests/" + requestId, "PATCH", input],
        ["/requests/" + requestId + "/submit", "POST", {}],
        ["/requests/" + requestId + "/respond", "POST", { decision: "accept" }],
        ["/requests/" + requestId + "/status", "POST", { status: "Cancelled" }],
        [
          "/requests/" + requestId + "/supplements",
          "POST",
          { text: "Intrusion" },
        ],
        ["/admin/reset", "POST", { confirm: "RESET DEMO" }],
        ["/profile", "PATCH", { role: "admin" }],
      ] as const) {
        assert.ok(
          [403, 404].includes(
            (await student.call(path, method, body)).response.status,
          ),
          path,
        );
      }
    },
  );
  await t.test("another teacher cannot edit the original draft", async () => {
    assert.equal(
      (await recipient.call("/requests/" + requestId, "PATCH", input)).response
        .status,
      403,
    );
  });
  await t.test(
    "class timetable collision is detected and blocks submission",
    async () => {
      const occupied = workspace.lessons.find(
        (l) =>
          l.classId === source.classId &&
          l.id !== source.id &&
          l.date >= source.date &&
          !l.changed,
      );
      assert.ok(occupied);
      const move = {
        ...input,
        kind: "move",
        recipientId: original.id,
        targetDate: occupied.date,
        targetPeriod: occupied.period,
      };
      const conflicts = await teacher.call("/conflicts", "POST", move);
      assert.equal(conflicts.response.status, 200);
      assert.ok((conflicts.data.conflicts as unknown[]).length > 0);
      assert.equal(
        (await teacher.call("/requests/" + requestId, "PATCH", move)).response
          .status,
        200,
      );
      assert.equal(
        (await teacher.call("/requests/" + requestId + "/submit", "POST", {}))
          .response.status,
        409,
      );
    },
  );
  await t.test(
    "complete handover submits and only assigned recipient may respond",
    async () => {
      const conflicts = (await teacher.call("/conflicts", "POST", input)).data;
      if ((conflicts.conflicts as unknown[]).length) {
        // Keep the fixed receiving teacher, find one of the original teacher's
        // available lessons for this class rather than bypassing the detector.
        for (const candidate of workspace.lessons.filter(
          (l) =>
            l.teacherId === original.id &&
            l.classId === source.classId &&
            !l.changed &&
            !workspace.requests.some(
              (r) =>
                r.lessonId === l.id &&
                ["Pending", "Confirmed", "Completed"].includes(r.status),
            ),
        )) {
          const alternate = {
            ...input,
            lessonId: candidate.id,
            targetDate: candidate.date,
            targetPeriod: candidate.period,
            targetRoom: candidate.room,
          };
          const check = (await teacher.call("/conflicts", "POST", alternate))
            .data;
          if (!(check.conflicts as unknown[]).length) {
            input = alternate;
            break;
          }
        }
      }
      assert.equal(
        (await teacher.call("/requests/" + requestId, "PATCH", input)).response
          .status,
        200,
      );
      const submitted = await teacher.call(
        "/requests/" + requestId + "/submit",
        "POST",
        {},
      );
      assert.equal(
        submitted.response.status,
        200,
        JSON.stringify(submitted.data),
      );
      assert.equal((submitted.data.request as ChangeRequest).status, "Pending");
      assert.equal(
        (
          await teacher.call("/requests/" + requestId + "/respond", "POST", {
            decision: "accept",
          })
        ).response.status,
        403,
      );
    },
  );
  await t.test(
    "submitted handover is locked and receiving teacher can decline with a comment",
    async () => {
      assert.equal(
        (await teacher.call("/requests/" + requestId, "PATCH", input)).response
          .status,
        409,
      );
      assert.equal(
        (
          await recipient.call("/requests/" + requestId + "/respond", "POST", {
            decision: "decline",
            comment: "",
          })
        ).response.status,
        422,
      );
      const result = await recipient.call(
        "/requests/" + requestId + "/respond",
        "POST",
        { decision: "decline", comment: "Please add a warm-up exercise." },
      );
      assert.equal(result.response.status, 200);
      assert.equal((result.data.request as ChangeRequest).status, "Declined");
    },
  );
  await t.test(
    "original teacher edits declined request, resubmits, recipient confirms",
    async () => {
      input.handover.plan += " Begin with a warm-up exercise.";
      assert.equal(
        (await teacher.call("/requests/" + requestId, "PATCH", input)).response
          .status,
        200,
      );
      assert.equal(
        (await teacher.call("/requests/" + requestId + "/submit", "POST", {}))
          .response.status,
        200,
      );
      const confirmed = await recipient.call(
        "/requests/" + requestId + "/respond",
        "POST",
        { decision: "accept", comment: "Ready to teach." },
      );
      assert.equal(
        confirmed.response.status,
        200,
        JSON.stringify(confirmed.data),
      );
      assert.equal(
        (confirmed.data.request as ChangeRequest).status,
        "Confirmed",
      );
    },
  );
  await t.test(
    "student sees changed teacher, prepares tasks, and progress survives reload",
    async () => {
      const detail = await student.call("/requests/" + requestId);
      assert.equal(detail.response.status, 200);
      assert.equal(
        (detail.data.request as ChangeRequest).recipientId,
        receiver.id,
      );
      assert.equal(
        (detail.data.request as ChangeRequest).handover.teacherNotes,
        undefined,
      );
      assert.equal(
        (
          await student.call("/requests/" + requestId + "/todo", "POST", {
            key: "materials",
            done: true,
          })
        ).response.status,
        200,
      );
      assert.equal(
        (await student.call("/requests/" + requestId + "/view", "POST", {}))
          .response.status,
        200,
      );
      const refreshed = (await student.call("/requests/" + requestId)).data
        .request as ChangeRequest;
      assert.equal(refreshed.todo.materials, true);
      assert.equal(
        (
          await student.call("/requests/" + requestId + "/todo", "POST", {
            key: "invalid",
            done: true,
          })
        ).response.status,
        422,
      );
      const teacherDetail = (await teacher.call("/requests/" + requestId)).data
        .request as ChangeRequest;
      assert.ok(teacherDetail.viewedCount > 0);
    },
  );
  await t.test(
    "teacher supplements are timestamped and preserve locked original",
    async () => {
      const result = await teacher.call(
        "/requests/" + requestId + "/supplements",
        "POST",
        { text: "Extra practice is optional." },
      );
      assert.equal(result.response.status, 200);
      const detail = result.data.request as ChangeRequest;
      assert.ok(
        detail.supplements.some(
          (s) => s.text === "Extra practice is optional." && s.at,
        ),
      );
      assert.ok(detail.timeline.length >= 5);
    },
  );
  await t.test(
    "notifications are role scoped and marking read persists",
    async () => {
      const sw = (await student.call("/workspace"))
        .data as unknown as Workspace;
      assert.ok(sw.notifications.some((n) => n.requestId === requestId));
      assert.equal(
        (await student.call("/notifications/read", "POST", {})).response.status,
        200,
      );
      assert.ok(
        (
          (await student.call("/workspace")).data as unknown as Workspace
        ).notifications.every((n) => n.read),
      );
    },
  );
  await t.test(
    "admin has complete audit and aggregate records; calendar downloads valid ICS",
    async () => {
      const audit = await admin.call("/admin/audit");
      assert.equal(audit.response.status, 200);
      assert.ok(
        (audit.data.events as { entityId: string }[]).some(
          (e) => e.entityId === requestId,
        ),
      );
      assert.equal((await admin.call("/admin/impact")).response.status, 200);
      const ics = await student.call("/calendar");
      assert.equal(ics.response.status, 200);
      assert.match(await ics.response.text(), /BEGIN:VCALENDAR/);
    },
  );
  await t.test("cross-origin mutations are rejected", async () => {
    const response = await handleApi(
      new Request(origin + "/api/profile", {
        method: "PATCH",
        headers: {
          Cookie: teacher.cookie,
          Origin: "https://evil.example",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Attacker" }),
      }),
      db,
      config,
    );
    assert.equal(response.status, 403);
  });
});

test("API: registration, teacher invitation, recovery, profiles and reset isolation", async (t) => {
  const person = new Client(),
    teacher = new Client(),
    admin = new Client();
  await admin.demo("admin");
  const classes = (
    (await admin.call("/workspace")).data as unknown as Workspace
  ).classes;
  const email = "actual-registration@example.org";
  let recovery = "";
  await t.test(
    "admin registration and fake teacher registrations fail",
    async () => {
      assert.equal(
        (
          await person.call("/auth/register", "POST", {
            email: "fakeadmin@example.org",
            password: "Correct-Horse-2026",
            name: "Fake admin",
            role: "admin",
          })
        ).response.status,
        422,
      );
      assert.ok(
        [403, 422].includes(
          (
            await teacher.call("/auth/register", "POST", {
              email: "faketeacher@example.org",
              password: "Correct-Horse-2026",
              name: "Fake teacher",
              role: "teacher",
              subjects: ["Math"],
              inviteCode: "wrong",
            })
          ).response.status,
        ),
      );
    },
  );
  await t.test(
    "student registers with class and receives a private recovery code",
    async () => {
      const result = await person.call("/auth/register", "POST", {
        email,
        password: "Correct-Horse-2026",
        name: "New Student",
        role: "student",
        classId: classes[0].id,
      });
      assert.equal(result.response.status, 200, JSON.stringify(result.data));
      recovery = result.data.recoveryCode as string;
      assert.ok(recovery?.length >= 20);
      assert.equal((result.data.user as User).role, "student");
      assert.equal((result.data.user as User).isDemo, false);
    },
  );
  await t.test("profile updates persist and cannot escalate role", async () => {
    const result = await person.call("/profile", "PATCH", {
      name: "Updated Student",
    });
    assert.equal(result.response.status, 200);
    assert.equal((result.data.user as User).name, "Updated Student");
    assert.equal(
      (await person.call("/profile", "PATCH", { role: "admin" })).response
        .status,
      403,
    );
  });
  await t.test(
    "recovery rejects bad tokens and rotates code while revoking old session",
    async () => {
      const anon = new Client();
      assert.ok(
        [400, 401, 403, 422].includes(
          (
            await anon.call("/auth/reset", "POST", {
              email,
              recoveryCode: "not-my-code",
              password: "Another-Horse-2026",
            })
          ).response.status,
        ),
      );
      const recovered = await anon.call("/auth/reset", "POST", {
        email,
        recoveryCode: recovery,
        password: "Another-Horse-2026",
      });
      assert.equal(
        recovered.response.status,
        200,
        JSON.stringify(recovered.data),
      );
      assert.ok(recovered.data.recoveryCode !== recovery);
      assert.equal((await person.call("/auth/me")).response.status, 401);
      assert.ok(
        [400, 401, 403, 422].includes(
          (
            await anon.call("/auth/reset", "POST", {
              email,
              recoveryCode: recovery,
              password: "Yet-Another-Horse-2026",
            })
          ).response.status,
        ),
      );
      assert.equal(
        (
          await person.call("/auth/login", "POST", {
            email,
            password: "Another-Horse-2026",
          })
        ).response.status,
        200,
      );
    },
  );
  await t.test("admin cannot disable their own account", async () => {
    const current = (await admin.call("/auth/me")).data.user as User;
    assert.ok(
      [400, 403, 422].includes(
        (
          await admin.call("/admin/users/" + current.id, "PATCH", {
            active: false,
          })
        ).response.status,
      ),
    );
  });
  await t.test(
    "reset restores three demo roles and preserves real registrations",
    async () => {
      const reset = await admin.call("/admin/reset", "POST", {
        confirm: "RESET DEMO",
      });
      assert.equal(reset.response.status, 200, JSON.stringify(reset.data));
      for (const role of ["student", "teacher", "admin"])
        assert.equal(
          (await new Client().call("/auth/demo", "POST", { role })).response
            .status,
          200,
        );
      assert.equal(
        (
          await person.call("/auth/login", "POST", {
            email,
            password: "Another-Horse-2026",
          })
        ).response.status,
        200,
      );
    },
  );
  await t.test("logout invalidates server session", async () => {
    assert.equal(
      (await person.call("/auth/logout", "POST", {})).response.status,
      200,
    );
    assert.equal((await person.call("/auth/me")).response.status, 401);
  });
});

test("API: concurrent submissions cannot reserve one slot twice", async () => {
  const isolated = testDatabase();
  async function call(
    cookie: string,
    path: string,
    method = "GET",
    body?: unknown,
  ) {
    const headers = new Headers({ Origin: origin });
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (cookie) headers.set("Cookie", cookie);
    const response = await handleApi(
      new Request(origin + "/api" + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      isolated,
      config,
    );
    const setCookie =
      response.headers.get("Set-Cookie")?.split(";")[0] ?? cookie;
    const data = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? ((await response.json()) as Record<string, unknown>)
      : {};
    return { response, data, cookie: setCookie };
  }
  const teacher = await call("", "/auth/demo", "POST", { role: "teacher" });
  const workspace = (await call(teacher.cookie, "/workspace"))
    .data as unknown as Workspace;
  const user = teacher.data.user as User;
  const lessons = workspace.lessons
    .filter(
      (lesson) =>
        lesson.teacherId === user.id && lesson.classId && !lesson.changed,
    )
    .slice(0, 2);
  assert.equal(lessons.length, 2);
  const target = {
    targetDate: lessons[0].date,
    targetPeriod: 6,
    targetRoom: "A-201",
  };
  const handover = fullHandover;
  const drafts = [];
  for (const lesson of lessons) {
    const draft = await call(teacher.cookie, "/requests", "POST", {
      lessonId: lesson.id,
      kind: "move",
      ...target,
      recipientId: user.id,
      reasonCategory: "meeting",
      reason: "Department meeting",
      handover,
    });
    assert.equal(draft.response.status, 200, JSON.stringify(draft.data));
    drafts.push((draft.data.request as ChangeRequest).id);
  }
  const results = await Promise.all(
    drafts.map((id) =>
      call(teacher.cookie, "/requests/" + id + "/submit", "POST", {}),
    ),
  );
  const statuses = results.map((result) => result.response.status).sort();
  assert.deepEqual(statuses, [200, 409]);
});

test("API: a one-lesson legacy school repairs atomically without replacing accounts or edited rows", async () => {
  const isolated = testDatabase();
  const teacher = new Client(isolated),
    real = new Client(isolated);
  await teacher.demo("teacher");
  assert.equal(
    (await teacher.call("/profile", "PATCH", { name: "Edited legacy teacher" }))
      .response.status,
    200,
  );
  const registered = await real.call("/auth/register", "POST", {
    email: `legacy-${crypto.randomUUID()}@example.org`,
    password: `Legacy-${crypto.randomUUID()}`,
    name: "Legacy ordinary teacher",
    role: "teacher",
    subjects: ["Math"],
    inviteCode: config.TEACHER_INVITE_CODE,
  });
  assert.equal(registered.response.status, 200);
  const realId = (registered.data.user as User).id;
  const kept = await isolated
    .prepare(
      "SELECT id FROM lessons ORDER BY base_date, class_id, base_period LIMIT 1",
    )
    .first<{ id: string }>();
  assert.ok(kept);
  await isolated.batch([
    ...[
      "slot_locks",
      "timeline",
      "notifications",
      "supplements",
      "todos",
      "views",
      "requests",
    ].map((table) => isolated.prepare(`DELETE FROM ${table}`)),
    isolated.prepare("DELETE FROM lessons WHERE id != ?").bind(kept.id),
    isolated
      .prepare("UPDATE lessons SET room = 'Edited retained room' WHERE id = ?")
      .bind(kept.id),
    isolated.prepare("DELETE FROM meta WHERE key = 'seed_revision'"),
    isolated.prepare(
      "INSERT INTO meta (key, value) VALUES ('seeded', '1') ON CONFLICT(key) DO UPDATE SET value = '1'",
    ),
  ]);
  async function fingerprint(table: string) {
    return JSON.stringify(
      (await isolated.prepare(`SELECT * FROM ${table} ORDER BY 1`).all())
        .results,
    );
  }
  const preserved = new Map<string, string>();
  for (const table of ["users", "sessions", "classes", "lessons"])
    preserved.set(table, await fingerprint(table));
  const credentials = JSON.stringify(
    await isolated
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(realId)
      .first(),
  );
  await isolated.exec(
    "CREATE TRIGGER product_legacy_seed_fault BEFORE INSERT ON lessons BEGIN SELECT RAISE(ABORT, 'PRODUCT_LEGACY_REPAIR_FAULT'); END",
  );
  const failed = await real.call("/auth/me");
  assert.ok(
    [409, 500].includes(failed.response.status),
    "The injected missing-lesson INSERT must fail, not mark the partial school ready.",
  );
  for (const [table, before] of preserved)
    assert.ok(
      (await fingerprint(table)) === before,
      `Failed repair must roll back ${table} without disclosing credentials.`,
    );
  assert.equal(
    await isolated
      .prepare("SELECT value FROM meta WHERE key = 'seed_revision'")
      .first(),
    null,
  );
  assert.equal(
    (
      await isolated
        .prepare("SELECT COUNT(*) AS n FROM requests")
        .first<{ n: number }>()
    )?.n,
    0,
  );
  await isolated.exec("DROP TRIGGER product_legacy_seed_fault");
  const results = await Promise.all(
    Array.from({ length: 4 }, () => {
      const client = new Client(isolated);
      client.cookie = real.cookie;
      return client.call("/auth/me");
    }),
  );
  assert.ok(
    results.every((result) => result.response.status === 200),
    "Every parallel legacy caller must see the complete repaired school.",
  );
  for (const [table, expected] of [
    ["classes", 3],
    ["users", 46],
    ["lessons", 120],
    ["requests", 7],
    ["timeline", 14],
    ["notifications", 14],
    ["slot_locks", 4],
  ] as const) {
    assert.equal(
      (
        await isolated
          .prepare(`SELECT COUNT(*) AS n FROM ${table}`)
          .first<{ n: number }>()
      )?.n,
      expected,
      `${table} must be complete without duplicate seed effects.`,
    );
  }
  for (const table of ["users", "sessions", "classes"])
    assert.ok(
      (await fingerprint(table)) === preserved.get(table),
      `Successful repair preserves established ${table}.`,
    );
  assert.equal(
    (
      await isolated
        .prepare("SELECT room FROM lessons WHERE id = ?")
        .bind(kept.id)
        .first<{ room: string }>()
    )?.room,
    "Edited retained room",
  );
  assert.ok(
    JSON.stringify(
      await isolated
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(realId)
        .first(),
    ) === credentials,
  );
  assert.equal(
    (
      await isolated
        .prepare("SELECT value FROM meta WHERE key = 'seed_complete'")
        .first<{ value: string }>()
    )?.value,
    "1",
  );
  const history = await fingerprint("timeline");
  assert.equal((await real.call("/auth/me")).response.status, 200);
  assert.equal(
    await fingerprint("timeline"),
    history,
    "Completed repair must be idempotent.",
  );

  // R02 could fail after Friday Math existed but before sample requests were
  // inserted. Its users could then establish a legitimate completed move.
  const partial = testDatabase();
  const owner = new Client(partial);
  await owner.demo("teacher");
  const sample = await partial
    .prepare(
      "SELECT lesson_id FROM requests WHERE id = 'demo-request-confirmed'",
    )
    .first<{ lesson_id: string }>();
  assert.ok(sample);
  await partial.batch([
    ...[
      "slot_locks",
      "timeline",
      "notifications",
      "supplements",
      "todos",
      "views",
      "requests",
    ].map((table) => partial.prepare(`DELETE FROM ${table}`)),
    partial.prepare(
      "DELETE FROM lessons WHERE id NOT IN (SELECT id FROM lessons ORDER BY rowid LIMIT 20)",
    ),
    partial
      .prepare(
        "UPDATE lessons SET teacher_id = base_teacher_id, date = base_date, period = base_period, room = base_room WHERE id = ?",
      )
      .bind(sample.lesson_id),
  ]);
  assert.equal(
    (
      await partial
        .prepare("SELECT COUNT(*) AS n FROM lessons")
        .first<{ n: number }>()
    )?.n,
    20,
  );
  const source = await partial
    .prepare("SELECT * FROM lessons WHERE id = ?")
    .bind(sample.lesson_id)
    .first<{ date: string; teacher_id: string; room: string }>();
  assert.ok(source);
  const saved = await owner.call("/requests", "POST", {
    lessonId: sample.lesson_id,
    kind: "move",
    targetDate: addDays(source.date, 7),
    targetPeriod: 5,
    targetRoom: "Established Friday room",
    recipientId: source.teacher_id,
    reasonCategory: "other",
    reason: "Established arrangement before the seed upgrade.",
    handover: fullHandover,
  });
  assert.equal(saved.response.status, 200);
  const establishedId = (saved.data.request as ChangeRequest).id;
  assert.equal(
    (await owner.call(`/requests/${establishedId}/submit`, "POST", {})).response
      .status,
    200,
  );
  assert.equal(
    (
      await owner.call(`/requests/${establishedId}/respond`, "POST", {
        decision: "accept",
        comment: "Established move.",
      })
    ).response.status,
    200,
  );
  assert.equal(
    (
      await owner.call(`/requests/${establishedId}/status`, "POST", {
        status: "Completed",
      })
    ).response.status,
    200,
  );
  assert.equal(
    (
      await owner.call(`/requests/${establishedId}/supplements`, "POST", {
        text: "Keep the established teaching note.",
      })
    ).response.status,
    200,
  );
  const lessonsBefore = (
    await partial.prepare("SELECT * FROM lessons ORDER BY id").all()
  ).results;
  const establishedBefore = JSON.stringify(
    await partial
      .prepare("SELECT * FROM requests WHERE id = ?")
      .bind(establishedId)
      .first(),
  );
  const relationsBefore = new Map<string, string>();
  for (const table of ["timeline", "supplements", "notifications"]) {
    relationsBefore.set(
      table,
      JSON.stringify(
        (
          await partial
            .prepare(`SELECT * FROM ${table} WHERE request_id = ? ORDER BY id`)
            .bind(establishedId)
            .all()
        ).results,
      ),
    );
  }
  const lessonBefore = await partial
    .prepare("SELECT * FROM lessons WHERE id = ?")
    .bind(sample.lesson_id)
    .first();
  assert.equal(
    lessonBefore?.period,
    5,
    "Negative control must establish a real accepted and completed different arrangement.",
  );
  assert.notEqual(
    lessonBefore?.date,
    source.date,
    "The established move must also exercise a changed date.",
  );
  await partial.batch([
    partial.prepare("DELETE FROM meta WHERE key = 'seed_revision'"),
    partial.prepare(
      "INSERT INTO meta (key, value) VALUES ('seeded', '1') ON CONFLICT(key) DO UPDATE SET value = '1'",
    ),
  ]);
  assert.equal((await owner.call("/auth/me")).response.status, 200);
  for (const before of lessonsBefore) {
    assert.deepEqual(
      await partial
        .prepare("SELECT * FROM lessons WHERE id = ?")
        .bind(String(before.id))
        .first(),
      before,
      "Missing sample repair must preserve each already established lesson row.",
    );
  }
  assert.ok(
    JSON.stringify(
      await partial
        .prepare("SELECT * FROM requests WHERE id = ?")
        .bind(establishedId)
        .first(),
    ) === establishedBefore,
  );
  for (const [table, before] of relationsBefore) {
    assert.equal(
      JSON.stringify(
        (
          await partial
            .prepare(`SELECT * FROM ${table} WHERE request_id = ? ORDER BY id`)
            .bind(establishedId)
            .all()
        ).results,
      ),
      before,
      `Existing ${table} must survive partial repair.`,
    );
  }
  const repairedSample = await partial
    .prepare("SELECT * FROM requests WHERE id = 'demo-request-confirmed'")
    .first();
  assert.ok(repairedSample);
  assert.equal(
    repairedSample.status,
    "Cancelled",
    "A stale demonstration must not claim to confirm or replace an established arrangement.",
  );
  assert.equal(repairedSample.original_teacher_id, lessonBefore?.teacher_id);
  assert.equal(repairedSample.original_date, lessonBefore?.date);
  assert.equal(repairedSample.original_period, lessonBefore?.period);
  assert.equal(repairedSample.original_room, lessonBefore?.room);
  assert.equal(repairedSample.target_date, lessonBefore?.date);
  assert.equal(repairedSample.target_period, lessonBefore?.period);
  assert.equal(repairedSample.target_room, lessonBefore?.room);
  assert.equal(
    (
      await partial
        .prepare(
          "SELECT COUNT(*) AS n FROM slot_locks WHERE request_id = 'demo-request-confirmed'",
        )
        .first<{ n: number }>()
    )?.n,
    0,
  );
  assert.equal(
    (
      await partial
        .prepare(
          "SELECT COUNT(*) AS n FROM timeline WHERE request_id = 'demo-request-confirmed' AND action IN ('submitted','confirmed','completed')",
        )
        .first<{ n: number }>()
    )?.n,
    0,
  );
  assert.equal(
    (
      await partial
        .prepare("SELECT COUNT(*) AS n FROM lessons")
        .first<{ n: number }>()
    )?.n,
    120,
  );
  assert.equal(
    (
      await partial
        .prepare("SELECT COUNT(*) AS n FROM requests")
        .first<{ n: number }>()
    )?.n,
    8,
  );
});

test("API: only exact known demo worksheet stubs are repaired, preserving custom URLs and all other handover fields", async () => {
  const isolated = testDatabase();
  const real = new Client(isolated);
  await new Client(isolated).demo("teacher");
  const registered = await real.call("/auth/register", "POST", {
    email: `material-${crypto.randomUUID()}@example.org`,
    password: `Material-${crypto.randomUUID()}`,
    name: "Ordinary worksheet teacher",
    role: "teacher",
    subjects: ["Math"],
    inviteCode: config.TEACHER_INVITE_CODE,
  });
  assert.equal(registered.response.status, 200);
  const realId = (registered.data.user as User).id;
  const source = await isolated
    .prepare("SELECT date FROM lessons ORDER BY date DESC LIMIT 1")
    .first<{ date: string }>();
  assert.ok(source);
  const lessonId = `ordinary-material-${crypto.randomUUID()}`;
  await isolated
    .prepare(
      "INSERT INTO lessons (id,class_id,subject,teacher_id,date,period,room,base_teacher_id,base_date,base_period,base_room,is_demo) VALUES (?, 'demo-class-7a', 'Math', ?, ?, 6, 'Custom', ?, ?, 6, 'Custom', 0)",
    )
    .bind(lessonId, realId, source.date, realId, source.date)
    .run();
  const draft = await real.call("/requests", "POST", {
    lessonId,
    kind: "substitute",
    targetDate: source.date,
    targetPeriod: 6,
    targetRoom: "Custom",
    recipientId: "demo-teacher-1",
    reasonCategory: "other",
    reason: "Ordinary teacher selected this URL.",
    handover: fullHandover,
  });
  assert.equal(draft.response.status, 200);
  const ordinaryId = (draft.data.request as ChangeRequest).id;
  const ordinaryBefore = JSON.stringify(
    await isolated
      .prepare("SELECT * FROM requests WHERE id = ?")
      .bind(ordinaryId)
      .first(),
  );
  const realBefore = JSON.stringify(
    await isolated
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(realId)
      .first(),
  );
  const sessionBefore = JSON.stringify(
    (
      await isolated
        .prepare("SELECT * FROM sessions WHERE user_id = ?")
        .bind(realId)
        .all()
    ).results,
  );
  const known = {
    ...fullHandover,
    progress: "Edited progress retained",
    teacherNotes: "Edited private note retained",
    materials: [
      { title: "Practice worksheet", url: "https://example.org/worksheet" },
      {
        title: "Teacher custom additional sheet",
        url: "https://example.org/worksheet",
      },
    ],
  };
  const editedMaterial = {
    ...fullHandover,
    materials: [
      {
        title: "Teacher renamed worksheet",
        url: "https://example.org/worksheet",
      },
    ],
  };
  await isolated.batch([
    isolated
      .prepare(
        "UPDATE requests SET handover_json = ? WHERE id = 'demo-request-confirmed'",
      )
      .bind(JSON.stringify(known)),
    isolated
      .prepare(
        "UPDATE requests SET handover_json = ? WHERE id = 'demo-request-pending-maya'",
      )
      .bind(JSON.stringify(editedMaterial)),
    isolated.prepare("DELETE FROM meta WHERE key = 'seed_revision'"),
  ]);
  const editedBefore = JSON.stringify(
    await isolated
      .prepare("SELECT * FROM requests WHERE id = 'demo-request-pending-maya'")
      .first(),
  );
  assert.equal((await real.call("/auth/me")).response.status, 200);
  const repaired = await isolated
    .prepare(
      "SELECT handover_json FROM requests WHERE id = 'demo-request-confirmed'",
    )
    .first<{ handover_json: string }>();
  assert.ok(repaired);
  assert.deepEqual(JSON.parse(repaired.handover_json), {
    ...known,
    materials: [
      { title: "Practice worksheet", url: "/worksheets/class-practice.txt" },
      known.materials[1],
    ],
  });
  assert.ok(
    JSON.stringify(
      await isolated
        .prepare("SELECT * FROM requests WHERE id = ?")
        .bind(ordinaryId)
        .first(),
    ) === ordinaryBefore,
    "An ordinary teacher's same title and URL are free input and must not be rewritten.",
  );
  assert.ok(
    JSON.stringify(
      await isolated
        .prepare(
          "SELECT * FROM requests WHERE id = 'demo-request-pending-maya'",
        )
        .first(),
    ) === editedBefore,
    "A renamed material in a known demo request is user input and must remain unchanged.",
  );
  assert.ok(
    JSON.stringify(
      await isolated
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(realId)
        .first(),
    ) === realBefore,
  );
  assert.ok(
    JSON.stringify(
      (
        await isolated
          .prepare("SELECT * FROM sessions WHERE user_id = ?")
          .bind(realId)
          .all()
      ).results,
    ) === sessionBefore,
  );
  const rowsBefore = JSON.stringify(
    (await isolated.prepare("SELECT * FROM requests ORDER BY id").all())
      .results,
  );
  assert.equal((await real.call("/auth/me")).response.status, 200);
  assert.equal(
    JSON.stringify(
      (await isolated.prepare("SELECT * FROM requests ORDER BY id").all())
        .results,
    ),
    rowsBefore,
    "Material repair must be idempotent.",
  );
});
