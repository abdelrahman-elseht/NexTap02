const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

export class MaintenanceError extends Error {
  constructor(code, message, status = 503, details = {}) {
    super(message);
    this.name = 'MaintenanceError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function method(adapter, names) {
  for (const name of names) {
    if (typeof adapter?.[name] === 'function') return adapter[name].bind(adapter);
  }
  return null;
}

function candidateKey(candidate) {
  const key = candidate?.storageObjectKey ?? candidate?.storage_object_key ?? candidate?.objectKey ?? candidate?.key;
  if (typeof key !== 'string' || key.length === 0) throw new MaintenanceError('invalid_candidate', 'A cleanup candidate is invalid.', 503);
  return key;
}

function candidateId(candidate) {
  return candidate?.id ?? candidate?.candidateId ?? candidateKey(candidate);
}

function isMissingObject(error) {
  return error?.code === 'not_found' || error?.code === 'missing' || error?.code === 'NoSuchKey' || error?.name === 'NotFound' || error?.status === 404 || error?.statusCode === 404;
}

function safeFailure(error) {
  const code = typeof error?.code === 'string' && /^[a-z0-9_.-]{1,64}$/i.test(error.code) ? error.code : 'object_delete_failed';
  return { code, message: 'Object deletion is retryable.' };
}

function normalizeLimit(limit, maxLimit = MAX_LIMIT) {
  if (limit === undefined || limit === null) return Math.min(DEFAULT_LIMIT, maxLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    throw new MaintenanceError('invalid_limit', `Limit must be an integer from 1 to ${maxLimit}.`, 409);
  }
  return limit;
}

async function markCandidate(candidates, names, candidate, details) {
  const callback = method(candidates, names);
  if (!callback) throw new MaintenanceError('candidate_state_unavailable', 'Maintenance state is temporarily unavailable.', 503);
  return callback(candidateId(candidate), { ...candidate, ...details }, candidate, details);
}

/**
 * Run one bounded cleanup pass. Adapters own durable claiming and state writes.
 * The object-store adapter is intentionally limited to a delete operation.
 */
export async function runMaintenance({ candidates, objectStore, limit, maxLimit = MAX_LIMIT, now = () => new Date() } = {}) {
  const claim = method(candidates, ['claimDue', 'claimDueCandidates', 'listDue']);
  const remove = method(objectStore, ['delete', 'deleteObject', 'remove']);
  if (!claim || !remove) throw new MaintenanceError('maintenance_unavailable', 'Maintenance dependencies are unavailable.', 503);

  const boundedLimit = normalizeLimit(limit, Math.min(maxLimit, MAX_LIMIT));
  const claimed = await claim(boundedLimit, now());
  if (!Array.isArray(claimed)) throw new MaintenanceError('invalid_candidates', 'Maintenance returned an invalid candidate list.', 503);
  const boundedCandidates = claimed.slice(0, boundedLimit).filter((candidate) => candidate?.completedAt == null && candidate?.completed_at == null && candidate?.status !== 'completed');

  const result = {
    limit: boundedLimit,
    claimed: boundedCandidates.length,
    deleted: 0,
    missing: 0,
    skippedCurrent: 0,
    retryableFailures: 0,
  };

  const current = method(candidates, ['isCurrentReference', 'hasCurrentReference', 'currentReferenceExists']);
  if (!current) throw new MaintenanceError('candidate_state_unavailable', 'Maintenance state is temporarily unavailable.', 503);

  for (const candidate of boundedCandidates) {
    const key = candidateKey(candidate);
    let currentReference;
    try {
      currentReference = await current(key, candidate);
    } catch (error) {
      result.retryableFailures += 1;
      await markCandidate(candidates, ['markRetryableFailure', 'failRetryable', 'recordFailure'], candidate, { state: 'retryable', retryable: true, error: safeFailure(error), failedAt: now() });
      continue;
    }

    const definitelyCurrent = currentReference === true || currentReference?.isCurrent === true || currentReference?.current === true;
    const definitelyNotCurrent = currentReference === false || currentReference?.isCurrent === false || currentReference?.current === false;
    if (!definitelyCurrent && !definitelyNotCurrent) {
      result.retryableFailures += 1;
      await markCandidate(candidates, ['markRetryableFailure', 'failRetryable', 'recordFailure'], candidate, {
        state: 'retryable', retryable: true,
        error: { code: 'reference_state_unknown', message: 'Current-reference state is retryable.' },
        failedAt: now(),
      });
      continue;
    }
    if (definitelyCurrent) {
      await markCandidate(candidates, ['markSkipped', 'skip', 'complete', 'markCandidateCompleted'], candidate, { state: 'completed', skipped: 'current_reference', completedAt: now() });
      result.skippedCurrent += 1;
      continue;
    }

    try {
      const deletion = await remove(key, candidate);
      const missing = deletion?.missing === true || deletion?.notFound === true || deletion?.status === 404 || deletion?.statusCode === 404;
      await markCandidate(candidates, ['markCompleted', 'complete', 'markDeleted', 'markCandidateCompleted'], candidate, { state: 'completed', deleted: !missing, missing, completedAt: now() });
      if (missing) result.missing += 1;
      else result.deleted += 1;
    } catch (error) {
      if (isMissingObject(error)) {
        await markCandidate(candidates, ['markCompleted', 'complete', 'markDeleted', 'markCandidateCompleted'], candidate, { state: 'completed', deleted: false, missing: true, completedAt: now() });
        result.missing += 1;
      } else {
        result.retryableFailures += 1;
        await markCandidate(candidates, ['markRetryableFailure', 'failRetryable', 'recordFailure'], candidate, { state: 'retryable', retryable: true, error: safeFailure(error), failedAt: now() });
      }
    }
  }

  return result;
}

export const executeMaintenance = runMaintenance;

export function assertMaintenanceConfiguration({ secret, environmentId, expectedSecret, expectedEnvironmentId } = {}) {
  if (typeof expectedSecret !== 'string' || expectedSecret.length === 0 || typeof expectedEnvironmentId !== 'string' || expectedEnvironmentId.length === 0) {
    throw new MaintenanceError('maintenance_disabled', 'Maintenance is unavailable.', 503);
  }
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new MaintenanceError('authentication_required', 'Maintenance authentication is required.', 401);
  }
  if (secret !== expectedSecret) throw new MaintenanceError('forbidden', 'Maintenance access is forbidden.', 403);
  if (typeof environmentId !== 'string' || environmentId.length === 0) {
    throw new MaintenanceError('authentication_required', 'Maintenance environment identity is required.', 401);
  }
  if (environmentId !== expectedEnvironmentId) throw new MaintenanceError('forbidden', 'Maintenance environment is forbidden.', 403);
  return true;
}

export function maintenanceSecretFromRequest(request) {
  const explicit = request?.headers?.get?.('x-maintenance-secret') ?? request?.headers?.get?.('x-internal-maintenance-secret');
  if (explicit) return explicit;
  const authorization = request?.headers?.get?.('authorization');
  const match = typeof authorization === 'string' ? /^Bearer[ \t]+([^ \t]+)$/i.exec(authorization) : null;
  return match?.[1] ?? null;
}

export function maintenanceEnvironmentFromRequest(request) {
  return request?.headers?.get?.('x-environment-id') ?? request?.headers?.get?.('x-nextap-environment') ?? null;
}

export { DEFAULT_LIMIT, MAX_LIMIT };
