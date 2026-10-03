import { test, before } from "node:test";
import assert from "node:assert/strict";
import { handleApi } from "../server/service.ts";
import { testDatabase } from "./sqlite-d1.ts";
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
      db,
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
