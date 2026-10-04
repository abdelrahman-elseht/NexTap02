# NexTap flows and API

Status: Draft. Documentation only; no implementation is authorized.

## Evidence and boundaries

[vision.md](vision.md) was read in full. The [accepted-decision ledger](../.atomic/recovery/accepted-decisions.json) records 47 actual successful parent-chat answers. It overrides stale pending entries in the [original API artifact](../.atomic/workflows/runs/vision-docs/7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8/flows-and-api.json), while preserving accepted deferrals. The [unanswered inventory](../.atomic/recovery/unanswered-batches.json) contains no complete unanswered original batch. The current [actual-answer file](../.atomic/workflows/runs/vision-docs-continuation/10006fa1-5292-4ab3-9d4b-b5144171947b/new-answers.json) contains no additional answers; the [source manifest](../.atomic/workflows/runs/vision-docs-continuation/10006fa1-5292-4ab3-9d4b-b5144171947b/sources.json) identifies retained inputs. None supplies document approval.

Historical repository inspection found the vision, design assets and documentation records, with no application source, package manifest, route handler, migration, deployed API schema or inventory workbook. This pass read all five documents, all five original reports and the retained Product/Architecture/Database continuation reports. A bounded path search found the two assets and no matching package manifest, workspace instructions or CSV/XLSX inventory. It did not inspect ancestor directories or decode artwork. Source intent, actual answers, repository facts, candidate contracts and verification gates remain distinct. No runtime behavior was verified.

This owner edits only `docs/FLOWS_AND_API.md` and its continuation report. Product owns actors, canonical terms, lifecycle, publication and content semantics. Database owns persistence and transactions. Architecture owns hosting, cache mechanics, content freshness and recovery. Security owns authentication, authorization, validation, privacy and retention. Actual ledger/root human answers establish decisions; peer messages and silence do not.

The permanent Card route and Inactive notice derive from vision sections 3 to 5 and 21 to 22. Admin management and activation derive from sections 13 to 15 and 31 to 32, with Business Owner self-service superseded by the Admin-only decision. Sections and Links derive from sections 9 to 12, Logo/Cover from 8, 20 and 30, caching from 23 to 25, imports from 3 and 33, management protections from 26 to 27, and payment/review navigation from 35 to 36. The vision does not settle exact HTTP methods, statuses, retry records or representation schemas.

## Accepted API decisions

| Key | Exact selected answer | Accepted contract |
| --- | --- | --- |
| `api.public-route-contract` | `Render directly (Recommended)` | Eligible `/c/{Card ID}` returns public HTML directly, independently of the Business slug. |
| `api.admin-operation-contract` | `Admin HTTP/JSON (Recommended)` | Private management API under `/api/admin`, internal UUID references and explicit Card operations; no public SDK. |
| `api.error-envelope` | `JSON envelope (Recommended)` | `{error:{code,message,fieldErrors?,requestId}}`; stable safe codes, with translation in the interface. |
| `api.import-format` | `CSV only (Recommended)` | UTF-8 CSV with `card_id` and optional Inactive-only `status`; preserve printed tokens; no direct XLSX upload. |
| `api.admin-command-shape` | `Explicit commands (Recommended)` | POST Assign/Unassign/Activate/Deactivate commands, PATCH Business fields and PUT complete Section/Link order lists. |
| `api.idempotency-concurrency` | `Keys + versions (Recommended)` | Effectful commands require `Idempotency-Key`; edits require `expectedVersion`. Same key and payload returns the original result; different payload is rejected. Key retention remains unfinished. |
| `api.http-status-contract` | `Standard status map (Recommended)` | 401 missing session, 403 forbidden, 404 missing/non-disclosed resource, 409 version/lifecycle conflict, 422 semantic validation, 429 rate limit and 503 unavailable dependency. Safe Inactive-card notice remains required. |
| `api.list-pagination` | `Cursor pagination (Recommended)` | Opaque cursors, bounded limits, stable sorting and `nextCursor`. Exact bounds and encoding remain unfinished. |

Evidence is ledger Q20 to Q23 and Q42 to Q45, with original successful result references `[174,3]`, `[183,0]` to `[183,2]` and `[330,0]` to `[330,3]`. The successful Q42 to Q45 result at transcript line 330 was also read directly. These choices settle the transport and policies; they do not approve every proposed endpoint or payload below.

## Accepted shared rules

- NexTap Admin is the sole authenticated launch role. There is no Business Owner login, dashboard or owner-account relationship. Visitors need no management account. All five documents use English.
- Internal UUIDs identify Cards, Businesses and content. A Card ID is the separate immutable public token printed in QR/NFC and used in `/c/{cardId}`. New tokens need at least 128 cryptographically random bits; printed legacy tokens stay exact. Actual legacy token grammar cannot be checked without the absent inventory.
- One Card has at most one current Business; a Business has zero or more Cards. Cards are Active or Inactive, while Businesses are Enabled or Disabled.
- Businesses start Disabled. A nonempty name and unique slug allow explicit Admin enablement. Contact details, Links, hours, location and images are optional. Later successful content saves publish through an atomically advanced current content revision, without a separate Draft/Publish workflow.
- Disable blocks Card, canonical Business and alias routes without changing Card state or assignment. Card/Business hard deletion and Card ID reuse are excluded.
- Historical slugs remain permanently reserved for the same Business and redirect to its current route. An eligible Card renders directly at its printed route instead.
- Deactivate before reassignment, assign/reassign only while Inactive, and Activate separately. Deactivate retains assignment. Unassign leaves the Card Inactive and unassigned. An assigned Card may become Active while its Business is Disabled; public content stays blocked until that Business is Enabled.
- Day-one history records actual successful Card creation/import and Assign/reassign/Activate/Deactivate/Unassign changes. It is an Admin-only read-only per-Card timeline with actor UUID, time and old/new Business and status, retained for the permanent Card lifetime. There are no scan/click events or content snapshots. Rejected attempts belong to routine audit.
- Card and Business writes require the version originally read by the editor. Stale requests make no changes. Data changes, minimized routine mutation audit and required Card history commit atomically. Required audit/history failure rejects the mutation. External post-commit delivery failure does not imply rollback.
- Each built-in Section occurs at most once: Hero, Contact, Social, Payments, Location, Hours, Reviews and Custom Links. Generic Links belong to exactly one supported link-bearing Section, appear once, and may repeat a platform with distinct labels. Phone, WhatsApp and email are authoritative contact fields with derived actions. Weekly hours contain seven days, closed days or multiple intervals, and a Business timezone; no holidays or computed open-now indicator.
- Payment items are external HTTPS URLs only. NexTap processes no funds, confirms no transaction and offers no copyable payment identifiers. Google Reviews is configured external navigation, with synchronized ratings deferred.
- Product analytics, counters and Visitor event endpoints are excluded. Minimized operational monitoring and Card history remain distinct.

Q47 selects atomic content/revision saves and fresh eligibility/revision reads before Business-plus-revision cache selection. A cache miss loads current coherent content. Cache-write failure does not fail an otherwise valid read; publication does not depend on a global purge. Exact physical revision fields, coherent loading and HTTP/cache ordering remain implementation contracts.

## Authentication and permissions

Admin uses individually provisioned Supabase email/password accounts with mandatory TOTP MFA. There is no public signup. Every privileged request verifies the session, current Admin membership and MFA rather than browser-supplied roles. Server-enforced session limits are 8 hours absolute and 30 minutes idle. Reassignment, Business enable, payment-link and Admin-permission changes need TOTP within the preceding 5 minutes. Trusted operators handle bootstrap/MFA recovery through out-of-band verification and audit.

Cookie-based mutations require CSRF/origin protection. Verified identity-scoped management, restrictive grants/RLS and same-Business child constraints are required. Anonymous clients cannot read management tables or history. A privileged server credential remains server-only and needs explicit scope/authorization checks because it bypasses RLS. No management or session response enters a shared public cache.

| Operation | Visitor | Current Admin with MFA | Additional requirement |
| --- | --- | --- | --- |
| Open eligible Card/Business page | Allowed | Allowed | Fresh public eligibility and revision gate |
| Read current Logo/Cover | Allowed when Business Enabled | Allowed through authorized management paths | Current-reference gate for public delivery |
| Inventory/search/history | Denied | Allowed | Timeline is read-only |
| Assign/transfer Card | Denied | Allowed | Expected version; Inactive prerequisite; fresh TOTP for reassignment |
| Activate/Deactivate/Unassign | Denied | Allowed | Lifecycle invariant; version; atomic history/audit |
| Enable Business | Denied | Allowed | Name and unique slug; fresh TOTP |
| Disable/edit Business | Denied | Allowed | Version and atomic mutation audit |
| Change payment destination | Denied | Allowed | Valid HTTPS and fresh TOTP |
| Upload/import commit | Denied | Allowed | Independent authorization and validation at commit |

Login/MFA/recovery route placement and identity-provider client details remain implementation contracts. Actual session/MFA/RLS enforcement on Workers and Supabase must be verified. An idempotency key or preview reference grants no authority to perform or replay an operation.

## Public journeys and state responses

### Permanent Card route

A Visitor opens `GET /c/{cardId}` from QR or NFC. The server interprets the permanent token without altering printed identifiers, reads current Card mapping/status and the Business's eligibility/revision, then renders public HTML directly. It selects cached Business content only after that fresh authoritative gate. An unavailable authoritative read never falls back to an old assignment or eligibility result.

| Current condition | Required behavior | Remaining HTTP contract |
| --- | --- | --- |
| Active, assigned, Business Enabled | Direct public page; no slug redirect | Candidate 200 |
| Known Inactive Card | Activation-pending notice from vision section 21; no assigned Business content | Exact public status remains unfinished |
| Active assigned Card, Business Disabled | Unavailable page without Business content or former assignment details | Exact public status remains unfinished |
| Unknown token | Safe not-found page | Candidate 404 |
| Broken reference or eligibility read unavailable | Fail closed; no stale page fallback | Candidate 503 for transient dependency failure; broken-reference distinction unfinished |

The source notice is "This NexTap card has not been activated yet." It authorizes no disclosure of previous Business, actor, history or internal UUID. Q44 accepts the Admin status classes while expressly leaving detailed public lifecycle distinctions unfinished. Completing those details must preserve the notice and current eligibility gate.

### Canonical and historical Business routes

`GET /b/{slug}` reads the current reserved slug registry and Business eligibility/revision. The current slug renders the public page. A historical alias redirects to the same Business's current canonical URL only after checking eligibility; the target checks eligibility again. Disable blocks canonical and historical routes. No former slug can be reassigned to another Business.

Slug grammar, normalization, alias redirect status and browser/shared-cache rules remain API/database implementation contracts. Redirect-and-reserve does not permit cached redirects that bypass a later Disable gate. Conditional responses and any framework/CDN cache must also follow the fresh checks.

### Public content and external actions

The restricted public representation includes name/description, authoritative contact actions, visible ordered Sections, active Links, hours/location and gated Logo/Cover routes. It excludes Admin identities, internal UUIDs, raw Storage paths, histories, audit entries and unpublished content. Public HTML is the selected response contract; no independently approved public JSON endpoint is implied.

External destinations use HTTPS without embedded credentials. Contact actions derive validated `tel:`, `mailto:` and WhatsApp targets from contact fields. There is no arbitrary destination fetch, payment proxy, click tracker or transaction retry. A browser navigation failure remains a third-party destination failure, without a NexTap payment-success claim.

### Gated images

Images live in private Storage. Every new application-mediated delivery verifies an Enabled Business and its current Logo/Cover reference. Disable or replacement stops old URLs from serving. A direct Storage URL, signed bearer URL or CDN cache must not bypass that gate. Internal sanitized-object caching can sit behind the gate, subject to runtime verification.

Already downloaded/browser copies and responses authorized before a change cannot be recalled. Fresh checks describe new server requests. They do not delete copies already held by Visitors.

## Admin journeys and transitions

### Inventory and initial activation

1. Admin completes login/MFA and opens Card inventory.
2. Admin searches by printed Card ID or current inventory filters.
3. Admin creates/selects a Business. New Businesses are Disabled.
4. Admin assigns an Inactive Card using its current version and an idempotency key.
5. Admin separately activates the assigned Card. Activation may precede Business enablement.
6. Admin enables the Business when its name and unique slug are ready, with fresh TOTP.
7. Every actual successful Card change appears in its read-only timeline.

### Transfer and conflict handling

| Action | Before | After | Preserved data |
| --- | --- | --- | --- |
| Assign/reassign | Inactive, with expected version | Inactive, assigned to requested Business | Permanent Card ID and history |
| Deactivate | Active, assigned | Inactive, same Business | Assignment and Card ID |
| Activate | Inactive, assigned | Active, same Business | Business may still be Disabled |
| Unassign | Assigned Card | Inactive, no Business | Card ID and full history |
| Disable Business | Enabled | Disabled | Cards, assignments, content and slug reservations |

Transfer follows Deactivate, reassign while Inactive, Activate. A stale tab receives a conflict without mutation and rereads before offering a new command. Concurrent writes cannot produce an Active unassigned Card or omit the successful history/audit entry. No-op commands create no successful Card-change entry; exact no-op response, version/audit behavior and status remain unfinished. Accepted same-key/same-payload replay returns the original result instead of creating a second change.

The simple history UI shows event, time, actor UUID and old/new Business/status. It provides no editing or deletion control. Creation/import creates history only for new Cards; skipped existing tokens do not become changes. It is not a scan dashboard.

### Content management and publication

Admin edits public fields, Links, images and Section enable/order settings. Contact fields are authoritative, every generic Link belongs to its own Business and supported Section, and Section types/settings are registered rather than tenant-provided executable code. Ordered collections use simple numeric ordering or move controls, without a drag-and-drop builder.

A save includes the expected current Business version. Server validation, content writes, content-revision increment and minimized audit commit together. A Disabled Business remains private after content save. For an Enabled Business, subsequent requests read current eligibility and revision, then select that revision's cached public content or load current coherent content on a miss. Global purge is not a publication step, and cache-write failure does not fail a valid read.

The response must report committed state truthfully. Cache, response or image-delivery failure after database commit cannot be described as a rolled-back save. Complete result/revision schemas and timeout reconciliation remain unfinished. `expectedVersion` protects edits, while content revision identifies a public representation; equality or shared physical storage is not assumed.

### Retry and pagination policy

Effectful commands require `Idempotency-Key`. Repeating a key with the same payload returns the original result; using it with a different payload is rejected. Expected-version checks reject stale edits without changes. Key-retention duration, namespace/scope, payload binding, authorized replay, concurrent requests, crash handling, durable original-result persistence and post-expiry behavior remain unfinished. No duration is inferred from audit or temporary-file retention. Replay must preserve current authorization and committed truth without rerunning a completed change.

Card and Business lists use opaque cursors, bounded limits and stable sorting, returning `nextCursor`. Exact default/maximum limits, stable sort fields, search/filter schema, cursor validation and behavior during concurrent changes remain implementation contracts. The history catalog proposes pagination too, without treating its exact schema as an answered choice.

### CSV preview and commit

UTF-8 CSV contains `card_id` and optional `status`, which may request only Inactive. Preserve printed tokens exactly. At most 10,000 rows and 10 MiB are accepted. XLSX input is excluded; Admin exports existing Excel inventory without changing identifiers.

Preview parses/validates the complete file without inventory writes and reports per-row errors and new/existing counts. A preview lasts 30 minutes. The proposed commit request references server-bound preview content and rechecks current Admin/MFA, expiry, input integrity and database uniqueness. A preview token never grants permissions or permits a changed payload.

Commit applies the accepted atomic safe batch: invalid rows or intra-file duplicates reject the whole batch, exact existing tokens are skipped unchanged, new Cards are Inactive/unassigned, and Active requests are rejected. If another import inserts an identical token after preview, it becomes an unchanged skip. New rows, required creation/import history and mutation audit commit together. Validation failure causes no partial insertion. Effectful commit retries follow the accepted key policy once its persistence details are defined.

A candidate report contains `created`, `skipped`, `invalid` and safe row errors with one-based CSV data-row indices. Preview binding, quoting/BOM/header rules, response counts and detailed report schema remain implementation contracts. Raw imports expire within 24 hours; preview validity is separate. A file export is not a complete database backup.

The actual legacy inventory sample is missing. Its grammar, case/URL compatibility and entropy have not been verified. This remains a prelaunch legacy verification gate, including verification before legacy import or public use. Missing evidence does not block an honest documentation candidate and does not permit inventing tokens or normalizing existing printed IDs to a new grammar.

### Image replacement

Admin requests a Logo or Cover replacement, independently authorized for the target Business. The server validates actual JPEG/PNG/WebP content within 2 MiB and 16 MP, decodes/re-encodes it and strips metadata. SVG, animation and malformed data are rejected. Browser MIME alone is insufficient.

Candidate sequence: upload a new server-named private immutable object, validate it, then commit its current reference with expected Business version, content revision and atomic audit. Failure before commit preserves the prior image. After commit, the prior URL fails its current-reference check even if physical cleanup needs retry. Never delete the newly referenced object to simulate rollback. Unused temporary objects expire within 24 hours. Replacement/removal, current-reference schema, cleanup duration/execution, orphan/crash/retry handling and response completion remain implementation contracts. PostgreSQL and object Storage do not share a transaction.

## Candidate private route and payload catalog

The private HTTP/JSON transport, UUID boundary, explicit Card commands, PATCH Business fields and PUT complete order-list pattern are accepted. Exact route names, child-operation schemas, image transport and complete response fields below remain proposals. They must respect every accepted lifecycle, authorization, concurrency and retry rule.

`{cardUuid}` and `{businessUuid}` are internal UUIDs. `{cardId}` in the public route is the permanent token. Inputs never accept client-supplied actor, audit timestamp, privileged role or arbitrary Storage path. Effectful commands require an idempotency key; existing-resource writes require the applicable expected version.

| Method and route | Candidate input | Candidate output |
| --- | --- | --- |
| `GET /api/admin/session` | Verified session | Current Admin capability/session state; no credentials |
| `GET /api/admin/cards` | Search/filter, opaque cursor, bounded limit | Card records and `nextCursor` |
| `GET /api/admin/cards/{cardUuid}` | UUID | Card ID, current state/assignment/version |
| `GET /api/admin/cards/{cardUuid}/history` | UUID and candidate pagination | Read-only minimal timeline |
| `POST /api/admin/cards/import/preview` | CSV file | Preview reference, expiry and validation summary |
| `POST /api/admin/cards/import` | Preview reference and idempotency key | Committed created/skipped summary |
| `POST /api/admin/cards/{cardUuid}/assign` | Business UUID, expected Card version and idempotency key | Updated Inactive Card |
| `POST /api/admin/cards/{cardUuid}/unassign` | Expected Card version and idempotency key | Inactive/unassigned Card |
| `POST /api/admin/cards/{cardUuid}/activate` | Expected Card version and idempotency key | Updated assigned Active Card |
| `POST /api/admin/cards/{cardUuid}/deactivate` | Expected Card version and idempotency key | Updated assigned Inactive Card |
| `GET /api/admin/businesses` | Search/filter, opaque cursor, bounded limit | Admin Business records and `nextCursor` |
| `POST /api/admin/businesses` | Name, slug, allowed optional fields and idempotency key | New Disabled Business |
| `GET /api/admin/businesses/{businessUuid}` | UUID | Editable Business and version |
| `PATCH /api/admin/businesses/{businessUuid}` | Expected version and allowed fields | Committed Business/version and applicable content revision |
| `POST /api/admin/businesses/{businessUuid}/enable` | Expected version, idempotency key and fresh TOTP state | Enabled Business |
| `POST /api/admin/businesses/{businessUuid}/disable` | Expected version and idempotency key | Disabled Business, Cards unchanged |
| `PATCH /api/admin/businesses/{businessUuid}/sections/{sectionUuid}` | Expected Business version and enabled/typed settings | Updated Section and Business version/revision |
| `PUT /api/admin/businesses/{businessUuid}/sections/order` | Expected Business version and complete ordered Section UUID list | Atomic order and new version/revision |
| `POST /api/admin/businesses/{businessUuid}/links` | Expected Business version, Section UUID, type, label, HTTPS URL, registered icon and idempotency key | New Link and Business version/revision |
| `PATCH /api/admin/businesses/{businessUuid}/links/{linkUuid}` | Expected Business version and allowed Link fields | Updated Link and Business version/revision |
| `DELETE /api/admin/businesses/{businessUuid}/links/{linkUuid}` | Expected Business version | Removed Link and new version/revision |
| `PUT /api/admin/businesses/{businessUuid}/links/order` | Expected Business version, Section UUID and complete ordered member UUIDs | Atomic Section-local order and new version/revision |
| `PUT /api/admin/businesses/{businessUuid}/images/{role}` | Expected Business version and validated image | Committed current image reference/version/revision |
| `DELETE /api/admin/businesses/{businessUuid}/images/{role}` | Expected Business version | Optional image slot cleared and new version/revision |

Business/Card hard-delete routes, owner signup/dashboard routes, analytics endpoints, payment processing and automatic rating integrations are absent. Link/image removal is distinct from excluded Business/Card hard deletion. The final operation matrix must define idempotency-key coverage for child edits/removals and upload completion without weakening the accepted command/replay policy.

A candidate assignment request, accompanied by `Idempotency-Key`, is:

```json
{
  "businessId": "00000000-0000-4000-8000-000000000082",
  "expectedVersion": 7
}
```

A candidate committed content-save result is:

```json
{
  "data": {},
  "version": 8,
  "contentRevision": 12,
  "committed": true
}
```

These examples propose schemas and illustrative values. They do not select physical version/revision fields or claim tested runtime behavior. The committed revision replaces the former speculative `delivery.state: pending` example. Q47 gives a current revision-selection contract without a purge-dependent publication delay. Response-loss reconciliation and durable original-result replay still require a complete contract.

## Accepted errors and status mapping

Admin operations use the accepted JSON envelope:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The request contains invalid values.",
    "fieldErrors": [
      {"path": "name", "code": "required"}
    ],
    "requestId": "opaque-request-reference"
  }
}
```

The envelope fields are accepted; this `fieldErrors` item schema and sample codes are proposed refinements. Safe messages contain no stack traces, secrets, raw files, unrelated Business records or private histories. UI translations use stable codes. Operational logs retain redacted route templates/request IDs rather than full Visitor tokens, raw IPs, full URLs, bodies or credentials.

| Admin outcome | Status contract | Proposed stable code |
| --- | --- | --- |
| Malformed JSON/path/body | Candidate 400 | `invalid_request` |
| Missing/expired session | Accepted 401 | `authentication_required` |
| Non-Admin or missing required MFA | Accepted 403 | `admin_required` or `mfa_required` |
| Missing or non-disclosed resource | Accepted 404 | `not_found` |
| Stale version | Accepted 409 | `version_conflict` |
| Current lifecycle prevents command | Accepted 409 | `invalid_transition` |
| Semantic field/CSV validation error | Accepted 422 | `validation_failed` |
| File/body exceeds agreed limit | Candidate 413 | `payload_too_large` |
| Unsupported upload format | Candidate 415 | `unsupported_media_type` |
| Rate exhausted | Accepted 429 with retry guidance | `rate_limited` |
| Unavailable dependency | Accepted 503 | `temporarily_unavailable` |
| Unexpected server failure | Candidate 500 | `internal_error` |

Q44 settles the main status map. Malformed input, media/body rejection, exact idempotency-key conflicts, no-ops and detailed code/header schemas remain implementation contracts. Required audit/history failure rejects the mutation; a transient unavailable dependency follows the accepted 503 class. Once data commits, a delivery failure must preserve successful-commit truth or support authenticated retry reconciliation rather than encourage a duplicate change.

## Limits and integration boundaries

Accepted limits are binding. Exact schemas must respect them.

| Input or operation | Accepted limit |
| --- | --- |
| Business name/description | 120/1000 characters |
| Link label/HTTPS URL | 80/2048 characters |
| Generic Links | 50 per Business |
| Typed Section settings | 8 KiB per Section |
| Logo/Cover file | JPEG/PNG/WebP, 2 MiB, 16 MP |
| CSV | 10,000 rows, 10 MiB |
| Preview validity | 30 minutes |
| Admin mutations/uploads/imports | 120 per 10 minutes / 20 per 10 minutes / 5 per hour per Admin |
| Login/recovery | 10 per 15 minutes using account and trusted-IP controls |
| MFA | 5 per 10 minutes |

Routine minimized audit lasts 90 days, operational errors 14 days, raw imports/unused temporary objects 24 hours, and successful Card history the Card lifetime. These periods do not decide idempotency-record retention, replaced-object cleanup, provider-native logs or backups. Security owns combined JSON-byte limits and exact character counting/contact/settings normalization. Those implementation bounds remain open.

One Next.js application with Supabase PostgreSQL/Auth/Storage on Cloudflare Workers is selected. Staging and production are separate. The vinext/OpenNext adapter is explicitly deferred until actual project compatibility checks. Reviewed versioned Supabase SQL migrations are selected and must be tested before production. No provisioning, runtime, session, RLS, decoder, rate-limit or image-gate test occurred in this task.

Every new public request reads fresh eligibility and content revision before representation reuse. Private image delivery checks current eligibility/reference too. Provider-native logs/backups, deletion/expiry and restore reconciliation require an account-specific prelaunch review. Restoring stale mappings cannot silently reopen revoked public access. Q46 defers numerical budget, SLA, latency, region, recovery-time and acceptable-data-loss targets to mandatory provider-verified prelaunch decisions. No values are invented here.

## Inline domain terms and decision records

**Business** is the activity or organization represented by one public NexTap page and the content boundary. Avoid account when Business is meant.

**Card** is a physical NexTap card with a permanent public identity and an optional current Business assignment. Avoid Business page when Card is meant.

**Card ID** is the permanent public identifier encoded in QR/NFC. Avoid internal UUID, Business slug or activation secret.

**Assignment** is the current link between a Card and at most one Business. **Activation** makes an assigned Card Active; public access also requires an Enabled Business. Avoid treating Business publication and Card activation as interchangeable.

**Section** is a supported configurable content group on a public Business page. **Link** is a Business-controlled external destination shown in exactly one supported link-bearing Section. Contact actions derive separately from contact fields.

**Card history** is the minimal successful operational timeline, visible only to Admin. It is distinct from routine audit and Visitor analytics.

**Slug alias** is a reserved former slug belonging permanently to the same Business. It is not a second profile or a transferable name.

**NexTap Admin** is the platform operator, distinct from the Business Owner. **Visitor** is a person opening public URLs without management privileges.

### Render at the permanent Card route

Accepted under `api.public-route-contract`. The user chose direct Card HTML over a Card-to-slug redirect. Printed destinations remain independent of mutable slugs, while `/b/{slug}` and gated historical aliases share the same Business. This requires consistent eligibility checks across multiple entry points.

### Transfer history evidence

Q9's exact custom answer includes its trailing space inside the JSON string:

```json
{"answer":"1 , store the history from day one with simple ui "}
```

Ledger `foundation.card-lifecycle`, source `[140,0]`, preserves that answer independently of the parent's interpretation. The ledger separately attributes this interpretation to transcript line 143: "Option 1 plus mandatory operational Card history from day one with simple UI; separate from deferred analytics." The original result and parent relay at lines 140/143 were read directly. The interpretation is not substituted for the answer. Q28 and Q35 later settle successful-change coverage, read-only Admin timeline and minimal append-only Card-lifetime retention.

### Expected versions and retry protection

Q31 and Q40 require stale-write rejection and atomic mutation/audit/history. Q43 separately accepts keys plus versions, same-payload original-result replay and different-payload rejection. These choices prevent silent stale overwrites and repeated commands after uncertain responses. The UI must reconcile conflicts, and persistence must retain truthful results. Key-retention duration and exact retry records remain unfinished.

### Revision-based publication

Q47 accepts atomic content-plus-revision, fresh eligibility/revision lookup and revision-keyed cached content. It retains caching without requiring a successful global purge, at the cost of an authoritative read on every new request. Unknown eligibility fails closed. Coherent projections, physical fields and response/cache ordering need implementation verification; already delivered or in-flight copies cannot be recalled.

## Deferred gates and unfinished contracts

These entries preserve accepted deferrals and unfinished details. They do not reopen settled policies. No genuinely new API-owned human choice was identified in this round.

| Key | Kind | Remaining requirement |
| --- | --- | --- |
| `architecture.workers-adapter` | Deferred gate | Choose vinext/OpenNext only after actual project compatibility proof on a pinned application/framework/runtime combination. |
| `architecture.operational-targets` | Deferred gate | Q46 leaves numerical budget, SLA, latency, region, recovery time and acceptable data loss as mandatory provider-verified prelaunch choices. |
| `security.privacy-data-minimization.provider-review` | Deferred gate | Account-verify provider-native log/backup contents, retention, access, deletion and restore reconciliation. Application periods do not prove provider deletion. |
| `security.enforcement-verification` | Deferred gate | Verify session/MFA/current membership, CSRF, identity-scoped clients, grants/RLS/restricted projections, tenant children, trusted-proxy/rate controls, image decoding and fresh public/image gates on the actual runtime. |
| `database.legacy-token-inventory` | Deferred gate | Actual inventory/sample is absent. Verify printed-token grammar, case/URL compatibility and entropy before legacy import or public use; preserve every printed token exactly. No sample or compatibility result is invented. |
| `database.public-token-policy` | Implementation detail | Define new-token encoding/grammar, immutable storage, case/collation and URL parsing within the accepted entropy and legacy-preservation requirements. |
| `database.content-shape` | Implementation detail | Finish physical schema/constraints, slug registry/normalization, supported link-bearing types, Section/icon schemas, deterministic ordering, distinct-label/count enforcement and optional image metadata. |
| `database.activation-timestamps` | Implementation detail | Define initial/latest activation summary meaning, event null representation and time precision without changing lifecycle/history policy. |
| `database.publication-revision` | Implementation detail | Define write-version/content-revision mapping, revision-advancing mutations and coherent restricted projection/snapshot/read-retry behavior. Atomic revision policy is settled. |
| `database.history-audit-schema` | Implementation detail | Finish minimized actor/event/reference schema, identity-change handling, append-only controls, rejected-attempt behavior and accepted expiry execution. |
| `api.mutation-publication` | Implementation detail | Finish committed result/version/revision schema, response-loss reconciliation and no-op outcomes. Do not invent delivery.pending, global-purge dependence or rollback after commit. |
| `api.idempotency-record-contract` | Implementation detail | Define key-retention duration, scope/payload binding, durable original-result persistence, authorized replay, concurrent retries and crash/expiry behavior. Complete per-operation coverage without reopening keys plus versions. |
| `api.public-response-contract` | Implementation detail | Finish public lifecycle/alias statuses, safe notices, slug normalization, redirects, conditional responses and browser/shared-cache behavior. Preserve the Inactive notice and fresh gates. |
| `api.payload-error-contract` | Implementation detail | Finish exact route/child/image schemas, fieldErrors/codes, malformed input/media/body statuses, key-conflict/no-op results and retry headers within the accepted envelope/status classes. |
| `api.list-pagination-details` | Implementation detail | Define bounds, stable sort fields, search/filter rules, cursor validation and concurrent-change behavior without substituting offset pagination. |
| `api.csv-preview-contract` | Implementation detail | Define quoting/BOM/header parsing, one-based row reporting, preview integrity/binding and commit/result schemas within accepted CSV limits and atomic policy. |
| `api.image-reference-workflow` | Implementation detail | Finish replacement/removal, immutable-object/current-reference schema, completion/cleanup duration/execution and orphan/crash/retry handling. Database/Storage remain non-atomic. |
| `security.content-schema-details` | Implementation detail | Define combined JSON-byte ceiling, Unicode counting, contact/label normalization, settings fields/bytes and weekly-hours timezone/overnight/overlap representation within accepted bounds. |
| `architecture.cache-storage-restore` | Implementation detail | Define/test framework/HTTP/CDN ordering, coherent revision loading, private object cleanup, migration promotion and relational/image restore reconciliation before public reopening. |
| `peer.flows-and-api.security-and-edge-cases` | Peer check | Checked Security hash still has stale owner-answer wording; later repaired candidate bytes were not read. Runtime/provider/schema gates remain genuine. |
| `peer.flows-and-api.final-root-record` | Peer check | The root's final plain peer-check record and frozen approval hashes do not exist in this owner pass. Three aligned peer contents still contain historical incomplete checks; queued messages and acknowledgments do not certify later bytes or supply approval. |

## Bounded consistency and source review

One bounded cross-read checked all five documents, all original reports and the three available retained continuation reports. `document_hashes` returned identical peer hashes before and after the full peer reads. The check covered scope, vocabulary, cardinality, lifecycle, API/persistence/security/cache contracts and local Markdown crosslinks.

| Peer document | Content-checked SHA-256 | Outcome and limit |
| --- | --- | --- |
| [PRODUCT_SPEC.md](PRODUCT_SPEC.md) | `0bd509673eb8a44dc051a726037574e164ef4880844e581c22509ee4a7643c55` | Consistent at this snapshot. Admin-only scope, cardinalities, lifecycle, direct Card routes, expected versions, retry/status/cursor policy, atomic records and revision cache align. Historical peer-check entries are explicitly incomplete and do not certify final bytes. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | `1a57cf9917e6780e29e343843359ebe7afc581f3e8c312fc63cc87fc926cdd70` | Consistent at this snapshot. Atomic content/revision, fresh fail-closed gates, coherent loading, distinct edit version/revision, non-atomic Storage and truthful committed results align. Adapter/operating/provider gates and historical incomplete checks remain explicit. |
| [DATABASE.md](DATABASE.md) | `992f5da8f61ebd2e04fd3447a214b7ea438a423bfb79bb54bc41a6084d4c3dc4` | Consistent at this snapshot. UUID/public-token distinction, lifecycle/history, imports, same-Business children, versions/revisions, audit and private-image contracts align. Physical schema/normalization/retry/cleanup details and historical incomplete checks remain unfinished. |
| [SECURITY_AND_EDGE_CASES.md](SECURITY_AND_EDGE_CASES.md) | `456608dcc3d03e4dda5e6483051249367c9e1ca00d9375fd7691777831e641bf` | Incomplete. Authentication, exposure, history, retention, bounds and private-image gates align. Lines 185 to 188 retain stale owner-answer/consistency wording where Q43/Q46/Q47 apply. Its owner acknowledged repair from ledger evidence; repaired bytes/hash were not read. |

One consolidated note was sent to each discovered peer target through Intercom. Product, Architecture and Database notes were queued for their known future stages; Security's note was delivered to its live stage. Security acknowledged the stale API/cache passages and described its planned reconciliation. Those messages are transport/evidence exchange, not human consent or verification of revised content. No parent target was visible in discovery; this document and its report are the durable root handoff. No peer completion or human answer was awaited.

All local Markdown targets in this document and the checked peer snapshots exist and were read. Targets include the vision, four companion documents, ledger, unanswered inventory, original API report, current continuation sources/answers, historical setup record and the retained peers' earlier continuation source/answer files. No local fragment links occur, so no anchor target required validation. Numbered vision citations and ledger decision keys/results were checked against their full sources. Peer provider URLs were not freshly fetched in this API pass; no claim here depends on a new provider capability reading. This is source/crosslink review, not implementation verification. The unslop pass retained exact answer evidence while removing stale interview wording and speculative publication language.

## Approval boundary

The candidate remains Draft, and approval remains null. All human questions and document approvals belong in the parent chat through the root's durable prompts. The root must append its plain final peer-check record before freezing approval hashes. Scoped approval must name the exact precomputed replacement of `Status: Draft. Documentation only; no implementation is authorized.` with `Status: Approved. Documentation only; no implementation is authorized.` That single status-line change authorizes documentation finalization only. No material postapproval rewrite is permitted, and the listed gates and incomplete checks remain visible.

## Companion documents

[Product specification](PRODUCT_SPEC.md), [architecture](ARCHITECTURE.md), [database](DATABASE.md), and [security and edge cases](SECURITY_AND_EDGE_CASES.md) own the adjacent shared, operational, persistence and policy contracts.

## Recovery peer-check record

- docs/PRODUCT_SPEC.md: consistent; checked hash is current. Full bounded read bracketed by identical hashes, unchanged in later hash-only observation. Admin-only scope/vocabulary/cardinality/lifecycle/direct routes, expected versions, retry/status/cursor policy, atomic audit/history and revision-cache contracts align. Physical/API/runtime gates remain explicit. Historical peer records and root final frozen-hash check remain incomplete. One consolidated note queued to discovered future Product target; queue receipt is not consent.
- docs/ARCHITECTURE.md: consistent; checked hash is current. Full bounded read bracketed by identical hashes, unchanged in later hash-only observation. Scope/cardinality/lifecycle/security align; atomic content/revision, fresh fail-closed gate, coherent loading, distinct edit version/revision, non-atomic Storage and truthful commit results align. Adapter/operating/provider gates remain genuine. Historical peer records/root final check remain incomplete. One note queued to discovered future Architecture target; no consent inferred.
- docs/DATABASE.md: consistent; checked hash is current. Full bounded read bracketed by identical hashes, unchanged in later hash-only observation. UUID/token distinction, same-Business cardinality, lifecycle/history, safe CSV import, versions/revisions, atomic audit and private-image workflow align with ledger/API candidate. Physical schema/timestamp/normalization/retry/cleanup details and legacy evidence remain unfinished. Historical checks/root final record remain incomplete. One note queued to discovered future Database target; no approval inferred.
- docs/SECURITY_AND_EDGE_CASES.md: incomplete; checked hash is current. Latest hash-only observation; content read was at 456608dcc3d03e4dda5e6483051249367c9e1ca00d9375fd7691777831e641bf, identical before/after. Auth/lifecycle/exposure/private images/history/retention/bounds align there, but lines 185-188 retain stale API/cache/consistency wording where Q43/Q46/Q47 apply. One consolidated note delivered to discovered live Security stage; acknowledgment describes repair, not inspected revised bytes or consent. Newer candidate content/hash not reread within the bounded exchange. Root must mark incomplete before approval.
