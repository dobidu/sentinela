---
description: "sentinela — current position and accumulated context"
type: ProjectState
about: "sentinela"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-10)

**Core value:** Um sistema de relato e triagem de focos de arboviroses, que agrega os relatos em áreas de risco e alerta a vigilância municipal.
**Current focus:** Project initialized — ready for planning

## Current Position

Milestone: v0.1 MVP — Relato, Agregação e Dashboard
Phase: Not yet defined
Plan: None yet
Status: Ready to create roadmap and first PLAN
Last activity: 2026-09-10 — Project initialized

Progress:
- Milestone: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ○        ○        ○     [Ready for first PLAN]
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

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Análise de necessidade de integração e-SUS VS / SINAN | Init | M | Pós-MVP |
| Política de blur de rosto/placa nas fotos | Init | M | Antes de qualquer exposição pública de imagem |
| Custo de storage de imagem no free tier | Init | S | Ao definir compressão client-side |

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| Prazo de 60h em 3 meses vs. escopo de 5 features | Risco de não entregar MVP + artigo | `Out of Scope` agressivo; MVP restrito a features 1+3+5 |
| Sem convênio com prefeitura | Usuário real de vigilância indisponível | Validar com dados sintéticos + 1 agente de endemias em campo |

## Boundaries (Active)

None yet — set during first PLAN.

## Session Continuity

Last session: 2026-09-10
Stopped at: `/paul:init` concluído — walkthrough de requisitos completo, nenhum PLAN criado
Next action: Rodar `/paul:plan` para definir as fases do milestone v0.1 e criar o primeiro plano
Resume file: .paul/HANDOFF-2026-09-10.md
Git strategy: N/A — diretório não é repositório git; nenhum commit WIP feito
Resume context:
- Enterprise Plan Audit habilitado → fluxo é `plan → audit → apply → unify`
- MVP restrito às features 1 + 3 + 5 (relato do cidadão, agregação em áreas de risco, dashboard); features 2 e 4 são fase 2
- Stack e modelo de dados (6 entidades) já decididos e registrados em PROJECT.md — não re-perguntar
- ROADMAP.md ainda tem `Phase 1 | TBD` como placeholder; planejamento precisa preencher a estrutura de fases
- CI/CD entra na fase 1; entrega acadêmica (artigo + repositório documentado) deve virar fase própria
- Política LGPD default (grid ~100m público, bucket privado, sem nome/telefone) foi assumida, não confirmada — revalidar no primeiro PLAN
- Sem código-fonte ainda: apenas `.paul/` e `.claude/` no diretório

---
*STATE.md — Updated after every significant action*
