# Operating Targets

Status: user-selected planning assumptions. These targets are not provider verification, an SLA, or a launch approval.

## User-selected assumptions

- Initial monthly budget ceiling: USD 0-10.
- Budget is expected to scale with the number of active Businesses; the ceiling must be revisited as usage grows.
- Candidate region: select the closest available provider region to Egypt by measured latency and actual plan availability. No region name is selected until the account plan and available regions are checked.
- Cloudflare Workers are globally distributed. Supabase/database and its provider-managed data region are the measured/provider-selected region for database operations; Workers global distribution does not imply a database region.
- No product scan analytics are introduced by these operating targets.

## Load scenarios

| Scenario | Active Businesses | Minimum public scans per Business/day | Approx. page requests/day | Approx. page requests/month |
| --- | ---: | ---: | ---: | ---: |
| Initial | 1,000 | 100 | 100,000 | 3,000,000 |
| Growth | 5,000 | 100 | 500,000 | 15,000,000 |

These are planning volumes for public page requests. They are not measured capacity, an availability commitment, or a claim about image, API, database, cache, maintenance, or framework request volume. Scan analytics are not added to satisfy these scenarios.

## Explicit non-claims

This artifact does not claim that the USD 0-10 ceiling is achievable on any provider plan, that either scenario is within quota, that a region is available or optimal, or that latency, throughput, RTO, RPO, backups, restore behavior, cache behavior, image delivery, authentication, RLS, migration safety, or environment isolation has been verified. It does not claim Ticket 01/02 completion, production readiness, deployment, or provider resource creation.

## Provider and physical verification gate

Before launch, an approved operator must record evidence for both scenarios and the selected account configuration:

1. Check the actual Cloudflare Workers, Supabase/database, storage, and required supporting plans, including included quotas, overage pricing, billing minimums, and whether the initial USD 0-10 ceiling is plausible at the measured volumes.
2. Enumerate regions available on the actual account plans. Measure representative latency from Egypt and relevant visitor locations to candidate Worker and database paths, then record the selected region and measurement method. Do not infer the database region from Worker placement.
3. Run an approved staging load test at 100,000 and 500,000 page requests/day equivalent, including authoritative eligibility lookups, cache hit/miss behavior, rendering, and private image delivery as applicable. Record provider quotas, errors, p95/p99 latency, and cost observations. Do not add product scan analytics to the test.
4. Verify provider backup contents, retention, permissions, restore procedure, and reconciliation for relational data and private image objects. Execute and record a restore rehearsal.
5. Establish measured recovery time objective (RTO) and recovery point objective (RPO), record acceptable limits, and demonstrate them during the restore rehearsal. Targets are not satisfied by provider marketing or application retention settings alone.
6. Record separate staging and production identities, projects, buckets, cache namespaces, secrets, and environment checks. Test that cross-environment tokens, objects, and cache entries are rejected.
7. Obtain explicit launch review sign-off against the evidence. Until then, the four external gates in the phase-2 gap analysis remain open.

No `supabase db push`, deployment, resource creation, or secret exposure is authorized by this document.
