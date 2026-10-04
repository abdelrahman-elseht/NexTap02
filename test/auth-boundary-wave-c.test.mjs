import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBearerToken, parseCookieToken, validateTokenClaims, checkCsrfOrigin, authorizeAdmin, AuthBoundaryError } from '../lib/auth.mjs';
import { adminError } from '../lib/admin-errors.mjs';
import { POST as sessionPost } from '../app/api/admin/session/route.js';

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
  const response = adminError(new AuthBoundaryError('temporarily_unavailable', 'ignored', 503));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/i);
  assert.equal(body.error.requestId, response.headers.get('x-request-id'));
  assert.notEqual(body.error.requestId, 'req-1');
});

test('Wave C absent session and MFA dependencies cannot authorize an otherwise valid claim', async () => {
  const now = 1_000_000;
  const request = { headers: headers({ authorization: 'Bearer abc' }) };
  const base = {
    issuer: 'issuer', audience: 'aud', now,
    verifyToken: async () => ({ sub: 'admin-1', iss: 'issuer', aud: 'aud', exp: Math.floor(now / 1000) + 60 }),
    membership: async () => ({ active: true }),
  };
  await assert.rejects(() => authorizeAdmin(request, base), (error) => error.code === 'temporarily_unavailable' && error.status === 503);
  await assert.rejects(() => authorizeAdmin(request, {
    ...base,
    sessionStore: { get: async () => ({ issuedAt: new Date(now).toISOString(), lastSeenAt: new Date(now).toISOString() }) },
  }), (error) => error.code === 'temporarily_unavailable' && error.status === 503);
});

test('Wave C verifier, membership, and MFA dependency faults deny as unavailable', async () => {
  const now = 1_000_000;
  const request = { headers: headers({ authorization: 'Bearer abc' }) };
  const claims = { sub: 'admin-1', iss: 'issuer', aud: 'aud', exp: Math.floor(now / 1000) + 60 };
  const sessionStore = { get: async () => ({ issuedAt: new Date(now).toISOString(), lastSeenAt: new Date(now).toISOString() }) };
  await assert.rejects(() => authorizeAdmin(request, { issuer: 'issuer', audience: 'aud', now, verifyToken: async () => { throw new Error('jwks down'); }, sessionStore, membership: async () => ({ active: true }), mfa: async () => true }), (error) => error.code === 'temporarily_unavailable' && error.status === 503);
  const common = { issuer: 'issuer', audience: 'aud', now, verifyToken: async () => claims, sessionStore };
  await assert.rejects(() => authorizeAdmin(request, { ...common, membership: async () => { throw new Error('db down'); }, mfa: async () => true }), (error) => error.code === 'temporarily_unavailable' && error.status === 503);
  await assert.rejects(() => authorizeAdmin(request, { ...common, membership: async () => ({ active: true }), mfa: async () => { throw new Error('mfa down'); } }), (error) => error.code === 'temporarily_unavailable' && error.status === 503);
});

test('Wave C session surface is GET-only and does not expose an undocumented auth POST', async () => {
  const response = await sessionPost(new Request('https://example.test/api/admin/session', { method: 'POST', headers: { 'x-request-id': 'caller-id' } }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
  assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/i);
  assert.notEqual(response.headers.get('x-request-id'), 'caller-id');
});
