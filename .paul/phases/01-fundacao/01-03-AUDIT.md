# Enterprise Plan Audit Report

**Plan:** .paul/phases/01-fundacao/01-03-PLAN.md
**Audited:** 2026-09-24
**Verdict:** Conditionally acceptable → ready for APPLY after applied upgrades

---

## 1. Executive Verdict

**Conditionally acceptable.** Region choice, environment-scoped CD, no-seed rule, and "no secret key in Vercel" are correct. But the original plan (a) let the Vercel Git integration publish commits to production **even with red CI**, (b) put an **account-wide** Supabase personal access token into a public repo's CI, in a job that also ran `pnpm install` — a compromised npm dependency could tamper with the CLI and exfiltrate credentials for every project on the account — and (c) left Supabase Auth's **public signup open**, letting anyone mint `authenticated` users against a staff-only system. All three are fixed below; with them I would approve.

## 2. What Is Solid

- **sa-east-1 / gru1** — keeps third-party personal data in Brazil; defensible LGPD argument.
- **CD gated by `needs: [quality, database]` + `environment: production` restricted to `main`** — PRs and forks never see secrets.
- **Serialized, non-cancellable deploy concurrency** — no interleaved migration pushes.
- **`--dry-run` before push; no `--include-seed`; no `db reset --linked`; no pgTAP on prod** — destructive paths explicitly excluded.
- **Only publishable key in Vercel** — RLS/privileges from 01-02 are the enforcement layer, as designed.
- **Branch protection with `enforce_admins: false`** — adds merge gating without breaking the recorded push-to-main workflow.

## 3. Enterprise Gaps Identified

1. Vercel Git integration deploys to production independently of GitHub CI → red builds (failing lint/tests/pgTAP) still reach production.
2. App and migrations deploy in parallel with no compatibility contract → future app code can hit a schema that isn't there yet.
3. `SUPABASE_ACCESS_TOKEN` is a personal token with access to the whole Supabase account (all orgs/projects) — far beyond "push migrations to one project".
4. Deploy job ran `pnpm install` with secrets present in the job → supply-chain compromise path (malicious package modifies `node_modules/supabase` shim executed with credentials).
5. Supabase Auth public signup enabled by default → arbitrary account creation, email-sending abuse, and larger attack surface for any future policy mistake.
6. Direct DB host is IPv6-only; GitHub runners are IPv4 → CD would fail at first run (operability).
7. Random base64 password inside a connection URL breaks without percent-encoding.
8. Public-repo Actions artifacts/logs are readable by anyone → any dump or row output in CI is a data leak.
9. No documented rollback strategy for failed migrations.
10. No secret scanning / push protection on a public repo handling credentials.
11. Required-check names are coupled to job names; silent breakage on rename.
12. Fork PR previews could receive env vars if fork protection were off.
13. Previews share the production database (no staging).
14. No alerting beyond default GitHub failure emails.
15. Free-tier pause after inactivity.
16. No backups/PITR on free plan.

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Production ships with red CI (gaps 1, 2) | Task 2 action, AC-6, verification | Vercel Deployment Checks require GitHub checks before production (fallback: human-action in dashboard); expand/contract rule documented |
| 2 | Account-wide token + npm code with secrets (gaps 3, 4, 8) | Task 1/3 actions, AC-3, boundaries | Project-scoped `SUPABASE_DB_URL` only; `supabase/setup-cli` pinned by SHA, no `pnpm install` in deploy job; version-sync check; no dumps/rows/artifacts |
| 3 | Public signup open (gap 5) | Task 1 action, AC-6, verification | `enable_signup = false` in config.toml, `supabase config push`; curl proof signup refused |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | IPv6-only direct host (gap 6) | Task 1 action | Session pooler URL (IPv4, port 5432) |
| 2 | Password encoding (gap 7) | Task 1 action | Hex-only password (`openssl rand -hex 24`) |
| 3 | No rollback strategy (gap 9) | Task 3 action (README) | Forward-fix documented; transactional migrations |
| 4 | No secret scanning (gap 10) | Task 3 action, AC-6 | Enable secret scanning + push protection via API |
| 5 | Required-check coupling (gap 11) | Task 3 action (README) | Documented; job `name: Deploy database` fixed |
| 6 | Fork previews (gap 12) | Task 2 action | Verify Git Fork Protection on |
| 7 | Region not verified | Task 1/2 actions | Check sa-east-1 in projects list, gru1 in deploy output |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|----------------------|
| 1 | Separate staging DB for previews (gap 13) | App has no DB client yet; only publishable key + RLS. Revisit in phase 2 when previews start writing. |
| 2 | Alerting on CD failure (gap 14) | GitHub failure notifications to owner suffice for single operator. |
| 3 | Keep-alive for free-tier pause (gap 15) | Only matters for field validation (phase 5). |
| 4 | Backups/PITR (gap 16) | No real data until phase 2/5; required before field validation alongside retention policy. |

## 5. Audit & Compliance Readiness

- **Evidence:** every production DB change is a CI run on `main` with dry-run output in logs; app deploys tied to commits and gated on checks.
- **Silent failures prevented:** red CI can't reach production; version drift between local and CI CLI fails the `database` job.
- **Least privilege:** GitHub holds one project-scoped DB credential; Vercel holds only public keys; Auth closed to self-signup.
- **Would fail a real audit on:** no backups (deferred, free tier) and no staging — acceptable pre-data, tracked.

## 6. Final Release Bar

- **Must be true:** AC-1..AC-6; CI green with `deploy-db`; production URL serves the app; signup refused; no account token in GitHub.
- **Remaining risk:** single production DB shared by previews; no backups until paid tier or phase 5 decision.
- **Sign-off:** I would sign off with the applied upgrades.

---

**Summary:** Applied 3 must-have + 7 strongly-recommended upgrades. Deferred 4 items.
**Plan status:** Updated and ready for APPLY

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*
