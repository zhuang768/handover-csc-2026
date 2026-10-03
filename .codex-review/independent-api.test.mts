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
  denied(await f.recipient.call(`/requests/${saved.id}/respond`, 'POST', { decision: 'accept' }), [409], 'recipient collision introduced after submit');
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

test('review: future Confirmed cannot complete; a past taught lesson can complete once', async t => {
  const f = await fixture(t);
  const future = insertLesson(f, { date: addDays(defaultSchoolMonday(), 14), period: 1 });
  const futureRequest = await draft(f.teacher, inputFor(f, future));
  await submit(f.teacher, futureRequest.id); await accept(f.recipient, futureRequest.id);
  denied(await f.recipient.call(`/requests/${futureRequest.id}/status`, 'POST', { status: 'Completed' }), [409, 422], 'complete a future lesson');
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
  const occupying = insertLesson(f, { date, period: 1, teacherId: f.receiver.id, room: 'Restore room' });
  const beforeSource = schedule(f, source), beforeOccupant = schedule(f, occupying);
  denied(await f.teacher.call(`/requests/${saved.id}/status`, 'POST', { status: 'Cancelled' }), [409], 'restore into occupied original class slot');
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
        assert.deepEqual(schedule(f, input.lessonId), before, 'Cancelled final state must have the original schedule, even if accept also succeeded first.');
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
