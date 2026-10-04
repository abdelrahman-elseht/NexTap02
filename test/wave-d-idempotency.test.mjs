import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalRequestDigest,
  isValidIdempotencyKey,
  createMemoryTransactionAdapter,
  executeIdempotent,
  staleVersionConflict,
  assertExpectedVersion,
} from '../lib/operations.mjs';

test('first request commits and a matching request replays its committed response', async () => {
  const adapter = createMemoryTransactionAdapter();
  let calls = 0;
  const input = {
    adapter, idempotencyKey: 'wave-d-first', scope: 'cards.write', actor: 'actor-1', resource: 'card-1',
    request: { method: 'POST', path: '/cards/card-1', body: { name: 'Cafe' } },
    authorize: () => true,
    operation: () => { calls += 1; return { cardId: 'card-1', version: 2 }; },
  };
  assert.deepEqual((await executeIdempotent(input)).kind, 'committed');
  const replay = await executeIdempotent(input);
  assert.equal(replay.kind, 'replay');
  assert.deepEqual(replay.response, { cardId: 'card-1', version: 2 });
  assert.equal(calls, 1);
});

test('canonical request digest ignores object key order but changes payload', () => {
  const first = canonicalRequestDigest({ method: 'post', path: '/cards', body: { b: 2, a: 1 } });
  assert.equal(first, canonicalRequestDigest({ method: 'POST', path: '/cards', body: { a: 1, b: 2 } }));
  assert.notEqual(first, canonicalRequestDigest({ method: 'POST', path: '/cards', body: { a: 1, b: 3 } }));
  assert.equal(isValidIdempotencyKey('x'), true);
  assert.equal(isValidIdempotencyKey(''), false);
  assert.equal(isValidIdempotencyKey('x'.repeat(129)), false);
  assert.equal(isValidIdempotencyKey('line\n'), false);
});

test('changed payload conflicts without invoking the operation', async () => {
  const adapter = createMemoryTransactionAdapter();
  await executeIdempotent({ adapter, idempotencyKey: 'wave-d-conflict', scope: 'cards.write', actor: 'actor-1', resource: 'card-1', request: { body: { title: 'one' } }, authorize: () => true, operation: () => 'saved' });
  let calls = 0;
  const result = await executeIdempotent({ adapter, idempotencyKey: 'wave-d-conflict', scope: 'cards.write', actor: 'actor-1', resource: 'card-1', request: { body: { title: 'two' } }, authorize: () => true, operation: () => { calls += 1; } });
  assert.equal(result.kind, 'conflict');
  assert.equal(result.code, 'idempotency_conflict');
  assert.equal(calls, 0);
});

test('matching pending record returns in-progress', async () => {
  const adapter = createMemoryTransactionAdapter();
  await adapter.seed({ key: 'wave-d-pending', scope: 'cards.write', actor: 'actor-1', resource: 'card-1', request: { body: { title: 'one' } }, status: 'pending' });
  const result = await executeIdempotent({ adapter, idempotencyKey: 'wave-d-pending', scope: 'cards.write', actor: 'actor-1', resource: 'card-1', request: { body: { title: 'one' } }, authorize: () => true, operation: () => 'never' });
  assert.equal(result.kind, 'in_progress');
});

test('stale expected version is an explicit conflict', () => {
  assert.deepEqual(staleVersionConflict(3, 4), { kind: 'conflict', code: 'stale_version', expectedVersion: 3, actualVersion: 4 });
  assert.throws(() => assertExpectedVersion(3, 4), (error) => error.code === 'stale_version');
  assert.doesNotThrow(() => assertExpectedVersion(3, 3));
});

test('authorization is checked again before replay and revoked actor cannot replay', async () => {
  const adapter = createMemoryTransactionAdapter();
  let allowed = true;
  const input = { adapter, idempotencyKey: 'wave-d-revoked', scope: 'cards.write', actor: 'actor-1', resource: 'card-1', request: { body: { title: 'one' } }, authorize: () => allowed, operation: () => ({ ok: true }) };
  assert.equal((await executeIdempotent(input)).kind, 'committed');
  allowed = false;
  const replay = await executeIdempotent(input);
  assert.equal(replay.kind, 'unauthorized');
  assert.equal(replay.code, 'authorization_required');
});
