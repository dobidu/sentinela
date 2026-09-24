---
description: "sentinela — current position and accumulated context"
type: ProjectState
about: "sentinela"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-10)

**Core value:** Um sistema de relato e triagem de focos de arboviroses, que agrega os relatos em áreas de risco e alerta a vigilância municipal.
**Current focus:** Phase 1 (Fundação) — plano 01-01 auditado, pronto para APPLY

## Current Position

Milestone: v0.1 MVP — Relato, Agregação e Dashboard
Phase: 1 of 5 (Fundação) — Planning
Plan: 01-01 created + audited, awaiting approval
Status: PLAN audited, ready for APPLY
Last activity: 2026-09-24 — Enterprise audit of 01-01 (.paul/phases/01-fundacao/01-01-AUDIT.md)

Progress:
- Milestone: [░░░░░░░░░░] 0%
- Phase 1: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○     [Plan created, awaiting approval]
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
| 2026-09-24: Enterprise audit performed on .paul/phases/01-fundacao/01-01-PLAN.md. Applied 3 must-have, 8 strongly-recommended upgrades. Deferred 4. Verdict: conditionally acceptable | Phase 1 | Plan strengthened for enterprise standards |

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Análise de necessidade de integração e-SUS VS / SINAN | Init | M | Pós-MVP |
| Política de blur de rosto/placa nas fotos | Init | M | Antes de qualquer exposição pública de imagem |
| Custo de storage de imagem no free tier | Init | S | Ao definir compressão client-side |
| Branch protection exigindo CI em `main` | Audit 01-01 | S | Plano 01-03 ou entrada de colaborador |
| SAST / scan de vulnerabilidades | Audit 01-01 | S | Fase 2 (fotos/GPS) |

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| Prazo de 60h em 3 meses vs. escopo de 5 features | Risco de não entregar MVP + artigo | `Out of Scope` agressivo; MVP restrito a features 1+3+5 |
| Sem convênio com prefeitura | Usuário real de vigilância indisponível | Validar com dados sintéticos + 1 agente de endemias em campo |

## Boundaries (Active)

- `.paul/*`, `.claude/`, `.serena/`, `LICENSE` — não alterar em planos de código
- README.md / .gitignore — só acréscimos
- Sem commit/push sem autorização explícita (auto_commit: false)

## Session Continuity

Last session: 2026-09-24
Stopped at: Plan 01-01 audited
Next action: /paul:apply .paul/phases/01-fundacao/01-01-PLAN.md
Resume file: .paul/phases/01-fundacao/01-01-PLAN.md
Git strategy: `main` — repo público em https://github.com/dobidu/sentinela; `.claude/` (PAUL Framework) fora do versionamento via .gitignore
Resume context:
- Enterprise Plan Audit habilitado → fluxo é `plan → audit → apply → unify`
- MVP restrito às features 1 + 3 + 5 (relato do cidadão, agregação em áreas de risco, dashboard); features 2 e 4 são fase 2
- Stack e modelo de dados (6 entidades) já decididos e registrados em PROJECT.md — não re-perguntar
- CI/CD entra na fase 1; entrega acadêmica (artigo + repositório documentado) deve virar fase própria
- Sem código-fonte de aplicação ainda — repo contém apenas `.paul/` + README.md

---
*STATE.md — Updated after every significant action*
