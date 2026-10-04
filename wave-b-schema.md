# Wave B schema migration findings

Implemented six forward-only Supabase migrations:

- `0001_initial_schema.sql`: Auth-linked Admin memberships, Businesses, Cards, canonical slug registry, compatibility `business_slug_aliases`, exact Card token uniqueness, lifecycle/status constraints and core indexes.
- `0002_content_and_history.sql`: Sections, Links, normalized hours, image references, append-only Card history and minimized Admin audit events.
- `0003_operations_and_uploads.sql`: idempotency records, import previews, temporary upload objects and image cleanup candidates.
- `0004_security_and_projection.sql`: append-only triggers, overlap/tenant/type/limit checks, timezone consistency, and initial public projection function.
- `0005_rls_and_grants.sql`: restricted public projection and slug lookup functions, anonymous table denial, authenticated grants, RLS, and current-membership policies.
- `0006_maintenance.sql`: server-time update triggers, retention/cleanup selectors, maintenance indexes and least-privilege maintenance function defaults.

The two timestamped fixture migrations were preserved. Their relations are safely superseded: Wave B creates `business_slug_aliases` before the fixture's `create table if not exists`, and creates the canonical `business_images` relation before the fixture's `create table if not exists`; the fixture image shape is therefore not used. The public slug resolver recognizes both the canonical registry and the compatibility alias relation.

## Static validation

- Parentheses are balanced in all six migrations.
- Dependency review confirms every application FK target exists before use. `0001` creates all targets needed by later migrations; Auth references intentionally target provider-owned `auth.users`.
- No destructive `DROP TABLE`/`DROP COLUMN` statements or migration application/push commands were run.
- `npx prettier --check` was attempted but cannot parse SQL because no SQL parser is configured. No `psql`, `supabase`, or `sqlfluff` executable was available in PATH, so a live PostgreSQL parse/apply test was not possible.
- Existing `wrangler.jsonc` and `evidence/` changes were left untouched.

## Unresolved provider-specific risks

1. PostgreSQL/Supabase version must be tested for `auth.users`, `auth.uid()`, `authenticator` roles, `hashtextextended`, `pg_advisory_xact_lock`, deferred constraint triggers, and function privilege behavior.
2. `SECURITY DEFINER` public functions need staging verification with the actual Supabase Data API roles and `search_path`/`EXECUTE` exposure. Public image delivery remains application-mediated; the projection emits opaque image row IDs, never Storage keys.
3. Current-membership RLS policies are intentionally database-level defense in depth. The application must still perform MFA, fresh-TOTP, session, CSRF, expected-version, canonical payload, and same-Business child validation.
4. IANA timezone membership, Unicode NFC/scalar-length rules, contact normalization, full Section settings allowlists, URL parsing without credentials, image decoding/re-encoding, and Storage private-object enforcement require application/provider verification; simple SQL checks do not establish them.
5. The maintenance functions return candidate/deletion work but do not call Supabase Storage. Cleanup workers must lock/recheck current references, treat missing objects as success, retry redacted failures, and mark completion transactionally.
6. Fixture compatibility assumes no production data already exists in either timestamped fixture relation with conflicting shape/semantics. Any staging database containing those fixtures must be inspected before applying Wave B.
7. SQL migration execution still requires staging apply, RLS/grant tests as anonymous/authenticated Admin/non-Admin identities, append-only history tests, concurrent overlap/link-limit tests, and restore/private-object reconciliation rehearsal.
