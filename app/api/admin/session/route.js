import { authenticateRequest, authorizeAdmin, checkCsrfOrigin, AuthBoundaryError } from '../../../../lib/auth.mjs';
import { adminError, adminJson, requestId } from '../../../../lib/admin-errors.mjs';

export const dynamic = 'force-dynamic';

function runtimeDependencies() {
  const verifyToken = globalThis.__NEXTAP_VERIFY_TOKEN__;
  const membership = globalThis.__NEXTAP_ADMIN_MEMBERSHIP__;
  const mfa = globalThis.__NEXTAP_MFA__;
  return { verifyToken, membership, mfa, issuer: process.env.SUPABASE_JWT_ISSUER, audience: process.env.SUPABASE_JWT_AUDIENCE };
}

export async function GET(request) {
  const id = requestId(request);
  try {
    const auth = await authorizeAdmin(request, runtimeDependencies());
    return adminJson({ authenticated: true, adminId: auth.claims.sub, mfaFreshUntil: auth.session.mfaFreshUntil ?? null, expiresAt: auth.session.expiresAt, idleExpiresAt: auth.session.idleExpiresAt ?? null }, request);
  } catch (error) {
    return adminError(error, id);
  }
}

export async function POST(request) {
  const id = requestId(request);
  try {
    const deps = runtimeDependencies();
    const auth = await authenticateRequest(request, deps);
    if (auth.source === 'cookie') checkCsrfOrigin(request, { expectedOrigin: process.env.APP_ORIGIN });
    return adminJson({ authenticated: true, subject: auth.claims.sub }, request, 200);
  } catch (error) {
    return adminError(error, id);
  }
}
