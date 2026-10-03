import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewDatabase } from './review-d1.mts';

test('independent D1 adapter accepts parallel atomic batches without nested transactions', async () => {
  const fixture = reviewDatabase();
  try {
    fixture.connection.exec('CREATE TABLE reviewer_adapter_claims (slot TEXT PRIMARY KEY, owner TEXT NOT NULL)');
    const db = fixture.database;
    const outcomes = await Promise.allSettled([
      db.batch([db.prepare('INSERT INTO reviewer_adapter_claims VALUES (?, ?)').bind('slot-a', 'first')]),
      db.batch([db.prepare('INSERT INTO reviewer_adapter_claims VALUES (?, ?)').bind('slot-a', 'second')]),
    ]);
    assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1);
    assert.equal(fixture.connection.prepare('SELECT count(*) AS n FROM reviewer_adapter_claims').get()?.n, 1);
    const rejected = outcomes.find(outcome => outcome.status === 'rejected');
    assert.ok(rejected && rejected.status === 'rejected');
    assert.match(String(rejected.reason), /UNIQUE/);
    assert.doesNotMatch(String(rejected.reason), /transaction within/);
  } finally { fixture.close(); }
});

test('independent D1 adapter rolls an entire batch back on a later failed statement', async () => {
  const fixture = reviewDatabase();
  try {
    fixture.connection.exec('CREATE TABLE reviewer_adapter_rollback (id TEXT PRIMARY KEY)');
    const db = fixture.database;
    await assert.rejects(db.batch([
      db.prepare('INSERT INTO reviewer_adapter_rollback VALUES (?)').bind('same'),
      db.prepare('INSERT INTO reviewer_adapter_rollback VALUES (?)').bind('same'),
    ]), /UNIQUE/);
    assert.equal(fixture.connection.prepare('SELECT count(*) AS n FROM reviewer_adapter_rollback').get()?.n, 0);
  } finally { fixture.close(); }
});
