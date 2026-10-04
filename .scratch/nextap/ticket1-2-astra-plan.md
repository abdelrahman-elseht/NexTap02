# Provisional NexTap Ticket 01/02 execution plan for GPT-6.1 Sol high

Date: 2026-10-05.
Repository: `F:/projects/NexTap02-phase1-hardening`.
Branch: `phase1-ticket1-2-completion`.
Inspected HEAD: `75ef464ce5700a3fe6f9bf4676179f45fe7f415e`.

## Authority, scope, and completion limit

This is an explicitly provisional, contract-derived plan. The supervisor approved this qualification after inspection found no authoritative Ticket 01/02 files, phase-plan, six phase handoffs, or `.scratch/nextap` evidence in this checkout. GitHub issue listing returned no issues; the remote `phase1-hardening` tree likewise contains no ticket/phase-plan packet. The historical progress ledger refers to those missing artifacts but does not reproduce their acceptance criteria. Consequently, the criteria below are precise requirements derived from the available contracts, not an assertion that the original tickets had exactly these criteria. Do not mark either ticket complete until its authoritative acceptance list is recovered or the decision authority adopts a replacement list explicitly.

Use `docs/spec.md` and its five companion contracts for behavior. Use `docs/OPERATING_TARGETS.md` for the later user-selected budget/load assumptions. Treat `docs/PHASE2_GAP_ANALYSIS.md` as a historical baseline: its claims that the core schema and auth/operation/maintenance modules are absent predate the waves. Treat wave PASS claims as historical and limited to their named seams. Do not rewrite specifications, tickets, phase plans, or historical wave evidence to match incomplete behavior.

This planning run authorizes only this plan and the requested external progress artifact. It does not authorize application changes, migrations, provider mutations, deployment, push, PR creation, image generation, or secret disclosure. The builder needs the applicable implementation authorization before executing edits; provider work additionally needs explicit target/resource authorization. Existing CLI login state, tracked Supabase linkage metadata, bucket names, a previous deployment, or documentation is not authorization.

Ticket 01 is provisionally treated as the application/adapter/provider compatibility evidence track. Ticket 02 is provisionally treated as the authentic legacy Card/QR/NFC compatibility track. Keep the other two external gates—provider logs/backups/restore and operating targets—visible and separate; do not relabel every missing implementation as a human-only gate.

## Verified starting evidence

Read during this review:

- `docs/spec.md`, `docs/PHASE2_GAP_ANALYSIS.md`, `docs/OPERATING_TARGETS.md`, `docs/operating-targets-validation.md`, and the five Product/Architecture/Database/API/Security companions.
- All seven root wave reports: A request ID, A image wrapper, B schema, C auth, D idempotency, E authority, and F maintenance.
- All current application pages/routes, `lib/*.mjs`, `test/*.test.mjs`, all eight migrations, `proxy.js`, `worker-wrapper.mjs`, Next/OpenNext configs, both Wrangler configs, package manifest, public headers, and relevant generated environment type declarations.
- Historical iteration/progress ledger and repository/remote branch state. Provider credentials and linkage values were not inspected or printed.

Current validation:

- `npm test`: PASS, 40 tests, 0 failures. This establishes only the existing unit/direct-handler assertions.
- `node --check` on `proxy.js`, `worker-wrapper.mjs`, and every `lib/*.mjs`: PASS.
- `git diff --check`: PASS before plan creation.
- `npm run phase1:probe:offline`: FAIL, exit 1, `MODULE_NOT_FOUND` for `.scratch/nextap/phase1-probes/run-probes.js`. Both probe scripts reference this absent entrypoint.
- Five additional in-memory, synthetic diagnostic probes reproduced defects described below. These probes made no provider calls and changed no files.
- Installed versions observed: Node 22.23.2, npm 10.9.8, Next 16.3.8, React/react-dom 19.3.0, OpenNext Cloudflare 1.20.8, sharp 0.35.5, Wrangler 4.147.0, Supabase CLI package 2.119.0.
- `.open-next/worker.js` is absent. `.next/BUILD_ID` and build manifests exist, but their correspondence to current source was not verified. They are not a fresh build PASS.
- `command -v` found no Docker, psql, or agent-browser in this shell. This is a tooling availability observation, not proof the host has no installation elsewhere.
- No fresh build, browser session, Worker execution, SQL apply, hosted provider probe, load test, restore, or authentic physical sample verification ran during this review.

Remote state observed read-only:

- `main`: `c41252b`; `phase1-hardening`: `0b72281`; `phase1-operating-targets`: `75ef464`.
- No remote `phase1-ticket1-2-completion` branch was listed.
- PR 1, “Document operating targets for phase 1 hardening,” is OPEN from `phase1-operating-targets` to `phase1-hardening`. Its existence is not ticket completion or merge authorization.

Historical findings to reconcile:

- Wave E's maintenance `assert.throws`/unhandled-rejection failure is resolved in the current file: `test/wave-f-maintenance-remote-safety.test.mjs:75` uses `await assert.rejects`; all 40 tests pass now. Do not reopen that historical failure without a new reproduction.
- The older OPTIONS=400/POST=200 public-route failure was addressed by the proxy, but current Worker/browser behavior remains unrun.
- Historical missing alias/304 evidence is partly addressed by code and helper tests. There is still no current end-to-end mutation/revocation evidence. Last-Modified is not required by the available contract; do not invent it merely because an old report mentioned it.
- An optimizer 400, or a wrapper-added request ID, proves neither current-image gating nor denial of an optimization bypass.

## Defect register: builder work, not human-only gates

D01 — Missing MFA/session dependencies authorize instead of failing closed.

- Files: `lib/auth.mjs:82-101`; `app/api/admin/session/route.js:6-10`.
- Reproduction: provide a synthetic verified unexpired claim and active membership, omit `mfa` and `sessionStore`; `authorizeAdmin` returns authorized. The fallback sets `lastSeenAt` to now on every request. An old provider `iat` is also not an authoritative application-session issuance record.
- Required repair: missing/unreadable authoritative session or MFA state must deny safely; use durable server session issuance/last accepted activity, revocation and session-bound MFA freshness. Preserve 8-hour absolute, 30-minute idle and five-minute sensitive-action rules. Renew only accepted activity; refresh must not restart absolute lifetime. Distinguish invalid credentials from unavailable verification dependencies (401 versus 503).
- The session route currently wires no session store and exposes an undocumented POST path that authenticates without Admin/MFA authorization. Resolve against the documented GET-only session contract; do not treat POST success as Admin capability.
- Acceptance: HTTP requests with absent MFA/session adapters cannot succeed; revoked, idle, absolute-expired and stale-freshness fixtures deny on their next privileged request and replay.

D02 — Request-ID origin and response agreement are inconsistent.

- Files: `lib/admin-errors.mjs:12-15`, `proxy.js:7-21`, Admin/maintenance routes, `lib/http-response.mjs`, `worker-wrapper.mjs:13-24`.
- Reproduction: `requestId` returns `caller-chosen-id` from the incoming header unchanged. Existing maintenance tests explicitly bless this behavior.
- Required repair: establish one server-created request ID at a trusted boundary, strip/ignore external attempts to supply it, and carry the trusted ID to handlers and errors. A syntactically valid UUID supplied by the client is still untrusted. Header and JSON error ID must agree after proxy and Worker handling; avoid a wrapper generating a different header ID over a JSON body containing an older ID. Cover framework-generated errors/method responses and unknown routes outside the current matcher.
- Acceptance: repeated requests carrying the same arbitrary string or valid UUID get distinct server IDs; each error body matches its final header. Update tests that encode the defect, using external HTTP observations rather than source-regex assertions.

D03 — Retry lookup follows a stale-version check; identity/durability integration is incomplete.

- Files: `lib/operations.mjs:142-161`, `lib/idempotency.mjs:69-78`, migration `0003_operations_and_uploads.sql`.
- Reproduction: initial request with expected/actual version 1 commits version 2; same actor/key/payload retried with actual version 2 returns `{kind:'conflict',code:'stale_version'}` rather than the original result.
- Required repair: after current authorization, serialize actor/key and resolve committed matching replay before checking expectedVersion for a new mutation. Read/lock actual version inside the database transaction. Persist digests, not raw retry keys; partition identity by actor while rejecting same-actor cross-scope/target/payload reuse. Current helper storage is keyed only by raw key, and the supplied memory adapter is explicitly non-durable.
- Acceptance: response-loss retry after state advances returns the original operationId/result with replayed=true; no duplicate history; new stale writes return documented `version_conflict`; different actors can independently use equal key strings without seeing one another's results. Database/process-restart tests, not `durable:true` labels, establish durability.

D04 — Null image-object result throws.

- File: `lib/public-authority.mjs:273-282`.
- Reproduction: valid synthetic eligibility/revision/current reference plus `loadImageObject: async () => null` throws `TypeError: Cannot read properties of null (reading 'kind')`.
- Required repair: safely interpret missing/null object and unavailable object reads before accessing fields. Keep the public contract's missing-object 404 versus dependency-unavailable 503. Check undefined and thrown-dependency results too.
- Acceptance: application image GET/HEAD produces the safe status, no exception details, no old bytes, no inappropriate 304, and one matching server ID.

D05 — Unknown current-reference result permits deletion.

- File: `lib/maintenance.mjs:77-102`.
- Reproduction: candidate adapter returns undefined from `isCurrentReference`; the fake object-store delete is called once and the result reports deleted=1.
- Required repair: require explicit authoritative proof of no current reference before any deletion. Unknown/malformed/unavailable state must retain a retryable candidate, never be treated as false. Durable claim/lock and non-reattachment invariants must prevent check/delete races; a check immediately before deletion alone is insufficient.
- Acceptance: null/undefined/invalid/current/unavailable authority never deletes; explicit no-current result can delete; retries and missing-object success remain idempotent. Concurrent intent completion versus cleanup cannot delete a newly current object.

D06 — SQL policies and projections do not yet enforce the specified boundary.

- Files: `0001_initial_schema.sql`, `0002_content_and_history.sql`, `0004_security_and_projection.sql`, `0005_rls_and_grants.sql`, `0006_maintenance.sql`.
- Static evidence: migration 0005 grants authenticated users SELECT/INSERT/UPDATE/DELETE on all public tables; most management policies check only active membership. They do not enforce MFA/session/freshness/expected version or atomic audit/history/results. Card tokens can be updated through the granted path; unreferenced Cards/Businesses can be deleted; canonical slugs can be changed/reassigned/deleted. Immutable compatibility aliases and append-only history triggers do not protect the canonical slug registry or force history to accompany a Card change.
- Static evidence: `public_business_projection` always selects phone/email/address/map/review fields and hours even when corresponding Sections are hidden; it returns Business UUID and exposes projection/slug functions to anon. Filtering the Sections array alone is not a restricted projection. The renderer must not serialize internal identity/cache metadata either (`app/b/[slug]/page.jsx:10` currently prints its cache key).
- Static evidence: link-limit trigger counts without serializing concurrent parent writes; changing a Business timezone does not itself validate an existing hours row; legacy alias and canonical slug tables have no shared uniqueness constraint. The image table has positive width/height but no product-of-dimensions ceiling. Scheduled cleanup selector uses cleanup_due_at rather than eligible_at, has no claim/lease, and p_limit has no SQL-side upper ceiling. Application orchestration cannot establish these direct-provider invariants alone.
- Required repair: reviewed forward migration(s) after checking actual applied-history state; narrow direct grants to the intended identity-scoped command/read surfaces, enforce database-side assurance and immutable identity/reservation rules, serialize cardinality and mutations, restrict projections by Section visibility, and implement safe bounded claims. Do not rewrite applied migration history. Test a pristine database and the actual existing staging migration order; six lower-numbered files plus historical timestamped migrations need compatibility evidence, not parentheses checks.
- Acceptance: real PostgreSQL constraints/concurrency tests and direct Data API probes with anon, non-Admin, aal1 Admin, aal2 Admin, revoked Admin and scoped privileged identities. UI denial is insufficient when direct table/function access can bypass it. Observe effects through documented HTTP reads/history where possible; privileged database inspection is limited to provider/persistence claims without a public API.

D07 — Runtime integration and observable management surfaces are absent.

- Public pages, proxy and image route still import `lib/domain.mjs` fixture arrays. `lib/public-authority.mjs` and runtime identity helpers are not connected to public routes. There is no concrete Supabase verifier/client, authoritative persistence resolver, durable transaction adapter, upload/commit path, rate-limit implementation, or durable cleanup adapter. Global injection seams are scaffolding, not production wiring.
- Missing required command/read routes are listed in the matrix below. Do not call their absence a provider outage or satisfy them by directly mutating process arrays in a test.
- Build the smallest real vertical slice needed to prove the compatibility contract, then extend to the required mutation-driven scenarios. Do not silently expand this provisional ticket plan into a full unapproved Admin product/UI implementation.

D08 — Wrangler/runtime and storage authority drift.

- `wrangler.jsonc` selects `worker-wrapper.mjs`, compatibility date 2026-10-01, Node flags, assets, self-reference, R2 cache, private R2 binding, Images and observability. `wrangler.toml` selects generated `.open-next/worker.js`, date 2026-10-04, and only the private R2 binding. Both name the existing `ex-ap02-main` Worker. Neither defines verified staging/production identities. Generated types omit R2_BUCKET and refer to the generated worker; the typegen script writes another filename.
- Required repair: explicit safe local/staging config and target selection, consistent entrypoint/date/bindings, generated types from the selected config, and runtime issuer/project/bucket/cache identity checks. Do not run the generic deployment scripts against either existing config.
- Architecture decision boundary: approved specifications select Supabase private Storage; the implementation and later gap report discuss R2. No available artifact settles that change. Local current-R2 behavior can be characterized, but do not bless R2 as production architecture or switch storage providers silently. Recover an approved decision or escalate only this storage-selection question before provider-backed implementation requiring it.
- sharp works in these Node tests; native sharp support/resource bounds in Workers remain UNRUN. A package import, type check or build alone is not image decoder feasibility evidence.

## Provisional Ticket 01 acceptance matrix

Every row remains open for ticket acceptance. Existing narrow unit passes do not close its end-to-end criterion. Source references are requirements, not fresh test results.

T01-P01 — Reproducible pinned adapter/runtime evidence.

- Requirement: selected Next/adapter/dependencies/date execute the application in Workers with required SSR, HTTP, Auth/database, private-image and maintenance paths. Source: spec external gate and Architecture compatibility checklist.
- Files: package/lock files, next.config.ts, open-next.config.ts, worker-wrapper.mjs, both Wrangler configs, generated environment types.
- Work: recover or replace the missing probe runner under a durable version-controlled path; if retaining the existing `.scratch/nextap/phase1-probes/run-probes.js` entrypoint, implement a real offline runner rather than an always-PASS stub. Record actual versions and source hash; avoid dependency upgrades as a substitute for debugging. Make local-only/no-network mode explicit.
- Commands: C0-C4 below. Local build/workerd work is executable after implementation authorization and installed-tool checks. Hosted runtime verification is BLOCKED until an approved disposable Worker target exists.
- PASS evidence: current build and local Worker execution followed by hosted behavior for the remaining rows, all bound to the same candidate/config. No selection claim from historical dry-run evidence alone.

T01-P02 — Public route and HTTP semantics, including safe notices.

- Requirement: active assigned Card plus Enabled Business renders directly at `/c/{cardId}` (200, no slug redirect); known Inactive is 200 with exactly “This NexTap card has not been activated yet.”; unknown/Disabled/unavailable publication is 404; authoritative dependency uncertainty is 503. Current `/b/{slug}` is 200; eligible former slug is 308 to its own current slug; Disabled alias is 404; unknown authority never redirects. HEAD has no body; OPTIONS and unsupported methods have the intended Allow/status behavior.
- Files/routes: app/c/[cardId]/page.jsx, app/b/[slug]/page.jsx, app/not-found.jsx, proxy.js; GET/HEAD/OPTIONS and POST/PUT/PATCH/DELETE on public routes.
- Local now: characterize synthetic fixtures with production-mode Next and workerd. Implement real unavailable handling, no-store coverage and required fresh reads. Browser scenarios B01-B04; HTTP C5.
- PASS evidence: actual network status, redirect Location, safe visible/serialized payload and no old Business/internal metadata. Do not accept a streamed 200 error document as proof of a required 404/503 without resolving the contract.

T01-P03 — Opaque server request IDs on every relevant response.

- Requirement: every application response category has a server-created ID; JSON errors repeat the final header ID; client input is not authoritative. Gap analysis request-ID matrix plus API conventions.
- Files: D02 files and all custom routes; also unmatched 404, framework 405/500 where safely injectable, RSC/prefetch, `/_next/image` and trailing slash.
- Local now: repair D02 and cover successful/errors/redirect/conditional/method paths through HTTP. Browser scenarios B02-B04.
- PASS evidence: matrix of 200/201/204/304/308/400/401/403/404/405/409/413/415/422/429/500/503 wherever a documented route generates that status. Do not invent endpoints just to produce unused statuses. Record unimplemented status cases as UNRUN with dependency.

T01-P04 — Provider identity, Admin/MFA/session/CSRF/rate enforcement.

- Requirement: verified signature/issuer/audience/expiry, current membership/revocation, mandatory MFA, 8h/30m sessions, 5m sensitive freshness and replay, same-origin cookie mutation protection, documented rate limits and conservative denial on enforcement failure. Sources: spec decisions 16-18, 27; API/Security.
- Files: lib/auth.mjs, lib/admin-errors.mjs, app/api/admin/session/route.js, concrete provider/session adapters to be added at those boundaries, selected mutation routes.
- Routes: GET `/api/admin/session`; documented Card commands and Business enablement for sensitive/freshness checks. Do not add an undocumented permission/recovery endpoint.
- Local now: repair D01, arrange deterministic session/time/fault controls behind HTTP; reject claimed roles/actors. Staging: genuine provider sessions, TOTP enrollment/challenge, token revocation/refresh and direct provider paths, with separately provisioned synthetic identities.
- Browser: B05-B07. PASS requires real provider enforcement, not fake JWT decoding, a mocked membership function or a working MFA screen. Bootstrap/recovery identity verification and initial fixture/account access are human/operator prerequisites; executing approved fixtures is engineering work.

T01-P05 — Migrations, restricted projections and direct-provider isolation.

- Requirement: schema applies in correct order; exact immutable tokens, lifecycle constraints, slug reservation, same-Business children, append-only history, restricted public content and least-privilege RLS are enforced. Sources: Database, spec decisions 2-5, 9-14, 17, 29.
- Files: all eight migrations; future reviewed additive corrections; authoritative public/database adapter. Repair D06.
- Commands: C6 local disposable SQL rehearsal; C7 approved staging only. No linked reset or blind db push.
- PASS evidence: migrations apply on clean disposable database and verified prior-schema fixture; direct anon/non-Admin/aal1/revoked access denied, intended aal2 commands succeed, no raw keys/history/inventory/hidden fields leak through public RPC, and concurrent constraints hold. Ordinary PostgreSQL tests do not prove Supabase Data API/Auth behavior; Supabase local emulation does not prove hosted account configuration.

T01-P06 — Durable mutation, version, history/audit/result atomicity and reconciliation.

- Requirement: mutations and required history/audit/result commit together; stale writes change nothing; successful no-ops do not advance history/version; matching authorized retry returns original truth even after response loss; conflicting reuse cannot execute; current authorization applies before replay.
- Files: lib/operations.mjs, lib/idempotency.mjs, migrations and concrete command transaction adapter. Repair D03.
- Existing contract routes to implement as needed for the compatibility slice: GET `/api/admin/cards/{cardUuid}`, GET `/api/admin/cards/{cardUuid}/history`, POST `/api/admin/cards/{cardUuid}/{assign|unassign|activate|deactivate}`, GET `/api/admin/operations/{operationId}`, POST `/api/admin/businesses`, GET/PATCH `/api/admin/businesses/{businessUuid}`, POST `/api/admin/businesses/{businessUuid}/{enable|disable}`. Their Next route files do not currently exist. Follow the documented payloads, not new test-only public mutation routes.
- Local now: one complete lifecycle command using real local DB transaction; test same key/same payload, changed scope/target/payload, different actor, stale new request, matching concurrent request, audit/history failure, process restart, lost response, revoked replay and retention expiry. Extend only enough lifecycle/content mutations to support P07-P09.
- PASS evidence: HTTP result/operation/resource/history observations demonstrate one effect or no effect; provider-side audit inspection supplements the claim. Do not claim concurrency/durability from the memory adapter.

T01-P07 — Fresh authority before cache/conditional/navigation and coherent content.

- Requirement: every new Card/slug/alias/image request checks authoritative current eligibility/reference before shared cache/304/redirect; cache tuples match environment/renderer/schema/Business/revision; coherent origin read rechecks originating route; uncertainty is safe 503, cache-read failure falls back to current projection, cache-fill failure cannot invalidate valid content.
- Files: lib/public-authority.mjs, lib/domain.mjs fixture boundary, lib/runtime-config.mjs, proxy, public pages and image route, OpenNext cache config; concrete restricted resolver and internal cache adapter.
- Work: integrate the real authority path; preserve the special Inactive 200 and alias 308 outcomes rather than flattening all noneligible helper states to 404. Eliminate development fallback in staging; exclude diagnostic cache keys/internal identities from public HTML and RSC.
- Routes: public routes plus Business PATCH/disable and Card deactivate/assign/activate/unassign from P06.
- Local now: deterministic faults/races behind the HTTP seam. Staging: actual Worker/cache/database behavior. B03/B04/B08/B09.
- PASS evidence: warm old content, commit mutation, start a new request, then see new content/denial even with old ETag, RSC/prefetch headers and cache faults. Accept safe bounded retry/503 on tuple races; never accept mixed revisions. No claim to recall already delivered/in-flight/browser-retained content.

T01-P08 — Bounded sanitized image upload/current-reference delivery without bypass.

- Requirement: actual JPEG/PNG/WebP bytes only, bounded 2 MiB and 16 MP, sanitized metadata-free output, no SVG/animation/malformed input; server-owned intent/object identity; previous current image survives failed commit; successful replacement/removal immediately denies old URL regardless of physical deletion; current enabled reference gates direct/HEAD/304/optimized requests.
- Files: lib/image-validation.mjs, lib/public-authority.mjs, app/api/public/images/[imageId]/route.js, next.config.ts, worker-wrapper.mjs, internal disabled-image route, migrations 0002/0003/0006; concrete upload/reference/storage adapters. Repair D04; review decoded and sanitized output bounds, not only input labels.
- Routes: PUT/DELETE `/api/admin/businesses/{businessUuid}/images/{logo|cover}` (documented but absent), GET/HEAD `/api/public/images/{imageId}`, `/_next/image` and actual emitted transformation URLs such as `/cdn-cgi/image/*` if enabled. Resolve D08 storage authority before adding provider integration.
- Local now: real sanitized byte fixtures and reference state tests. Worker: actual decoder/runtime/resource limits. Staging: private bytes, no direct public/signed URL bypass, replacement/removal and failure/race matrix. B10/B11.
- PASS evidence: before/after digest and metadata inspection plus actual denial of old/direct/optimized access. If optimization is disabled, prove application/Worker paths return no image bytes and cannot bypass gate; a 400 alone is insufficient.

T01-P09 — Safe bounded maintenance, crash recovery and retention evidence.

- Requirement: authorized environment-scoped invocation; durable bounded claims; explicit no-current proof; temporary intent expiry versus completion is serialized; missing objects complete; provider uncertainty remains retryable; no age-only bucket sweep or deletion of current images. Raw imports/unused uploads expire within 24h; replaced objects immediately inaccessible/eligible and due within seven days; terminal retry results have documented 24h retention while active processing is not blindly deleted.
- Files/routes: lib/maintenance.mjs, POST `/api/internal/maintenance`, migrations 0003/0006 and concrete candidate/object adapters. Repair D05 and D06 maintenance mechanics.
- Local now: route auth/method/bounds, unknown authority, missing objects, repeated cleanup, provider timeout, lost deletion response, concurrent completion and no-current proof. Staging only after earlier reference/transaction gates pass: controlled one-shot run on manifest-owned candidates, limit <=10. No production cron.
- PASS evidence: current image still serves; old inaccessible object deletion is independently confirmed; retryable failures are not reported as deletion; repeat pass is idempotent; claim/deadline/time semantics are recorded. Time-travel tests prove logic, not actual provider scheduler uptime. Scheduled invocation feasibility needs actual approved runtime evidence separately.

T01-P10 — Environment and credential isolation.

- Requirement: separate Workers, Supabase issuer/projects, private storage, cache namespaces, secrets, rate/retry/maintenance state; wrong-environment token/object/cache rejected; no production fallbacks. Sources: spec decision 1 and Security/Architecture isolation contracts.
- Files: runtime-config, provider adapters, Wrangler config/types, cache keys, secret injection, maintenance configuration. Repair D08.
- Local now: validate complete expected identity tuple and intentionally mismatched configuration; inspect generated assets for secret leakage using redacted tools. Environment-name string validation alone is not PASS.
- Provider execution: BLOCKED until two separately approved environments/fixture identities are available. Prefer two disposable nonproduction environments for cross-token/object/cache tests. A second billable project is never implicit. Read-only production inventory may establish separation only if authorized; do not send staging fixtures to production.
- PASS evidence: actual A/B issuer separation, object/counter/retry isolation and cache mismatch rejection; actual production identity separation is a distinct inventory claim. Two local namespaces do not establish it.

T01-P11 — Browser/RSC/prefetch/HTTP matrix and evidence integrity.

- Requirement: real browser document and client navigation, emitted prefetch/RSC, redirects, safe notices, private images and conditional responses obey the same gates. Gap analysis requirement 12; spec testing scenarios.
- Files: browser/HTTP harness plus public routes/proxy/Worker under test. Browser automation details below.
- Local now: B01-B04 with synthetic routes. B05 onward after real management/provider fixtures exist. Hosted replay only against approved disposable URL.
- PASS evidence: sanitized browser network trace plus visible outcomes, actual status/content-type/cache policy/ID agreement and candidate hash. A forged `RSC: 1` curl request supplements but does not replace browser navigation evidence.

T01-P12 — Gate disposition and reproducible closeout.

- Requirement: no compatibility/ticket/readiness claim while a required row failed, is blocked, or remains unrun; artifact links and resource cleanup are complete. Adapter choice must cite evidence for the actual tested pinned combination.
- Local now: produce a per-case ledger with hashes, source requirement, fixture authenticity, runtime, expected/actual result, cleanup and blocker owner. Recover missing original ticket scope before completion.
- Provider logs/backups/restore and operating-target verification remain explicit launch gates rather than automatically being folded into Ticket 01. If recovered ticket wording includes them, add exact acceptance mapping without rewriting history.

## Provisional Ticket 02 acceptance matrix

Ticket 02 cannot close with synthetic tokens, artwork, a new QR generated by the agent, or successful typing of a URL. The absent physical input is a genuine external evidence gate. Local parser/round-trip work is executable now after implementation authorization.

T02-P01 — Authentic source and provenance.

- Required input: actual inventory export/workbook/CSV if used, raw printed Card ID, photograph/scan of the real printed QR, decoded QR payload bytes/text, raw NFC NDEF bytes and record metadata/text/URI, device/reader/OS method and time, source batch/provenance, expected destination and approved test handling. Preserve originals privately and hash them; report redacted summaries and artifact references.
- Source: gap analysis requirement 13; spec external legacy gate; Database legacy policy.
- Current: BLOCKED, no authentic sample located. `assets/card_design.pdf` and logo artwork are not proof of a manufactured/programmed Card.
- Human action: supply authentic samples/captures or a trusted operator's access to physical reader/camera. Once supplied, automated decoding/byte comparisons are engineering work; repeated human approval is unnecessary for already-approved read-only analysis.

T02-P02 — Exact token/encoding characterization without repair.

- Verify bytes, case, leading/trailing whitespace, Unicode composition, percent encodings, reserved characters, QR URL path/query/fragment and NDEF URI-prefix encoding. Distinguish printed ID, decoded CSV field, URL-encoded segment and framework-decoded route parameter. Decode each layer once as specified; never trim, case-fold, normalize or regenerate the identity to make tests pass.
- Files: lib/domain.mjs exact lookup, app/c/[cardId]/page.jsx, proxy route parsing, cards.public_token exact collation, future documented CSV parser/preview routes.
- Local now: deterministic text/JSON/URL and CSV fixtures clearly labelled synthetic; case pairs, leading/trailing spaces, NFC/NFD pairs, percent/plus/hash/query/slash behavior, malformed encoding and double-encoding. A parser rejecting a character is a compatibility result to resolve, not permission to rewrite printed identity.
- PASS requires observed real grammar/encoding behavior and exact round trips for supplied inventory classes; characterize practical predictability/entropy from provenance/generation evidence, never infer 128 bits from string length or a few samples. New-token randomness is separate from legacy acceptance.

T02-P03 — Exact CSV preview/atomic import behavior.

- Routes: POST `/api/admin/cards/import/preview`, POST `/api/admin/cards/import`; GET cards/detail/history. These routes/parser are absent. Do not invent single-Card creation transport to bypass the documented import boundary.
- Requirements: UTF-8 with optional BOM, exact case-sensitive headers card_id plus optional status, RFC 4180 quoting, exact nonempty decoded token including whitespace, optional Inactive-only status, ignore blank post-header lines, reject invalid UTF-8/malformed/duplicate/invalid rows as a whole, <=10 MiB and <=10,000 rows; 30-minute preview, actor/digest/integrity/expiry binding; 24-hour temporary expiry. Existing exact tokens skip unchanged, including concurrent insert; new Cards Inactive/unassigned with atomic history/audit/result.
- Local now: synthetic boundary and concurrency cases through HTTP/local DB after implementation authorization. Maximum-size parser tests stay local and do not mint 10,000 persistent provider Cards under the resource ceiling.
- Provider-backed slice uses only manifest-owned synthetic inventory. Authentic import/public use remains BLOCKED until grammar/provenance and destination authority are established; do not automatically insert real customer inventory into a test project.
- PASS evidence: public/authorized resource reads plus history show exact identity and all-or-none effects; skipped tokens unchanged. Synthetic PASS does not close authenticity.

T02-P04 — Actual QR and NFC device-to-browser destination.

- Read the real QR with a camera/scanner and real NFC NDEF with a compatible device/reader; capture the exact opened URI and resulting browser destination without changing the printed/programmed Card. Record at least each distinct supplied encoding/device path; do not claim universal device compatibility from one phone.
- Browser: B12 below. Rendering the already-decoded string in agent-browser is a downstream test, not a physical scan/tap PASS.
- If the encoded URL points at production, do not intercept, rewrite, provision or mutate production to make a test pass. Preserve the original and obtain a separately authorized read-only production check, or report the actual physical routing portion BLOCKED while exercising the same encoded token against a clearly labelled disposable test origin.
- PASS evidence: authentic capture provenance, decoded payload, actual device handoff URL, approved destination observation and exact match. Token equality and destination differences must be explained, not hidden by normalization.

T02-P05 — Stable identity through authorized lifecycle/content changes.

- Use approved synthetic or separately authorized representative test inventory to show Business name/content/current slug edits do not require a Card URL change; two Cards may reach one Business; deactivate/reassign/activate resolves the new Business; unassign and Disable deny; former slug stays reserved to its Business. Routes and transactions are T01-P02/P06/P07.
- Compare original token/hash before and after, confirm direct `/c/` rendering, and distinguish this software guarantee from authentic physical compatibility. Never reprogram or reprint the authentic Card to hide a compatibility failure.
- Current: implementation UNRUN; authentic evidence BLOCKED. Both dimensions must be recorded separately.

T02-P06 — Honest compatibility decision and artifact chain.

- Record supported observed inventory/encoding classes, rejected cases, exact unresolved mismatch, provenance hashes, commands/device procedure, whether samples were authentic, and remaining human/operator action.
- No invented universal grammar, sample entropy proof, manufacturing approval or Ticket 02 closure. Recover/adopt the ticket's actual acceptance list before final sign-off. Keep the legacy gate open until authentic evidence supports it.

## Execution order and commands

Commands below are builder instructions, not commands executed by this planning run. Use installed binaries or `npx --no-install` to avoid unreviewed installation/upgrades. Keep shell echo/tracing off for secrets; use protected environment injection, never command-line tokens, `printenv`, unredacted HAR or verbose authenticated curl.

C0 — Baseline and evidence recovery, local/read-only.

- `git status --short --branch`
- `git rev-parse HEAD`
- `git diff --check`
- `node --version` and `npm --version`
- `npm test`
- `npm run phase1:probe:offline` currently fails due to the absent script; fix/recover it before using its advertised result.
- Inventory all original ticket/handoff/evidence locations available to the supervisor. Copy neither secrets nor unrelated session transcripts into evidence. Record unknowns; do not fabricate original criteria.

C1 — Local repairs in small observable slices, after implementation authorization.

- Repair D01-D05, one failing public-boundary regression and minimal implementation per slice; then D06/D07 integration and D08 configuration as required. Agreed spec seams are application HTTP/browser plus direct provider bypass tests. Avoid adding tests that merely match source text or assert internal helper call counts.
- `node --test test/auth-boundary-wave-c.test.mjs`
- `node --test test/wave-a-request-id.test.mjs test/wave-d-idempotency.test.mjs`
- `node --test test/wave-e-public-authority.test.mjs test/wave-f-maintenance-remote-safety.test.mjs`
- Run newly added focused HTTP/integration tests using their documented entrypoint, then `npm test`. Existing tests should not be discarded merely because they pass; revise assertions that explicitly encode untrusted request IDs.

C2 — Fresh Next production build and local HTTP/browser server.

- `npm run build`
- `npm run start -- --hostname 127.0.0.1 --port 3101`
- Record process ownership, source hash, build result and origin. Stop only this owned process during cleanup. Restart after route/build changes. Never use the stale existing `.next` directory as current evidence without rebuilding.
- Confirm provider bindings are not remote-enabled before launching. Keep local fixture mode explicit and impossible to select accidentally in staging/production.

C3 — Explicit disposable local Worker config and adapter build.

- Prepare `.scratch/nextap/ticket1-2/<run-id>/wrangler.local.jsonc` with unique name, correct wrapper entrypoint, assets and only local bindings; resolve relative paths correctly. Do not inherit existing shared Worker/bucket names or production routes. The self-reference must refer to the disposable name.
- Inspect `npx --no-install opennextjs-cloudflare build --help` and `npx --no-install wrangler dev --help` before choosing version-specific flags. Build with the explicitly selected safe config supported by the installed adapter.
- `npx --no-install opennextjs-cloudflare build` is acceptable only after its resolved config and any automatic generation/provisioning behavior have been inspected and confined locally. Do not use `npm run deploy`, `npm run upload`, or an ambiguous preview command.
- `npx --no-install wrangler dev --local --config <absolute-safe-local-config> --port 8787`
- Verify no remote bindings/service fallbacks are used. A local emulator PASS is labelled local, never hosted provider PASS. Generated `.open-next` output is not hand-edited.

C4 — Packaging/type checks, local only.

- After safe configuration exists: `npx --no-install wrangler deploy --dry-run --config <absolute-safe-local-config>`. The required dry-run flag is not optional. Inspect output for target/bindings without revealing credentials.
- Generate/check environment types from that explicit config using Wrangler's installed `types --help`; align selected output filename and wrapper type references. Do not rely on the existing cf-typegen script's default config resolution.
- These checks prove packaging/types only. They do not prove runtime, provider access, permissions, decoder CPU/memory or security.

C5 — HTTP matrix against owned local origin, then approved staging origin.

- Example: `curl --silent --show-error --dump-header - --output /dev/null http://127.0.0.1:3101/b/old-harbor-coffee` (do not follow redirects for the first response).
- Example: `curl --silent --show-error --head http://127.0.0.1:3101/c/SYNTH-CARD-DEMO-001`.
- Use the harness for GET/HEAD/OPTIONS/unsupported methods, returned ETag reuse, malformed payloads, IDs, safe body/headers and controlled concurrency. Never hardcode historical ETags as current truth. Do not log arbitrary request queries or full real Card tokens.
- For protected requests, supply synthetic approved sessions through a secret-safe runner. Capture sanitized error/result fields, not Authorization/Cookie/Set-Cookie values.

C6 — Local SQL rehearsal, after local tooling is available.

- First inspect `npx --no-install supabase start --help` and `npx --no-install supabase db reset --help`.
- Prepare an isolated local Supabase workdir/config with unique project_id, owned Docker resources and copies of the exact reviewed migration bytes. Do not reuse the checked-in `.temp` linkage. Verify the target is loopback/local before any reset.
- Run `supabase start` and `supabase db reset --local` only from that isolated workdir, followed by the documented SQL/provider-boundary tests. Use secret-safe local connection injection if invoking `psql -v ON_ERROR_STOP=1 -f <reviewed-test.sql>`; do not put a credential URL in argv/logs.
- Docker/psql were not on PATH in this review. Resolve tool availability or record BLOCKED tooling; do not pretend static SQL balance is migration execution. A clean local DB is disposable; a linked/shared database is not.

C7 — Hosted provider execution, separately gated.

- Preflight read-only identity/migration history/permissions against explicit approved targets. Obtain permission for exact migration bytes, bounded fixtures, temporary Worker and storage operations before applying anything. No `supabase db push`, deployment or provider resource creation is authorized by this plan.
- Once separately approved, use explicit project/config references, inspect the migration diff/order, deploy only the disposable worker, run the same HTTP/browser/provider cases, then execute the manifest cleanup. Never select target by implicit CLI link/default.
- Stop at an incompatible existing schema, uncertain prior commit/migration, unapproved paid feature, cross-environment ambiguity or resource ceiling. Inspect/reconcile uncertain outcomes before retry, not blind redeploy/reset.

Sequence dependency: source/target evidence -> baseline defects -> safe local config/build/browser baseline -> local SQL constraints/auth and one durable command -> provider adapters and lifecycle/revision slices -> private image/reference/cleanup -> approved hosted browser/direct-provider matrix -> isolated cross-environment tests -> authentic sample checks -> cleanup and disposition. Independent local parser/image/HTTP work continues while external fixtures are blocked.

## Browser automation scenarios

Use the agent-browser skill if available: load `agent-browser skills get core` before any automation command and use that installed version's documented network/evaluation commands. Start a named session such as `nextap-t12-<run-id>`, use accessibility snapshots/ref-based interactions and capture sanitized network evidence. Check the CLI elsewhere on the host before installing; installation must not silently alter the project's dependency set. If unavailable, use an already approved browser/CDP harness or record browser UNRUN; do not replace it with curl and call that a browser PASS.

Run at a desktop viewport and a representative mobile viewport. Repeat relevant cases in production-mode Next and actual Worker; use only the owned local or approved disposable URL. Screenshots show visible outcomes but do not prove status/authorization; pair them with network evidence. Do not capture MFA secrets, QR enrollment codes, passwords, raw auth headers or authenticated storage state in the report.

B01 — Basic published and inactive navigation.

- Open `/`, click the existing active Card link, verify visible Business and unchanged `/c/SYNTH-CARD-DEMO-001` destination; then independent Business link and inactive Card link.
- Verify exact Inactive notice, no assigned Business/UUID/history, no console/runtime failures, mobile readability. Existing fixture disclaimer remains truthful; synthetic content is not authentic evidence.

B02 — Unavailable and alias routes.

- Directly open unknown Card/Business, Disabled Card/current slug/alias, and eligible old alias. Capture first network status and Location before browser follows the redirect, then target status and safe final page. Check request ID/cache policy on every hop, including unmatched application 404.

B03 — Genuine client navigation/RSC/prefetch.

- Navigate via actual Next links; trigger supported prefetch behavior by viewport/hover/navigation and record emitted requests and headers/content types. Do not assume a prefetch occurred because a Link component exists.
- Confirm no assignment/history/raw key/internal cache metadata is present in HTML, hydration/flight payload or browser-visible errors.

B04 — New network request after mutation and conditional requests.

- Warm document/prefetch/image state, record actual ETag, perform authorized mutation from a separate context, then initiate a new network request with that old validator. Assert new representation or 404/503, never revoked 304/308/content.
- Distinguish browser back/forward or in-memory retained content from a new request. Force and verify network activity for revocation assertions without claiming recall of delivered copies.

B05 — Admin session and provider MFA.

- Use approved individually provisioned synthetic Admin/non-Admin identities; authenticate and complete real provider TOTP. Verify session endpoint denial before MFA and after membership/session revocation, correct private/no-store and error IDs.
- No Admin login UI exists now. If a UI is outside approved compatibility scope, drive the documented HTTP/provider fixture setup and browser session surface without inventing a product dashboard or signup flow; mark UI-only cases unimplemented.

B06 — Session time and fresh sensitive actions.

- With controlled server session timestamps on disposable fixtures, test 30-minute idle and 8-hour absolute boundaries, expired provider JWT, and five-minute sensitive freshness for reassignment/Business enablement. Test replay after freshness/membership revocation. Do not wait eight hours or manipulate the host clock; distinguish controlled-time tests from actual provider behavior.

B07 — CSRF/origin and rate-control boundary.

- Use separate approved local origins/browser contexts to attempt cookie-authenticated mutation without valid origin/CSRF evidence; deny before effect. Verify bearer-only handling cannot fall back to a cookie and bypass protection.
- Use isolated rate counters/account fixtures for documented threshold and Retry-After tests; avoid locking out real Admins or shared provider accounts. Exercise absent rate store/trusted-proxy uncertainty as fail-closed. Login/MFA provider limits need separately approved bounded probes, not uncontrolled password guessing.

B08 — Two editors, retry and result reconciliation.

- Read the same version in two contexts, race documented lifecycle/edit HTTP calls, observe one valid commit and safe loser behavior through subsequent resource/history reads. Drop a response after commit with a controlled test transport, retry identical key/payload, and verify same operationId/result with one effect. Reread operation/resource after uncertainty; do not use a new key blindly.

B09 — Fresh authority through lifecycle/content/slug changes.

- Warm A; Disable -> new Card/current/alias requests deny. Deactivate -> exact Inactive notice while assignment is retained. Reassign while Inactive to B -> still Inactive. Activate -> direct Card route renders B, not A. Unassign -> Inactive/unassigned. Rename/current-slug change preserves permanent Card URL and reserves old slug. Inject cache read/write and authoritative-read failures; verify permitted fresh fallback or safe 503 with no mixed content.

B10 — Validated private image lifecycle.

- Through approved upload route, submit real deterministic JPEG/PNG/WebP bytes, then inspect served bytes and metadata. Exercise SVG/MIME spoof/animation/malformed/oversize/dimension limits. Obtain old public locator, replace/remove/Disable, then new GET/HEAD/If-None-Match requests deny old image; replacement survives failed cleanup, old current image survives failed reference commit.
- Do not use image_generation or third-party images. Generated local fixture bytes are explicitly synthetic.

B11 — Optimization/direct-storage/maintenance bypass checks.

- Request current and old image locators through `/_next/image`, trailing slash and any actually enabled Cloudflare transform paths. If disabled, prove no image bytes are delivered; if enabled, prove the same current-reference checks after revocation.
- Probe direct private-object/provider URLs with approved identities and no auth, without persisting reusable signed URLs. Run one bounded maintenance pass, verify old object absence and current image availability, retry idempotently; ambiguous reference authority must result in no deletion.

B12 — Authentic sample handoff.

- Pair actual QR scan/NFC tap evidence with the exact opened URL, then inspect only the approved destination in browser. Record real device/reader path and payload correspondence. If only captured bytes were supplied, report decoded-byte/downstream-browser PASS and physical-device UNRUN separately. Synthetic variants never satisfy authentic provenance or physical handoff.

For every case record candidate SHA/config hash, test ID, runtime/origin alias, synthetic/authentic flag, prerequisite mutation commit boundary, method/route template, status/content type, request ID agreement, Cache-Control/ETag/Location as relevant, redacted visible/serialized outcome, expected versus actual, artifact reference and cleanup owner.

## Disposable resources, ceilings, ownership and cleanup

These are proposed safety ceilings for a later authorized run, not permission to create resources or a claim of zero provider cost. Default authorized remote creations/writes in this planning run: ZERO. Reduce limits if provider quotas or approval are tighter. Raise them only through explicit approval, especially for paid capabilities/second environments/load tests.

Run identity: UTC timestamp plus short random suffix, e.g. `20261005t120000z-a1b2c3`; use `nextap-t12-<run-id>` for Worker/local project/browser session names and Business slugs. Use `nextap-t12/<run-id>/` for object keys and `SYNTH-T12-<run-id>-` for synthetic Card tokens. UUID database rows retain canonical UUIDs; track them in the run manifest rather than adding ad hoc schema columns. Do not alter real printed tokens to add a prefix.

Per run maximum:

- One owned local Next server and one local workerd process; one isolated local database stack. Bind loopback only. Do not kill by shared process name or delete another run's directories/containers.
- One disposable hosted Worker, only after deployment approval; zero production/custom-domain routes, cron triggers or public storage endpoints. Maximum planned Worker lifetime four hours, with cleanup before returning whenever possible.
- Zero newly created Supabase projects by default. Use at most one explicitly approved isolated primary staging project; a second nonproduction environment is a distinct approval/billing gate. Never treat a shared project as disposable simply because rows have prefixes.
- At most three synthetic identities in the primary environment (two Admins and one unrelated/non-Admin), plus one in a separately approved secondary environment when needed. MFA fixture credentials stay outside source/evidence. No real customer identities or production clones.
- At most two synthetic Businesses, six synthetic Cards, sixteen Sections (eight per Business), sixty total Links with no Business above its intended 50 limit, forty operation/preview records and twelve cleanup candidates at a time. Boundary violation requests should not leave extra committed rows.
- At most eight private fixture objects, each accepted object <=2 MiB, total stored fixture bytes <=16 MiB. Oversize/large-pixel rejection tests run locally before authorized hosted probes and should not persist raw rejected bytes. Two buckets at most if separately approved (private object and internal cache); prefer existing dedicated disposable-test facilities. Do not use the existing `nextap` or `app-name-opennext-cache` buckets without explicit target approval.
- Functional hosted test budget: <=1,000 requests total, <=4 concurrent requests, average <=2 requests/second, <=30 minutes of active probes; intentional rate-boundary cases count toward this budget and require isolated counters. Any load/soak/region latency campaign is separately authorized, never inferred from these functional limits.
- Planned incremental paid spend: zero unless explicitly approved. The selected USD 0-10 monthly operating assumption is not a disposable-test spending authorization. Provider free-tier availability/cost must be verified; stop if a required capability is paid or uncertain.

Manifest before the first side effect: run ID/owner, approved account/project/issuer aliases, exact resource identifiers and config/source hashes, prefix, creation approval reference, row/object/session IDs, creation time/expiry, ceilings/counters, cleanup method and verification status. Record creation response or uncertain outcome immediately so a timeout cannot orphan an untracked resource. Use idempotent reconciliation before a creation retry.

Cleanup procedure:

1. Stop new test activity and owned scheduling; hold/disable public test delivery. Capture sanitized final case results and resource inventory before removing evidence-bearing state.
2. Clear disposable image references only through approved commands, then delete only manifest-owned unreferenced object keys through the reviewed cleanup path. Current reference uncertainty blocks deletion. Never run bucket-wide/age-only/prefix-guess sweeps or delete a shared bucket.
3. Preserve Card immutability, permanent history and slug reservations. Application hard-delete endpoints must not be invented for cleanup. Prefer disposal of the whole explicitly disposable database/project/local stack using its approved procedure. In an approved shared staging project, pre-agree synthetic lifetime rows may remain disabled/unassigned; if complete cleanup is mandatory and no safe environment teardown exists, do not create them. Do not drop append-only triggers or bypass constraints to erase evidence.
4. Revoke disposable sessions and remove only approved fixture memberships/identities through an authorized process; FK-retained actors/history may require whole-environment disposal rather than per-user deletion. Do not destroy a shared identity service.
5. Delete only the manifest-owned temporary Worker/optional buckets after traffic is stopped and ownership verified; confirm absence through provider inventory. Do not modify the pre-existing Worker, routes or buckets. Remove only owned local processes/containers/test state and temporary secret files. Keep sanitized reports and hashes.
6. Record deletion confirmations and a final inventory diff. Cleanup failures become BLOCKED with exact resource alias/owner/retry action; do not claim clean completion or silently abandon a resource. Never print credentials while diagnosing cleanup.

## Provider evidence gaps versus human-only decisions

Locally executable engineering work: D01-D05 fixes, request/status/no-store matrix, missing probe harness, configuration selection, local builds/workerd, synthetic token/CSV/URL/byte cases, private image normalization, local real-DB constraints/transactions after tools are available, and deterministic browser/fault/retry scenarios. Missing code is an implementation defect/gap; missing local tool is a tooling prerequisite, not a new product gate.

Approved staging fixtures required: hosted signature/JWKS/Auth/TOTP/revocation checks; actual direct Data API/RLS/functions and private Storage denial; durable hosted transactions/migrations; Workers decoder/private object behavior; actual runtime caches/service binding/maintenance; two-environment rejection; provider quotas/log/native backup observations. Agents can execute these once access, exact target and permissible operations are approved. Neither mock tests nor source review can close them.

Genuinely human/operator-dependent inputs: authentic physical inventory/scan/tap capture; out-of-band Admin bootstrap/lost-factor identity verification; granting a missing account privilege or interactive MFA/account consent; approving new charges/paid backup features/second billable environment; selecting previously unspecified SLA/p95/p99/RTO/RPO acceptance limits; accepting an architecture change if no approved R2 decision exists; final launch sign-off. Stop only the dependent track and continue other authorized engineering work.

Operating targets remain planning assumptions: initial monthly USD 0-10, 1,000 Businesses x 100 public scans/day = 100,000 page requests/day (3M/month), and 5,000 x 100 = 500,000/day (15M/month). Average page rates are approximately 1.16 and 5.79 requests/second, not a peak-load model and not total image/API/authority traffic. Do not run a hosted campaign from these numbers alone. Verify actual plans/quotas/overages and available DB regions, measure from Egypt/relevant visitor locations, include fresh authority/cache/image costs, and record p95/p99/errors. No region, SLA, latency or recovery acceptance threshold is supplied; measurements without an approved threshold are observations, not PASS against an invented SLO.

Provider log/backup/restore gate: inspect actual native log/Auth/storage/backup contents, access, retention and deletion. A real restore rehearsal must use isolated approved recovery services with a hold outside restored Business/Card state, reconcile post-snapshot revocations/assignments/slugs/history/audit/retry results and image bytes, use a fresh cache namespace, and measure RTO/RPO against later approved limits. Application TTL, marketing documentation or an ordinary database export does not prove this gate. No restore/provisioning action is authorized here.

## Stop conditions and truthful reporting

Stop the affected operation immediately when:

- The target account/project/issuer/bucket/Worker is unknown, shared without approval, production, or differs from the manifest; the command would use implicit linkage/config or remote bindings unexpectedly.
- A build/tool would deploy/provision/upload, an approval/privilege/interactive account step is required, a paid capability/second environment is needed, or a ceiling would be exceeded.
- SQL history conflicts with reviewed migration assumptions; immutable legacy tokens/slug reservations/history would change; a direct provider bypass leaks hidden/private state; required audit/history/result atomicity fails.
- An image could be deleted without explicit no-current proof, a race/commit outcome is unknown, or an upload/operation timeout tempts retry with a new identity/key.
- A report/log/screenshot/HAR would reveal secrets or real private inventory; stop capture and retain only redacted evidence.
- Authenticity/provenance is absent or actual QR/NFC destination cannot be tested within approved authority. Do not reprogram the Card or substitute synthetic evidence.
- There is no authorized cleanup strategy, cleanup fails, or final resource inventory cannot be reconciled.

A missing prerequisite blocks only dependent rows. Do not stop local HTTP/parser/defect work because physical samples or a second hosted environment are unavailable. Do not label unimplemented code as a human gate to avoid building it. Conversely, do not fill a missing architecture decision or authentic sample with an assumption.

Evidence status rules:

- PASS: the named assertion actually ran, met its independent expected result, and has current source/runtime/fixture evidence. Qualify local/helper, local HTTP, local workerd, hosted provider, browser, and authentic-device dimensions separately.
- BLOCKED: a named prerequisite/approval/authentic input prevents execution or acceptance. State exact missing input, owner/action, affected cases and independently executable work. A generic “provider gate” is inadequate.
- UNRUN: feasible/planned but not executed, or evidence is absent/stale/unbound to the candidate. UNRUN is not PASS and not automatically a human blocker.
- Record actual failing observations as FAIL in the assertion/result field; the containing acceptance row remains open/BLOCKED by that implementation defect until repaired and rerun. Never convert a failed assertion into an environmental excuse or omit it to make a PASS/BLOCKED/UNRUN summary look cleaner.

Suggested case record: `{criterionId, source, provisional:true, caseId, candidateSha, configHash, runtime, fixtureKind, prerequisite, expected, observed, assertionResult, status, evidencePath, cleanupStatus, nextAction}`. Include no credentials or raw real tokens. Preserve prior runs instead of overwriting history; set a clear latest-candidate report index.

Current disposition: existing tests PASS 40/40; syntax PASS; offline probe runner FAIL/missing; five diagnostic defect reproductions FAIL their intended contracts; current build/browser/local Worker/SQL/provider/device checks UNRUN or BLOCKED as specified. Both tickets remain OPEN/INCOMPLETE with provisional acceptance mapping. The four external gates remain open. Neither this plan, the passing unit suite, nor operating assumptions establishes production readiness.

Builder return must include changed files and minimal rationale, per-criterion/case results, exact commands/runtime/config hashes, remaining defects, precise approvals/fixtures needed, resource creation/cleanup ledger, and whether original ticket scope was recovered/adopted. Do not deploy, push, open a PR, change tickets/specifications, or close either ticket as an incidental final step.
