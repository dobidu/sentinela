---
phase: 01-fundacao
plan: 02
subsystem: database
tags: [supabase, postgres, postgis, rls, pgtap, lgpd, github-actions]

requires:
  - phase: 01-01
    provides: pipeline CI (padrão SHA-pin, ordem de scripts), pnpm/allowBuilds, harness de tipos
provides:
  - Schema PostGIS com 6 entidades e municipality_id em toda tabela de domínio
  - RLS deny-by-default + higiene de privilégios (anon zero, authenticated só SELECT)
  - Trigger espacial fail-closed (ponto dentro do limite do município)
  - 87 testes pgTAP (schema + RLS/privilégios)
  - Tipos TypeScript gerados (src/lib/database.types.ts)
  - Job `database` no CI (migrations, pgTAP, lint, advisors, drift de tipos)
affects: [01-03 deploy (db push sem seed), fase 2 relato (1º caminho de escrita, RPC/policy + auditoria), fase 3 agregação (service_role, grid), fase 4 dashboard (leitura por município)]

tech-stack:
  added: [supabase CLI 2.117.0, PostgreSQL 17, PostGIS, pgTAP 1.3.3]
  patterns:
    - "Tenancy por FK composta (x_id, municipality_id) — não por trigger"
    - "Funções SECURITY DEFINER sempre com search_path = '' e nomes qualificados"
    - "Nenhuma FK apaga histórico em cascata (RESTRICT); só profile→auth.users é CASCADE"
    - "Toda função nova em public precisa de GRANT EXECUTE explícito (default revogado)"

key-files:
  created: [supabase/config.toml, supabase/migrations/20260924181454_init_schema.sql, supabase/migrations/20260924181837_rls_base.sql, supabase/seed.sql, supabase/tests/database/schema.test.sql, supabase/tests/database/rls.test.sql, src/lib/database.types.ts]
  modified: [package.json, pnpm-lock.yaml, .github/workflows/ci.yml, README.md]

key-decisions:
  - "reporter_token só como hash SHA-256 (bytea 32)"
  - "anon sem nenhum privilégio até a fase 2"
  - "Roles restritos ao próprio município; cross-município só service_role"
  - "photo_url→photo_path; User→profile; municipality_id em toda tabela"
  - "db:advisors (security) no CI"

patterns-established:
  - "Migrations imutáveis após main; seed só local/CI"
  - "Testes pgTAP autocontidos (fixtures próprias, rollback), independentes do seed"
  - "Prova de não-vacuidade: fault injection antes de aceitar suíte de segurança"

duration: ~25min (APPLY)
started: 2026-09-24T18:10:00Z
completed: 2026-09-24T18:30:00Z
description: "Schema PostGIS multi-município com RLS deny-by-default, 87 testes pgTAP e job database no CI verde"
type: Summary
about: "sentinela"
---

# Phase 1 Plan 02: Schema PostGIS + RLS Summary

**Schema PostGIS das 6 entidades com tenancy por FK composta, trigger espacial fail-closed, RLS deny-by-default com privilégios mínimos, 87 testes pgTAP e job `database` no CI — verde no primeiro push.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~25min (APPLY) |
| Tasks | 4 of 4 (3 auto PASS + checkpoint aprovado) |
| Files | 7 criados, 4 modificados |
| CI | run [36041240519](https://github.com/dobidu/sentinela/actions/runs/36041240519) — database 139s, quality 42s |
| pgTAP | 87 testes (schema 41, rls 46) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Banco local reproduzível | Pass | `db:start` aplica 2 migrations + seed; `db:reset` 2× seguidas exit 0; CI sobe banco novo |
| AC-2: Schema cobre o modelo com tenancy | Pass | 6 tabelas, `municipality_id NOT NULL` em 5, geometrias SRID 4326 com GiST, 5 enums, sem token em claro (pgTAP) |
| AC-3: Integridade espacial | Pass | Fora do limite → 23514; SRID 4674 → 22023; dentro aceito; update para fora rejeitado |
| AC-4: RLS deny-by-default e isolamento | Pass | anon 42501; agent A só vê A; surveillance B só vê B; sem profile vê 0; escrita de staff → 42501 em todas as tabelas; escalonamento de role bloqueado |
| AC-5: Testes e CI | Pass | `db:test` verde local e no CI; job `database` roda test, lint, advisors, drift; `quality` inalterado e verde |
| AC-6: Tipos gerados | Pass | Determinístico (2 gerações idênticas); drift provocado quebra o check; lint/typecheck/test verdes |
| AC-7: Higiene de privilégios | Pass | anon 0 grants; authenticated só SELECT; nem anon nem PUBLIC executam funções; tabela criada depois nasce sem grant para anon |
| AC-8: Fail-closed e trilha | Pass | Município inexistente → 23503; role sem visibilidade de municipality não insere ponto fora; DELETE de report/usuário/município com histórico → 23503; FKs compostas cross-tenant → 23503 |

## Accomplishments

- Duas barreiras independentes contra vazamento de dado de terceiro: privilégios mínimos **e** RLS — cada uma provada por teste.
- Trigger espacial provado fail-closed para o cenário da fase 2 (insert por role sem visibilidade de `municipality`).
- Suíte de segurança comprovadamente não-vazia: RLS desligado + policy permissiva em `report` → 5 testes falham.

## Task Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| Plano/audit (.paul) | `11df787` | docs | SUMMARY 01-01, PLAN + AUDIT 01-02 |
| Tasks 1–3 | `6f4ab75` | feat | Migrations, seed, pgTAP, tipos, job database, README |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/config.toml` | Created | Projeto local `sentinela`, Postgres 17 (defaults da CLI) |
| `supabase/migrations/20260924181454_init_schema.sql` | Created | PostGIS, enums, 6 tabelas, índices, FKs compostas, trigger espacial, comentários LGPD |
| `supabase/migrations/20260924181837_rls_base.sql` | Created | Revokes, default privileges, RLS, helpers SECURITY DEFINER, policies SELECT |
| `supabase/seed.sql` | Created | 2 municípios sintéticos (IBGE reais, limites retangulares) |
| `supabase/tests/database/schema.test.sql` | Created | 41 testes: estrutura, enums, LGPD, espacial, fail-closed, tenancy, trilha |
| `supabase/tests/database/rls.test.sql` | Created | 46 testes: RLS, privilégios, anon, isolamento A/B, escrita negada, sem profile, helpers |
| `src/lib/database.types.ts` | Created | Tipos gerados do schema public |
| `package.json` / `pnpm-lock.yaml` | Modified | `supabase` 2.117.0 exato; scripts `db:start/stop/reset/test/lint/advisors/types` |
| `.github/workflows/ci.yml` | Modified | Job `database` (paralelo ao `quality`, SHA-pin) |
| `README.md` | Modified | Seção "Banco de dados local" + regras (+22/−0) |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Revogar EXECUTE de PUBLIC via default privileges **global** de `postgres` | `ALTER DEFAULT PRIVILEGES IN SCHEMA` não revoga o EXECUTE implícito de PUBLIC | Toda função criada por `postgres` (qualquer schema, inclusive extensões futuras) nasce sem EXECUTE público; RPCs novas exigem GRANT explícito |
| Não alterar default privileges de `supabase_admin` | `postgres` não é membro de `supabase_admin` | Coberto porque migrations criam objetos como `postgres`; teste da tabela futura prova |
| `db:advisors` (security, fail-on warn) no CI | Custo baixo; pega classes de erro que o lint não pega (RLS off, função exposta) | Job `database` +1 passo |
| Testes com fixtures próprias (municípios `9999901/02`) | Independência do seed e entre arquivos | Seed pode mudar sem quebrar testes |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Ajuste de teste (PG17) |
| Scope additions | 1 | `db:advisors` no CI |
| Plan assumptions not needed | 3 | Simplificações |
| Deferred | 0 novos | — |

**Total impact:** Nenhuma expansão relevante; premissas do plano sobre a CLI estavam desatualizadas e foram simplificadas.

### Auto-fixed Issues

**1. Teste do role sonda falhou em `set role`**
- **Found during:** Task 2 — **Issue:** `permission denied to set role "probe_inserter"` (PG17: criador não vira membro automaticamente) — **Fix:** `grant probe_inserter to postgres` no teste — **Verification:** 41/41 no schema.test.sql

### Scope additions
1. Script `db:advisors` + passo no job `database`.

### Plan assumptions not needed
1. `allowBuilds: supabase: true` — CLI 2.117 distribui binário por `optionalDependencies`, sem postinstall; install sem avisos.
2. Desligar serviços no `config.toml` — `db start` só sobe Postgres; defaults mantidos (auth/storage serão usados nas fases 2/01-03).
3. Ignore do `database.types.ts` no ESLint — lint limpo sem ignore.

### Deferred Items
None novos (itens do audit já registrados em STATE.md).

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Primeiro `db:start` levou ~1m50 (pull de imagens) | Esperado; CI levou 139s total no job |
| Verificação de drift com `git add -N` deu falso positivo (intent-to-add mostra conteúdo inteiro) | Refeito com `cmp` contra geração anterior; CI usa arquivo versionado, sem o problema |

## Next Phase Readiness

**Ready:**
- Schema e RLS prontos para 01-03 (`supabase db push` no projeto remoto — **sem seed**).
- Tipos TS disponíveis para o cliente Supabase da fase 2.

**Concerns:**
- **1º caminho de escrita (fase 2):** precisa de RPC/policy de insert anônimo + rate limit por `reporter_token_hash` + colunas de auditoria/histórico de status (deferido do audit como obrigatório nesse momento) + GRANT EXECUTE explícito.
- `anon` hoje não lê `municipality`; o formulário de relato (fase 2) vai precisar de lista de municípios ou resolver município pelo ponto via RPC.
- Tipos PostGIS saem como `unknown` no `database.types.ts` — leitura/escrita de geometria via GeoJSON/RPC na fase 2.

**Blockers:** None

---
*Built with PAUL Framework v1.4 · https://chrisai.cv/skool · https://youtube.com/@chris-ai-systems*
*Phase: 01-fundacao, Plan: 02*
*Completed: 2026-09-24*
