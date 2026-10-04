# NexTap database specification

Status: Draft. Documentation only; no implementation is authorized.

## User amendments

All human questions and scoped document approvals belong in the parent chat. Document owners exchange evidence through Intercom; peer messages and silence do not establish decisions or approval. This reconciliation continues the original documentation task without restarting its interview.

## Sources and evidence

The complete source is [vision.md](vision.md). Requirements below cite its numbered sections. The [accepted-decision ledger](../.atomic/recovery/accepted-decisions.json) records 47 actual parent-chat answers and their transcript result lines. It overrides stale unresolved entries in the original [database artifact](../.atomic/workflows/runs/vision-docs/7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8/database.json), not accepted verification deferrals. The [unanswered inventory](../.atomic/recovery/unanswered-batches.json) contains no complete unanswered batch. The continuation [source manifest](../.atomic/workflows/runs/vision-docs-continuation/5c5087c4-cc46-4444-b870-670018f926b6/sources.json) identifies the retained inputs; [new answers](../.atomic/workflows/runs/vision-docs-continuation/5c5087c4-cc46-4444-b870-670018f926b6/new-answers.json) is empty. No document approval exists in those inputs.

Current file inspection found the vision, five document drafts, design assets and Atomic documentation records, but no application code, database migrations, package manifest or card import spreadsheet. The original inspection also found no workspace instruction file, glossary or ADR. The [workflow setup record](../.atomic/vision-docs-setup.md) is historical setup evidence, not proof of current implementation or approval. Absence of an inventory sample means existing printed token formats cannot yet be verified.

Source requirements, repository facts, accepted user decisions and physical-schema proposals are distinct. This specification is in English under `foundation.doc-language`. Source review is documentation verification only; no database, provider account, runtime or security control was tested.

## Domain language

Card status is Active/Inactive; Business status is Enabled/Disabled. These are separate lifecycles, so an Active Card does not necessarily have a publicly visible page.

**Business**: The activity or organization represented by one public NexTap landing page. It is the tenant boundary. Avoid treating it as a user account.

**Card**: A physical NexTap card with a permanent public identity and an optional current Business assignment. Avoid treating it as the landing page.

**Card ID**: The permanent public token printed or encoded on a Card and used in `/c/{Card ID}`. Avoid equating it with an internal UUID or slug.

**Assignment**: The current association between a Card and one Business. Avoid calling assignment activation.

**Activation**: Making an assigned Card Active. Public access also requires an Enabled Business. Avoid equating it with Business enablement.

**Section**: A supported configurable content group on a public Business page. Avoid treating it as an arbitrary website-builder block.

**Link**: A Business-controlled destination shown in one supported link-bearing Section. Avoid treating a payment destination as a NexTap transaction.

**Card history**: The successful operational lifecycle timeline of a Card. Avoid treating it as visitor analytics, a public assignment history or routine security audit.

**Slug alias**: A former Business slug permanently reserved for the same Business. Avoid treating it as another page or a transferable name.

NexTap Admin is a platform operator, not the Business Owner. A Visitor has no management privileges.

## Source-backed relationships

- One Business has zero or more Cards. A Card is assigned to at most one Business at a time, and unassigned inventory has no Business. Source: vision sections 3, 19 and 43.
- One Business has its own Sections, Links and image references. Each child belongs to one Business through `business_id`. Source: sections 6, 10, 11, 20 and 43.
- Admin-only launch and `No owner link (Recommended)` exclude `owner_user_id` and dormant owner-account relationships in v1. Future owner login requires a deliberate later ownership migration.
- Each Business uses up to two image roles, `logo` and `cover`; both are optional. Files live in private object storage, not PostgreSQL. Source: sections 8 and 20, clarified by Q29 and Q34.
- Each generic Link belongs to exactly one supported link-bearing Section of its own Business and appears once. Repeated platform types are allowed with distinct labels. Q30 settles this cardinality.

## Source-backed entities

| Entity | Source fields | Accepted rule and unfinished physical contract |
| --- | --- | --- |
| User | `users`, authentication recommendation | Only individual Admin identities at launch; reuse Supabase Auth identity. Membership/profile schema and grants remain implementation contracts; no Business owner link |
| Business | Source proposes `id`, `owner_user_id`, `name`, `slug`, content and status timestamps | Internal UUID; omit `owner_user_id`; create Disabled; name and unique slug suffice for enablement. Alias storage and content-field encoding remain proposals |
| Card | `id`, `public_token`, `status`, `business_id`, `activated_at`, `created_at` | Internal UUID distinct from immutable public token; lifecycle, successful history and expected versions settled. Token encoding and timestamp meaning remain unfinished |
| Business section | `id`, `business_id`, `section_type`, `is_enabled`, `sort_order`, `settings` | At most one instance per built-in type; registered settings schema and 8 KiB bound. Field shapes and schema versioning remain unfinished |
| Business link | `id`, `business_id`, `type`, `label`, `url`, `icon`, `is_active`, `sort_order` | Exactly one same-Business supported Section; repeated platform types with distinct labels; at most 50 Links per Business |
| Business image | `id`, `business_id`, `image_type`, `storage_path` | At most one current Logo and Cover; private storage and current-reference delivery gate. Metadata and cleanup execution remain unfinished |
| Card history | Added by Q9, specified by Q28 and Q35 | Minimal append-only successful lifecycle events retained for Card lifetime; Admin-only read-only timeline |
| Admin audit | Required by Q27 and Q40 | Minimized successful-mutation audit commits with data; routine retention 90 days; exact event schema remains unfinished |
| Scan event | Optional source example only | Excluded from launch; no `scan_events`, product counters or visitor tracking in v1 |

Field lists in vision sections 10, 11, 17-20 and 34 are examples or proposals, not implemented schemas. No payment, balance or transaction entity is needed for external-link-only payments, sections 7 and 36 and Q16.

## Accepted shared choices

The ledger records actual user selections, not approval of this document as a whole.

| Key | Exact answer | Database implication |
| --- | --- | --- |
| `foundation.release-actors` | `Admin only (Recommended)` | Only Admin creates Businesses and edits content; owner login is deferred |
| `foundation.doc-language` | `English docs (Recommended)` | Five documents use English |
| `foundation.release-options.analytics` | `Defer analytics (Recommended)` | No product scan/click events or counters; operational records are separate |
| `foundation.release-options.slug` | `Include /b/{slug} (Recommended)` | Business sharing route is independent of permanent Card URLs |
| `foundation.card-lifecycle` | Custom answer reproduced below | Deactivate before reassignment; activate separately; day-one Card history and simple UI |
| `foundation.business-publication` | `Explicit enable (Recommended)` | Create Disabled; explicit enable; later saves publish immediately; Disable preserves Card status/assignment; no Business hard deletion |
| `foundation.ownership` | `No owner link (Recommended)` | No Business-to-owner-account relationship |
| `foundation.slug-history` | `Redirect and reserve (Recommended)` | Historical slugs remain with the same Business and cannot be reused by another; Disable gates aliases |
| `foundation.content-cardinality.sections` | `One per type (Recommended)` | Hero, Contact, Social, Payments, Location, Hours, Reviews and Custom Links each occur at most once |
| `foundation.content-hours` | `Weekly schedule (Recommended)` | Seven days, closed or multiple intervals, Business timezone; no holidays or calculated open-now |
| `foundation.contact-canonical-value` | `Unified contact fields (Recommended)` | Phone, WhatsApp and email are authoritative fields; derived buttons, no competing generic contact buttons |
| `foundation.payment-actions` | `External links only (Recommended)` | External URLs only; no processing, verification or copyable payment identifiers |
| `foundation.card-history-details` | `Successful changes (Recommended)` | Creation/import and actual successful Assign/reassign, Activate, Deactivate and Unassign; actor/time/old-new Business and status |
| `product.publication-readiness` | `Name + slug (Recommended)` | Nonempty name and unique slug; contacts, Links, hours, location and images optional |
| `foundation.content-cardinality.links` | `One section; repeats allowed (Recommended)` | Exactly one supported Section per Link, one placement, repeated platforms with distinct labels |
| `foundation.card-activation-eligibility` | `Independent activation (Recommended)` | Assigned Card may activate while Business Disabled; public content remains blocked |

Q9's exact custom answer includes one trailing space. Its evidence remains a JSON string so the space is not lost:

```json
{"answer":"1 , store the history from day one with simple ui "}
```

The parent interpretation is separately attributed to transcript line 143: "Option 1 plus mandatory operational Card history from day one with simple UI; separate from deferred analytics." The ledger records this interpretation independently of the actual answer at result line 140. The referenced option is Deactivate first; the custom answer is not recast as a selected option. Q28 and Q35 subsequently settle history coverage and retention.

The proposed source field `owner_user_id` is excluded from v1. Business publication state is independent of Card activation. Slug grammar and normalization remain API/database implementation contracts, not another question about the settled alias policy.

## Accepted local and companion choices

Q7, `database.internal-identifiers`, selected `Internal UUIDs (Recommended)`. Cards, Businesses and content use internal UUID primary keys; printed tokens are separate. Reuse Supabase Auth user identity rather than inventing a second login identity.

Q8, `database.import-policy`, selected `Atomic safe batch (Recommended)`. Preview first. Invalid rows or duplicate tokens within the file reject the whole batch. Skip existing exact tokens without changing state or assignment. Insert new Cards only as Inactive and unassigned. Reject Active requests.

Q19, `database.migration-policy`, selected `Supabase SQL migrations (Recommended)`. Keep reviewed versioned SQL migrations in the repository, test before production and prohibit undocumented dashboard-only production schema changes.

Q31, `database.write-concurrency`, selected `Expected versions (Recommended)`. Require the version read by the editor and reject stale writes without changes. Successful Card mutations and required history commit atomically. Q40 also requires minimized audit to commit with every successful administrative data mutation.

Architecture decisions select one Next.js application with Supabase PostgreSQL, Auth and Storage on Cloudflare Workers, not Vercel. Staging and production have separate Workers and Supabase services. Exact vinext/OpenNext selection is deferred until actual project compatibility checks. No provider service is provisioned by these choices.

Q46, `architecture.operational-targets`, selected `Defer numbers to prelaunch (Recommended)`. Budget, SLA, latency, region, recovery-time and acceptable-data-loss targets remain mandatory provider-verified prelaunch choices. Q47, `architecture.content-cache`, selected `Revision cache + fresh gate (Recommended)`. Its database contract appears under transaction boundaries.

API decisions select direct public HTML at `/c/{Card ID}` and a private HTTP/JSON management API under `/api/admin` using internal UUID references. Q42 requires explicit POST commands for Assign/Unassign/Activate/Deactivate, PATCH for Business fields and PUT for complete Section/Link order lists. Q43 requires `Idempotency-Key` for effectful commands and `expectedVersion` for edits. Same key and payload returns the original result; a different payload is rejected. Retention duration and detailed replay/persistence contracts remain unfinished.

The accepted Admin error envelope is `{error:{code,message,fieldErrors?,requestId}}`, with stable codes and safe messages. Q44 selects 401 for missing session, 403 forbidden, 404 missing/non-disclosed resources, 409 version/lifecycle conflict, 422 semantic validation, 429 rate limit and 503 unavailable dependency. This does not settle all public lifecycle statuses. Q45 selects opaque cursor pagination with bounded limits, stable sorting and `nextCursor`; exact bounds and cursor encoding are implementation contracts. [FLOWS_AND_API.md](FLOWS_AND_API.md) owns HTTP/payload details.

## Lifecycle invariants

Card IDs are permanent unique nonsequential public tokens. Renaming a Business, changing its slug or changing its page cannot change the printed token, vision sections 4 and 5. Newly generated IDs require at least 128 cryptographically random bits; preserve existing printed IDs exactly. Public tokens grant no permissions. Exact new-token encoding, legacy parsing and case/URL handling remain unfinished.

An Active Card requires a valid Business assignment. An Inactive Card may be assigned or unassigned. Deactivate retains assignment. Assign/reassign requires Inactive and leaves the Card Inactive; Activate is a separate command. Unassign makes it Inactive and clears assignment. Card deletion and token reuse are excluded in v1. Business hard deletion is also excluded.

An assigned Card may activate while its Business is Disabled. Public `/c` access still requires Active Card, current assignment and Enabled Business. A Business begins Disabled, and a nonempty name plus unique slug permits explicit enablement. Later successful content saves publish without a separate draft/Publish workflow. Disable blocks Card, canonical Business and alias routes without modifying Cards.

Each new Card/Business/alias request reads fresh current eligibility before serving cached content. Unknown eligibility returns unavailable. No stale assignment or eligibility fallback is permitted. Already delivered, browser-cached or in-flight copies cannot be recalled.

Expected-version checks and database transactions must preserve these invariants under concurrent commands. Locking and SQL constraint mechanisms remain implementation details; the stale-write rejection policy is settled. The meaning of `activated_at`, initial versus latest activation, remains unfinished. Required history already preserves successful activation times independently of that summary field.

### Day-one Card history

Q9 requires history from day one with a simple UI. Q28 records creation/import and successful Assign/reassign, Activate, Deactivate and Unassign when state or assignment actually changes. Include actor UUID, time, old/new Business and status. Creation/import concerns new Cards; skipped existing tokens and no-op commands are not successful lifecycle changes. Rejected attempts belong to routine security audit.

Q35 requires minimal append-only history for the permanent Card lifetime, in an Admin-only read-only per-Card timeline. Exclude IPs, copied actor emails, credentials, sessions, scans/clicks and full content snapshots. The 90-day routine audit expiry does not delete Card history.

Candidate storage is a `card_history` relation with internal UUID, Card UUID, event type, actor UUID, event timestamp and old/new status/Business references. One Card has many history entries. Physical names, null representation for creation/unassigned states, timestamp precision and preserving actor references after identity changes remain implementation contracts. Do not silently add reason text or content snapshots to the selected minimal history.

Each successful lifecycle mutation commits its required history and minimized mutation audit with the data. If required history/audit cannot persist, reject the whole mutation. The timeline contract is in [FLOWS_AND_API.md](FLOWS_AND_API.md); it is never part of the public landing-page projection.

## Content persistence proposals

Links and Sections use tenant-owned rows rather than platform-specific columns, following vision sections 10 and 11. At most one of each approved built-in Section exists per Business. Each generic Link belongs to exactly one supported link-bearing Section of that Business. Repeated platform types require distinct labels. Contact actions derive from canonical fields instead of generic contact Links. Logo and Cover are the only image roles, both optional.

These semantic rules are accepted. Exact relational representations, registered field schemas and encoding remain candidates, not approved migrations.

### Candidate relational constraints

| Relation | Candidate constraint | Evidence or unfinished contract |
| --- | --- | --- |
| `cards.public_token` | Non-null, globally unique, immutable after insertion; exact imported value retained | Permanent-ID rule and Q25; encoding/collation/legacy grammar unfinished |
| `cards.business_id` | Nullable Business foreign key; non-null whenever Active; no cascading Business deletion | Accepted lifecycle and no-hard-delete rules |
| `business_sections.business_id` | Non-null Business foreign key; type restricted to supported renderer types | Tenant and supported Section rules |
| `business_sections` | Unique `business_id, section_type` across the eight built-in types | Accepted at-most-one-per-type cardinality |
| `business_links` | Repeated platform types allowed with distinct labels; maximum 50 per Business | Q30 and Q38; label distinctness/normalization and concurrent count enforcement unfinished |
| Link-to-Section membership | Non-null reference to its own Business's supported link-bearing Section | Accepted membership; composite tenant foreign key is a candidate mechanism |
| `business_images` | One current reference per `business_id, image_type`, restricted to `logo` and `cover` | Accepted role cardinality and current-reference gate; reference/cleanup schema unfinished |
| Ordered content | Integer `sort_order`, deterministic stable-ID tie-break and atomic Business-scoped reorder | Candidate encoding; complete order-list commands and expected versions accepted |
| Business slug | Current/historical slugs globally reserved to one Business; aliases resolve only to its current route | Accepted reservation; registry representation and normalization unfinished |
| Business versions/revisions | Persist expected-write version and atomic public-content revision | Q31/Q47; whether they share a field and which mutations increment each remains unfinished |

Candidate indexes follow the access paths in vision sections 12 and 21: unique token lookup; assigned-card listing by Business; Sections by Business/enabled/order; Links by Business/active/order; Images by Business/role; Admin timeline and cursor-list access paths. Index choice is not a measured performance result.

Q38 requires plain text, HTTPS web destinations without credentials, validated derived contacts, registered Section/icon schemas, name at most 120 characters, description 1000, label 80, URL 2048, 50 Links per Business and 8 KiB settings per Section. These bounds must hold before persistence. Unicode counting, contact/label normalization, settings byte encoding, schema fields and the combined JSON-body ceiling remain implementation contracts; the accepted maxima are not defaults for those details.

Candidate alias storage is one `business_slugs` registry containing current and former slugs, each tied to the same durable Business UUID. Enforce global uniqueness and at most one current slug per Business. Update current slug and retain former alias atomically. Aliases read current eligibility, not a separately publishable stale profile. This physical representation remains a proposal. Never reassign aliases to another Business.

### Canonical values and duplication

Phone, WhatsApp and email are authoritative Business fields. Derive validated contact buttons; generic Links cannot create competing contact values. Contact optionality is settled; exact normalization and validation implementation are unfinished.

Weekly hours cover seven days, closed days or multiple opening/closing intervals and a Business timezone. No holiday calendar or calculated open-now status exists in v1. Physical storage, overnight representation, overlap validation and timezone encoding remain unfinished. Candidate Section `settings` contains bounded typed presentation options, not an unvalidated copy of the Business. Links and Images remain separate source-backed entities.

Payment items are external URLs only. They never create financial transaction records or copyable payment identifiers. Google Reviews is a configured external destination, not an automatic rating integration. Tenant-supplied HTML/scripts and arbitrary server URL fetching are excluded.

### Transaction boundaries

Each Card command validates expected version and current lifecycle invariants, then commits data, minimized audit and any required successful history together. A stale tab cannot overwrite a newer assignment or reactivate a Card another Admin has unassigned. Audit/history failure commits no administrative change.

Q47 requires public-content writes and an incremented Business content revision in the same transaction. Each new public request reads current eligibility and revision, then uses public cache keyed by Business plus revision. On a miss, load coherent content for that revision. A racing write must not produce mixed-version content or cache new content under an old revision. Exact snapshot/read-retry mechanics remain an implementation contract.

A cache-write failure does not fail an otherwise valid read. Publication does not depend on successful global purge. If eligibility or required current content cannot be established, return unavailable instead of old content. `expectedVersion` protects writes; content revision selects representations. They are not interchangeable without an explicit implementation mapping.

Database commit and external image/cache operations are separate. A delivery, response or cleanup failure after commit cannot claim that data rolled back. API result/replay storage must report committed truth. Exact idempotency key lifetime, binding/scope, authenticated replay, original-result persistence and crash/expiry behavior remain unfinished contracts; do not substitute the 90-day audit period for key retention.

Image replacement crosses PostgreSQL and private object storage. Candidate sequence: authorize and validate a new immutable object, commit its current reference with expected version, content revision and audit, then clean up the old object once no current reference remains. Failure before commit leaves the previous reference usable through its normal eligibility gate. Failure after commit cannot erase the new current object to simulate rollback. Every new public image request checks Enabled Business and current reference; Disable or replacement blocks old URLs even before physical cleanup. Cleanup execution, replaced-object retention, retry/crash handling and deletion of optional image slots remain implementation contracts. No background worker or cross-provider transaction is assumed.

## Imports and migration

Vision sections 3 and 33 describe importing existing Excel IDs and managing Cards afterward. No inventory file is present. Existing printed IDs must not be regenerated or silently altered. Q23 selects UTF-8 CSV exported from Excel, with `card_id` and optional `status` that must be Inactive; direct XLSX is excluded. Q39 caps CSV at 10,000 rows and 10 MiB and gives previews 30-minute validity. Raw imports/unused temporary uploads expire within 24 hours.

Preview validates the complete batch. Commit independently rechecks current Admin/MFA, preview expiry/integrity, row validation and database uniqueness. Exact CSV quoting/BOM/header behavior, preview binding and safe result schema remain API implementation contracts. Preview possession is not authorization.

Exact already-present tokens are no-ops, never an instruction to replace assignment or status. If another Admin imports an identical token after preview, it becomes an unchanged skipped token at commit. Other invalid rows and intra-file duplicates still reject the batch without partial insertion. New Cards, required creation/import history and minimized mutation audit commit atomically. Effectful import retry/result storage must follow Q43 once its remaining details are defined. An Excel export is not a complete database backup because it omits identity, content, object storage and lifecycle history.

Supabase PostgreSQL, UUIDs, versioned Supabase SQL migrations and separate staging/production are accepted choices, not deployed repository facts. Apply reviewed migrations to staging before production and test them. Exact release/restore gates belong to Architecture. Migrations cannot rewrite printed tokens, release aliases or discard required lifecycle references. Apply accepted retention rules before any future destructive migration. This documentation task creates no migration code, service or deployment.

## Retention and security dependencies

Q24 requires individual provisioned Supabase email/password Admin accounts with mandatory TOTP MFA and no public signup. Q36 requires server-enforced 8-hour absolute and 30-minute idle expiry, current membership on every privileged request and TOTP within 5 minutes for reassignment, Business enable, payment-link and Admin-permission changes. Trusted operators handle bootstrap/MFA recovery with out-of-band verification and audit. Actual feasibility and enforcement remain unverified.

Q37 requires identity-scoped management clients, current verified Admin membership/MFA, RLS/limited grants and same-Business child constraints. Deny anonymous management-table access. Public reads use a restricted projection, never Admin identities, inventory/history/audit, raw storage paths or unpublished content. Server-only privileged keys need explicit scope checks; cookie-authenticated mutations need CSRF protection. Admin manages all Businesses, but mismatched child/Business references remain invalid.

Q26 allows JPEG/PNG/WebP only, at most 2 MiB and 16 megapixels, with decode/re-encode and metadata stripping; reject SVG and animation. Private current-reference delivery implements Q34. The decoder, direct Storage access, shared-cache ordering and fresh gate must be verified on the selected runtime.

Q39 requires login/recovery 10 attempts per 15 minutes using account and trusted-IP controls, MFA 5 per 10 minutes, and per Admin mutations 120 per 10 minutes, uploads 20 per 10 minutes and imports 5 per hour. Public routes use volumetric protection without a low blanket visitor quota. Numerical policies are accepted; throttle storage and trusted-proxy enforcement remain implementation contracts.

| Record class | Accepted retention |
| --- | --- |
| Minimal append-only successful Card history | Permanent Card lifetime, Admin-only |
| Minimized routine Admin audit | 90 days |
| Redacted operational errors | 14 days |
| Raw import files and unused temporary uploads | 24 hours |
| Import preview validity | 30 minutes; distinct from file retention |
| Idempotency records and replaced image objects | Exact durations unfinished; do not infer from another class |

Business Disable retains stored content, Card assignments, reserved slugs and history; it is not erasure. No scan-event retention applies because product analytics are excluded. Required mutation audit is atomic; rejected attempts remain routine audit, not successful history. Exact rejected-attempt logging/error behavior and expiry execution remain unfinished without changing accepted mutation atomicity.

Q41 minimizes application errors to request ID, route template and redacted errors. Do not retain Visitor identifiers, IPs, full public tokens, queries, bodies, credentials or tracking. Restrict operator access. Provider-native log/Auth/Storage/backup content, periods, deletion and restore reconciliation require account-specific prelaunch review. Application expiry does not prove deletion from backups. Restore must cover relational data and private image objects and reconcile revoked access, removed content, versions, history/audit and current references before public reopening. No backup schedule, RPO/RTO or provider plan capability is claimed.

## Genuine open gates and implementation contracts

These are not stale unanswered policies. No genuinely new database human choice is submitted in this round.

| Key | Classification | Required follow-through |
| --- | --- | --- |
| `architecture.workers-adapter` | Deferred gate | Choose vinext/OpenNext only after actual project compatibility tests on a pinned framework/runtime/adapter combination |
| `architecture.operational-targets` | Deferred gate | Before launch decide and verify budget, SLA, latency, region, recovery time and acceptable data loss against actual provider plans |
| `security.privacy-data-minimization.provider-review` | Deferred gate | Account-verify provider-native logs/Auth/Storage/backups, contents, retention, permissions, deletion and restore reconciliation |
| `security.enforcement-verification` | Deferred gate | Verify session/MFA/current membership, grants/RLS/restricted projection, CSRF, rate limits, decoder, fresh eligibility/current-image delivery and cache/HTTP ordering |
| `database.legacy-token-inventory` | Fact | Inventory/sample absent; inspect actual printed tokens before validating their grammar/URL compatibility, without regeneration |
| `database.public-token-policy` | Implementation detail | At least 128-bit cryptorandom new tokens and exact legacy preservation are settled; encoding, length, collation/case and URL parsing are not |
| `database.content-shape` | Implementation detail | Define physical columns/constraints, registry, settings schemas/versioning, same-Business link membership, supported link-bearing types, deterministic order and concurrent count enforcement |
| `database.activation-timestamps` | Implementation detail | Define initial/latest activation summary semantics, timezone/precision and history event null representation without adding lifecycle policy |
| `database.publication-revision` | Implementation detail | Define write-version/content-revision mapping, increment scope and coherent same-revision projection/read-retry mechanism |
| `database.history-audit-schema` | Implementation detail | Define minimal actor/reference/event schema, identity-change handling, append-only controls, rejected-attempt behavior and accepted expiry execution |
| `api.idempotency-record-contract` | Implementation detail | Define key-retention duration, scope/payload binding, authorized replay, durable original result, concurrent retries and crash/expiry behavior; Q43 policy is settled |
| `api.persistence-contracts` | Implementation detail | Define cursor bounds/sorting, complete payload/field-error schemas, public status/alias redirect rules, slug normalization, CSV parsing/preview integrity and truthful committed mutation results |
| `database.image-reference-workflow` | Implementation detail | Define private immutable object/reference workflow, replacement/removal, cleanup duration/execution, orphan/crash/retry handling and post-commit response semantics |
| `security.content-schema-details` | Implementation detail | Define Unicode counting, contact/label normalization, settings byte/schema rules, hours timezone/overnight/overlap representation and combined JSON-body limit |
| `architecture.migration-restore-procedure` | Implementation detail | Define tested promotion, backup/restore coverage and revoked-access/reference reconciliation; no operational numbers invented |

All four peer checks below are incomplete for current-candidate consistency. They are not decision blockers: this candidate follows the verified ledger and exposes the checked peers' stale text rather than inventing missing answers. Root must preserve these findings, check the final candidate revisions and append its plain peer-check record before freezing approval hashes.

## Inline decision records

Internal UUIDs keep database identity independent of printed Card IDs. The user chose them over smaller bigint keys. The trade-off is larger keys/indexes while imports do not depend on a shared numeric sequence. UUIDs grant no authorization.

Atomic safe imports favor predictable inventory changes over accepting the valid portion of a flawed file. The user rejected partial valid-row import. Preview and existing-token no-ops allow rerunning an inventory file without changing a live Card. CSV limits and validation policy are accepted; detailed parsing/replay contracts remain unfinished.

Reserved slug aliases preserve shared Business URLs after renames. The user chose redirect-and-reserve instead of releasing old slugs. Retaining an ever-growing set of names prevents an old customer link from silently reaching another Business. Printed Card IDs remain independent of every slug.

The user rejected a dormant owner-account link for the Admin-only launch. The schema does not pretend that a Business is owned by an application user. Future owner self-service needs explicit cardinality, identity and permission decisions before migration.

Expected versions reject stale edits rather than silently overwriting another Admin. Atomic audit/history prevents unattributed successful changes, at the cost of rejecting mutations when those writes fail. Lifetime minimal Card history remains separate from expiring routine audit and deferred analytics.

Revision-keyed content caching plus fresh eligibility avoids depending on global purge for publication or revocation. It costs authoritative reads on each new request and fails closed during eligibility outages. It cannot recall copies already delivered. Private image delivery applies the same current-state principle; PostgreSQL and object storage still do not share a transaction.

## Cross-document consistency

One bounded cross-read covered all five documents and all five original reports. Hashes before and after the peer reads were identical. Each peer received one consolidated evidence-backed message; live deliveries to Product/Architecture and queued sends to Flows/Security are transport evidence only. Product and Architecture sent policy-alignment notes, not human decisions or approval; those notes do not verify rewritten candidate bytes. No second cross-read or waiting loop was performed.

| Checked document | SHA-256 read before and after | Outcome and evidence |
| --- | --- | --- |
| [PRODUCT_SPEC.md](PRODUCT_SPEC.md) | `79656d86d686b014436461928c6122a5bbe7b0844a0d2d74e5730f61bbd8eb7a` | Incomplete. Scope, vocabulary, cardinality and lifecycle largely align. Checked lines 53/83/177/180 still call history retention and independent activation unsettled; Q32/Q35 settle them. Product's later alignment message did not include candidate bytes/hash for this read |
| [ARCHITECTURE.md](ARCHITECTURE.md) | `424aacc36e1704547043e6fba004cd1eae03a6580c5b7a9959962a4458915fd8` | Incomplete. UUID/lifecycle/security/image boundaries align. Checked lines 65-71/99/137 still call Q46/Q47 pending. Atomic content revision and prelaunch numeric deferral are accepted. Architecture acknowledged version/revision separation and coherent loading, but its candidate was not re-read |
| [FLOWS_AND_API.md](FLOWS_AND_API.md) | `23d970e19053fb8a92a7b7507af10f7a319e03fcb219a016eb18072a486b0f44` | Incomplete. Core lifecycle, history, import and concurrency align. Checked lines 145/200/236/277/281-290 still call Q42-45 and Q47 pending. Explicit commands, keys+versions, status map, cursors and revision cache are settled; key duration and payload/public response details are not. Consolidated send was queued; no reply/candidate verification recorded |
| [SECURITY_AND_EDGE_CASES.md](SECURITY_AND_EDGE_CASES.md) | `456608dcc3d03e4dda5e6483051249367c9e1ca00d9375fd7691777831e641bf` | Incomplete. Auth, RLS, lifetime history, atomic audit, retention, bounds and fresh private-image gate align. Checked lines 185-186 still describe architecture cache/API retry policies as unanswered; Q43/Q46/Q47 settle policy but not implementation details. Consolidated send was queued; no reply/candidate verification recorded |

All local Markdown links in this document resolve to files read during this review. No fragment links or anchor targets are used. Vision section citations were checked against the complete source, and ledger keys/results were checked against all 47 entries. Q9 answer/trailing space and separate parent interpretation were also checked at transcript lines 140/143; Q31-34 at line 224 and Q46-47 at line 340. This is source/crosslink review, not implementation verification.

## Candidate approval boundary

This candidate remains Draft. Root owns durable prompts and the final exact-hash approval record. After its plain peer-check record is appended, root must compute the frozen Draft hash and the expected hash for one status-only change before presenting scoped approval. The only predeclared change is replacement of the sole status line with `Status: Approved. Documentation only; no implementation is authorized.` No material postapproval rewrite is permitted, and document approval never authorizes implementation or waives the listed gates.

## Recovery peer-check record

- docs/PRODUCT_SPEC.md: incomplete; incomplete, checked hash is stale. Full bounded read bracketed by identical document_hashes. Scope/vocabulary/cardinality/lifecycle align except stale lines53/83/177/180 on Q32/Q35. One consolidated send delivered. Product alignment note does not verify rewritten bytes/hash; no consent inferred. Root current-candidate check needed.
- docs/ARCHITECTURE.md: incomplete; incomplete, checked hash is stale. Full bounded read bracketed by identical document_hashes. UUID/lifecycle/security/private-image/non-atomic Storage boundaries align. Lines65-71/99/137 still call Q46/Q47 pending. Consolidated send delivered; peer acknowledged version!=revision absent mapping and coherent loading. No rewritten candidate reread; root check incomplete.
- docs/FLOWS_AND_API.md: incomplete; incomplete, checked hash is stale. Full bounded read bracketed by identical document_hashes. Core lifecycle/history/import/concurrency align. Lines145/200/236/277/281-290 retain stale Q42-45/Q47 and candidate delivery.pending semantics. Policy applied in DB; key duration/public statuses/schema remain contracts. Consolidated send queued, no reply/candidate reread; never consent.
- docs/SECURITY_AND_EDGE_CASES.md: incomplete; incomplete, checked hash is stale. Full bounded read bracketed by identical document_hashes. Auth/RLS/lifetime history/atomic audit/retention/bounds/fresh image gate align. Lines185-186 retain stale Q43/Q46/Q47 unanswered claims; encoding/sample/normalization/provider gates genuinely unfinished. Consolidated send queued, no reply/candidate reread; no approval inferred.
