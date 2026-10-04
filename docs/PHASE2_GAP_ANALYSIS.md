# Phase 2 hardening gap analysis

Status: planning only. This audit was performed in `F:\projects\NexTap02-phase2`, branch `phase2-hardening`, based on the imported implementation snapshot. No Supabase project was linked, no migration was pushed, and no Worker was deployed.

## Repository baseline

The application is a Next.js/OpenNext fixture implementation. Runtime state is held in `lib/domain.mjs`; the only persistence artifacts are the two recent migrations for slug aliases and business images. There is no core schema, Supabase client, Admin API, authentication boundary, RLS policy, transaction service, idempotency service, maintenance handler, or provider-backed public projection.

Existing local verification before this audit:

- `npm test`: 14 tests passed.
- `npm run build`: passed.
- Business aliases and fresh ETag gates exist.
- Private image route exists and fails closed when the R2 binding/object is unavailable.
- Image validation uses `sharp` for JPEG/PNG/WebP, size, pixel, animation, malformed-input, and normalization checks.

## Request-ID coverage (requirement 4)

### Current coverage

`proxy.js` creates a server UUID and decorates only `/`, `/b/:path*`, and `/c/:path*`. It handles `OPTIONS`, unsupported methods, public Business ETags, and downstream page responses.

The following are not covered by the matcher or handler-level decoration:

- `/api/public/images/:imageId` 200/304/404/503/405 responses.
- `/api/:path*` generally.
- `/_next/image` and other framework image responses.
- RSC/flight and prefetch responses outside the current matcher.
- Framework-generated unknown-route/not-found responses outside the matcher.
- Static/internal responses where a global policy is actually required.

The image route creates direct `Response` objects and currently does not attach `x-request-id`. `domain.mjs` has an unused deterministic `requestId` helper, while the proxy uses `crypto.randomUUID()`.

### Proposed implementation order

1. Add a shared server-only response helper that generates or accepts only a validated server request ID and decorates existing headers without replacing route-specific headers.
2. Add an error-envelope helper with `{ error, message, requestId }`, `application/json`, and `no-store`.
3. Expand the proxy matcher conservatively to application/API paths and `/_next/image`; avoid static assets unless an observed requirement proves they need IDs.
4. Decorate every custom route status, including image 200/304/404/503/405 and future Admin statuses.
5. Verify whether Next framework responses preserve proxy headers; if not, use a route-level wrapper or a narrowly scoped catch-all boundary rather than assuming `NextResponse.next()` propagation.
6. Add a response matrix covering GET/HEAD/OPTIONS/405/404/503/308/304, RSC, prefetch, image, and optimization responses. Record missing paths before expanding the matcher further.

### Acceptance evidence

Each application response category must show an opaque server-generated ID in headers. JSON errors must repeat the same ID in the body. Client correlation input may be logged only as bounded metadata and never treated as authoritative.

## Persistence/schema (requirements 5 and 8)

### Current gaps

The current migrations are incomplete and do not represent the documented contracts:

- No `businesses`, `cards`, `card_assignments`, `card_history`, sections, links, hours, Admin memberships, audit, operations/idempotency, upload intents, cleanup candidates, or import staging tables.
- Alias migration has no current/reserved-slug lifecycle, RLS, or public projection.
- Image migration lacks object digest, dimensions, replacement/cleanup state, upload intent linkage, RLS, and provider-safe reference lifecycle.
- No grants, RLS, restricted public projection, append-only history enforcement, or same-Business child constraints.
- Fixture IDs are strings while the proposed production schema uses UUIDs; fixture and production adapters need an explicit boundary.

### Staged migration plan

Create reviewed migrations in this order, without pushing them:

1. `0001_initial_schema.sql`: businesses, immutable cards, current assignment, slug registry/reservations, content/sections/links/hours, image references, memberships.
2. `0002_history_audit.sql`: append-only Card history, audit events, expected-version/content-revision columns, constraints and indexes.
3. `0003_operations_imports.sql`: operations/idempotency, import previews, upload intents, cleanup candidates, retention columns.
4. `0004_rls_public_projection.sql`: least-privilege grants, anonymous restricted publication projection, Admin membership policies, cross-Business child checks.
5. `0005_maintenance.sql`: bounded cleanup functions/claiming indexes and retry state.

Each migration needs forward-only review, constraints/indexes, RLS tests, reset/seed fixtures, and a staging apply plan. `supabase db diff` and `supabase db push` are blocked until an approved project reference and explicit staging authorization exist.

## Auth/JWT/MFA/RLS (requirement 6)

There is no auth or Admin API implementation. The project must add:

- A server-only Supabase client with runtime-injected URL/key and bearer propagation.
- JWT validation through Supabase plus issuer, audience, expiry, and project checks.
- Current `admin_memberships` lookup on every privileged request; no trust in profile roles or client actor IDs.
- Mandatory TOTP assurance, five-minute recent-TOTP gate for sensitive mutations, and eight-hour absolute/30-minute idle sessions.
- Revocation checks that take effect before token expiry.
- CSRF/origin checks for cookie-authenticated mutations.
- RLS and restricted public projection tests through direct Data API access.
- Stable 401/403/404/409/422/429/503 error envelopes with request IDs.

Provider behavior and credentials cannot be verified locally. Implement the interfaces and deterministic unit tests first, then run live issuer/MFA/RLS tests only against approved staging.

## Transactions/idempotency (requirement 7)

No mutation API or transaction layer exists. Implement durable operations around a canonical payload digest:

1. Validate method, session, membership, MFA, idempotency key, and payload.
2. Begin transaction and lock the target row.
3. Recheck authorization and expected version.
4. Load `(actor, scope, digest)` operation record.
5. Replay committed same-payload records; reject different payload or in-progress records.
6. Insert `in_progress`, perform mutation, append required history/audit, update version/revision, store result, and commit atomically.
7. Return operation ID, committed/replayed flags, resulting versions, and request ID.

The first implementation slice should cover one Card lifecycle command end to end, then generalize to Business/content and image reference changes. Concurrency, audit rollback, replay-after-lost-response, version conflicts, membership revocation before replay, and expiry need database-backed tests; fixture-only tests cannot prove these properties.

## Fresh authority/cache ordering (requirement 8)

Business routing and ETag checks currently establish fresh fixture eligibility before the conditional response. The same contract must be applied to persistent Card, alias, and image reads:

- Resolve route and method.
- Read authoritative status/assignment/current reference and content revision.
- Resolve a coherent restricted projection.
- Only then consider ETag/cache.
- On authority/replica/cache uncertainty, return safe 503 rather than stale gated content.

Add mutation-driven tests for disable, deactivation, unassignment, reassignment, slug change, image replacement/removal, cache read/write failures, and projection revision races.

## R2/private images (requirement 9)

The application route exists and uses `R2_BUCKET`, but no upload-intent or commit workflow exists. The next implementation slice must add server-named object keys, validated upload intent, digest/reference commit, immediate current-reference revocation, and cleanup candidates. Physical deletion must never control access. Live R2 replacement/removal probes require an approved temporary Worker and uniquely prefixed keys.

`/_next/image` remains an adapter/framework path and must either be disabled for private content or be proven to enforce the same current-image gate. A successful 400/200 probe alone is not security evidence.

## Maintenance (requirement 10)

No maintenance endpoint/job exists. Add a protected internal handler only after the operations and cleanup tables exist. It must claim bounded candidates, skip current references, treat missing objects as success, retain retryable failures, and be idempotent. Do not enable a production cron while probing.

## Environment isolation (requirement 11)

The repository has one Worker configuration and no verified staging/production identities. Environment variables alone cannot prove isolation. Before live testing, define separate Worker name, Supabase project/issuer, private bucket, cache namespace, and explicit runtime environment identity checks. Cross-environment token/object/cache tests are blocked pending two approved environments.

## Browser/RSC/optimization validation (requirement 12)

Build output recognizes the custom image route, but a running server must be restarted after route changes. The test matrix must capture method, URL, status, content type, request ID, cache policy, and authorization result for document, RSC, prefetch, alias, disabled, image, and optimization requests. Use agent-browser/Chrome DevTools for browser/RSC behavior and keep private-image authorization tests at the application route.

## Authentic Card/QR/NFC evidence (requirement 13)

No authentic sample is present. Synthetic IDs cannot close legacy/manufacturing compatibility. The gate requires raw printed ID, QR payload, NFC NDEF bytes/text, provenance, expected destination, and exact case/whitespace/encoding behavior. This must be supplied and tested separately; do not infer it from artwork filenames or fixture IDs.

## Recommended implementation waves

### Wave A — request boundary and evidence

Request-ID helper, error envelopes, matcher audit, image-handler decoration, response matrix, RSC/prefetch/optimization probe.

### Wave B — schema and policy

Core migrations, constraints/indexes, RLS/public projection, reset fixtures, migration policy tests. No external apply.

### Wave C — auth and one durable command

Server Supabase client, session/membership/MFA boundary, CSRF/origin, one Card lifecycle command with operations/history/audit/version transaction.

### Wave D — replace fixture reads

Persistent Business/Card/alias/image repositories, coherent fresh projections, ETag/cache integration, private-image upload/commit/revoke/cleanup flow.

### Wave E — operations and maintenance

Remaining Admin commands, imports, maintenance endpoint, bounded cleanup/retry, rate limits, environment identity checks.

### Wave F — external gates

Approved staging migration/auth/RLS/R2/Worker probes, cross-environment isolation, browser/RSC matrix, authentic token evidence, and only then any production review.

## Explicit blockers

- No approved staging project reference or authorization was provided.
- No authentic Card/QR/NFC sample was provided.
- Current repository has no persistence/auth/Admin runtime to extend; this is a multi-wave implementation, not a single safe patch.
- Production migration/deployment is prohibited without explicit project and deployment approval.
