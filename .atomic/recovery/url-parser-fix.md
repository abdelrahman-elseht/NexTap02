# URL/source evidence recovery

## Outcome

Fixed the workflow at [`vision-docs-continuation.ts`](../workflows/vision-docs-continuation.ts). The patch addresses the actual `freeze-exact-candidates` failure and hardens Markdown link classification. No workflow was launched, resumed, restarted, quit, or approved. The five documents, saved reports, original artifacts, ledger, and answers remain unchanged.

## Root cause

Run `10006fa1-5292-4ab3-9d4b-b5144171947b` failed in `freeze-exact-candidates` while evaluating `report.sources.map(...)`, before `checkLinks` ran. The old code treated every report source as a local path and called `read(cwd, source.path)`. A source such as `https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/` was resolved on Windows as a path containing backslashes, producing the reported `ENOENT`:

`stat 'F:\projects\NexTap02-main\https:\developers.cloudflare.com\workers\framework-guides\web-apps\nextjs'`

The saved Architecture report confirms that URL at `round-0/architecture.json:123-124`. The run status supplied by the parent identifies tool `freeze-exact-candidates` (`idtool:h3a7d80e510cdff45ef922c14b118daf8`) as the failing boundary, with no approvals.
The pre-fix bounded reproduction produced the same ENOENT with a stack pointing to the former `vision-docs-continuation.ts:367` source-map expression. The saved Markdown URL uses forward slashes; its backslashes in the error come from Windows filesystem path resolution.

## Fix applied

The code change is confined to `.atomic/workflows/vision-docs-continuation.ts`; this recovery note is the only additional retained workspace file.

- Added `isExternalReference` at lines 94-97. It normalizes `\\` to `/` before recognizing URI schemes and protocol-relative references. Both slash and backslash forms of `http`/`https` are skipped by `checkLinks`.
- Added `workspacePath` at lines 98-102. Relative Markdown links are checked after decoding and are rejected if their normalized path escapes `cwd`; existing local links continue to be read and SHA-256 hashed.
- Added `sourceEvidence` at lines 104-110. External report references receive `status: "external-not-content-hashed"` and no fabricated hash. Local sources retain `status: "local-content-hashed"` and their hash. The workflow's explicitly listed local skill files on `C:/...` remain locally hashed; other drive-qualified report references remain external references without content hashes.
- Freeze, approval preflight, and final verification now use the source evidence status. External references are retained in approval/final records and explicitly described as lacking captured content, root fetching, content hashes, and freshness verification. Local source hash revalidation remains enforced.
- Added optional `reuseAllCandidateDir` input at lines 157 and 172-175. It validates all five saved reports against the strict schema, owner/document/artifact identity, 47 settled keys, null approval, current document hashes, and deterministic destination guards. It skips model stages and proceeds to the existing root freeze and scoped approval gates. The existing three-report `reuseCandidateDir` path remains supported; both options cannot be combined. The legacy-gate normalization is still exact and does not suppress arbitrary facts.

## Validation evidence

The final isolated in-memory workflow boundary harness passed all 37 scenarios (exit code 0). It invoked the definition with mocked context/filesystem callbacks, without an Atomic runtime launch, real prompts, approvals, or document writes. Initial harness setup accidentally produced two temporary bounded run directories and a `nul` redirection file; those were removed. Final filesystem hash checks confirm retained evidence is unchanged.

- Freeze with all five saved reports reached the first scoped approval prompt, made zero model-stage calls, and did not read any `http`/`https` path as a filesystem path.
- `http://`, `https://`, `http:\\`, `https:\\\\`, `//host`, and `\\host` Markdown targets were skipped.
- Existing `vision.md` relative link was hashed.
- Missing relative link still failed with `ENOENT`.
- `../../outside.md`, encoded `%2e%2e` traversal, and backslash traversal were rejected before reading.
- Mocked all-five apply/final verification preserved nine external HTTPS references without `sha256`/`finalSha256` and retained local source hashes.
- Strict input checks accepted defaults, the three-report seed input, and the all-five seed input; wrong types, empty values, and unknown keys failed.
- Both seed modes were rejected together before writes.
- The original three-report seed mode reused three owners and made exactly one mocked owner frontier for the two pending owners.
- All-five seed guards rejected wrong owner/document/artifact, non-null approval, blocked status, unknown or missing decision keys, extra properties, malformed JSON, missing directory, new questions, changed document hash, and differing destination before imported report writes or prompts.
- Arbitrary changed facts remained blockers. The exact known legacy fact was converted only to the existing visible `deferred-gate` with provenance.
- Local source drift and candidate drift blocked apply before document writes. Mocked `Decline` recorded a blocked outcome without finalization.
- Retained workspace hash check passed for 38 pre-existing files after excluding the intentionally changed workflow and recovery output; no `nul` or bounded run directories remain.

A separate isolated Atomic extension check passed:

- `reload`: `ok`, `outcome: applied`, 11 workflows, generation 1, diagnostics `[]`.
- `get vision-docs-continuation`: completed inspection result exposing `reuseAllCandidateDir`.
- `inputs vision-docs-continuation`: exposed the same new optional input and its no-combination/reuse description.

The workflow source SHA-256 after the fix is `48947a68527d6ac16c1647274be567a481df052a8e24ce7d21223237e145d99d`.

## Recommended parent action

Reload the workflow registry, then launch a **fresh** continuation using the all-five saved candidate directory:

```json
{
  "acceptedLedger": ".atomic/recovery/accepted-decisions.json",
  "sourceArtifactDir": ".atomic/workflows/runs/vision-docs/7d321cbd-e1f9-4f2d-b528-0aebf2dbaac8",
  "reuseAllCandidateDir": ".atomic/workflows/runs/vision-docs-continuation/10006fa1-5292-4ab3-9d4b-b5144171947b/round-0"
}
```

The supported reuse directory is the exact saved `10006.../round-0` directory. Leave `reuseCandidateDir` unset. The fresh run should perform deterministic validation and present five separate Proceed/Decline approval prompts. Do not infer approval from seed reuse, freeze success, reports, or this recovery note. The documents remain Draft and unapproved until the parent obtains and relays explicit scoped human approvals.
