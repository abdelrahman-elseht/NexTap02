import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveCard, SYNTHETIC_FIXTURE_NOTICE } from '../../../lib/domain.mjs';

export default async function CardPage({ params }) {
  const { cardId } = await params;
  const result = resolveCard(cardId);
  if (result.kind === 'not_found') notFound();
  if (result.kind === 'inactive') return <main className="shell centered"><div className="eyebrow">NexTap Card</div><h1>Activation pending</h1><p>This NexTap card has not been activated yet.</p><div className="notice"><span>{SYNTHETIC_FIXTURE_NOTICE}</span></div><Link className="button" href="/">Return home</Link></main>;
  const { business } = result;
  return <main className="shell"><div className="eyebrow">NexTap Card / {result.card.cardId}</div><div className="notice"><span>{SYNTHETIC_FIXTURE_NOTICE}</span></div><BusinessContent business={business} /></main>;
}

export function BusinessContent({ business }) { return <article className="business-card"><div className="eyebrow">Published Business</div><h1>{business.name}</h1><p className="lede">{business.description}</p><div className="details"><div><span className="label">Address</span>{business.address}</div><div><span className="label">Phone</span><a href={`tel:${business.phone}`}>{business.phone}</a></div></div><Link className="button primary" href={`/b/${business.slug}`}>Share Business page</Link></article>; }
