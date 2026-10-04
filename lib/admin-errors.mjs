import { randomUUID } from 'node:crypto';
import { AuthBoundaryError } from './auth.mjs';

const PUBLIC_MESSAGES = {
  authentication_required: 'Authentication is required.',
  admin_required: 'Admin access is required.',
  mfa_required: 'MFA is required.',
  csrf_failed: 'The request origin is not allowed.',
  temporarily_unavailable: 'The service is temporarily unavailable.',
};

export function requestId(request) {
  const supplied = request?.headers?.get?.('x-request-id');
  return typeof supplied === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(supplied) ? supplied : randomUUID();
}

export function adminError(error, id = randomUUID()) {
  const known = error instanceof AuthBoundaryError ? error : null;
  const code = known?.code ?? 'internal_error';
  const status = known?.status ?? 500;
  const message = PUBLIC_MESSAGES[code] ?? (status === 500 ? 'The service encountered an error.' : 'The request could not be completed.');
  const body = { error: { code, message, requestId: id } };
  if (known?.details?.fieldErrors) body.error.fieldErrors = known.details.fieldErrors;
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-request-id': id } });
}

export function adminJson(data, request, status = 200) {
  const id = requestId(request);
  return new Response(JSON.stringify({ data, requestId: id }), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-request-id': id } });
}
