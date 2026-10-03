import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

// Reviewer-only historical compatibility probes, separate from the 85-case suite.
// Run only against a stable candidate, e.g.:
// REVIEW_APP_TREE=<confirmed HEAD:handover> node --experimental-strip-types --test .codex-review/historical-upgrade-probe.mts
// Never prints credentials, cookies, recovery codes, or credential fingerprints.
const root = resolve(import.meta.dirname, '..');
const legacyCommit = '73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a';
const expectedTree = process.env.REVIEW_APP_TREE;
assert.ok(expectedTree, 'Set REVIEW_APP_TREE to the confirmed stable candidate app tree before running historical probes.');
function git(...args: string[]) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }); }
function candidateStable() {
  assert.equal(git('rev-parse', 'HEAD:handover').trim(), expectedTree, 'Candidate app tree changed: withdraw this probe verdict.');
  assert.equal(git('status', '--porcelain=v1', '--', 'handover', '.github'), '', 'Product/CI must be clean before and after the probe.');
}
candidateStable();
after(candidateStable);
const asModule = (source: string) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const legacyTimeSource = git('show', `${legacyCommit}:handover/shared/time.ts`);
const legacyTimeURL = asModule(stripTypeScriptTypes(legacyTimeSource));
const legacyTime = await import(legacyTimeURL);
const legacySource = git('show', `${legacyCommit}:handover/server/service.ts`);
const legacyJS = stripTypeScriptTypes(legacySource).replace('"../shared/time.ts"', JSON.stringify(legacyTimeURL));
const legacyHandler = (await import(asModule(legacyJS))).handleApi as Handler;
const candidateHandler = (await import(new URL('../handover/server/service.ts', import.meta.url).href)).handleApi as Handler;
const legacySchema = git('show', `${legacyCommit}:handover/drizzle/0000_init.sql`);
const origin = 'http://localhost:5173';
const config = { TEACHER_INVITE_CODE: 'historical-review-invitation', DEMO_MODE: 'true' };
type Handler = (request: Request, db: D1Database, serviceConfig: typeof config) => Promise<Response>;
type SQLValue = string | number | null | Uint8Array;

function historicalDatabase() {
  const connection = new DatabaseSync(':memory:');
  connection.exec(legacySchema);
  class Statement {
    readonly sql: string;
    readonly values: SQLValue[];
    constructor(sql: string, values: SQLValue[] = []) { this.sql = sql; this.values = values; }
    bind(...values: SQLValue[]) { return new Statement(this.sql, values); }
    result() {
      const before = Number(connection.prepare('SELECT total_changes() AS n').get()?.n);
      const results = connection.prepare(this.sql).all(...this.values);
      const after = Number(connection.prepare('SELECT total_changes() AS n').get()?.n);
      const last = Number(connection.prepare('SELECT last_insert_rowid() AS n').get()?.n);
      return { success: true, results, meta: { changes: after - before, rows_written: after - before, rows_read: results.length, duration: 0, last_row_id: last } };
    }
    async run() { return this.result(); }
    async all() { return this.result(); }
    async first(column?: string) {
      const row = connection.prepare(this.sql).get(...this.values);
      return row ? column ? row[column] : row : null;
    }
    async raw() { return this.result().results.map(row => Object.values(row)); }
  }
  const database = {
    prepare: (sql: string) => new Statement(sql),
    async batch(statements: Statement[]) {
      connection.exec('BEGIN');
      try { const results = statements.map(statement => statement.result()); connection.exec('COMMIT'); return results; }
      catch (error) {
        if (Reflect.get(connection, 'isTransaction') !== false) {
          try { connection.exec('ROLLBACK'); } catch { /* Preserve the original SQL failure. */ }
        }
        throw error;
      }
    },
    async exec(sql: string) { connection.exec(sql); return { count: 1, duration: 0 }; },
    withSession() { return this; },
  } as unknown as D1Database;
  return { database, connection, close: () => connection.close() };
}
type Fixture = ReturnType<typeof historicalDatabase>;
async function api(f: Fixture, handler: Handler, path: string, method = 'GET', body?: unknown, cookie = '') {
  const headers = new Headers({ Origin: origin });
  if (cookie) headers.set('Cookie', cookie);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await handler(new Request(`${origin}/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), f.database, config);
  const text = await response.text();
  const data = response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) as Record<string, any> : {};
  return { status: response.status, body: data, cookie: (response.headers.get('set-cookie') ?? '').split(';')[0] };
}
function success(result: Awaited<ReturnType<typeof api>>, context: string) {
  assert.equal(result.status, 200, `${context}: HTTP ${result.status}; error=${String(result.body.error ?? '(none)')}`);
}
function counts(f: Fixture) {
  return Object.fromEntries(['classes', 'users', 'lessons', 'requests'].map(table => [table, Number(f.connection.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n)]));
}
function migrate(f: Fixture) {
  const directory = resolve(root, 'handover/drizzle');
  // Actual historical 0000 was already applied; apply every subsequent real SQL.
  // Drizzle added only its parser delimiter comments in R03. Compare every
  // remaining SQL byte; a delimiter is not an applied schema change.
  const withoutDrizzleMarkers = (sql: string) => sql.replace(/^--> statement-breakpoint$/gm, '');
  assert.equal(withoutDrizzleMarkers(readFileSync(resolve(directory, '0000_init.sql'), 'utf8')), withoutDrizzleMarkers(legacySchema), 'Historical baseline SQL changed; provide a migration rather than rewriting the deployed baseline.');
  for (const file of readdirSync(directory).filter(file => file.endsWith('.sql') && file !== '0000_init.sql').sort()) {
    f.connection.exec(readFileSync(resolve(directory, file), 'utf8'));
  }
}
async function realTeacher(f: Fixture) {
  const registered = await api(f, legacyHandler, '/auth/register', 'POST', {
    email: `historical-${crypto.randomUUID()}@example.org`, password: `Review-${crypto.randomUUID()}`,
    name: 'Historical registered teacher', role: 'teacher', subjects: ['Math'], inviteCode: config.TEACHER_INVITE_CODE,
  });
  success(registered, 'actual R02 ordinary teacher registration');
  assert.equal(registered.body.user.isDemo, false);
  assert.ok(registered.cookie, 'Actual registration must issue a session.');
  const userId = String(registered.body.user.id);
  success(await api(f, legacyHandler, '/auth/me', 'GET', undefined, registered.cookie), 'actual R02 ordinary session before upgrade');
  return { userId, cookie: registered.cookie,
    userFingerprint: JSON.stringify(f.connection.prepare('SELECT * FROM users WHERE id=?').get(userId)),
    sessionFingerprint: JSON.stringify(f.connection.prepare('SELECT * FROM sessions WHERE user_id=? ORDER BY token_hash').all(userId)),
  };
}
function realPreserved(f: Fixture, real: Awaited<ReturnType<typeof realTeacher>>) {
  assert.ok(JSON.stringify(f.connection.prepare('SELECT * FROM users WHERE id=?').get(real.userId)) === real.userFingerprint, 'Upgrade must preserve the actual ordinary user and credentials.');
  assert.ok(JSON.stringify(f.connection.prepare('SELECT * FROM sessions WHERE user_id=? ORDER BY token_hash').all(real.userId)) === real.sessionFingerprint, 'Upgrade must preserve the actual ordinary session.');
}
function requestFingerprint(row: Record<string, unknown> | undefined) {
  assert.ok(row);
  const { transition_token, ...originalColumns } = row;
  return JSON.stringify(originalColumns);
}

test('historical R02 complete school preserves real session/custom URL and repairs only known demo worksheet stub', async t => {
  const f = historicalDatabase(); t.after(f.close);
  success(await api(f, legacyHandler, '/auth/demo', 'POST', { role: 'teacher', teacherIndex: 0 }), 'actual R02 complete seed');
  assert.deepEqual(counts(f), { classes: 3, users: 45, lessons: 120, requests: 7 });
  const real = await realTeacher(f);
  const date = legacyTime.addDays(legacyTime.defaultSchoolMonday(), 14) as string;
  const lessonId = `historical-real-lesson-${crypto.randomUUID()}`;
  f.connection.prepare('INSERT INTO lessons (id,class_id,subject,teacher_id,date,period,room,base_teacher_id,base_date,base_period,base_room,is_demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)').run(
    lessonId, 'demo-class-7a', 'Math', real.userId, date, 5, 'Reviewer room', real.userId, date, 5, 'Reviewer room');
  const saved = await api(f, legacyHandler, '/requests', 'POST', {
    lessonId, kind: 'substitute', targetDate: date, targetPeriod: 5, targetRoom: 'Reviewer room', recipientId: 'demo-teacher-1',
    reasonCategory: 'other', reason: 'Ordinary teacher selected this external material.',
    handover: { progress: 'Ordinary curriculum progress', plan: 'Ordinary teacher plan',
      materials: [{ title: 'Teacher selected external worksheet', url: 'https://example.org/worksheet' }],
      assessment: 'Ordinary assessment', equipment: 'Ordinary equipment', studentReminder: 'Ordinary reminder', teacherNotes: 'Ordinary private note' },
  }, real.cookie);
  success(saved, 'actual R02 ordinary Draft with custom external URL');
  assert.equal(saved.body.request.status, 'Draft');
  const customId = String(saved.body.request.id);
  const beforeCustom = requestFingerprint(f.connection.prepare('SELECT * FROM requests WHERE id=?').get(customId));
  const beforeCounts = counts(f);
  const oldMaterial = JSON.parse(String(f.connection.prepare("SELECT handover_json FROM requests WHERE id='demo-request-confirmed'").get()?.handover_json)).materials;
  assert.deepEqual(oldMaterial, [{ title: 'Practice worksheet', url: 'https://example.org/worksheet' }], 'Negative control must use the real R02 known template stub.');
  migrate(f);
  const me = await api(f, candidateHandler, '/auth/me', 'GET', undefined, real.cookie);
  success(me, 'candidate ordinary session after actual additive migration');
  realPreserved(f, real);
  assert.deepEqual(counts(f), beforeCounts, 'Complete legacy upgrade must preserve counts.');
  assert.ok(requestFingerprint(f.connection.prepare('SELECT * FROM requests WHERE id=?').get(customId)) === beforeCustom, 'Ordinary custom URL and all handover fields must remain unchanged, including the same external URL.');
  const knownSeedMaterials = JSON.parse(String(f.connection.prepare("SELECT handover_json FROM requests WHERE id='demo-request-confirmed'").get()?.handover_json)).materials as { title: string; url: string }[];
  const remainingKnownStubs = knownSeedMaterials.filter(item => item.title === 'Practice worksheet' && item.url === 'https://example.org/worksheet').length;
  t.diagnostic(JSON.stringify({ ordinarySession: me.status, counts: counts(f), customURLPreserved: true, knownSeedMaterials, remainingKnownStubs }));
  assert.equal(remainingKnownStubs, 0, 'R03 required existing known demo stubs to be replaced with readable owned material; repairing only new seeds is insufficient.');
});

for (const failAt of [1, 2]) {
  test(`historical R02 actual seed failure at lesson ${failAt} recovers missing demo relations while preserving ordinary session`, async t => {
    const f = historicalDatabase(); t.after(f.close);
    let attempts = 0;
    f.connection.function('review_historical_fault', () => ++attempts === failAt ? 1 : 0);
    f.connection.exec("CREATE TRIGGER reviewer_actual_seed_fault BEFORE INSERT ON lessons WHEN review_historical_fault()=1 BEGIN SELECT RAISE(ABORT,'REVIEW_ACTUAL_R02_SEED_FAILURE'); END");
    const failed = await api(f, legacyHandler, '/auth/demo', 'POST', { role: 'teacher', teacherIndex: 0 });
    assert.equal(failed.status, 500, 'Negative control must cause the actual old seed API to fail.');
    assert.equal(attempts, failAt, 'Fault must actually hit the selected historical lesson insertion.');
    assert.deepEqual(counts(f), { classes: 3, users: 45, lessons: failAt - 1, requests: 0 });
    assert.equal(f.connection.prepare("SELECT value FROM meta WHERE key='seeded'").get()?.value, '1');
    f.connection.exec('DROP TRIGGER reviewer_actual_seed_fault');
    const real = await realTeacher(f);
    const beforeLessons = counts(f).lessons;
    migrate(f);
    const me = await api(f, candidateHandler, '/auth/me', 'GET', undefined, real.cookie);
    success(me, 'candidate ordinary session after interrupted historical seed');
    realPreserved(f, real);
    const afterCounts = counts(f);
    const completionMarker = f.connection.prepare("SELECT value FROM meta WHERE key='seed_complete'").get()?.value;
    t.diagnostic(JSON.stringify({ actualFaultHit: attempts, beforeLessons, ordinarySession: me.status, after: afterCounts, completionMarker }));
    assert.equal(afterCounts.lessons, 120, 'A genuine interrupted R02 school must recover both demo school weeks, not be marked complete after one lesson.');
    assert.equal(afterCounts.requests, 7, 'Interrupted old seed must recover the actual sample requests.');
    assert.equal(afterCounts.users, 46, 'Repair must retain all demo users plus the actual ordinary teacher.');
    assert.equal(afterCounts.classes, 3);
    assert.equal(completionMarker, '1');
    assert.equal(Number(f.connection.prepare('SELECT COUNT(*) AS n FROM requests r LEFT JOIN lessons l ON l.id=r.lesson_id WHERE l.id IS NULL').get()?.n), 0);
    assert.equal(Number(f.connection.prepare('SELECT COUNT(*) AS n FROM lessons l LEFT JOIN users u ON u.id=l.teacher_id WHERE u.id IS NULL').get()?.n), 0);
  });
}
