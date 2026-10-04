import test from 'node:test';
import assert from 'node:assert/strict';
import { entityTag, resolveCard, resolveBusiness, resolveBusinessRoute, resolvePublicImage, SYNTHETIC_FIXTURE_NOTICE, publicCacheKey } from '../lib/domain.mjs';

test('active Card publishes only through an enabled Business', () => {
  const result = resolveCard('SYNTH-CARD-DEMO-001');
  assert.equal(result.kind, 'published');
  assert.equal(result.business.slug, 'harbor-street-coffee');
  assert.equal(result.cacheKey, publicCacheKey(result.business));
});

test('inactive Card returns activation-pending state without assignment disclosure', () => {
  const result = resolveCard('SYNTH-CARD-PENDING-001');
  assert.deepEqual(result, { kind: 'inactive' });
});

test('active Card assigned to disabled Business fails closed', () => {
  assert.deepEqual(resolveCard('SYNTH-CARD-DISABLED-001'), { kind: 'not_found' });
  assert.deepEqual(resolveBusiness('closed-demo'), { kind: 'not_found' });
});

test('unknown Card and slug fail closed', () => {
  assert.deepEqual(resolveCard('unknown'), { kind: 'not_found' });
  assert.deepEqual(resolveBusiness('unknown'), { kind: 'not_found' });
});

test('current Business slug publishes without redirect', () => {
  const result = resolveBusinessRoute('harbor-street-coffee');
  assert.equal(result.kind, 'published');
  assert.equal(result.redirect, false);
  assert.equal(result.business.slug, 'harbor-street-coffee');
});

test('former slug redirects to current slug without exposing internal ID', () => {
  const result = resolveBusinessRoute('old-harbor-coffee');
  assert.equal(result.kind, 'redirect');
  assert.equal(result.location, '/b/harbor-street-coffee');
  assert.equal(Object.hasOwn(result, 'business'), true);
  assert.equal(result.location.includes(result.business.id), false);
});

test('alias for disabled Business fails closed', () => {
  assert.deepEqual(resolveBusinessRoute('old-closed-business'), { kind: 'not_found' });
});

test('unknown alias fails closed', () => {
  assert.deepEqual(resolveBusinessRoute('unknown-alias'), { kind: 'not_found' });
});

test('entity tags are deterministic and revision-based', () => {
  const first = entityTag({ businessId: 'business-demo', contentRevision: 1 });
  assert.equal(first, entityTag({ businessId: 'business-demo', contentRevision: 1 }));
  assert.match(first, /^"[a-f0-9]{64}"$/);
  assert.notEqual(first, entityTag({ businessId: 'business-demo', contentRevision: 2 }));
  assert.notEqual(first, entityTag({ businessId: 'business-other', contentRevision: 1 }));
});

test('current image requires an enabled Business and matching content revision', () => {
  const result = resolvePublicImage('image-demo-logo');
  assert.equal(result.kind, 'published');
  assert.equal(result.image.objectKey, 'business-demo/logo.png');
  assert.equal(resolvePublicImage('unknown-image').kind, 'not_found');
});

test('fixtures carry an explicit non-authentic disclosure', () => {
  assert.match(SYNTHETIC_FIXTURE_NOTICE, /Synthetic/);
  assert.match(SYNTHETIC_FIXTURE_NOTICE, /not an authentic/);
});
