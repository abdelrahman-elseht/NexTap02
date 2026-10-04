import { notFound, permanentRedirect } from 'next/navigation';
import { publicCacheKey, resolveBusinessRoute, SYNTHETIC_FIXTURE_NOTICE } from '../../../lib/domain.mjs';
import { BusinessContent } from '../../c/[cardId]/page.jsx';

export default async function BusinessPage({ params }) {
  const { slug } = await params;
  const result = resolveBusinessRoute(slug);
  if (result.kind === 'not_found') notFound();
  if (result.kind === 'redirect') permanentRedirect(result.location);
  return <main className="shell"><div className="notice"><span>{SYNTHETIC_FIXTURE_NOTICE}</span></div><BusinessContent business={result.business} /><p className="cache-note">Fresh eligibility checked · content revision {result.business.contentRevision} · cache key {publicCacheKey(result.business)}</p></main>;
}
