# Wave D — durable idempotency/transaction domain scaffolding

Implemented the Wave D domain scaffolding without representing process memory as durable storage.

## Changed files

- `lib/idempotency.mjs`
  - Deterministic recursive canonicalization and SHA-256 request digests.
  - `Idempotency-Key` validation for 1–128 printable ASCII characters, with throwing assertion helper.
  - Scope/actor/resource binding digest and identity helpers.
- `lib/operations.mjs`
  - Transaction adapter boundary (`createTransactionAdapter`) with an injected transaction callback.
  - Explicitly non-durable `createMemoryTransactionAdapter` for deterministic tests (`durable: false`, `durability: "process-local"`).
  - Idempotent execution decisions: `committed`, `replay`, `conflict`, `in_progress`, and `unauthorized`.
  - Request digest and binding checks happen before replay; authorization is evaluated on every call, including replay.
  - Expected-version helpers return/throw a `stale_version` conflict.
- `test/wave-d-idempotency.test.mjs`
  - Deterministic tests for first commit/replay, canonical digest behavior and key validation, changed-payload conflict, in-progress state, stale version, and revoked replay authorization.

## Durability boundary

The domain layer does not claim cross-process durability. Production code must inject a database transaction callback through `createTransactionAdapter`; the provided in-memory adapter is process-local test scaffolding only. The transaction callback is responsible for implementing the storage-level atomicity/uniqueness guarantees.

## Validation

- `node --test test/wave-d-idempotency.test.mjs`: 6 passed.
- `npm test`: 24 passed, 0 failed.
