# NexTap Ticket 01/02 execution evidence

- Run: `20261004t233926Z`
- Branch: `phase1-ticket1-2-completion`
- Starting commit: `75ef464ce5700a3fe6f9bf4676179f45fe7f415e`
- Scope: local/application hardening only. No push, PR, production deployment, Supabase mutation, credential inspection, image generation, or authentic physical Card/QR/NFC handling.

## Defects repaired

| Defect | Result | Evidence |
| --- | --- | --- |
| D01 fail-open Admin auth when session/MFA seams are absent | PASS (local unit boundary) | `lib/auth.mjs`; `test/auth-boundary-wave-c.test.mjs` now verifies valid claims + active membership still return 503 without authoritative session or MFA. |
| D02 caller-controlled request IDs | PASS (local unit/HTTP) | `lib/admin-errors.mjs`, `lib/http-response.mjs`, `proxy.js`, `worker-wrapper.mjs`; invalid and valid caller IDs are ignored by error helpers; route/body IDs agree. |
| D03 stale expected-version check before replay | PASS (local unit) | `lib/operations.mjs`; matching committed replay is loaded before stale check; memory adapter partitions records by actor. Regression test covers committed version 2 replayed with actual version 2 and expected version 1. |
| D04 null image object throw | PASS (local unit) | `lib/public-authority.mjs`; null returns `not_found`, undefined/unavailable returns `unavailable`; regression test covers null. |
| D05 unknown current-reference deletion | PASS (local unit) | `lib/maintenance.mjs`; only explicit true/false reference states proceed; null/undefined/malformed states become retryable and are not deleted. |
| D06 SQL grant/projection boundary | PASS (static review only) | Added `supabase/migrations/0007_authorization_projection_hardening.sql`; revokes broad authenticated table grants and old projection/route functions, adds restricted public functions without Business UUID, conditionally exposes contact/location/review/hour fields by enabled Section. SQL apply/provider RLS/concurrency checks are BLOCKED/UNRUN. |
| D08 Wrangler drift | PASS (local config review) | `wrangler.toml` removed as stale alternate; `package.json` OpenNext commands explicitly select safe `wrangler.jsonc`; selected config is uniquely named `nextap-phase1-local`, has no account ID, existing Worker service, R2 bucket, custom route, cron, or Images binding. No deploy performed. |

## Automated verification

- `npm test`: PASS, 48 tests, 0 failures.
- `npm run build`: PASS; Next 16.3.8 recognized public/admin/maintenance/image routes and Proxy.
- `node --check proxy.js && node --check worker-wrapper.mjs && for f in lib/*.mjs; do node --check "$f"; done`: PASS.
- Focused suites (`auth-boundary`, request ID, idempotency, authority, maintenance): PASS, 35 tests.
- `git diff --check`: PASS before final evidence write.
- Runtime observed: Node v22.23.2, npm 10.9.8, Next 16.3.8, OpenNext Cloudflare ^1.20.8, Wrangler ^4.147.0.
- `npx --no-install opennextjs-cloudflare deploy --help`: confirms explicit `--config` support. No deploy command was run.
- `npx --no-install opennextjs-cloudflare build --config wrangler.jsonc --skipNextBuild`: BLOCKED/FAIL on Windows OpenNext middleware artifact lookup (`.next/server/middleware.js.nft.json` missing); no remote side effect.
- `npx --no-install wrangler deploy --dry-run --config wrangler.jsonc`: UNRUN after safe config because `.open-next/assets` is absent without a successful OpenNext build; no upload occurred.

## Local HTTP matrix (fresh production Next start after build)

All application responses observed with opaque UUID `x-request-id`; custom JSON image errors had matching body `requestId` after rebuilding following proxy changes.

| Method/path | Status | Result |
| --- | ---: | --- |
| GET `/c/SYNTH-CARD-DEMO-001` | 200 | Synthetic active Card rendered current Business. |
| HEAD `/c/SYNTH-CARD-PENDING-001` | 200 | Empty body; request ID present. |
| GET `/c/UNKNOWN` | 404 | Framework safe not-found document; request ID present. |
| GET `/b/harbor-street-coffee` | 200 | Current Business; `private, no-store`, ETag, request ID. |
| GET `/b/old-harbor-coffee` | 308 | Location `/b/harbor-street-coffee`; request ID present. |
| GET `/b/unknown` | 404 | Safe not-found document; request ID present. |
| OPTIONS `/b/harbor-street-coffee` | 204 | `Allow: GET, HEAD, OPTIONS`; request ID present. |
| POST `/b/harbor-street-coffee` | 405 | `Allow: GET, HEAD, OPTIONS`; request ID present. |
| GET `/api/public/images/unknown` | 404 | JSON `not_found`, `no-store`; body/header IDs agree. |
| HEAD `/api/public/images/unknown` | 404 | Empty body; request ID present. |
| OPTIONS `/api/public/images/unknown` | 204 | `Allow: GET, HEAD, OPTIONS`; request ID present. |
| POST `/api/public/images/unknown` | 405 | JSON safe method error, `no-store`; request ID present. |
| GET `/_next/image` | 404 | Safe disabled optimizer JSON, `no-store`; body/header IDs agree. |
| GET `/b/harbor-street-coffee` with matching `If-None-Match` | 304 | Fresh conditional response; request ID present, no body. |
| POST `/api/internal/maintenance` without configured secret/environment | 503 | Safe `maintenance_disabled` JSON, `no-store`, body/header IDs agree. |
| GET `/api/internal/maintenance` | 405 | Method not allowed with `Allow: POST`, safe JSON and server ID. |

Fixture R2 200/304/503 image-byte delivery was not run because no local Cloudflare R2 binding was enabled and hosted deployment is not authorized.

## Browser/RSC evidence

Chrome DevTools Axi session `nextap-t12-local` opened `/c/SYNTH-CARD-DEMO-001` at the owned loopback origin. Accessibility snapshot showed `Harbor Street Coffee`, synthetic-fixture disclosure, address/phone, and the Business link. Network capture showed document 200, static assets, favicon 404, and Next RSC requests to `/b/harbor-street-coffee?..._rsc=...` with 200. No credentials, auth headers, or storage state were captured.

## Provider and external gates

- Supabase identity/read-only provider check: BLOCKED/UNRUN. No approved project reference or staging authorization was provided; no provider CLI mutation was attempted.
- Hosted disposable Worker/R2 lifecycle: BLOCKED. No explicit disposable Worker target or permission was provided; existing Worker/bucket names were not touched.
- SQL migration apply/RLS direct-provider probes: BLOCKED/UNRUN. Docker/psql availability and approved isolated target were not established; migration bytes were not pushed.
- Environment A/B isolation: BLOCKED. Two approved nonproduction identities/projects/buckets/cache namespaces are unavailable.
- Authentic Card/QR/NFC compatibility: BLOCKED. No authentic physical sample/provenance was supplied; synthetic fixtures remain clearly labeled.
- Provider-native logs/backups/restore and operating-target verification: BLOCKED/UNRUN under the four external gates.

## Cleanup proof

No remote resources were created or mutated. Local Next server and Chrome session were started only inside trap-owned bounded commands and terminated on command completion. No object keys, Workers, routes, projects, identities, or provider records were created.
