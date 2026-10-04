# Continuation setup

## Outcome

Authored `vision-docs-continuation` and validated its definition and input contract without executing `run`, reconciliation stages, or human prompts. No five-document edits, original-artifact edits, ledger edits, implementation, Git commands, credential inspection or publication occurred. All five documents remain Draft; no final human approval exists.

- Registered name: `vision-docs-continuation`
- Definition: `F:/projects/NexTap02-main/.atomic/workflows/vision-docs-continuation.ts`
- Document folder: `F:/projects/NexTap02-main/docs`
- Future artifact folder: `.atomic/workflows/runs/vision-docs-continuation/<runId>/`
- Default input object: `{}`

Expanded default input, with optional emphasis omitted:

```json
{
  "acceptedLedger": ".atomic/recovery/accepted-decisions.json",
  "sourceArtifactDir": ".atomic/workflows/runs/vision-docs/7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8"
}
```

`objective` is an optional nonempty string for documentation reconciliation emphasis only. Inputs cannot authorize implementation or Git, widen document ownership, reopen settled policy or supply document approval. The dispatch schema rejects unknown keys and wrong types.

## Execution and preferences

Original run `7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8` remains terminal blocked, exited and nonresumable. Its actual duration was 78m 50.5s. The original setup estimate of 15-25 minutes plus human time was historical, not actual runtime. Current reconciliation estimate is 10-20 minutes plus human time, not a budget or timeout.

The parent remains an orchestrator. It presents questions in this chat using `ask_user_question`, relays exact human responses through `workflow answer`, and communicates with owners through Intercom. No lifecycle control or continuation launch was performed during setup.

## Bounded workflow

The first round contains exactly five fresh parallel owners, with concurrency 5, pinned to `rawchat/gpt-6.1-sol:high` and matching model/effort constraints. Owners are Product, Architecture, Database, Flows/API and Security/Edge Cases. Each owns only its existing document and its own round-scoped JSON report. Structured stage output contains only owner/document/report-path references; root reads schema-validated reports rather than carrying bulk previous context.

Owners read the original vision, all 47 verified answers, the unanswered inventory, their original artifacts, peer documents and available peer reports. They fix stale unresolved entries using authoritative evidence, preserve genuine deferred gates, apply unslop, and report concise understanding, source checks, peer checks, unresolved items and genuinely new keyed questions with options, recommendations and prerequisites. No direct user-question tool is exposed.

Tools are read/search/find/Intercom plus two custom tools. `write_owned` permits only the owner's exact document or report target; builtin write/edit, shell, delegation, workflow launch and MCP access are unavailable. `document_hashes` provides current peer evidence. Owner writes are sealed when the parallel round settles, so retained sessions cannot alter approved candidates. Peer exchanges are nonblocking, without polling, sleeps or approval inference.

Root deduplicates new keyed questions, rejects already-answered keys and conflicting question definitions, and asks only the settled-prerequisite frontier. A durable root `ctx.ui.input` requests parent-relayed JSON answers, preserving exact labels or custom text and a parent question-result evidence reference. Example response shape:

```json
{
  "answers": [
    {
      "key": "<exact pending key>",
      "answer": "<exact actual option label or custom answer>",
      "kind": "option",
      "evidence": "<parent ask_user_question result reference>"
    }
  ]
}
```

The original ledger is never extended or rewritten. New answers are recorded in `new-answers.json`. Only affected owners and owners with dependent new questions get distinct fresh `repair-<round>-<owner>` stages. There are at most three reconciliation rounds total: initial five owners plus at most two repair frontiers. No ancestor is reopened and no backward DAG edge is added. Unmet decision/fact prerequisites, an unavailable frontier, exhausted rounds or two invalid relay submissions stop with a blocked record and no inferred approval. Ordinary human waiting is a durable root prompt, not `ctx.exit` or a terminal blocked wait.

## Approval and finalization

All model work and material edits finish before approvals. Root freezes five candidate snapshots, records their SHA-256 hashes, verifies source paths and simple local Markdown links/anchors, and exposes every deferred gate and stale/incomplete peer check. Candidate snapshots remain Draft before the human responds.

Each root-owned `ctx.ui.select` offers exactly `Proceed` and `Decline` for one explicit document path. Its prompt binds the frozen candidate hash and the precomputed final hash, and names the sole allowed administrative transition from the exact canonical Draft status line to the exact Approved status line. Status is handled by exact line equality, not natural-language or arbitrary approval regexes. Unslop and the root peer-check record precede hashing and approval. No material rewriting is permitted after approval.

Only after all five actual scoped Proceed responses does a deterministic root tool apply the frozen candidates with that declared status transition. Any Decline leaves all five target documents Draft and records any earlier scoped responses without claiming overall completion. Source, candidate, approval or target-document hash drift refuses finalization; changed content needs fresh reconciliation and renewed approval. Partial exact copies are idempotent on retry, but no arbitrary changed file is overwritten.

Final root verification checks five nonempty files, their exact approved final hashes, all matching scoped approvals, canonical Approved status, source evidence and local links. It writes actual results to `verification.json`. Deferred implementation/prelaunch gates and incomplete peer checks stay visible; document approval is not implementation or publication permission. No extra finalization model worker is used.

All root `ctx.tool` callbacks have finite 10-second timeouts and use synchronous filesystem operations. They launch no child process or network IO requiring signal forwarding. Custom owner IO checks its supplied cancellation signal before synchronous access.

## Validation and remaining risks

The final isolated Atomic SDK registry reload discovered 11 workflows with an empty diagnostics list. `get` and `inputs` confirmed the registered name and all three inputs. The parent's live registry is separate and should be reloaded before launch.

Independent module loading and seven representative strict TypeBox input checks passed without calling `run`: defaults and an expanded valid input passed; numeric/null objective, an unknown key, empty ledger path and boolean source directory failed. Static source checks found one parallel call and no additional task/stage/child-workflow or exit calls. The original ledger still contains 47 unique actual answers and five null document approvals. Earlier in-progress authoring syntax errors were corrected before the final successful reload.

No TypeScript compiler is installed, so a full static typecheck was unavailable. Owner execution, provider availability, human answer transport, durable cross-process recovery and final filesystem application remain untested because launch was prohibited. Source/peer semantic review and unslop depend on owner evidence; root independently checks hashes and supported local inline-link/ATX-heading syntax. Unsupported link forms require owner normalization, not a guessed verification result.

Recorded read-only setup hashes:

- Ledger: `879a70c63159a523220b2328c63fb183edeca089853d0d998b71d76e2759ee72`
- Unanswered inventory: `8fc8b9ce400037f80a9012e71bcbc9db9b528759fb8f4e3a4b072c2c867f4fe3`
- Product: `79656d86d686b014436461928c6122a5bbe7b0844a0d2d74e5730f61bbd8eb7a`
- Architecture: `424aacc36e1704547043e6fba004cd1eae03a6580c5b7a9959962a4458915fd8`
- Database: `904ecbb0c3633b1dcb8ef97ba55b5ada0384f92d52e51aae94923bacc3ed32b5`
- Flows/API: `23d970e19053fb8a92a7b7507af10f7a319e03fcb219a016eb18072a486b0f44`
- Security: `456608dcc3d03e4dda5e6483051249367c9e1ca00d9375fd7691777831e641bf`

Prepared for the parent to reload its registry, inspect inputs and launch the new definition when authorized. Do not resume or relaunch the original terminal run.
