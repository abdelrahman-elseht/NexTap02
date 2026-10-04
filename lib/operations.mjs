import {
  assertIdempotencyKey,
  canonicalRequestDigest,
  idempotencyIdentity,
} from './idempotency.mjs';
export { canonicalRequestDigest, isValidIdempotencyKey, validateIdempotencyKey, assertIdempotencyKey } from './idempotency.mjs';

/**
 * Adapter boundary for a real database transaction. The callback is injected by
 * the caller so this module does not imply that process memory is durable.
 */
export function createTransactionAdapter(transaction) {
  const callback = typeof transaction === 'function'
    ? transaction
    : transaction?.transaction ?? transaction?.begin;
  if (typeof callback !== 'function') throw new TypeError('A database transaction callback is required');
  return {
    durable: true,
    transaction: (work) => callback(work),
  };
}

function cloneRecords(records) {
  return new Map([...records].map(([key, value]) => [key, structuredClone(value)]));
}

/** Process-local test adapter. It is deliberately marked non-durable. */
export function createMemoryTransactionAdapter(initialRecords = []) {
  const records = new Map();
  const adapter = {
    durable: false,
    durability: 'process-local',
    async transaction(work) {
      const working = cloneRecords(records);
      const tx = {
        getIdempotencyRecord: (key) => working.get(key),
        get: (key) => working.get(key),
        putIdempotencyRecord: (key, value) => working.set(key, structuredClone(value)),
        put: (key, value) => working.set(key, structuredClone(value)),
        deleteIdempotencyRecord: (key) => working.delete(key),
        delete: (key) => working.delete(key),
      };
      const result = await work(tx);
      records.clear();
      for (const [key, value] of working) records.set(key, value);
      return result;
    },
    async seed(record) {
      const identity = idempotencyIdentity(record);
      const digest = record.digest ?? canonicalRequestDigest(record.request);
      records.set(identity.key, {
        key: identity.key,
        binding: identity.binding,
        scope: identity.scope,
        actor: identity.actor,
        resource: identity.resource,
        digest,
        status: record.status ?? 'pending',
        response: record.response,
      });
    },
    snapshot() {
      return structuredClone([...records.values()]);
    },
  };
  for (const record of initialRecords) {
    const identity = idempotencyIdentity(record);
    records.set(identity.key, {
      ...identity,
      digest: record.digest ?? canonicalRequestDigest(record.request),
      status: record.status ?? 'pending',
      response: record.response,
    });
  }
  return adapter;
}

export function staleVersionConflict(expectedVersion, actualVersion) {
  if (expectedVersion && typeof expectedVersion === 'object' && arguments.length === 1) {
    ({ expectedVersion, actualVersion } = expectedVersion);
  }
  return { kind: 'conflict', code: 'stale_version', expectedVersion, actualVersion };
}

export const expectedVersionConflict = staleVersionConflict;

/** Check an expected version against the version currently held by storage. */
export function checkExpectedVersion(expectedVersion, actualVersion) {
  if (expectedVersion && typeof expectedVersion === 'object' && arguments.length === 1) {
    ({ expectedVersion, actualVersion } = expectedVersion);
  }
  return expectedVersion === actualVersion ? null : staleVersionConflict(expectedVersion, actualVersion);
}

/** Assert using storage's actual version first, then the caller's expected version. */
export function assertExpectedVersion(actualVersion, expectedVersion) {
  if (actualVersion && typeof actualVersion === 'object' && arguments.length === 1) {
    ({ expectedVersion, actualVersion } = actualVersion);
  }
  const conflict = checkExpectedVersion(expectedVersion, actualVersion);
  if (!conflict) return true;
  const error = new Error('Expected version is stale');
  Object.assign(error, conflict);
  throw error;
}

function isAuthorized(value) {
  return value !== false && value?.authorized !== false;
}

function responseResult(kind, response, identity, digest) {
  return { kind, response, value: response, key: identity.key, digest, binding: identity.binding };
}

/**
 * Execute an idempotent operation inside the supplied transaction adapter.
 * Authorization is evaluated before every lookup, including a replay lookup.
 * A production caller must supply createTransactionAdapter() around its DB
 * transaction; the memory adapter above is only for deterministic tests.
 */
export async function executeIdempotent({
  adapter,
  idempotencyKey,
  key,
  scope,
  actor,
  resource,
  request = {},
  digest: suppliedDigest,
  authorize = () => true,
  operation,
  expectedVersion,
  actualVersion,
} = {}) {
  if (!adapter || typeof adapter.transaction !== 'function') throw new TypeError('A transaction adapter is required');
  if (typeof operation !== 'function') throw new TypeError('An operation callback is required');
  const normalizedKey = idempotencyKey ?? key;
  assertIdempotencyKey(normalizedKey);
  const identity = idempotencyIdentity({ idempotencyKey: normalizedKey, scope, actor, resource });
  const digest = suppliedDigest ?? canonicalRequestDigest(request);

  // Deliberately outside the record lookup: replay is never an authorization bypass.
  const authorization = await authorize({ scope, actor, resource, key: normalizedKey, request });
  if (!isAuthorized(authorization)) return { kind: 'unauthorized', code: 'authorization_required', key: normalizedKey };

  const stale = expectedVersion === undefined || actualVersion === undefined
    ? null
    : checkExpectedVersion(expectedVersion, actualVersion);
  if (stale) return stale;

  return adapter.transaction(async (tx) => {
    const read = tx.getIdempotencyRecord ?? tx.get;
    const write = tx.putIdempotencyRecord ?? tx.put;
    if (typeof read !== 'function' || typeof write !== 'function') throw new TypeError('Transaction lacks idempotency record methods');
    const existing = await read.call(tx, normalizedKey);
    if (existing) {
      if (existing.binding !== identity.binding || existing.digest !== digest) {
        return { kind: 'conflict', code: 'idempotency_conflict', key: normalizedKey };
      }
      if (existing.status === 'pending') return { kind: 'in_progress', code: 'idempotency_in_progress', key: normalizedKey, digest };
      if (existing.status === 'committed') return responseResult('replay', existing.response, identity, digest);
      return { kind: 'conflict', code: 'idempotency_conflict', key: normalizedKey };
    }

    await write.call(tx, normalizedKey, {
      key: normalizedKey,
      scope,
      actor,
      resource,
      binding: identity.binding,
      digest,
      status: 'pending',
    });
    const response = await operation({ tx, key: normalizedKey, scope, actor, resource, request, digest });
    await write.call(tx, normalizedKey, {
      key: normalizedKey,
      scope,
      actor,
      resource,
      binding: identity.binding,
      digest,
      status: 'committed',
      response,
    });
    return responseResult('committed', response, identity, digest);
  });
}

export const runIdempotentOperation = executeIdempotent;
