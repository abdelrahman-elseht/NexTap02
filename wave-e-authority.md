# Wave E Fresh Authority and Environment Isolation Findings

## Implemented

Wave E adds provider-agnostic runtime helpers without connecting to providers or mutating remote state.

- `lib/runtime-config.mjs`
  - Accepts only explicit `development`, `staging`, or `production` identities.
  - Derives the namespace from the validated environment and rejects mismatched namespaces.
  - Has no production fallback when identity is absent or malformed.
  - Exposes parser, boolean validator, and immutable runtime-config construction.

- `lib/public-authority.mjs`
  - Builds cache keys as `public-business:{environment}:{renderer}:{schema}:{business}:{contentRevision}`.
  - Validates cache-key components and non-negative safe revisions.
  - Treats cache entries as byte lookup metadata only; cache keys and cached content never authorize a request.
  - Requires fresh, injected eligibility and revision resolvers before public cache selection.
  - Requires fresh, injected eligibility, revision, and current-image-reference resolvers for image delivery.
  - Rejects disabled, reassigned, stale-revision, stale-image, malformed, or missing authority results with safe `not_found`/`unavailable` outcomes.
  - Falls back from cache read failure to a fresh projection; cache-fill failure does not fail a valid fresh read.
  - Returns `unavailable` when required dependencies are absent or throw, and does not make network/provider calls.

- `test/wave-e-public-authority.test.mjs`
  - Covers environment identity validation and staging/production namespace separation.
  - Covers disabled and reassigned fail-closed behavior.
  - Covers revision mismatch, cache read failure, cache fill failure, stale cache entry rejection, and origin failure.
  - Covers current image reference gating, old/reassigned image rejection, and image dependency failure.

## Validation

 - `node --check lib/runtime-config.mjs && node --check lib/public-authority.mjs && node --check test/wave-e-public-authority.test.mjs`: passed.
 - `node --test test/wave-e-public-authority.test.mjs`: 9 passed, 0 failed.
 - The repository-wide `npm test` run reached 39 passing tests and 1 unrelated existing failure in `test/wave-f-maintenance-remote-safety.test.mjs`; its asynchronous maintenance-limit rejection is reported as `Missing expected exception` plus an unhandled rejection. No Wave E test failed.

Existing `domain.mjs`, `proxy.js`, routes, and migrations were not edited for this Wave E implementation. The helpers are dependency-injected scaffolding: production integration must supply authoritative database/restricted-projection resolvers, cache adapters, and private object loading at the application boundary. No provider compatibility, deployment, or remote-state behavior is claimed by these tests.
