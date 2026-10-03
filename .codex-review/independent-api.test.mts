import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { reviewDatabase } from './review-d1.mts';
import type { ChangeRequest, Handover, RequestInput, Role, User, Workspace } from '../handover/shared/types.ts';
import { addDays, defaultSchoolMonday, mondayOnOrBefore, schoolToday } from '../handover/shared/time.ts';

// Reviewer-owned integration tests. Run only after Cursor finishes the service.
// No product files, runtime database, credentials, or external services are used.
// Every authentication and authorization assertion crosses the real API boundary.
const origin = 'http://localhost:5173';
const config = { TEACHER_INVITE_CODE: 'independent-review-invitation', DEMO_MODE: 'true' };
type Handler = (request: Request, database: D1Database, serviceConfig: typeof config) => Promise<Response>;
type ApiResult = { status: number; body: Record<string, unknown>; raw: string; headers: Headers };
let handlerPromise: Promise<Handler> | undefined;
function handler(): Promise<Handler> {
  // Dynamic loading lets this file exist while Cursor is still authoring service.ts.
  handlerPromise ??= import(new URL('../handover/server/service.ts', import.meta.url).href).then(module => {
    assert.equal(typeof module.handleApi, 'function', 'service.ts must export the API contract handleApi(request, database, config).');
    return module.handleApi as Handler;
  });
  return handlerPromise;
}

class Client {
  cookie = '';
  user?: User;
  database: D1Database;
  constructor(database: D1Database, cookie = '') { this.database = database; this.cookie = cookie; }
  async call(path: string, method = 'GET', body?: unknown, options: { cookie?: string; origin?: string } = {}): Promise<ApiResult> {
    const headers = new Headers({ Origin: options.origin ?? origin });
    const cookie = options.cookie ?? this.cookie;
    if (cookie) headers.set('Cookie', cookie);
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await (await handler())(new Request(origin + '/api' + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    }), this.database, config);
    const setCookie = response.headers.get('Set-Cookie');
    if (setCookie) this.cookie = setCookie.split(';')[0];
    const raw = await response.text();
    let data: Record<string, unknown> = {};
    if (response.headers.get('content-type')?.includes('application/json')) {
      try { data = JSON.parse(raw) as Record<string, unknown>; }
      catch { assert.fail(`${method} ${path}: response declares JSON but cannot be parsed.`); }
    }
    // Callers inspect raw responses for information leaks; failure messages never print cookies.
    return { status: response.status, body: data, raw, headers: response.headers };
  }
  async demo(role: Role, teacherIndex = 0): Promise<User> {
    const result = await this.call('/auth/demo', 'POST', { role, teacherIndex });
    success(result, `demo login (${role}, teacherIndex=${teacherIndex})`);
    assert.ok(this.cookie, `${role} demo login must issue a real session cookie.`);
    assert.match(result.headers.get('Set-Cookie') ?? '', /HttpOnly/i, 'Session cookie must be HttpOnly.');
    this.user = result.body.user as User;
    assert.equal(this.user.role, role, 'Demo role must match the authenticated database user.');
    return this.user;
  }
}

function detail(result: ApiResult): string {
  return `HTTP ${result.status}; error=${String(result.body.error ?? '(none)')}; fields=${JSON.stringify(result.body.fields ?? [])}`;
}
function success(result: ApiResult, context: string): void {
  assert.ok(result.status >= 200 && result.status < 300, `${context}: expected success; ${detail(result)}`);
}
function denied(result: ApiResult, statuses: number[], context: string): void {
  assert.ok(statuses.includes(result.status), `${context}: expected HTTP ${statuses.join('/')}; ${detail(result)}`);
  assert.equal(typeof result.body.error, 'string', `${context}: failure must return a stable error code.`);
}
function requestOf(result: ApiResult, context: string): ChangeRequest {
  success(result, context);
  const request = result.body.request as ChangeRequest;
  assert.ok(request?.id && request.status, `${context}: response must contain a request ID and status.`);
  return request;
}

const privateMarker = 'REVIEW_TEACHER_ONLY_MARKER_7c3b';
function handover(): Handover {
  return {
    progress: 'Chapter 4, pages 40–42.',
    plan: 'Worked examples, pair practice, and an exit ticket.',
    materials: [{ title: 'Practice worksheet', url: 'https://example.org/reviewer-worksheet' }],
    assessment: 'Bring last week’s worksheet; quiz moves to Friday.',
    equipment: 'Whiteboard and projector.',
    studentReminder: 'Bring a calculator and your workbook.',
    teacherNotes: privateMarker,
  };
}
type Fixture = ReturnType<typeof reviewDatabase> & {
  teacher: Client; recipient: Client; student: Client; admin: Client;
  original: User; receiver: User; pupil: User; workspace: Workspace;
};
async function fixture(t: TestContext): Promise<Fixture> {
  const isolated = reviewDatabase();
  t.after(isolated.close);
  const teacher = new Client(isolated.database), recipient = new Client(isolated.database);
  const student = new Client(isolated.database), admin = new Client(isolated.database);
  // Seed initialization is sequential; it is not part of the concurrency cases.
  const original = await teacher.demo('teacher', 0);
  const receiver = await recipient.demo('teacher', 1);
  const pupil = await student.demo('student');
  await admin.demo('admin');
  const result = await teacher.call('/workspace');
  success(result, 'source workspace');
  return { ...isolated, teacher, recipient, student, admin, original, receiver, pupil, workspace: result.body as unknown as Workspace };
}
async function sourceInput(f: Fixture): Promise<RequestInput> {
  const workspaceResult = await f.teacher.call('/workspace');
  success(workspaceResult, 'refresh source workspace');
  const workspace = workspaceResult.body as unknown as Workspace;
  const candidates = workspace.lessons.filter(lesson => lesson.teacherId === f.original.id && lesson.classId === f.pupil.classId
    && !lesson.changed && !workspace.requests.some(request => request.lessonId === lesson.id && ['Draft', 'Pending', 'Confirmed', 'Declined', 'Completed'].includes(request.status)));
  for (const source of candidates) {
    const input: RequestInput = { lessonId: source.id, kind: 'substitute', targetDate: source.date, targetPeriod: source.period,
      targetRoom: source.room, recipientId: f.receiver.id, reasonCategory: 'medical', reason: 'Reviewer appointment fixture.', handover: handover() };
    const checked = await f.teacher.call('/conflicts', 'POST', input);
    success(checked, `source conflict check ${source.id}`);
    if (Array.isArray(checked.body.conflicts) && checked.body.conflicts.length === 0) return input;
  }
  assert.fail('Seed must have an unrequested lesson owned by demo teacher A, in the demo student’s class, when recipient B is free. No authorization rule is bypassed to create the normal-flow fixture.');
}
async function draft(client: Client, input: RequestInput): Promise<ChangeRequest> {
  const result = requestOf(await client.call('/requests', 'POST', input), `create draft for ${input.lessonId}`);
  assert.equal(result.status, 'Draft', 'Creation must save Draft, not automatically submit.');
  return result;
}
async function submit(client: Client, requestId: string): Promise<ChangeRequest> {
  const result = requestOf(await client.call(`/requests/${requestId}/submit`, 'POST', {}), `submit ${requestId}`);
  assert.equal(result.status, 'Pending');
  return result;
}
async function accept(client: Client, requestId: string): Promise<ChangeRequest> {
  const result = requestOf(await client.call(`/requests/${requestId}/respond`, 'POST', { decision: 'accept', comment: 'Prepared to teach.' }), `accept ${requestId}`);
  assert.equal(result.status, 'Confirmed');
  return result;
}
function count(f: Fixture, sql: string, values: (string | number)[] = []): number {
  return Number(f.connection.prepare(sql).get(...values)?.n ?? 0);
}
function lessonRow(f: Fixture, lessonId: string) { return f.connection.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId); }
function schedule(f: Fixture, lessonId: string) {
  const row = lessonRow(f, lessonId);
  assert.ok(row, `Lesson ${lessonId} must still exist.`);
  return { teacherId: row.teacher_id, date: row.date, period: row.period, room: row.room };
}
function otherClass(f: Fixture): string {
  const id = f.workspace.classes.find(item => item.id !== f.pupil.classId)?.id;
  assert.ok(id, 'Seed must include a second class for cross-class checks.');
  return id;
}

// Curriculum assignments are controlled database fixtures. Authentication,
// request ownership, recipient decisions, and student actions still use APIs.
function insertLesson(f: Fixture, options: { teacherId?: string; classId?: string; date?: string; period?: number; room?: string; isDemo?: number } = {}): string {
  const id = `review-lesson-${crypto.randomUUID()}`;
  const teacherId = options.teacherId ?? f.original.id, classId = options.classId ?? f.pupil.classId!;
  const date = options.date ?? addDays(defaultSchoolMonday(), 14), period = options.period ?? 1;
  const room = options.room ?? `Review room ${id.slice(-8)}`;
  f.connection.prepare(`INSERT INTO lessons (id, class_id, subject, teacher_id, date, period, room, base_teacher_id, base_date, base_period, base_room, is_demo)
    VALUES (?, ?, 'Math', ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, classId, teacherId, date, period, room, teacherId, date, period, room, options.isDemo ?? 0);
  return id;
}
function inputFor(f: Fixture, lessonId: string, kind: 'move' | 'substitute' = 'substitute', target?: { date: string; period: number; room: string }): RequestInput {
  const row = lessonRow(f, lessonId);
  assert.ok(row, `Fixture lesson ${lessonId} must exist.`);
  return { lessonId, kind, targetDate: target?.date ?? String(row.date), targetPeriod: target?.period ?? Number(row.period),
    targetRoom: target?.room ?? String(row.room), recipientId: kind === 'move' ? String(row.teacher_id) : f.receiver.id,
    reasonCategory: 'other', reason: 'Independent integration review.', handover: handover() };
}
async function register(f: Fixture, role: 'student' | 'teacher', classId = f.pupil.classId!): Promise<{ client: Client; user: User; recovery: string; email: string; password: string }> {
  const client = new Client(f.database);
  const email = `review-${crypto.randomUUID()}@example.org`, password = `Review-${crypto.randomUUID()}`;
  const result = await client.call('/auth/register', 'POST', { email, password, name: `Reviewer ${role}`, role,
    ...(role === 'student' ? { classId } : { subjects: ['Math'], inviteCode: config.TEACHER_INVITE_CODE }) });
  success(result, `normal ${role} registration`);
  const user = result.body.user as User;
  assert.equal(user.role, role);
  assert.equal(user.isDemo, false, 'Normal registrations must not be tagged as demo.');
  assert.ok(typeof result.body.recoveryCode === 'string' && result.body.recoveryCode.length >= 20, 'Registration must return a recovery code once.');
  return { client, user, recovery: result.body.recoveryCode as string, email, password };
}

test('review: every one of seven required handover fields is enforced by direct submit API', async t => {
  const f = await fixture(t), input = await sourceInput(f);
  for (const key of ['progress', 'plan', 'materials', 'assessment', 'equipment', 'studentReminder', 'teacherNotes'] as const) {
    await t.test(`missing ${key}`, async () => {
      const incomplete = handover();
      if (key === 'materials') incomplete.materials = [];
      else incomplete[key] = '   ';
      const saved = await draft(f.teacher, { ...input, handover: incomplete });
      const result = await f.teacher.call(`/requests/${saved.id}/submit`, 'POST', {});
      denied(result, [400, 422], `blank ${key} direct submit`);
      assert.ok(Array.isArray(result.body.fields) && result.body.fields.includes(key), `Missing ${key} must be identified explicitly.`);
      assert.equal(f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(saved.id)?.status, 'Draft');
      assert.equal(count(f, 'SELECT COUNT(*) AS n FROM slot_locks WHERE request_id = ?', [saved.id]), 0, `Rejected ${key} submission must not reserve a slot.`);
      success(await f.teacher.call(`/requests/${saved.id}/status`, 'POST', { status: 'Cancelled' }), `clean up rejected ${key} draft`);
    });
  }
});

test('review: unsafe material URLs cannot be saved or submitted', async t => {
  const f = await fixture(t), input = await sourceInput(f);
  for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd']) {
    const result = await f.teacher.call('/requests', 'POST', { ...input, handover: { ...handover(), materials: [{ title: 'Unsafe material', url }] } });
    denied(result, [400, 422], `unsafe URL protocol ${url.split(':')[0]}`);
  }
});

test('review: teacher-only collision is blocked by conflicts and direct submit', async t => {
  const f = await fixture(t), date = addDays(defaultSchoolMonday(), 14);
  const source = insertLesson(f, { date, period: 1 });
  insertLesson(f, { teacherId: f.original.id, classId: otherClass(f), date, period: 2 });
  const input = inputFor(f, source, 'move', { date, period: 2, room: 'Review separate room' });
  const report = await f.teacher.call('/conflicts', 'POST', input);
  success(report, 'teacher-only conflict report');
  assert.ok((report.body.conflicts as { kind: string }[]).some(item => item.kind === 'teacher'), 'Collision must explain the teacher conflict, not require a class collision.');
  const saved = await draft(f.teacher, input);
  denied(await f.teacher.call(`/requests/${saved.id}/submit`, 'POST', {}), [409], 'teacher-only collision submit');
  assert.equal(f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(saved.id)?.status, 'Draft');
});

test('review: Pending is hidden from students and teacherNotes never occur in raw student JSON', async t => {
  const f = await fixture(t), input = await sourceInput(f), saved = await draft(f.teacher, input);
  await submit(f.teacher, saved.id);
  denied(await f.student.call(`/requests/${saved.id}`), [403, 404], 'student access to Pending');
  const pendingWorkspace = await f.student.call('/workspace');
  success(pendingWorkspace, 'student Pending workspace');
  assert.ok(!pendingWorkspace.raw.includes(privateMarker), 'Raw workspace JSON must omit teacher-only content before confirmation.');
  assert.ok(!(pendingWorkspace.body.requests as ChangeRequest[]).some(item => item.id === saved.id), 'Student workspace must not include Pending requests.');
  await accept(f.recipient, saved.id);
  for (const path of [`/requests/${saved.id}`, '/workspace']) {
    const visible = await f.student.call(path);
    success(visible, `student ${path}`);
    assert.ok(!visible.raw.includes(privateMarker), `${path}: teacher-only marker must not occur anywhere in the raw response.`);
    assert.ok(!visible.raw.includes('teacherNotes'), `${path}: teacherNotes key must be omitted, not merely hidden by the UI.`);
  }
  const teacherDetail = await f.teacher.call(`/requests/${saved.id}`);
  assert.ok(teacherDetail.raw.includes(privateMarker), 'Private field remains available to the authorized teacher.');
  const calendar = await f.student.call('/calendar');
  success(calendar, 'student calendar');
  assert.ok(!calendar.raw.includes(privateMarker), 'Calendar export must not leak teacher notes.');
});

test('review: cross-class queries and todo/view writes are rejected or safely scoped', async t => {
  const f = await fixture(t), input = await sourceInput(f), saved = await draft(f.teacher, input);
  await submit(f.teacher, saved.id); await accept(f.recipient, saved.id);
  const outsider = await register(f, 'student', otherClass(f));
  denied(await outsider.client.call(`/requests/${saved.id}`), [403, 404], 'another-class request read');
  for (const suffix of ['todo', 'view']) {
    denied(await outsider.client.call(`/requests/${saved.id}/${suffix}`, 'POST', suffix === 'todo' ? { key: 'materials', done: true } : {}), [403, 404], `another-class ${suffix}`);
  }
  const injected = await f.student.call(`/workspace?classId=${encodeURIComponent(otherClass(f))}&teacherId=${encodeURIComponent(f.receiver.id)}`);
  if ([403, 404].includes(injected.status)) return;
  success(injected, 'student filter injection');
  const workspace = injected.body as unknown as Workspace;
  assert.ok(workspace.lessons.every(item => item.classId === f.pupil.classId), 'Student-supplied class/teacher filters must never widen lesson scope.');
  assert.ok(workspace.requests.every(item => item.classId === f.pupil.classId), 'Student-supplied class/teacher filters must never widen request scope.');
});

test('review: unrelated teacher and student cannot mutate another teacher’s request', async t => {
  const f = await fixture(t), input = await sourceInput(f), saved = await draft(f.teacher, input);
  const outsider = await register(f, 'teacher');
  denied(await outsider.client.call(`/requests/${saved.id}`, 'PATCH', input), [403, 404], 'unrelated teacher draft edit');
  denied(await outsider.client.call(`/requests/${saved.id}/submit`, 'POST', {}), [403, 404], 'unrelated teacher submit');
  await submit(f.teacher, saved.id);
  denied(await f.teacher.call(`/requests/${saved.id}/respond`, 'POST', { decision: 'accept' }), [403], 'original teacher responding for the recipient');
  for (const [path, method, body] of [
    ['/requests', 'POST', input], [`/requests/${saved.id}/respond`, 'POST', { decision: 'accept' }],
    [`/requests/${saved.id}/status`, 'POST', { status: 'Cancelled' }],
    [`/requests/${saved.id}/supplements`, 'POST', { text: 'Unauthorized addition' }],
    ['/admin/reset', 'POST', { confirm: 'RESET DEMO' }], ['/profile', 'PATCH', { role: 'admin' }],
  ] as const) denied(await f.student.call(path, method, body), [403, 404], `student mutation ${method} ${path}`);
});

test('review: submitted original is locked; decline releases locks and allows corrected resubmission', async t => {
  const f = await fixture(t), input = await sourceInput(f), saved = await draft(f.teacher, input);
  await submit(f.teacher, saved.id);
  denied(await f.teacher.call(`/requests/${saved.id}`, 'PATCH', input), [409], 'edit after submission');
  denied(await f.recipient.call(`/requests/${saved.id}/respond`, 'POST', { decision: 'decline', comment: ' ' }), [400, 422], 'decline without explanation');
  const declined = requestOf(await f.recipient.call(`/requests/${saved.id}/respond`, 'POST', { decision: 'decline', comment: 'Please clarify the warm-up activity.' }), 'decline with comment');
  assert.equal(declined.status, 'Declined');
  assert.equal(count(f, 'SELECT COUNT(*) AS n FROM slot_locks WHERE request_id = ?', [saved.id]), 0, 'Decline must release all reservations.');
  success(await f.teacher.call(`/requests/${saved.id}`, 'PATCH', { ...input, handover: { ...handover(), plan: 'Use pages 40–42 as the warm-up.' } }), 'edit declined request');
  await submit(f.teacher, saved.id); await accept(f.recipient, saved.id);
  const final = requestOf(await f.teacher.call(`/requests/${saved.id}`), 'resubmission history');
  assert.ok(final.timeline.length >= 5, 'Timeline must preserve create, first submit, decline, resubmit, and accept.');
});

test('review: accepting Pending rechecks a teacher conflict introduced after submit', async t => {
  const f = await fixture(t), input = await sourceInput(f), saved = await draft(f.teacher, input);
  const originalSchedule = schedule(f, input.lessonId);
  await submit(f.teacher, saved.id);
  insertLesson(f, { teacherId: f.receiver.id, classId: otherClass(f), date: input.targetDate, period: input.targetPeriod, room: 'Late allocation room' });
  const response = await f.recipient.call(`/requests/${saved.id}/respond`, 'POST', { decision: 'accept' });
  const collisions = count(f, 'SELECT COUNT(*) AS n FROM lessons WHERE teacher_id = ? AND date = ? AND period = ?', [f.receiver.id, input.targetDate, input.targetPeriod]);
  const status = f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(saved.id)?.status;
  denied(response, [409], `recipient collision introduced after submit; stored request=${String(status)}, simultaneous recipient lessons=${collisions}`);
  assert.deepEqual(schedule(f, input.lessonId), originalSchedule, 'Failed acceptance must leave the original class timetable unchanged.');
  assert.equal(f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(saved.id)?.status, 'Pending');
});

test('review: logout invalidates a saved session cookie on the server', async t => {
  const f = await fixture(t), savedCookie = f.teacher.cookie;
  success(await f.teacher.call('/auth/logout', 'POST', {}), 'logout');
  denied(await new Client(f.database, savedCookie).call('/auth/me'), [401], 'reuse pre-logout cookie');
  denied(await new Client(f.database, savedCookie).call('/workspace'), [401], 'workspace with pre-logout cookie');
});

test('review: expired session and disabled-account sessions are rejected', async t => {
  const f = await fixture(t), originalCookie = f.teacher.cookie;
  f.connection.prepare('UPDATE sessions SET expires_at = ? WHERE user_id = ?').run('2000-01-01T00:00:00.000Z', f.original.id);
  denied(await new Client(f.database, originalCookie).call('/auth/me'), [401], 'expired cookie');
  await f.teacher.demo('teacher');
  const activeCookie = f.teacher.cookie;
  success(await f.admin.call(`/admin/users/${f.original.id}`, 'PATCH', { active: false }), 'admin disables teacher');
  denied(await new Client(f.database, activeCookie).call('/auth/me'), [401], 'cookie after account disabled');
});

test('review: password recovery rotates recovery code and revokes every old session', async t => {
  const f = await fixture(t), person = await register(f, 'student');
  const second = new Client(f.database);
  success(await second.call('/auth/login', 'POST', { email: person.email, password: person.password }), 'second normal session');
  const oldCookies = [person.client.cookie, second.cookie], anonymous = new Client(f.database);
  denied(await anonymous.call('/auth/reset', 'POST', { email: person.email, recoveryCode: 'wrong-code', password: 'Reviewer-new-password-2026' }), [400, 401, 403, 422], 'incorrect recovery code');
  const reset = await anonymous.call('/auth/reset', 'POST', { email: person.email, recoveryCode: person.recovery, password: 'Reviewer-new-password-2026' });
  success(reset, 'valid password recovery');
  assert.ok(typeof reset.body.recoveryCode === 'string' && reset.body.recoveryCode !== person.recovery, 'Recovery code must rotate.');
  for (const cookie of oldCookies) denied(await new Client(f.database, cookie).call('/auth/me'), [401], 'old session after password recovery');
  denied(await anonymous.call('/auth/reset', 'POST', { email: person.email, recoveryCode: person.recovery, password: 'Reviewer-third-password-2026' }), [400, 401, 403, 422], 'reuse old recovery code');
  success(await person.client.call('/auth/login', 'POST', { email: person.email, password: 'Reviewer-new-password-2026' }), 'login with new password');
});

test('review advisory: report future completion policy without inventing a release requirement', async t => {
  const f = await fixture(t);
  const future = insertLesson(f, { date: addDays(defaultSchoolMonday(), 14), period: 1 });
  const futureRequest = await draft(f.teacher, inputFor(f, future));
  await submit(f.teacher, futureRequest.id); await accept(f.recipient, futureRequest.id);
  const response = await f.recipient.call(`/requests/${futureRequest.id}/status`, 'POST', { status: 'Completed' });
  const status = f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(futureRequest.id)?.status;
  // Original product requirements only promise Confirmed -> Completed; they do
  // not explicitly require waiting until the lesson ends. Report, do not gate.
  if (response.status >= 200 && response.status < 300) {
    assert.equal(status, 'Completed', 'Successful completion must persist Completed.');
    t.diagnostic(`Advisory only: future completion is permitted; lesson=${String(lessonRow(f, future)?.date)}, schoolToday=${schoolToday()}. A date guard requires a product decision.`);
  } else {
    denied(response, [409, 422], 'future completion with an explicit server time guard');
    assert.equal(status, 'Confirmed', 'Rejected future completion must retain Confirmed.');
  }
});

test('review: a past taught lesson can complete once and cannot subsequently be cancelled', async t => {
  const f = await fixture(t);
  const pastDate = addDays(mondayOnOrBefore(schoolToday()), -14);
  const past = insertLesson(f, { date: pastDate, period: 1 });
  const pastRequest = await draft(f.teacher, inputFor(f, past));
  await submit(f.teacher, pastRequest.id); await accept(f.recipient, pastRequest.id);
  const done = requestOf(await f.recipient.call(`/requests/${pastRequest.id}/status`, 'POST', { status: 'Completed' }), 'complete a past taught lesson');
  assert.equal(done.status, 'Completed');
  denied(await f.recipient.call(`/requests/${pastRequest.id}/status`, 'POST', { status: 'Completed' }), [409], 'repeat completion');
  denied(await f.teacher.call(`/requests/${pastRequest.id}/status`, 'POST', { status: 'Cancelled' }), [409], 'cancel an already Completed lesson');
});

test('review: confirmed move cancellation restores teacher, date, period, room, and releases target', async t => {
  const f = await fixture(t), date = addDays(defaultSchoolMonday(), 14);
  const source = insertLesson(f, { date, period: 1, room: 'Review original room' });
  const before = schedule(f, source), target = { date: addDays(date, 1), period: 2, room: 'Review moved room' };
  const saved = await draft(f.teacher, inputFor(f, source, 'move', target));
  await submit(f.teacher, saved.id); await accept(f.teacher, saved.id);
  assert.deepEqual(schedule(f, source), { teacherId: f.original.id, ...target }, 'Accepting a move must actually modify the stored timetable.');
  const cancelled = requestOf(await f.teacher.call(`/requests/${saved.id}/status`, 'POST', { status: 'Cancelled', comment: 'Appointment moved.' }), 'cancel confirmed move');
  assert.equal(cancelled.status, 'Cancelled');
  assert.deepEqual(schedule(f, source), before, 'Cancellation must restore every original timetable field.');
  assert.equal(count(f, 'SELECT COUNT(*) AS n FROM slot_locks WHERE request_id = ?', [saved.id]), 0, 'Cancellation releases the destination reservation.');
  const next = insertLesson(f, { date, period: 3, room: 'Review next original room' });
  await submit(f.teacher, (await draft(f.teacher, inputFor(f, next, 'move', target))).id);
});

test('review: cancellation cannot overwrite another lesson now occupying the original slot', async t => {
  const f = await fixture(t), date = addDays(defaultSchoolMonday(), 14);
  const source = insertLesson(f, { date, period: 1, room: 'Restore room' });
  const target = { date: addDays(date, 1), period: 2, room: 'Moved room' };
  const saved = await draft(f.teacher, inputFor(f, source, 'move', target));
  await submit(f.teacher, saved.id); await accept(f.teacher, saved.id);
  // The second source is a fixture, but occupancy of the released original slot
  // is created using the full, authorized move/submit/accept API workflow.
  const occupying = insertLesson(f, { date, period: 3, room: 'Second original room' });
  const secondRequest = await draft(f.teacher, inputFor(f, occupying, 'move', { date, period: 1, room: 'Restore room' }));
  await submit(f.teacher, secondRequest.id); await accept(f.teacher, secondRequest.id);
  const beforeSource = schedule(f, source), beforeOccupant = schedule(f, occupying);
  const response = await f.teacher.call(`/requests/${saved.id}/status`, 'POST', { status: 'Cancelled' });
  const collisions = count(f, 'SELECT COUNT(*) AS n FROM lessons WHERE class_id = ? AND date = ? AND period = ?', [f.pupil.classId!, date, 1]);
  denied(response, [409], `restore into an original class slot occupied through an accepted API move; class lessons at original slot=${collisions}`);
  assert.deepEqual(schedule(f, source), beforeSource, 'Failed restore must leave the moved class intact.');
  assert.deepEqual(schedule(f, occupying), beforeOccupant, 'Failed restore must not overwrite or remove the occupying class.');
  assert.equal(f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(saved.id)?.status, 'Confirmed');
});

test('review: demo reset revokes old demo cookies, refreshes admin, and restores all one-click roles', async t => {
  const f = await fixture(t);
  const oldCookies = [f.teacher.cookie, f.recipient.cookie, f.student.cookie, f.admin.cookie];
  denied(await f.admin.call('/admin/reset', 'POST', { confirm: 'WRONG' }), [400, 422], 'demo reset requires exact confirmation');
  success(await f.admin.call('/admin/reset', 'POST', { confirm: 'RESET DEMO' }), 'demo reset');
  for (const cookie of oldCookies) denied(await new Client(f.database, cookie).call('/auth/me'), [401], 'saved demo session after reset');
  success(await f.admin.call('/auth/me'), 'refreshed admin session after reset');
  for (const role of ['student', 'teacher', 'admin'] as const) await new Client(f.database).demo(role);
});

test('review: demo reset preserves a real teacher’s request, demo dependencies, and real student progress', async t => {
  const f = await fixture(t), input = await sourceInput(f), realTeacher = await register(f, 'teacher');
  const realStudent = await register(f, 'student');
  // Controlled curriculum assignment: a real teacher takes ownership of an
  // existing demo lesson, while demo class/lesson/recipient dependencies remain.
  f.connection.prepare('UPDATE lessons SET teacher_id = ?, base_teacher_id = ? WHERE id = ?').run(realTeacher.user.id, realTeacher.user.id, input.lessonId);
  const saved = await draft(realTeacher.client, input);
  assert.equal(f.connection.prepare('SELECT is_demo FROM requests WHERE id = ?').get(saved.id)?.is_demo, 0, 'Real-teacher request must not inherit the demo lesson flag.');
  await submit(realTeacher.client, saved.id); await accept(f.recipient, saved.id);
  for (const key of ['materials', 'assessment', 'reminder']) success(await realStudent.client.call(`/requests/${saved.id}/todo`, 'POST', { key, done: true }), `real student ${key}`);
  success(await realStudent.client.call(`/requests/${saved.id}/view`, 'POST', {}), 'real student read receipt');
  const beforeRequest = f.connection.prepare('SELECT * FROM requests WHERE id = ?').get(saved.id);
  const beforeLesson = lessonRow(f, input.lessonId);
  const beforeTodo = f.connection.prepare('SELECT * FROM todos WHERE user_id = ? AND request_id = ? ORDER BY key').all(realStudent.user.id, saved.id);
  const beforeView = f.connection.prepare('SELECT * FROM views WHERE user_id = ? AND request_id = ?').get(realStudent.user.id, saved.id);
  const beforeHash = f.connection.prepare('SELECT password_hash, recovery_hash FROM users WHERE id = ?').get(realTeacher.user.id);
  success(await f.admin.call('/admin/reset', 'POST', { confirm: 'RESET DEMO' }), 'demo reset with surviving real request');
  assert.deepEqual(f.connection.prepare('SELECT * FROM requests WHERE id = ?').get(saved.id), beforeRequest, 'Demo reset must preserve the real teacher’s request, not merely their account.');
  assert.deepEqual(lessonRow(f, input.lessonId), beforeLesson, 'A demo lesson referenced by a real request must retain its accepted schedule.');
  assert.deepEqual(f.connection.prepare('SELECT * FROM todos WHERE user_id = ? AND request_id = ? ORDER BY key').all(realStudent.user.id, saved.id), beforeTodo, 'Real student preparation records must survive reset of other demo data.');
  assert.deepEqual(f.connection.prepare('SELECT * FROM views WHERE user_id = ? AND request_id = ?').get(realStudent.user.id, saved.id), beforeView, 'Real student read receipt must survive.');
  const afterHash = f.connection.prepare('SELECT password_hash, recovery_hash FROM users WHERE id = ?').get(realTeacher.user.id);
  assert.ok(JSON.stringify(beforeHash) === JSON.stringify(afterHash), 'Reset must preserve password/recovery hashes; hashes are intentionally excluded from failure output.');
  success(await realTeacher.client.call('/auth/me'), 'real teacher session after demo reset');
  success(await realStudent.client.call('/auth/me'), 'real student session after demo reset');
  const visible = requestOf(await realStudent.client.call(`/requests/${saved.id}`), 'real student surviving request');
  assert.equal(visible.todo.materials, true);
  assert.equal(visible.todo.assessment, true);
  assert.equal(visible.todo.reminder, true);
  for (const column of ['class_id', 'recipient_id', 'original_teacher_id'] as const) {
    const reference = beforeRequest?.[column];
    const table = column === 'class_id' ? 'classes' : 'users';
    assert.equal(count(f, `SELECT COUNT(*) AS n FROM ${table} WHERE id = ?`, [String(reference)]), 1, `Surviving request ${column} must resolve after reset.`);
  }
});

// Force both API calls past their initial reads before either starts writing.
// The independent adapter executes each actual SQL batch synchronously.
// The barrier is bounded; timeouts include no credential or session contents.
function gateFirstTwoWrites(database: D1Database): D1Database {
  let arrivals = 0;
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  const relevant = (statement: D1PreparedStatement): boolean => /(?:UPDATE\s+requests|(?:INSERT(?:\s+OR\s+\w+)?\s+INTO|DELETE\s+FROM)\s+slot_locks)/i.test(String((statement as unknown as { sql?: string }).sql ?? ''));
  async function waitForPeer(): Promise<void> {
    if (arrivals >= 2) return;
    arrivals++;
    if (arrivals === 2) { release(); return; }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([ready, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Concurrency barrier: second request never reached its first mutation within 5 seconds.')), 5000); })]);
    } finally { if (timer) clearTimeout(timer); }
  }
  function wrap(statement: D1PreparedStatement): D1PreparedStatement {
    return new Proxy(statement, {
      get(target, key) {
        if (key === 'bind') return (...values: unknown[]) => wrap(target.bind(...values));
        const value = Reflect.get(target, key, target);
        if (typeof value !== 'function') return value;
        if (['run', 'all', 'first'].includes(String(key)) && relevant(target)) {
          return async (...args: unknown[]) => { await waitForPeer(); return Reflect.apply(value, target, args); };
        }
        return (...args: unknown[]) => Reflect.apply(value, target, args);
      },
    });
  }
  return new Proxy(database, {
    get(target, key) {
      if (key === 'prepare') return (sql: string) => wrap(target.prepare(sql));
      if (key === 'batch') return async <T = Record<string, unknown>,>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> => {
        if (statements.some(relevant)) await waitForPeer();
        return target.batch<T>(statements);
      };
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? (...args: unknown[]) => Reflect.apply(value, target, args) : value;
    },
  });
}

test('review: parallel submissions to one destination have exactly one winner and no partial locks', async t => {
  const f = await fixture(t), date = addDays(defaultSchoolMonday(), 14);
  const first = insertLesson(f, { date, period: 1 }), second = insertLesson(f, { date, period: 2 });
  const target = { date: addDays(date, 1), period: 3, room: 'Shared destination room' };
  const a = await draft(f.teacher, inputFor(f, first, 'move', target));
  const b = await draft(f.teacher, inputFor(f, second, 'move', target));
  const raced = new Client(gateFirstTwoWrites(f.database), f.teacher.cookie);
  const results = await Promise.all([raced.call(`/requests/${a.id}/submit`, 'POST', {}), raced.call(`/requests/${b.id}/submit`, 'POST', {})]);
  assert.equal(results.filter(result => result.status >= 200 && result.status < 300).length, 1, `Destination race must have one winner; results: ${results.map(detail).join(' | ')}`);
  assert.equal(results.filter(result => result.status === 409).length, 1, `Destination race loser must be a conflict, not a 500; results: ${results.map(detail).join(' | ')}`);
  const rows = f.connection.prepare('SELECT id, status FROM requests WHERE id IN (?, ?)').all(a.id, b.id);
  const winner = rows.find(row => row.status === 'Pending'), loser = rows.find(row => row.status === 'Draft');
  assert.ok(winner && loser, 'Winner must be Pending and loser must remain Draft.');
  const locks = f.connection.prepare('SELECT request_id, scope FROM slot_locks WHERE request_id IN (?, ?)').all(a.id, b.id);
  assert.ok(locks.length >= 2 && locks.every(lock => lock.request_id === winner.id), 'All destination locks must belong to the winning request; loser must have none.');
  assert.ok(locks.some(lock => lock.scope === 'class') && locks.some(lock => lock.scope === 'teacher'), 'Winning request must reserve both class and teacher.');
  assert.equal(count(f, "SELECT COUNT(*) AS n FROM timeline WHERE request_id IN (?, ?) AND action = 'submitted'", [a.id, b.id]), 1, 'Only the successful submission gets a submitted timeline event.');
});

test('review: parallel replay of one submit cannot duplicate timeline, notification, or reservations', async t => {
  const f = await fixture(t), saved = await draft(f.teacher, await sourceInput(f));
  const raced = new Client(gateFirstTwoWrites(f.database), f.teacher.cookie);
  const results = await Promise.all([raced.call(`/requests/${saved.id}/submit`, 'POST', {}), raced.call(`/requests/${saved.id}/submit`, 'POST', {})]);
  assert.equal(results.filter(result => result.status >= 200 && result.status < 300).length, 1, `Submit replay must have one success; ${results.map(detail).join(' | ')}`);
  assert.equal(results.filter(result => result.status === 409).length, 1, `Submit replay loser must be 409; ${results.map(detail).join(' | ')}`);
  assert.equal(count(f, "SELECT COUNT(*) AS n FROM timeline WHERE request_id = ? AND action = 'submitted'", [saved.id]), 1);
  assert.equal(count(f, "SELECT COUNT(*) AS n FROM notifications WHERE request_id = ? AND user_id = ? AND event = 'pending'", [saved.id, f.receiver.id]), 1);
  denied(await f.teacher.call(`/requests/${saved.id}/submit`, 'POST', {}), [409], 'sequential submit replay');
});

test('review: racing accept and cancel leaves a valid linearized schedule and timeline', async t => {
  for (const startWithAccept of [true, false]) {
    await t.test(startWithAccept ? 'accept call starts first' : 'cancel call starts first', async child => {
      const f = await fixture(child), input = await sourceInput(f), saved = await draft(f.teacher, input), before = schedule(f, input.lessonId);
      await submit(f.teacher, saved.id);
      const gated = gateFirstTwoWrites(f.database), teacher = new Client(gated, f.teacher.cookie), recipient = new Client(gated, f.recipient.cookie);
      const acceptCall = () => recipient.call(`/requests/${saved.id}/respond`, 'POST', { decision: 'accept' });
      const cancelCall = () => teacher.call(`/requests/${saved.id}/status`, 'POST', { status: 'Cancelled', comment: 'Concurrent cancellation.' });
      const results = await Promise.all(startWithAccept ? [acceptCall(), cancelCall()] : [cancelCall(), acceptCall()]);
      assert.ok(results.every(result => (result.status >= 200 && result.status < 300) || result.status === 409), `Race responses must be success/conflict, not internal errors: ${results.map(detail).join(' | ')}`);
      const final = f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(saved.id)?.status;
      const actions = f.connection.prepare('SELECT action FROM timeline WHERE request_id = ? ORDER BY rowid').all(saved.id).map(row => String(row.action));
      if (final === 'Cancelled') {
        assert.deepEqual(schedule(f, input.lessonId), before, `Cancelled final state must have the original schedule, even if accept also succeeded first; responses=${results.map(detail).join(' | ')}`);
        assert.equal(actions.filter(action => action === 'cancelled').length, 1, 'Cancellation must be recorded once.');
        if (actions.includes('confirmed')) assert.ok(actions.indexOf('confirmed') < actions.indexOf('cancelled'), 'Both successes are valid only in accept-then-cancel order.');
      } else if (final === 'Confirmed') {
        assert.deepEqual(schedule(f, input.lessonId), { teacherId: f.receiver.id, date: input.targetDate, period: input.targetPeriod, room: input.targetRoom });
        assert.equal(actions.filter(action => action === 'confirmed').length, 1);
        assert.ok(!actions.includes('cancelled'), 'Failed cancellation must not leave a successful cancellation event.');
      } else assert.fail(`Race must end Confirmed or Cancelled, never ${String(final)}.`);
      assert.equal(count(f, 'SELECT COUNT(*) AS n FROM slot_locks WHERE request_id = ?', [saved.id]), 0, 'Neither final state should retain Pending reservations.');
    });
  }
});

test('review: every mutation rejects cross-origin requests without changing state', async t => {
  const f = await fixture(t), saved = await draft(f.teacher, await sourceInput(f));
  const profileName = f.original.name;
  denied(await f.teacher.call('/profile', 'PATCH', { name: 'Cross-origin attacker' }, { origin: 'https://untrusted.example' }), [403], 'cross-origin profile');
  denied(await f.teacher.call(`/requests/${saved.id}/submit`, 'POST', {}, { origin: 'https://untrusted.example' }), [403], 'cross-origin submit');
  denied(await f.admin.call('/admin/reset', 'POST', { confirm: 'RESET DEMO' }, { origin: 'https://untrusted.example' }), [403], 'cross-origin reset');
  assert.equal(f.connection.prepare('SELECT name FROM users WHERE id = ?').get(f.original.id)?.name, profileName);
  assert.equal(f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(saved.id)?.status, 'Draft');
});

async function databaseSnapshot(f: Pick<Fixture, 'connection'>): Promise<Record<string, string>> {
  const tables = f.connection.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  const snapshot: Record<string, string> = {};
  for (const item of tables) {
    const table = String(item.name);
    assert.match(table, /^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Migration table name must be safe for fixture introspection.');
    const rows = f.connection.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all();
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(rows)));
    snapshot[table] = Buffer.from(digest).toString('hex');
  }
  return snapshot;
}

test('review: GET and HEAD cannot execute any mutation or action endpoint', async t => {
  const endpoints: { suffix: string; client: 'teacher' | 'recipient' | 'student' | 'admin'; state?: 'Draft' | 'Pending' | 'Confirmed'; action?: boolean }[] = [
    { suffix: 'submit', client: 'teacher', state: 'Draft', action: true },
    { suffix: 'respond', client: 'recipient', state: 'Pending', action: true },
    { suffix: 'status', client: 'teacher', state: 'Confirmed', action: true },
    { suffix: 'supplements', client: 'teacher', state: 'Confirmed', action: true },
    { suffix: 'todo', client: 'student', state: 'Confirmed', action: true },
    { suffix: 'view', client: 'student', state: 'Confirmed', action: true },
    { suffix: '/admin/reset', client: 'admin' },
    { suffix: '/auth/logout', client: 'teacher' },
    { suffix: '/auth/reset', client: 'teacher' },
    { suffix: '/auth/demo', client: 'teacher' },
    { suffix: '/auth/register', client: 'teacher' },
    { suffix: '/auth/login', client: 'teacher' },
    { suffix: '/notifications/read', client: 'student' },
    { suffix: '/profile', client: 'teacher' },
    { suffix: '/conflicts', client: 'teacher' },
    { suffix: '/requests', client: 'teacher' },
    { suffix: '/admin/users/', client: 'admin' },
  ];
  for (const method of ['GET', 'HEAD']) {
    for (const endpoint of endpoints) {
      await t.test(`${method} ${endpoint.action ? '/requests/:id/' : ''}${endpoint.suffix}`, async child => {
        const f = await fixture(child), saved = await draft(f.teacher, await sourceInput(f));
        if (endpoint.state === 'Pending' || endpoint.state === 'Confirmed') await submit(f.teacher, saved.id);
        if (endpoint.state === 'Confirmed') await accept(f.recipient, saved.id);
        const path = endpoint.action ? `/requests/${saved.id}/${endpoint.suffix}`
          : endpoint.suffix === '/admin/users/' ? `/admin/users/${f.original.id}` : endpoint.suffix;
        const before = await databaseSnapshot(f);
        const beforeStatus = f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(saved.id)?.status;
        const beforeViews = count(f, 'SELECT COUNT(*) AS n FROM views WHERE request_id = ?', [saved.id]);
        // GET/HEAD cannot carry a Request body. A correct handler rejects the
        // method before validation and never executes mutation logic.
        const result = await f[endpoint.client].call(path, method);
        const after = await databaseSnapshot(f);
        const modified = Object.keys(before).filter(table => before[table] !== after[table]);
        const afterStatus = f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(saved.id)?.status;
        const afterViews = count(f, 'SELECT COUNT(*) AS n FROM views WHERE request_id = ?', [saved.id]);
        assert.deepEqual(modified, [], `${method} ${path} must be read-only; ${detail(result)}; request=${String(beforeStatus)}→${String(afterStatus)}; views=${beforeViews}→${afterViews}; modified tables=${modified.join(', ')}.`);
        denied(result, [404, 405], `${method} ${path} must reject the HTTP method before entering mutation validation`);
      });
    }
  }
});

test('R02 review: private reason and reasonCategory are excluded from student list and detail JSON', async t => {
  const f = await fixture(t), original = await sourceInput(f);
  const reasonMarker = 'REVIEW_PRIVATE_REASON_MEDICAL_4e0c';
  // Use an actually supported category. An invented marker category would be
  // rejected by input validation and would not exercise student serialization.
  const input = { ...original, reasonCategory: 'medical', reason: reasonMarker };
  const saved = await draft(f.teacher, input);
  await submit(f.teacher, saved.id); await accept(f.recipient, saved.id);
  const teacher = requestOf(await f.teacher.call(`/requests/${saved.id}`), 'authorized teacher private reason');
  assert.equal(teacher.reason, reasonMarker, 'Privacy filtering must not erase the teacher’s stored reason.');
  assert.equal(teacher.reasonCategory, 'medical');
  for (const path of ['/workspace', `/requests/${saved.id}`]) {
    const result = await f.student.call(path);
    success(result, `student private-reason ${path}`);
    assert.ok(!result.raw.includes(reasonMarker), `${path}: private reason marker cannot occur anywhere in student raw JSON.`);
    const requests = path === '/workspace' ? result.body.requests as ChangeRequest[] : [result.body.request as ChangeRequest];
    const request = requests.find(item => item.id === saved.id);
    assert.ok(request, `${path}: confirmed class change must remain visible after privacy filtering.`);
    const safe = request as unknown as Record<string, unknown>;
    assert.ok(safe.reason === undefined || safe.reason === '', `${path}: student reason field must be omitted or blank.`);
    assert.ok(safe.reasonCategory === undefined || safe.reasonCategory === '', `${path}: medical category itself is private, even when the free-text reason is redacted.`);
  }
});

test('R02 review: published teacher-only supplement policy never leaks raw supplement or response markers', async t => {
  const f = await fixture(t), saved = await draft(f.teacher, await sourceInput(f));
  const supplementMarker = 'REVIEW_PRIVATE_SUPPLEMENT_58a9', responseMarker = 'REVIEW_PRIVATE_RESPONSE_COMMENT_0d2a';
  await submit(f.teacher, saved.id);
  // The currently published API accepts {text}; DECISIONS.md states that
  // supplements and timeline comments are teacher-only. No new public-sharing
  // or visibility field is fabricated by this test.
  const supplemented = requestOf(await f.teacher.call(`/requests/${saved.id}/supplements`, 'POST', { text: supplementMarker }), 'teacher-only supplement');
  assert.ok(supplemented.supplements.some(item => item.text === supplementMarker && Boolean(item.at)), 'Teacher supplement must actually be persisted with a timestamp.');
  const confirmed = requestOf(await f.recipient.call(`/requests/${saved.id}/respond`, 'POST', { decision: 'accept', comment: responseMarker }), 'accept with private teacher comment');
  assert.equal(confirmed.status, 'Confirmed');
  const teacher = await f.recipient.call(`/requests/${saved.id}`);
  success(teacher, 'recipient sees private teaching context');
  assert.ok(teacher.raw.includes(supplementMarker) && teacher.raw.includes(responseMarker), 'Authorized recipient must retain supplement and timeline context.');
  for (const path of ['/workspace', `/requests/${saved.id}`, '/calendar']) {
    const result = await f.student.call(path);
    success(result, `student supplemental privacy ${path}`);
    for (const marker of [supplementMarker, responseMarker, privateMarker]) {
      assert.ok(!result.raw.includes(marker), `${path}: teacher-only content cannot leak through raw JSON, timeline, supplemental arrays, or calendar text.`);
    }
  }
});

test('R02 review: racing incomplete draft PATCH with submit cannot produce an incomplete Pending handover', async t => {
  for (const patchStartsFirst of [true, false]) {
    await t.test(patchStartsFirst ? 'PATCH starts first' : 'submit starts first', async child => {
      const f = await fixture(child), input = await sourceInput(f), saved = await draft(f.teacher, input);
      const incomplete: RequestInput = { ...input, handover: { ...handover(), progress: '' } };
      // Negative control proves the PATCH payload is valid for a Draft. A test
      // rejected solely by form validation would not exercise the real race.
      const partial = requestOf(await f.teacher.call(`/requests/${saved.id}`, 'PATCH', incomplete), 'negative control: incomplete Draft PATCH');
      assert.equal(partial.status, 'Draft');
      assert.equal(partial.handover.progress, '', 'Saving an incomplete Draft must really persist the missing field.');
      const restored = requestOf(await f.teacher.call(`/requests/${saved.id}`, 'PATCH', input), 'restore complete Draft before race');
      assert.equal(restored.handover.progress, input.handover.progress);
      const gated = gateFirstTwoWrites(f.database);
      const editor = new Client(gated, f.teacher.cookie), sender = new Client(gated, f.teacher.cookie);
      const patch = () => editor.call(`/requests/${saved.id}`, 'PATCH', incomplete);
      const send = () => sender.call(`/requests/${saved.id}/submit`, 'POST', {});
      const results = await Promise.all(patchStartsFirst ? [patch(), send()] : [send(), patch()]);
      assert.ok(results.every(result => (result.status >= 200 && result.status < 300) || [409, 422].includes(result.status)), `PATCH/submit race must return valid success/conflict/validation responses: ${results.map(detail).join(' | ')}`);
      const row = f.connection.prepare('SELECT status, handover_json FROM requests WHERE id = ?').get(saved.id);
      assert.ok(row, 'Concurrent editing must never remove the request.');
      const h = JSON.parse(String(row.handover_json)) as Handover;
      const missing = ['progress', 'plan', 'assessment', 'equipment', 'studentReminder', 'teacherNotes']
        .filter(key => !String((h as unknown as Record<string, unknown>)[key] ?? '').trim());
      if (!Array.isArray(h.materials) || h.materials.length === 0) missing.push('materials');
      if (row.status === 'Pending') {
        assert.deepEqual(missing, [], `Pending must have all seven fields despite stale Draft PATCH; responses=${results.map(detail).join(' | ')}; missing=${missing.join(', ')}.`);
        assert.equal(count(f, "SELECT COUNT(*) AS n FROM timeline WHERE request_id = ? AND action = 'submitted'", [saved.id]), 1);
      } else if (row.status === 'Draft') {
        assert.equal(count(f, 'SELECT COUNT(*) AS n FROM slot_locks WHERE request_id = ?', [saved.id]), 0, 'A rejected submission must not leave Draft reservations.');
        assert.equal(count(f, "SELECT COUNT(*) AS n FROM timeline WHERE request_id = ? AND action = 'submitted'", [saved.id]), 0, 'A rejected submission cannot be recorded as successful.');
      } else assert.fail(`PATCH/submit race may end Draft or Pending, never ${String(row.status)}.`);
    });
  }
});

test('R02 review: a subsequent supported move cancels back to its immediately prior arrangement', async t => {
  const f = await fixture(t);
  // Keep the same teacher as both current owner and base owner throughout.
  // Past dates allow completion under either policy; no future-completion guard
  // or reassigned-teacher ownership rule is assumed by this regression.
  const firstDate = addDays(mondayOnOrBefore(schoolToday()), -14);
  const source = insertLesson(f, { date: firstDate, period: 1, room: 'Review earliest room' });
  const firstTarget = { date: addDays(firstDate, 1), period: 2, room: 'Review immediately prior room' };
  const first = await draft(f.teacher, inputFor(f, source, 'move', firstTarget));
  await submit(f.teacher, first.id); await accept(f.teacher, first.id);
  const completed = requestOf(await f.teacher.call(`/requests/${first.id}/status`, 'POST', { status: 'Completed' }), 'complete the first past move');
  assert.equal(completed.status, 'Completed');
  const immediatelyBeforeSecond = schedule(f, source);
  assert.deepEqual(immediatelyBeforeSecond, { teacherId: f.original.id, ...firstTarget });
  const secondTarget = { date: addDays(defaultSchoolMonday(), 14), period: 3, room: 'Review second moved room' };
  const secondResult = await f.teacher.call('/requests', 'POST', inputFor(f, source, 'move', secondTarget));
  if (secondResult.status === 409) {
    // A product may explicitly forbid further requests for completed lessons.
    // Without an accepted second request there is no rollback bug to allege.
    t.skip('Service rejects a subsequent request after Completed; chained restoration is unsupported and needs a product-scope decision, not an invented authorization bypass.');
    return;
  }
  const second = requestOf(secondResult, 'same current owner creates a subsequent move');
  assert.equal(second.status, 'Draft');
  await submit(f.teacher, second.id); await accept(f.teacher, second.id);
  assert.deepEqual(schedule(f, source), { teacherId: f.original.id, ...secondTarget });
  const cancelled = requestOf(await f.teacher.call(`/requests/${second.id}/status`, 'POST', { status: 'Cancelled' }), 'cancel only the second move');
  assert.equal(cancelled.status, 'Cancelled');
  assert.deepEqual(schedule(f, source), immediatelyBeforeSecond, 'Cancelling the second accepted move must restore the arrangement before that request, not the earliest lesson base_* state.');
  assert.equal(f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(first.id)?.status, 'Completed', 'Cancelling a later request must preserve the first completed request and its history.');
  assert.equal(second.originalDate, firstTarget.date, 'Second request’s original snapshot must be the current prior arrangement.');
  assert.equal(second.originalPeriod, firstTarget.period);
  assert.equal(second.originalRoom, firstTarget.room);
});

function assertDemoSeedIntegrity(f: ReturnType<typeof reviewDatabase>): void {
  const quantity = (sql: string) => Number(f.connection.prepare(sql).get()?.n ?? 0);
  assert.equal(quantity('SELECT COUNT(*) AS n FROM classes WHERE is_demo = 1'), 3, 'A complete seed must rebuild all three demo classes.');
  assert.equal(quantity("SELECT COUNT(*) AS n FROM users WHERE is_demo = 1 AND role = 'teacher' AND active = 1"), 8, 'A complete seed must rebuild eight active demo teachers.');
  assert.equal(quantity("SELECT COUNT(*) AS n FROM users WHERE is_demo = 1 AND role = 'student' AND active = 1"), 36, 'A complete seed must rebuild all 36 demo students.');
  assert.equal(quantity("SELECT COUNT(*) AS n FROM users WHERE is_demo = 1 AND role = 'admin' AND active = 1"), 1, 'A complete seed must rebuild the demo admin.');
  const dates = f.connection.prepare('SELECT DISTINCT date FROM lessons WHERE is_demo = 1').all();
  assert.ok(dates.length > 0, 'A successful demo login is insufficient if the timetable was never seeded.');
  const weeks = new Set(dates.map(row => mondayOnOrBefore(String(row.date))));
  assert.ok(weeks.size >= 2, 'Seed must contain two school weeks of actual lessons.');
  const statuses = new Set(f.connection.prepare('SELECT DISTINCT status FROM requests WHERE is_demo = 1').all().map(row => String(row.status)));
  for (const state of ['Draft', 'Pending', 'Confirmed', 'Declined', 'Completed', 'Cancelled']) assert.ok(statuses.has(state), `A complete seed must rebuild a ${state} request example.`);
  const orphanChecks: [string, string][] = [
    ['lesson class', 'SELECT COUNT(*) AS n FROM lessons l LEFT JOIN classes c ON c.id = l.class_id WHERE c.id IS NULL'],
    ['lesson teacher', 'SELECT COUNT(*) AS n FROM lessons l LEFT JOIN users u ON u.id = l.teacher_id WHERE u.id IS NULL'],
    ['lesson base teacher', 'SELECT COUNT(*) AS n FROM lessons l LEFT JOIN users u ON u.id = l.base_teacher_id WHERE u.id IS NULL'],
    ['request lesson', 'SELECT COUNT(*) AS n FROM requests r LEFT JOIN lessons l ON l.id = r.lesson_id WHERE l.id IS NULL'],
    ['request class', 'SELECT COUNT(*) AS n FROM requests r LEFT JOIN classes c ON c.id = r.class_id WHERE c.id IS NULL'],
    ['request original teacher', 'SELECT COUNT(*) AS n FROM requests r LEFT JOIN users u ON u.id = r.original_teacher_id WHERE u.id IS NULL'],
    ['request recipient', 'SELECT COUNT(*) AS n FROM requests r LEFT JOIN users u ON u.id = r.recipient_id WHERE u.id IS NULL'],
    ['session user', 'SELECT COUNT(*) AS n FROM sessions s LEFT JOIN users u ON u.id = s.user_id WHERE u.id IS NULL'],
    ['notification user/request', 'SELECT COUNT(*) AS n FROM notifications n LEFT JOIN users u ON u.id = n.user_id LEFT JOIN requests r ON r.id = n.request_id WHERE u.id IS NULL OR r.id IS NULL'],
    ['timeline actor/request', 'SELECT COUNT(*) AS n FROM timeline t LEFT JOIN users u ON u.id = t.actor_id LEFT JOIN requests r ON r.id = t.request_id WHERE u.id IS NULL OR r.id IS NULL'],
    ['supplement author/request', 'SELECT COUNT(*) AS n FROM supplements s LEFT JOIN users u ON u.id = s.author_id LEFT JOIN requests r ON r.id = s.request_id WHERE u.id IS NULL OR r.id IS NULL'],
    ['todo user/request', 'SELECT COUNT(*) AS n FROM todos t LEFT JOIN users u ON u.id = t.user_id LEFT JOIN requests r ON r.id = t.request_id WHERE u.id IS NULL OR r.id IS NULL'],
    ['view user/request', 'SELECT COUNT(*) AS n FROM views v LEFT JOIN users u ON u.id = v.user_id LEFT JOIN requests r ON r.id = v.request_id WHERE u.id IS NULL OR r.id IS NULL'],
    ['slot lock request', 'SELECT COUNT(*) AS n FROM slot_locks s LEFT JOIN requests r ON r.id = s.request_id WHERE r.id IS NULL'],
  ];
  for (const [label, sql] of orphanChecks) assert.equal(quantity(sql), 0, `Complete seed must not leave orphaned ${label} relations.`);
  assert.equal(quantity('SELECT COUNT(*) AS n FROM (SELECT class_id, date, period FROM lessons GROUP BY class_id, date, period HAVING COUNT(*) > 1)'), 0, 'Seed must not duplicate a class timetable slot.');
  assert.equal(quantity('SELECT COUNT(*) AS n FROM (SELECT teacher_id, date, period FROM lessons GROUP BY teacher_id, date, period HAVING COUNT(*) > 1)'), 0, 'Seed must not assign one teacher to two simultaneous classes.');
}

test('R02 review: injected mid-seed failure leaves no partial school and a genuine retry rebuilds all demo relations', async t => {
  const isolated = reviewDatabase();
  t.after(isolated.close);
  assert.equal(isolated.connection.prepare('SELECT COUNT(*) AS n FROM users').get()?.n, 0, 'Negative control: startup must begin with an empty, already migrated database.');
  let faultHits = 0;
  isolated.connection.function('review_seed_fault_observe', () => { faultHits++; return 1; });
  // The fault occurs only when real seed SQL reaches the lesson-writing stage,
  // after normal class/user preparation. SQLite keeps transaction semantics;
  // the service must recover rather than retaining a permanent seeded marker.
  isolated.connection.exec("CREATE TRIGGER reviewer_seed_fault BEFORE INSERT ON lessons BEGIN SELECT review_seed_fault_observe(); SELECT RAISE(ABORT, 'REVIEW_INJECTED_SEED_FAILURE'); END;");
  const before = await databaseSnapshot(isolated);
  const original = new Client(isolated.database);
  const failed = await original.call('/auth/demo', 'POST', { role: 'teacher', teacherIndex: 0 });
  assert.ok(faultHits > 0, 'Negative control: the injected failure must actually interrupt seed lesson SQL, not fail input validation or authentication first.');
  assert.ok(failed.status >= 400, `Faulted seed must not claim successful demo startup; ${detail(failed)}`);
  const afterFailure = await databaseSnapshot(isolated);
  const failedUserCount = Number(isolated.connection.prepare('SELECT COUNT(*) AS n FROM users').get()?.n ?? 0);
  const seededMarkers = isolated.connection.prepare("SELECT key FROM meta WHERE key LIKE '%seed%'").all().map(row => String(row.key));
  isolated.connection.exec('DROP TRIGGER reviewer_seed_fault');
  // Always attempt the genuine retry before asserting rollback, so the test
  // exercises recovery even when a broken implementation left partial users.
  const retryResults: ApiResult[] = [];
  for (const role of ['teacher', 'student', 'admin'] as const) retryResults.push(await new Client(isolated.database).call('/auth/demo', 'POST', { role, teacherIndex: 0 }));
  for (const result of retryResults) success(result, 'demo startup after removal of the injected seed fault');
  const retryCounts = isolated.connection.prepare('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM lessons) AS lessons, (SELECT COUNT(*) FROM requests) AS requests').get();
  const modified = Object.keys(before).filter(table => before[table] !== afterFailure[table]);
  assert.deepEqual(modified, [], `A failed seed must roll back all school data and seed claims; leftover users=${failedUserCount}, seed markers=${seededMarkers.join(', ')}, modified tables=${modified.join(', ')}; successful retry counts=${JSON.stringify(retryCounts)}.`);
  assertDemoSeedIntegrity(isolated);
  const recipient = new Client(isolated.database);
  const user = await recipient.demo('teacher', 1);
  assert.notEqual(user.id, (retryResults[0].body.user as User).id, 'Recovery must rebuild both original and recipient one-click teacher accounts.');
});

test('R02 review: parallel first demo requests on an empty migrated database all see one complete seed', async t => {
  const isolated = reviewDatabase();
  t.after(isolated.close);
  assert.equal(isolated.connection.prepare('SELECT COUNT(*) AS n FROM users').get()?.n, 0, 'Negative control: parallel startup cannot reuse an already seeded fixture.');
  assert.equal(isolated.connection.prepare('SELECT COUNT(*) AS n FROM lessons').get()?.n, 0);
  let release!: () => void;
  const beginTogether = new Promise<void>(resolve => { release = resolve; });
  const inputs: { role: Role; teacherIndex?: number }[] = [
    { role: 'teacher', teacherIndex: 0 }, { role: 'teacher', teacherIndex: 1 }, { role: 'student' }, { role: 'admin' },
    { role: 'teacher', teacherIndex: 0 }, { role: 'teacher', teacherIndex: 1 }, { role: 'student' }, { role: 'admin' },
  ];
  const clients = inputs.map(() => new Client(isolated.database));
  const pending = inputs.map(async (input, index) => { await beginTogether; return clients[index].call('/auth/demo', 'POST', input); });
  release();
  const outcomes = await Promise.all(pending);
  outcomes.forEach((result, index) => {
    success(result, `parallel initial demo request ${index + 1} (${inputs[index].role}); all outcomes=${outcomes.map(detail).join(' | ')}`);
    assert.equal((result.body.user as User).role, inputs[index].role, 'Every first request must receive its requested authenticated role.');
  });
  assertDemoSeedIntegrity(isolated);
  for (const client of clients) success(await client.call('/auth/me'), 'session issued during parallel seed remains valid');
  const countsBeforeReplay = isolated.connection.prepare('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM lessons) AS lessons, (SELECT COUNT(*) FROM requests) AS requests').get();
  await new Client(isolated.database).demo('admin');
  const countsAfterReplay = isolated.connection.prepare('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM lessons) AS lessons, (SELECT COUNT(*) FROM requests) AS requests').get();
  assert.deepEqual(countsAfterReplay, countsBeforeReplay, 'Later first-page visits must not duplicate or reset the complete seeded school.');
});

test('R02 review: losing transition replays cannot commit duplicate timeline, audit, or notifications', async t => {
  const operations = ['accept', 'decline', 'cancel', 'complete'] as const;
  for (const operation of operations) {
    await t.test(operation, async child => {
      const f = await fixture(child), saved = await draft(f.teacher, await sourceInput(f));
      await submit(f.teacher, saved.id);
      if (operation === 'complete') await accept(f.recipient, saved.id);
      const actor = operation === 'accept' || operation === 'decline' ? f.recipient : f.teacher;
      const path = operation === 'accept' || operation === 'decline' ? `/requests/${saved.id}/respond` : `/requests/${saved.id}/status`;
      const body = operation === 'accept' || operation === 'decline'
        ? { decision: operation, comment: 'Independent duplicate-transition regression.' }
        : { status: operation === 'cancel' ? 'Cancelled' : 'Completed', comment: 'Independent duplicate-transition regression.' };
      const action = { accept: 'confirmed', decline: 'declined', cancel: 'cancelled', complete: 'completed' }[operation];
      const eventsBefore = count(f, 'SELECT COUNT(*) AS n FROM timeline WHERE request_id = ? AND action = ?', [saved.id, action]);
      const auditBefore = count(f, 'SELECT COUNT(*) AS n FROM audit_log WHERE entity_id = ? AND action = ?', [saved.id, `request.${action}`]);
      const notificationBefore = count(f, 'SELECT COUNT(*) AS n FROM notifications WHERE request_id = ?', [saved.id]);
      const raced = new Client(gateFirstTwoWrites(f.database), actor.cookie);
      const outcomes = await Promise.all([raced.call(path, 'POST', body), raced.call(path, 'POST', body)]);
      assert.equal(outcomes.filter(result => result.status >= 200 && result.status < 300).length, 1, `Exactly one ${operation} transition can succeed; ${outcomes.map(detail).join(' | ')}`);
      assert.equal(outcomes.filter(result => result.status === 409).length, 1, `The replay must be rejected with 409; ${outcomes.map(detail).join(' | ')}`);
      const eventsAfter = count(f, 'SELECT COUNT(*) AS n FROM timeline WHERE request_id = ? AND action = ?', [saved.id, action]);
      const auditAfter = count(f, 'SELECT COUNT(*) AS n FROM audit_log WHERE entity_id = ? AND action = ?', [saved.id, `request.${action}`]);
      const notificationAfter = count(f, 'SELECT COUNT(*) AS n FROM notifications WHERE request_id = ?', [saved.id]);
      const eligibleStudents = count(f, "SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND class_id = (SELECT class_id FROM requests WHERE id = ?) AND active = 1", [saved.id]);
      // The published cancellation/completion contract does not promise a
      // notification fan-out. Count only the single transition side effects
      // already published for acceptance and decline; do not invent an alert.
      const expectedNotifications = operation === 'accept' ? 1 + eligibleStudents : operation === 'decline' ? 1 : 0;
      assert.deepEqual(
        { timeline: eventsAfter - eventsBefore, audit: auditAfter - auditBefore, notifications: notificationAfter - notificationBefore },
        { timeline: 1, audit: 1, notifications: expectedNotifications },
        `Rejected ${operation} replay must not leave successful side effects; responses=${outcomes.map(detail).join(' | ')}.`,
      );
      const beforeSequentialReplay = await databaseSnapshot(f);
      denied(await actor.call(path, 'POST', body), [409], `sequential ${operation} replay`);
      const afterSequentialReplay = await databaseSnapshot(f);
      assert.deepEqual(afterSequentialReplay, beforeSequentialReplay, `Sequential rejected ${operation} replay must not write any table.`);
    });
  }
});

test('R02 review: sequential rejected completion cannot alter an immutable successful history', async t => {
  const f = await fixture(t);
  const pastLesson = insertLesson(f, { date: addDays(defaultSchoolMonday(), -14), teacherId: f.original.id });
  const saved = await draft(f.teacher, inputFor(f, pastLesson));
  await submit(f.teacher, saved.id);
  await accept(f.recipient, saved.id);
  success(await f.teacher.call(`/requests/${saved.id}/status`, 'POST', { status: 'Completed', comment: 'Lesson actually occurred.' }), 'first completion of a past lesson');
  const before = await databaseSnapshot(f);
  const result = await f.teacher.call(`/requests/${saved.id}/status`, 'POST', { status: 'Completed', comment: 'Rejected replay must not be recorded as a new success.' });
  denied(result, [409], 'sequential already-Completed replay');
  const after = await databaseSnapshot(f);
  const modified = Object.keys(before).filter(table => before[table] !== after[table]);
  assert.deepEqual(modified, [], `Rejected completion must not append immutable success events; ${detail(result)}; modified tables=${modified.join(', ')}.`);
});

test('R02 review: submit atomically rechecks a destination filled by another legitimate accepted move', async t => {
  const f = await fixture(t), date = addDays(defaultSchoolMonday(), 14);
  const sourceA = insertLesson(f, { date, period: 1 });
  const sourceB = insertLesson(f, { date, period: 2 });
  const target = { date: addDays(date, 1), period: 3, room: 'Shared accepted destination' };
  const inputA = inputFor(f, sourceA, 'move', target), inputB = inputFor(f, sourceB, 'move', target);
  const a = await draft(f.teacher, inputA), b = await draft(f.teacher, inputB);
  let release!: () => void, enter!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const released = new Promise<void>(resolve => { release = resolve; });
  let hold = true;
  const gated = new Proxy(f.database, {
    get(database, property) {
      if (property === 'batch') return async (statements: D1PreparedStatement[]) => {
        // Pause only at the real service transaction boundary, after its
        // initial conflict report. Every SQL statement and DB constraint still
        // executes unchanged once the competing API transition has finished.
        if (hold && statements.some(statement => /UPDATE requests SET status = 'Pending'/i.test(String(Reflect.get(statement, 'sql') ?? '')))) {
          hold = false;
          enter();
          await released;
        }
        return database.batch(statements);
      };
      const value = Reflect.get(database, property);
      return typeof value === 'function' ? value.bind(database) : value;
    },
  });
  const delayed = new Client(gated, f.teacher.cookie).call(`/requests/${a.id}/submit`, 'POST', {});
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([entered, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Negative control: submit did not reach its actual Pending transaction within 5 seconds.')), 5000); })]);
    if (timer) clearTimeout(timer);
    await submit(f.teacher, b.id);
    await accept(f.teacher, b.id);
    const report = await f.teacher.call('/conflicts', 'POST', inputA);
    success(report, 'newly occupied destination report');
    assert.ok((report.body.conflicts as { kind: string }[]).some(conflict => conflict.kind === 'class'), 'Negative control: the other accepted API move must actually occupy this class destination.');
  } finally {
    if (timer) clearTimeout(timer);
    release();
  }
  const result = await delayed;
  denied(result, [409], 'submit after its initial conflict report becomes stale');
  assert.equal(f.connection.prepare('SELECT status FROM requests WHERE id = ?').get(a.id)?.status, 'Draft', 'Rejected stale submit must remain editable.');
  assert.equal(count(f, 'SELECT COUNT(*) AS n FROM slot_locks WHERE request_id = ?', [a.id]), 0, 'Rejected submit cannot reserve another lesson’s accepted slot.');
  assert.equal(count(f, "SELECT COUNT(*) AS n FROM timeline WHERE request_id = ? AND action = 'submitted'", [a.id]), 0, 'Only successful valid submissions may create events.');
});

test('R03 review: an existing complete R02 school remains usable after additive migration', async t => {
  const f = await fixture(t);
  const real = await register(f, 'teacher');
  const countsBefore = f.connection.prepare('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM lessons) AS lessons, (SELECT COUNT(*) FROM requests) AS requests').get();
  assert.ok(Number(countsBefore?.lessons) > 0 && Number(countsBefore?.requests) > 0, 'Negative control: this is an existing complete school, not an interrupted empty seed.');
  assert.ok(f.appliedMigrations.includes('0001_opposite_kree.sql'), 'The new additive transition-token migration must already be applied.');
  // R02 stable initialized exactly this completed school with meta.seeded=1.
  // Its tables and users remain after the additive 0001 ALTER; changing only
  // the completion-marker representation models that documented upgrade.
  // No request authorization, session, timetable, or real account is altered.
  f.connection.prepare("DELETE FROM meta WHERE key = 'seed_complete'").run();
  f.connection.prepare("INSERT INTO meta (key, value) VALUES ('seeded', '1') ON CONFLICT(key) DO UPDATE SET value = '1'").run();
  const before = await databaseSnapshot(f);
  const result = await real.client.call('/auth/me');
  const after = await databaseSnapshot(f);
  const countsAfter = f.connection.prepare('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM lessons) AS lessons, (SELECT COUNT(*) FROM requests) AS requests').get();
  assert.deepEqual(countsAfter, countsBefore, 'Migrating a completed school must retain existing demo and real accounts, lessons, and requests.');
  success(result, `existing real-account session after R02→R03 migration; modified tables=${Object.keys(before).filter(table => before[table] !== after[table]).join(', ') || '(none)'}`);
  assert.equal((result.body.user as User).id, real.user.id, 'An upgrade must keep the real account session usable.');
  success(await f.teacher.call('/workspace'), 'existing teacher workspace after additive migration');
  success(await f.student.call('/workspace'), 'existing student workspace after additive migration');
});

test('R03 review: a proven interrupted R02 seed upgrades without losing a normally registered account', async t => {
  const f = await fixture(t);
  const real = await register(f, 'teacher');
  // R02's actually exercised first-lesson seed fault committed three classes,
  // 45 demo users and meta.seeded, but no lessons/requests. R02 then allowed a
  // normal real registration. Reconstruct only that proven fixture state;
  // preserve the established account, credentials, class IDs and sessions.
  for (const table of ['notifications', 'timeline', 'supplements', 'todos', 'views', 'slot_locks']) {
    f.connection.prepare(`DELETE FROM ${table} WHERE request_id IN (SELECT id FROM requests WHERE is_demo = 1)`).run();
  }
  f.connection.prepare('DELETE FROM requests WHERE is_demo = 1').run();
  f.connection.prepare('DELETE FROM lessons WHERE is_demo = 1').run();
  f.connection.prepare("DELETE FROM meta WHERE key = 'seed_complete'").run();
  f.connection.prepare("INSERT INTO meta (key, value) VALUES ('seeded', '1') ON CONFLICT(key) DO UPDATE SET value = '1'").run();
  assert.equal(count(f, 'SELECT COUNT(*) AS n FROM classes'), 3, 'Negative control: committed R02 classes exist.');
  assert.equal(count(f, 'SELECT COUNT(*) AS n FROM users WHERE is_demo = 1'), 45, 'Negative control: all committed R02 demo accounts exist.');
  assert.equal(count(f, 'SELECT COUNT(*) AS n FROM lessons'), 0, 'Negative control: legacy seeded marker is not sufficient proof that lessons were built.');
  assert.equal(count(f, 'SELECT COUNT(*) AS n FROM requests'), 0);
  const userBefore = f.connection.prepare('SELECT * FROM users WHERE id = ?').get(real.user.id);
  const sessionsBefore = f.connection.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY token_hash').all(real.user.id);
  const result = await real.client.call('/auth/me');
  const userAfter = f.connection.prepare('SELECT * FROM users WHERE id = ?').get(real.user.id);
  const sessionsAfter = f.connection.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY token_hash').all(real.user.id);
  assert.ok(JSON.stringify(userAfter) === JSON.stringify(userBefore), 'Legacy seed repair must preserve the real account and its credentials (values deliberately not printed).');
  assert.ok(JSON.stringify(sessionsAfter) === JSON.stringify(sessionsBefore), 'Legacy seed repair must keep established real-account sessions (tokens deliberately not printed).');
  success(result, `real-account session after interrupted R02 seed upgrade; users=${count(f, 'SELECT COUNT(*) AS n FROM users')}, lessons=${count(f, 'SELECT COUNT(*) AS n FROM lessons')}, requests=${count(f, 'SELECT COUNT(*) AS n FROM requests')}`);
  assertDemoSeedIntegrity(f);
  success(await f.teacher.call('/workspace'), 'recovered teacher school after interrupted legacy seed');
  success(await f.student.call('/workspace'), 'recovered student school after interrupted legacy seed');
});

test('R04 review: legacy readiness preserves edited demo arrangements and established teacher/student relations', async t => {
  const f = await fixture(t), real = await register(f, 'teacher');
  const editedName = 'Edited demo teacher before upgrade';
  success(await f.teacher.call('/profile', 'PATCH', { name: editedName }), 'authorized demo profile edit before upgrade');
  const source = await sourceInput(f);
  const target = { date: addDays(defaultSchoolMonday(), 14), period: 5, room: 'Edited demo room' };
  const editedInput: RequestInput = {
    ...source, kind: 'move', recipientId: f.original.id,
    targetDate: target.date, targetPeriod: target.period, targetRoom: target.room,
    reason: 'Preserve this teacher-written reason during upgrade.',
    handover: { ...handover(), progress: 'Teacher-edited progress before upgrade.', teacherNotes: 'R04_PRESERVE_EDITED_DEMO_NOTE' },
  };
  const saved = await draft(f.teacher, editedInput);
  await submit(f.teacher, saved.id);
  await accept(f.teacher, saved.id);
  success(await f.teacher.call(`/requests/${saved.id}/supplements`, 'POST', { text: 'R04_PRESERVE_ESTABLISHED_SUPPLEMENT' }), 'authorized supplement before upgrade');
  success(await f.student.call(`/requests/${saved.id}/view`, 'POST', {}), 'student established read receipt before upgrade');
  success(await f.student.call(`/requests/${saved.id}/todo`, 'POST', { key: 'materials', done: true }), 'student established preparation before upgrade');
  const expectedArrangement = { teacherId: f.original.id, ...target };
  assert.deepEqual(schedule(f, source.lessonId), expectedArrangement, 'Negative control: a real API move must have changed the demo lesson before upgrade.');
  assert.equal(f.connection.prepare('SELECT is_demo FROM requests WHERE id = ?').get(saved.id)?.is_demo, 1, 'Negative control: the edited request is demo-domain data that a blind reseed could overwrite.');
  assert.equal(count(f, 'SELECT COUNT(*) AS n FROM views WHERE user_id = ? AND request_id = ?', [f.pupil.id, saved.id]), 1);
  assert.equal(count(f, "SELECT COUNT(*) AS n FROM todos WHERE user_id = ? AND request_id = ? AND key = 'materials' AND done = 1", [f.pupil.id, saved.id]), 1);
  // Represent the genuine legacy completion marker after the additive 0001.
  // R02's pre-migration requests also receive a nullable token, not an invented
  // authorization state. All meaningful edits were made via their actual API.
  f.connection.prepare('UPDATE requests SET transition_token = NULL').run();
  f.connection.prepare("DELETE FROM meta WHERE key = 'seed_complete'").run();
  f.connection.prepare("INSERT INTO meta (key, value) VALUES ('seeded', '1') ON CONFLICT(key) DO UPDATE SET value = '1'").run();
  const before = await databaseSnapshot(f);
  const preservedRows = new Map(Object.keys(before).filter(table => table !== 'meta').map(table => [
    table, f.connection.prepare(`SELECT * FROM "${table}"`).all().map(row => JSON.stringify(row)),
  ]));
  success(await real.client.call('/auth/me'), 'real session triggers compatible readiness for an edited complete legacy school');
  const after = await databaseSnapshot(f);
  const changed = Object.keys(before).filter(table => table !== 'meta' && before[table] !== after[table]);
  for (const [table, rowsBefore] of preservedRows) {
    const rowsAfter = new Set(f.connection.prepare(`SELECT * FROM "${table}"`).all().map(row => JSON.stringify(row)));
    assert.ok(rowsBefore.every(row => rowsAfter.has(row)), `Complete legacy upgrade must preserve every established ${table} row; modified tables=${changed.join(', ')} (row values deliberately not printed).`);
    if (['classes', 'users', 'lessons', 'requests'].includes(table)) {
      assert.equal(rowsAfter.size, rowsBefore.length, `Complete legacy upgrade must not duplicate ${table} that already form a complete school.`);
    }
  }
  assert.deepEqual(schedule(f, source.lessonId), expectedArrangement, 'Upgrade must preserve the immediately established moved arrangement.');
  const teacherDetail = requestOf(await f.teacher.call(`/requests/${saved.id}`), 'preserved teacher request after upgrade');
  assert.equal(teacherDetail.handover.progress, editedInput.handover.progress);
  assert.equal(teacherDetail.handover.teacherNotes, editedInput.handover.teacherNotes);
  assert.equal(f.connection.prepare('SELECT name FROM users WHERE id = ?').get(f.original.id)?.name, editedName, 'Upgrade must retain the edited demo profile.');
  success(await f.student.call(`/requests/${saved.id}`), 'established student handover remains available after upgrade');

  // The proven zero-lesson legacy failure cannot contain a moved lesson, but
  // R02 still allowed normal profile edits and real registration afterwards.
  // Exercise that branch within this one preservation regression, so repair
  // cannot reset demo profiles while retaining only the real account.
  const partial = await fixture(t), partialReal = await register(partial, 'teacher');
  success(await partial.teacher.call('/profile', 'PATCH', { name: 'Edited partial demo teacher' }), 'authorized demo profile edit before partial legacy repair');
  for (const table of ['notifications', 'timeline', 'supplements', 'todos', 'views', 'slot_locks']) {
    partial.connection.prepare(`DELETE FROM ${table} WHERE request_id IN (SELECT id FROM requests WHERE is_demo = 1)`).run();
  }
  partial.connection.prepare('DELETE FROM requests WHERE is_demo = 1').run();
  partial.connection.prepare('DELETE FROM lessons WHERE is_demo = 1').run();
  partial.connection.prepare("DELETE FROM meta WHERE key = 'seed_complete'").run();
  partial.connection.prepare("INSERT INTO meta (key, value) VALUES ('seeded', '1') ON CONFLICT(key) DO UPDATE SET value = '1'").run();
  assert.equal(count(partial, 'SELECT COUNT(*) AS n FROM lessons'), 0, 'Negative control: partial legacy repair must actually rebuild missing lessons.');
  const partialBefore = await databaseSnapshot(partial);
  success(await partialReal.client.call('/auth/me'), 'real session triggers repair of a partial legacy school with an edited demo profile');
  const partialAfter = await databaseSnapshot(partial);
  for (const table of ['classes', 'users', 'sessions']) {
    assert.equal(partialAfter[table], partialBefore[table], `Partial legacy repair must preserve established ${table}, including edited demo profiles and real credentials.`);
  }
  assertDemoSeedIntegrity(partial);
});
