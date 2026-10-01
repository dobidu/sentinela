---
phase: 01-fundacao
plan: 03
subsystem: infra
tags: [supabase, vercel, github-actions, cd, branch-protection, lgpd, sa-east-1]

requires:
  - phase: 01-01
    provides: pipeline CI (job quality, SHA-pin, Dependabot)
  - phase: 01-02
    provides: migrations PostGIS + RLS, job database, regras (migrations imutáveis, seed nunca remoto)
provides:
  - Projeto Supabase `sentinela` (sa-east-1) com 2/2 migrations, sem seed, signup fechado
  - App em produção na Vercel (gru1) via Git integration — https://sentinela-sigma-eosin.vercel.app
  - Job `deploy-db` (CD de migrations) no environment `production`, credencial escopada ao projeto
  - Gate de produção (Vercel Deployment Checks) + branch protection em `main`
  - Secret scanning + push protection; `.env.example`; README com seção Deploy
affects: [fase 2 relato (cliente Supabase, previews com escrita → staging), fase 5 validação (backups, keep-alive free tier)]

tech-stack:
  added: [Supabase gerenciado (free, sa-east-1), Vercel (gru1), supabase/setup-cli v3.0.1]
  patterns:
    - "CD de banco sem dependências npm: CLI via setup-cli por SHA, versão sincronizada com package.json (check no job database)"
    - "Única credencial de CD: SUPABASE_DB_URL (session pooler IPv4), só no env: dos steps"
    - "App e migrations publicam em paralelo → expand/contract; falha de migration → forward-fix"
    - "Produção só com CI verde (Deployment Checks da Vercel)"

key-files:
  created: [.env.example]
  modified: [.github/workflows/ci.yml, supabase/config.toml, package.json, README.md]

key-decisions:
  - "Signup fechado via Management API (PATCH só disable_signup) em vez de `supabase config push`"
  - "Env de preview na Vercel configurada via REST API (CLI exigia branch)"
  - "CD usa só SUPABASE_DB_URL — nenhum access token de conta no GitHub"

patterns-established:
  - "Mudança de config remota do Supabase: PATCH pontual na Management API, nunca push da config local inteira"
  - "Renomear jobs quality/database exige atualizar branch protection e Deployment Checks"

duration: ~40min (APPLY, incluindo 3 human-actions)
started: 2026-09-24T18:50:00Z
completed: 2026-09-24T19:30:00Z
description: "Supabase em São Paulo com CD de migrations escopado ao projeto, app na Vercel gru1 promovido só com CI verde, main protegida"
type: Summary
about: "sentinela"
---

# Phase 1 Plan 03: Deploy Summary

**Sentinela no ar: banco Supabase em sa-east-1 com schema 01-02 aplicado por job de CD (credencial única escopada ao projeto), app Next.js na Vercel `gru1` que só promove a produção com os checks do CI verdes, e `main` protegida.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~40min (APPLY) |
| Tasks | 3 auto PASS + 2 checkpoints (login, verify) aprovados |
| Human actions | 3 (supabase login; app Vercel no GitHub; Deployment Checks no dashboard) |
| Files | 1 criado, 4 modificados |
| CI | run [36048056605](https://github.com/dobidu/sentinela/actions/runs/36048056605) (bfa880c) e [36062974361](https://github.com/dobidu/sentinela/actions/runs/36062974361) (26da6bc) — 3 jobs verdes |
| Deploy database | ~20s, "Remote database is up to date" |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Banco remoto com schema e sem seed | Pass | ref `ftibuibtjgqxwthwvthf`, sa-east-1; migrations 2/2; `municipality` = 0; anon_grants = 0; tabelas sem RLS = 0; advisors security limpo; REST anon → 42501 |
| AC-2: App em produção | Pass | URL de produção responde com `lang="pt-BR"` e `<h1>` "Sentinela" (reconferido 2026-10-01); preview em PR funciona (PR #4 gerou preview); só as 2 env `NEXT_PUBLIC_*` em production + preview |
| AC-3: CD de migrations controlado | Pass | `deploy-db` needs quality+database, só push em main, environment `production`, concurrency sem cancelamento; só `SUPABASE_DB_URL`; setup-cli por SHA na versão 2.117.0, sem `pnpm install`; sem dump/artifact; "up to date" sem alterar banco; em PR fica `skipping` |
| AC-4: main protegida | Pass | 2 checks obrigatórios; force-push e deleção off; `enforce_admins=false` (decisão do plano) |
| AC-5: Segredos e documentação | Pass | `git grep` sem chave real (só menções em docs `.paul/` e hash de integridade do lockfile); `.env.example` com placeholders; README com Deploy, expand/contract, forward-fix, nota de required checks, Status/Roadmap atualizados |
| AC-6: Produção só com CI verde e Auth fechado | Pass | Commit vazio `bfa880c`: alias ficou no deploy anterior durante o CI e moveu 11s após `Deploy database` (19:28:01Z → 19:28:12Z); signup recusado; secret scanning + push protection on |

## Accomplishments

- Fluxo `push main → CI (quality + database) → Deploy database → Vercel promove` sem passo manual, comprovado com commit vazio.
- Repositório público sem nenhuma credencial com alcance de conta: CD usa só a connection string do projeto; Vercel só tem chave publishable.
- Dados de cidadão no Brasil: banco em sa-east-1, funções em gru1.
- Proteção de drift funcionando sozinha: em 2026-10-01 o PR #4 do Dependabot (bump da CLI no package.json) foi barrado pelo check "Supabase CLI version sync" (run 36819980874).

## Task Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| Plano/audit (.paul) | `b599cbb` | docs | SUMMARY 01-02, PLAN + AUDIT 01-03 |
| Tasks 1–3 | `ad5a310` | ci | Job deploy-db, config.toml (signup off), scripts db:push, .env.example, README Deploy |
| Checkpoint | `bfa880c` | chore | Commit vazio para verificar Deployment Checks |
| Pós-APPLY | `21ba47d` | docs | README: modelo de dados, privacidade, estrutura |
| Registro APPLY | `26da6bc` | docs | STATE/ledger/paul.toml |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `.github/workflows/ci.yml` | Modified (+47) | Job `deploy-db`; check de sincronia da versão da CLI no job `database` |
| `supabase/config.toml` | Modified | `[auth] enable_signup = false` |
| `package.json` | Modified | Scripts `db:push`, `db:push:dry` |
| `.env.example` | Created | 2 variáveis públicas com placeholders + aviso sobre chaves secretas |
| `README.md` | Modified | Seção Deploy + Status/Roadmap corrigidos (exceção declarada no plano) |

Infra fora do repo: projeto Supabase, projeto Vercel (`dobidus-projects/sentinela`, gitForkProtection on), environment GitHub `production` (secret `SUPABASE_DB_URL`, var `SUPABASE_PROJECT_REF`), branch protection, secret scanning.

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Signup fechado por PATCH na Management API (só `disable_signup`) | `supabase config push` enviaria a config local inteira (ex.: `site_url` 127.0.0.1) | Config remota alterada só no campo pretendido; `site_url` remoto = URL de produção |
| Env de preview via REST API da Vercel | CLI exigia nome de branch para preview | Env aplica a todos os previews |
| Deployment Checks configurados no dashboard | Sem API disponível | Human action registrada; renomear jobs exige atualizar lá também |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Approach changes | 2 | Signup via Management API; env preview via REST |
| Human actions extras | 2 | App Vercel no GitHub; Deployment Checks no dashboard (previstos como possíveis no plano) |
| Scope additions | 1 | Commit `21ba47d` (README: modelo de dados, privacidade) — só documentação |
| Deferred | 1 novo | Roll da secret key `default` |

**Total impact:** Desvios só de método; nenhum AC afrouxado, nenhuma expansão de código.

### Issues Encountered

| Issue | Resolution |
|-------|------------|
| Primeiro deployment (`ad5a310`) mostrou "no checks configured" — checks recém-configurados | Verificado com commit vazio `bfa880c`; gate comprovado |
| `supabase login` exige TTY | Usuário rodou em terminal próprio |
| Listagem de api-keys exibiu 4 chars aleatórios da secret key `default` (4 chars do prefixo aleatório; aparecem no histórico git do STATE.md) | Key não usada em lugar nenhum; **roll recomendado** — deferido (ver abaixo) |

### Deferred Items

- Roll da secret key `default` do Supabase (exposição parcial de 4 chars; não usada) — S, antes da fase 2 (quando surgir uso de chave secreta).
- PR #4 do Dependabot: CLI do Supabase no package.json diverge do `version:` do setup-cli no workflow → precisa bump sincronizado (ou config do Dependabot que agrupe os dois). PRs #2 (@types/node 26) e #3 (TypeScript 6) abertos — major, avaliar.

## Next Phase Readiness

**Ready:**
- Env `NEXT_PUBLIC_SUPABASE_URL`/`PUBLISHABLE_KEY` prontas em production + preview para o cliente Supabase da fase 2.
- Qualquer migration nova da fase 2 chega a produção pelo CD, com gate.

**Concerns:**
- Banco único: previews da Vercel apontam para produção. Antes do 1º caminho de escrita (fase 2) → staging separado ou previews sem escrita (deferido Audit 01-03).
- Free tier pausa após ~7 dias sem atividade; backups/PITR ausentes (deferidos para fase 5).
- Expand/contract é regra documentada, não verificada por CI.

**Blockers:** None

---
*Built with PAUL Framework v1.4 · https://chrisai.cv/skool · https://youtube.com/@chris-ai-systems*
*Phase: 01-fundacao, Plan: 03*
*Completed: 2026-09-24 (UNIFY: 2026-10-01)*
