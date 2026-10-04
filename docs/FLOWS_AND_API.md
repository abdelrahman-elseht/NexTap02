# NexTap flows and API

Status: Approved. Documentation only; no implementation is authorized.

## Scope and authority

This document defines the HTTP and user-flow contract for the first release. It follows [vision.md](vision.md), the 47-answer [accepted-decision ledger](../.atomic/recovery/accepted-decisions.json), and the companion policies in [PRODUCT_SPEC.md](PRODUCT_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md), and [SECURITY_AND_EDGE_CASES.md](SECURITY_AND_EDGE_CASES.md). The ledger overrides stale pending Q42-Q47 wording in historical artifacts. No route in this document is implemented or approved for deployment.

The launch is Admin-only. Visitors can read eligible public pages; there is no Business Owner API, public signup, analytics API, payment processing, or rating-synchronization API. Internal UUIDs are used in Admin routes. The printed Card ID is a separate immutable public token.

## Contract conventions

- Base URL is the same-origin application URL. Private routes are under `/api/admin` and require an authenticated Admin session with current membership and required MFA.
- JSON requests use `Content-Type: application/json`; successful JSON responses use `application/json; charset=utf-8`. Public page routes return HTML.
- UUID path values are canonical lowercase UUID strings. `{cardId}` is the printed Card ID, not a UUID. `{role}` is `logo` or `cover`.
- Times are RFC 3339 UTC strings. Versions and revisions are non-negative integer values. IDs in examples are illustrative.
- Unknown or unauthorized Admin resources are not disclosed: use the same `404 not_found` response for missing and non-disclosed resources.
- Every response has an opaque `requestId` response header. Error bodies also contain that value.
- Request bodies must not contain actor IDs, roles, audit timestamps, raw Storage paths, or server-controlled versions other than `expectedVersion`.

## Public routes

### Card route

`GET /c/{cardId}` resolves the permanent Card ID and renders HTML directly; it never redirects an eligible Card to `/b/{slug}`. A new request first reads current Card state and assignment, then current Business status and content revision. Cached content is considered only after that fresh gate.

| Condition | Status and behavior |
| --- | --- |
| Active Card assigned to Enabled Business | `200` public HTML for the current Business revision |
| Known Inactive Card | `200` activation-pending HTML containing exactly: `This NexTap card has not been activated yet.` No assignment, history, UUID, or Admin detail |
| Active Card unassigned, or assigned to Disabled Business | `404` safe unavailable HTML; do not disclose assignment or prior Business |
| Unknown Card ID | `404` safe not-found HTML |
| Eligibility, Card, Business, or required content read unavailable | `503` unavailable HTML; never fall back to stale assignment or authorization |

The exact inactive notice is a required safe notice. Public pages do not expose whether an unavailable Card was assigned, who changed it, or why it is unavailable.

### Business routes

- `GET /b/{slug}` renders the current Enabled Business page as `200` HTML.
- A current slug that is missing, non-disclosed, or belongs to a Disabled Business returns `404` safe HTML.
- A historical reserved slug returns `308 Location: /b/{currentSlug}` only after a fresh eligibility check. The target performs its own fresh check. A disabled or unavailable target returns `404` or `503` as applicable; it must not emit a cached redirect that bypasses Disable.
- Unknown slug returns `404` safe HTML. Eligibility failure returns `503` safe HTML.

Implementation default, matching DATABASE: trim Unicode whitespace only as presentation parsing, apply Unicode NFC and lowercase, then accept only the canonical ASCII grammar `[a-z0-9]+(?:-[a-z0-9]+)*` with a 1-80 character bound. Reject empty/reserved values and results with leading/trailing or repeated hyphens; do not remove hyphens or transliterate other characters to manufacture a valid slug. This normalization never applies to Card IDs. Compatibility with any pre-existing slug must be verified with the database implementation. Historical slugs are permanently reserved and never reassigned.

### Public representation and caching

Public HTML contains only the restricted projection: name, description, authoritative contact actions, visible ordered Sections, active Links, hours, location, configured external review destination, payment destinations and gated Logo/Cover references. It excludes Admin identities, internal UUIDs, raw Storage paths, history, audit, unpublished content and inventory details.

Every new Card, Business, alias, and image request performs a fresh fail-closed eligibility/current-reference check before shared-cache reuse. Content writes atomically advance `contentRevision`. Implementation default: the public content cache key is `public-business:{environment}:{rendererVersion}:{schemaVersion}:{businessUuid}:{contentRevision}`. A hit is usable only after the fresh gate and only when its representation matches that entire tuple. On a miss, load a coherent current projection; if the revision changes during loading, retry once against the new revision and otherwise return `503`. Cache-write failure does not fail a valid read. Global purge is not part of publication. Already delivered, in-flight, downloaded, or browser-cached responses cannot be recalled.

Private image delivery is application-mediated. A request checks Enabled Business and current image reference before reading the private object. Replacement or removal makes the old reference fail for new requests even if physical cleanup is delayed. Direct Storage URLs, reusable signed URLs, and CDN responses must not bypass this gate.

## Authentication and authorization

`GET /api/admin/session` returns the authenticated Admin capability state. Missing/expired session is `401`; authenticated non-Admin or missing required MFA is `403`. Every privileged request checks current Admin membership and session limits (8-hour absolute, 30-minute idle). Reassignment, Business enablement, payment-link changes, and Admin-permission changes require TOTP completed within the preceding five minutes.

There is no public signup. Cookie-authenticated mutations require CSRF/origin protection. Management and session responses must not enter shared public caches. RLS/restricted projections, identity-scoped clients, same-Business child checks, and scoped server credentials follow [SECURITY_AND_EDGE_CASES.md](SECURITY_AND_EDGE_CASES.md).

## Admin resource representations

A Card summary contains `id` (internal UUID), `cardId`, `status`, `businessId` (nullable UUID), `activatedAt` (nullable timestamp), `createdAt`, and `version`. A Business summary contains `id`, `name`, `slug`, `status`, `contentRevision`, `createdAt`, `updatedAt`, and `version`. Admin responses never expose credentials or raw image storage paths.

A committed mutation response uses:

```json
{
  "data": {},
  "version": 8,
  "contentRevision": 12,
  "committed": true,
  "replayed": false,
  "requestId": "opaque-request-reference"
}
```

`contentRevision` is present for content-affecting Business operations and omitted for Card-only operations. `committed:true` means the database transaction containing the requested state and required audit/history completed. It does not claim cache fill, image cleanup, browser delivery, or external destination success.

## Exact Admin routes

### Session and lists

| Method and route | Request | Success |
| --- | --- | --- |
| `GET /api/admin/session` | No body | `200 {data:{authenticated,adminId,mfaFreshUntil,expiresAt,idleExpiresAt},requestId}` |
| `GET /api/admin/cards` | Query `q?`, `status?` (`active\|inactive`), `businessId?`, `cursor?`, `limit?` | `200 {data:[CardSummary],nextCursor:null\|string,requestId}` |
| `GET /api/admin/cards/{cardUuid}` | No body | `200 {data:CardDetail,requestId}` |
| `GET /api/admin/cards/{cardUuid}/history` | Query `cursor?`, `limit?` | `200 {data:[HistoryEntry],nextCursor:null\|string,requestId}` |
| `GET /api/admin/businesses` | Query `q?`, `status?` (`enabled\|disabled`), `cursor?`, `limit?` | `200 {data:[BusinessSummary],nextCursor:null\|string,requestId}` |
| `GET /api/admin/businesses/{businessUuid}` | No body | `200 {data:BusinessDetail,requestId}` |

Implementation default: `limit` defaults to 50 and is capped at 100. Lists use opaque base64url cursors containing a server-signed sort tuple and query fingerprint; clients must treat cursors as opaque. Cards sort by `createdAt ASC, id ASC`; Businesses sort by `createdAt ASC, id ASC`; history sorts by `occurredAt ASC, id ASC`. A cursor with a changed query, invalid signature, wrong resource, or expired key returns `422 invalid_cursor`. Rows inserted or changed during traversal may appear on a later traversal; no snapshot guarantee is made.

Search `q` is a bounded case-insensitive prefix/substring search over Card ID and Business name/slug, respectively. Unknown filter values return `422 validation_failed`. Public or sensitive fields are never accepted as sort/filter keys.

### Business lifecycle and fields

| Method and route | Request body | Success |
| --- | --- | --- |
| `POST /api/admin/businesses` | Required `name`, `slug`; optional fields from the schema below; plus `Idempotency-Key` header | `201` new Disabled Business |
| `PATCH /api/admin/businesses/{businessUuid}` | Partial fields from the schema below plus required `expectedVersion` and `Idempotency-Key` header | `200` committed result |
| `POST /api/admin/businesses/{businessUuid}/enable` | `{"expectedVersion":n}` plus `Idempotency-Key` and fresh TOTP | `200` Enabled Business |
| `POST /api/admin/businesses/{businessUuid}/disable` | `{"expectedVersion":n}` plus `Idempotency-Key` | `200` Disabled Business; Cards unchanged |

Name and unique current slug are required for enablement; all other content is optional. Successful edits to enabled content advance `contentRevision` atomically. Disable blocks all public Card, canonical, and alias routes but does not alter Card status, assignment, stored content, aliases, or history. Business hard deletion is not exposed.

Implementation default: `GET /api/admin/businesses/{businessUuid}` returns `BusinessDetail` containing the Business summary plus all fields below, including hidden/disabled content for authorized editing. POST and PATCH use these same field names; Section settings contain presentation only, never these authoritative values. Omitted PATCH fields remain unchanged; nullable fields accept `null` to clear. No separate hours, location or reviews mutation route is required.

| Field | Read/write contract |
| --- | --- |
| `name`, `slug` | Nonempty plain-text name (maximum 120 characters) and current slug under the normalization contract above; neither accepts `null` |
| `description`, `phone`, `whatsapp`, `email` | Nullable plain-text description (maximum 1,000 characters) and validated authoritative contact values |
| `address` | Nullable plain text; implementation default maximum 500 characters |
| `mapUrl`, `directionsUrl`, `googleReviewsUrl` | Nullable configured external destinations; HTTPS only, no embedded credentials, maximum 2,048 characters each. `googleReviewsUrl` is the Google Reviews navigation destination, not ratings/counts or a synchronization request |
| `timezone` | Valid IANA timezone, non-null; implementation default `UTC` on creation when omitted |
| `hours` | Nullable complete weekly schedule: an object with `days`, an array of exactly seven unique weekdays, `0` Monday through `6` Sunday. Each day has the shape `{"weekday":0,"intervals":[{"open":"09:00","close":"17:00"}]}`; an empty intervals list means closed. Supplying `hours` replaces the whole schedule; `null` clears it |

Hours times are local wall-clock `HH:mm`; opening times are `00:00`-`23:59`, closing times also allow `24:00`. Equal endpoints and overlapping intervals are rejected. An earlier closing time denotes overnight input and is split at midnight onto the next weekday (Sunday wraps to Monday), then checked for overlap; reads return the normalized same-day intervals in opening-time order. Adjacent intervals are accepted. The schedule uses the Business `timezone`; a timezone change validates the retained or supplied schedule and keeps the persisted hours timezone equal in the same transaction. Hours, address and destination changes use the parent Business `expectedVersion`, required audit and atomic version/content-revision update. Holidays, calculated open-now, arbitrary URL fetching and synchronized reviews remain excluded.

```json
{
  "data": {},
  "operationId": "00000000-0000-4000-8000-000000000099",
  "version": 8,
  "contentRevision": 12,
  "committed": true,
  "replayed": false,
  "requestId": "opaque-request-reference"
}
```

`operationId` is a durable UUID for an effectful attempt and is present on every committed or replayable mutation result. `contentRevision` is present for content-affecting Business operations and omitted for Card-only operations. `committed:true` means the database transaction containing the requested state and required audit/history completed. It does not claim cache fill, image cleanup, browser delivery, or external destination success.

`GET /api/admin/operations/{operationId}` returns `200` with the stored committed result for the current Admin, `404` when no operation is disclosed, or `503` when the operation store is unavailable. It never reruns an operation. An operation ID is not an authorization token.

### Card lifecycle commands

All command routes require `Idempotency-Key` and a body containing `expectedVersion` unless noted otherwise. They return the updated Card in `data` and a committed result envelope.

| Method and route | Request body | Allowed transition |
| --- | --- | --- |
| `POST /api/admin/cards/{cardUuid}/assign` | `{"businessId":"uuid","expectedVersion":n}` | Inactive Card -> Inactive assigned Card; reassignment requires prior Deactivate |
| `POST /api/admin/cards/{cardUuid}/unassign` | `{"expectedVersion":n}` | Assigned Active/Inactive Card -> Inactive unassigned Card |
| `POST /api/admin/cards/{cardUuid}/activate` | `{"expectedVersion":n}` | Inactive assigned Card -> Active assigned Card; Business may be Disabled |
| `POST /api/admin/cards/{cardUuid}/deactivate` | `{"expectedVersion":n}` | Active assigned Card -> Inactive assigned Card |

Assign cannot activate. Reassignment of an Active Card returns `409 invalid_transition`; Admin must Deactivate, Assign, then Activate. Activate on an unassigned Card returns `409 invalid_transition`. Unassign always leaves the Card Inactive. No Card deletion or token reuse exists.

A successful state or assignment change appends Card history and minimized mutation audit in the same transaction. History records event, actor UUID, time, old/new Business and old/new status. No-op commands return `200` with the unchanged representation, `committed:false`, `noop:true`, and do not append history, audit, or increment version. A no-op is still subject to authorization and expected-version checking.

### Sections, Links, and images

| Method and route | Request body / upload | Success |
| --- | --- | --- |
| `PATCH /api/admin/businesses/{businessUuid}/sections/{sectionType}` | `{"expectedVersion":n,"isEnabled":bool,"settings":object}` | `200` section and new version/revision |
| `PUT /api/admin/businesses/{businessUuid}/sections/order` | `{"expectedVersion":n,"sectionTypes":["hero",...]}` | `200` complete order and new version/revision |
| `POST /api/admin/businesses/{businessUuid}/links` | `{"expectedVersion":n,"sectionType":"social|payments|custom_links","type","label","url","icon"?,"isActive"}` | `201` link and new version/revision |
| `PATCH /api/admin/businesses/{businessUuid}/links/{linkUuid}` | Allowed link fields plus `expectedVersion` | `200` link and new version/revision |
| `DELETE /api/admin/businesses/{businessUuid}/links/{linkUuid}` | Query/body `expectedVersion` | `200` committed removal and new version/revision |
| `PUT /api/admin/businesses/{businessUuid}/links/order` | `{"expectedVersion":n,"sectionType":"...","linkIds":["uuid",...]}` | `200` complete section-local order and new version/revision |
| `PUT /api/admin/businesses/{businessUuid}/images/{role}` | `multipart/form-data`, field `file`; expected version in form field | `200` committed current image reference and new version/revision |
| `DELETE /api/admin/businesses/{businessUuid}/images/{role}` | Query `expectedVersion` | `200` committed cleared slot and new version/revision |

Section order lists must contain each configured built-in type exactly once, including disabled Sections, and no unsupported type. Link order lists must contain every member Link for that Section exactly once, including inactive Links, with no duplicates, omissions, deleted or cross-Business/other-Section IDs. Reordering persists the complete Section-local order atomically; toggling activity or Section visibility does not discard that order. Public rendering filters to enabled Sections and active Links, retaining their relative configured order with deterministic `sort_order, id` tie-breaking as in DATABASE. Each Link belongs to one supported link-bearing Section; up to 50 Links per Business, including inactive Links. Contact actions are not generic Links. Content edits use the expected Business version.
All Section, Link, order, and image mutations require `Idempotency-Key` in addition to `expectedVersion`; image multipart requests carry both fields in the form or header. Link creation/removal and image operations therefore have the same replay and committed-result behavior as Card commands.

Image replacement validates actual JPEG/PNG/WebP bytes, maximum 2 MiB and 16 megapixels, decodes/re-encodes, strips metadata, rejects SVG/animation/malformed data, and writes a server-named immutable private object before committing its current reference. Removal clears the current reference. Database reference commit and object storage are not one transaction. If reference commit fails, the previous image remains current and the temporary object is cleaned under the 24-hour temporary-object policy. If commit succeeds, old access is blocked immediately by current-reference gating; cleanup failure cannot roll back or delete the new object. Image responses report committed reference truth, not delivery or cleanup completion.

### CSV import

`POST /api/admin/cards/import/preview` accepts `multipart/form-data` field `file` and no effectful idempotency key. It accepts UTF-8 CSV only, including an optional UTF-8 BOM. The first row must contain exactly `card_id` and optional `status` headers (case-sensitive after BOM removal); blank lines after the header are ignored. RFC 4180 quoting is required. `card_id` is nonempty and its decoded CSV field value is preserved exactly, including surrounding whitespace; CSV quoting/escaping is syntax, not token content. Never trim, case-fold, Unicode-normalize or regenerate a token. Malformed CSV, invalid UTF-8 or a token incompatible with the verified legacy grammar is rejected rather than repaired into another token; the absent legacy sample remains the grammar/URL-compatibility gate. `status`, when present, must be `Inactive` (case-insensitive spelling accepted and reported canonically).

The request is limited to 10 MiB and 10,000 data rows. Preview parses and validates every row without database writes and returns:

```json
{
  "data": {
    "previewId": "opaque-preview-reference",
    "expiresAt": "2026-10-03T12:00:00Z",
    "rowCount": 2,
    "createdCount": 1,
    "existingCount": 1,
    "errors": [{"row": 3,"field":"card_id","code":"duplicate_in_file"}]
  },
  "requestId": "opaque-request-reference"
}
```

A preview with any validation error cannot be committed. `POST /api/admin/cards/import` requires `{"previewId":"..."}` and `Idempotency-Key`. The server binds the preview to the authenticated Admin, exact file digest, parsed rows, and expiry, then rechecks authorization, expiry, integrity, intra-file duplicates, and current uniqueness at commit. Invalid rows or duplicates reject the whole batch with no inserts. Existing exact tokens are unchanged and reported as skipped, including tokens inserted by another import after preview. New rows are Inactive and unassigned. New Card rows, creation/import history, audit, and idempotency result commit atomically.

Commit success is `200` with `{data:{created:[CardSummary],skipped:[{row,cardId}],createdCount,skippedCount},operationId,committed:true,replayed:false,requestId}`. Raw preview/import data expires after 24 hours; preview validity is 30 minutes. Preview possession never grants authorization.

## Idempotency and reconciliation default

This is an explicitly labeled implementation default, not a new product decision. Every mutation, including PATCH edits, complete PUT order lists, DELETE removals, Business creation/lifecycle commands, Card commands, Link creation/removal, image replacement/removal, and CSV commit, requires `Idempotency-Key`; pure GETs and CSV preview do not. Retry records are scoped to `(operation scope, authenticated Admin UUID, key digest)`, matching DATABASE. Operation scope is a server-defined namespace for the method and normalized route template, such as `admin.cards.activate`; the canonical request fingerprint additionally binds the exact target/resource UUID and payload (or upload digest). Keys must be 1-128 printable ASCII characters; store their digest, not the raw key. The original terminal success or error result is durable, and a mutation and its result commit in the same transaction.

Default retention is 24 hours after first completion or terminal rejection. During retention, the same actor/key, operation scope, target and identical canonical payload returns the stored result with `replayed:true` and does not rerun the command. The server also serializes/checks the actor/key binding across operation scopes: reuse by the same Admin in a different scope returns `409 idempotency_key_reused` as a scope mismatch, never a replay or a new execution. Within the same scope, a different target or payload returns the same conflict. Another Admin's key belongs to a different actor and cannot replay this result. Concurrent identical requests wait for the first transaction; the loser then receives its stored result. Concurrent scope mismatches are rejected; concurrent different targets/payloads in the same scope return `409 idempotency_key_in_progress` or `409 idempotency_key_reused`. Replay rechecks current Admin authentication, membership, and required fresh TOTP; the key is not authority. An expired key is treated as new under normal expected-version/lifecycle checks; the client must reread before deciding on a new attempt. The implementation must document and monitor the 24-hour cleanup; it must not infer retention from 90-day audit or 24-hour raw-file retention.

If a response is lost after commit, the Admin retries with the same key to retrieve the committed result. If the key record is unavailable, the Admin uses `GET /api/admin/operations/{operationId}` with an authenticated operation ID returned in the original result when available; otherwise rereads the resource and compares its version/content revision. The API never reports a committed mutation as rolled back. No `delivery.pending` state exists. Cache fill, image cleanup, or response delivery cannot undo a committed transaction.

## Versions and conflicts

Every existing-resource edit includes `expectedVersion`, the version read by the editor. The server checks it inside the mutation transaction. A mismatch makes no data, history, audit, storage-reference, or revision change and returns `409 version_conflict` with the current safe `resourceId`, `currentVersion`, and `requestId`; it does not disclose another Admin's identity or private changes. A successful mutation increments the resource version exactly once. Content-affecting mutations also increment `contentRevision` exactly once. `expectedVersion` and `contentRevision` are separate values and need not be equal.

## Errors and status map

All Admin errors use:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "The request contains invalid values.",
    "fieldErrors": [{"path":"name","code":"required"}],
    "requestId": "opaque-request-reference"
  }
}
```

`fieldErrors` is omitted when not applicable. Codes are stable; messages contain no stack traces, secrets, unrelated tenant data, or private history. UI translation is outside the API.

| Status | Codes and use |
| --- | --- |
| `400` | `invalid_request` for malformed JSON, missing body, malformed multipart, or invalid path syntax |
| `401` | `authentication_required` for missing/expired session |
| `403` | `admin_required`, `mfa_required`, `csrf_failed` |
| `404` | `not_found` for missing or non-disclosed resources and safe public not-found/unavailable state |
| `409` | `version_conflict`, `invalid_transition`, `idempotency_key_reused`, `idempotency_key_in_progress`, `slug_conflict`, `token_conflict` |
| `413` | `payload_too_large` for body, image, or CSV size limits |
| `415` | `unsupported_media_type` for non-CSV or unsupported image format |
| `422` | `validation_failed`, `invalid_cursor`, `preview_expired`, `preview_mismatch` |
| `429` | `rate_limited`, with `Retry-After` seconds when known |
| `503` | `temporarily_unavailable` when required Auth, database, storage, or eligibility dependency is unavailable |
| `500` | `internal_error` for an unexpected failure; no sensitive detail |

A required audit/history failure returns `503 temporarily_unavailable` and the mutation is rolled back. A failure after database commit returns the committed result on replay/reconciliation; it is never represented as a rollback.

## Deferred gates and explicit non-contracts

The following are genuine external gates, not stale pending API decisions:

- Verify the actual legacy Card inventory/sample for token grammar, case and URL compatibility before legacy import or public use; preserve every printed token exactly. No sample is present in this repository.
- Choose and verify the Next.js-to-Cloudflare Workers adapter (vinext or OpenNext) against the pinned application and runtime before implementation, including session/MFA, CSRF, RLS, restricted projections, rate limits, image decoding, cache ordering and fresh public/image gates.
- Verify provider-native log, Auth, Storage, backup retention/deletion, restore coverage and relational/private-image reconciliation before launch. Application retention periods do not prove provider deletion.
- Choose numerical budget, SLA, latency, region, recovery-time, and acceptable-data-loss targets at prelaunch against actual provider plans; this document invents none.

Not defined here: Business Owner routes, product analytics, payment transactions, arbitrary URL fetching, public JSON page APIs, Card/Business hard deletion, Card ID reuse, global purge jobs, stale eligibility grace periods, or any implementation/deployment authorization.

## Companion documents

[Product specification](PRODUCT_SPEC.md) owns scope and business rules. [Architecture](ARCHITECTURE.md) owns runtime, cache, hosting, and restore mechanics. [Database](DATABASE.md) owns persistence, constraints, migrations, and physical references. [Security and edge cases](SECURITY_AND_EDGE_CASES.md) owns authentication, authorization, validation, exposure, and retention policy.
