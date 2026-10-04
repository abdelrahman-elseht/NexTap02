# NexTap02 continuation handoff

You are the new parent/orchestrator session. Keep your own context clean. Delegate all substantive work to other agents and answer only human questions that are truly needed for decisions. Never ask the user to resolve repository facts or low-level implementation details you can delegate.

## Objective
Finish and align these five docs from `docs/vision.md`:
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/FLOWS_AND_API.md`
- `docs/SECURITY_AND_EDGE_CASES.md`

The previous orchestration session was corrupted by repeated workflow/recovery failures. Existing docs and artifacts are valuable drafts, not approved final docs. Do not blindly trust stale unresolved labels; use the authoritative ledger.

## Authoritative decisions
Read `.atomic/recovery/accepted-decisions.json`, which contains 47 verified parent-chat decisions. It overrides stale owner artifacts. No document has final approval. Important settled choices include: Admin-only v1; English docs; analytics deferred; `/b/{slug}` included; Next.js + Supabase; Cloudflare Workers target with adapter deferred pending compatibility; separate staging/production; internal UUIDs; atomic safe CSV import; deactivate-before-transfer with lifetime successful Card history and simple Admin UI; explicit Business enablement; no owner link; reserved redirecting slugs; one section per type; weekly structured hours/timezone; unified contact fields; external payment URLs; direct `/c/{Card ID}` render; private HTTP/JSON Admin API; stable JSON errors; CSV-only import; mandatory TOTP MFA; 128-bit randomness for future IDs while preserving legacy; image limits/sanitization; audit retention; expected-version concurrency; independent activation while Business disabled; fresh fail-closed eligibility; gated private images; lifetime history; 8h/30m sessions and fresh TOTP; RLS/restricted projection; safe content bounds; tiered limits; atomic audit failure; minimized logs/provider review; explicit Admin commands; idempotency keys + expected versions; standard HTTP statuses; cursor pagination; operating targets deferred to prelaunch; revision-keyed cache after fresh gate.

The user explicitly added: questions must appear in this parent chat, never agent terminals; communicate with agents via Intercom; parent is orchestrator only.

## Existing recovery artifacts
- `.atomic/recovery/handoff.md`
- `.atomic/recovery/accepted-decisions.json`
- `.atomic/recovery/unanswered-batches.json`
- `.atomic/recovery/result-channel-repair.md`
- `.atomic/recovery/url-parser-fix.md`
- Existing continuation candidates/reports under `.atomic/workflows/runs/vision-docs-continuation/14e5e5be-3001-4733-b48b-e0ef3e896d8f/`.
- The last workflow stopped because the user declined the Database approval after asking what remained unfinished. No docs were finalized.

## User's latest substantive concern
The user asked: what remains unfinished, and is it hard to finish? Correct answer: much of it is technical detail that should be completed by delegated agents, not another broad user interview. Finish concrete contracts: schema tables/columns/constraints/indexes/revision/history/idempotency; exact API endpoints/payloads/status examples/retry retention/import preview; architecture sequences/storage/restore/cache; security enforcement and failure matrix. Keep genuinely external gates visible: actual legacy token sample/grammar; Cloudflare adapter compatibility; provider log/backup/restore capabilities; operating targets explicitly deferred.

## Execution rules
1. Delegate five focused agents in parallel, one per doc, plus reviewers if useful. Use GPT-6.1 Sol high if pinning is supported.
2. Agents may inspect repo and docs and edit only their owned doc/artifact. They must coordinate through Intercom, but must not ask the user directly. Parent relays any real decision questions here using `ask_user_question` and sends exact answers back.
3. Do not re-ask the 47 settled choices.
4. Agents should finish technical details with explicit recommended defaults when these are implementation details, while preserving external verification gates. Only escalate material product/security/operational decisions.
5. Run a bounded consistency/review pass across all five docs. Fix stale “unresolved” labels that conflict with the ledger. Keep open gates explicit.
6. Before finalization, show concise per-document shared-understanding summaries here and ask for scoped Proceed/Decline approvals. Approval is documentation-only, not implementation/publication permission.
7. Verify all five files are nonempty, internally consistent, crosslinked, and clearly separate settled decisions, technical contracts, proposals/defaults, and deferred gates.
8. Do not use the broken old workflow run. It is terminal/blocked. Prefer a fresh lightweight workflow or delegated agents with durable artifacts. Do not spend time on elaborate workflow recovery unless needed.

## Style
Use plain English, sentence-case headings, no AI puffery, no unnecessary comments. Cite `vision.md` sections and local evidence. Preserve uncertainty honestly. Do not commit or create a PR.
