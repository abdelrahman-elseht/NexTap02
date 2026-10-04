import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { keepContext, workflow, type Static } from "@bastani/atomic/workflows";
import { Type } from "typebox";
import { Value } from "typebox/value";

const originalRunId = "7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8";
const defaultLedger = ".atomic/recovery/accepted-decisions.json";
const defaultSources = `.atomic/workflows/runs/vision-docs/${originalRunId}`;
const model = "rawchat/gpt-6.1-sol:high";
const maxRounds = 3; // Initial five owners, then at most two fresh repair frontiers.
const draftStatus = "Status: Draft. Documentation only; no implementation is authorized.";
const finalStatus = "Status: Approved. Documentation only; no implementation is authorized.";
const skills = [
  "C:/Users/elseh/.agents/skills/grill-with-docs/SKILL.md",
  "C:/Users/elseh/.agents/skills/grilling/SKILL.md",
  "C:/Users/elseh/.agents/skills/domain-modeling/SKILL.md",
  "C:/Users/elseh/AppData/Local/atomic-herdr/node_modules/@bastani/atomic/dist/builtin/workflows/skills/unslop/SKILL.md",
];
const owners = [
  { name: "product", document: "docs/PRODUCT_SPEC.md" },
  { name: "architecture", document: "docs/ARCHITECTURE.md" },
  { name: "database", document: "docs/DATABASE.md" },
  { name: "flows-and-api", document: "docs/FLOWS_AND_API.md" },
  { name: "security-and-edge-cases", document: "docs/SECURITY_AND_EDGE_CASES.md" },
] as const;
const reuseDocumentHashes = {
  product: "0bd509673eb8a44dc051a726037574e164ef4880844e581c22509ee4a7643c55",
  architecture: "1a57cf9917e6780e29e343843359ebe7afc581f3e8c312fc63cc87fc926cdd70",
  database: "992f5da8f61ebd2e04fd3447a214b7ea438a423bfb79bb54bc41a6084d4c3dc4",
  "flows-and-api": "6d43c94fdb176c76d1502b4a34ae9657e41546ae9a15028a20d50935bfdd2bfa",
  "security-and-edge-cases": "8c973d9a4b7aa38cbb4d86e13b3f0b174c76a6d76096597a209ce36c1a629cf7",
} as const;
// Only these source-verified legacy sample facts may be classified on seed import.
// A changed detail or any other fact remains a documentation-approval blocker.
const legacySeedGates = {
  product: {
    key: "database.legacy-token-sample",
    detail: "No actual legacy inventory workbook/sample was present in the inspected inventory. Printed-token grammar/entropy remains unverified; absence does not block an honest documentation candidate.",
  },
  architecture: {
    key: "database.legacy-inventory",
    detail: "Missing actual printed-token inventory/sample prevents compatibility verification. Preserve legacy tokens exactly; do not regenerate or normalize them to match new entropy/encoding rules. This is a factual implementation dependency, not a new architecture policy question or blocker to a truthful Draft candidate.",
  },
  database: {
    key: "database.legacy-token-inventory",
    detail: "Inventory/sample absent; actual printed-token grammar/URL compatibility unverified. Inspect real inventory without regeneration; not a documentation-candidate blocker.",
  },
} as const;
const reuseOwners = owners.filter((owner) => owner.name in legacySeedGates);
const ownerName = Type.Union(owners.map(({ name }) => Type.Literal(name)));
const text = Type.String({ minLength: 1 });
const option = Type.Object({ label: text, description: text }, { additionalProperties: false });
const questionSchema = Type.Object({
  key: text, question: text, prerequisites: Type.Array(text), recommendation: text,
  options: Type.Array(option, { minItems: 2, maxItems: 4 }),
  affectedOwners: Type.Array(ownerName, { minItems: 1, uniqueItems: true }),
}, { additionalProperties: false });
const reportSchema = Type.Object({
  owner: ownerName, document: text, candidateArtifact: text,
  status: Type.Union([Type.Literal("candidate"), Type.Literal("blocked")]), approval: Type.Null(),
  approvalSummary: Type.String({ minLength: 1, maxLength: 1600 }),
  appliedDecisionKeys: Type.Array(text, { uniqueItems: true }),
  sources: Type.Array(Type.Object({ path: text, section: text }, { additionalProperties: false }), { minItems: 1 }),
  newQuestions: Type.Array(questionSchema),
  unresolved: Type.Array(Type.Object({
    key: text, kind: Type.Union([Type.Literal("decision"), Type.Literal("deferred-gate"),
      Type.Literal("implementation-detail"), Type.Literal("peer-check"), Type.Literal("fact")]), detail: text,
  }, { additionalProperties: false })),
  peerChecks: Type.Array(Type.Object({
    document: text, sha256: text, outcome: Type.Union([Type.Literal("consistent"), Type.Literal("incomplete"), Type.Literal("conflict")]),
    detail: text,
  }, { additionalProperties: false })),
  verification: Type.Object({ unslopApplied: Type.Boolean(), sourceReview: text, crosslinkReview: text }, { additionalProperties: false }),
}, { additionalProperties: false });
type Report = Static<typeof reportSchema>;
type Question = Static<typeof questionSchema>;
const relaySchema = Type.Object({ answers: Type.Array(Type.Object({
  key: text, answer: text, kind: Type.Union([Type.Literal("option"), Type.Literal("custom")]), evidence: text,
}, { additionalProperties: false }), { minItems: 1 }) }, { additionalProperties: false });

function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function read(cwd: string, path: string) {
  const absolute = resolve(cwd, path);
  requireThat(statSync(absolute).isFile(), `Not a file: ${path}`);
  const content = readFileSync(absolute, "utf8");
  requireThat(content.trim(), `Empty file: ${path}`);
  return content;
}
function hash(content: string) { return createHash("sha256").update(content).digest("hex"); }
function isExternalReference(path: string) {
  const normalized = path.replaceAll("\\", "/");
  return /^[a-z][a-z0-9+.-]*:/i.test(normalized) || normalized.startsWith("//");
}
function workspacePath(cwd: string, path: string) {
  const absolute = resolve(cwd, path);
  const rel = relative(cwd, absolute);
  requireThat(!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`), `Path escapes workspace: ${path}`);
  return absolute;
}
function sourceEvidence(cwd: string, source: { path: string; section: string }) {
  // Only the workflow's explicitly listed local skills may use external drive paths.
  const localSkill = skills.includes(source.path);
  if (isExternalReference(source.path) && !localSkill) return { ...source, status: "external-not-content-hashed" as const };
  return { ...source, status: "local-content-hashed" as const,
    sha256: hash(read(cwd, localSkill ? source.path : workspacePath(cwd, source.path))) };
}
function approvedContent(content: string) {
  const lines = content.split("\n");
  requireThat(lines.filter((line) => line === draftStatus).length === 1, "Candidate needs one exact canonical Draft status.");
  return lines.map((line) => line === draftStatus ? finalStatus : line).join("\n");
}
function save(cwd: string, path: string, content: string) {
  const absolute = resolve(cwd, path);
  mkdirSync(dirname(absolute), { recursive: true });
  // Refuse symlink escapes at the write boundary, including existing files.
  const canonical = realpathSync(existsSync(absolute) ? absolute : dirname(absolute));
  const rel = relative(realpathSync(cwd), canonical);
  requireThat(!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`), `Write escapes workspace: ${path}`);
  requireThat(canonical === (existsSync(absolute) ? absolute : dirname(absolute)), `Symlink write refused: ${path}`);
  writeFileSync(absolute, content, "utf8");
}
function json(cwd: string, path: string, value: unknown) { save(cwd, path, `${JSON.stringify(value, null, 2)}\n`); }

// Parse local inline Markdown links, not natural-language approval text. Owners use
// inline links and ATX headings so the final root can check paths and anchors itself.
function checkLinks(cwd: string, document: string, content: string) {
  requireThat(!/^\s*\[[^\]]+\]:/m.test(content), `Use inline links, not reference links: ${document}`);
  const checked: { target: string; sha256: string }[] = [];
  for (const match of content.matchAll(/!?\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const target = match[1];
    if (isExternalReference(target)) continue;
    const [path, anchor] = target.split("#");
    const linkedPath = workspacePath(cwd, path ? resolve(cwd, dirname(document), decodeURIComponent(path)) : document);
    if (path) workspacePath(cwd, realpathSync(linkedPath));
    const linked = path ? read(cwd, linkedPath) : content;
    if (anchor) {
      const headings = [...linked.matchAll(/^#{1,6}\s+(.+)$/gm)].map((heading) =>
        heading[1].toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, "").trim().replace(/\s/g, "-"));
      requireThat(headings.includes(decodeURIComponent(anchor)), `Missing anchor: ${document} -> ${target}`);
    }
    checked.push({ target, sha256: hash(linked) });
  }
  return checked;
}

export default workflow({
  name: "vision-docs-continuation",
  description: "Bounded recovery of five Draft docs from 47 verified answers; root-owned decisions and hash-bound per-document approvals. Documentation only.",
  inputs: {
    acceptedLedger: Type.String({ default: defaultLedger, minLength: 1, description: "Read-only authoritative 47-answer recovery ledger." }),
    sourceArtifactDir: Type.String({ default: defaultSources, minLength: 1, description: "Read-only original five owner artifacts from the terminal run." }),
    reuseCandidateDir: Type.Optional(Type.String({ minLength: 1, description: "Read-only round-0 seed directory for the three retained Product/Architecture/Database reports; requires the saved document hashes and all 47 ledger keys. Missing or invalid seeds fail, never fall back to reauthoring." })),
    reuseAllCandidateDir: Type.Optional(Type.String({ minLength: 1, description: "Read-only all-five round-0 seed directory from the failed freeze run. Requires all saved document hashes, five unapproved valid reports and all 47 ledger keys; skips model work and proceeds to root validation and scoped approvals. Cannot be combined with reuseCandidateDir." })),
    objective: Type.Optional(Type.String({ minLength: 1, description: "Optional documentation reconciliation emphasis only. Cannot expand ownership, reopen decisions, or authorize implementation/Git." })),
  },
  outputs: {
    status: Type.Union([Type.Literal("completed"), Type.Literal("blocked")]),
    summary: text, record: text,
    documents: Type.Array(Type.Object({ document: text, candidateArtifact: text, status: text }, { additionalProperties: false })),
  },
  run: async (ctx) => {
    const cwd = realpathSync(ctx.cwd ?? process.cwd());
    const dir = `.atomic/workflows/runs/vision-docs-continuation/${ctx.runId}`;
    const record = `${dir}/verification.json`;
    const answersPath = `${dir}/new-answers.json`;
    const ledgerPath = ctx.inputs.acceptedLedger;
    const sourceDir = ctx.inputs.sourceArtifactDir;
    requireThat(ctx.inputs.reuseCandidateDir === undefined || ctx.inputs.reuseAllCandidateDir === undefined, "Choose either three-report or all-five seed reuse, not both.");
    const reuseDir = ctx.inputs.reuseAllCandidateDir ?? ctx.inputs.reuseCandidateDir;
    const seedOwners = ctx.inputs.reuseAllCandidateDir === undefined ? reuseOwners : owners;
    requireThat(reuseDir === undefined || (typeof reuseDir === "string" && reuseDir.trim().length > 0), "Provided seed directory must be a nonempty path.");
    const ledger = JSON.parse(read(cwd, ledgerPath));
    requireThat(ledger.originalRunId === originalRunId && ledger.answerCount === 47 && ledger.decisions.length === 47,
      "Expected the verified 47-answer original-run ledger.");
    const settled = new Set<string>(ledger.decisions.map((decision: { key: string }) => decision.key));
    requireThat(settled.size === 47 && owners.every((owner) => ledger.documentApprovals[owner.name] === null),
      "Ledger must have 47 distinct decisions and no document approvals.");
    const protectedPaths = [ledgerPath, ".atomic/recovery/unanswered-batches.json", "docs/vision.md", ...owners.map((owner) => `${sourceDir}/${owner.name}.json`),
      ...(reuseDir ? seedOwners.map((owner) => `${reuseDir}/${owner.name}.json`) : [])];
    const sourceHashes = await ctx.tool("initialize-recovery-record", { dir, ledgerPath, sourceDir }, async () => {
      const hashes = Object.fromEntries(protectedPaths.map((path) => [path, hash(read(cwd, path))]));
      json(cwd, `${dir}/sources.json`, { originalRunId, sourceHashes: hashes, ledgerPath, sourceDir });
      json(cwd, answersPath, { authority: "Actual parent-chat human answers relayed to root durable input; never owner/peer consent.", answers: [] });
      return hashes;
    }, { timeoutMs: 10_000 });
    requireThat(hash(read(cwd, ledgerPath)) === sourceHashes[ledgerPath], "Ledger changed since the recovery snapshot.");
    const protectSources = () => {
      for (const [path, sha256] of Object.entries(sourceHashes)) requireThat(hash(read(cwd, path)) === sha256, `Authoritative source changed: ${path}`);
    };
    const reports = new Map<string, Report>();
    const answers: (Static<typeof relaySchema>["answers"][number] & { question: Question; selectedDescription: string | null })[] = [];
    const approvals: { document: string; candidate: string; candidateSha256: string; sha256: string; question: string; answer: "Proceed" | "Decline" }[] = [];
    if (reuseDir) {
      const seeded = await ctx.tool("import-validated-recovery-seed", { reuseCandidateDir: reuseDir, dir }, async () => {
        requireThat(statSync(resolve(cwd, reuseDir)).isDirectory(), `Seed is not a directory: ${reuseDir}`);
        protectSources();
        // Validate the entire seed and every destination before writing any imported report.
        const imports = seedOwners.map((owner) => {
          const sourceArtifact = `${reuseDir}/${owner.name}.json`;
          const sourceContent = read(cwd, sourceArtifact);
          const report = JSON.parse(sourceContent);
          requireThat(Value.Check(reportSchema, report), `Invalid seed report: ${sourceArtifact}`);
          requireThat(report.owner === owner.name && report.document === owner.document
            && resolve(cwd, report.candidateArtifact) === resolve(cwd, sourceArtifact), `Wrong seed report owner/path: ${sourceArtifact}`);
          requireThat(report.status === "candidate" && report.approval === null && report.newQuestions.length === 0
            && report.appliedDecisionKeys.length === 47 && report.appliedDecisionKeys.every((key: string) => settled.has(key)),
          `Seed requires an unapproved candidate with exactly the 47 ledger keys and no new questions: ${sourceArtifact}`);
          const documentSha256 = hash(read(cwd, owner.document));
          requireThat(documentSha256 === reuseDocumentHashes[owner.name as keyof typeof reuseDocumentHashes], `Saved seed document hash changed: ${owner.document}`);
          const candidateArtifact = `${dir}/round-0/${owner.name}.json`;
          requireThat(resolve(cwd, sourceArtifact) !== resolve(cwd, candidateArtifact), "Seed must belong to a previous run.");
          const legacyGate = legacySeedGates[owner.name as keyof typeof legacySeedGates];
          const imported: Report = { ...report, candidateArtifact, unresolved: report.unresolved.map((item: Report["unresolved"][number]) =>
            legacyGate && item.kind === "fact" && item.key === legacyGate.key && item.detail === legacyGate.detail
              ? { ...item, kind: "deferred-gate" as const,
                detail: `UNRESOLVED prelaunch legacy verification gate; source classification fact. Rationale: the exact report states missing external sample evidence is not a documentation-candidate blocker; inspect actual printed tokens and verify grammar/URL compatibility before legacy import, manufacture or implementation, and before public use. Preserve existing printed IDs exactly; no sample, entropy or compatibility result is inferred. Provenance: ${sourceArtifact} SHA-256 ${hash(sourceContent)}; ${ledgerPath} decisions api.import-format/security.public-token-entropy; ${owner.document} SHA-256 ${documentSha256}. Original detail: ${item.detail}` }
              : item) };
          const content = `${JSON.stringify(imported, null, 2)}\n`;
          requireThat(!existsSync(resolve(cwd, candidateArtifact)) || read(cwd, candidateArtifact) === content, `Seed destination already differs: ${candidateArtifact}`);
          return { report: imported, content, evidence: { owner: owner.name, document: owner.document, documentSha256,
            sourceArtifact, sourceSha256: hash(sourceContent), candidateArtifact, importedSha256: hash(content) } };
        });
        for (const item of imports) save(cwd, item.report.candidateArtifact, item.content);
        json(cwd, `${dir}/seed-import.json`, {
          reason: "Fresh corrected-definition seed import preserves completed, unapproved documentation work; seed reuse grants no approval.",
          reuseCandidateDir: reuseDir, seedScope: ctx.inputs.reuseAllCandidateDir === undefined ? "three" : "all-five", approval: null, imports: imports.map((item) => item.evidence),
          completedOwners: seedOwners.map((owner) => owner.name), pendingOwners: owners.filter((owner) => !seedOwners.includes(owner)).map((owner) => owner.name),
        });
        return imports.map((item) => item.report);
      }, { timeoutMs: 10_000 });
      for (const report of seeded) reports.set(report.owner, report);
    }
    let active: readonly typeof owners[number][] = owners.filter((owner) => !reports.has(owner.name));
    const documents = () => owners.map((owner) => ({ document: owner.document,
      candidateArtifact: reports.get(owner.name)?.candidateArtifact ?? `${dir}/round-0/${owner.name}.json`, status: "draft-unapproved" }));
    const stop = async (summary: string) => {
      await ctx.tool("record-unapproved-stop", { summary, record }, async () => {
        json(cwd, record, { status: "blocked", summary, documents: documents(), approvals, answersPath, sourceHashes });
        return { record };
      }, { timeoutMs: 10_000 });
      return { status: "blocked" as const, summary, record, documents: documents() };
    };

    for (let round = 0; round < maxRounds; round++) {
      if (!active.length) break;
      let writesOpen = true;
      const steps = active.map((owner) => {
        const artifact = `${dir}/round-${round}/${owner.name}.json`;
        return {
          name: round === 0 ? `reconcile-${owner.name}` : `repair-${round}-${owner.name}`,
          customTools: [{
            name: "write_owned", label: "Write owned document or report",
            description: `Replace only ${owner.document} or ${artifact}; returns the content SHA-256. No other writes permitted.`,
            parameters: Type.Object({ target: Type.Union([Type.Literal("document"), Type.Literal("report")]), content: text }, { additionalProperties: false }),
            execute: async (_id: string, params: { target: "document" | "report"; content: string }, signal: AbortSignal | undefined) => {
              signal?.throwIfAborted();
              requireThat(writesOpen, "Reconciliation stage closed; retained sessions cannot change candidates or documents.");
              const path = params.target === "document" ? owner.document : artifact;
              if (params.target === "report") {
                const value = JSON.parse(params.content);
                requireThat(Value.Check(reportSchema, value) && value.owner === owner.name && value.document === owner.document
                  && value.candidateArtifact === artifact, "Report schema/ownership mismatch.");
              }
              save(cwd, path, params.content);
              return { content: [{ type: "text", text: JSON.stringify({ path, sha256: hash(params.content) }) }] };
            },
          }, {
            name: "document_hashes", label: "Inspect document hashes",
            description: "Read current five-document hashes for evidence-backed peer checks. Does not edit files.",
            parameters: Type.Object({}, { additionalProperties: false }),
            execute: async (_id: string, _params: object, signal: AbortSignal | undefined) => {
              signal?.throwIfAborted();
              return { content: [{ type: "text", text: JSON.stringify(owners.map((peer) => ({ document: peer.document, sha256: hash(read(cwd, peer.document)) }))) }] };
            },
          }],
          reads: ["docs/vision.md", ledgerPath, ".atomic/recovery/unanswered-batches.json", `${sourceDir}/${owner.name}.json`, answersPath, `${dir}/sources.json`, ...skills],
          prompt: [
            keepContext(`Own only ${owner.document} and ${artifact}. Use write_owned, not builtin write/edit. Documentation reconciliation only. No implementation, Git, credentials, publication, delegation, workflows or user-question tools. Communicate nonblockingly with the parent and peers via intercom send; discover actual targets with intercom list. Policies require actual ledger/root-answer evidence, never peer consent or silence. The old ledger grants no document approval. Return without waiting for human answers; root owns all durable prompts.`),
            keepContext(`Before any write, inspect ${artifact} if it exists. If it satisfies the report contract below, matches owner ${owner.name}, document ${owner.document}, candidateArtifact ${artifact}, status candidate or blocked and approval null, reuse it unchanged. Do not repeat document authoring, unslop, or report writes. A bounded read-only cross-reconciliation check is allowed; notify peers of any new conflict without inventing consent or changing retained evidence. Root records stale peer hashes as incomplete before approval. Finish with the artifact path in ordinary final text; never call structured_output.`),
            `Round ${round}; emphasis: ${ctx.inputs.objective ?? "Reconcile the existing Draft against the 47 actual verified answers."}. The following content-work instructions apply only when no reusable valid report exists.`,
            `Read the vision and authoritative ledger in full, the unanswered inventory, own original artifact, root sources and new actual-answer file. Read all five own/peer docs and available original/new reports at ${sourceDir} and ${dir}. Handoffs are paths, not ancestor context. Read the listed skills directly; no Skill tool. Keep vocabulary/ADRs inline in your owned doc, never create extra documents.`,
            `Peers: ${owners.map((peer) => `${peer.name}: ${peer.document}`).join("; ")}. Reconcile only stale unresolved entries and directly related conflicts using the authoritative answers. Retain unrelated text. The ledger overrides stale artifacts, not genuine accepted deferrals. Q9 custom trailing space and separately attributed interpretation must remain exact in evidence. Preserve adapter/operating-target/provider-review gates and unfinished implementation contracts. Do not ask again for settled policy under an alias or ask factual/low-level trivia questions.`,
            `Apply unslop before returning. Normalize the sole document status line to exactly this line:\n${draftStatus}\nRemove stale interview/approval-pending claims from content, but retain genuine open gates in their own section. Root appends a plain peer-check record BEFORE freezing approval hashes. The candidate stays Draft until approval. The approval names the one exact, precomputed Draft-to-Approved status change; no material postapproval rewrite is permitted.`,
            "Perform one bounded cross-read/check of scope, vocabulary, cardinality, lifecycle, API/persistence/security/cache contracts. Use document_hashes before and after reading peers; record only hashes actually checked. Send one consolidated conflict/request or acknowledgment per affected peer, never intercom ask chains, sleeps or polling. Missing replies/stale hashes remain explicit incomplete peer checks, not consent. Do not wait for peer completion or approval.",
            "Verify cited sources and all local Markdown crosslinks, including anchors. Use simple inline Markdown links and ATX headings. Report actual source/crosslink review, not implementation verification. All four peerChecks must describe checks actually performed or explicitly incomplete/conflicted, with current hash evidence. Put every genuine deferred gate, implementation contract and incomplete peer check in both the document and report.",
            `If no reusable valid report exists, write valid JSON report to ${artifact} using write_owned. Contract: ${JSON.stringify(reportSchema)}. approval stays null; status candidate unless facts/conflicts prevent a truthful candidate. approvalSummary is concise shared understanding, applied choices, trade-offs, open gates and incomplete peer checks, not bulk document text. newQuestions contains only genuinely NEW human choices with stable distinct keys, 2-4 exact label/description options, recommendation, settled prerequisite keys and affectedOwners including you. Separate decision/fact blockers from deferred-gate/implementation-detail/peer-check items. If a new prerequisite is unsettled, record it honestly for a later frontier. Never invent answers or encode a proposal as accepted.`,
            `Finish with only ${artifact} in ordinary final text. Root reads and validates that exact on-disk report; do not call structured_output or any other model extraction. Do not call any user-question tool or finalize your doc.`,
          ].join("\n\n"),
        };
      });
      await ctx.parallel(steps, {
        concurrency: 5, failFast: false, context: "fresh", cwd, model,
        modelConstraints: { allowedModels: ["rawchat/gpt-6.1-sol"], allowedEfforts: ["high"] },
        tools: ["read", "search", "find", "intercom", "write_owned", "document_hashes"],
        mcp: { allow: [] }, output: false, artifacts: false,
        possibleStageNames: ["reconcile-product", "reconcile-architecture", "reconcile-database", "reconcile-flows-and-api", "reconcile-security-and-edge-cases", "repair-*-*"],
      }).finally(() => { writesOpen = false; });
      for (const owner of active) {
        const path = `${dir}/round-${round}/${owner.name}.json`;
        if (!existsSync(resolve(cwd, path)))
          return stop(`Round ${round}: ${owner.name} did not write its report. No approval requested.`);
        const report = JSON.parse(read(cwd, path));
        requireThat(Value.Check(reportSchema, report), `Invalid report: ${path}`);
        requireThat(report.owner === owner.name && report.document === owner.document && report.candidateArtifact === path, `Wrong report owner: ${path}`);
        reports.set(owner.name, report);
      }
      protectSources();
      const pending = new Map<string, Question>();
      for (const report of reports.values()) {
        for (const key of report.appliedDecisionKeys) requireThat(settled.has(key), `Unknown applied answer: ${key}`);
        for (const question of report.newQuestions) {
          requireThat(!settled.has(question.key), `Settled decision reasked: ${question.key}`);
          requireThat(question.affectedOwners.includes(report.owner), `Question omits its owner: ${question.key}`);
          requireThat(new Set(question.options.map((item) => item.label)).size === question.options.length, `Duplicate options: ${question.key}`);
          const previous = pending.get(question.key);
          requireThat(!previous || JSON.stringify(previous) === JSON.stringify(question), `Conflicting keyed questions: ${question.key}`);
          pending.set(question.key, question);
        }
      }
      if (![...pending.values()].length) break;
      if (round === maxRounds - 1) return stop("Three reconciliation rounds exhausted with NEW choices still unresolved. Drafts and evidence retained; no document approval inferred. A separately authorized continuation is required.");
      const frontier = [...pending.values()].filter((question) => question.prerequisites.every((key) => settled.has(key)));
      if (!frontier.length) return stop("No settled-prerequisite question frontier. Inspect reported missing facts/dependencies; no trivia interview or false approval.");
      const questionsPath = `${dir}/round-${round}/questions.json`;
      await ctx.tool("record-question-frontier", { round, questionsPath }, async () => {
        json(cwd, questionsPath, { questions: frontier });
        return { questionsPath };
      }, { timeoutMs: 10_000 });
      let relayed: Static<typeof relaySchema> | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        const raw = await ctx.ui.input([
          `NEW decisions, round ${round + 1}; question/options artifact: ${questionsPath}. Parent: show these in THIS chat with ask_user_question, then relay actual answers. Do not switch stage terminals.`,
          ...frontier.map((question) => `${question.key}: ${question.question}\nPrerequisites: ${question.prerequisites.join(", ")}. Recommendation: ${question.recommendation}\n${question.options.map((item) => `${item.label}: ${item.description}`).join("\n")}`),
          `Return JSON {"answers":[{"key":"<listed key>","answer":"<exact actual label or custom answer>","kind":"option|custom","evidence":"<parent question-tool result reference>"}]}. Include every frontier key exactly once; no defaults, guesses or approvals. Relay attempt ${attempt + 1}/2.`,
        ].join("\n\n"));
        try {
          const value = JSON.parse(raw);
          if (Value.Check(relaySchema, value) && value.answers.length === frontier.length
            && new Set(value.answers.map((item: { key: string }) => item.key)).size === frontier.length
            && value.answers.every((item: { key: string; kind: string; answer: string }) => frontier.some((question) =>
              question.key === item.key && (item.kind === "custom" || question.options.some((opt) => opt.label === item.answer))))) {
            relayed = value;
            break;
          }
        } catch { /* The next durable input requests an exact valid relay, not a guessed answer. */ }
      }
      if (!relayed) return stop("Two invalid answer relays; no choices or approvals inferred. Pending frontier is recorded for a new authorized continuation.");
      const affected = new Set<string>();
      for (const answer of relayed.answers) {
        const question = frontier.find((item) => item.key === answer.key)!;
        answers.push({ ...answer, question, selectedDescription: question.options.find((item) => answer.kind === "option" && item.label === answer.answer)?.description ?? null });
        settled.add(answer.key);
        for (const name of question.affectedOwners) affected.add(name);
      }
      await ctx.tool("record-actual-new-answers", { round, answersPath, keys: relayed.answers.map((answer) => answer.key) }, async () => {
        json(cwd, answersPath, { authority: "Actual parent-chat answers relayed to durable root input.", answers });
        return { answersPath };
      }, { timeoutMs: 10_000 });
      // Owners still reporting dependent NEW questions also recompute their frontier.
      active = owners.filter((owner) => affected.has(owner.name) || reports.get(owner.name)!.newQuestions.length > 0);
    }

    const blockers = [...reports.values()].flatMap((report) => [
      ...(report.status === "blocked" ? [`${report.document}: blocked owner report`] : []),
      ...report.unresolved.filter((item) => item.kind === "decision" || item.kind === "fact").map((item) => `${report.document}: ${item.key}: ${item.detail}`),
    ]);
    if (blockers.length) return stop(`Unmet decision/fact prerequisites. ${blockers.join("; ")}`);

    const candidates = await ctx.tool("freeze-exact-candidates", { dir, reports: [...reports.values()].map((report) => report.candidateArtifact) }, async () => {
      protectSources();
      const hashes = Object.fromEntries(owners.map((owner) => [owner.document, hash(read(cwd, owner.document))]));
      const frozen = owners.map((owner) => {
        const report = reports.get(owner.name)!;
        const content = read(cwd, owner.document);
        const lines = content.split("\n");
        requireThat(lines.filter((line) => line === draftStatus).length === 1, `Expected exactly one canonical Draft status: ${owner.document}`);
        requireThat(report.verification.unslopApplied, `Unslop not completed: ${owner.document}`);
        requireThat(report.peerChecks.length === 4 && new Set(report.peerChecks.map((peer) => peer.document)).size === 4
          && report.peerChecks.every((peer) => owners.some((item) => item.document === peer.document && item.name !== owner.name)), `Incomplete peer inventory: ${owner.document}`);
        const peerChecks = report.peerChecks.map((peer) => ({ ...peer, current: hashes[peer.document] === peer.sha256 }));
        const candidateContent = `${content.trimEnd()}\n\n## Recovery peer-check record\n\n${peerChecks.map((peer) => `- ${peer.document}: ${peer.outcome}; ${peer.current ? "checked hash is current" : "incomplete, checked hash is stale"}. ${peer.detail}`).join("\n")}\n`;
        const candidate = `${dir}/candidates/${owner.name}.md`;
        save(cwd, candidate, candidateContent);
        return { owner: owner.name, document: owner.document, candidateArtifact: report.candidateArtifact,
          candidate, candidateSha256: hash(candidateContent), sha256: hash(approvedContent(candidateContent)), draftSha256: hashes[owner.document], approvalSummary: report.approvalSummary,
          unresolved: report.unresolved, peerChecks, verification: report.verification,
          sources: report.sources.map((source) => sourceEvidence(cwd, source)),
          links: checkLinks(cwd, owner.document, candidateContent) };
      });
      json(cwd, `${dir}/candidates.json`, frozen);
      return frozen;
    }, { timeoutMs: 10_000 });

    // All model work and material edits end before any approval. Approval binds
    // the frozen Draft plus its declared, exact administrative status transition.
    for (const candidate of candidates) {
      const question = [
        `Approve ONLY ${candidate.document}? Candidate: ${candidate.candidate}. Candidate SHA-256: ${candidate.candidateSha256}. Final SHA-256 after the sole status transition: ${candidate.sha256}. Report: ${candidate.candidateArtifact}.`,
        candidate.approvalSummary,
        `Open gates/contracts: ${candidate.unresolved.map((item) => `${item.key} [${item.kind}]: ${item.detail}`).join("; ") || "None reported."}`,
        `Peer checks: ${candidate.peerChecks.map((peer) => `${peer.document}: ${peer.outcome}, ${peer.current ? "current hash" : "INCOMPLETE stale hash"}; ${peer.detail}`).join("; ")}`,
        `External source evidence: ${candidate.sources.filter((source) => source.status === "external-not-content-hashed").map((source) => source.path).join(", ") || "None"}. Entries marked external-not-content-hashed retain report references only; no captured content snapshot, root fetch, content hash or external freshness verification is available.`,
        `Parent: present this scoped understanding HERE via ask_user_question with exact Proceed/Decline options, then relay the actual selection via workflow answer. No terminal switch. Proceed approves the exact candidate and ONLY this administrative line transition: "${draftStatus}" to "${finalStatus}". The listed gates remain visibly unresolved; documentation approval does not satisfy them or authorize legacy import, manufacture, implementation, credentials or publication. Decline leaves all five docs Draft and ends this bounded run without inferred approval.`
      ].join("\n\n");
      const answer = await ctx.ui.select(question, ["Proceed", "Decline"] as const);
      approvals.push({ document: candidate.document, candidate: candidate.candidate, candidateSha256: candidate.candidateSha256, sha256: candidate.sha256, question, answer });
      await ctx.tool("record-scoped-human-approval", { document: candidate.document, sha256: candidate.sha256, answer }, async () => {
        json(cwd, `${dir}/approvals/${candidate.owner}.json`, approvals[approvals.length - 1]);
        return { document: candidate.document, answer, sha256: candidate.sha256 };
      }, { timeoutMs: 10_000 });
      if (answer === "Decline") return stop(`${candidate.document} declined. No finalization; all candidate approvals remain scoped evidence, not permission for other docs.`);
    }

    await ctx.tool("apply-exact-approved-candidates", { dir, approvals }, async () => {
      protectSources();
      requireThat(approvals.length === 5, "Five scoped approvals required.");
      // Preflight every write before applying any candidate. Identical finalized
      // bytes are safe on retry after an interrupted, not-yet-checkpointed copy.
      for (const candidate of candidates) {
        const approval = JSON.parse(read(cwd, `${dir}/approvals/${candidate.owner}.json`));
        requireThat(approval.answer === "Proceed" && approval.question === approvals.find((item) => item.document === candidate.document)?.question
          && approval.document === candidate.document && approval.candidate === candidate.candidate && approval.sha256 === candidate.sha256 && approval.candidateSha256 === candidate.candidateSha256,
          `Invalid scoped approval: ${candidate.document}`);
        const content = read(cwd, candidate.candidate);
        requireThat(hash(content) === candidate.candidateSha256 && hash(approvedContent(content)) === candidate.sha256, `Approved candidate changed: ${candidate.document}`);
        const current = hash(read(cwd, candidate.document));
        requireThat(current === candidate.draftSha256 || current === candidate.sha256, `Document changed after approval: ${candidate.document}; fresh reconciliation/approval required.`);
        for (const source of candidate.sources) {
          if (source.status === "external-not-content-hashed") continue;
          const peer = candidates.find((item) => resolve(cwd, item.document) === resolve(cwd, source.path));
          const sourceHash = hash(read(cwd, source.path));
          requireThat(sourceHash === source.sha256 || (peer && sourceHash === peer.sha256), `Reviewed source changed: ${source.path}`);
        }
        checkLinks(cwd, candidate.document, read(cwd, candidate.candidate));
      }
      for (const candidate of candidates) save(cwd, candidate.document, approvedContent(read(cwd, candidate.candidate)));
      return { applied: candidates.map((candidate) => ({ document: candidate.document, sha256: candidate.sha256 })) };
    }, { timeoutMs: 10_000 });
    await ctx.tool("verify-five-final-documents", { record, candidates: candidates.map(({ document, sha256 }) => ({ document, sha256 })) }, async () => {
      protectSources();
      const verified = candidates.map((candidate) => {
        const content = read(cwd, candidate.document);
        const approval = JSON.parse(read(cwd, `${dir}/approvals/${candidate.owner}.json`));
        requireThat(hash(content) === candidate.sha256 && hash(read(cwd, candidate.candidate)) === candidate.candidateSha256
          && approval.answer === "Proceed" && approval.sha256 === candidate.sha256 && approval.candidateSha256 === candidate.candidateSha256
          && approval.document === candidate.document && approval.candidate === candidate.candidate
          && approval.question === approvals.find((item) => item.document === candidate.document)?.question, `Final verification failed: ${candidate.document}`);
        requireThat(content.split("\n").filter((line) => line === finalStatus).length === 1, `Final status mismatch: ${candidate.document}`);
        return { document: candidate.document, sha256: candidate.sha256, status: "approved", nonempty: true,
          links: checkLinks(cwd, candidate.document, content), sources: candidate.sources.map((source) => source.status === "external-not-content-hashed"
            ? source : { ...source, finalSha256: hash(read(cwd, source.path)) }), verification: candidate.verification,
          unresolved: candidate.unresolved, peerChecks: candidate.peerChecks, candidateArtifact: candidate.candidateArtifact };
      });
      json(cwd, record, { status: "completed", verifiedAt: new Date().toISOString(), originalRunId, documents: verified, approvals, sourceHashes, answersPath });
      return { record, count: verified.length };
    }, { timeoutMs: 10_000 });
    return { status: "completed" as const, summary: "Five nonempty documents match their exact root-scoped Proceed approvals. Documentation only; listed deferred gates and incomplete peer checks remain visible.",
      record, documents: candidates.map((candidate) => ({ document: candidate.document, candidateArtifact: candidate.candidateArtifact, status: "approved" })) };
  },
});
