# NexTap security and edge cases

Status: Approved. Documentation only; no implementation is authorized.

## Sources and evidence

[vision.md](vision.md) was read in full. Source section numbers below refer to its numbered headings. The [accepted-decision ledger](../.atomic/recovery/accepted-decisions.json) records 47 actual successful parent-chat answers and no document approvals. It overrides conflicting vision passages and stale pending claims in the [original Security artifact](../.atomic/workflows/runs/vision-docs/7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8/security-and-edge-cases.json). Ordinary peer messages and silence never grant policy or document approval.

The [unanswered inventory](../.atomic/recovery/unanswered-batches.json) contains no complete unanswered original question batch. The current continuation [actual-answer file](../.atomic/workflows/runs/vision-docs-continuation/10006fa1-5292-4ab3-9d4b-b5144171947b/new-answers.json) is empty; its [source manifest](../.atomic/workflows/runs/vision-docs-continuation/10006fa1-5292-4ab3-9d4b-b5144171947b/sources.json) identifies retained evidence. All five original reports and the three imported Product, Architecture and Database candidates were read. Their earlier peer-check records remain historical evidence, not proof that later candidate bytes were checked.

Current project path inspection found the vision, five documents and documentation records, with no matching application package, migration or CSV/XLSX inventory sample. The original owner inspection also recorded no workspace instruction file, glossary or ADR collection; this reconciliation did not repeat ancestor inspection. Artwork filenames do not prove NFC programming, QR payloads, production services or token formats. The [setup record](../.atomic/vision-docs-setup.md) describes historical documentation ownership. Domain terms and qualifying decisions stay inline in this owned document.

Source requirements, repository facts, accepted decisions and unfinished implementation contracts remain distinct. Source and crosslink review does not verify a runtime, provider account or implemented control. All human questions and approvals belong in the parent chat.

## Source requirements and resolved contradictions

Vision sections 3 to 5 and 19 to 22 require permanent unique nonsequential Card IDs, NFC/QR pointing to `/c/{Card ID}`, at most one current Business per Card, and multiple Cards per Business. Inactive Cards show the activation-pending notice in section 21. Public identifiers should be hard to guess and can differ from internal IDs.

Vision sections 6 and 27 require Business data isolation through `business_id` and database permissions such as RLS. Section 27 also requires management authorization and image type/size checks. Section 26 primarily throttles authentication and management operations, while public pages remain broadly available. Sections 23 to 25 intend cached public delivery and refresh after edits. Q33, Q34 and Q47 define the accepted exposure and content-cache policies.

The user resolved section 15 versus sections 13, 32 and 37 as an Admin-only launch. NexTap Admin is the sole authenticated role; Business Owner login, dashboard and owner-account links are absent in version one. Supabase PostgreSQL, Auth and Storage with a Next.js application on Cloudflare Workers are accepted. Staging and production use separate Workers/Supabase services. The exact Workers adapter remains deferred to project compatibility checks.

The accepted release uses at most one instance of each built-in Section: Hero, Contact, Social, Payments, Location, Hours, Reviews and Custom Links. Each generic Link belongs to exactly one supported link-bearing Section of its Business and appears once; repeated platform destinations require distinct labels. Contact buttons derive from authoritative contact fields. Hours are structured weekly data with a Business timezone. Logo and Cover are optional image slots. Payment buttons navigate to external URLs only; NexTap processes no funds or transactions. Google Reviews is a configured redirect. Sources: vision sections 7 to 12, 20, 35 and 36, qualified by ledger Q13 to Q16 and Q29 to Q30.

## Accepted shared business rules

- Cards use internal UUIDs separate from immutable printed Card IDs. Public IDs never authorize editing, activation or account recovery.
- Cards start Inactive and unassigned. Deactivate preserves assignment; Unassign makes the Card Inactive and clears assignment. Assign/reassign requires Inactive; Activate is separate. Card deletion and token reuse are excluded.
- An assigned Card can become Active while its Business is Disabled. Public Card content still requires an Enabled Business. Independent activation does not bypass publication eligibility.
- Businesses start Disabled. A nonempty name and unique slug suffice for explicit enablement; contact, Links, hours, location and images are optional. Later content saves atomically advance the representation revision and publish without a separate draft workflow. Disable blocks Card, canonical Business and alias routes without changing Card state or assignment. Business hard deletion is excluded.
- `/b/{slug}` is an independent sharing route. Historical slugs redirect to the same Business and remain permanently reserved. Disabled eligibility gates aliases too. Eligible `/c/{Card ID}` renders directly without redirecting to the slug.
- Successful Card creation/import, Assign/reassign, Activate, Deactivate and Unassign changes create operational history. The per-Card timeline is read-only and Admin-only. Include actor UUID, time, old/new Business and status; exclude scans, clicks and full content snapshots. Rejected attempts belong to routine security audit.
- Expected read versions reject stale Card or Business writes without mutation. Successful lifecycle changes, required history and minimized mutation audit commit together. Inventory imports preview first, reject invalid/intra-file duplicate batches atomically, skip existing exact tokens unchanged, and create only Inactive unassigned Cards. Input is UTF-8 CSV with `card_id` and optional Inactive-only `status`.
- Product scan/click counters and Visitor events are deferred. Operational Card history and minimized error monitoring are separate from product analytics.

These are accepted choices in the ledger, not document approval. Reviewed versioned Supabase SQL migrations must be tested before production; undocumented dashboard-only production schema edits are excluded.

## Accepted API integration

Q20 to Q23 and Q42 to Q45 select direct public Card HTML and private HTTP/JSON management under `/api/admin` with internal UUID references. Assign/Unassign/Activate/Deactivate use explicit POST commands, Business field edits use PATCH, and complete Section/Link order lists use PUT. Lists use opaque cursors, bounded limits, stable sorting and `nextCursor`.

Effectful commands require `Idempotency-Key`; edits require `expectedVersion`. The implementation default is a durable 24-hour record keyed to authenticated Admin, normalized route/resource and canonical payload. Same key and payload returns the original committed result; a different payload, route or resource is rejected. Concurrent identical requests wait for the first transaction and replay its result. Replay still checks current session, membership, MFA and fresh TOTP where required; the key is never authority. Expired keys are treated as new only after the client rereads current version. Mutation, required history/audit and original result commit atomically; cache fill, object cleanup and response delivery do not.

Admin errors use `{error:{code,message,fieldErrors?,requestId}}`. Codes are stable, messages disclose no secrets or stack traces, and the UI handles translation. Accepted status classes are 401 missing session, 403 forbidden, 404 missing/non-disclosed resource, 409 version/lifecycle conflict or idempotency conflict, 422 semantic validation, 429 rate limit and 503 unavailable dependency. Detailed route payloads, cursor encoding and public statuses are defined in [FLOWS_AND_API.md](FLOWS_AND_API.md); this document owns their enforcement and exposure constraints. The public contract must preserve the safe Inactive-card notice without exposing assignment, history or Admin data.

## Trust boundaries

| Boundary | Required behavior |
| --- | --- |
| Physical Card to public resolver | A visible public token identifies a Card; possession grants no management capability. A copied QR copies the public destination. |
| Visitor to public application | Read only eligible published Business content. Exclude Admin identities, inventory/history, drafts and operational diagnostics. |
| Browser to Admin API | Validate session, MFA, current Admin membership and mutation prerequisites on each operation, including uploads/import commit and authorized retry replay. |
| Application to PostgreSQL | Identity-scoped management, restrictive grants/RLS and same-Business child constraints; explicitly scope any privileged bypass. |
| Application to Storage | Private objects, authorized sanitized uploads and gated current-image delivery. A path name alone proves neither ownership nor public eligibility. |
| Application to shared cache | Fresh eligibility/revision precedes public cache reuse. No dashboard/session/private responses or stale Card mappings in public cache. |
| Browser to external destination | Validate configured navigation. NexTap does not fetch arbitrary URLs, verify payment completion or attest third-party trustworthiness. |
| Application/providers to logs and backups | Minimize data, restrict access, apply application retention and verify provider-native handling before launch. |

Admin manages all Businesses. Business isolation denies private access to anonymous and unrelated identities; it does not restrict platform Admin to one Business. Child resources must belong to the Business named in a mutation, preventing mismatched Link, Section, Image or Card references.

## Authentication, sessions and recovery

Accepted `security.authn-admin` requires individually provisioned Supabase email/password Admin accounts and mandatory authenticator-app TOTP MFA for privileged access. There is no public signup or shared Admin credential. Enforce MFA in the API, database and server rendering.

Accepted `security.session-policy` requires server-enforced 8-hour absolute and 30-minute idle expiry. Reassignment, Business enablement, payment-link changes and Admin-permission changes require TOTP performed within the preceding 5 minutes. Each privileged request checks verified current Admin membership. Bootstrap and lost-factor recovery use a trusted operator, out-of-band identity verification and audit attribution. Card ID possession cannot recover an account. A password reset cannot create Admin privileges or silently remove MFA.

Verify JWT signature, issuer/project, audience and expiry. Never trust a browser-supplied role, editable profile metadata or an unverified decoded claim. Current membership and session enforcement must work even when a previously issued provider token has not expired. Credential/session revocation and attributable change review need a defined operational recovery procedure.

The official [Supabase MFA guide](https://supabase.com/docs/guides/auth/auth-mfa) was read directly for this reconciliation. It documents TOTP, enrollment/challenge APIs, `aal2` and enforcement beyond the MFA screen. Provider capability does not prove NexTap configuration or the selected absolute/idle/fresh-TOTP policy. Actual enforcement remains a verification gate.

## Authorization and tenant isolation

Accepted `security.tenant-isolation` combines restricted public projections, RLS and least-privilege grants. Use verified current Admin membership/MFA with identity-scoped management clients. Deny anonymous management-table access; anonymous authentication or a publishable client key does not grant Admin status. Constrain child references to their Business and check stored and requested relationships during mutation.

Public reads expose only the permitted published representation. Restrict exposed functions/views and database grants. Server-only privileged credentials require explicit authorization and scope checks because privileged paths can bypass RLS. Normal identity-scoped management must not rely on an unrestricted service credential. Cookie-authenticated mutations need CSRF/origin protection. Management responses and authentication/session transitions cannot enter shared public caches.

The official [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Storage access-control guide](https://supabase.com/docs/guides/storage/security/access-control) were read directly. They document separate grant/policy checks, default view bypass risks and privileged database/Storage access. The RLS guide also warns that JWT membership claims can remain stale until refresh. Allow/deny verification must cover direct Data/Storage paths, exposed functions and scoped privileged server paths as well as the UI.

### Enforcement defaults

These are implementation defaults, not additional product decisions:

- The server obtains the provider session, verifies signature/issuer/audience/expiry, then resolves current Admin membership from authoritative storage on every privileged request. A stale JWT role, client-supplied Admin ID, cached membership result or expired idle timestamp is not sufficient. Absolute expiry is measured from session issuance; idle expiry is renewed only by an accepted request and never beyond the absolute limit.
- MFA assurance is checked at the API boundary and again inside sensitive command authorization. A TOTP challenge is single-use, bound to the current Admin/session and accepted only when its server-observed completion is no more than five minutes old. Reassignment, Business enablement, payment-link changes and Admin-permission changes fail closed when the freshness record is missing, expired or cannot be read.
- Normal management queries use an identity-scoped client with least-privilege grants and RLS. Public requests use a dedicated restricted projection/function that returns only currently publishable fields. Anonymous callers cannot query management tables, child rows, storage metadata, history, audit or idempotency records. Any server-only privileged credential is isolated to named operations and performs an explicit Admin, Business/resource and operation-scope check before use.
- Every child mutation verifies that Card, Section, Link, Image and slug references belong to the target Business in the same transaction. RLS is defense in depth, not a substitute for these checks. Exposed views/functions must not accidentally bypass RLS through owner or security-definer behavior.
- Cookie-authenticated state changes require a synchronizer token or equivalent same-origin CSRF control plus strict Origin/Referer validation. Reject missing, malformed or cross-site origins; do not treat SameSite cookies alone as complete protection. Authorization headers do not remove the need for CSRF when browsers can send the session cookie.
- Session, Admin, management and private-image responses are `private`/`no-store` at the browser and shared-cache boundary. CORS is not used to grant management access. Redirects, HEAD/304, framework prefetch, image optimizers and provider-native direct paths must pass the same authorization/fresh-gate checks.

The concrete enforcement checklist is implementation/prelaunch evidence under the selected runtime/provider gates, not a fifth human gate: prove membership revocation before token expiry, idle/absolute expiry, TOTP freshness and replay behavior, CSRF trusted-proxy handling, RLS/grants/security-definer paths, restricted projections and direct Storage/Data API denial. Provider documentation or a successful UI flow is not evidence of end-to-end enforcement.

## Public identity, revocation and caching

Accepted `security.public-token-entropy` requires at least 128 cryptographically random bits and enforced uniqueness for new Card IDs. Preserve printed legacy IDs exactly. The missing inventory sample prevents verification of actual legacy grammar, entropy or URL compatibility. Assess legacy enumeration risk against real evidence; do not assume the sample identifiers in the vision describe printed inventory. Encoding/grammar and immutable storage remain Database implementation contracts. Public routing tokens grant no permissions.

Accepted `security.public-cache-revocation` requires every new Card, Business and alias request to check current Card mapping/status where applicable and Business eligibility before using cached public content. Unknown eligibility returns unavailable; stale cached authorization cannot substitute for an authoritative read. A reassigned Card cannot receive its former Business through an old mapping. An Active Card assigned to a Disabled Business remains unavailable.

Q47, `architecture.content-cache`, requires atomic content save and Business content-revision increment. Each new request reads fresh eligibility and revision, then selects public cache keyed by Business plus revision. On a miss, load coherent current content. A cache-write failure does not fail a valid read; publication does not depend on global purge. Edit version and content revision are separate concepts unless a later physical contract maps them. Mixed-version data cannot be cached under a revision it does not represent.

Accepted `security.image-access` requires private Storage and application-mediated delivery. Every new image delivery checks the currently Enabled Business and current Logo/Cover reference. Disable or replacement stops old URLs from serving. Direct Storage URLs, reusable signed bearer URLs and CDN/conditional-response shortcuts cannot bypass that gate. Already delivered, in-flight, downloaded or browser-cached copies cannot be recalled.

Architecture owns cache/runtime mechanics, coherent projection ordering and response behavior. [ARCHITECTURE.md](ARCHITECTURE.md) documents the limitation of local Workers Cache API deletion and the accepted revision policy. Page and image cache checks must run before any new shared-cache delivery. Exact public statuses remain an API contract; messages cannot disclose old assignments, audit entries or private errors.

## Uploads and content validation

Accepted `security.upload-validation` permits JPEG, PNG and WebP only, at most 2 MiB and 16 megapixels per Logo or Cover. Validate actual content, decode/re-encode, strip metadata and reject SVG, animation and malformed images. Browser MIME and filename extensions alone are insufficient. Keep originals/rejected data private and bound decoding resource use.

Image replacement crosses Storage and PostgreSQL. A candidate sequence authorizes the Business/role, validates a new server-named immutable object, commits its reference with expected version, content revision and audit, then cleans up the prior object only when no current reference uses it. Failure before commit preserves the old reference. After commit, current-reference gating blocks old URLs immediately even if physical cleanup needs retry. Replaced or removed objects are eligible for cleanup immediately; the implementation default is physical deletion no later than seven days after reference replacement/removal, with no access or minimum-retention grace. Unused temporary data expires within 24 hours. Database and object storage do not share a transaction.

Accepted `security.external-content-validation` requires plain text Business content and HTTPS web destinations without embedded credentials. Generate validated `tel:`, `mailto:` and WhatsApp actions from authoritative contact fields. Reject scripts, HTML and arbitrary server-side destination fetching. Payment Links remain external URLs with no copyable payment identifiers or transaction confirmation.

| Accepted limit | Maximum |
| --- | ---: |
| Business name | 120 characters |
| Description | 1000 characters |
| Link label | 80 characters |
| Destination URL | 2048 characters |
| Generic Links per Business | 50 |
| Settings per Section | 8 KiB |

Validate registered Section and icon schemas before persistence. Optional fields remain optional. These are Security-owned implementation contracts, not unresolved human decisions. Proposed defaults are: normalize user-facing text to Unicode NFC, count Unicode scalar values for the 120/1,000/80/2,048 character limits, and trim surrounding Unicode whitespace; normalize phone/WhatsApp by trimming/NFC and retaining only an optional leading `+` plus ASCII digits after permitted separators are removed, and normalize email by trimming/NFC and lowercasing its domain; accept only an allowlisted Section registry with per-type schema versions and bounded plain-text settings (`title`, `layout`, `style`), plus allowlisted `icon_key` values and no icon URLs; and cap each non-multipart JSON request body at 256 KiB. Settings remain capped at 8 KiB encoded JSON per Section, and all defaults preserve the accepted maxima and Database/API contracts.


An Admin compromise can replace a payment destination with an attacker-controlled one. MFA, fresh TOTP for payment changes, attributable audit and current-revision delivery protect that workflow. A valid HTTPS URL does not establish its operator's trustworthiness.

## Abuse and request limits

Accepted `security.rate-limits` defines this launch profile. Exhaustion returns stable 429 errors and retry guidance. Trusted proxy configuration must prevent forged forwarding headers from evading account/IP controls.

| Operation | Accepted maximum |
| --- | --- |
| Login/recovery | 10 attempts per 15 minutes, using account and trusted-IP controls |
| MFA | 5 attempts per 10 minutes, using account and trusted-IP controls |
| Admin mutations | 120 per 10 minutes per Admin |
| Uploads | 20 per 10 minutes per Admin |
| Inventory imports | 5 per hour per Admin |
| CSV input | 10,000 rows and 10 MiB |
| Import preview validity | 30 minutes |

Public routes receive volumetric protection without a low blanket Visitor quota, matching vision section 26. Edge controls do not cover direct Supabase Auth, Storage or Data API access automatically; provider limits, authorization and restrictive policies must cover those paths too. Rate controls can transiently use account/IP context without retaining Visitor logs or analytics. Enforcement storage and trusted-proxy details remain implementation contracts.

Import previews grant no permissions. Recheck current Admin/MFA, validation, preview expiry/integrity and uniqueness at commit. Existing exact tokens remain unchanged, including when another import inserts one after preview. A retry or stale preview cannot activate, transfer or overwrite a live Card. CSV parsing/BOM/header rules and preview binding remain API contracts.
## Failures, concurrency and retry matrix

| Scenario | Required behavior | Exposure or recovery rule |
| --- | --- | --- |
| Two Admin tabs edit one Card or Business | Compare `expectedVersion` while holding the target/parent lock; stale write changes nothing and returns 409. | Do not disclose the winning Admin or private diff. Client rereads before a new attempt. |
| Two lifecycle commands race | Serialize Card state/assignment; enforce Inactive-before-assign and separate activation in the transaction. | A rejected transition cannot append history, audit or an idempotency success result. |
| Active assigned Card has Disabled Business | Independent activation is permitted; public page remains unavailable until Business is Enabled. | Never use Card Active alone as publication authorization. |
| Disable or transfer races a page/image request | New requests perform a fresh authoritative gate immediately before selecting cached bytes or private objects. | Already authorized in-flight, downloaded or browser-cached copies cannot be recalled; no stale authorization fallback. |
| Eligibility/revision/current image cannot be established | Fail closed with the safe unavailable/503 behavior owned by the API contract. | Never serve old page bytes, old image bytes, stale mapping, stale alias redirect or stale ETag/304. |
| Cache contains an old revision | Require fresh eligibility and exact Business+revision+renderer tuple before use. | Old keys may expire; purge success is not a security control. |
| Projection read races a content save | Load a coherent restricted snapshot and compare revision; retry once against the new revision or return unavailable. | Never cache mixed rows under the wrong revision. |
| Same idempotency key and same payload retry | Return the stored original result with `replayed:true` after current authorization/fresh-TOTP checks. | The key is not a bearer token and cannot bypass membership revocation. |
| Same key with different payload/route/resource | Reject with idempotency conflict; do not execute either request. | Canonical fingerprint includes method, route/resource and normalized body; do not log raw secrets. |
| Concurrent identical retries | One transaction owns the key; other requests wait within a bounded limit, then replay the committed result or return a retryable 503. | Never execute the mutation twice. A timeout does not imply rollback. |
| Idempotency record missing after response timeout | Re-read operation/resource and version; do not blindly issue a new key. | If commit truth cannot be established, keep affected retry/recovery handling conservative and do not claim rollback. |
| Idempotency key expires | Treat a later request as new only after reread and normal expected-version/lifecycle checks. | 24-hour key retention is an implementation default, distinct from 90-day audit and 24-hour temp-file retention. |
| Required audit/history write fails | Roll back the administrative mutation and return unavailable. | No partial state, history or “committed” response is allowed. |
| Database commit succeeds but response/cache/object cleanup fails | Preserve committed truth and expose only redacted operational diagnostics. | Replay returns the commit; cache fill and cleanup are repair work, never a rollback simulation. |
| Upload validation/decode fails | Reject before object becomes current; keep prior image reference. | Do not expose raw/rejected bytes; enforce byte, pixel, format, animation and decoder resource bounds. |
| Object write succeeds but reference commit fails | Keep prior image current and mark server-owned temporary object for cleanup. | Cleanup is idempotent and must not delete any current reference. |
| Reference commits but old-object cleanup fails | New reference remains authoritative; old URL fails current-reference gate. | Retry cleanup safely; never delete the new/current object or use age-only sweeps. |
| Admin membership or MFA is revoked mid-session | Next privileged request rechecks authoritative membership/MFA and fails closed. | Existing public content policy is unaffected; invalidate/revoke session through the trusted recovery procedure. |
| CSRF token/origin is absent or mismatched | Reject before mutation with 403; do not rely solely on SameSite cookies. | Do not record request bodies or secrets in the error log. |
| Rate-limit store or trusted proxy is unavailable | Fail closed for privileged/authentication mutations or apply a conservative bounded deny; public pages retain only volumetric protection if safe. | Never trust unverified forwarding headers or silently disable limits. |
| Provider logs/backups contain more data than application retention | Keep application minimization; restrict operator access and document the provider exception. | Launch remains gated until native retention/deletion/restore behavior is reviewed; app TTL does not erase backups. |
| Restore reintroduces old mapping/content, image or permission | Hold public and management writes outside restored state; reconcile revocations, versions, history, audit, idempotency and private references first. | Missing post-snapshot evidence keeps affected routes closed; do not infer current Enabled/Active state from an old backup. |
| External payment/review target fails or changes owner | Browser navigation only; NexTap records no payment success and does not retry transactions. | HTTPS validation is not third-party trust verification; Admin changes remain MFA/audit protected. |

A mutation is successful only when the database state and its required audit/history (and, for effectful commands, durable replay result) commit together. Cache, HTTP delivery, external navigation, object deletion and provider maintenance are outside that transaction and must never be represented as if they rolled back committed state.

## Inline domain terms

**Business**: The activity or organization represented by one public NexTap page. It is the tenant boundary. Avoid account when Business is meant.

**Card**: A physical NexTap card with permanent public identity and an optional current Business assignment. Avoid Business page or owner account.

**Card ID**: The permanent public identifier encoded in QR/NFC and the Card route. Avoid internal UUID, password or activation secret.

**Assignment**: The current association between one Card and one Business. Avoid Activation when only the association is meant.

**Activation**: Making an assigned Card Active. Public access also requires an Enabled Business. Avoid publication when only Card state is meant.

**NexTap Admin**: The platform operator authorized to manage inventory, Businesses and content. Avoid Business Owner.

**Visitor**: A person opening public NexTap URLs without management privileges. Avoid User when it implies a login.

**Card history**: The successful operational lifecycle timeline of a Card. Avoid scan analytics, public assignment history or routine audit.

## Inline decision records

### Admin-managed privileged access

Accepted. Admin-only launch gives operators platform-wide management capability. Individual TOTP, current membership, bounded sessions and fresh sensitive-action authentication add operator steps to reduce credential-compromise risk. Shared credentials and password-only privileged access were rejected.

### Fresh revocation before cached delivery

Accepted. The user rejected up to 60 seconds of stale eligibility and public sanitized image access after Disable/replacement. Every new page request checks current eligibility; image delivery checks the current reference. This costs authoritative reads and makes eligibility outages unavailable even when cached data exists. Downloaded copies cannot be recalled. Q47 separately accepts revision-keyed public content without purge-dependent publication; coherent loads and cache ordering still require implementation verification.

### Permanent minimal Card history

Q9's exact custom answer includes a trailing space inside the JSON string:

```json
{"answer":"1 , store the history from day one with simple ui "}
```

Ledger source `[140,0]` records the actual answer. The ledger separately attributes this interpretation to the parent at transcript line 143: "Option 1 plus mandatory operational Card history from day one with simple UI; separate from deferred analytics." The answer and parent interpretation are distinct evidence. Targeted transcript review checked both.

Q28 selects actual successful lifecycle changes and the read-only Admin timeline. Q35 selects minimal append-only Card-lifetime retention instead of rolling 365 days. Retain attributable lifecycle metadata while excluding copied contact content and Visitor activity. Routine audit expires after 90 days. Current state, required history and minimized mutation audit commit atomically; audit failure rejects the change.

## Deferred gates and implementation defaults

The settled Q42-Q47 policies are enforced above and are not pending questions. The following are genuine external gates or bounded implementation work; none reopens a settled policy or authorizes implementation.

| Key | Kind | Required follow-through |
| --- | --- | --- |
| architecture.workers-adapter | Deferred gate | Choose vinext/OpenNext only after actual compatibility checks on the pinned application, dependencies, runtime, private Storage path, bounded image processing, and the enforcement checklist below. |
| architecture.operational-targets | Deferred gate | Q46 requires prelaunch provider-verified budget, SLA, latency, region, recovery-time and acceptable-data-loss decisions; no numbers are invented. |
| security.privacy-data-minimization.provider-review | Deferred gate | Account-verify native logs/Auth/Storage/backups, contents, periods, permissions, deletion, restore reconciliation, and the enforcement checklist below. App expiry does not establish provider deletion. |
| database.legacy-token-inventory | Deferred gate | Obtain an actual printed-token sample and verify grammar, entropy and URL compatibility before import/manufacture/public use. Preserve every legacy ID exactly. |
| security.content-schema-details | Implementation detail | Use the Unicode, contact/label, registered Section/icon, settings-byte and combined-JSON defaults stated above; define hours timezone/overnight/overlap rules within the existing Database/API contracts. |
| security.rate-limit-enforcement | Implementation detail | Select bounded counter storage, trusted proxy identity, fail-closed behavior and cleanup/monitoring without retaining Visitor analytics. |
| security.image-decoder-and-cleanup | Implementation detail | Bound decoder resources and complete immutable-object intent, replacement/removal, cleanup, orphan and crash reconciliation without age-only deletion. |
| security.audit-history-schema | Implementation detail | Define minimized event fields, append-only enforcement, actor-reference handling and rejected-attempt audit expiry while preserving atomic successful writes and Card-lifetime history. |
| architecture.migration-restore-procedure | Implementation detail | Rehearse promotion and relational/private-object restore coverage; reconcile revoked access, removed content, versions/history/audit, retry records and image references before reopening.

No genuinely new Security-owned human choice was identified. All numbers and behaviors above are documentation defaults or accepted ledger decisions. The only four external gates are legacy-token inventory, Cloudflare adapter compatibility, provider log/backup/restore review, and prelaunch operating targets; the enforcement checklist is evidence within the runtime/provider gates, not an additional gate.


## Bounded consistency review

This pass read all five current drafts plus `vision.md`, the handoff and the accepted-decision ledger. Security wording now treats Q42 (explicit commands), Q43 (idempotency keys plus expected versions), Q44 (standard status map), Q45 (cursor pagination), Q46 (prelaunch operating-target deferral) and Q47 (revision-keyed cache plus fresh gate) as settled policies. Their detailed route and persistence contracts remain owned by [FLOWS_AND_API.md](FLOWS_AND_API.md), [DATABASE.md](DATABASE.md) and [ARCHITECTURE.md](ARCHITECTURE.md), not as stale unresolved Security questions.

Cross-document alignment checked here includes Admin-only scope, current membership and MFA, RLS/restricted public projections, CSRF, public-token limits, safe content/image bounds, rate limits, atomic audit/history, private image delivery, fresh fail-closed gates, revision cache ordering, retry truth, privacy minimization and restore/provider gates. This is documentation review only; no runtime, provider account, inventory sample, migration, image decoder or restore exercise was verified.

Peer documents may change after this read. The parent owner must perform the final cross-document review and record any later stale wording or hash state before approval. Intercom findings are evidence exchange, not human consent or document approval.

## Approval boundary

The candidate remains Draft. Root appends a plain peer-check record before freezing approval hashes and records any stale or unread candidate revision as incomplete. Scoped approval in the parent chat must name the exact precomputed replacement of `Status: Draft. Documentation only; no implementation is authorized.` with `Status: Approved. Documentation only; no implementation is authorized.` That one status-line change does not authorize implementation or satisfy a deferred gate. No material postapproval rewrite is permitted.

## Companion documents

[Product specification](PRODUCT_SPEC.md), [architecture](ARCHITECTURE.md), [database](DATABASE.md), and [flows and API](FLOWS_AND_API.md) own the adjacent shared, operational, persistence and HTTP contracts.
