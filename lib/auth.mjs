const MAX_TOKEN_LENGTH = 8192;
const MAX_COOKIE_HEADER_LENGTH = 16384;
const TOKEN_PATTERN = /^[A-Za-z0-9._~+/=-]+$/;

export class AuthBoundaryError extends Error {
  constructor(code, message, status = 401, details = {}) {
    super(message);
    this.name = 'AuthBoundaryError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function boundedToken(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_TOKEN_LENGTH || !TOKEN_PATTERN.test(value)) return null;
  return value;
}

export function parseBearerToken(headers) {
  const value = headers?.get?.('authorization') ?? headers?.authorization;
  if (typeof value !== 'string' || value.length > MAX_TOKEN_LENGTH + 16) return null;
  const match = /^Bearer[ \t]+([^ \t]+)$/i.exec(value);
  return match ? boundedToken(match[1]) : null;
}

export function parseCookieToken(headers, cookieName = 'sb-access-token') {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(cookieName)) return null;
  const raw = headers?.get?.('cookie') ?? headers?.cookie;
  if (typeof raw !== 'string' || raw.length > MAX_COOKIE_HEADER_LENGTH) return null;
  for (const item of raw.split(';')) {
    const index = item.indexOf('=');
    if (index < 0) continue;
    const name = item.slice(0, index).trim();
    if (name === cookieName) return boundedToken(item.slice(index + 1).trim());
  }
  return null;
}

export function extractToken(request, { cookieName = 'sb-access-token' } = {}) {
  const bearer = parseBearerToken(request?.headers);
  if (bearer) return { token: bearer, source: 'bearer' };
  const cookie = parseCookieToken(request?.headers, cookieName);
  return cookie ? { token: cookie, source: 'cookie' } : null;
}

export function validateTokenClaims(claims, { issuer, audience, now = Date.now(), clockSkewSeconds = 30 } = {}) {
  if (!claims || typeof claims !== 'object') throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  const nowSeconds = Math.floor(now / 1000);
  if (typeof issuer !== 'string' || !issuer || claims.iss !== issuer) throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (typeof audience !== 'string' || !audiences.includes(audience)) throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  if (!Number.isInteger(claims.exp) || claims.exp < nowSeconds - clockSkewSeconds) throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  if (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > nowSeconds + clockSkewSeconds)) throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  if (typeof claims.sub !== 'string' || claims.sub.length < 1 || claims.sub.length > 200) throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  return claims;
}

export function checkSessionPolicy(session, { now = Date.now(), absoluteSeconds = 8 * 60 * 60, idleSeconds = 30 * 60 } = {}) {
  if (!session || typeof session !== 'object') throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  const current = now;
  const issued = Date.parse(session.issuedAt);
  const lastSeen = Date.parse(session.lastSeenAt);
  if (!Number.isFinite(issued) || !Number.isFinite(lastSeen) || current - issued > absoluteSeconds * 1000 || current - lastSeen > idleSeconds * 1000) {
    throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  }
  return { ...session, expiresAt: new Date(Math.min(issued + absoluteSeconds * 1000, lastSeen + idleSeconds * 1000)).toISOString() };
}

export function checkCsrfOrigin(request, { expectedOrigin } = {}) {
  const method = request?.method?.toUpperCase?.() ?? 'GET';
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true;
  const origin = request.headers?.get?.('origin') ?? request.headers?.origin;
  const referer = request.headers?.get?.('referer') ?? request.headers?.referer;
  if (!origin || !expectedOrigin || origin !== expectedOrigin) throw new AuthBoundaryError('csrf_failed', 'The request origin is not allowed.', 403);
  if (referer) {
    try { if (new URL(referer).origin !== expectedOrigin) throw new Error('origin'); } catch { throw new AuthBoundaryError('csrf_failed', 'The request origin is not allowed.', 403); }
  }
  return true;
}

export async function authenticateRequest(request, { verifyToken, issuer, audience, sessionStore, now = Date.now(), cookieName } = {}) {
  const extracted = extractToken(request, { cookieName });
  if (!extracted) throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  if (typeof verifyToken !== 'function') throw new AuthBoundaryError('temporarily_unavailable', 'Authentication is temporarily unavailable.', 503);
  let claims;
  try { claims = validateTokenClaims(await verifyToken(extracted.token), { issuer, audience, now }); } catch (error) {
    if (error instanceof AuthBoundaryError) throw error;
    throw new AuthBoundaryError('authentication_required', 'Authentication is required.');
  }
  const session = sessionStore?.get ? await sessionStore.get(claims) : { issuedAt: new Date((claims.iat ?? Math.floor(now / 1000)) * 1000).toISOString(), lastSeenAt: new Date(now).toISOString() };
  return { claims, session: checkSessionPolicy(session, { now }), source: extracted.source };
}

export async function authorizeAdmin(request, deps = {}) {
  const auth = await authenticateRequest(request, deps);
  if (typeof deps.membership !== 'function') throw new AuthBoundaryError('temporarily_unavailable', 'Authorization is temporarily unavailable.', 503);
  const membership = await deps.membership(auth.claims.sub);
  if (!membership?.active) throw new AuthBoundaryError('admin_required', 'Admin access is required.', 403);
  if (typeof deps.mfa === 'function' && !(await deps.mfa(auth.claims.sub, auth.session))) throw new AuthBoundaryError('mfa_required', 'MFA is required.', 403);
  return { ...auth, membership };
}
