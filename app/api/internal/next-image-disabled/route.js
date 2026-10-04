import { createRequestId, errorResponse } from '../../../../lib/http-response.mjs';

function disabledImageResponse() {
  return errorResponse({
    status: 404,
    error: 'not_found',
    message: 'Not found',
    requestId: createRequestId(),
  });
}

export const GET = disabledImageResponse;
export const HEAD = disabledImageResponse;
export const OPTIONS = () => new Response(null, {
  status: 204,
  headers: { allow: 'GET, HEAD, OPTIONS', 'cache-control': 'no-store', 'x-request-id': createRequestId() },
});
export const POST = () => errorResponse({
  status: 405,
  error: 'method_not_allowed',
  message: 'Method not allowed',
  requestId: createRequestId(),
  headers: { allow: 'GET, HEAD, OPTIONS' },
});
