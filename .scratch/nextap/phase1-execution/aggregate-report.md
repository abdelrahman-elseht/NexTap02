# NexTap phase 1 execution aggregate

Latest run: `20261004t233926Z` (`phase1-execution/20261004t233926Z/evidence.md`)

## Disposition

- Ticket 01: **OPEN / INCOMPLETE**. Local defects and synthetic HTTP/browser seams repaired and verified, but hosted Worker/R2, provider Auth/MFA/RLS/transaction behavior, migration apply, two-environment isolation, and required original ticket scope recovery remain open or blocked.
- Ticket 02: **BLOCKED** for authentic compatibility. No authentic printed Card, QR payload capture, or NFC NDEF evidence/provenance was supplied. Synthetic exact-token fixtures do not close the physical gate.

## Current criterion summary

| Criterion | Status | Note |
| --- | --- | --- |
| D01 fail-closed auth | PASS (local) | Missing verifier/session/membership/MFA dependencies do not authorize. |
| D02 server request IDs | PASS (local/HTTP) | Caller IDs ignored; custom JSON body/header agreement verified after fresh build. |
| D03 committed replay ordering | PASS (local) | Replay precedes stale-version check and actor partitioning is covered. |
| D04 null image object | PASS (local) | Safe `not_found` result. |
| D05 maintenance uncertainty | PASS (local) | Unknown reference state retained retryably; no delete. |
| D06 SQL authorization/projection | PASS (static only) | Additive hardening migration written; no SQL apply or provider probe. |
| D08 Wrangler config drift | PASS (local config) | Stale TOML removed; package commands select uniquely named safe JSON config explicitly. OpenNext build is blocked by the Windows middleware artifact issue; no deploy. |
| Public HTTP/card/business/alias/method semantics | PASS (local HTTP, synthetic) | See run matrix. |
| Browser/RSC/navigation | PASS (local browser, synthetic) | Document/accessibility/network RSC checks ran. |
| Private R2 200/304/503 lifecycle | UNRUN/BLOCKED | No approved R2/Worker target or local R2 binding. |
| Provider Auth/JWT/MFA/session/revocation | BLOCKED | Approved staging identity/project not available. |
| Provider RLS/projection/transaction/idempotency | BLOCKED/UNRUN | No approved project and no isolated SQL stack. |
| Hosted environment isolation | BLOCKED | Two approved nonproduction environments unavailable. |
| Authentic Card/QR/NFC | BLOCKED | Human-provided physical evidence absent. |
| Logs/backups/restore and operating targets | BLOCKED/UNRUN | External launch gates remain open. |

Earlier evidence was not overwritten; this file indexes the latest run only. No PR is needed now; changes remain in the working tree for supervisor review, and any later PR decision belongs to the supervisor after review and gate disposition.
