# Enterprise Plan Audit Report

**Plan:** .paul/phases/01-fundacao/01-01-PLAN.md
**Audited:** 2026-09-24
**Verdict:** Conditionally acceptable → ready for APPLY after applied upgrades

---

## 1. Executive Verdict

**Conditionally acceptable.** Scope is correct and tightly bounded (scaffold + test harness + CI, nothing else), but the original plan had three defects that would make the "reproducible from a clean clone" promise false in practice: pnpm ≥10 build-script blocking, typecheck depending on build artifacts (`.next/`, `next-env.d.ts`) that don't exist when CI runs typecheck before build, and ESLint linting generated `coverage/` output. It also left CI supply chain uncontrolled on a **public** repository (mutable action tags, persisted credentials, no update mechanism). With the upgrades below applied, I would approve it.

## 2. What Is Solid

- **Scope boundaries** — explicitly excludes Supabase, deploy, secrets, PWA. No secrets in CI means fork PRs can't exfiltrate anything; `pull_request` (not `pull_request_target`) is the correct trigger.
- **`permissions: contents: read`** at workflow level — least privilege by default.
- **AC-3 (gate must fail when it should)** — proves the gate isn't vacuous; most CI setups never verify this.
- **No global coverage threshold** — the ≥70% target is scoped to the core (aggregation + validation); a global threshold now would either be meaningless or block trivial UI.
- **Human checkpoint before commit/push** — consistent with `auto_commit: false` and outward-facing action on a public repo.
- **Scaffold in temp dir + merge** — avoids `create-next-app` clobbering `.paul/`, README, LICENSE, `.gitignore`.

## 3. Enterprise Gaps Identified

1. pnpm ≥10 blocks dependency lifecycle scripts by default; unapproved packages (e.g. `sharp`, `unrs-resolver`) either fail install (strict mode) or silently skip native builds.
2. `tsc --noEmit` on a clean tree may fail (or silently lose Next ambient types) because `next-env.d.ts` is generated/gitignored and references `.next/types`; CI runs typecheck **before** build.
3. `eslint .` without ignores for `coverage/`/`.next/` breaks locally after `test:coverage` — "works in CI, fails on my machine" drift.
4. Third-party actions pinned to mutable major tags on a public repo — tag hijack = arbitrary code in CI.
5. No dependency/action update mechanism — SHA pinning without Dependabot rots.
6. `actions/checkout` persists the GITHUB_TOKEN in `.git/config` by default — unnecessary credential exposure to later steps.
7. `cancel-in-progress: true` on `main` pushes drops the status of intermediate main commits — loses per-commit evidence.
8. Coverage artifact upload without `if-no-files-found: error` — missing coverage passes silently.
9. "Clean clone" AC-1 verified only in a dirty working tree (existing `node_modules`, `.next`).
10. Resolved tool versions not recorded — `create-next-app@latest` is non-deterministic; academic reproducibility needs the versions.
11. `.serena/` untracked but not ignored — `git add -A` at checkpoint would publish local tool config.
12. Next.js telemetry enabled in CI by default.
13. No branch protection requiring CI on `main`.
14. No SAST / dependency vulnerability scanning.

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | pnpm build-script blocking (gap 1) | Task 1 action/verify, AC-6, frontmatter | Explicit `pnpm-workspace.yaml` allow/deny list; verify no undeclared "Ignored build scripts" |
| 2 | Typecheck depends on build artifacts (gap 2) | Task 1 action/verify, AC-6 | Typecheck must pass with no `.next/` / `next-env.d.ts`; fallback `next typegen && tsc --noEmit` |
| 3 | ESLint lints generated output (gap 3) | Task 1 action, Task 3 verify, AC-6 | Ignore `.next/**`, `coverage/**`, `out/**`, `build/**`, `next-env.d.ts`; re-run lint with `coverage/` present |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Mutable action tags (gap 4) | Task 3 action/verify, AC-7 | Pin every `uses:` to full SHA with tag comment; grep check |
| 2 | No update mechanism (gap 5) | Task 3 action, AC-7, frontmatter | `.github/dependabot.yml` weekly for github-actions + npm, grouped minor/patch |
| 3 | Persisted checkout credentials (gap 6) | Task 3 action, AC-7 | `persist-credentials: false` |
| 4 | Main runs cancelled (gap 7) | Task 3 action | `cancel-in-progress` only for `pull_request` |
| 5 | Silent missing coverage (gap 8) | Task 3 action | `if-no-files-found: error` |
| 6 | Clean-clone not actually tested (gap 9) | Task 3 action, AC-6, verification | Full CI sequence in rsync'd copy without build artifacts |
| 7 | Versions not recorded (gap 10) | Task 1 action, verification | SUMMARY records resolved versions |
| 8 | `.serena/` commit risk (gap 11) | Task 1 action/verify, checkpoint | Add `.serena/` to `.gitignore`; checkpoint checklist of excluded paths |

Also applied (low cost, folded into #1–#8 edits): `NEXT_TELEMETRY_DISABLED=1` in CI (gap 12); Conventional Commits message at checkpoint.

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|----------------------|
| 1 | Branch protection requiring CI on `main` (gap 13) | Repo setting, not code; single-author academic repo pushing directly to `main` per recorded git strategy. Revisit before any collaborator joins or at 01-03 deploy. |
| 2 | SAST / dependency vuln scanning (gap 14) | No app logic or user data yet; Dependabot alerts cover known CVEs. Revisit in phase 2 when handling photos/GPS. |
| 3 | E2E tests (Playwright) | No user flow exists yet; belongs to phase 2 (report flow). |
| 4 | SBOM / license compliance of dependencies | Only template deps; relevant for article appendix in phase 5. |

## 5. Audit & Compliance Readiness

- **Defensible evidence:** after upgrades — per-commit CI status on `main` (no cancellation), coverage artifact, recorded versions in SUMMARY, AC-3 proof that gates fail.
- **Silent failures prevented:** build-script blocking, missing coverage, and lint drift now fail loudly.
- **Post-incident reconstruction:** SHA-pinned actions + lockfile + recorded versions make any CI run reproducible.
- **Ownership:** single author; checkpoint makes the human the explicit approver of what gets published. Would fail a real multi-person audit only on branch protection (deferred, justified).

## 6. Final Release Bar

- **Must be true before shipping:** AC-1..AC-7 met; CI green on GitHub; clean-copy run green; no undeclared ignored build scripts.
- **Remaining risk if shipped as-is (post-upgrade):** direct pushes to `main` bypass CI gating (status is visible but not enforced).
- **Sign-off:** I would sign off on the plan with the applied upgrades.

---

**Summary:** Applied 3 must-have + 8 strongly-recommended upgrades. Deferred 4 items.
**Plan status:** Updated and ready for APPLY

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*
