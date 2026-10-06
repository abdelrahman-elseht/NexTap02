import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import jsQR from 'jsqr';
import sharp from 'sharp';

const exec = promisify(execFile);

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const character = line[i];
    if (character === '"' && quoted && line[i + 1] === '"') { value += '"'; i += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { values.push(value); value = ''; }
    else value += character;
  }
  values.push(value);
  return values;
}

test('Ticket 02 synthetic fixture generation preserves quoted token text and routes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ticket02-'));
  try {
    await exec(process.execPath, ['scripts/ticket02-synthetic.mjs', root]);
    const evidence = JSON.parse(await readFile(path.join(root, 'evidence.json'), 'utf8'));
    const csv = await readFile(path.join(root, 'synthetic-inventory.csv'), 'utf8');
    assert.match(evidence.authenticity, /NON-AUTHENTIC SYNTHETIC/);
    assert.equal(evidence.physical_inventory_status, 'BLOCKED_PENDING_HUMAN_APPLICABILITY_DECISION');
    assert.equal(evidence.auth_recovery_authority, false);
    assert.equal(evidence.uuid_separation.public_tokens_are_not_uuid, true);
    assert.equal(evidence.csv.quoted_roundtrip, true);
    assert.equal(evidence.qr.length, 6);
    assert.equal(evidence.qr.filter(row => row.compatible).length, 5);
    const csvRows = csv.trimEnd().split('\n').slice(2).map(parseCsvLine);
    assert.deepEqual(csvRows.map(row => row[0]), evidence.qr.map(row => row.token));
    for (const row of evidence.qr) {
      const { data, info } = await sharp(path.join(root, `qr-${row.index}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
      assert.ok(decoded, `QR ${row.index} must decode`);
      assert.equal(decoded.data, row.payload);
      assert.equal(decoded.data.endsWith(row.token), true, 'decoded payload must preserve token bytes');
      assert.match(await readFile(path.join(root, `qr-${row.index}.svg`), 'utf8'), /<svg/);
    }
    assert.match(csv, /"  [^"]+  "/);
    assert.match(csv, /مصر-/);
    assert.match(csv, /"Case-/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
