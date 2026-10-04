import test from 'node:test';
import assert from 'node:assert/strict';
import { runMaintenance, assertMaintenanceConfiguration } from '../lib/maintenance.mjs';
import { POST, GET } from '../app/api/internal/maintenance/route.js';

function fakeCandidates(items) {
  const records = new Map(items.map((item) => [item.id, { ...item, state: 'pending' }]));
  const calls = { current: [], completed: [], skipped: [], retryable: [] };
  return {
    calls,
    async claimDue(limit) {
      return [...records.values()].filter((item) => item.state !== 'completed').slice(0, limit);
    },
    async isCurrentReference(key) {
      calls.current.push(key);
      return key === 'current-key';
    },
    async markCompleted(id, _candidate, _original, details) {
      records.get(id).state = 'completed';
      calls.completed.push({ id, details });
    },
    async markSkipped(id, _candidate, _original, details) {
      records.get(id).state = 'completed';
      calls.skipped.push({ id, details });
    },
    async markRetryableFailure(id, _candidate, _original, details) {
      records.get(id).state = 'retryable';
      calls.retryable.push({ id, details });
    },
    snapshot() { return [...records.values()]; },
  };
}

test('maintenance deletes unreferenced objects, completes missing objects, skips current references, and retains retryable failures', async () => {
  const candidates = fakeCandidates([
    { id: 'delete', storageObjectKey: 'old-key' },
    { id: 'missing', storageObjectKey: 'missing-key' },
    { id: 'current', storageObjectKey: 'current-key' },
    { id: 'failure', storageObjectKey: 'failure-key' },
  ]);
  const deleted = [];
  const objectStore = {
    async delete(key) {
      if (key === 'missing-key') throw Object.assign(new Error('gone'), { code: 'not_found' });
      if (key === 'failure-key') throw Object.assign(new Error('timeout'), { code: 'provider_timeout' });
      deleted.push(key);
    },
  };

  const result = await runMaintenance({ candidates, objectStore, limit: 10, now: () => new Date('2026-01-01T00:00:00Z') });
  assert.deepEqual(result, { limit: 10, claimed: 4, deleted: 1, missing: 1, skippedCurrent: 1, retryableFailures: 1 });
  assert.deepEqual(deleted, ['old-key']);
  assert.equal(candidates.calls.completed.length, 2);
  assert.equal(candidates.calls.skipped.length, 1);
  assert.equal(candidates.calls.retryable.length, 1);
  assert.equal(candidates.calls.retryable[0].details.error.message, 'Object deletion is retryable.');
  assert.equal(candidates.calls.retryable[0].details.error.code, 'provider_timeout');

  const second = await runMaintenance({ candidates, objectStore, limit: 10 });
  assert.equal(second.deleted, 0);
  assert.equal(second.missing, 0);
  assert.equal(second.skippedCurrent, 0);
  assert.equal(second.retryableFailures, 1);
  assert.deepEqual(deleted, ['old-key']);
});

test('maintenance retains candidates when current-reference authority is unknown', async () => {
  const candidates = fakeCandidates([{ id: 'unknown', storageObjectKey: 'unknown-key' }]);
  candidates.isCurrentReference = async () => undefined;
  const deleted = [];
  const result = await runMaintenance({ candidates, objectStore: { async delete(key) { deleted.push(key); } } });
  assert.equal(result.deleted, 0);
  assert.equal(result.retryableFailures, 1);
  assert.deepEqual(deleted, []);
  assert.equal(candidates.calls.retryable[0].details.error.code, 'reference_state_unknown');
});

test('maintenance GET is rejected with the documented method status', async () => {
  const response = await GET(new Request('http://localhost/api/internal/maintenance'));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
  assert.match(response.headers.get('x-request-id'), UUID);
});

test('maintenance bounds candidate work and rejects invalid limits', async () => {
  const candidates = fakeCandidates([
    { id: 'one', storageObjectKey: 'one' },
    { id: 'two', storageObjectKey: 'two' },
  ]);
  const objectStore = { async delete() {} };
  const result = await runMaintenance({ candidates, objectStore, limit: 1 });
  assert.equal(result.claimed, 1);
  await assert.rejects(() => runMaintenance({ candidates, objectStore, limit: 0 }), (error) => error.code === 'invalid_limit' && error.status === 409);
  await assert.rejects(() => runMaintenance({ candidates, objectStore, limit: 1001 }), (error) => error.code === 'invalid_limit');
});

test('maintenance configuration requires both secret and environment identity', () => {
  assert.throws(() => assertMaintenanceConfiguration({ expectedSecret: '', expectedEnvironmentId: 'staging' }), (error) => error.status === 503);
  assert.throws(() => assertMaintenanceConfiguration({ secret: 'wrong', environmentId: 'staging', expectedSecret: 'right', expectedEnvironmentId: 'staging' }), (error) => error.status === 403);
  assert.throws(() => assertMaintenanceConfiguration({ secret: 'right', environmentId: 'production', expectedSecret: 'right', expectedEnvironmentId: 'staging' }), (error) => error.status === 403);
  assert.doesNotThrow(() => assertMaintenanceConfiguration({ secret: 'right', environmentId: 'staging', expectedSecret: 'right', expectedEnvironmentId: 'staging' }));
});

const originalSecret = process.env.NEXTAP_MAINTENANCE_SECRET;
const originalEnvironment = process.env.NEXTAP_ENVIRONMENT_ID;
const originalRuntime = globalThis.__NEXTAP_MAINTENANCE__;

test.after(() => {
  if (originalSecret === undefined) delete process.env.NEXTAP_MAINTENANCE_SECRET;
  else process.env.NEXTAP_MAINTENANCE_SECRET = originalSecret;
  if (originalEnvironment === undefined) delete process.env.NEXTAP_ENVIRONMENT_ID;
  else process.env.NEXTAP_ENVIRONMENT_ID = originalEnvironment;
  if (originalRuntime === undefined) delete globalThis.__NEXTAP_MAINTENANCE__;
  else globalThis.__NEXTAP_MAINTENANCE__ = originalRuntime;
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test('internal route fails closed and generates server request IDs on safe auth/status responses', async () => {
  delete process.env.NEXTAP_MAINTENANCE_SECRET;
  delete process.env.NEXTAP_ENVIRONMENT_ID;
  delete globalThis.__NEXTAP_MAINTENANCE__;
  const disabled = await POST(new Request('http://localhost/api/internal/maintenance', { method: 'POST', headers: { 'x-request-id': 'wave-f-disabled' } }));
  assert.equal(disabled.status, 503);
  assert.match(disabled.headers.get('x-request-id'), UUID);
  assert.notEqual(disabled.headers.get('x-request-id'), 'wave-f-disabled');

  process.env.NEXTAP_MAINTENANCE_SECRET = 'secret';
  process.env.NEXTAP_ENVIRONMENT_ID = 'staging';
  globalThis.__NEXTAP_MAINTENANCE__ = {
    candidates: fakeCandidates([{ id: 'one', storageObjectKey: 'one' }]),
    objectStore: { async delete() {} },
  };

  const unauthorized = await POST(new Request('http://localhost/api/internal/maintenance', { method: 'POST', headers: { 'x-request-id': 'wave-f-401', 'x-environment-id': 'staging' } }));
  assert.equal(unauthorized.status, 401);
  assert.match(unauthorized.headers.get('x-request-id'), UUID);
  assert.notEqual(unauthorized.headers.get('x-request-id'), 'wave-f-401');

  const forbidden = await POST(new Request('http://localhost/api/internal/maintenance', { method: 'POST', headers: { 'x-request-id': 'wave-f-403', 'x-maintenance-secret': 'secret', 'x-environment-id': 'production' } }));
  assert.equal(forbidden.status, 403);
  assert.match(forbidden.headers.get('x-request-id'), UUID);
  assert.notEqual(forbidden.headers.get('x-request-id'), 'wave-f-403');

  const invalid = await POST(new Request('http://localhost/api/internal/maintenance', {
    method: 'POST',
    headers: { 'x-request-id': 'wave-f-409', 'x-maintenance-secret': 'secret', 'x-environment-id': 'staging', 'content-type': 'application/json' },
    body: JSON.stringify({ limit: 0 }),
  }));
  assert.equal(invalid.status, 409);
  assert.match(invalid.headers.get('x-request-id'), UUID);
  assert.notEqual(invalid.headers.get('x-request-id'), 'wave-f-409');

  const success = await POST(new Request('http://localhost/api/internal/maintenance', {
    method: 'POST',
    headers: { 'x-request-id': 'wave-f-ok', 'x-maintenance-secret': 'secret', 'x-environment-id': 'staging' },
  }));
  assert.equal(success.status, 200);
  assert.match(success.headers.get('x-request-id'), UUID);
  assert.notEqual(success.headers.get('x-request-id'), 'wave-f-ok');
  assert.equal((await success.json()).requestId, success.headers.get('x-request-id'));
});
