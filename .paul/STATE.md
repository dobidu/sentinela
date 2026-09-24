---
description: "sentinela — current position and accumulated context"
type: ProjectState
about: "sentinela"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-24)

**Core value:** Um sistema de relato e triagem de focos de arboviroses, que agrega os relatos em áreas de risco e alerta a vigilância municipal.
**Current focus:** Phase 1 (Fundação) — 01-03 aplicado, aguardando UNIFY (último plano da fase)

## Current Position

Milestone: v0.1 MVP — Relato, Agregação e Dashboard
Phase: 1 of 5 (Fundação) — In progress
Plan: 01-03 applied, awaiting UNIFY
Status: APPLY complete, ready for UNIFY
Last activity: 2026-09-24 — APPLY 01-03 concluído; produção no ar (https://sentinela-sigma-eosin.vercel.app)

Progress:
- Milestone: [█░░░░░░░░░] ~13% (2 de ~15 planos estimados)
- Phase 1: [███████░░░] 67% (2/3 planos)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ○     [Applied, ready for UNIFY]
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
| Branch protection exigindo CI em `main` | Audit 01-01 | S | Plano 01-03 ou entrada de colaborador |
| SAST / scan de vulnerabilidades | Audit 01-01 | S | Fase 2 (fotos/GPS) |
| README: seções "Status" e "Roadmap" desatualizadas | UNIFY 01-01 | S | Plano 01-03 (deploy) ou fase 5 |
| ESLint 10 (pnpm marca 9 como deprecated) vs. eslint-config-next 16 | UNIFY 01-01 | S | Quando Dependabot propuser |
| Colunas de auditoria / histórico de status em report | Audit 01-02 | M | Obrigatório junto do 1º caminho de escrita (fase 2/3) |
| CI checando imutabilidade de migrations | Audit 01-02 | S | Entrada de colaborador |
| Política de retenção de relatos/fotos (LGPD) | Audit 01-02 | M | Antes da validação em campo (fase 5) |
| Dado pessoal em `description` livre | Audit 01-02 | S | Fase 2 (UI) |
| Banco de staging separado p/ previews | Audit 01-03 | M | Fase 2 (previews com escrita) |
| Keep-alive p/ pausa do free tier Supabase | Audit 01-03 | S | Fase 5 |
| Backups/PITR | Audit 01-03 | M | Antes da validação em campo (fase 5) |
| anon não lê `municipality` — formulário de relato precisa de lista/resolução por ponto (RPC) | UNIFY 01-02 | S | Fase 2 |

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

Last session: 2026-09-24
Stopped at: APPLY 01-03 concluído (commits b599cbb, ad5a310, bfa880c; CI runs 36045316723 e seguinte verdes)
Next action: /paul:unify .paul/phases/01-fundacao/01-03-PLAN.md → transição da Fase 1
Resume file: .paul/phases/01-fundacao/01-03-PLAN.md
APPLY log 01-03 (insumo p/ UNIFY):
- Supabase `sentinela` ref ftibuibtjgqxwthwvthf, sa-east-1, org "dobidu's Org"; migrations 2/2, seed não aplicado, municipality=0, anon_grants=0, auth_write=0, tabelas sem RLS=0, advisors security limpo; REST anon → 42501
- Signup: fechado via Management API (PATCH só disable_signup) — DESVIO do plano (`config push` enviaria config local inteira, ex. site_url 127.0.0.1); local config.toml enable_signup=false; site_url remoto = URL de produção
- Vercel: projeto sentinela (dobidus-projects), gru1, gitForkProtection=true, env públicas em production+preview (preview via REST API — CLI exigia branch); domínio sentinela-sigma-eosin.vercel.app
- Human actions: supabase login (TTY: terminal próprio, opção A); instalar/configurar app Vercel no GitHub; Deployment Checks no dashboard (sem API)
- GitHub: environment production (só main) com secret SUPABASE_DB_URL + var SUPABASE_PROJECT_REF; secret scanning + push protection on; branch protection (2 checks, sem force-push/deleção, enforce_admins=false)
- deploy-db: setup-cli v3.0.1 por SHA, versão 2.117.0 sincronizada (check testado com drift); log sem URL/senha; "Remote database is up to date"
- Gate de produção: deployment ad5a310 mostrou "no checks configured" (checks recém-configurados); verificado com commit vazio bfa880c — alias ficou no deploy anterior durante o CI e moveu às 19:28:12Z, 11s após Deploy database (19:28:01Z)
- Incidente menor: listagem de api-keys expôs 4 chars aleatórios da secret key `default` (sb_secret_rA8_…); recomendado roll (não usada)
- README: Status/Roadmap corrigidos (exceção declarada) + seção Deploy
Git strategy: `main` — repo público em https://github.com/dobidu/sentinela; `.claude/` (PAUL Framework) fora do versionamento via .gitignore
Resume context:
- Enterprise Plan Audit habilitado → fluxo é `plan → audit → apply → unify`
- MVP restrito às features 1 + 3 + 5 (relato do cidadão, agregação em áreas de risco, dashboard); features 2 e 4 são fase 2
- Stack e modelo de dados (6 entidades) já decididos e registrados em PROJECT.md — não re-perguntar
- CI/CD entra na fase 1; entrega acadêmica (artigo + repositório documentado) deve virar fase própria
- Scaffold Next.js + CI no ar desde 2026-09-24 (01-01); schema PostGIS + RLS + pgTAP desde 2026-09-24 (01-02)

---
*STATE.md — Updated after every significant action*
