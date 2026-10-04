# Legacy sample gate policy repair

## Scope

The existing `vision-docs-continuation` definition was repaired in place. No workflow was launched and no implementation, Git action, user question, document edit, ledger edit, or immutable report edit was performed.

The source evidence supports exactly three legacy sample facts:

| Seed owner | Exact key | Immutable seed report SHA-256 |
| --- | --- | --- |
| Product | `database.legacy-token-sample` | `1adf24b03ed4eeb3fe74e1d9da7c7a246740583da397447a5393c9819595c0c3` |
| Architecture | `database.legacy-inventory` | `e499c25656864f989602e0b1c6edc9361e52a195654af4e4e06e3f3c8bb91391` |
| Database | `database.legacy-token-inventory` | `5cae1031609f8d29603785f296c51ae027ca2bc10d827f44e3f620d204bb2996` |

The three exact report details state that the inventory/sample is absent, printed-token grammar or URL compatibility remains unverified, existing printed tokens must be preserved exactly, and the absence does not block a truthful documentation candidate. Repository evidence agrees: no inventory workbook/sample was found; no token decoding or compatibility result was invented.

## Policy change

During deterministic import into an `IMPORTED NEW RUN` report copy only, the code now requires the owner-specific key, exact original detail, and original `kind: "fact"`. The source report hashes above were independently verified unchanged during this repair and remain protected by the existing run source-hash inventory. Only the exact matching entry is copied as `kind: "deferred-gate"`.

The copied detail begins with `UNRESOLVED prelaunch legacy verification gate; source classification fact.` It retains the exact original detail as `Original detail: ...` and records source report SHA-256, accepted ledger path/keys, document path/hash, the missing-sample rationale, and the explicit requirement to verify actual printed tokens before legacy import, manufacture, implementation, or public use. No sample, entropy, grammar, or compatibility result is inferred. `status` and `approval` are unchanged. The strict schema remains unchanged; provenance and rationale are in the existing `detail` string.

Every other fact, any changed exact detail, any wrong owner/key pairing, any decision, and blocked owner status remains a root documentation blocker. The root approval prompt visibly lists deferred legacy gates and states that document approval does not satisfy them or authorize legacy import, manufacture, implementation, credentials, or publication.

## Validation

- Red-to-green seam check: before the repair, the exact known seed fact remained `fact` and the check failed; after the repair, the exact three imported entries became visible unresolved `deferred-gate` entries and no documentation blocker was produced.
- 16 seed guard scenarios passed: valid import, identical retry, missing directory/report, malformed JSON, wrong owner/document/artifact, non-null approval, blocked status, additional property, unknown/incomplete decision keys, new question, saved document hash drift, and differing destination. All invalid cases failed before imported artifact writes.
- Seven authoritative report checks passed: valid mapped report, wrong owner, wrong path, non-null approval, additional property, malformed JSON, and missing report.
- Negative policy checks passed: unrelated fact, changed legacy detail, wrong-owner legacy key, legacy key classified as `decision`, and blocked owner all remained blockers.
- Root approval prompt check passed for all three visible unresolved legacy gates.
- 22 retained snapshot files were SHA-256 checked unchanged, including docs, accepted ledger, original artifacts, and the three saved seed reports.
- Isolated SDK `reload`, `get`, and `inputs` checks passed: 11 workflows, generation 1, diagnostics `[]`; the workflow name and optional seed input remained available. No `definition.run` was called.
- Existing guards remain present: allowed model `rawchat/gpt-6.1-sol`, effort `high`, no structured result schema, and five scoped approvals.

These checks evaluated the actual deterministic import, blocker, authoritative-report and approval-prompt code in an in-memory filesystem; they did not invoke the workflow's `run` method or create a real new-run directory. The external validation files are under `C:/Users/elseh/.atomic/agent/sessions/--F--projects-NexTap02-main--/subagent-artifacts/progress/47ceda1e/`. Full static typechecking, owner execution, durable replay and final document application were not exercised.

Final workflow SHA-256: `01e117903e070b6172a115ce96915b79ff49b168470d9a276dbbd46f7e20add0`.

Changed workspace files: `.atomic/workflows/vision-docs-continuation.ts` and this artifact. This repair supersedes only the legacy fact-blocker limitation and copy-equivalence claims in `seed-handoff-setup.md`; that historical handoff was left unchanged.

## Exact launch input

After the parent independently completes its fact verification and chooses to launch, reload the workflow registry and use this input object. This artifact does not launch it:

```json
{
  "reuseCandidateDir": ".atomic/workflows/runs/vision-docs-continuation/5c5087c4-cc46-4444-b870-670018f926b6/round-0"
}
```

The known legacy sample entries will remain visible as unresolved prelaunch gates in the imported report copies and approval prompts. They must be independently verified before import, manufacture, implementation, or public use.
