---
description: "sentinela — current position and accumulated context"
type: ProjectState
about: "sentinela"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-10-01)

**Core value:** Um sistema de relato e triagem de focos de arboviroses, que agrega os relatos em áreas de risco e alerta a vigilância municipal.
**Current focus:** Phase 2 (Relato do cidadão) — 02-01 fechado; próximo: 02-02 (formulário), começando pelo keep-alive

## Current Position

Milestone: v0.1 MVP — Relato, Agregação e Dashboard
Phase: 2 of 5 (Relato do cidadão) — In progress
Plan: 02-01 complete (1/3)
Status: Loop closed, ready for next PLAN (02-02)
Last activity: 2026-10-06 — UNIFY 02-01 (SUMMARY); Supabase restaurado após 2ª pausa

Progress:
- Milestone: [██░░░░░░░░] ~25% (1 de 5 fases; 4 de ~15 planos estimados)
- Phase 1: [██████████] 100% (3/3 planos) ✅
- Phase 2: [███░░░░░░░] 33% (1/3 planos)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete - ready for next PLAN]
```

## Accumulated Context

### Decisions

| Decision | Phase | Impact |
|----------|-------|--------|
| Stack: Next.js PWA + PostgreSQL/PostGIS + Supabase, deploy em nuvem | Init | Define todo o planejamento técnico |
| Cidadão anônimo via `reporter_token` device-scoped | Init | Sem fluxo de cadastro no MVP |
| Multi-município no schema desde o dia 1 | Init | Toda tabela carrega escopo de município |
| `RiskArea` materializada (job), não view | Init | Exige job/scheduler no MVP |
| Grid ~100m na camada pública (LGPD) | Init | Duas visões de precisão espacial |
| Integração e-SUS/SINAN fora do MVP | Init | Vira análise de necessidade no roadmap |
| CI/CD desde o início | Init | Fase 1 inclui pipeline |
| Roadmap v0.1 em 5 fases: Fundação → Relato → Agregação → Dashboard → Validação+Entrega | Plan 01-01 | Features 2/4 vão para v0.2 |
| Política LGPD confirmada: coord. exata só agente/vigilância, público em grid ~100m, bucket privado + URL assinada, sem nome/telefone | Plan 01-01 | Guia schema/RLS (01-02) e camada pública (fase 4) |
| Fase 1 dividida em 3 planos: 01-01 scaffold+CI, 01-02 schema/RLS, 01-03 deploy | Plan 01-01 | Planos com ≤3 tasks |
| 2026-09-24: Versionar AGENTS.md/CLAUDE.md gerados pelo Next 16 (`next dev` sob agente) | Phase 1 | Agentes leem docs da versão instalada em node_modules/next/dist/docs |
| 2026-09-24: `reporter_token` armazenado só como hash SHA-256 (`reporter_token_hash`) | Plan 01-02 | Minimização LGPD; dedup via hash |
| 2026-09-24: `anon` sem acesso a tabelas até a fase 2 | Plan 01-02 | Inserção de relato projetada na fase 2 com rate limit |
| 2026-09-24: admin/agent/surveillance restritos ao próprio município; cross-município só service_role | Plan 01-02 | Policies uniformes por `municipality_id` |
| 2026-09-24: Modelo refinado — `photo_url`→`photo_path`, `User`→`profile` (1:1 auth.users), `municipality_id` em toda tabela | Plan 01-02 | PROJECT.md Data Model atualizado |
| 2026-09-24: EXECUTE de PUBLIC revogado globalmente p/ funções criadas por postgres; toda função nova exige GRANT explícito | Plan 01-02 | Fases 2/3 (RPCs, extensões) |
| 2026-09-24: Deploy — Supabase sa-east-1, Vercel Git integration (gru1), CD de migrations no Actions (environment production), branch protection com checks | Plan 01-03 | Fluxo push→CI→db push→app |
| 2026-10-01: Helpers de policy no schema `private` (fora da API REST); `ping` INVOKER; `submit_report`/`resolve_municipality` são as únicas exceções aceitas do advisor (lints 0028/0029) | Plan 02-01 | Toda função nova: API pública em public, helper em private |
| 2026-10-01: Enterprise audit performed on .paul/phases/02-relato-cidadao/02-01-PLAN.md. Applied 4 must-have, 7 strongly-recommended upgrades. Deferred 6. Verdict: conditionally acceptable | Phase 2 | Plan strengthened for enterprise standards |
| 2026-10-01: Fase 2 em 3 planos — 02-01 infra+escrita no banco, 02-02 formulário online, 02-03 PWA+offline | Phase 2 | Planos ≤3 tasks |
| 2026-10-01: Foto via Storage direto (publishable key, policy só INSERT) + RPC `submit_report` que valida o objeto; nenhuma secret key na Vercel | Plan 02-01 | Mantém least privilege do 01-03 |
| 2026-10-01: Previews da Vercel sem escrita (env Supabase removida do preview no 02-02) | Plan 02-01 | Sem staging no MVP |
| 2026-10-01: Produção com João Pessoa + Cabedelo (malha IBGE máxima embutida em migration) | Plan 02-01 | Seed perde os retângulos sintéticos |
| 2026-09-24: Enterprise audit performed on .paul/phases/01-fundacao/01-03-PLAN.md. Applied 3 must-have, 7 strongly-recommended upgrades. Deferred 4. Verdict: conditionally acceptable | Phase 1 | Plan strengthened for enterprise standards |
| 2026-09-24: CD de DB usa só `SUPABASE_DB_URL` (session pooler, escopo projeto) — sem access token de conta no GitHub; signup público desabilitado | Plan 01-03 | Least privilege |
| 2026-09-24: Enterprise audit performed on .paul/phases/01-fundacao/01-02-PLAN.md. Applied 3 must-have, 7 strongly-recommended upgrades. Deferred 5. Verdict: conditionally acceptable | Phase 1 | Plan strengthened for enterprise standards |
| 2026-09-24: Enterprise audit performed on .paul/phases/01-fundacao/01-01-PLAN.md. Applied 3 must-have, 8 strongly-recommended upgrades. Deferred 4. Verdict: conditionally acceptable | Phase 1 | Plan strengthened for enterprise standards |

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Análise de necessidade de integração e-SUS VS / SINAN | Init | M | Pós-MVP |
| Política de blur de rosto/placa nas fotos | Init | M | Antes de qualquer exposição pública de imagem |
| Custo de storage de imagem no free tier | Init | S | Ao definir compressão client-side |
| SAST / scan de vulnerabilidades | Audit 01-01 | S | Fase 2 (fotos/GPS) |
| ESLint 10 (pnpm marca 9 como deprecated) vs. eslint-config-next 16 | UNIFY 01-01 | S | Quando Dependabot propuser |
| CI checando imutabilidade de migrations | Audit 01-02 | S | Entrada de colaborador |
| Política de retenção de relatos/fotos (LGPD) | Audit 01-02 | M | Antes da validação em campo (fase 5) |
| Dado pessoal em `description` livre | Audit 01-02 | S | Fase 2 (UI) |
| Banco de staging separado p/ previews | Audit 01-03 | M | Fase 2 (previews com escrita) |
| Backups/PITR | Audit 01-03 | M | Antes da validação em campo (fase 5) |
| Roll da secret key `default` do Supabase (4 chars do prefixo aleatório expostos no histórico git; key não usada — inutiliza o resíduo) | UNIFY 01-03 | S | Antes da fase 2 usar chave secreta |
| PRs major do Dependabot abertos: #3 (TypeScript 6), #6 (@types/node 26) — avaliar | UNIFY 01-03 | S | 02-02 |
| Expand/contract é regra documentada, sem verificação em CI | UNIFY 01-03 | S | Fase 2 (1ª migration nova) |
| **2026-10-06: projeto Supabase INACTIVE de novo** apesar de keep-alive agendado verde em 10-04 (run 37210625181, HTTP 200). Hipóteses não verificadas: RPC `select 1` (INVOKER, sem tocar tabela) não conta como atividade; janela < 7 dias; intervalo de 3 dias longo. Restaurado em 10-06 pelo usuário; **investigar como 1ª task do 02-02** (histórico: 1ª pausa 10-01 sem keep-alive) | UNIFY 02-01 | S | **1ª task do 02-02** |
| Advisor do CI (CLI 2.117) não tem lints 0028/0029 do advisor de produção — atualizar CLI (≥2.119) com bump sincronizado | APPLY 02-01 | S | 02-02 |
| Limpeza de fotos órfãs no bucket (job service_role via Storage API) | Audit 02-01 | S | Fase 5 ou teto de upload a 50% |
| Rate limit por IP (hash com sal rotativo, LGPD) | Audit 02-01 | M | Se houver abuso observado |
| Máquina de estados de status do relato | Audit 02-01 | S | v0.2 (triagem) |
| Alerta quando tetos de upload/relato disparam | Audit 02-01 | S | Feature 4 (alertas) |
| Conferência manual mensal de security updates da Supabase CLI (ignorada no Dependabot) | Audit 02-01 | S | Mensal |

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| Prazo de 60h em 3 meses vs. escopo de 5 features | Risco de não entregar MVP + artigo | `Out of Scope` agressivo; MVP restrito a features 1+3+5 |
| Sem convênio com prefeitura | Usuário real de vigilância indisponível | Validar com dados sintéticos + 1 agente de endemias em campo |

## Boundaries (Active)

- `.paul/*`, `.claude/`, `.serena/`, `LICENSE` — não alterar em planos de código
- `supabase/migrations/*` já em main — imutáveis (mudança = nova migration)
- `supabase/seed.sql` — nunca aplicar em ambiente remoto
- README.md / .gitignore — só acréscimos
- Sem commit/push sem autorização explícita (auto_commit: false)

## Session Continuity

Last session: 2026-10-06
Stopped at: UNIFY 02-01 concluído (SUMMARY criado); Fase 2 em 1/3 planos
Next action: /paul:plan para 02-02 (formulário de relato online), com investigação/correção do keep-alive como 1ª task
Resume file: .paul/phases/02-relato-cidadao/02-01-SUMMARY.md
Git strategy: `main` — repo público em https://github.com/dobidu/sentinela; `.claude/` (PAUL Framework) fora do versionamento via .gitignore
Resume context:
- Enterprise Plan Audit habilitado → fluxo é `plan → audit → apply → unify`
- MVP restrito às features 1 + 3 + 5; features 2 e 4 são v0.2
- Stack e modelo de dados (6 entidades) já decididos e registrados em PROJECT.md — não re-perguntar
- Produção: https://sentinela-sigma-eosin.vercel.app (Supabase ref ftibuibtjgqxwthwvthf, sa-east-1; Vercel gru1). Fluxo push main → CI → Deploy database → Vercel (Deployment Checks)
- Contrato de escrita anônima pronto (02-01): upload em report-photos → `submit_report`; erros PT422/404/409/429 (tabela no README); previews ainda com env Supabase (remover no 02-02)
- Supabase pausou 2× (10-01 sem keep-alive; antes de 10-06 com keep-alive verde em 10-04). Restore só pelo usuário (classificador barra o agente); CLI não tem restore
- Handoffs de apresentação em .paul/handoffs/ (apresentacao-2026-10-01, aula-2026-10-06, arquitetura-2026-10-06, slides-update-2026-10-06) — para slides; não são contexto de loop

---
*STATE.md — Updated after every significant action*
