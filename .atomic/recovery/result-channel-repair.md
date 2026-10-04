# Result-channel repair

## Outcome

The workflow definition is repaired and validated. The model result channel no longer uses `structured_output`; the root now treats the on-disk owner report as the authoritative handoff and validates it deterministically before question/frontier processing. No workflow execution, resume, quit, new run, document write, ledger write, approval write, or runtime database mutation was performed here.

## Root cause

Each owner stage used `schema: resultSchema`, which makes Atomic require a final `structured_output` call. The owner had already written and reread a valid report, but the redundant three-string extraction failed repeatedly with `Structured output failed across 1 model candidate(s).` Calls interrupted by pause returned `Structured output cancelled; no decision was accepted.` The redundant channel prevented stage completion despite valid report files.

Product's retained transcript, `C:/Users/elseh/.atomic/agent/sessions/--F--projects-NexTap02-main--/2026-10-02T21-51-04-679Z_01a0fe99-73e6-7dfb-b8c8-3eeabd7fd473.jsonl:78-79`, records the exact three-string state and failure. Architecture's transcript, `2026-10-02T21-51-05-782Z_01a0fe99-7836-7976-92bc-de1bb1741b1c.jsonl:84-85`, records the same failure. The tool results contain empty details and no provider stack; the underlying inference failure is unverified. The workflow defect is requiring inference for a deterministic artifact reference. Atomic SDK documentation `docs/sdk/reference.md:327-334` confirms that this tool infers a new result instead of capturing the calling model's arguments. Installed stage code `dist/builtin/workflows/src/index.js:52325-52352` adds that tool whenever a stage has `schema`.

## Fix applied

Changed only [vision-docs-continuation.ts](F:/projects/NexTap02-main/.atomic/workflows/vision-docs-continuation.ts):

- Removed the `resultSchema` declaration and `schema: resultSchema` from the owner stage.
- Removed all `results[index]?.structured` and model-result reference checks.
- Owner stages now finish with the artifact path in ordinary final text and are explicitly forbidden to call `structured_output`.
- Root checks each expected report path exists, parses as JSON, passes the authoritative TypeBox `reportSchema`, and matches the owner, document, and exact round-scoped artifact path.
- Added a reuse instruction: when an existing report matches the report contract, owner, document, artifact path, candidate/blocked status, and `approval: null`, the owner reuses it without document/report rewriting. This lets the three retained reports survive recovery and prevents duplicate content work.
- Existing root durable prompts, exact Proceed/Decline approval gates, null approval policy, source hash protection, candidate freeze/hash logic, and final verification were left unchanged.

The corrected workflow SHA-256 is `16a2cd2c86486c12af15b95a4ce22ce36e195073b863314d5aa6d82eac9e9ee8`.

## Evidence and validation

The installed Atomic SDK was used as the authoritative registry/schema interpreter.

- Reload of the corrected definition succeeded: 11 workflows, generation 1, diagnostics `[]`.
- `get` and `inputs` succeeded for `vision-docs-continuation`; its three declared inputs and defaults are unchanged.
- Corrected module import succeeded without executing `run`.
- Deterministic root-guard validation accepted the existing Product, Architecture, and Database reports without any stage structured result.
- The same guard rejected missing reports, malformed JSON, wrong owner, wrong `candidateArtifact`, non-null approval, and additional report properties.
- Source inspection confirms one `ctx.parallel` frontier, no `schema: resultSchema`, no `results[index]`, no instruction requiring `structured_output`, and no fallback model configuration.
- Existing reports passed the installed TypeBox interpreter:
  - Product: `1adf24b03ed4eeb3fe74e1d9da7c7a246740583da397447a5393c9819595c0c3`
  - Architecture: `e499c25656864f989602e0b1c6edc9361e52a195654af4e4e06e3f3c8bb91391`
  - Database: `5cae1031609f8d29603785f296c51ae027ca2bc10d827f44e3f620d204bb2996`
- Each retained report is `status: candidate`, `approval: null`, has all 47 settled decision keys, and has zero new questions.
- Source snapshot hashes, accepted ledger, unanswered inventory, `new-answers.json`, five Draft documents, setup/history records, and the three existing reports remain unchanged. The two pending report paths and approval directory remain absent.
- A byte-equivalence check confirms the root initialization, source protection, question relay, candidate freeze, scoped Proceed/Decline gates, and final verification portions are unchanged from the retained pre-repair definition.

The successful registry check used only `reload`, `get`, and `inputs` in an isolated in-memory SDK session. It does not refresh the parent's separate live registry. An initial inspection call used the wrong argument key (`name` rather than `workflow`) after reload succeeded; the corrected `workflow` argument passed. The first throwaway schema check needed TypeScript stripping; the corrected check passed. No persistent test files were created. Live model-stage completion and durable replay remain untested because execution and lifecycle actions are outside this repair's authorization.

The Draft document status check uses the existing files' actual status lines. FLOWS_AND_API and SECURITY_AND_EDGE_CASES have the earlier draft wording rather than the canonical one-line status; they were not edited here and remain owner work for the pending stages.

## Resume semantics and parent action

Atomic's operations documentation says reload preserves an in-flight run's starting definition (`docs/workflows/operations.md:811-817`). Therefore, simply reloading and live-resuming the currently paused run would continue the old schema-bound definition and is unsafe.

The supported mechanism is same-ID durable replay after the old executor and stage controls have retired, rather than a live pause/resume. Parent next actions:

1. Inspect exact run `5c5087c4-cc46-4444-b870-670018f926b6`. Reconfirm paused state, usable durable checkpoints, resumability, no in-flight/abandoned owner writes, and the retained report/document hashes listed below. The last observed parent pause acknowledgement is in the parent transcript at line 440; this repair did not control or re-query that host.
2. Parent may gracefully `quit` this whole run, then inspect the durable paused/resumable result and any `cancelledTools`/`abandonedTools`. Do not assume the host retired solely from a pause/quit acknowledgement. Installed `classifyDurableResumeShadow` (`index.bundle.mjs:119434-119449`) explicitly refuses durable redispatch while the old job or stage controls still exist. A same-process `resume` can therefore keep using the old definition even after quit.
3. The dependable path is an orderly host/process retirement after confirmed durable quit, then reopen the original parent chat in a fresh Atomic host. Refresh its workflow registry and inspect the same exact run read-only. `operations.md:335` distinguishes pause from quit; `:674` documents same-ID checkpoint replay; `:815` distinguishes live reload from explicit replay after process exit. Do not terminate an owner with unresolved write cleanup and do not use the original terminal run `7d321cbd-...`.
4. Before explicit resume, parent uses ordinary Intercom to queue a protected correction for this invocation's owners. Durable incomplete-session resume substitutes a continuation prompt for the newly authored prompt (`index.js:37139-37145`, `:37212-37215`, `:47277`), so prompt edits alone may not reach retained Product/Architecture/Database histories. Suggested text: `<keepContext>Result-channel repair: finish in ordinary final text with your expected report path; never call structured_output. Reuse an existing report only if it validates against its contract and matches your owner, document, exact round path, status candidate/blocked and approval null. Product/Architecture/Database reports are already validated; do not rewrite these reports or docs or repeat content work. API/Security proceed with their existing owner scopes if no report exists. Read-only cross-checks are bounded; stale peer hashes remain incomplete. Root owns every durable human question and exact scoped Proceed gate. No document approval is inferred.</keepContext>` Discover addresses with Intercom list; a `workflow:<runId>/**` send is sticky for pending stages. Do not resume merely to deliver this correction.
5. Parent explicitly resumes the exact whole run with no `stageId`, no new run, and no model substitution. Durable resume resolves the current definition by name and invocation cwd (`index.bundle.mjs:106638-106640`; discovery callback `:115187`), launches with `runId: resolved.workflowId` (`:106719-106726`), and replays completed checkpoints. Stage identity/order remains the same five reconcile names, followed only by existing distinctly named repair frontiers; no ancestor reopening or backedge was introduced.
6. Inspect the actual resume result and stage progression. Completed stage checkpoints replay if present; a valid report file alone is not a completed stage checkpoint. Incomplete first-three stages still need a brief path-only completion turn with the corrected schema-free options. API and Security then perform only their pending owner work. Root revalidates all five reports and preserves its existing human gates.

This is a supported-code recommendation, not proof that this paused run currently has sufficient durable state or that its replay will succeed. If status shows nonresumable state, cleanup remains pending, or resume reports insufficient state/topology mismatch, preserve the exact diagnostic and stop. Minimal fallback proposal: a separately authorized recovery-only followup can consume the same three validated reports read-only, run only the two missing owners, and reuse the unchanged root validation/human approval gates. No followup definition or extra run was created here.

Snapshot reconciliation at `2026-10-02T22:39:27.086Z` confirmed unchanged documents since repair entry:

| Document | SHA-256 |
| --- | --- |
| `docs/PRODUCT_SPEC.md` | `0bd509673eb8a44dc051a726037574e164ef4880844e581c22509ee4a7643c55` |
| `docs/ARCHITECTURE.md` | `1a57cf9917e6780e29e343843359ebe7afc581f3e8c312fc63cc87fc926cdd70` |
| `docs/DATABASE.md` | `992f5da8f61ebd2e04fd3447a214b7ea438a423bfb79bb54bc41a6084d4c3dc4` |
| `docs/FLOWS_AND_API.md` | `23d970e19053fb8a92a7b7507af10f7a319e03fcb219a016eb18072a486b0f44` |
| `docs/SECURITY_AND_EDGE_CASES.md` | `456608dcc3d03e4dda5e6483051249367c9e1ca00d9375fd7691777831e641bf` |

## Files changed

- `.atomic/workflows/vision-docs-continuation.ts`
- `.atomic/recovery/result-channel-repair.md` (this report)

No other workspace file was changed by this repair.
