import { createHash } from 'node:crypto';

const PRINTABLE_ASCII = /^[\x20-\x7e]{1,128}$/;

/** Return a deterministic JSON representation with object keys in lexical order. */
export function canonicalize(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Request values must contain finite numbers');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) output[key] = canonicalize(value[key]);
    }
    return output;
  }
  if (value === undefined) return null;
  throw new TypeError('Request values must be JSON-compatible');
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

/** The request digest covers the operation shape and payload, not the idempotency key. */
export function canonicalRequestDigest({ method = 'POST', path = '/', body = null, query = null, headers = null } = {}) {
  const canonical = { method: String(method).toUpperCase(), path: String(path), query, headers, body };
  return sha256(canonicalJson(canonical));
}

export const requestDigest = canonicalRequestDigest;

/** Idempotency-Key is intentionally limited to printable ASCII for stable transport behavior. */
export function isValidIdempotencyKey(value) {
  return typeof value === 'string' && PRINTABLE_ASCII.test(value);
}

export function validateIdempotencyKey(value) {
  return isValidIdempotencyKey(value);
}

export function assertIdempotencyKey(value) {
  if (!isValidIdempotencyKey(value)) {
    const error = new TypeError('Idempotency-Key must be 1-128 printable ASCII characters');
    error.code = 'invalid_idempotency_key';
    throw error;
  }
  return value;
}

export function canonicalBinding({ scope, actor, resource } = {}) {
  return canonicalJson({ scope, actor, resource });
}

export function bindingDigest(binding) {
  return sha256(canonicalBinding(binding));
}

export const requestBinding = canonicalBinding;
export const scopeActorResourceDigest = bindingDigest;

export function idempotencyIdentity({ idempotencyKey, key, scope, actor, resource } = {}) {
  const normalizedKey = idempotencyKey ?? key;
  assertIdempotencyKey(normalizedKey);
  return {
    key: normalizedKey,
    scope,
    actor,
    resource,
    binding: bindingDigest({ scope, actor, resource }),
  };
}

export function sameBinding(left, right) {
  if (left?.binding !== undefined && right?.binding !== undefined) return left.binding === right.binding;
  return bindingDigest(left) === bindingDigest(right);
}
