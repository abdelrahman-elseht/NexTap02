# NexTap security and edge cases

Status: Draft. Documentation only; no implementation is authorized.

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

Effectful commands require `Idempotency-Key`; edits require `expectedVersion`. Repeating a key with the same payload returns the original result; a different payload is rejected. Replay must still satisfy current authorization. Key scope, retention duration, durable original-result storage, concurrent retries and post-expiry behavior remain unfinished contracts. The 90-day audit period does not establish retry-record retention.

Admin errors use `{error:{code,message,fieldErrors?,requestId}}`. Codes are stable, messages disclose no secrets or stack traces, and the UI handles translation. Accepted status classes are 401 missing session, 403 forbidden, 404 missing/non-disclosed resource, 409 version/lifecycle conflict, 422 semantic validation, 429 rate limit and 503 unavailable dependency. Detailed codes, payload schemas and all public lifecycle/alias statuses are unfinished. The public contract must preserve the safe Inactive-card notice without exposing assignment, history or Admin data. [FLOWS_AND_API.md](FLOWS_AND_API.md) owns these refinements.

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

## Public identity, revocation and caching

Accepted `security.public-token-entropy` requires at least 128 cryptographically random bits and enforced uniqueness for new Card IDs. Preserve printed legacy IDs exactly. The missing inventory sample prevents verification of actual legacy grammar, entropy or URL compatibility. Assess legacy enumeration risk against real evidence; do not assume the sample identifiers in the vision describe printed inventory. Encoding/grammar and immutable storage remain Database implementation contracts. Public routing tokens grant no permissions.

Accepted `security.public-cache-revocation` requires every new Card, Business and alias request to check current Card mapping/status where applicable and Business eligibility before using cached public content. Unknown eligibility returns unavailable; stale cached authorization cannot substitute for an authoritative read. A reassigned Card cannot receive its former Business through an old mapping. An Active Card assigned to a Disabled Business remains unavailable.

Q47, `architecture.content-cache`, requires atomic content save and Business content-revision increment. Each new request reads fresh eligibility and revision, then selects public cache keyed by Business plus revision. On a miss, load coherent current content. A cache-write failure does not fail a valid read; publication does not depend on global purge. Edit version and content revision are separate concepts unless a later physical contract maps them. Mixed-version data cannot be cached under a revision it does not represent.

Accepted `security.image-access` requires private Storage and application-mediated delivery. Every new image delivery checks the currently Enabled Business and current Logo/Cover reference. Disable or replacement stops old URLs from serving. Direct Storage URLs, reusable signed bearer URLs and CDN/conditional-response shortcuts cannot bypass that gate. Already delivered, in-flight, downloaded or browser-cached copies cannot be recalled.

Architecture owns cache/runtime mechanics, coherent projection ordering and response behavior. [ARCHITECTURE.md](ARCHITECTURE.md) documents the limitation of local Workers Cache API deletion and the accepted revision policy. Page and image cache checks must run before any new shared-cache delivery. Exact public statuses remain an API contract; messages cannot disclose old assignments, audit entries or private errors.

## Uploads and content validation

Accepted `security.upload-validation` permits JPEG, PNG and WebP only, at most 2 MiB and 16 megapixels per Logo or Cover. Validate actual content, decode/re-encode, strip metadata and reject SVG, animation and malformed images. Browser MIME and filename extensions alone are insufficient. Keep originals/rejected data private and bound decoding resource use.

Image replacement crosses Storage and PostgreSQL. A candidate sequence authorizes the Business/role, validates a new server-named immutable object, commits its reference with expected version, content revision and audit, then cleans up the prior object only when no current reference uses it. Failure before commit preserves the old reference. After commit, current-reference gating blocks old URLs even if physical cleanup needs retry. Exact removal, replaced-object retention and cleanup execution remain implementation contracts. Unused temporary data expires within 24 hours. Database and object storage do not share a transaction.

Accepted `security.external-content-validation` requires plain text Business content and HTTPS web destinations without embedded credentials. Generate validated `tel:`, `mailto:` and WhatsApp actions from authoritative contact fields. Reject scripts, HTML and arbitrary server-side destination fetching. Payment Links remain external URLs with no copyable payment identifiers or transaction confirmation.

| Accepted limit | Maximum |
| --- | ---: |
| Business name | 120 characters |
| Description | 1000 characters |
| Link label | 80 characters |
| Destination URL | 2048 characters |
| Generic Links per Business | 50 |
| Settings per Section | 8 KiB |

Validate registered Section and icon schemas before persistence. Optional fields remain optional. Exact Unicode counting, contact/label normalization, settings-field/byte contracts and the combined JSON request ceiling remain unfinished. The selected numbers do not choose these details.

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

## Privacy, history and audit

Accepted `security.audit-retention` keeps minimized routine Admin audit metadata for 90 days, operational errors for 14 days, and raw imports plus unused temporary uploads for 24 hours. Restrict audit/history access to authorized operators. These application periods do not establish provider-native log, Auth, Storage or backup expiry.

Accepted `security.card-history-retention` keeps minimal append-only successful Card history for the permanent Card lifetime. Include actor UUID, event/time, old/new Business IDs and status. Exclude copied actor email, IP and full content. The Admin-only read-only timeline is separate from routine audit expiry and contains no scans/clicks. Expected-version conflicts, rejected attempts, skipped existing import tokens and no-ops do not become successful lifecycle changes.

Accepted `security.audit-write-failure` commits minimized successful-mutation audit atomically with administrative data. Required Card history belongs in the same transaction. Required audit/history storage failure rejects the mutation. Cache, response or object-delivery failure after commit cannot be reported as database rollback. Exact rejected-attempt audit behavior and expiry execution remain implementation contracts.

Accepted `security.privacy-data-minimization` limits operational logs to request IDs, route templates and redacted errors. Do not retain Visitor identifiers, raw IPs, full public tokens, queries, full bodies, secrets, session tokens or tracking/fingerprints. Restrict access. Intentionally published Business contacts, location and payment URLs are public; credentials, inventory, history and Admin identities are private.

Before launch, account-verify provider-native log/backup contents, periods, permissions, deletion and restore reconciliation. Disable blocks public access without erasing stored information. Version one excludes Card/Business hard deletion; field removal, obsolete-object cleanup and expiry still apply. Restore must not reopen revoked access or removed content before reconciliation. Relational data and private objects need coordinated recovery coverage. Q46 defers budget, SLA, latency, region, recovery-time and acceptable-data-loss numbers to mandatory provider-verified prelaunch decisions. No values or provider-plan capabilities are selected here.

## Failures and concurrency

| Scenario | Accepted behavior or unfinished detail |
| --- | --- |
| Two Admin tabs edit one Card or Business | Reject stale expected version without mutation; preserve atomic successful history/audit. |
| Active assigned Card has Disabled Business | Independent activation is permitted; deny public Business content until Enabled. |
| Disable or transfer races a request | Every new request performs a fresh gate; already authorized in-flight copies cannot be recalled. |
| Eligibility cannot be established | Fail closed; cached content cannot supply missing authorization. API owns safe unavailable response details. |
| Required audit/history write fails | Reject the entire administrative mutation. |
| Database commit succeeds but response fails | Preserve committed truth. Same-key/same-payload replay returns the original result; exact durable retry storage and expiry remain unfinished. |
| Cache fill fails | Use coherent current content after the successful fresh gate; cache-write failure does not fail a valid read. |
| Upload succeeds but reference commit fails | Preserve old reference; clean up unused private data within accepted retention. |
| Reference changes but old-object cleanup fails | Current-reference gate blocks old URLs; cleanup cannot delete the current object. |
| Admin compromised or MFA lost | Current membership/session checks and trusted audited recovery; verify revocation/enforcement. |
| Restore reintroduces old mapping/content | Reconcile revoked access, removed content, versions/history/audit and image references before public reopening. |
| External payment/review target fails | Browser navigation only; no payment confirmation or financial retry. |

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

## Deferred gates and unfinished contracts

Every item below remains unresolved within the candidate. None reopens settled policy or authorizes implementation.

| Key | Kind | Remaining requirement |
| --- | --- | --- |
| architecture.workers-adapter | Deferred gate | Choose vinext/OpenNext only after actual project compatibility checks on a pinned application/framework/runtime combination. |
| architecture.operational-targets | Deferred gate | Q46 requires prelaunch provider-verified budget, SLA, latency, region, recovery-time and acceptable-data-loss decisions; no numbers invented. |
| security.privacy-data-minimization.provider-review | Deferred gate | Account-verify native logs/Auth/Storage/backups, contents, periods, permissions, deletion and restore reconciliation. App expiry does not establish provider deletion. |
| security.enforcement-verification | Deferred gate | Verify sessions/MFA/current membership, recovery, CSRF, identity-scoped access, grants/RLS/restricted projection, child constraints, decoder, trusted-proxy/rate controls and public/current-image cache ordering against the selected runtime/provider. |
| database.legacy-token-inventory | Deferred gate | Actual printed-token sample is absent. Verify real grammar/entropy/URL compatibility before legacy import, manufacture, implementation or public use. Preserve printed IDs exactly. Missing evidence does not block a truthful documentation candidate. |
| database.public-token-policy | Implementation detail | Define encoding, length, collation/case and URL parsing without reducing new-token entropy or altering legacy IDs. |
| database.physical-schema | Implementation detail | Finish physical constraints, slug registry/normalization, supported link-bearing types, order/count enforcement, image metadata and activation timestamps. Accepted cardinalities and lifecycle remain binding. |
| database.publication-revision | Implementation detail | Define revision increment scope, expected-version mapping and coherent restricted projection/snapshot/retry mechanics; Q47 policy is settled. |
| security.audit-history-schema | Implementation detail | Define minimized events/actor references, append-only enforcement, identity-change handling, rejected-attempt audit behavior and expiry execution. Accepted atomicity and periods remain binding. |
| api.retry-record-contract | Implementation detail | Define key scope/retention, payload binding, atomic original-result storage, authorized replay, concurrent retries and crash/post-expiry behavior. Q43 keys-plus-versions policy is settled. |
| api.representation-contract | Implementation detail | Finish public lifecycle/alias statuses and cache/disclosure rules, payload/field-error schemas, cursor bounds, no-op results, CSV parsing/preview binding and truthful committed revision responses. |
| architecture.image-storage-workflow | Implementation detail | Finish private immutable object/reference replacement/removal, replaced-object retention, orphan cleanup/retry/crash behavior and completion semantics. Database/Storage are non-atomic. |
| architecture.migration-restore-procedure | Implementation detail | Define tested promotion and relational/private-object restore coverage; reconcile revoked access, removed content, versions/history/audit and references before public reopening. |
| security.json-body-limit | Implementation detail | Set the combined JSON request-byte ceiling within accepted per-field, settings, image and CSV limits. |
| security.content-schema-details | Implementation detail | Define Unicode counting, contact/label normalization, registered Section/icon fields and byte encoding, hours timezone/overnight/overlap rules within approved bounds. |
| peer.security.flows-and-api | Peer check | The checked API snapshot retains Q42 to Q45 pending claims and speculative delivery/revision wording. Its owner reports repair in progress; repaired candidate bytes have not been read in this bounded pass. Root must record the final check state. |

No genuinely new Security-owned human choice was identified. All four peer outcomes and their exact checked hashes follow below. A later hash change invalidates the content check for that later revision until root records it as reviewed or incomplete.

## Bounded consistency review

One full cross-read checked all five documents for scope, vocabulary, cardinality, lifecycle and API/persistence/security/cache contracts. `document_hashes` returned identical peer hashes immediately before and after the reads. These are content-checked snapshots, not frozen approval hashes.

| Peer document | Content-checked SHA-256 | Outcome and limitation |
| --- | --- | --- |
| [PRODUCT_SPEC.md](PRODUCT_SPEC.md) | `0bd509673eb8a44dc051a726037574e164ef4880844e581c22509ee4a7643c55` | Consistent at checked revision. Admin-only scope, terms/cardinality/lifecycle, history, API/security and Q47 cache align. Its retained peer evidence predates Security/API repair and remains historical. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | `1a57cf9917e6780e29e343843359ebe7afc581f3e8c312fc63cc87fc926cdd70` | Consistent at checked revision. Fresh gates, coherent revision cache, atomic audit/history, private images and Q46 deferral align. Runtime/provider/cache/storage contracts remain gates. |
| [DATABASE.md](DATABASE.md) | `992f5da8f61ebd2e04fd3447a214b7ea438a423bfb79bb54bc41a6084d4c3dc4` | Consistent at checked revision. UUID/token distinction, same-Business constraints, cardinality, expected versions, audit/history, retention and Q47 coherent projection align. Schema/sample/Storage/replay details remain unfinished. |
| [FLOWS_AND_API.md](FLOWS_AND_API.md) | `23d970e19053fb8a92a7b7507af10f7a319e03fcb219a016eb18072a486b0f44` | Incomplete. Core journeys/gates/import/history align; lines 145, 187 to 200, 236, 277 and 281 to 290 lag Q42 to Q47. Repaired bytes were not read. Owner's repair notice is evidence exchange, not approval or completed verification. |

One consolidated acknowledgment/request was sent per discovered peer target. Product, Architecture and Database targets were future stages, so their notes were queued. API was live. No parent target was visible in the Intercom list; this document and its report provide the durable root handoff. No reply, transport acceptance or silence is treated as consent. No peer or human wait occurred.

All owned-document local Markdown targets were read and resolved. Peer local links also resolve to read evidence files. No local Markdown link in the checked snapshots used a fragment, so no anchor target required verification. Vision section citations and ledger keys were checked. The three cited Supabase sources were read directly for the stated MFA/grants/RLS/Storage claims. Architecture's Cloudflare provider facts were read in its document/report, not independently tested here. This is source/crosslink review only.

## Approval boundary

The candidate remains Draft. Root appends a plain peer-check record before freezing approval hashes and records any stale or unread candidate revision as incomplete. Scoped approval in the parent chat must name the exact precomputed replacement of `Status: Draft. Documentation only; no implementation is authorized.` with `Status: Approved. Documentation only; no implementation is authorized.` That one status-line change does not authorize implementation or satisfy a deferred gate. No material postapproval rewrite is permitted.

## Companion documents

[Product specification](PRODUCT_SPEC.md), [architecture](ARCHITECTURE.md), [database](DATABASE.md), and [flows and API](FLOWS_AND_API.md) own the adjacent shared, operational, persistence and HTTP contracts.

## Recovery peer-check record

- docs/PRODUCT_SPEC.md: consistent; checked hash is current. Full bounded read bracketed by identical hashes, unchanged at later hash-only observation. Scope/vocabulary/cardinality/lifecycle, lifetime history, expected versions/atomic audit, API/status/cursor constraints, public/image gates and Q47 revision cache align with ledger. Retained historical peer records predate Security/API repairs and remain incomplete for later bytes. One acknowledgment queued to discovered future Product target; transport is not approval.
- docs/ARCHITECTURE.md: consistent; checked hash is current. Full bounded read bracketed by identical hashes, unchanged at later hash-only observation. Scope/terms/cardinality/lifecycle, fresh fail-closed eligibility/current-image gates, coherent Business/revision cache, atomic audit/history, private Storage and Q46/Q17 gates align. Runtime/provider/cache/image/restore mechanisms remain unfinished. One acknowledgment queued to discovered future Architecture target; no later bytes or approval certified.
- docs/DATABASE.md: consistent; checked hash is current. Full bounded read bracketed by identical hashes, unchanged at later hash-only observation. UUID/public-token separation, cardinality/tenant constraints, lifecycle, safe imports, expected versions, atomic audit/history, retention, coherent Q47 projection and non-atomic DB/Storage agree. Physical schema, missing sample, normalization, replay/image/restore details remain unfinished. One acknowledgment queued to discovered future Database target; no approval inferred.
- docs/FLOWS_AND_API.md: incomplete; incomplete, checked hash is stale. Full bounded read bracketed by identical hashes, unchanged at later hash-only observation. Core scope/vocabulary/cardinality/lifecycle/auth/public-image gate/history/import contracts align. Q42-Q45 pending claims and speculative delivery.pending/future-revision language lag verified answers/Q47. Consolidated request delivered to live API owner; its repair notice does not verify repaired bytes. Repaired candidate not read; current/frozen-root check incomplete, no consent inferred.
