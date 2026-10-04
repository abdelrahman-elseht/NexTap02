import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENVIRONMENT_NAMESPACES,
  RuntimeConfigError,
  createRuntimeConfig,
  parseEnvironmentIdentity,
  validateEnvironmentIdentity,
} from '../lib/runtime-config.mjs';
import {
  buildPublicCacheKey,
  createFreshAuthority,
  isMatchingPublicCacheEntry,
  resolveFreshImage,
  resolveFreshPublic,
} from '../lib/public-authority.mjs';

const base = {
  environment: 'staging',
  businessId: 'business-1',
  contentRevision: 4,
};

function eligible(contentRevision = 4) {
  return { kind: 'eligible', businessId: 'business-1', contentRevision };
}

function revision(contentRevision = 4) {
  return { kind: 'revision', businessId: 'business-1', contentRevision };
}

function projection(contentRevision = 4) {
  return { kind: 'current', businessId: 'business-1', contentRevision, projection: { name: 'Staging Cafe' } };
}

test('Wave E runtime identity accepts only explicit isolated namespaces', () => {
  assert.deepEqual([...ENVIRONMENT_NAMESPACES], ['development', 'staging', 'production']);
  assert.deepEqual(parseEnvironmentIdentity('staging'), { environment: 'staging', namespace: 'staging' });
  assert.deepEqual(createRuntimeConfig({ environment: 'production', namespace: 'production', rendererVersion: 'r2' }), {
    environment: 'production', namespace: 'production', rendererVersion: 'r2',
  });
  assert.equal(validateEnvironmentIdentity({ environment: 'development', namespace: 'development' }), true);
  assert.equal(validateEnvironmentIdentity({ environment: 'staging', namespace: 'production' }), false);
  assert.throws(() => parseEnvironmentIdentity({ environment: 'prod' }), RuntimeConfigError);
  assert.throws(() => parseEnvironmentIdentity({ environment: 'production', namespace: 'staging' }), RuntimeConfigError);
  assert.throws(() => parseEnvironmentIdentity(), RuntimeConfigError);
});

test('Wave E cache keys separate environments and include the current revision tuple', () => {
  const staging = buildPublicCacheKey(base);
  const production = buildPublicCacheKey({ ...base, environment: 'production' });
  assert.equal(staging, 'public-business:staging:renderer-v1:schema-v1:business-1:4');
  assert.notEqual(staging, production);
  assert.notEqual(staging, buildPublicCacheKey({ ...base, contentRevision: 5 }));
  assert.notEqual(staging, buildPublicCacheKey({ ...base, rendererVersion: 'renderer-v2' }));
});

test('Wave E disabled and reassigned eligibility never consults cached content', async () => {
  let cacheReads = 0;
  const common = {
    ...base,
    resolveRevision: async () => revision(),
    loadProjection: async () => projection(),
    cache: { get: async () => { cacheReads += 1; return null; } },
  };
  assert.deepEqual(await resolveFreshPublic({ ...common, resolveEligibility: async () => ({ kind: 'disabled' }) }), { kind: 'not_found' });
  assert.deepEqual(await resolveFreshPublic({ ...common, resolveEligibility: async () => ({ kind: 'reassigned' }) }), { kind: 'not_found' });
  assert.equal(cacheReads, 0);
});

test('Wave E revision mismatch fails closed before cache selection', async () => {
  let cacheReads = 0;
  const result = await resolveFreshPublic({
    ...base,
    resolveEligibility: async () => eligible(4),
    resolveRevision: async () => revision(5),
    loadProjection: async () => projection(5),
    cache: { get: async () => { cacheReads += 1; return null; } },
  });
  assert.deepEqual(result, { kind: 'unavailable' });
  assert.equal(cacheReads, 0);
});

test('Wave E cache entries cannot authorize a request and cache read failure falls back to a fresh projection', async () => {
  const staleEntry = {
    key: buildPublicCacheKey({ ...base, contentRevision: 3 }),
    environment: 'staging', namespace: 'staging', rendererVersion: 'renderer-v1', schemaVersion: 'schema-v1',
    businessId: 'business-1', contentRevision: 3, projection: { name: 'Old Cafe' },
  };
  assert.equal(isMatchingPublicCacheEntry(staleEntry, {
    ...base,
    key: buildPublicCacheKey(base),
    namespace: 'staging', rendererVersion: 'renderer-v1', schemaVersion: 'schema-v1',
  }), false);

  let projectionReads = 0;
  const result = await resolveFreshPublic({
    ...base,
    resolveEligibility: async () => eligible(),
    resolveRevision: async () => revision(),
    loadProjection: async () => { projectionReads += 1; return projection(); },
    cache: { get: async () => { throw new Error('cache unavailable'); } },
  });
  assert.equal(result.kind, 'published');
  assert.equal(result.source, 'origin');
  assert.deepEqual(result.projection, { name: 'Staging Cafe' });
  assert.equal(projectionReads, 1);
});

test('Wave E cache fill failure does not replace a valid fresh read', async () => {
  const result = await resolveFreshPublic({
    ...base,
    resolveEligibility: async () => eligible(),
    resolveRevision: async () => revision(),
    loadProjection: async () => projection(),
    cache: { get: async () => null, set: async () => { throw new Error('cache write unavailable'); } },
  });
  assert.equal(result.kind, 'published');
  assert.equal(result.source, 'origin');
});

test('Wave E cache and origin failures return unavailable rather than stale bytes', async () => {
  const result = await resolveFreshPublic({
    ...base,
    resolveEligibility: async () => eligible(),
    resolveRevision: async () => revision(),
    loadProjection: async () => { throw new Error('database unavailable'); },
    cache: { get: async () => { throw new Error('cache unavailable'); } },
  });
  assert.deepEqual(result, { kind: 'unavailable' });
});

test('Wave E image authority checks current eligibility and image reference', async () => {
  const common = {
    environment: 'staging', imageId: 'image-1',
    resolveRevision: async () => revision(),
    resolveImageReference: async () => ({ kind: 'current', image: { id: 'image-1', businessId: 'business-1', contentRevision: 4, objectKey: 'private/image-1' } }),
    loadImageObject: async () => ({ body: 'bytes' }),
  };
  assert.deepEqual(await resolveFreshImage({ ...common, resolveEligibility: async () => ({ kind: 'disabled' }) }), { kind: 'not_found' });
  assert.deepEqual(await resolveFreshImage({ ...common, resolveEligibility: async () => eligible(), resolveImageReference: async () => ({ id: 'old-image', businessId: 'business-1', contentRevision: 4 }) }), { kind: 'not_found' });
  const published = await resolveFreshImage({ ...common, resolveEligibility: async () => eligible() });
  assert.equal(published.kind, 'published');
  assert.equal(published.image.id, 'image-1');
});

test('Wave E missing image object resolves safely as not found', async () => {
  const result = await resolveFreshImage({
    environment: 'staging', imageId: 'image-1',
    resolveEligibility: async () => eligible(),
    resolveRevision: async () => revision(),
    resolveImageReference: async () => ({ kind: 'current', image: { id: 'image-1', businessId: 'business-1', contentRevision: 4 } }),
    loadImageObject: async () => null,
  });
  assert.deepEqual(result, { kind: 'not_found' });
});

test('Wave E image dependency failure is unavailable and authority factory preserves injection', async () => {
  const authority = createFreshAuthority({
    environment: 'staging',
    resolveEligibility: async () => eligible(),
    resolveRevision: async () => revision(),
    resolveImageReference: async () => { throw new Error('reference unavailable'); },
    loadProjection: async () => projection(),
    resolveProjection: async () => projection(),
  });
  assert.deepEqual(await authority.resolveImage({ imageId: 'image-1' }), { kind: 'unavailable' });
  const page = await authority.resolvePublic();
  assert.equal(page.kind, 'published');
});
