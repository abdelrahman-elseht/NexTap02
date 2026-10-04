# NexTap product specification

Status: Draft. Documentation only; no implementation is authorized.

## Evidence and precedence

This English-language document derives product intent from [vision.md](vision.md) and reconciles the [accepted-decision ledger](../.atomic/recovery/accepted-decisions.json), Q1 to Q47. Actual parent-chat answers override conflicting vision passages and stale owner artifacts. The ledger records no document approvals. Peer messages and silence do not supply policy or approval evidence.

The [unanswered inventory](../.atomic/recovery/unanswered-batches.json) contains no complete unanswered original question batches. The continuation [actual-answer file](../.atomic/workflows/runs/vision-docs-continuation/5c5087c4-cc46-4444-b870-670018f926b6/new-answers.json) contains no additional answers. The [source manifest](../.atomic/workflows/runs/vision-docs-continuation/5c5087c4-cc46-4444-b870-670018f926b6/sources.json) identifies the retained sources. Original artifacts preserve history; their stale pending entries do not reopen answered choices.

The current file inventory contains the vision, two visual assets, five document drafts and documentation files under `.atomic/`. No application source, package manifest, migrations or inventory workbook appeared in that inventory. Earlier owner reports record ancestor instruction/glossary inspection; this reconciliation did not repeat that ancestor search. The setup record describes documentation ownership, not existing application behavior. No runtime behavior or provider configuration was verified.

Source requirements, accepted user decisions, observed repository facts and proposals remain distinct. Genuine accepted deferrals and unfinished implementation contracts remain listed below.

## Product goal

NexTap lets a business distribute a physical NFC/QR card that opens its public mini landing page under `nextap.services`. The printed identifier remains valid when the business changes its name, page content or design. The product is a digital business card platform with a mini landing page. Sources: vision §§1 to 5, 36, 38, 46.

## Source requirements

- Every physical card has a permanent, unique, nonsequential public Card ID. NFC and QR encode `https://nextap.services/c/{Card ID}`. Internal IDs may differ. Sources: §§3 to 5, 22.
- A Card is assigned to at most one Business at a time; one Business can have multiple Cards. Unassigned cards exist before sale. Sources: §§3, 19.
- Admin imports existing card identifiers, creates Businesses, assigns and activates Cards, and manages content. Cards start Inactive. Eligible Active Cards open their assigned Business page; known Inactive Cards show the source-defined activation-pending notice. Sources: §§3, 14, 15, 21, 31, 33, qualified by the accepted publication rules.
- Each Business has its own content boundary in one shared platform. Sections and Links can be enabled or disabled and ordered. Sources: §§6, 9 to 12, 27.
- Page capabilities include business name and description, contact details, social links, payment destinations, maps/address, hours, a reviews destination and custom links. Images use Logo and Cover slots. Sources: §§7 to 13, 35 to 37.
- The vision permits external payment navigation or supplied payment details. The accepted release narrows this to external URLs only. NexTap does not collect funds, process transactions or confirm payment. Sources: §§7, 36; Q16.
- The MVP Google Reviews capability opens the Business's Google page. Automated ratings are a later integration. Source: §35.
- Mobile responsiveness, simple ordering and cached public delivery are intended. Drag-and-drop, full site building, complex infrastructure and heavy analytics are excluded from launch scope. Sources: §§13, 23 to 25, 37, 38.

## Actors and release scope

The Visitor opens public URLs without a management account. NexTap Admin is the only authenticated release role and creates Businesses, manages inventory and edits all page content. Business Owner login and the separate owner dashboard are deferred. This accepted decision resolves the contradiction between vision §15 and §§13, 32, 37 in favor of an Admin-managed launch.

The launch includes an independent `https://nextap.services/b/{slug}` sharing URL alongside each permanent Card URL. When a slug changes, old slugs remain reserved aliases that redirect to the same Business. Another Business cannot claim them. Disabling the Business blocks the canonical route and every alias. Printed QR/NFC destinations remain unchanged.

Product analytics are deferred. Version one has no product scan counters, click counters or Visitor event collection. Operational error monitoring does not authorize product analytics or new Visitor-data retention.

No Business Owner account link exists in the version-one Business model. NexTap Admin is the operator of the platform. Future owner-account support needs a separately decided migration.

## Accepted lifecycle and publication rules

Card state and Business state are separate. A Card is Inactive or Active; a Business is Disabled or Enabled. An assigned Card may become Active while its Business is Disabled. Its public route can show Business content only when the Card is Active, assigned to that Business, and the Business is Enabled. An Enabled Business can be reached independently through its canonical or historical Business URL; deactivating one Card does not disable the Business or its other Cards.

| Admin action | Accepted outcome |
| --- | --- |
| Deactivate Card | Set Inactive, preserve its Business assignment |
| Assign or reassign Card | Allowed only while Inactive; one current Business; Card remains Inactive |
| Activate Card | Separate action after assignment, permitted while the Business is Disabled; permanent Card ID is unchanged |
| Unassign Card | Make Inactive and clear the assignment |
| Create Business | Create Disabled; content is not public yet |
| Enable Business | Explicit Admin action makes its current page available |
| Save content of Enabled Business | Commit content and increment its representation revision atomically; new requests read current eligibility and revision before selecting content |
| Disable Business | Block Card, canonical Business and alias routes without modifying Card state or assignment |

Version one has no Card deletion, Card ID reuse or Business hard-delete action. The selected transfer sequence is Deactivate, reassign while Inactive, then Activate. Moving an Active Card directly is excluded.

Card history is required from day one. The simple UI is a read-only, Admin-only timeline for each Card. It records creation or import and successful Assign/reassign, Activate, Deactivate and Unassign operations only when state or assignment actually changes. Each entry contains actor UUID, time and old/new Business and status. Minimal history is append-only and retained for the permanent Card's lifetime. It excludes copied actor emails, IPs, scans, clicks and full content snapshots. Rejected attempts belong to separate security audit. This operational history is distinct from deferred product analytics.

Initial Business enablement requires a nonempty name and unique slug. Contact details, Links, hours, location, Logo and Cover are optional. The selected minimum permits a simple name-only page; Admin decides whether the content is useful enough to enable.

Every new Card, Business and alias request checks current authoritative eligibility before using cached content. Unknown eligibility returns unavailable. New image delivery also checks an Enabled Business and its current image reference. Responses already authorized or in flight, and copies already downloaded or browser-cached, cannot be recalled.

Content saves atomically advance the Business representation revision. A new request reads fresh eligibility and revision, then uses cached public content keyed by Business and revision. On a miss it loads current content. A cache-write failure does not fail an otherwise valid read, and publication does not depend on a successful global purge. Coherent read/response ordering remains an implementation contract, without an invented timing guarantee.

## Accepted page capabilities

| Capability | Version-one contract |
| --- | --- |
| Sections | At most one of each built-in type: Hero, Contact, Social, Payments, Location, Hours, Reviews and Custom Links. Admin can show, hide and reorder Sections. |
| Contact | Public phone, WhatsApp and email fields are the single source of truth. Contact buttons derive from them; generic Links cannot create competing contact buttons. |
| Images | At most one Logo and one Cover. Both are optional, including at initial enablement. |
| Hours | Seven-day weekly schedule with a Business timezone. Each day is closed or has one or more opening intervals. Holiday calendars and calculated open-now indicators are excluded. |
| Payments | External payment URL destinations only. No copyable wallet identifiers, payment processing or payment verification. |
| Reviews | Configured external Google Reviews destination; no synchronized ratings or review counts. |
| Generic Links | Add, edit, delete, enable, disable and simple ordering. Each Link belongs to exactly one supported link-bearing Section and appears once when active within a visible Section. Repeated platform destinations are allowed with distinct labels; Contact buttons remain derived from fields. |

The Card URL renders the public page directly when eligible. Canonical and historical Business routes remain separate ways to share the same Business. This accepted route choice preserves the Card URL's independence from slug changes.

## Accepted companion constraints

The selected stack is one Next.js application with Supabase PostgreSQL, Auth and Storage, hosted on Cloudflare Workers. Internal UUID identifiers are separate from printed Card IDs. [ARCHITECTURE.md](ARCHITECTURE.md) owns deployment and compatibility verification; [DATABASE.md](DATABASE.md) owns persistence details. Provider selection does not establish deployed services.

The vinext/OpenNext adapter choice is deferred to actual project compatibility checks before implementation. Staging and production use separate Workers and Supabase services. Reviewed, versioned Supabase SQL migrations must be tested before production; undocumented dashboard-only schema changes are excluded.

Inventory upload accepts UTF-8 CSV exported from Excel, with `card_id` and optional `status` that may only request Inactive. Preserve printed Card IDs exactly. Admin previews the import before an atomic safe batch. Invalid rows or duplicates within the file reject the whole batch. Existing Card IDs are skipped without changing assignment or status; new Cards enter Inactive and unassigned. File upload cannot activate them. CSV input is limited to 10,000 rows and 10 MiB; preview validity is 30 minutes. The actual legacy token formats remain unverified because no inventory workbook/sample is present.

Admin management uses a private HTTP/JSON API under `/api/admin` with internal UUID resource references. Lifecycle actions use explicit POST commands, business fields use PATCH, and complete Section/Link order lists use PUT. Admin errors use `{error:{code,message,fieldErrors?,requestId}}`, with stable safe codes and UI-owned translation. Lists use opaque cursors, bounded limits and stable sorting with `nextCursor`. [FLOWS_AND_API.md](FLOWS_AND_API.md) owns endpoint and payload refinements.

Effectful commands require `Idempotency-Key`, and edits require the version originally read by the editor. A repeat key with the same payload returns the original result; a different payload is rejected. Stale writes make no changes. Idempotency-key retention duration remains an explicitly unfinished contract. Accepted status classes are 401 missing session, 403 forbidden, 404 missing or non-disclosed resource, 409 version/lifecycle conflict, 422 semantic validation, 429 rate limit and 503 unavailable dependency. Public lifecycle distinctions remain unfinished and must preserve the safe Inactive-card notice without exposing assignment, history or Admin data.

Successful administrative data mutations commit minimized audit metadata atomically with their data. Successful Card changes also commit required history in the same transaction. Required audit/history failure rejects the mutation. Cache or image-delivery failure after database commit cannot be reported as a database rollback.

Admin access uses individual provisioned Supabase email/password accounts with mandatory TOTP MFA and no public signup. Server-enforced sessions expire after 8 hours absolute or 30 minutes idle. Reassignment, Business enablement, payment-link and Admin-permission changes require TOTP within 5 minutes. Every privileged request verifies current Admin membership. Trusted operators perform bootstrap/MFA recovery with out-of-band verification and audit. Actual enforcement remains a verification gate.

Management uses verified identity-scoped clients, restrictive grants/RLS and same-Business child constraints. Anonymous management-table access is denied. Public reads use a restricted projection; server-only privileged credentials require explicit scope checks. Cookie-authenticated mutations need CSRF protection, and management/session responses cannot enter shared public caches.

New Card IDs require at least 128 cryptographically random bits. Existing printed Card IDs remain exact public routing identifiers and grant no permissions. Images accept JPEG, PNG or WebP up to 2 MiB and 16 megapixels, with decode/re-encode and metadata stripping; SVG and animation are rejected. Storage is private. Application-mediated delivery checks current Business eligibility and the current Logo/Cover reference before serving an image. Disable or replacement stops new access through old URLs.

Business text is plain text. Web destinations use HTTPS without embedded credentials; validated contact fields generate contact actions. Scripts, HTML and arbitrary server-side URL fetching are excluded. Accepted maxima are name 120, description 1000, label 80 and URL 2048 characters, 50 Links per Business, and 8 KiB settings per Section. Registered Section/icon schemas require validation before persistence.

Per Admin, mutation limits are 120 per 10 minutes, uploads 20 per 10 minutes and imports 5 per hour. Login/recovery uses account and trusted-IP controls with 10 attempts per 15 minutes; MFA permits 5 attempts per 10 minutes. Exhaustion returns stable 429 errors and retry guidance. Public routes use volumetric protection without a low blanket Visitor quota.

Routine minimized Admin audit metadata lasts 90 days, operational errors 14 days, and raw imports/unused temporary uploads 24 hours. Card history lasts for the permanent Card's lifetime. Application errors retain request IDs, route templates and redacted errors, without Visitor identifiers/IPs, full public tokens, queries, bodies or secrets. Provider-native logs/backups require a separate prelaunch review. [SECURITY_AND_EDGE_CASES.md](SECURITY_AND_EDGE_CASES.md) owns enforcement, exposure and retention details.

## Candidate acceptance criteria

These criteria derive from the vision and actual accepted decisions. They describe required capabilities; technical tests belong to the companion documents and have not run.

1. Updating an assigned Business's name, Links or Section configuration does not require replacing its printed QR or NFC URL.
2. Two eligible Active Cards assigned to the same Enabled Business open that Business; one Card cannot resolve to two Businesses simultaneously.
3. A known Inactive Card never exposes its assigned Business through its Card URL. Its page states that the Card is not activated.
4. Admin can register or import Card IDs and assign and activate an existing Card for a Business.
5. Visible Sections and active Links appear in configured order. Hidden content does not appear on the public page.
6. Page management supports the optional Logo and Cover slots.
7. A payment button opens the configured external destination; NexTap never reports payment success or moves funds.
8. A reviews button opens the configured Google destination without automatic rating synchronization.
9. A Visitor can use the public page on a mobile viewport without signing into a management account.
10. NexTap Admin is the only authenticated release role; Business Owner login and self-service dashboard are excluded.
11. A Business has an independent `/b/{slug}` sharing route while its Cards retain their permanent `/c/{Card ID}` routes.
12. Version one does not collect product scan/click events or display product visit counters.
13. Inventory import previews its result, rejects invalid batches without partial mutation, leaves existing Cards unchanged, and inserts only Inactive unassigned new Cards within the accepted CSV bounds.
14. Admin transfers a Card only after deactivation; reassignment does not activate it automatically, and Unassign clears its assignment while making it Inactive.
15. New Businesses are private until explicitly Enabled. Disable blocks every public route and alias without changing assigned Card state.
16. Old slugs lead to the same Business, remain reserved and cannot be reassigned to another Business.
17. Creation/import and actual successful Card lifecycle changes appear in an Admin-only read-only timeline with actor UUID, time and old/new assignment/status. Minimal append-only history lasts for the permanent Card's lifetime.
18. Each built-in Section type appears at most once; Admin can enable, disable and order it using simple controls.
19. Hours represent seven days using closed days or one or more opening intervals and a Business timezone, without holiday or open-now features.
20. Contact actions derive from authoritative public contact fields. A generic Link cannot override a Contact button with a competing value.
21. Payment items have external URL destinations only, without copyable payment identifiers or financial transaction status.
22. Admin can enable a Business with a nonempty name and unique slug without requiring contact details, Links, hours, location or images.
23. Every generic Link has one supported link-bearing Section and one public placement when visible. Multiple destinations of one platform can coexist with distinct labels.
24. Admin may activate an assigned Card while its Business is Disabled. Public content stays blocked until that Business is Enabled.
25. New public and image requests check current eligibility and current references before cache reuse. Unknown eligibility fails closed; already delivered or in-flight copies cannot be recalled.
26. Content saves atomically advance the Business revision; new requests select current revision-keyed content without depending on global purge success.
27. Stale Admin writes make no changes. Successful changes commit required audit/history with their data; post-commit delivery failure does not imply rollback.

Unspecified limits, timings and detailed response schemas remain unfinished contracts below. No numeric SLA or recovery target is implied.

## Canonical vocabulary

These terms follow the vision and accepted lifecycle rules. They describe business concepts.

**Business**: The activity or organization represented by one NexTap public page. Avoid account, website or customer when the Business is meant.

**Card**: A physical NexTap card with one permanent public identity and an optional current Business assignment. Avoid profile or Business.

**Card ID**: The permanent public identifier printed or encoded on a Card. Avoid internal database ID or slug. Database's term Card public token refers to the same public identifier.

**Assignment**: The current association between a Card and one Business. Avoid activation when only the association is meant.

**Activation**: Changing an assigned Card to Active. Public access also requires an Enabled Business. Avoid Assignment or Business enablement.

**Public business page**: The Business's mini landing page visible to Visitors. Avoid full website or Card when the page is meant.

**Section**: A supported configurable content group on a public business page. Avoid template when a content group is meant.

**Link**: A Business-controlled external destination shown in one supported link-bearing Section. Avoid payment transaction when a payment destination is meant.

**NexTap Admin**: A platform operator who manages Cards, Businesses and content. Avoid Business Owner.

**Business Owner**: The person responsible for a Business. Business Owner login is deferred; a Business is not an owner account.

**Visitor**: A person opening public NexTap URLs without management privileges. Avoid User when it implies a login.

**Inactive Card**: A Card whose public route does not open its assigned Business page. An Inactive Card may still have an Assignment.

**Enabled Business**: A Business whose public page is available through its Business URLs and eligible Active Cards. Avoid Active Card when the Business's publication state is meant.

**Card history**: The minimal successful operational lifecycle timeline retained for a Card's lifetime. Avoid scan analytics, Visitor tracking or routine security audit.

**Business slug**: The readable name in a Business sharing URL. Avoid Card ID or Business identity.

**Slug alias**: A reserved former Business slug that still leads to the same Business. Avoid reassigned name or printed Card ID.

## Inline decision records

### Admin-managed launch

Accepted under `foundation.release-actors` and `foundation.ownership`. Vision §15 limits the initial role to NexTap Admin while other passages describe owner self-service. The user selected an Admin-managed launch without owner-account links. The alternatives were launching both roles and retaining an optional dormant owner link. Owner self-service needs a separately decided later migration.

### Independent Business sharing URL

Accepted under `foundation.release-options.slug` and `foundation.slug-history`. The user selected `/b/{slug}` sharing alongside permanent Card URLs and redirect-and-reserve for former slugs. This preserves already-shared Business links at the cost of retaining aliases and never assigning those names to another Business. The alternatives were stopping old links with reservation and allowing reuse.

### Scope selections

`foundation.doc-language` selects English for all five documents. `foundation.release-options.analytics` defers product analytics instead of adding a counter or basic events. The permanent Card ID requirement comes from the vision. Exact selections and result references are in the accepted-decision ledger.

### Transfer safety and operational history

Q9's exact custom answer and the parent's separately attributed interpretation are preserved here. The answer string includes its trailing space inside the quotation marks. Evidence is ledger `foundation.card-lifecycle`, source `[140,0]`; parent interpretation is separately recorded at transcript line 143.

```json
{
  "answer": "1 , store the history from day one with simple ui ",
  "parentInterpretation": "Option 1 plus mandatory operational Card history from day one with simple UI; separate from deferred analytics."
}
```

The accepted transfer requires deactivation, reassignment while Inactive and separate activation. It adds operator steps and temporary unavailability. Q28 selected actual successful lifecycle events in a read-only Admin timeline; Q35 selected minimal append-only Card-lifetime retention. Routine audit expiry does not delete Card history. Q32 permits preparation through activation while the Business remains Disabled.

### Publication control and cached content

`foundation.business-publication` creates Businesses Disabled and requires explicit first enablement. Later saves publish without a separate draft workflow. Disable gates all Business routes while preserving Card state/assignments. `architecture.content-cache` selects atomic content/revision saves, fresh eligibility/revision reads and Business-plus-revision cached content. This avoids global-purge dependence while retaining an authoritative lookup on new requests. The coherent projection and delivery implementation still require verification.

## Deferred gates and unfinished contracts

These items remain part of the candidate. They are not permission to reask settled policies or to invent technical defaults.

| Key | Kind | Remaining requirement |
| --- | --- | --- |
| architecture.workers-adapter | Deferred gate | Choose vinext/OpenNext only after actual project compatibility checks. Verify the selected framework/runtime, auth/session enforcement, private image decoding/delivery and cache ordering. |
| architecture.operational-targets | Deferred gate | Q46 defers budget, SLA, latency, region, recovery time and acceptable data loss to mandatory prelaunch decisions verified against provider plans. No numeric targets are selected. |
| security.privacy-data-minimization.provider-review | Deferred gate | Before launch verify provider-native logs/backups, actual contents/retention, operator access, deletion and restore reconciliation. Application periods do not establish provider deletion. |
| database.public-token-policy | Implementation detail | Define new-token encoding/grammar without reducing accepted entropy; preserve printed legacy tokens exactly. |
| database.legacy-token-sample | Fact | Actual legacy inventory evidence is absent; printed-token grammar/entropy has not been verified. |
| database.content-shape | Implementation detail | Define physical schema, slug normalization/registry, Section settings/icon schemas, contact normalization, weekly-hours overnight/overlap handling, image metadata and activation timestamp semantics. Accepted cardinalities and policies remain binding. |
| database.publication-revision | Implementation detail | Specify version/revision relationships, coherent restricted projections and transactional revision/audit/history behavior. Revision/cache policy and expected-version rejection are already settled. |
| api.contract-details | Implementation detail | Complete payload/error schemas, public lifecycle and alias status/disclosure/cache behavior, pagination bounds, no-op results, CSV parsing/preview integrity, image completion/cleanup and truthful committed mutation results. |
| api.idempotency-key-retention | Implementation detail | Define key retention duration and durable replay/expiry behavior. Q43 selected keys plus versions but explicitly left duration unfinished. |
| security.content-schema-details | Implementation detail | Define combined JSON byte ceiling, Unicode counting, exact contact normalization and registered settings fields within accepted bounds. |
| architecture.storage-and-restore | Implementation detail | Define cross-system object-reference cleanup, backup/restore coverage and reconciliation before public reopening. Database and object storage do not share a transaction. Verify selected recovery targets before launch. |
| peer.product.architecture | Peer check | Checked stale Architecture snapshot still calls Q46/Q47 pending. Its hash later changed; revised content was not reread in the bounded check. |
| peer.product.database | Peer check | Checked stale Database snapshot still calls settled history, cardinality, concurrency, retention, activation and revision policy pending; candidate reconciliation and its final hash have not been checked. |
| peer.product.flows-and-api | Peer check | Checked stale API snapshot still calls Q42 to Q45 pending and describes revision/delivery proposals; candidate reconciliation and its final hash have not been checked. |
| peer.product.security-and-edge-cases | Peer check | Checked Security snapshot follows settled exposure/history policies but calls ordinary freshness and retry policy unanswered. Q43/Q47 settle those policies; remaining details and the candidate's final hash have not been checked. |

No genuinely new Product-owned human choice was identified. Future owner-account support and analytics are deferred features; this document does not design their implementation.

## Bounded consistency review

One bounded cross-read covered all five documents and all available original owner reports. Before and after hashes matched for the four peer documents below. The check covered scope, vocabulary, cardinality, lifecycle, API/persistence/security/cache contracts and local Markdown links. The current Product candidate applies actual ledger answers where the checked snapshots were stale.

| Peer document | Content-checked SHA-256 | Outcome and limitation |
| --- | --- | --- |
| ARCHITECTURE.md | `424aacc36e1704547043e6fba004cd1eae03a6580c5b7a9959962a4458915fd8` | Incomplete. Scope/lifecycle/content/security align; Q46/Q47 stale pending text conflicts with ledger. Revised candidate not checked. |
| DATABASE.md | `904ecbb0c3633b1dcb8ef97ba55b5ada0384f92d52e51aae94923bacc3ed32b5` | Incomplete. Core relationships align; settled policies still called open in the checked snapshot. Physical schema/token/timestamp contracts remain unfinished. Revised candidate not checked. |
| FLOWS_AND_API.md | `23d970e19053fb8a92a7b7507af10f7a319e03fcb219a016eb18072a486b0f44` | Incomplete. Journeys/security/cardinality align; Q42 to Q45 and revision/mutation language lag the ledger. Revised candidate not checked. |
| SECURITY_AND_EDGE_CASES.md | `456608dcc3d03e4dda5e6483051249367c9e1ca00d9375fd7691777831e641bf` | Incomplete. Scope/exposure/history align; cache and API retry dependency wording lags Q43/Q47. Revised candidate not checked. |

A later hash-only observation during Product readback found Architecture at `1a57cf9917e6780e29e343843359ebe7afc581f3e8c312fc63cc87fc926cdd70`. Its revised content was not reread, so the older content check cannot establish consistency for that revision. The other three peer hashes were unchanged in that observation. These are observations, not frozen approval hashes; the root must record the final check state.

One consolidated note was sent per peer through discovered Intercom stage targets. Architecture and Database were live; API and Security messages were queued for their pending stages. Transport success, acknowledgments and missing replies are not consent. Architecture and Database reported the same stale Product snapshot; this candidate repairs the cited Q32/Q35 issues. Their messages do not verify this revised file. No continuation owner reports were available during the bounded inventory read.

All linked local files in this document were read, and local links in the five checked documents resolved to existing files. No local link contained an anchor, so no anchor target required validation. Numbered vision references were checked against the full source. This review verifies source/crosslink consistency only; it does not verify implementation or later peer content.

## Approval boundary

The candidate remains Draft. The root records the final plain peer-check state before freezing approval hashes and presents any scoped approval in the parent chat. Approval for this document must name the exact precomputed replacement of `Status: Draft. Documentation only; no implementation is authorized.` with `Status: Approved. Documentation only; no implementation is authorized.` That one-line change does not authorize implementation. No material postapproval rewrite is permitted; unresolved gates and incomplete peer checks remain visible.

## Companion documents

[Architecture](ARCHITECTURE.md), [Database](DATABASE.md), [Flows and API](FLOWS_AND_API.md), and [Security and edge cases](SECURITY_AND_EDGE_CASES.md) own the adjacent deployment, persistence, transport and security contracts.

## Recovery peer-check record

- docs/ARCHITECTURE.md: incomplete; checked hash is current. Latest hash-only observation. Full read was at 424aacc36e1704547043e6fba004cd1eae03a6580c5b7a9959962a4458915fd8, unchanged before/after. Scope/vocabulary/cardinality/lifecycle/API/persistence/security align there, but Q46/Q47 pending text conflicts with ledger. Latest content not read. One consolidated note sent; acknowledgment verifies neither revised candidate.
- docs/DATABASE.md: incomplete; incomplete, checked hash is stale. Full bounded read, matching before/after hashes and later unchanged. Relationships/shared scope align; settled history/cardinality/concurrency/retention/activation/revision still called open. Physical schema/token/timestamp contracts remain genuine. One consolidated note sent; revised candidate not read; acknowledgment is not approval.
- docs/FLOWS_AND_API.md: incomplete; incomplete, checked hash is stale. Full bounded read, matching before/after hashes and later unchanged. Journeys/cardinality/lifecycle/security align; Q42 to Q45 pending claims and revision/delivery text lag ledger. Payload/status/replay details remain unfinished. One consolidated note queued to discovered pending stage; revised candidate not read; no consent inferred.
- docs/SECURITY_AND_EDGE_CASES.md: incomplete; incomplete, checked hash is stale. Full bounded read, matching before/after hashes and later unchanged. Scope/lifecycle/exposure/image/history/retention align. Ordinary-content freshness and retry-policy wording lag Q43/Q47; provider/runtime/schema gates remain genuine. One consolidated note queued to discovered pending stage; revised candidate not read; no consent inferred.
