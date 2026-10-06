import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const exec = promisify(execFile);
const root = path.resolve('fixtures/ticket02');

test('Ticket 02 synthetic fixture generation preserves quoted token text and routes', async () => {
  await rm(root, { recursive: true, force: true });
  await exec(process.execPath, ['scripts/ticket02-synthetic.mjs']);
  const evidence = JSON.parse(await readFile(path.join(root, 'evidence.json'), 'utf8'));
  const csv = await readFile(path.join(root, 'synthetic-inventory.csv'), 'utf8');
  assert.match(evidence.authenticity, /NON-AUTHENTIC SYNTHETIC/);
  assert.equal(evidence.physical_inventory_status, 'BLOCKED_PENDING_HUMAN_APPLICABILITY_DECISION');
  assert.equal(evidence.auth_recovery_authority, false);
  assert.equal(evidence.uuid_separation.public_tokens_are_not_uuid, true);
  assert.equal(evidence.csv.quoted_roundtrip, true);
  assert.equal(evidence.qr.length, 6);
  assert.equal(evidence.qr.filter(row => row.compatible).length, 5);
  for (const row of evidence.qr) {
    assert.match(row.payload, /^https:\/\/nextap\.services\/(c|wrong)\//);
    assert.equal(row.payload.endsWith(row.token), true, 'decoded payload must preserve token bytes');
    assert.equal((await readFile(path.join(root, `qr-${row.index}.png`))).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.match(await readFile(path.join(root, `qr-${row.index}.svg`), 'utf8'), /<svg/);
  }
  assert.match(csv, /"  [^"]+  "/);
  assert.match(csv, /مصر-/);
  assert.match(csv, /"Case-/);
});
