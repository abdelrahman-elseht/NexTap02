import { getCloudflareContext } from '@opennextjs/cloudflare';
import { resolvePublicImage } from '../../../../../lib/domain.mjs';
import { createRequestId, errorResponse, withRequestId } from '../../../../../lib/http-response.mjs';

const IMAGE_METHODS = 'GET, HEAD, OPTIONS';

function responseFor(kind, requestId) {
  const unavailable = kind === 'unavailable';
  return errorResponse({
    status: unavailable ? 503 : 404,
    error: unavailable ? 'unavailable' : 'not_found',
    message: unavailable ? 'Unavailable' : 'Not found',
    requestId,
  });
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
  const requestId = createRequestId();
  const { imageId } = await params;
  const result = await loadImage(imageId);
  if (result.kind !== 'published') return responseFor(result.kind, requestId);

  const headers = new Headers({
    'cache-control': 'private, no-store',
    'content-type': result.image.contentType,
    etag: `"${result.image.contentHash}"`,
  });

  if (request.headers.get('if-none-match') === headers.get('etag')) {
    return withRequestId(new Response(null, { status: 304, headers }), requestId);
  }

  return withRequestId(new Response(request.method === 'HEAD' ? null : result.object.body, { status: 200, headers }), requestId);
}

export const GET = handle;
export const HEAD = handle;

export function OPTIONS() {
  return withRequestId(new Response(null, { status: 204, headers: { allow: IMAGE_METHODS } }), createRequestId());
}

function methodNotAllowed() {
  const requestId = createRequestId();
  return errorResponse({
    status: 405,
    error: 'method_not_allowed',
    message: 'Method not allowed',
    requestId,
    headers: { allow: IMAGE_METHODS },
  });
}

export const POST = methodNotAllowed;
