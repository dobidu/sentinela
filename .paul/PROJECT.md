---
description: "Relato e triagem de focos de arboviroses, agregados em áreas de risco, com alerta à vigilância municipal"
type: Project
about: "sentinela"
---

# sentinela

## What This Is

Sistema de enfrentamento à subnotificação de arboviroses. Cidadãos e agentes de endemias reportam focos (criadouros) pelo mesmo canal; o sistema agrega os relatos em áreas de risco geoespaciais e alerta a vigilância municipal. Entregue como PWA mobile-first, sem cadastro para o cidadão.

## Core Value

Um sistema de relato e triagem de focos de arboviroses, que agrega os relatos em áreas de risco e alerta a vigilância municipal.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 0.0.0 |
| Status | Initializing |
| Last Updated | 2026-09-10 |

## Requirements

### Core Features

1. **Relato de foco (cidadão)** — foto + GPS + tipo de criadouro, sem cadastro, atrito mínimo
2. **Triagem/validação (agente)** — fila de relatos, confirma ou descarta em visita de campo, atualiza status
3. **Agregação em áreas de risco** — clustering geoespacial dos relatos em polígonos/grid
4. **Alerta à vigilância municipal** — dispara quando área cruza limiar (densidade × janela de tempo)
5. **Dashboard de vigilância** — mapa de calor, séries temporais, exportação

**Fatia mínima (MVP):** features 1 + 3 + 5 — relato do cidadão, agregação em áreas de risco, dashboard/mapa.

### Validated (Shipped)
None yet.

### Active (In Progress)
None yet.

### Planned (Next)
- MVP: relato anônimo (PWA) + job de agregação PostGIS + dashboard de vigilância
- Fase 2: triagem do agente (feature 2) + alerta automático por limiar (feature 4)
- Roadmap: análise de necessidade de integração com e-SUS VS / SINAN
- Entrega acadêmica: artigo + repositório documentado

### Out of Scope
- Integração com e-SUS VS / SINAN — fora do MVP; entra como análise de necessidade no roadmap
- Cadastro/conta para o cidadão — atrito alto mata a taxa de relato; usa `reporter_token` device-scoped
- Coleta de nome/telefone do cidadão — evitada por LGPD no MVP
- App nativo (Expo/React Native) — PWA cobre os dois papéis no MVP

## Target Users

**Primário:** Cidadão — relata foco casualmente, sem cadastro, do celular na rua.

**Primário:** Agente de endemias — triagem e visita de campo, conectividade ruim, precisa de fila offline.

**Secundário:** Vigilância municipal — consome áreas de risco, alertas e exportações; decide alocação de equipe.

## Context

**Business Context:**
Escopo acadêmico — disciplina de 60h, prazo de 3 meses (início 2026-09-10). Entregáveis: MVP no ar, artigo, repositório de código documentado. Sem convênio formal com prefeitura no MVP; validação de campo com pelo menos 1 agente de endemias.

**Technical Context:**
Sistema greenfield. Multi-município desde o schema. PostGIS para agregação espacial. Áreas de risco materializadas (job recalcula) em vez de view, porque o alerta precisa de estado para saber o que já disparou.

## Constraints

### Technical Constraints
- **LGPD:** foto de quintal alheio + GPS preciso = dado pessoal de terceiro. Coordenada exata visível apenas para agente/vigilância; camada pública usa grid ~100m. Foto em bucket privado com URL assinada.
- Conectividade de campo ruim → PWA precisa de fila offline (service worker); 100% dos relatos enfileirados devem subir ao reconectar
- Custo de storage de imagem (free tier do Supabase estoura rápido) → compressão client-side obrigatória
- Auth apenas para agente/vigilância (Supabase Auth + roles); cidadão permanece anônimo
- CI/CD desde o início do projeto

### Business Constraints
- Prazo: 3 meses, dentro de disciplina de 60h — escopo precisa de `Out of Scope` agressivo
- Sem convênio institucional no MVP → usuário de vigilância pode ser validado com dados sintéticos
- Entrega dupla: software funcionando + artigo acadêmico

### Compliance Constraints
- LGPD: minimização de dados, anonimato do relator, generalização espacial na camada pública

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Stack: Next.js PWA + PostgreSQL/PostGIS + Supabase | Um codebase; roda no browser do cidadão sem instalar (atrito zero); PostGIS resolve clustering nativamente | 2026-09-10 | Active |
| Deploy em nuvem gerenciada (Vercel + Supabase) | Sem infra de prefeitura no MVP; menor custo operacional para escopo acadêmico | 2026-09-10 | Active |
| Cidadão anônimo via `reporter_token` device-scoped | Sem cadastro (atrito), mas permite deduplicar spam | 2026-09-10 | Active |
| Multi-município no schema desde o dia 1 | Retrofit de tenancy depois é caro | 2026-09-10 | Active |
| `RiskArea` materializada, não view | Alerta precisa de estado para não redisparar | 2026-09-10 | Active |
| Grid ~100m na camada pública | Mitigação LGPD para geolocalização de terceiros | 2026-09-10 | Active |
| Integração e-SUS/SINAN fora do MVP | Prazo de 60h; dependência institucional | 2026-09-10 | Active |
| CI/CD desde o início | Entrega acadêmica exige repositório bem documentado e reprodutível | 2026-09-10 | Active |

## Data Model

| Entidade | Campos-chave | Relações |
|---|---|---|
| **Report** | `id`, `geom (Point, SRID 4326)`, `breeding_site_type`, `photo_url`, `description`, `status` (pending/confirmed/dismissed/resolved), `created_at`, `reporter_token` | → RiskArea (espacial), → Inspection (1:N) |
| **RiskArea** | `id`, `geom (Polygon)`, `report_count`, `risk_level`, `window_start/end`, `computed_at` | ← Report (agregação) |
| **Alert** | `id`, `risk_area_id`, `threshold_rule`, `sent_at`, `channel`, `acknowledged_at` | → RiskArea |
| **User** | `id`, `role` (agent/surveillance/admin), `municipality_id` | → Inspection |
| **Inspection** | `id`, `report_id`, `agent_id`, `outcome`, `visited_at`, `notes` | → Report, → User |
| **Municipality** | `id`, `name`, `ibge_code`, `boundary (Polygon)` | escopo de tudo |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Tempo de relato completo (abrir → enviar) | < 60s, ≤ 3 telas | - | Not started |
| Job de agregação de áreas de risco | < 30s para 10k relatos | - | Not started |
| Relatos offline entregues ao reconectar | 100% | - | Not started |
| Lighthouse PWA / mobile | ≥ 90 | - | Not started |
| Cobertura de teste no núcleo (agregação + validação de relato) | ≥ 70% | - | Not started |
| Validação em campo | ≥ 1 agente de endemias testa em campo | - | Not started |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend / App | Next.js (PWA, mobile-first) | Atrito zero para o cidadão — sem instalação |
| Database | PostgreSQL + PostGIS | Clustering geoespacial e grid nativo |
| Auth | Supabase Auth (roles: agent/surveillance/admin) | Cidadão permanece anônimo |
| Storage | Supabase Storage (bucket privado, URL assinada) | Fotos de relato |
| Offline | Service Worker + fila local | Requisito de campo |
| Hosting | Vercel (app) + Supabase gerenciado (DB/storage) | Nuvem gerenciada |
| CI/CD | GitHub Actions | Desde o início |

## Links

| Resource | URL |
|----------|-----|
| Repository | TBD |
| Production | TBD |
| Documentation | TBD |

---
*Created: 2026-09-10*
