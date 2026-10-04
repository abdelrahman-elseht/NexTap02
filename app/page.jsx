import Link from 'next/link';
import { SYNTHETIC_FIXTURE_NOTICE, cards } from '../lib/domain.mjs';
import './globals.css';

export const metadata = { title: 'NexTap — development slice', description: 'Synthetic development site for NexTap Phase 1.' };

export default function Home() {
  return <main className="shell">
    <header className="masthead"><div className="eyebrow">NexTap / Phase 1</div><h1>One tap to your place.</h1><p className="lede">A focused public-page slice for testing Card resolution and Business publication.</p></header>
    <section className="notice" aria-label="fixture notice"><strong>Development only</strong><span>{SYNTHETIC_FIXTURE_NOTICE}</span></section>
    <section className="panel"><h2>Try the public resolver</h2><p>These routes exercise the fresh Card and Business eligibility gate. Disabled and unknown resources fail closed.</p><div className="links"><Link className="button primary" href="/c/SYNTH-CARD-DEMO-001">Open active synthetic Card</Link><Link className="button" href="/c/SYNTH-CARD-PENDING-001">Open inactive synthetic Card</Link><Link className="button" href="/b/harbor-street-coffee">Open published Business</Link></div></section>
    <section className="panel"><h2>Fixture inventory</h2><ul className="fixture-list">{cards.map((card) => <li key={card.id}><code>{card.cardId}</code><span>{card.status === 'active' ? 'Active fixture' : 'Inactive fixture'}</span></li>)}</ul></section>
    <footer>Authentic printed-token compatibility, provider controls, adapter compatibility, and operating targets remain external Phase 1 gates.</footer>
  </main>;
}
