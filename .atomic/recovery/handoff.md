# Vision Docs Recovery Handoff

## Outcome

Original run `7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8` is terminal: `blocked`, `exited: true`, `resumable: false`, all five agent stages `completed`, all five documents `draft-unapproved`. Do not resume, restart or replay it to finish authoring. Duration was `4730505 ms` (78m 50.5s), not the setup estimate of 15-25 minutes plus interview time. The setup record's "not launched" status is historical, not current.

Verified **47 actual user answers**, including the latest Q42-Q47. No document-scoped final approval exists. At this cutoff there are **zero complete unanswered question/options batches** in the original owner artifacts; their null/pending answers are stale, not unanswered user decisions.

Artifacts created:

- `.atomic/recovery/accepted-decisions.json`: all 47 exact questions, answers, stable keys, exact selected option descriptions and parent transcript evidence. Q9's custom answer retains its trailing space; its interpretation is separately attributed to the parent's actual relay.
- `.atomic/recovery/unanswered-batches.json`: empty genuine unanswered-batch list, per-owner stale entries and incomplete detail topics. Do not fabricate options for incomplete topics.

## Failure Cause And Evidence

The workflow used one agent fan-out for both drafting and a continuing human interview. After the parent-only-question amendment, several owners returned while human decisions and approval were still pending. Returning a Draft is normal model-stage completion, not a durable suspended interview. The root has no `ctx.ui` checkpoint between completed owners and its final file/approval check; `.atomic/workflows/vision-docs.ts:71`, `:106`, `:128` show the immediate fan-out/check/terminal-blocked shape. A broadcast transport receipt is not proof that a completed owner consumed or persisted its answers.

Parent transcript `C:/Users/elseh/.atomic/agent/sessions/--F--projects-NexTap02-main--/2026-10-02T19-19-48-634Z_01a0fe0e-f69a-7bb4-b4b7-77f5c0ee37ae.jsonl`: line 118 completes Architecture before its pending Q5/Q6 results at 120; line 134 completes Flows/API before its Q20-Q23 answers; lines 267-268 complete Security and end the root; line 297 confirms terminal state/duration. Lines 272-273 capture both exact-session ask failures: `Completed workflow stage could not process intercom ask: [object Object]`.

Installed Intercom `dist/builtin/intercom/index.bundle.mjs:6336` converts a non-Error rejection with `new Error(String(error))`, and `:6338` supplies that exact completed-stage failure prefix. This proves a destination closed-stage delivery rejection and lossy error formatting, not a model/provider failure. The original rejection object/stack is not preserved in this message, so a deeper SDK admission/reopen cause is unverified. Late retained-owner replies subsequently reached the parent; do not claim all retained sessions are invalid or blindly repeat the failed asks.

Installed `docs/workflows/operations.md:311` permits stage-targeted resume for **live paused** work; `:349` rejects revival of terminal runs; `:353` distinguishes detached post-mortem chat from execution resume; `:357` recommends a new workflow for tracked work after a terminal root. Post-mortem turns may edit files but cannot update the old DAG/checkpoints/results (`:359`). They are not the recovery mechanism here.

## Owner Inventory

All owner JSON files are under `.atomic/workflows/runs/vision-docs/7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8/`. Counts below are recorded answer-bearing decisions, not a claim every cross-owner answer must be copied verbatim into each document.

| Owner | Answers Recorded / 47 | Complete Unanswered Questions | Remaining Work |
| --- | --- | --- | --- |
| product | 30 / 47 | 0 | Reconcile activation/history/security/API/cache decisions; vocabulary and acceptance summary; scoped approval. |
| architecture | 41 / 47 | 0 | Apply Q42-Q47, especially newly accepted content-cache/operating-target choices; retain explicit adapter/prelaunch gates; scoped approval. |
| database | 20 / 47 | 0 | Apply later shared/local answers. Four incomplete detail topics: `database.public-token-policy`, `database.content-shape`, `database.activation-timestamps`, `database.publication-revision`. These are not four approved questionnaire entries; recompute against settled entropy/cardinality/history/revision decisions. Scoped approval. |
| flows-and-api | 8 / 47 | 0 | Reconcile original API batch and Q42-Q45. Two incomplete topics: `api.mutation-publication`, and the explicitly unchosen key-retention duration within `api.idempotency-concurrency`. Broad retry and HTTP-status policies are already selected. Scoped approval. |
| security-and-edge-cases | 41 / 47 | 0 | Local interview frontier settled. Reconcile latest API/cache answers and peer repairs. `security.json-body-limit` and `security.content-schema-details` remain implementation-bound details, not complete user batches. Scoped approval. |

Security recorded one consistency exchange with four missing peer repairs (`security-and-edge-cases.json:64`); the others retain zero completed exchanges. Do not infer consistency acceptance or document approval from transport delivery, readiness UI, peer recommendations or the 47 policy selections.

## Supported Continuation Shape

Delegate a separate authoring pass to **create and validate, but not run**, a task-specific continuation workflow. No continuation definition was created in this diagnostic pass; no registry reload/input validation was performed. Proposed input contract: `acceptedLedger` string defaulting to `.atomic/recovery/accepted-decisions.json`, `sourceArtifactDir` string defaulting to the original owner-artifact directory, optional `objective` string constrained to documentation reconciliation. No implementation/Git permission.

1. Exactly five fresh parallel reconciliation stages, one per existing document, model `rawchat/gpt-6.1-sol:high`, fresh context, restricted ownership. Consume the ledger and originals, preserve source/approved decisions, update only the owned draft and new run-scoped artifact. No direct question tool, no finalization or inferred approval. Return candidate and genuinely NEW questions only; do not reopen ancestors.
2. Require a structured stage result containing `owner`, `document`, `candidateArtifact`, `status: candidate|blocked`, `approval: null`, `appliedDecisionKeys`, `sources`, `newQuestions` and `unresolved`. Each new question needs exact `key`, `question`, settled prerequisite keys, recommendation and 2-4 exact `{label,description}` options. Separate facts, explicit deferrals and incomplete implementation contracts from human choices.
3. After every stage returns, root deterministic artifact/schema/ownership barrier checks all five candidates, deduplicates keyed questions and excludes already answered keys. Root `ctx.ui.select`/`input`/`confirm` creates durable awaiting-input checkpoints; never terminal `ctx.exit(blocked)` for an ordinary human wait. Do not use arbitrary `ctx.ui.custom` widgets: programmatic `workflow answer` refuses them (`operations.md:439`).
4. Parent inspects `workflow status` for exact prompt/run/stage IDs, asks the human in parent chat, then relays **actual** selections with `workflow answer`. Root persists answer evidence using durable `ctx.tool`. If content must change, dispatch fresh, distinctly named tracked reconciliation stages after answers; do not reopen terminal stages or create backward DAG edges. Present scoped understanding and each document's unresolved items before its own Proceed/Decline checkpoint. Approval binds the candidate content; material changes require renewed scoped approval.
5. Only after explicit scoped Proceed may a fresh owning finalization stage mark that document approved. Final root barrier checks all five scoped approvals and nonempty documents. Human waits stay root-owned, without idle agent slots or blocking Intercom ask chains.

Read-only actions accepted: `status`, `stages`, `stage`, `transcript` with the exact run ID. Parent-only `answer` accepts the pending `promptId` plus `response`/`text`/`message`, with exact listed stage ID when needed; it does not resume or steer. `pause`/`quit`/`resume` are future continuation controls only, by explicit handoff; cross-process resume is whole-run, not stage-scoped. No lifecycle control was invoked here. Estimated continuation reconciliation is 10-20 minutes plus remaining human interview, not a runtime budget.

## Validation And Scope

Node assertions passed: 47 unique decision keys; every question/answer/kind and selected description matches the actual successful parent tool result; custom answer preserved byte-for-byte; five original approvals remain null; both recovery JSON files parse. Root state was checked against captured structured workflow status, not inferred from Intercom presence. Failure logs were inspected, not reproduced through another side-effecting ask. No five-document edits, implementation, Git commands, provider credential inspection, lifecycle changes, owner relaunch or workflow execution occurred.
