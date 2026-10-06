import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { fileURLToPath } from 'node:url';

const outputArgument = process.argv[2];
const root = outputArgument ? new URL(`file://${outputArgument.replace(/\\/g, '/').replace(/\/$/, '')}/`) : new URL('../fixtures/ticket02/', import.meta.url);
const token = () => randomBytes(16).toString('base64url');
const rows = [
  { card_id: token(), status: 'Inactive', label: 'quoted, whitespace' },
  { card_id: `  ${token()}  `, status: 'Inactive', label: 'verbatim whitespace' },
  { card_id: `Case-${token()}`, status: 'Inactive', label: 'case-sensitive' },
  { card_id: `مصر-${token()}-東京`, status: 'Inactive', label: 'unicode' },
  { card_id: token(), status: 'Inactive', label: 'incompatible-route' },
  { card_id: token(), status: 'Inactive', label: 'ordinary' }
];
const csvCell = value => `"${String(value).replaceAll('"', '""')}"`;
const csv = [
  '# SYNTHETIC ONLY — NOT AUTHENTIC PHYSICAL INVENTORY OR PROVENANCE',
  'card_id,status,label',
  ...rows.map(row => [row.card_id, row.status, row.label].map(csvCell).join(','))
].join('\n') + '\n';
const base = root;
await mkdir(base, { recursive: true });
await writeFile(new URL('synthetic-inventory.csv', base), csv, 'utf8');
const qrRows = [];
for (const [index, row] of rows.entries()) {
  const route = index === 4 ? `/wrong/${row.card_id}` : `/c/${row.card_id}`;
  const payload = `https://nextap.services${route}`;
  await QRCode.toFile(fileURLToPath(new URL(`qr-${index + 1}.png`, base)), payload, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
  const svg = await QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, width: 320 });
  await writeFile(new URL(`qr-${index + 1}.svg`, base), svg, 'utf8');
  qrRows.push({ index: index + 1, token: row.card_id, payload, route, compatible: index !== 4 });
}
const evidence = {
  fixture_kind: 'synthetic-ticket-02-preparation',
  authenticity: 'NON-AUTHENTIC SYNTHETIC; DOES NOT PROVE PHYSICAL INVENTORY OR PROVENANCE',
  physical_inventory_status: 'BLOCKED_PENDING_HUMAN_APPLICABILITY_DECISION',
  token_policy: 'prospective tokens use crypto.randomBytes(16) = 128 bits; exact imported text is preserved',
  uuid_separation: { internal_uuid: randomUUID(), public_tokens_are_not_uuid: true },
  auth_recovery_authority: false,
  qr_encoder: 'qrcode npm package',
  csv: { path: 'synthetic-inventory.csv', rows: rows.length, quoted_roundtrip: true },
  qr: qrRows,
  hosted_worker_503: 'BLOCKED_SEPARATE_GATE; NOT TESTED OR WEAKENED'
};
await writeFile(new URL('evidence.json', base), JSON.stringify(evidence, null, 2) + '\n', 'utf8');
console.log(`Generated ${rows.length} synthetic rows and QR PNG/SVG pairs.`);
