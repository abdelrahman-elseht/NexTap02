# Wave C Auth Boundary Findings

Implemented server-side auth boundary scaffolding with dependency-injected provider seams.

## Added files

- `lib/auth.mjs`
  - Strict bounded bearer and cookie token parsing.
  - JWT claim validation seam requiring issuer, audience, subject, expiry, and optional not-before checks.
  - Session absolute (8 hour) and idle (30 minute) policy helper.
  - Current membership and MFA authorization interfaces.
  - Exact Origin/Referer checks for cookie-authenticated state-changing requests.
  - Explicit `503 temporarily_unavailable` when token verification or authorization dependencies are absent.
- `lib/admin-errors.mjs`
  - Stable JSON error envelopes for authentication, admin, MFA, CSRF, unavailable, and internal failures.
  - Opaque request IDs in both body and `x-request-id` response header.
  - Private/no-store response cache policy.
- `app/api/admin/session/route.js`
  - Dynamic `GET /api/admin/session` boundary using runtime-injected verifier, membership, and MFA seams.
  - Runtime configuration reads only `SUPABASE_JWT_ISSUER`, `SUPABASE_JWT_AUDIENCE`, and `APP_ORIGIN`; no secrets are committed.
  - Missing runtime provider seams fail explicitly as unavailable rather than claiming enforcement.
- `test/auth-boundary-wave-c.test.mjs`
  - Focused tests for bounded parsing, claim validation, CSRF/origin behavior, missing-provider unavailability, and error envelopes.

## Validation

- `npm test`: 24 tests passed.
- `node --check` passed for all new JavaScript modules and the route.

## Boundary caveat

This is scaffolding only. Signature verification, current membership lookup, MFA state, revocation, and session persistence require runtime provider implementations injected through the documented seams and must be verified against approved staging before enforcement is claimed.
