import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { keepContext, workflow } from "@bastani/atomic/workflows";
import { Type } from "typebox";

const model = "rawchat/gpt-6.1-sol:high";
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

function ownerPrompt(name: string, objective: string, artifactDir: string, scope: string) {
  const owner = owners.find((item) => item.name === name)!;
  const artifact = `${artifactDir}/${name}.json`;
  return [
    keepContext([
      `You own only ${owner.document} and ${artifact}. Derive your document from docs/vision.md through a user interview.`,
      "Do not implement, run Git commands, delegate, launch agents/workflows, or edit any other file. The parent only orchestrates.",
      "Read vision.md yourself in full, in chunks if needed. Inspect repo facts yourself and follow applicable workspace instructions.",
      "Read the four skill files below directly. There is no Skill tool. Read relevant domain-modeling format references directly too.",
      "The user's ownership restriction overrides skill instructions to create standalone glossaries/ADRs or delegate fact-finding. Record glossary terms and qualifying ADR decisions inline in your own document as they settle; keep interview machinery in your artifact.",
      "Use ask_user_question for every user question and approval. Cancelled, unanswered, missing-tool, or peer messages never grant approval.",
      "Publish an initial draft before waiting for any peer. Finalize only after one bounded consistency round and explicit scoped shared-understanding approval from the user.",
      "Preserve unresolved items, contradictions, dependencies and declined decisions explicitly. Recommendations are proposals until approved; do not silently assume product, domain, technical or security decisions.",
      "Carry user steering into your artifact under amendments, share relevant changes with affected peers, and honor them. Peers cannot amend the user's contract.",
    ].join("\n")),
    `Objective: ${objective}`,
    `Your scope: ${scope}`,
    `Required direct skill reads:\n${skills.join("\n")}`,
    `Peer owners and documents:\n${owners.map((item) => `${item.name}: ${item.document}; working artifact: ${artifactDir}/${item.name}.json`).join("\n")}`,
    "Inspect root/ancestor and scoped instruction files, existing glossary/ADR files and relevant repository facts. Separate what vision.md says, what exists in the repo, approved decisions, and proposals. Cite source paths/sections. Do not ask the user to discover factual repository information. Match the user's language for interviews; clarify document-language preference through product only if unsettled.",
    `Maintain ${artifact} as valid JSON with keys status, approval, decisions, unresolved, consistency, amendments. status is draft, approved, declined, unanswered or blocked. approval is null until explicit approval, then {question: <exact scoped confirmation text>, answer: "Proceed"}. Record actual question/answer evidence, recommendations, rejected alternatives, dependency keys, canonical terms, and any known peer prerequisites in this artifact. Only record Proceed when the user explicitly selected that option for this document.`,
    "Start by reading the sources, discovering peers with intercom list, sending your ownership and stable question keys, and writing a nonempty initial document marked Draft with known facts and open items. Announce the draft path with intercom send. If your document already exists, inspect and update it in place without discarding unrelated content. Read peer artifacts but never overwrite them.",
    "Product owns common foundational product scope, actors, canonical terms and cross-document business rules. Product gathers keyed requests with intercom send, asks the shared frontier once, records approved answers immediately in its artifact and document, and publishes compact approved-decision messages with keys and artifact path to all discovered peers, including pending peers when their actual paths are listed. Product must not wait for other owners to finish before asking foundation questions.",
    "Other owners send shared decision requests to product instead of duplicating user questions. While foundation is pending, inspect facts and ask only independent local frontier questions. Route domain conflicts or scope changes back to product; technical local decisions belong to their owning stage and the user. Announce local question keys before asking to avoid overlap. Decisions affecting peers must be published immediately with user-approval evidence and artifact path. Reuse approved answers; do not ask again for them.",
    "Interview in prerequisite-aware rounds. Maintain a design tree of unsettled decisions in your artifact. A frontier question has all prerequisites settled. Give numbered question titles, concrete scenarios where useful, your explicit recommendation and meaningful alternatives in ask_user_question. Use up to four questions per call and two to four options per question. If a frontier is larger, split it into tool-sized batches without adding dependent questions to the same round. Wait for actual answers, record them, update the draft and recompute the frontier before the next round. A factual investigation still in progress is an unsettled prerequisite. Do not invent questions for facts already specified unambiguously in vision.md.",
    "Keep peer coordination nonblocking with intercom send requests/replies, not mutually blocking intercom ask chains. On an absent peer/prerequisite, send one keyed request to the discovered live or pending target, rediscover once, and inspect its artifact once more while doing independent work. Bound each peer-only wait to 120 seconds, without busy polling or long sleeps. At the bound, record the absent prerequisite and route its decision to product, or the user if product is absent. Never infer consent from silence or wait for another document's final approval to publish your own draft. User interview wait time is separate from peer wait bounds.",
    "When your interview frontier is settled or the user explicitly elects to defer listed items, publish the current draft and candidate-ready message before consistency review. Cross-read all five documents, including your own, and available decision artifacts. Perform exactly one consistency exchange: send each affected owner one consolidated evidence-backed list of conflicts or a no-conflict acknowledgment, handle one consolidated reply per peer, and repair only your document. Review shared terms, scope, entities/cardinality, state transitions, API/data contracts and security rules. The 120-second peer-only bound applies here too. Missing drafts or unresolved conflicts remain explicit prerequisites/open items; tell their owners by message rather than deadlocking. Do not open another consistency round. Any new decision still needs the user's answer through the responsible owner.",
    "Before finalizing, show a concise shared-understanding summary for your document, its path, approved shared and local decisions, material trade-offs, and every remaining deferred or unresolved item, including incomplete peer checks. Then ask_user_question must ask explicitly whether that understanding is correct and you may finalize ONLY this document with those listed open items. Offer Proceed and Decline. An approval for another owner or for the common foundation does not approve this document. If declined or cancelled/unanswered, leave it Draft, record declined or unanswered status and stop. If the tool is unavailable, leave Draft and record blocked. If the user asks for further discussion, continue the relevant frontier rather than assuming approval.",
    "After Proceed, finalize only the approved content, keep unresolved/deferred items visible and cross-reference peer documents. Apply unslop, verify sources and internal links, and record approved status plus the actual scoped confirmation in your artifact. Material edits after approval require a new scoped approval. Do not turn final confirmation into permission for implementation. Your final response contains only your document path and status, never its full text.",
  ].join("\n\n");
}

export default workflow({
  name: "vision-docs",
  description: "Five parallel document owners interview the user and derive approved design docs from docs/vision.md. Documentation only.",
  // Optional objective narrows interview emphasis; it cannot widen file ownership or authorize implementation.
  inputs: {
    objective: Type.Optional(Type.String({
      description: "Optional interview emphasis for the five docs. Omit to derive all five from docs/vision.md. Does not authorize implementation or Git actions.",
    })),
  },
  outputs: {
    status: Type.Union([Type.Literal("completed"), Type.Literal("blocked")]),
    documents: Type.Array(Type.Object({ name: Type.String(), status: Type.String() })),
  },
  run: async (ctx) => {
    const cwd = ctx.cwd ?? process.cwd();
    const artifactDir = `.atomic/workflows/runs/vision-docs/${ctx.runId}`;
    const objective = ctx.inputs.objective ?? "Derive the five design documents from docs/vision.md through prerequisite-aware user interviews.";

    // One concurrent fan-out, exactly five model stages. Peer exchanges add no graph edges.
    await ctx.parallel([
      {
        name: "product",
        prompt: ownerPrompt("product", objective, artifactDir, "Product goals, actors, release scope, capabilities, acceptance criteria and canonical business vocabulary. Coordinate shared foundation decisions for the other four owners."),
      },
      {
        name: "architecture",
        prompt: ownerPrompt("architecture", objective, artifactDir, "System boundaries, components, integration/deployment choices, operational constraints and architectural trade-offs. Distinguish existing repo facts from proposed architecture."),
      },
      {
        name: "database",
        prompt: ownerPrompt("database", objective, artifactDir, "Domain entities, relationships/cardinality, identifiers, lifecycle invariants, persistence constraints, imports, retention and migration decisions. Coordinate shared terms with product and contracts with flows/security."),
      },
      {
        name: "flows-and-api",
        prompt: ownerPrompt("flows-and-api", objective, artifactDir, "User/admin/public journeys, state transitions, API operations, request/response/error contracts, permissions and integration flows. Align entity contracts with database and security decisions with security owner."),
      },
      {
        name: "security-and-edge-cases",
        prompt: ownerPrompt("security-and-edge-cases", objective, artifactDir, "Trust boundaries, authentication/authorization, privacy, abuse threats, failure/concurrency scenarios and recovery behavior. Coordinate business rules with product, persistence with database and API behavior with flows owner."),
      },
    ], {
      concurrency: 5,
      failFast: false,
      context: "fresh",
      cwd,
      model,
      modelConstraints: { allowedModels: ["rawchat/gpt-6.1-sol"], allowedEfforts: ["high"] },
      tools: ["read", "search", "find", "write", "edit", "ask_user_question", "intercom"],
      reads: ["docs/vision.md", ...skills],
      output: false,
      artifacts: false,
    });

    // Read-only synchronous filesystem check, no shell or extra model stage.
    const documents = await ctx.tool("check-five-documents", { artifactDir }, async () =>
      owners.map(({ name, document }) => {
        const path = join(cwd, document);
        if (!existsSync(path)) return { name: document, status: "missing" };
        if (!statSync(path).isFile() || !readFileSync(path, "utf8").trim()) {
          return { name: document, status: "empty" };
        }
        const recordPath = join(cwd, artifactDir, `${name}.json`);
        if (!existsSync(recordPath)) return { name: document, status: "unverified" };
        try {
          const record = JSON.parse(readFileSync(recordPath, "utf8"));
          const approved = record.status === "approved"
            && record.approval?.answer === "Proceed"
            && typeof record.approval?.question === "string"
            && record.approval.question.trim().length > 0;
          return { name: document, status: approved ? "approved" : "draft-unapproved" };
        } catch {
          return { name: document, status: "unverified" };
        }
      }), { timeoutMs: 10_000 });

    if (documents.some((item) => item.status !== "approved")) {
      return ctx.exit({ status: "blocked", reason: "Five-document approval check blocked.", outputs: { status: "blocked", documents } });
    }
    return { status: "completed", documents };
  },
});
