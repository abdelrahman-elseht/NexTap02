import { parseEnvironmentIdentity } from './runtime-config.mjs';

const SAFE_COMPONENT = /^[A-Za-z0-9._-]+$/;

function unavailable() {
  return { kind: 'unavailable' };
}

function notFound() {
  return { kind: 'not_found' };
}

function normalizeEnvironment(options) {
  return parseEnvironmentIdentity(options.runtimeConfig ?? {
    environment: options.environment,
    namespace: options.namespace,
  });
}

function requireComponent(value, label) {
  if (typeof value !== 'string' || value.length === 0 || !SAFE_COMPONENT.test(value)) {
    throw new TypeError(`${label} must be a non-empty safe cache-key component`);
  }
  return value;
}

function requireBusinessId(value) {
  return requireComponent(value, 'Business ID');
}

function requireRevision(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('Content revision must be a non-negative integer');
  return value;
}

/**
 * Construct an internal content-cache key. This value identifies bytes only;
 * it is never accepted as an eligibility or authorization result.
 */
export function buildPublicCacheKey({
  environment,
  namespace,
  runtimeConfig,
  rendererVersion = 'renderer-v1',
  schemaVersion = 'schema-v1',
  businessId,
  contentRevision,
} = {}) {
  const identity = normalizeEnvironment({ environment, namespace, runtimeConfig });
  return [
    'public-business',
    identity.namespace,
    requireComponent(rendererVersion, 'Renderer version'),
    requireComponent(schemaVersion, 'Schema version'),
    requireBusinessId(businessId),
    requireRevision(contentRevision),
  ].join(':');
}

export const publicCacheKey = buildPublicCacheKey;

function callback(options, names) {
  for (const name of names) if (typeof options[name] === 'function') return options[name];
  return null;
}

function normalizeEligibility(value) {
  if (!value || typeof value !== 'object') return unavailable();
  if (value.kind === 'unavailable' || value.unavailable === true) return unavailable();
  if (value.kind === 'not_found' || value.kind === 'disabled' || value.kind === 'reassigned' || value.kind === 'inactive' || value.eligible === false) return notFound();
  if ((value.kind !== 'eligible' && value.kind !== 'published') || value.eligible === false) return unavailable();
  if (typeof value.businessId !== 'string' || value.businessId.length === 0) return unavailable();
  return {
    kind: 'eligible',
    businessId: value.businessId,
    contentRevision: value.contentRevision,
    currentImageId: value.currentImageId,
  };
}

function normalizeRevision(value, businessId) {
  if (!value || typeof value !== 'object') return unavailable();
  if (value.kind === 'unavailable' || value.unavailable === true) return unavailable();
  if (value.kind === 'not_found') return notFound();
  const resolvedBusinessId = value.businessId ?? businessId;
  const revision = value.contentRevision ?? value.revision;
  if (typeof resolvedBusinessId !== 'string' || resolvedBusinessId !== businessId || !Number.isSafeInteger(revision) || revision < 0) {
    return unavailable();
  }
  return { kind: 'revision', businessId, contentRevision: revision };
}

function extractProjection(value, tuple) {
  if (!value || typeof value !== 'object') return null;
  if (value.kind === 'unavailable') return 'unavailable';
  if (value.kind === 'not_found') return 'not_found';
  const businessId = value.businessId;
  const revision = value.contentRevision ?? value.revision;
  const projection = value.projection ?? value.value ?? value.data;
  if (businessId !== tuple.businessId || revision !== tuple.contentRevision || projection === undefined) return null;
  return { businessId, contentRevision: revision, projection };
}

function cacheEntry(tuple, projection, key) {
  return {
    key,
    environment: tuple.environment,
    namespace: tuple.namespace,
    rendererVersion: tuple.rendererVersion,
    schemaVersion: tuple.schemaVersion,
    businessId: tuple.businessId,
    contentRevision: tuple.contentRevision,
    projection,
  };
}

function readCacheEntry(value, tuple) {
  if (!value || typeof value !== 'object') return null;
  if (value.key !== tuple.key || value.environment !== tuple.environment || value.namespace !== tuple.namespace || value.rendererVersion !== tuple.rendererVersion || value.schemaVersion !== tuple.schemaVersion || value.businessId !== tuple.businessId || value.contentRevision !== tuple.contentRevision) return null;
  if (!Object.hasOwn(value, 'projection')) return null;
  return value.projection;
}

export function isMatchingPublicCacheEntry(value, tuple) {
  if (!tuple || typeof tuple !== 'object') return false;
  return readCacheEntry(value, { ...tuple, key: tuple.key ?? buildPublicCacheKey(tuple) }) !== null;
}

async function invokeResolver(resolver, args) {
  try {
    return await resolver(args);
  } catch {
    return unavailable();
  }
}

function resolveCache(options) {
  const cache = options.cache;
  return {
    get: callback(options, ['readCache', 'getCache']) ?? (typeof cache?.get === 'function' ? cache.get.bind(cache) : null),
    set: callback(options, ['writeCache', 'setCache']) ?? (typeof cache?.set === 'function' ? cache.set.bind(cache) : null),
  };
}

/**
 * Fresh public page authority. Eligibility and revision are injected so this
 * module stays independent of database/provider clients.
 */
export async function resolveFreshPublic(options = {}) {
  const eligibilityResolver = callback(options, ['resolveEligibility', 'eligibilityResolver', 'resolveCurrentEligibility']);
  const revisionResolver = callback(options, ['resolveRevision', 'revisionResolver', 'resolveCurrentRevision']);
  const projectionResolver = callback(options, ['loadProjection', 'resolveProjection', 'projectionResolver']);
  if (!eligibilityResolver || !revisionResolver || !projectionResolver) return unavailable();

  let identity;
  try {
    identity = normalizeEnvironment(options);
  } catch {
    return unavailable();
  }

  const subject = options.subject ?? options.lookup ?? options.cardId ?? options.slug ?? options.businessId;
  const eligibility = normalizeEligibility(await invokeResolver(eligibilityResolver, { subject, environment: identity.environment, namespace: identity.namespace }));
  if (eligibility.kind !== 'eligible') return eligibility;

  const revision = normalizeRevision(await invokeResolver(revisionResolver, {
    subject,
    businessId: eligibility.businessId,
    environment: identity.environment,
    namespace: identity.namespace,
  }), eligibility.businessId);
  if (revision.kind !== 'revision') return revision;
  if (eligibility.contentRevision !== undefined && eligibility.contentRevision !== revision.contentRevision) return unavailable();

  const rendererVersion = options.rendererVersion ?? 'renderer-v1';
  const schemaVersion = options.schemaVersion ?? 'schema-v1';
  let key;
  try {
    key = buildPublicCacheKey({ runtimeConfig: identity, rendererVersion, schemaVersion, businessId: revision.businessId, contentRevision: revision.contentRevision });
  } catch {
    return unavailable();
  }
  const tuple = {
    key,
    environment: identity.environment,
    namespace: identity.namespace,
    rendererVersion,
    schemaVersion,
    businessId: revision.businessId,
    contentRevision: revision.contentRevision,
  };

  const cache = resolveCache(options);
  if (cache.get) {
    try {
      const hit = readCacheEntry(await cache.get(key), tuple);
      if (hit !== null) return { kind: 'published', projection: hit, businessId: tuple.businessId, contentRevision: tuple.contentRevision, cacheKey: key, source: 'cache' };
    } catch {
      // A cache error is an optimization failure, never an authorization result.
    }
  }

  const loaded = extractProjection(await invokeResolver(projectionResolver, {
    subject,
    businessId: tuple.businessId,
    contentRevision: tuple.contentRevision,
    environment: identity.environment,
    namespace: identity.namespace,
  }), tuple);
  if (loaded === 'not_found') return notFound();
  if (loaded === 'unavailable' || !loaded) return unavailable();

  if (cache.set) {
    try {
      await cache.set(key, cacheEntry(tuple, loaded.projection, key));
    } catch {
      // A valid fresh read remains publishable when cache fill fails.
    }
  }
  return { kind: 'published', projection: loaded.projection, businessId: tuple.businessId, contentRevision: tuple.contentRevision, cacheKey: key, source: 'origin' };
}

function normalizeImageReference(value, tuple) {
  if (!value || typeof value !== 'object') return unavailable();
  if (value.kind === 'unavailable' || value.unavailable === true) return unavailable();
  if (value.kind === 'not_found' || value.current === false) return notFound();
  const image = value.image ?? value.reference ?? value;
  const imageId = image.imageId ?? image.id;
  if (typeof imageId !== 'string' || imageId.length === 0 || image.businessId !== tuple.businessId) return notFound();
  if (image.contentRevision !== undefined && image.contentRevision !== tuple.contentRevision) return notFound();
  return { kind: 'current', image };
}

/** Fresh gate for an application-mediated private image request. */
export async function resolveFreshImage(options = {}) {
  const eligibilityResolver = callback(options, ['resolveEligibility', 'eligibilityResolver', 'resolveCurrentEligibility']);
  const revisionResolver = callback(options, ['resolveRevision', 'revisionResolver', 'resolveCurrentRevision']);
  const imageResolver = callback(options, ['resolveImageReference', 'imageReferenceResolver', 'resolveCurrentImageReference']);
  if (!eligibilityResolver || !revisionResolver || !imageResolver) return unavailable();

  let identity;
  try {
    identity = normalizeEnvironment(options);
  } catch {
    return unavailable();
  }
  const subject = options.subject ?? options.imageId;
  const eligibility = normalizeEligibility(await invokeResolver(eligibilityResolver, { subject, imageId: options.imageId, environment: identity.environment, namespace: identity.namespace }));
  if (eligibility.kind !== 'eligible') return eligibility;

  const revision = normalizeRevision(await invokeResolver(revisionResolver, {
    subject,
    businessId: eligibility.businessId,
    environment: identity.environment,
    namespace: identity.namespace,
  }), eligibility.businessId);
  if (revision.kind !== 'revision') return revision;
  if (eligibility.contentRevision !== undefined && eligibility.contentRevision !== revision.contentRevision) return unavailable();

  const reference = normalizeImageReference(await invokeResolver(imageResolver, {
    imageId: options.imageId,
    businessId: revision.businessId,
    contentRevision: revision.contentRevision,
    environment: identity.environment,
    namespace: identity.namespace,
  }), revision);
  if (reference.kind !== 'current') return reference;
  const currentImageId = reference.image.imageId ?? reference.image.id;
  if (currentImageId !== options.imageId) return notFound();

  const loadObject = callback(options, ['loadImageObject', 'loadObject', 'resolveImageObject']);
  if (!loadObject) return { kind: 'published', image: reference.image, businessId: revision.businessId, contentRevision: revision.contentRevision };
  const object = await invokeResolver(loadObject, {
    imageId: options.imageId,
    image: reference.image,
    businessId: revision.businessId,
    environment: identity.environment,
    namespace: identity.namespace,
  });
  if (object.kind === 'not_found' || object === null) return notFound();
  if (object.kind === 'unavailable' || object === undefined) return unavailable();
  return { kind: 'published', image: reference.image, object: object.object ?? object, businessId: revision.businessId, contentRevision: revision.contentRevision };
}
export function createFreshAuthority(options = {}) {
  return {
    resolvePublic: (request = {}) => resolveFreshPublic({ ...options, ...request }),
    resolveImage: (request = {}) => resolveFreshImage({ ...options, ...request }),
  };
}
