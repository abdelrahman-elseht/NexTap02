# Operating Targets Validation Evidence

Date: 2026-10-05
Branch: `phase1-hardening`

## Local checks

- `npm test`: **passed**, 40 tests, 0 failed.
- `npm run build`: **passed**. Next.js 16.3.8 compiled successfully; route output included `/api/admin/session`, `/api/internal/maintenance`, `/api/public/images/[imageId]`, `/b/[slug]`, `/c/[cardId]`, and Proxy.
- `node --check` on changed and relevant JavaScript (`proxy.js`, `worker-wrapper.mjs`, shared HTTP response, auth, idempotency, operations, runtime, authority, maintenance, image route, and maintenance route): **passed**.
- `git diff --check -- docs/OPERATING_TARGETS.md docs/PHASE2_GAP_ANALYSIS.md`: **passed**.
- SQL static checks without applying migrations: **passed**. Parentheses were balanced in all `supabase/migrations/*.sql`; migration inventory scan completed. No SQL parser, `psql`, or migration apply was run.

## Implementation inspection

No concrete defect was demonstrated in the inspected request-ID decoration, redirect/ETag ordering, private image route, auth boundary, idempotency helpers, runtime isolation, maintenance route, or six-wave SQL ordering. Existing focused tests cover the local behavior while the wave reports identify provider/runtime integration as unverified scaffolding or gates.

## Not performed

No `supabase db push`, deployment, resource creation, provider mutation, live load test, provider billing/plan/region/latency check, RTO/RPO rehearsal, or secret exposure was performed. The values in [OPERATING_TARGETS.md](OPERATING_TARGETS.md) remain user-selected assumptions, not provider-verified targets.

## Remaining gates

The four external gates remain open: approved staging migration/auth/RLS/R2/Worker probes; cross-environment isolation; browser/RSC and authentic token evidence; and production review only after those checks. Provider plan/cost, region availability and measured latency, quotas, backups/restore, RTO, and RPO also require approved verification before launch.
