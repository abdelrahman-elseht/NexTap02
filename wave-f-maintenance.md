# Wave F Maintenance Findings

## Implemented

- Added `lib/maintenance.mjs` with an injected-adapter cleanup orchestrator.
- Added `app/api/internal/maintenance/route.js` as a private POST-only maintenance handler.
- Added `test/wave-f-maintenance-remote-safety.test.mjs` with deterministic fake candidate/object-store adapters.

## Safety behavior

- Cleanup work is bounded by a validated limit (default 100, maximum 1000).
- Candidate state is claimed through the injected candidate adapter; completed candidates are ignored on repeat passes.
- Every candidate is checked against current object references immediately before deletion.
- Current references are marked skipped and never sent to the object store.
- Successful deletion and provider-reported missing objects are terminal completed outcomes.
- Provider failures are recorded as retryable with a stable, redacted failure shape; they are not reported as successful deletion.
- Object storage is accessed only through an injected delete adapter. No R2/provider client, bucket sweep, cron schedule, or remote deletion was configured.
- The route remains disabled (`503`) unless both an internal secret and expected runtime environment identity are configured.
- Requests require the configured secret and matching environment identity. Missing credentials return `401`; mismatches return `403`.
- Malformed/invalid bounded requests return `409`; dependency/runtime failures return safe `503` responses.
- Valid request IDs are propagated through `x-request-id` and JSON response envelopes. Responses are `no-store`.

## Validation

- `node --test test/wave-f-maintenance-remote-safety.test.mjs`: 4 passed.
- `npm test`: 40 passed, 0 failed.
- `node --check lib/maintenance.mjs && node --check app/api/internal/maintenance/route.js`: passed.

## Remaining provider gate

The adapters still need a reviewed production implementation backed by the application's durable candidate/current-reference state and private object store. This change intentionally does not claim provider, environment-isolation, scheduling, or remote deletion verification.
