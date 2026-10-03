import assert from 'node:assert/strict';

// Reviewer-only runtime check. Creates demo-owned handovers and cancels them;
// never registers accounts, resets data, or prints response bodies/credentials.
const [target, ...flags] = process.argv.slice(2);
const origin = new URL(target).origin;
assert.equal(new URL(target).username, '');
assert.equal(new URL(target).password, '');
assert.ok(new URL(target).protocol === 'https:' ||
  (flags.includes('--local') && ['127.0.0.1', 'localhost'].includes(new URL(target).hostname)),
  'Use the literal HTTPS deployment URL, or an explicitly selected local QA worker.');
let bypass = '';
if (flags.includes('--private')) {
  process.stderr.write('Ready for private runtime JSON on stdin (input is hidden).\n');
  const raw = await new Promise((resolve, reject) => {
    let line = '';
    const tty = process.stdin.isTTY;
    const finish = () => {
      process.stdin.removeListener('data', read);
      process.stdin.removeListener('end', finish);
      if (tty) process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve(line.trim());
    };
    const read = chunk => {
      if (chunk.includes('\u0003')) return reject(new Error('Cancelled'));
      line += chunk;
      if (line.length > 16000) return reject(new Error('Input too long'));
      if (line.includes('\n') || line.includes('\r')) finish();
    };
    if (tty) process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', read);
    process.stdin.once('end', finish);
    process.stdin.resume();
  });
  bypass = JSON.parse(raw).bypass;
  assert.ok(typeof bypass === 'string' && bypass.length > 0, 'Private service access is required.');
}

let step = 'initialization';
let httpFailure = '';
let cleanupClient;
const createdIds = new Set();
class Client {
  cookie = '';
  async call(path, method = 'GET', body, expected = 200) {
    assert.ok(path.startsWith('/api/') && !path.includes('://'));
    const headers = new Headers({ Origin: origin });
    if (bypass) headers.set('OAI-Sites-Authorization', `Bearer ${bypass}`);
    if (this.cookie) headers.set('Cookie', this.cookie);
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await fetch(origin + path, {
      method, headers, redirect: 'manual',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status !== expected) httpFailure = `${method} ${path}: expected ${expected}, received ${response.status}`;
    assert.equal(response.status, expected, `${step}: ${method} ${path} status`);
    assert.match(response.headers.get('cache-control') ?? '', /no-store/i, `${step}: private HTTP cache`);
    const session = (response.headers.getSetCookie?.() ?? [response.headers.get('set-cookie') ?? ''])
      .find(value => value.startsWith('handover_session='));
    if (session) {
      assert.match(session, /HttpOnly/i, 'Session cookie must be HttpOnly');
      if (origin.startsWith('https:')) assert.match(session, /Secure/i, 'HTTPS cookie must be Secure');
      this.cookie = session.split(';')[0];
    }
    assert.match(response.headers.get('content-type') ?? '', /application\/json/i, `${step}: JSON response`);
    return await response.json();
  }
  async demo(role, teacherIndex = 0) {
    const { user } = await this.call('/api/auth/demo', 'POST', { role, teacherIndex });
    assert.ok(user.isDemo, 'Only existing demo identities may be used by this runtime check');
    return user;
  }
}

try {
  step = 'anonymous access';
  await new Client().call('/api/workspace', 'GET', undefined, 401);
  const original = new Client(), receiver = new Client(), pupil = new Client(), admin = new Client();
  cleanupClient = original;
  step = 'four real demo sessions';
  const teacher = await original.demo('teacher');
  const recipient = await receiver.demo('teacher', 1);
  const student = await pupil.demo('student');
  await admin.demo('admin');
  const workspace = await original.call('/api/workspace');
  const source = workspace.lessons.find(lesson =>
    lesson.teacherId === teacher.id && lesson.classId === student.classId && !lesson.changed &&
    !workspace.requests.some(request => request.lessonId === lesson.id &&
      ['Pending', 'Confirmed', 'Completed'].includes(request.status)));
  assert.ok(source, 'Fresh demo school must have an editable lesson for this workflow');
  const marker = `PRIVATE_RUNTIME_PROBE_${Date.now()}`;
  let input = {
    lessonId: source.id, kind: 'substitute', targetDate: source.date,
    targetPeriod: source.period, targetRoom: source.room, recipientId: recipient.id,
    reasonCategory: 'leave', reason: 'Demonstration of a lesson handover.',
    handover: {
      progress: 'Quadratic equations, page 42', plan: 'Solve the practice sheet together.',
      materials: [{title: 'Practice worksheet', url: '/worksheets/class-practice.txt'}],
      assessment: 'Review the two worked examples.', equipment: 'Whiteboard and calculator',
      studentReminder: 'Bring a calculator.', teacherNotes: marker,
    },
  };
  step = 'live available-slot selection';
  const availability = await original.call('/api/conflicts', 'POST', input);
  const end = new Date(`${workspace.week}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 7);
  const nextWeek = end.toISOString().slice(0, 10);
  const slot = availability.availableSlots.find(item =>
    item.date >= workspace.week && item.date < nextWeek &&
    (item.date !== source.date || item.period !== source.period));
  assert.ok(slot, 'Demo school must have a free class/recipient slot');
  input = {...input, targetDate: slot.date, targetPeriod: slot.period};
  const clear = await original.call('/api/conflicts', 'POST', input);
  assert.equal(clear.conflicts.length, 0, 'Selected target must be free');
  step = 'occupied slot rejects submission';
  const occupied = workspace.lessons.find(lesson => lesson.id !== source.id && lesson.classId === source.classId);
  assert.ok(occupied, 'Demo class must have another occupied lesson');
  const collisionInput = {...input, targetDate: occupied.date, targetPeriod: occupied.period};
  assert.ok((await original.call('/api/conflicts', 'POST', collisionInput)).conflicts.length > 0);
  const collisionDraft = await original.call('/api/requests', 'POST', collisionInput);
  createdIds.add(collisionDraft.request.id);
  await original.call(`/api/requests/${collisionDraft.request.id}/submit`, 'POST', {}, 409);
  await original.call(`/api/requests/${collisionDraft.request.id}/status`, 'POST', {status:'Cancelled'});
  createdIds.delete(collisionDraft.request.id);
  step = 'persisted draft and authorization';
  const created = await original.call('/api/requests', 'POST', input);
  const id = created.request.id;
  createdIds.add(id);
  assert.equal(created.request.status, 'Draft');
  assert.equal((await original.call(`/api/requests/${id}`)).request.id, id);
  await pupil.call(`/api/requests/${id}`, 'GET', undefined, 404);
  await pupil.call('/api/admin/users', 'GET', undefined, 403);
  await receiver.call(`/api/requests/${id}`, 'PATCH', input, 403);
  step = 'decline and resubmit';
  assert.equal((await original.call(`/api/requests/${id}/submit`, 'POST', {})).request.status, 'Pending');
  assert.equal((await receiver.call(`/api/requests/${id}/respond`, 'POST',
    {decision:'decline', comment:'Please clarify the worked example.'})).request.status, 'Declined');
  input.handover.plan = 'First solve example one, then practice example two.';
  await original.call(`/api/requests/${id}`, 'PATCH', input);
  await original.call(`/api/requests/${id}/submit`, 'POST', {});
  step = 'acceptance and timetable persistence';
  assert.equal((await receiver.call(`/api/requests/${id}/respond`, 'POST',
    {decision:'accept', comment:''})).request.status, 'Confirmed');
  const updated = await admin.call(`/api/workspace?week=${workspace.week}&classId=${source.classId}`);
  const moved = updated.lessons.find(lesson => lesson.id === source.id);
  assert.equal(moved.date, input.targetDate);
  assert.equal(moved.period, input.targetPeriod);
  assert.equal(moved.teacherId, recipient.id);
  step = 'student privacy and preparation persistence';
  const safe = await pupil.call(`/api/requests/${id}`);
  assert.ok(!JSON.stringify(safe).includes(marker), 'Private teacher content must be absent');
  assert.ok(!Object.hasOwn(safe.request.handover, 'teacherNotes'));
  await pupil.call(`/api/requests/${id}/todo`, 'POST', {key:'materials', done:true});
  await pupil.call(`/api/requests/${id}/view`, 'POST', {});
  assert.equal((await pupil.call(`/api/requests/${id}`)).request.todo.materials, true);
  const schoolWeek = await pupil.call(`/api/workspace?week=${workspace.week}`);
  assert.ok(schoolWeek.lessons.every(lesson => lesson.classId === student.classId));
  assert.ok(!JSON.stringify(schoolWeek).includes(marker));
  step = 'cancellation restores original lesson';
  assert.equal((await original.call(`/api/requests/${id}/status`, 'POST',
    {status:'Cancelled'})).request.status, 'Cancelled');
  createdIds.delete(id);
  const restored = (await admin.call(`/api/workspace?week=${workspace.week}&classId=${source.classId}`)).lessons
    .find(lesson => lesson.id === source.id);
  assert.equal(restored.date, source.date);
  assert.equal(restored.period, source.period);
  assert.equal(restored.teacherId, source.teacherId);
  step = 'logout invalidates session replay';
  for (const client of [original, receiver, pupil, admin]) {
    const prior = client.cookie;
    await client.call('/api/auth/logout', 'POST', {});
    client.cookie = prior;
    await client.call('/api/auth/me', 'GET', undefined, 401);
  }
  console.log(JSON.stringify({result:'PASS', origin, workflow:'Draft → Pending → Declined → revised Pending → Confirmed → Cancelled',
    realSessions:4, privateNotesAbsent:true, studentPreparationPersisted:true, timetableRestored:true,
    logoutReplayRejected:true, occupiedSlotSubmitRejected:true, dataReset:false, ordinaryAccountsCreated:false}));
} catch {
  console.error(`Hosted demo workflow failed at: ${step}. ${httpFailure || 'Assertion failed.'} No response bodies or credentials are logged.`);
  process.exitCode = 1;
} finally {
  // Cancel only IDs created by this invocation; preserve every other record.
  for (const id of createdIds) {
    try {
      await cleanupClient.call(`/api/requests/${id}/status`, 'POST', {status:'Cancelled'});
    } catch {
      console.error('A demo-owned runtime-check draft remains; no data reset was performed.');
    }
  }
}
