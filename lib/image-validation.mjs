import sharp from 'sharp';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_PIXELS = 16 * 1024 * 1024;
const FORMATS = new Map([
  ['jpeg', { contentType: 'image/jpeg', extension: 'jpg' }],
  ['png', { contentType: 'image/png', extension: 'png' }],
  ['webp', { contentType: 'image/webp', extension: 'webp' }],
]);

export async function validateAndNormalizeImage(input) {
  const source = Buffer.from(input);
  if (source.byteLength > MAX_BYTES) return { kind: 'invalid', reason: 'too_large' };

  if (/^\s*<svg[\s>]/i.test(source.toString('utf8', 0, 256))) return { kind: 'invalid', reason: 'unsupported_format' };
  let metadata;
  try {
    metadata = await sharp(source, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    return { kind: 'invalid', reason: 'malformed' };
  }

  const format = FORMATS.get(metadata.format);
  if (!format) return { kind: 'invalid', reason: 'unsupported_format' };
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS) {
    return { kind: 'invalid', reason: 'too_many_pixels' };
  }
  if ((metadata.pages ?? 1) > 1 || metadata.pageHeight) return { kind: 'invalid', reason: 'animated' };

  try {
    const normalized = await sharp(source, { limitInputPixels: MAX_PIXELS })
      .rotate()
      .toFormat(metadata.format)
      .toBuffer();
    return { kind: 'valid', bytes: normalized, contentType: format.contentType, extension: format.extension };
  } catch {
    return { kind: 'invalid', reason: 'malformed' };
  }
}
