import { createHash } from 'node:crypto';

/** Development-only fixtures. These values are synthetic and are not evidence of legacy token compatibility. */
export const SYNTHETIC_FIXTURE_NOTICE = 'Synthetic development fixture — not an authentic printed Card, QR, or NFC token.';

export const businesses = [{
  id: 'business-demo', name: 'Harbor Street Coffee', slug: 'harbor-street-coffee', status: 'enabled', contentRevision: 1,
  description: 'A small neighborhood coffee bar.', address: '12 Harbor Street', phone: '+15550101',
  sections: [{ type: 'hero', title: 'Welcome in', enabled: true }, { type: 'contact', title: 'Visit us', enabled: true }]
}, {
  id: 'business-disabled', name: 'Closed Demo Business', slug: 'closed-demo', status: 'disabled', contentRevision: 1,
  description: 'This fixture is intentionally not published.', sections: []
}];
export const slugAliases = [{ alias: 'old-harbor-coffee', businessId: 'business-demo' }, { alias: 'old-closed-business', businessId: 'business-disabled' }];
export const businessImages = [{
  id: 'image-demo-logo', businessId: 'business-demo', role: 'logo', objectKey: 'business-demo/logo.png',
  contentType: 'image/png', byteSize: 68, contentRevision: 1, contentHash: 'fixture-logo-v1', active: true,
}];

export const cards = [{ id: 'card-demo-internal', cardId: 'SYNTH-CARD-DEMO-001', status: 'active', businessId: 'business-demo', version: 1 },
  { id: 'card-pending-internal', cardId: 'SYNTH-CARD-PENDING-001', status: 'inactive', businessId: null, version: 1 },
  { id: 'card-disabled-internal', cardId: 'SYNTH-CARD-DISABLED-001', status: 'active', businessId: 'business-disabled', version: 1 }];

export function findBusinessBySlug(slug) { return businesses.find((business) => business.slug === slug); }
export function findCard(cardId) { return cards.find((card) => card.cardId === cardId); }

/** Fresh eligibility gate: never infer publication from card status alone. */
export function resolveCard(cardId) {
  const card = findCard(cardId);
  if (!card) return { kind: 'not_found' };
  if (card.status === 'inactive') return { kind: 'inactive' };
  const business = businesses.find((candidate) => candidate.id === card.businessId);
  if (!business || business.status !== 'enabled') return { kind: 'not_found' };
  return { kind: 'published', card, business, cacheKey: publicCacheKey(business) };
}

export function resolveBusiness(slug) {
  const result = resolveBusinessRoute(slug);
  if (result.kind !== 'published') return { kind: 'not_found' };
  return { ...result, cacheKey: publicCacheKey(result.business) };
}

export function resolvePublicImage(imageId) {
  const image = businessImages.find((candidate) => candidate.id === imageId && candidate.active);
  if (!image) return { kind: 'not_found' };

  const business = businesses.find((candidate) => candidate.id === image.businessId);
  if (!business || business.status !== 'enabled' || image.contentRevision !== business.contentRevision) {
    return { kind: 'not_found' };
  }

  return { kind: 'published', image, business };
}

export function resolveBusinessRoute(slug) {
  const current = findBusinessBySlug(slug);
  if (current) {
    if (current.status !== 'enabled') return { kind: 'not_found' };
    return { kind: 'published', business: current, redirect: false };
  }

  const alias = slugAliases.find((entry) => entry.alias === slug);
  if (!alias) return { kind: 'not_found' };

  const business = businesses.find((entry) => entry.id === alias.businessId);
  if (!business || business.status !== 'enabled') return { kind: 'not_found' };

  return { kind: 'redirect', business, location: `/b/${business.slug}` };
}

export function entityTag({ businessId, contentRevision }) {
  const value = `${businessId}:${contentRevision}`;
  const digest = createHash('sha256').update(value).digest('hex');
  return `"${digest}"`;
}

export function publicCacheKey(business) {
  return `public-business:development:renderer-v1:schema-v1:${business.id}:${business.contentRevision}`;
}

export function requestId(seed = `${Date.now()}`) { return createHash('sha256').update(seed).digest('hex').slice(0, 16); }
