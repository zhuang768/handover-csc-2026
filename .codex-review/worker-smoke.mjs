import assert from 'node:assert/strict';

const origin = process.env.HANDOVER_REVIEW_URL || 'http://127.0.0.1:8789';
const anonymous = await fetch(origin + '/api/workspace');
assert.equal(anonymous.status, 401, 'anonymous workspace must fail');
for (const role of ['student', 'teacher', 'admin']) {
  const login = await fetch(origin + '/api/auth/demo', {
    method: 'POST', headers: {'content-type': 'application/json', origin},
    body: JSON.stringify({role}),
  });
  assert.equal(login.status, 200, `${role} demo status`);
  const auth = await login.json();
  const cookieHeader = login.headers.get('set-cookie');
  assert.ok(cookieHeader?.includes('HttpOnly'), 'session must be HttpOnly');
  if (origin.startsWith('https:')) assert.ok(cookieHeader?.includes('Secure'));
  const cookie = cookieHeader.split(';')[0];
  const workspace = await fetch(origin + '/api/workspace', {headers: {cookie}});
  assert.equal(workspace.status, 200, `${role} workspace`);
  const data = await workspace.json();
  assert.equal(data.user.role, role);
  assert.equal(data.user.id, auth.user.id);
  if (role === 'student') {
    assert.ok(data.lessons.every(l => l.classId === auth.user.classId));
    assert.ok(data.requests.every(r => !Object.hasOwn(r.handover, 'teacherNotes')));
  }
  console.log(JSON.stringify({role, lessons:data.lessons.length, requests:data.requests.length, realSession:true}));
  const out = await fetch(origin + '/api/auth/logout', {
    method:'POST',headers:{cookie,origin,'content-type':'application/json'},body:'{}',
  });
  assert.equal(out.status, 200);
  const replay = await fetch(origin + '/api/auth/me',{headers:{cookie}});
  assert.equal(replay.status, 401, 'logged-out cookie replay must fail');
}
console.log('Worker smoke passed');
