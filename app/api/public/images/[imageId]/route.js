import { getCloudflareContext } from '@opennextjs/cloudflare';
import { resolvePublicImage } from '../../../../../lib/domain.mjs';

function responseFor(kind) {
  return new Response(kind === 'unavailable' ? 'Unavailable' : 'Not found', { status: kind === 'unavailable' ? 503 : 404 });
}

async function loadImage(imageId) {
  const result = resolvePublicImage(imageId);
  if (result.kind !== 'published') return result;

  let env;
  try {
    ({ env } = await getCloudflareContext({ async: true }));
  } catch {
    return { kind: 'unavailable' };
  }

  const bucket = env.R2_BUCKET;
  if (!bucket) return { kind: 'unavailable' };

  let object;
  try {
    object = await bucket.get(result.image.objectKey);
  } catch {
    return { kind: 'unavailable' };
  }

  if (!object) return { kind: 'not_found' };
  return { ...result, object };
}

async function handle(request, { params }) {
  const { imageId } = await params;
  const result = await loadImage(imageId);
  if (result.kind !== 'published') return responseFor(result.kind);

  const headers = new Headers({
    'cache-control': 'private, no-store',
    'content-type': result.image.contentType,
    etag: `"${result.image.contentHash}"`,
  });

  if (request.headers.get('if-none-match') === headers.get('etag')) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(request.method === 'HEAD' ? null : result.object.body, { status: 200, headers });
}

export const GET = handle;
export const HEAD = handle;

export function POST() {
  return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
}
