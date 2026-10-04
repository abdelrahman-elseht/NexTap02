const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createRequestId() {
  return crypto.randomUUID();
}

export function ensureRequestId(candidate) {
  return typeof candidate === 'string' && REQUEST_ID_PATTERN.test(candidate)
    ? candidate
    : createRequestId();
}

export function withRequestId(response, candidate) {
  response.headers.set('x-request-id', ensureRequestId(candidate));
  return response;
}

export function errorResponse({ status, error, message, headers }) {
  const id = createRequestId();
  const responseHeaders = new Headers(headers);
  responseHeaders.set('cache-control', 'no-store');
  responseHeaders.set('content-type', 'application/json; charset=utf-8');
  responseHeaders.set('x-request-id', id);

  return new Response(JSON.stringify({ error, message, requestId: id }), {
    status,
    headers: responseHeaders,
  });
}
