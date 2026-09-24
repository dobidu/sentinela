# Enterprise Plan Audit Report

**Plan:** .paul/phases/01-fundacao/01-02-PLAN.md
**Audited:** 2026-09-24
**Verdict:** Conditionally acceptable → ready for APPLY after applied upgrades

---

## 1. Executive Verdict

**Conditionally acceptable.** The tenancy model, deny-by-default RLS, hashed reporter token and pgTAP-in-CI approach are the right shape for a system holding third-party geolocation under LGPD. But the original plan relied on RLS as the *only* barrier while Supabase grants `ALL` to `anon`/`authenticated` by default, left the spatial integrity trigger able to **fail open** once a low-privilege role inserts (phase 2), and allowed inspection history to be destroyed by cascade. Those three are release-blocking for a schema that every later phase builds on. With the upgrades applied I would approve it.

## 2. What Is Solid

- **`municipality_id NOT NULL` on every domain table** — policies stay a single uniform predicate; no join-based tenancy that silently breaks.
- **Deny-by-default with zero write policies** — each write path must be introduced deliberately with its own test in the phase that needs it.
- **SECURITY DEFINER helpers with `search_path = ''`** and `(select ...)` wrapping — correct against search_path hijack and per-row re-evaluation.
- **"All public tables have RLS" test via `pg_class`** — catches the most common Supabase leak (new table, RLS forgotten).
- **Hash-only reporter token, `photo_path` instead of URL** — data minimization enforced by schema, not by convention.
- **Types drift check in CI** — schema and app can't diverge silently.
- **Fault-injection proof for RLS tests** — the suite is demonstrably non-vacuous.

## 3. Enterprise Gaps Identified

1. Supabase default privileges grant ALL on new `public` tables/functions to `anon`/`authenticated`; plan revoked only current tables from `anon`, so the next migration's table would be born exposed, and functions keep default `EXECUTE` for `PUBLIC` (callable via PostgREST RPC).
2. Spatial trigger as SECURITY INVOKER: when phase 2 inserts via a role that can't see `municipality` under RLS, the boundary lookup returns nothing and `ST_Covers(NULL, geom)` → NULL → check passes. Integrity fails open.
3. `inspection.report_id ON DELETE CASCADE` — deleting a report destroys field-inspection history (audit trail).
4. Tenant consistency covered inspection↔report and alert↔risk_area only; `inspection.agent_id` and `alert.acknowledged_by` could point to a profile from another município. Trigger-based checks are also bypassable/opaque compared to declarative constraints.
5. ON DELETE behavior unspecified for most FKs — defaults are implicit and inconsistent.
6. `authenticated` retains INSERT/UPDATE/DELETE grants; only RLS-without-policy blocks writes. One permissive policy added later with `for all` would open writes.
7. No test proving staff roles cannot write domain tables.
8. pgTAP extension setup and test isolation unspecified — flaky or order-dependent tests.
9. Migration immutability not stated — editing an applied migration desynchronizes environments (especially after 01-03 links a remote project).
10. Seed with real município names/IBGE codes could be pushed to a remote project in 01-03.
11. Reporter-token hashing contract (who hashes, entropy requirement) undocumented — unsalted SHA-256 is only safe for high-entropy tokens.
12. Supabase CLI with caret range — local and CI may pull different binaries/Docker images.
13. No audit columns / status history on `report`.
14. No CI enforcement of migration immutability.
15. No retention policy for reports/photos (LGPD).
16. Free-text `description` may carry personal data.
17. CLI binary downloaded at postinstall without independent checksum verification.

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Default privileges / function EXECUTE exposure (gaps 1, 6) | Task 2 action, AC-7, verification | Revoke all from `anon` on tables/sequences/functions; revoke EXECUTE from `PUBLIC`; `authenticated` SELECT-only; `alter default privileges` for postgres (and supabase_admin if applicable); pgTAP privilege assertions incl. future table |
| 2 | Spatial trigger fails open (gap 2) | Task 1 action, AC-8, Task 2 tests | SECURITY DEFINER + `search_path=''`; explicit `not found`/NULL → exception; `coalesce(st_covers(...), false)`; tests for missing municipality and low-visibility role |
| 3 | Inspection history destroyed by cascade (gaps 3, 5) | Task 1 action, AC-8 | `inspection.report_id` RESTRICT; explicit ON DELETE for every FK; test DELETE report with inspection → rejected |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Incomplete/opaque tenant consistency (gap 4) | Task 1 action, AC-8 | Composite FKs `(id, municipality_id)` for report, risk_area, profile incl. agent_id and acknowledged_by; cross-tenant tests |
| 2 | Staff write denial untested (gap 7) | AC-4, Task 2 tests | INSERT/UPDATE/DELETE as agent on every domain table must fail |
| 3 | pgTAP setup/isolation (gap 8) | Task 2 action | `create extension pgtap` per file inside transaction, `rollback`, fixed test user ids |
| 4 | Migration immutability (gap 9) | Boundaries RULES, Task 3 README | Rule: never edit committed migrations; documented in README |
| 5 | Seed reaching remote (gap 10) | Boundaries RULES, Task 3 README | Seed local/CI only; 01-03 must not use `--include-seed` |
| 6 | Token hashing contract (gap 11) | Task 1 action | `comment on column` documenting server-side SHA-256 of ≥122-bit random token; LGPD comments on geom/photo/description |
| 7 | CLI version drift (gap 12) | Task 1 action, verification | Exact version pin for `supabase` devDependency |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|----------------------|
| 1 | Audit columns / status history on report (gap 13) | This plan creates **no write path**; status transitions don't exist until triage (v0.2) / aggregation job (phase 3). Must be added with the first write path — logged in STATE. |
| 2 | CI enforcement of migration immutability (gap 14) | Single author, rule documented; add a PR check if a collaborator joins. |
| 3 | Retention policy for reports/photos (gap 15) | No production data until 01-03/phase 2; required before field validation (phase 5). |
| 4 | PII in free-text description (gap 16) | Input surface is phase 2 UI (copy/guidance, length limit already enforced). |
| 5 | CLI binary checksum (gap 17) | Exact version pin + lockfile integrity bound the risk; revisit with SAST item (phase 2). |

## 5. Audit & Compliance Readiness

- **Defensible evidence:** pgTAP suite in CI produces per-commit proof of RLS, privileges, tenancy and spatial integrity; types drift check proves schema/app alignment.
- **Silent failures prevented:** fail-closed trigger; default-privilege test catches exposure of future tables; RLS-enabled test catches forgotten tables.
- **Post-incident reconstruction:** inspection history can no longer be cascaded away. Status-change history is still absent (deferred #1) — would fail an audit once writes exist, hence must land with the first write path.
- **Ownership:** schema changes only via reviewed migrations (immutability rule); cross-tenant operations only via service_role.

## 6. Final Release Bar

- **Must be true before shipping:** AC-1..AC-8 met; `database` and `quality` CI jobs green; fault-injection proof of RLS tests done.
- **Remaining risk if shipped as-is (post-upgrade):** no row history for future writes (deferred, tracked); service_role is an all-powerful key whose handling is 01-03's responsibility.
- **Sign-off:** I would sign off on this schema with the applied upgrades.

---

**Summary:** Applied 3 must-have + 7 strongly-recommended upgrades. Deferred 5 items.
**Plan status:** Updated and ready for APPLY

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*
