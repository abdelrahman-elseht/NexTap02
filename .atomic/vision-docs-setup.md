# Vision docs setup

## Status

Created and validated `vision-docs`. The workflow has not been launched. No target design documents were created or edited, and no Git actions were taken.

- Definition: `F:/projects/NexTap02-main/.atomic/workflows/vision-docs.ts`
- Registered name: `vision-docs`
- Document folder: `F:/projects/NexTap02-main/docs`
- Source: `docs/vision.md`
- Default input object: `{}`
- Optional input example: `{ "objective": "Clarify launch scope and unresolved design choices in docs/vision.md." }`

`objective` is an optional string that adjusts interview emphasis. Omitting it derives all five documents from the vision. It does not expand file ownership or authorize implementation. The input contract rejects other types and unknown keys at the workflow dispatch boundary.

## Execution and preference record

The parent remains an orchestrator. Exactly five document-owning model stages launch in one `ctx.parallel` call with `concurrency: 5`. There are no partition, synthesis, reviewer, repair, or delegated model stages. Every owner uses `rawchat/gpt-6.1-sol:high`, with model and effort constraints preventing fallback to another model or effort. The user's prior catalog verification establishes high-effort support; setup did not make a provider request.

| Owner | Owned document |
| --- | --- |
| product | `docs/PRODUCT_SPEC.md` |
| architecture | `docs/ARCHITECTURE.md` |
| database | `docs/DATABASE.md` |
| flows-and-api | `docs/FLOWS_AND_API.md` |
| security-and-edge-cases | `docs/SECURITY_AND_EDGE_CASES.md` |

Each owner reads the vision, repository facts, workspace instructions and the four required skills itself. Owners have read/search/find/write/edit, `ask_user_question` and Intercom tools. Shell, Git, workflow-launch and delegation tools are not exposed. Each may edit only its document and its own JSON working artifact under `.atomic/workflows/runs/vision-docs/<runId>/<owner>.json`. Automatic Git-diff artifact collection is disabled.

The prompts protect ownership, approvals, prohibited actions and unresolved-decision handling with `keepContext`. Interviews use prerequisite-aware rounds, recommendations and alternatives. Product owns shared foundational scope, actors and terms. Other owners send keyed shared-decision requests to product and ask independent local frontier questions while the foundation is pending. Approved shared and local decisions travel through Intercom messages and separately owned working artifacts.

Owners publish initial drafts before waiting for peers. Each cross-reads all five documents and conducts one consolidated consistency exchange, repairing only its own document. Peer-only waits are bounded to 120 seconds with limited rediscovery and rereads; missing prerequisites remain explicit. Human interview waits are separate. Each owner requests scoped shared-understanding approval with Proceed and Decline before finalizing. Cancelled, unanswered or missing-tool approvals leave a draft and block successful completion.

The final read-only `ctx.tool` checks that all five documents are nonempty files and that each owner recorded its scoped Proceed confirmation. It returns document names and statuses only. Missing, empty, unverified or unapproved documents block completion. It has a finite 10-second timeout and uses synchronous filesystem reads, with no child process or additional agent.

The estimate already shared remains 15–25 minutes of agent work plus user interview time. It is not a runtime budget.

## Skill and instruction inspection

Read in full:

- Atomic `docs/workflows.md` and the full authoring, API-reference and reliable-design documents, in chunks.
- Applicable operations, SDK and question-tool sections, authoring examples and installed API declarations.
- `C:/Users/elseh/.agents/skills/grill-with-docs/SKILL.md`
- `C:/Users/elseh/.agents/skills/grilling/SKILL.md`
- `C:/Users/elseh/.agents/skills/domain-modeling/SKILL.md` and its glossary/ADR format references.
- Bundled `dist/builtin/workflows/skills/unslop/SKILL.md` in the installed Atomic package.

No workspace AGENTS.md, CLAUDE.md, glossary or stow-note convention was found in the inspected ancestor/project/scoped locations. This file serves as the requested execution/preference record. User ownership restrictions override skill directions to create separate glossary/ADR files or delegate factual research. Owners record resolved vocabulary and qualifying design decisions inline in their own document and read skill files directly instead of invoking a nonexistent Skill tool.

## Validation

An isolated Atomic SDK session in this repository executed only the registered workflow tool's `reload`, `get` and `inputs` actions. Reload reported 10 discovered workflows, including `vision-docs`, generation 1, with an empty diagnostics list. `get` and `inputs` both confirmed the registered name and optional text input `objective`.

A separate import and TypeBox schema check, without calling `run`, passed:

- `{}` and a string `objective` satisfy the input schema.
- Number/null objectives and an unknown key fail the strict input schema.
- Source inspection confirms one parallel fan-out, five literal model-stage names, concurrency 5, and no extra model-stage calls.

No actual workflow loading failure occurred. Two setup-check issues were resolved: the Windows SDK import needed a file URL, and the installed `resolveInputs` helper applies defaults but does not itself enforce type/unknown-key validation despite its documentation. The declared schema was checked directly, and installed dispatch validation was inspected. No extra validation logic was added to the workflow.

A TypeScript compiler is not installed, so a full static typecheck was not performed. Module loading and discovery passed. Stage execution, interviews, consistency exchange and final file checks remain untested because launching was explicitly forbidden.

The reload validated registration in the isolated SDK host. The parent should reload its own live workflow registry before inspecting inputs and launching. No remaining setup blocker was observed.
