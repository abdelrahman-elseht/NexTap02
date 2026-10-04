import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { validateAndNormalizeImage } from '../lib/image-validation.mjs';

test('normalizes valid PNG bytes', async () => {
  const input = await sharp({ create: { width: 2, height: 2, channels: 4, background: { r: 20, g: 40, b: 60, alpha: 1 } } }).png().withMetadata().toBuffer();
  const result = await validateAndNormalizeImage(input);
  assert.equal(result.kind, 'valid');
  assert.equal(result.contentType, 'image/png');
  assert.ok(result.bytes.length > 0);
});

test('rejects SVG and malformed bytes', async () => {
  assert.deepEqual(await validateAndNormalizeImage(Buffer.from('<svg></svg>')), { kind: 'invalid', reason: 'unsupported_format' });
  assert.deepEqual(await validateAndNormalizeImage(Buffer.from('not an image')), { kind: 'invalid', reason: 'malformed' });
});

test('rejects images over the byte limit', async () => {
  const result = await validateAndNormalizeImage(Buffer.alloc(2 * 1024 * 1024 + 1));
  assert.deepEqual(result, { kind: 'invalid', reason: 'too_large' });
});
