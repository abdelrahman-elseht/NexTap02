import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBearerToken, parseCookieToken, validateTokenClaims, checkCsrfOrigin, authorizeAdmin, AuthBoundaryError } from '../lib/auth.mjs';
import { adminError } from '../lib/admin-errors.mjs';

const headers = (values) => new Headers(values);

test('Wave C token parsing is bounded and rejects malformed credentials', () => {
  assert.equal(parseBearerToken(headers({ authorization: 'Bearer abc.def' })), 'abc.def');
  assert.equal(parseBearerToken(headers({ authorization: 'Basic abc' })), null);
  assert.equal(parseCookieToken(headers({ cookie: 'sb-access-token=abc.def; other=x' })), 'abc.def');
  assert.equal(parseCookieToken(headers({ cookie: `sb-access-token=${'x'.repeat(8193)}` })), null);
});

test('Wave C claims require issuer audience and unexpired timestamps', () => {
  const claims = { sub: 'admin-1', iss: 'https://issuer', aud: 'authenticated', exp: 2000 };
  assert.equal(validateTokenClaims(claims, { issuer: 'https://issuer', audience: 'authenticated', now: 1_000_000 }).sub, 'admin-1');
  assert.throws(() => validateTokenClaims({ ...claims, iss: 'wrong' }, { issuer: 'https://issuer', audience: 'authenticated', now: 1_000_000 }), AuthBoundaryError);
});

test('Wave C cookie mutation requires an exact trusted origin', () => {
  assert.throws(() => checkCsrfOrigin({ method: 'POST', headers: headers({ origin: 'https://evil.test' }) }, { expectedOrigin: 'https://app.test' }), /origin/);
  assert.equal(checkCsrfOrigin({ method: 'POST', headers: headers({ origin: 'https://app.test', referer: 'https://app.test/form' }) }, { expectedOrigin: 'https://app.test' }), true);
});

test('Wave C missing provider seams remain explicitly unavailable', async () => {
  const request = { headers: headers({ authorization: 'Bearer abc' }) };
  await assert.rejects(() => authorizeAdmin(request, { issuer: 'issuer', audience: 'aud' }), (error) => error.code === 'temporarily_unavailable' && error.status === 503);
  const response = adminError(new AuthBoundaryError('temporarily_unavailable', 'ignored', 503), 'req-1');
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: { code: 'temporarily_unavailable', message: 'The service is temporarily unavailable.', requestId: 'req-1' } });
});
