# Recovery seed handoff setup

## Outcome and exact launch inputs

The existing registered workflow **`vision-docs-continuation`** now accepts an optional, guarded recovery seed. No additional workflow name or graph was authored. The parent can reload its registry and launch a **new root run** of the corrected definition in `F:/projects/NexTap02-main` with this exact input object:

```json
{
  "reuseCandidateDir": ".atomic/workflows/runs/vision-docs-continuation/5c5087c4-cc46-4444-b870-670018f926b6/round-0"
}
```

The existing defaults expand that object to:

```json
{
  "acceptedLedger": ".atomic/recovery/accepted-decisions.json",
  "sourceArtifactDir": ".atomic/workflows/runs/vision-docs/7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8",
  "reuseCandidateDir": ".atomic/workflows/runs/vision-docs-continuation/5c5087c4-cc46-4444-b870-670018f926b6/round-0"
}
```

`objective` can remain omitted. Omitting the optional seed entirely retains the normal five-owner initial round; the recovery launch above must include it. The exact owner model remains `rawchat/gpt-6.1-sol:high`, constrained to `rawchat/gpt-6.1-sol` and effort `high`.

The parent reports that the old executor was gracefully quit. This handoff supersedes the resume/host-restart recommendation in `result-channel-repair.md`: start a fresh run after reloading the corrected definition, reuse validated work, and leave the parent chat uninterrupted. Do not resume the old run or restart/shut down the host. No lifecycle action was performed or independently rechecked during this setup.

## Seed behavior and retained ownership

Before any reconciliation stages, root's deterministic `import-validated-recovery-seed` tool:

1. Reads the three authoritative Product, Architecture, and Database report files and validates each against the existing strict TypeBox `reportSchema`.
2. Requires the exact owner/document, a source `candidateArtifact` resolving to that report, `status: candidate`, `approval: null`, all 47 distinct ledger decision keys, and zero new questions.
3. Checks the current owned document against its saved handoff hash, rather than trusting report prose or peer acknowledgments.
4. Preflights all three import destinations. A differing existing target is rejected; an identical import permits deterministic retry. Missing/invalid seeds fail instead of silently falling back to completed-owner authoring.
5. Writes new-run round-0 copies with only `candidateArtifact` changed. Sources, verification text, peer evidence, unresolved entries, approval summaries, and decision keys remain equivalent to the original report values. Root loads those reports into its report map.
6. Writes `<new-run-dir>/seed-import.json` with the execution reason, source/imported report hashes, saved/current document hashes, original and mapped artifact paths, `approval: null`, three completed owner names, and two pending owner names. Original seed report paths also enter root's protected source hash inventory.

The import uses synchronous filesystem operations inside a deterministic root tool with `timeoutMs: 10_000`. A root input guard also rejects explicitly empty/whitespace seed paths; this is necessary because the installed SDK's text input validator checks type but does not enforce `minLength` in that dispatch branch.

All five document owners remain represented. The **initial model frontier contains only `reconcile-flows-and-api` and `reconcile-security-and-edge-cases`**. Product, Architecture, and Database are completed through deterministic import and do not repeat their initial document work. Existing bounded later frontiers remain available only if genuine new parent-relayed answers affect owners.

The repaired normal path still reads and validates the expected on-disk report directly; no stage result schema or `structured_output` result channel was reintroduced. Root rejects applied decision keys outside its settled ledger/actual-answer evidence. Seeds add no decisions or answers. Owner user-question tools remain unavailable, and the existing root prompts require parent-chat relay.

## Approval and peer-check safeguards

Root's existing blockers, candidate freeze, peer hash comparison, crosslink/source checks, five scoped Proceed/Decline gates, candidate/final SHA-256 bindings, exact status transition, finalization preflight, and five-document verification remain unchanged. Seed import grants no document approval. Existing incomplete peer checks remain incomplete; stale checked hashes are explicitly exposed as incomplete by root before hashes and approval prompts are frozen. Current hash equality does not upgrade an already incomplete semantic check.

**Existing readiness limitation:** all three retained reports contain an unresolved `kind: fact` item:

- Product: `database.legacy-token-sample`.
- Architecture: `database.legacy-inventory`.
- Database: `database.legacy-token-inventory`.

Their prose describes the absent legacy inventory/sample as an implementation dependency rather than a Draft-candidate blocker. However, the existing root code blocks every unresolved `fact` or `decision`. Thus, if these reports remain unchanged, root will retain the completed work and stop before approvals after the pending frontier/question processing. This setup does not alter report classifications, remove evidence, infer approvals, or change that policy. All-five approval/finalization safeguards are preserved but approval readiness is not asserted.

## Validation evidence

- Final isolated in-memory SDK `reload`, `get`, and `inputs` passed: **11 workflows, generation 1, diagnostics `[]`**. The registered name is unchanged, both existing defaults remain intact, and `reuseCandidateDir` is optional. This isolated inspection does not reload the parent's separate live registry.
- Corrected module import passed without calling `definition.run`.
- Three valid input objects passed strict TypeBox checks after SDK default resolution. Empty/null/numeric/boolean seed values and an unknown key were rejected by the strict schema. The actual root input guard separately accepted omission/a valid path and rejected empty/whitespace/null/numeric/boolean values.
- **16 actual seed-guard scenarios** passed in an in-memory filesystem: valid seed and identical retry; missing directory/report; malformed JSON; wrong owner/document/artifact; non-null approval; blocked status; additional property; unknown/incomplete decision keys; a new question; saved document hash drift; and a differing existing destination. All 14 invalid scenarios failed before any imported artifact writes. Valid cases retained all original report evidence except the mapped artifact field, recorded source/imported hashes, loaded three reports, and selected only API/Security.
- **Seven normal authoritative-report guard scenarios** passed: valid mapped report, wrong owner, wrong path, non-null approval, extra property, malformed JSON, and missing report. Validation used the actual extracted schema/guard code, with no model extraction result.
- Source inspection confirmed one parallel frontier call, the exact requested model/effort, finite 10-second deterministic tool timeouts, no `schema: resultSchema`/`results[index]`, and the existing five-approval finalization guard.
- A before/after SHA-256 comparison confirmed **21 retained files unchanged**: ledger, inventory, earlier recovery/setup/handoff notes, old continuation source/answer manifests and three reports, all five original owner reports, vision, and all five current documents. The old pending API/Security report paths and old approval directory remain absent. The ledger still has 47 distinct answers and five null approvals.

The original report hashes remain:

| Owner | Original report SHA-256 |
| --- | --- |
| Product | `1adf24b03ed4eeb3fe74e1d9da7c7a246740583da397447a5393c9819595c0c3` |
| Architecture | `e499c25656864f989602e0b1c6edc9361e52a195654af4e4e06e3f3c8bb91391` |
| Database | `5cae1031609f8d29603785f296c51ae027ca2bc10d827f44e3f620d204bb2996` |

Required current document hashes were verified and are encoded in the import guard:

| Document | SHA-256 |
| --- | --- |
| `docs/PRODUCT_SPEC.md` | `0bd509673eb8a44dc051a726037574e164ef4880844e581c22509ee4a7643c55` |
| `docs/ARCHITECTURE.md` | `1a57cf9917e6780e29e343843359ebe7afc581f3e8c312fc63cc87fc926cdd70` |
| `docs/DATABASE.md` | `992f5da8f61ebd2e04fd3447a214b7ea438a423bfb79bb54bc41a6084d4c3dc4` |

Final workflow SHA-256: `20289e55e457938bee0a0c7afaaebc283758792e291f40b60f72c52b3f4c4778`.

Throwaway validation attempts initially hit a shell-escaping syntax error and a missing script import; both were corrected before the successful checks above. No persistent validation/test harness was created. Full static typechecking, live owner execution, provider availability, durable replay, human relay, and final filesystem application were not exercised.

## Changed paths and parent next action

Changed workspace files:

- `.atomic/workflows/vision-docs-continuation.ts`.
- `.atomic/recovery/seed-handoff-setup.md` (this findings artifact).

Maintained the requested external progress record at `C:/Users/elseh/.atomic/agent/sessions/--F--projects-NexTap02-main--/subagent-artifacts/progress/342feb8d/progress.md`.

No workflow launch/run/quit/resume, host lifecycle action, runtime database/harness change, Git command, implementation, document/ledger/original report edit, or human prompt occurred. Parent next action is to reload its own workflow registry and launch the existing registered name with the exact recovery input object above. **Three owners reuse completed work; only two run in the initial frontier.** The retained fact-blocker limitation is explicit, and no approvals exist yet.
