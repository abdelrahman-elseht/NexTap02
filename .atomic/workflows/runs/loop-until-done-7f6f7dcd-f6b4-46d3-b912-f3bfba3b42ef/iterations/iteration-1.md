## Work performed

Improved the public-route runtime seam by adding a Next.js 16 `proxy.js` gate for request IDs and HTTP method handling.

## Changes

- Added `proxy.js` for `/`, `/b/*`, and `/c/*`.
- Every matched response now receives a unique `x-request-id`.
- `GET` and `HEAD` remain allowed.
- `OPTIONS` returns `204` with `Allow: GET, HEAD, OPTIONS`.
- Unsupported methods return `405` with the same `Allow` header.
- Removed the unrecognized `middleware.js`; Next.js 16 correctly reports the new `Proxy (Middleware)` entry during build.
- Updated the durable progress ledger with this iteration’s evidence.

## Validation evidence

- `npm test` passed: 5 tests.
- `npm run build` passed successfully.
- Live `npm start` probe passed:
  - `GET`: `200` with `x-request-id`
  - `HEAD`: `200`, empty body, with `x-request-id`
  - `OPTIONS`: `204`, `Allow: GET, HEAD, OPTIONS`, with `x-request-id`
  - `POST`: `405`, `Allow: GET, HEAD, OPTIONS`, with `x-request-id`
- Live public-route matrix passed:
  - Published Card: `200`
  - Inactive Card: `200` with the exact activation-pending notice
  - Disabled Card: `404`
  - Published Business: `200`
  - Disabled Business: `404`
  - Unknown Card: `404`
  - All responses included `x-request-id`.
  - Disabled and unknown responses did not expose internal assignment identifiers.
- Ledger JSON was parsed successfully after recording the iteration.

## New findings

- The current Next.js 16 application now has executable evidence for method rejection and response request IDs, correcting the previously observed `OPTIONS=400` and `POST=200` behavior in the local candidate.
- This does not establish the full adapter/provider contract. Redirect, conditional request, RSC prefetch, optimization, Auth/JWT/MFA, RLS, durable transaction/idempotency, private image, cache-fault, maintenance, and environment-isolation tracks remain unverified or blocked according to prior evidence.

## Failures

No failures occurred in the work completed this iteration.

## Remaining work

The project remains **blocked from a full Phase 1 readiness claim**. Remaining work includes:

- Complete the remaining executable adapter scenarios.
- Verify provider-backed Auth/JWT/MFA, Supabase/RLS, durable transaction/idempotency, private image/storage, cache fault handling, maintenance, and environment isolation.
- Obtain authentic physical Card/QR/NFC samples before closing the legacy-token gate.
- Obtain any required provider access, billable environment, interactive account action, or prelaunch operating-target decision when those gates are reached.