---
description: "sentinela — milestone and phase structure"
type: Roadmap
about: "sentinela"
---

# Roadmap: sentinela

## Overview

Sistema de enfrentamento à subnotificação de arboviroses. Cidadãos e agentes de endemias reportam focos pelo mesmo canal; o sistema agrega os relatos em áreas de risco e alerta a vigilância municipal. Prazo: 3 meses / disciplina de 60h (2026-09-10 → ~2026-12-10). Entregáveis: MVP no ar, artigo acadêmico, repositório documentado.

## Current Milestone

**v0.1 MVP — Relato, Agregação e Dashboard** (v0.1.0)
Status: In progress
Phases: 1 of 5 complete (20%)

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Fundação | 3/3 | ✅ Complete | 2026-10-01 |
| 2 | Relato do cidadão | 1/3 (02-01 ✓) | In progress | - |
| 3 | Agregação em áreas de risco | TBD | Not started | - |
| 4 | Dashboard de vigilância | TBD | Not started | - |
| 5 | Validação e entrega acadêmica | TBD | Not started | - |

## Phase Details

### Phase 1: Fundação
**Goal:** Repositório executável e reprodutível — app Next.js com tooling, CI verde, schema PostGIS multi-município e deploy em nuvem.
**Depends on:** nada
**Status:** ✅ Complete (2026-10-01; planos executados em 2026-09-24)
**Plans:**
- 01-01 ✓ — Scaffold Next.js + TS + Vitest/ESLint + pipeline GitHub Actions (2026-09-24)
- 01-02 ✓ — Supabase local + migrations PostGIS (6 entidades + Municipality) + RLS base + checagem de migration no CI (2026-09-24)
- 01-03 ✓ — Deploy: Supabase sa-east-1 + CD de migrations, Vercel gru1 com Deployment Checks, branch protection (2026-09-24)

### Phase 2: Relato do cidadão (Feature 1)
**Goal:** Cidadão relata foco (foto + GPS + tipo de criadouro) em < 60s e ≤ 3 telas, sem cadastro, funcionando offline.
**Depends on:** Phase 1
**Escopo:** PWA instalável, captura de foto com compressão client-side, `reporter_token` device-scoped, fila offline (service worker) com 100% de entrega ao reconectar, upload para bucket privado.
**Plans:**
- 02-01 ✓ — Caminho de escrita anônimo no banco (RPC `submit_report`, rate limit, histórico de status, bucket privado, JP + Cabedelo reais) + keep-alive + Dependabot (2026-10-01; UNIFY 2026-10-06)
- 02-02 — Formulário de relato online (cliente Supabase, foto comprimida, GPS, ≤3 telas; previews sem escrita)
- 02-03 — PWA + fila offline (manifest, service worker, IndexedDB, reenvio)

### Phase 3: Agregação em áreas de risco (Feature 3)
**Goal:** Job PostGIS que materializa `RiskArea` a partir dos relatos em < 30s para 10k relatos.
**Depends on:** Phase 1 (schema), Phase 2 (dados reais; sintéticos servem para desenvolvimento)
**Escopo:** grid/clustering PostGIS, `risk_level` por densidade × janela, agendamento (pg_cron ou equivalente), seed sintético de 10k relatos, cobertura ≥ 70% no núcleo.

### Phase 4: Dashboard de vigilância (Feature 5)
**Goal:** Vigilância autenticada vê mapa de calor, séries temporais e exporta dados; camada pública só em grid ~100m.
**Depends on:** Phase 3
**Escopo:** Supabase Auth com roles (agent/surveillance/admin), mapa, séries temporais, export CSV, camada pública generalizada (LGPD).

### Phase 5: Validação e entrega acadêmica
**Goal:** MVP validado em campo e entregue com artigo e repositório documentado.
**Depends on:** Phases 2–4
**Escopo:** teste com ≥ 1 agente de endemias, Lighthouse PWA/mobile ≥ 90, documentação do repositório, artigo.

## Future Milestones

- **v0.2** — Triagem/validação do agente (Feature 2) + alerta automático por limiar (Feature 4)
- **Pós-MVP** — Análise de necessidade de integração com e-SUS VS / SINAN

---
*Roadmap created: 2026-09-10 — phases defined: 2026-09-24 — Phase 1 complete: 2026-10-01*
