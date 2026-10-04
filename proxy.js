import { NextResponse } from 'next/server';
import { entityTag, resolveBusinessRoute } from './lib/domain.mjs';

const PUBLIC_METHODS = 'GET, HEAD, OPTIONS';

export function proxy(request) {
  const requestId = crypto.randomUUID();
  const headers = new Headers({ 'x-request-id': requestId });

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
  return response;
}

export const config = {
  matcher: ['/', '/b/:path*', '/c/:path*'],
};
