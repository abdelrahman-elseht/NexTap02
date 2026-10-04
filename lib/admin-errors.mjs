import { randomUUID } from 'node:crypto';
import { AuthBoundaryError } from './auth.mjs';

const PUBLIC_MESSAGES = {
  authentication_required: 'Authentication is required.',
  admin_required: 'Admin access is required.',
  mfa_required: 'MFA is required.',
  csrf_failed: 'The request origin is not allowed.',
  temporarily_unavailable: 'The service is temporarily unavailable.',
};

export function requestId() {
  return randomUUID();
}

export function adminError(error) {
  const id = requestId();
  const known = error instanceof AuthBoundaryError ? error : null;
  const code = known?.code ?? 'internal_error';
  const status = known?.status ?? 500;
  const message = PUBLIC_MESSAGES[code] ?? (status === 500 ? 'The service encountered an error.' : 'The request could not be completed.');
  const body = { error: { code, message, requestId: id } };
  if (known?.details?.fieldErrors) body.error.fieldErrors = known.details.fieldErrors;
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-request-id': id } });
}
export function adminJson(data, _request, status = 200) {
  const id = requestId();
  return new Response(JSON.stringify({ data, requestId: id }), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-request-id': id } });
}
