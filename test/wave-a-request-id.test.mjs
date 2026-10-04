import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GET, HEAD, OPTIONS, POST } from '../app/api/public/images/[imageId]/route.js';
import { errorResponse, ensureRequestId } from '../lib/http-response.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function params(imageId) {
  return { params: Promise.resolve({ imageId }) };
}

function proxySource() {
  return readFile(new URL('../proxy.js', import.meta.url), 'utf8');
}

test('shared errors decorate JSON with a server-shaped request ID', async () => {
  const response = errorResponse({ status: 503, error: 'unavailable', message: 'Unavailable', requestId: 'client-input' });
  const body = await response.json();

  assert.match(response.headers.get('x-request-id'), UUID);
  assert.notEqual(response.headers.get('x-request-id'), 'client-input');
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(body, {
    error: 'unavailable',
    message: 'Unavailable',
    requestId: response.headers.get('x-request-id'),
  });
  assert.equal(ensureRequestId(response.headers.get('x-request-id')), response.headers.get('x-request-id'));
});

test('custom image errors and OPTIONS carry request IDs', async () => {
  const notFound = await GET(new Request('https://example.test/api/public/images/unknown'), params('unknown'));
  const unavailable = await GET(new Request('https://example.test/api/public/images/image-demo-logo'), params('image-demo-logo'));
  const unavailableHead = await HEAD(new Request('https://example.test/api/public/images/image-demo-logo'), params('image-demo-logo'));
  const options = OPTIONS();
  const method = POST();

  for (const response of [notFound, unavailable, unavailableHead, options, method]) assert.match(response.headers.get('x-request-id'), UUID);
  assert.equal(notFound.status, 404);
  assert.deepEqual(await notFound.json(), {
    error: 'not_found',
    message: 'Not found',
    requestId: notFound.headers.get('x-request-id'),
  });
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), {
    error: 'unavailable',
    message: 'Unavailable',
    requestId: unavailable.headers.get('x-request-id'),
  });
  assert.equal(unavailableHead.status, 503);
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('allow'), 'GET, HEAD, OPTIONS');
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'GET, HEAD, OPTIONS');
  assert.equal(method.headers.get('cache-control'), 'no-store');
});

test('proxy matches API and optimization paths without public-page method handling', async () => {
  const source = await proxySource();
  assert.match(source, /['"]\/api\/:path\*['"]/);
  assert.match(source, /['"]\/_next\/image['"]/);
  assert.match(source, /if \(!isPublicPage\)/);
  assert.match(source, /return withRequestId\(NextResponse\.next\(\), requestId\)/);
  assert.match(source, /if \(request\.method === 'OPTIONS'\)/);
  assert.match(source, /if \(!\['GET', 'HEAD'\]\.includes\(request\.method\)\)/);
});
