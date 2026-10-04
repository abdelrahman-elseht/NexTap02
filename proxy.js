import { NextResponse } from 'next/server';
import { entityTag, resolveBusinessRoute } from './lib/domain.mjs';
import { createRequestId, withRequestId } from './lib/http-response.mjs';

const PUBLIC_METHODS = 'GET, HEAD, OPTIONS';

export function proxy(request) {
  const requestId = createRequestId();
  const headers = new Headers({ 'x-request-id': requestId });
  const isPublicPage = request.nextUrl.pathname === '/'
    || request.nextUrl.pathname.startsWith('/b/')
    || request.nextUrl.pathname.startsWith('/c/');

  if (request.nextUrl.pathname === '/_next/image') {
    return new NextResponse(JSON.stringify({ error: 'not_found', message: 'Not found', requestId }), {
      status: 404,
      headers: { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8', 'x-request-id': requestId },
    });
  }
  if (!isPublicPage) {
    return withRequestId(NextResponse.next(), requestId);
  }

  if (request.method === 'OPTIONS') {
    headers.set('allow', PUBLIC_METHODS);
    return new NextResponse(null, { status: 204, headers });
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    headers.set('allow', PUBLIC_METHODS);
    return new NextResponse(null, { status: 405, headers });
  }

  if (request.nextUrl.pathname.startsWith('/b/')) {
    const slug = request.nextUrl.pathname.split('/')[2];
    const result = resolveBusinessRoute(slug);
    if (result.kind === 'published') {
      const tag = entityTag({ businessId: result.business.id, contentRevision: result.business.contentRevision });
      headers.set('cache-control', 'private, no-store');
      headers.set('etag', tag);
      if (request.headers.get('if-none-match') === tag) return new NextResponse(null, { status: 304, headers });
    }
  }
  const response = NextResponse.next();
  for (const [name, value] of headers) response.headers.set(name, value);
  return withRequestId(response, requestId);
}

export const config = {
  matcher: ['/', '/b/:path*', '/c/:path*', '/api/:path*', '/_next/image'],
};
