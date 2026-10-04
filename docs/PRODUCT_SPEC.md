# NexTap product specification

Status: Approved. Documentation only; no implementation is authorized.

## Evidence and precedence

This English-language specification derives product intent from [vision.md](vision.md) and reconciles all 47 answers in the [accepted-decision ledger](../.atomic/recovery/accepted-decisions.json). A successful parent-chat answer overrides conflicting or stale wording in the vision and earlier drafts. The ledger records decisions, not approval of this document. This document is a product contract: it states settled behavior, identifies implementation defaults and proposals, and preserves only genuine external gates. No runtime, provider account, inventory sample, deployment, or implementation was verified.

Companion ownership is deliberate: [ARCHITECTURE.md](ARCHITECTURE.md) owns hosting, runtime, cache mechanics and restore; [DATABASE.md](DATABASE.md) owns persistence, constraints, migrations and transaction shape; [FLOWS_AND_API.md](FLOWS_AND_API.md) owns HTTP routes, payloads, statuses and retries; [SECURITY_AND_EDGE_CASES.md](SECURITY_AND_EDGE_CASES.md) owns authentication, authorization, validation, privacy and retention. This document owns product scope, lifecycle, publication, content rules, acceptance criteria and shared vocabulary.

## Product goal and scope

NexTap is a multi-tenant digital business-card platform. A physical card has NFC, QR and one permanent public Card ID. A Visitor tapping or scanning it reaches a small public Business page under `nextap.services`. The printed destination does not change when the Business name, slug, content or design changes. This is a digital business card and mini landing page, not a full website builder or payment gateway (vision §§1–5, 36–38, 46).

The launch includes:

- one shared application serving many Businesses;
- Admin-managed Card inventory and Business content;
- permanent Card routes, plus independent Business sharing routes;
- a responsive public page with registered Sections, contact actions, external Links, hours, location, reviews destination and optional Logo/Cover;
- explicit Business publication and safe Card transfer history;
- direct external navigation for payment, social, map and review destinations.

The launch excludes Business Owner accounts or self-service dashboards, product scan/click analytics, payment processing, synchronized review ratings, a full page builder, arbitrary HTML/scripts, and Card or Business hard deletion. Operational error monitoring, Admin audit and Card history are not product analytics.

## Actors and release boundaries

**Visitor** opens public URLs without management privileges. **NexTap Admin** is the only authenticated release role. Admin creates Businesses, manages Cards, assigns and activates Cards, edits every Business page, imports inventory, and reads the Admin-only Card history timeline. There is no public signup, Business Owner login, owner-account link, or dormant owner relationship in version one. Future ownership migration requires a separate decision.

The application is multi-tenant: a Business is the content boundary, not an installation or login account. A Business can have many Cards; each Card has at most one current Business assignment.

Product analytics are deferred: version one has no scan counters, click counters, Visitor event collection or `scan_events` product feature. Minimized operational logs and Card lifecycle history remain separate records.

## Stable routes and route semantics

Every physical Card encodes `https://nextap.services/c/{Card ID}`. The Card ID is permanent, unique and non-sequential. An eligible Card request renders the Business page directly at `/c/{Card ID}`; it does not redirect to a slug. The route remains valid across renames, slug changes, content saves and Card transfers.

The launch also provides `https://nextap.services/b/{slug}` as an independent Business sharing route. The current slug renders the page. A former slug is retained as a reserved alias that redirects to the same Business; it can never be assigned to another Business. Alias handling is still subject to the same publication and fresh-eligibility checks. Disabling a Business blocks its current slug and every alias.

A new public request must freshly establish Card assignment/status and Business eligibility before selecting cached content. Unknown eligibility fails closed. An already delivered, in-flight, downloaded or browser-cached response cannot be recalled. Public lifecycle notices must not disclose assignment, prior Businesses, history, internal UUIDs or Admin data. The required known-Inactive notice is: **“This NexTap card has not been activated yet.”** Exact HTTP classes and safe notices for other public conditions are an API implementation contract owned by [FLOWS_AND_API.md](FLOWS_AND_API.md).

## Card and Business lifecycle

Card state and Business publication state are independent:

- Card state is `Inactive` or `Active`.
- Business state is `Disabled` or `Enabled`.
- An assigned Card may be Active while its Business is Disabled; it is not publicly eligible until the Business is Enabled.
- A Business starts Disabled and is explicitly enabled by Admin. A nonempty name and unique current slug are sufficient; all other content is optional.
- Saving content on an Enabled Business publishes subsequent requests without a separate draft workflow.
- Disabling a Business blocks Card, canonical Business and alias routes without changing Card assignments or Card states.
- No Card deletion, Card ID reuse or Business hard deletion exists in version one.

| Admin action | Required outcome |
| --- | --- |
| Assign or reassign | Card must be Inactive; set one assignment and leave it Inactive. |
| Activate | Assigned Card becomes Active as a separate action; Business may remain Disabled. |
| Deactivate | Card becomes Inactive and keeps its assignment. |
| Unassign | Card becomes Inactive and clears its assignment. |
| Enable Business | Explicitly publish a ready Business whose name is nonempty and slug unique. |
| Disable Business | Block every public route while preserving content, aliases, assignments and Card states. |

The only supported transfer is **deactivate, reassign while Inactive, then activate**. Reassignment never silently activates a Card. Expected versions reject stale Admin writes without mutation. Successful Card mutations, required Card history and required minimized audit commit atomically; if required history or audit storage fails, the mutation is rejected.

## Card history and publication consistency

Card history exists from day one and is distinct from analytics and routine audit. A simple read-only Admin timeline records only actual successful changes: creation/import of a new Card, Assign/reassign, Activate, Deactivate and Unassign when state or assignment changes. Each entry includes actor UUID, event time, old/new Business and old/new status. It excludes IPs, copied actor emails, scans, clicks and content snapshots. Skipped existing import rows, rejected requests and no-ops are not successful lifecycle history. History is minimal, append-only and retained for the permanent Card lifetime.

A successful content save advances the Business public-content revision atomically with the content change. A new request reads fresh eligibility and the current revision, then may use cached content keyed by Business plus revision. A miss loads a coherent current public projection. Cache-write failure does not fail an otherwise valid read, and publication does not depend on global purge success. The representation must match its revision; stale or mixed content must not be cached under a current revision. `expectedVersion` protects edits, while content revision identifies the public representation; they are not assumed to be the same field.

These rules are product decisions. The physical revision fields, coherent projection/read strategy, cache ordering and transaction details are implementation contracts owned by the companion documents.

## Public page content

A Business page is composed of registered, configurable Sections, not arbitrary tenant-supplied components. At most one of each built-in type exists:

1. Hero
2. Contact
3. Social
4. Payments
5. Location
6. Hours
7. Reviews
8. Custom Links

Admin can enable, disable and reorder Sections with simple ordering controls. Drag-and-drop is not required. A Section's settings are typed and bounded; adding a new Section type requires application support and a registered schema.

| Capability | Settled product rule |
| --- | --- |
| Business identity | Name and optional plain-text description. Name is required only for enablement. |
| Contact | Phone, WhatsApp and email fields are authoritative. Contact buttons derive from them; generic Links cannot create competing contact buttons. |
| Images | At most one optional Logo and one optional Cover. |
| Hours | Seven-day weekly schedule, Business timezone, closed days or one or more intervals. No holiday calendar or calculated “open now” in v1. |
| Social and custom Links | Generic Links belong to exactly one supported link-bearing Section and appear once when active and visible. Repeated platforms are allowed with distinct labels. |
| Payments | External HTTPS URLs only. NexTap does not process, verify or confirm payments and does not show copyable wallet identifiers. |
| Location | Address, map and directions as configured external navigation. |
| Reviews | Configured external Google Reviews destination. Automatic ratings and review counts are deferred. |

Initial enablement requires only a nonempty name and unique slug. Contact details, Links, hours, location, Logo and Cover are optional. All public content is plain text or validated external navigation; no scripts, HTML, arbitrary server-side URL fetches or tracking endpoints are part of the product.

Accepted bounds are: name 120 characters, description 1,000, Link label 80, destination URL 2,048, 50 generic Links per Business, and 8 KiB settings per Section. JPEG, PNG and WebP images are limited to 2 MiB and 16 megapixels, decoded/re-encoded with metadata stripped; SVG, animation and malformed images are rejected. The exact Unicode counting, contact normalization, settings schemas and combined JSON request ceiling are implementation details, not new product choices.

## Admin operations and imports

Admin management uses a private HTTP/JSON API under `/api/admin`, with internal UUIDs for management resources. Lifecycle commands are explicit POST operations for Assign, Unassign, Activate and Deactivate. Business field edits use PATCH. Complete Section and Link order lists use PUT. Effectful commands require `Idempotency-Key`; edits require `expectedVersion`. Repeating a key with the same payload returns the original result; a different payload is rejected. A replay still requires current authorization and must report committed truth.

Admin errors use `{error:{code,message,fieldErrors?,requestId}}` with stable safe codes and no secrets or stack traces. The accepted status classes are 401 missing session, 403 forbidden, 404 missing or non-disclosed resource, 409 version/lifecycle conflict, 422 semantic validation, 429 rate limit and 503 unavailable dependency. Lists use opaque cursors, bounded limits, stable sorting and `nextCursor`. Exact route names, payload fields, cursor bounds, no-op responses, public statuses, idempotency retention and retry-record persistence are implementation contracts owned by [FLOWS_AND_API.md](FLOWS_AND_API.md).

Inventory input is UTF-8 CSV exported from Excel, not direct XLSX. It has `card_id` and optional `status`, and a status value may request only `Inactive`. Admin previews the complete file before commit. Invalid rows or duplicate tokens within the file reject the whole batch. Existing exact tokens are skipped unchanged; new tokens are inserted Inactive and unassigned. Import cannot activate or overwrite a Card. The accepted limit is 10,000 rows and 10 MiB; preview validity is 30 minutes and raw temporary import data expires within 24 hours. Commit rechecks authorization, preview integrity/expiry and uniqueness. The actual legacy token grammar is not assumed from examples.

## Security and operational boundaries

Admin accounts are individually provisioned Supabase email/password identities with mandatory authenticator-app TOTP MFA and no public signup. Sessions have server-enforced eight-hour absolute and 30-minute idle limits. Reassignment, Business enablement, payment-link changes and Admin-permission changes require TOTP within five minutes. Every privileged request verifies current Admin membership. Trusted operators handle bootstrap and MFA recovery out of band with audit attribution.

Management uses identity-scoped clients, restrictive grants/RLS and same-Business child constraints. Anonymous management-table access is denied. Public responses use a restricted projection and never expose Admin identities, inventory, history, audit, raw storage paths or unpublished content. Server-only privileged credentials require explicit scope checks, and cookie-authenticated mutations require CSRF/origin protection.

New Card IDs require at least 128 cryptographically random bits; existing printed IDs remain exact and public IDs grant no permissions. Images use private storage and application-mediated delivery. Every new image request checks Enabled Business and the current Logo/Cover reference, so Disable or replacement stops new access through old URLs. Public routes use volumetric protection without a low blanket Visitor quota. Accepted limits are login/recovery 10 attempts per 15 minutes, MFA 5 per 10 minutes, Admin mutations 120 per 10 minutes, uploads 20 per 10 minutes and imports 5 per hour.

Routine minimized Admin audit metadata is retained 90 days, operational errors 14 days, and unused imports/temporary uploads 24 hours. Card history is retained for Card lifetime. Application errors retain request ID, route template and redacted error only; they do not retain Visitor identifiers/IPs, full public tokens, queries, bodies, credentials or tracking data.

## Settled technical decisions

The following are accepted decisions recorded in the ledger, not implementation defaults or open proposals:

- **Stack and hosting:** Use one Next.js application with Supabase PostgreSQL, Auth and Storage, hosted on Cloudflare Workers. The specific Workers adapter remains deferred to the compatibility gate below; that deferral does not reopen the selected stack or hosting direction.
- **Environment separation:** Require separate staging and production Workers and Supabase services. Staging must not share production data, authentication, storage, secrets or operational state.
- **Internal identifiers:** Use internal UUIDs for Cards, Businesses and content, separate from immutable printed public Card IDs. New Card IDs require at least 128 cryptographically random bits; existing printed IDs remain exact.
- **Management API:** Use a private HTTP/JSON API under `/api/admin`, with internal UUID references; explicit POST lifecycle commands for Assign, Unassign, Activate and Deactivate; PATCH for Business field edits; PUT for complete Section and Link order lists; `Idempotency-Key` for effectful commands; `expectedVersion` for edits; the approved safe JSON error envelope; accepted status classes; and opaque cursor pagination with bounded limits and stable sorting. Exact routes, payloads, cursor bounds, retry retention and other transport mechanics remain companion API contracts.
- **Security baseline:** Use individually provisioned Supabase email/password Admin identities with mandatory authenticator-app TOTP MFA and no public signup; enforce current Admin membership, the accepted session and sensitive-action reauthentication rules, restrictive grants/RLS and same-Business child constraints; deny anonymous management access; use restricted public projections; protect cookie-authenticated mutations against CSRF/origin attacks; keep Storage private with application-mediated current-image checks; apply the accepted content bounds, rate limits, privacy minimization, atomic audit/history, and fresh fail-closed public/image gates.

These decisions constrain implementation but do not claim that any provider, runtime, adapter or enforcement has been tested.

## Implementation defaults and proposals

The following are engineering details that remain defaults or proposals, not additional human decisions:

- Represent former slugs in a globally unique Business-slug registry with one current slug per Business and aliases tied to the same Business; the exact slug normalization/grammar remains an implementation choice.
- Use typed Section rows, tenant-owned Link rows, private image references and deterministic order tie-breaking by stable ID.
- Keep expected-write version and public-content revision distinct unless a later physical design explicitly maps them.
- Store durable idempotency records that bind key, authenticated operation and payload, retain completed results for the documented 24-hour implementation default, replay the original committed result after current authorization checks, and reject conflicting payloads. Crash and expiry handling follow [FLOWS_AND_API.md](FLOWS_AND_API.md) and remain implementation behavior, not a new product choice.
- Use application-mediated image replacement with immutable private objects, current-reference commit, and cleanup/reconciliation after commit; PostgreSQL and object storage are not one transaction.
- Apply reviewed versioned Supabase SQL migrations, test promotion in staging, and reconcile relational data and private objects before reopening public traffic after restore.

These defaults must not weaken the settled lifecycle, fresh-gate, privacy, atomic audit/history or content-bound rules.

## Genuine deferred gates

Only these four external verification or prelaunch decisions remain gates; they do not reopen settled product answers:

1. **Legacy token sample/grammar.** Obtain a real inventory sample/workbook and verify printed-token grammar, case/URL compatibility and practical entropy before legacy import or public use. Preserve every existing token exactly; do not regenerate or normalize it to a new format.
2. **Cloudflare adapter compatibility.** Test the actual Next.js project, dependencies, authentication/session enforcement, private-image handling, cache ordering and Workers compatibility before choosing vinext or OpenNext.
3. **Provider log/backup/restore review.** Before launch, verify provider-native log, Auth, Storage and backup contents, retention, operator access, deletion behavior, restore coverage and reconciliation of revoked mappings, versions, history, audit and private-image references. Application retention periods do not prove provider deletion.
4. **Operating targets at prelaunch.** Decide and verify budget, SLA, latency, region, recovery-time and acceptable-data-loss targets against actual provider plans. No numerical target is selected here.

All other incomplete items are implementation contracts or engineering proposals owned by the companion documents, not human gates.

## Acceptance criteria

1. A Business name, slug or page edit never requires replacing its printed QR/NFC Card URL.
2. A Card has at most one assignment; two eligible Active Cards can resolve to the same Enabled Business.
3. A known Inactive Card shows the activation-pending notice and never exposes assigned Business content.
4. Admin can create/import Cards, create a Disabled Business, assign and separately activate a Card.
5. A Card may be Active while its Business is Disabled, but no public content is served until the Business is Enabled.
6. Transfer requires Deactivate, reassign while Inactive, then separate Activate; Unassign clears assignment and leaves the Card Inactive.
7. Successful lifecycle changes appear in the Admin-only Card timeline for the Card's lifetime; rejected, skipped and no-op operations do not.
8. Admin must explicitly enable a Business with a nonempty name and unique slug; Disable blocks current and historical Business routes without changing Card state.
9. Former slugs redirect only to their same Business, remain reserved, and cannot be claimed by another Business.
10. `/c/{Card ID}` renders directly, while `/b/{slug}` is an independent sharing route.
11. Each built-in Section appears at most once, visible Sections and active Links preserve configured order, and hidden content is absent.
12. Generic Links belong to one supported link-bearing Section; repeated platforms are allowed with distinct labels; Contact buttons derive from contact fields.
13. Hours support seven days, closed days or multiple intervals, and a Business timezone without holidays or open-now calculation.
14. Logo and Cover are optional; valid image limits and private current-reference delivery are enforced.
15. Payment and review actions navigate to configured external destinations; NexTap never claims payment success or synchronized ratings.
16. Admin is the only authenticated release role; no owner account, self-service dashboard or product analytics exists.
17. CSV preview and atomic commit reject invalid batches without partial mutation, leave existing Cards unchanged, and create only Inactive unassigned Cards within accepted bounds.
18. Stale Admin writes are rejected without mutation; successful data changes commit required audit/history atomically.
19. Every new public and image request checks current eligibility/reference before cache reuse and fails closed when eligibility is unknown.
20. Content saves atomically advance the Business revision; revision-keyed cache selection does not depend on global purge success.

## Canonical vocabulary

**Business**: The activity or organization represented by one public NexTap page and its content boundary. Avoid “account” when Business is meant.

**Card**: A physical NexTap card with one permanent public identity and an optional current Business assignment. Avoid “profile” or “Business” when Card is meant.

**Card ID**: The permanent public identifier printed or encoded on a Card and used in `/c/{Card ID}`. It is not an internal UUID, slug or secret.

**Assignment**: The current association between one Card and at most one Business. Do not call an association activation.

**Activation**: Making an assigned Card Active. Public access also requires an Enabled Business.

**Enabled Business**: A Business explicitly published by Admin. It is independent of Card Active state.

**Public Business page**: The Visitor-facing mini landing page. Avoid “full website” or “Card” when the page is meant.

**Section**: A registered configurable content group on a public Business page, not an arbitrary page-builder block.

**Link**: A Business-controlled external destination shown in exactly one supported link-bearing Section. It is not a NexTap payment transaction.

**Card history**: The minimal successful operational Card timeline retained for Card lifetime. It is not scan analytics or routine security audit.

**Business slug**: The current readable identifier in a Business sharing URL.

**Slug alias**: A former Business slug permanently reserved for and redirected to the same Business.

**NexTap Admin**: The platform operator who manages Cards, Businesses and content. Avoid “Business Owner” for this role.

**Business Owner**: The person responsible for a Business; owner login is deferred and no owner-account link exists in v1.

**Visitor**: A person opening public URLs without management privileges. Avoid “User” when it implies a login.

**Inactive Card**: A Card whose public route cannot open its assigned Business page. It may still retain an assignment.

## Companion documents

- [Architecture](ARCHITECTURE.md) owns hosting, Workers adapter compatibility, environment separation, cache/runtime ordering, image delivery mechanics and restore procedure.
- [Database](DATABASE.md) owns UUID/token persistence, schema constraints, slug registry, Section/Link/image representation, migrations, revisions, audit/history transactions and import persistence.
- [Flows and API](FLOWS_AND_API.md) owns exact route names, HTTP methods, payloads, status details, public notices, pagination, CSV preview/commit and idempotency replay contracts.
- [Security and edge cases](SECURITY_AND_EDGE_CASES.md) owns authentication, MFA, authorization/RLS, CSRF, input/image validation, rate limits, privacy, retention and failure handling.

This document remains Draft and documentation-only. Approval, if requested, is a parent-chat documentation decision and never authorizes code, deployment or implementation.