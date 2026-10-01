---
description: "sentinela — current position and accumulated context"
type: ProjectState
about: "sentinela"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-10-01)

**Core value:** Um sistema de relato e triagem de focos de arboviroses, que agrega os relatos em áreas de risco e alerta a vigilância municipal.
**Current focus:** Phase 2 (Relato do cidadão) — pronta para planejar

## Current Position

Milestone: v0.1 MVP — Relato, Agregação e Dashboard
Phase: 2 of 5 (Relato do cidadão) — Not started
Plan: Not started
Status: Ready to plan
Last activity: 2026-10-01 — UNIFY 01-03 concluído; Fase 1 completa, transição para Fase 2

Progress:
- Milestone: [██░░░░░░░░] 20% (1 de 5 fases; 3 de ~15 planos estimados)
- Phase 1: [██████████] 100% (3/3 planos) ✅
- Phase 2: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ○        ○        ○     [Phase 1 complete — ready for next PLAN]
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
| Colunas de auditoria / histórico de status em report | Audit 01-02 | M | Obrigatório junto do 1º caminho de escrita (fase 2/3) |
| CI checando imutabilidade de migrations | Audit 01-02 | S | Entrada de colaborador |
| Política de retenção de relatos/fotos (LGPD) | Audit 01-02 | M | Antes da validação em campo (fase 5) |
| Dado pessoal em `description` livre | Audit 01-02 | S | Fase 2 (UI) |
| Banco de staging separado p/ previews | Audit 01-03 | M | Fase 2 (previews com escrita) |
| Keep-alive p/ pausa do free tier Supabase | Audit 01-03 | S | Fase 5 |
| Backups/PITR | Audit 01-03 | M | Antes da validação em campo (fase 5) |
| anon não lê `municipality` — formulário de relato precisa de lista/resolução por ponto (RPC) | UNIFY 01-02 | S | Fase 2 |
| Roll da secret key `default` do Supabase (4 chars expostos, prefixo neste arquivo; key não usada) | UNIFY 01-03 | S | Antes da fase 2 usar chave secreta |
| Dependabot: bump da CLI Supabase exige sincronizar `version:` do setup-cli (PR #4 barrado); PRs #2 (@types/node 26) e #3 (TS 6) major abertos | UNIFY 01-03 | S | Início da fase 2 |
| Expand/contract é regra documentada, sem verificação em CI | UNIFY 01-03 | S | Fase 2 (1ª migration nova) |

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

Last session: 2026-10-01
Stopped at: Phase 1 complete (UNIFY 01-03 + transição), ready to plan Phase 2
Next action: /paul:plan para Phase 2 (Relato do cidadão)
Resume file: .paul/ROADMAP.md
Git strategy: `main` — repo público em https://github.com/dobidu/sentinela; `.claude/` (PAUL Framework) fora do versionamento via .gitignore
Resume context:
- Enterprise Plan Audit habilitado → fluxo é `plan → audit → apply → unify`
- MVP restrito às features 1 + 3 + 5; features 2 e 4 são v0.2
- Stack e modelo de dados (6 entidades) já decididos e registrados em PROJECT.md — não re-perguntar
- Produção: https://sentinela-sigma-eosin.vercel.app (Supabase ref ftibuibtjgqxwthwvthf, sa-east-1; Vercel gru1). Fluxo push main → CI → Deploy database → Vercel (Deployment Checks)
- Fase 2 precisa, antes do 1º caminho de escrita: RPC/policy de insert anônimo + rate limit por `reporter_token_hash` + histórico/auditoria de status + GRANT EXECUTE explícito; previews hoje apontam para o banco de produção
- Handoff de apresentação em .paul/handoffs/HANDOFF-apresentacao-2026-10-01.md (para slides; não é contexto de loop)

---
*STATE.md — Updated after every significant action*
