# Sentinela

[![CI](https://github.com/dobidu/sentinela/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dobidu/sentinela/actions/workflows/ci.yml)

**Sistema de relato e triagem de focos de arboviroses**, que agrega os relatos em áreas de risco e alerta a vigilância municipal.

> Status: **fase 1 — Fundação** (v0.0.0). App Next.js, CI/CD, schema PostGIS com RLS e deploy em nuvem (Vercel + Supabase, São Paulo). As features de relato, agregação e dashboard entram nas fases 2–4. Produção: https://sentinela-sigma-eosin.vercel.app

---

## Problema

Arboviroses (dengue, zika, chikungunya) dependem de vigilância entomológica para controle, mas a detecção de criadouros sofre de **subnotificação**: o cidadão que vê um foco raramente tem um canal de baixo atrito para reportá-lo, e a vigilância municipal só descobre o problema quando a série de casos já subiu.

## Proposta

Um canal único de relato para cidadão e agente de endemias, com agregação geoespacial automática:

1. **Cidadão** reporta um foco pelo celular — foto, GPS e tipo de criadouro, **sem cadastro**.
2. O sistema **agrega** os relatos em áreas de risco por clustering geoespacial.
3. A **vigilância municipal** consome as áreas de risco em um dashboard e é alertada quando uma área cruza o limiar de densidade.

O atrito zero para o cidadão é a aposta central: qualquer fluxo de cadastro derruba a taxa de relato, que é exatamente a variável que se quer maximizar.

---

## Features

| # | Feature | Ator | MVP |
|---|---------|------|:---:|
| 1 | **Relato de foco** — foto + GPS + tipo de criadouro, sem cadastro | Cidadão | ✅ |
| 2 | **Triagem/validação** — fila de relatos, confirma ou descarta em visita de campo | Agente de endemias | — |
| 3 | **Agregação em áreas de risco** — clustering geoespacial em polígonos/grid | Sistema | ✅ |
| 4 | **Alerta por limiar** — dispara quando área cruza densidade × janela de tempo | Sistema | — |
| 5 | **Dashboard de vigilância** — mapa de calor, séries temporais, exportação | Vigilância municipal | ✅ |

**Fatia mínima do MVP:** features **1 + 3 + 5**. Features 2 e 4 entram na fase seguinte.

---

## Usuários

| Papel | Necessidade | Autenticação |
|-------|-------------|--------------|
| **Cidadão** | Relatar um foco casualmente, do celular na rua, em menos de 60s | Anônimo (`reporter_token` device-scoped) |
| **Agente de endemias** | Triagem e visita de campo com conectividade ruim; precisa de fila offline | Supabase Auth, role `agent` |
| **Vigilância municipal** | Ver áreas de risco, receber alertas, exportar dados, alocar equipe | Supabase Auth, role `surveillance` |

---

## Stack

| Camada | Tecnologia | Por quê |
|--------|------------|---------|
| Frontend / App | Next.js (PWA, mobile-first) | Roda no browser do cidadão sem instalação — atrito zero |
| Banco de dados | PostgreSQL + PostGIS | Clustering geoespacial e grid nativos |
| Autenticação | Supabase Auth (roles: `agent`, `surveillance`, `admin`) | Cidadão permanece anônimo |
| Armazenamento | Supabase Storage (bucket privado, URL assinada) | Fotos de relato |
| Offline | Service Worker + fila local | Requisito de campo |
| Hospedagem | Vercel (app) + Supabase gerenciado (DB/storage) | Nuvem gerenciada, sem infra própria |
| CI/CD | GitHub Actions | Desde o início do projeto |

**Alternativas descartadas:** app nativo (Expo/React Native) — melhor offline e GPS para o agente, mas exigir instalação do cidadão mata a taxa de relato. PWA cobre os dois papéis no MVP.

---

## Modelo de dados

| Entidade | Campos-chave | Relações |
|---|---|---|
| **Report** | `id`, `geom (Point, SRID 4326)`, `breeding_site_type`, `photo_url`, `description`, `status` (`pending`/`confirmed`/`dismissed`/`resolved`), `created_at`, `reporter_token` | → RiskArea (espacial), → Inspection (1:N) |
| **RiskArea** | `id`, `geom (Polygon)`, `report_count`, `risk_level`, `window_start/end`, `computed_at` | ← Report (agregação) |
| **Alert** | `id`, `risk_area_id`, `threshold_rule`, `sent_at`, `channel`, `acknowledged_at` | → RiskArea |
| **User** | `id`, `role`, `municipality_id` | → Inspection |
| **Inspection** | `id`, `report_id`, `agent_id`, `outcome`, `visited_at`, `notes` | → Report, → User |
| **Municipality** | `id`, `name`, `ibge_code`, `boundary (Polygon)` | escopo de tudo |

**Decisões de modelagem:**
- **Multi-município desde o schema** — retrofit de tenancy depois é caro.
- **`RiskArea` materializada** (job recalcula), não view — o alerta precisa de estado para saber o que já disparou e não redisparar.
- **`reporter_token` device-scoped** — mantém o cidadão anônimo, mas permite deduplicar spam.

---

## Privacidade e LGPD

Uma foto de quintal alheio com GPS preciso é **dado pessoal de terceiro**. Mitigações adotadas:

- Coordenada exata visível **apenas** para `agent` e `surveillance`; a camada pública usa grid de ~100m.
- Fotos em bucket privado, acessadas por URL assinada — nunca públicas.
- **Sem coleta de nome, telefone ou e-mail** do cidadão no MVP (minimização de dados).

Em aberto: política de blur de rosto/placa nas fotos — necessária antes de qualquer exposição pública de imagem.

---

## Critérios de sucesso

| Métrica | Alvo |
|---------|------|
| Tempo de relato completo (abrir → enviar) | < 60s, ≤ 3 telas |
| Job de agregação de áreas de risco | < 30s para 10k relatos |
| Relatos offline entregues ao reconectar | 100% |
| Lighthouse PWA / mobile | ≥ 90 |
| Cobertura de teste no núcleo (agregação + validação de relato) | ≥ 70% |
| Validação em campo | ≥ 1 agente de endemias testa em campo |

---

## Fora de escopo (MVP)

- **Integração com e-SUS VS / SINAN** — depende de articulação institucional; entra como análise de necessidade no roadmap pós-MVP.
- **Cadastro/conta para o cidadão** — atrito alto derruba a taxa de relato.
- **Coleta de dados de contato do cidadão** — evitada por LGPD.
- **App nativo** — PWA cobre os dois papéis no MVP.

---

## Contexto do projeto

Trabalho acadêmico desenvolvido no escopo de uma disciplina de 60h, com prazo de 3 meses (início: setembro de 2026). Entregáveis:

1. MVP no ar
2. Artigo
3. Repositório de código documentado

O escopo enxuto (features 1 + 3 + 5) é consequência direta desse orçamento de horas.

---

## Estrutura do repositório

```
.paul/                      # Especificação e gestão do projeto
├── PROJECT.md              # Requisitos, modelo de dados, constraints, decisões
├── ROADMAP.md              # Milestones e fases
├── STATE.md                # Posição atual, decisões acumuladas, blockers
├── config.md               # Configuração de integrações
├── paul.toml               # Manifest do projeto
├── ledger.toml             # Histórico de sessões
└── phases/                 # Planos e sumários por fase
```

O projeto é gerido com o [PAUL Framework](https://chrisai.cv/skool) (Plan-Apply-Unify Loop). Os arquivos do framework em si (`.claude/`) não são versionados aqui.

---

## Roadmap

Milestone **v0.1 MVP — Relato, Agregação e Dashboard**, em 5 fases:

| # | Fase | Entrega | Status |
|---|------|---------|--------|
| 1 | Fundação | Scaffold Next.js, CI/CD, schema PostGIS multi-município com RLS, deploy | Em andamento |
| 2 | Relato do cidadão | PWA anônimo: foto + GPS + tipo de criadouro, fila offline | — |
| 3 | Agregação em áreas de risco | Job PostGIS que materializa `risk_area` (< 30s para 10k relatos) | — |
| 4 | Dashboard de vigilância | Mapa de calor, séries temporais, exportação; camada pública em grid ~100m | — |
| 5 | Validação e entrega acadêmica | Teste em campo com agente de endemias, Lighthouse ≥ 90, artigo | — |

Depois do MVP: **v0.2** com triagem do agente (feature 2) e alerta por limiar (feature 4); análise de necessidade de integração com e-SUS VS / SINAN.

Ver [`.paul/ROADMAP.md`](.paul/ROADMAP.md) para o estado corrente.

---

## Desenvolvimento

**Pré-requisitos:** Node.js 24 (ver [`.nvmrc`](.nvmrc)) e pnpm — a versão exata está no campo `packageManager` do `package.json` e é ativada com `corepack enable`.

```bash
pnpm install          # instala dependências (lockfile congelado no CI)
pnpm dev              # servidor de desenvolvimento em http://localhost:3000
pnpm lint             # ESLint
pnpm typecheck        # gera tipos de rota do Next.js e roda tsc --noEmit
pnpm test             # Vitest (uma execução)
pnpm test:watch       # Vitest em modo watch
pnpm test:coverage    # testes com cobertura (coverage/lcov.info)
pnpm build            # build de produção
```

O [CI](.github/workflows/ci.yml) executa os mesmos passos, nesta ordem, em todo push e pull request para `main`: `install --frozen-lockfile` → `lint` → `typecheck` → `test:coverage` → `build`.

### Banco de dados local

**Pré-requisito:** Docker. A CLI do Supabase vem como dependência de desenvolvimento (versão fixa no `package.json`).

```bash
pnpm db:start       # sobe o Postgres local (PostGIS) e aplica migrations + seed
pnpm db:reset       # recria o banco do zero: migrations + seed
pnpm db:test        # testes pgTAP (supabase/tests/database)
pnpm db:lint        # lint do schema public
pnpm db:advisors    # advisors de segurança do Supabase
pnpm db:types       # regenera src/lib/database.types.ts a partir do schema
pnpm db:stop        # para os containers
```

O job `database` do CI sobe um banco novo, roda `db:test`, `db:lint`, `db:advisors` e falha se `src/lib/database.types.ts` estiver desatualizado.

**Regras:**

- **Migrations são imutáveis depois de entrar em `main`.** Mudança de schema = nova migration (`pnpm exec supabase migration new <nome>`); nunca editar um arquivo existente em `supabase/migrations/`.
- **`supabase/seed.sql` é sintético e só para uso local/CI** — nunca é aplicado em ambiente remoto. Os limites dos municípios no seed são retângulos aproximados, não os oficiais.
- **Privacidade por padrão (LGPD):** RLS está habilitado em todas as tabelas; o role `anon` não tem acesso a nenhuma tabela e usuários autenticados só leem dados do próprio município. Toda tabela nova precisa de RLS — os testes pgTAP falham caso contrário.


### Deploy

| Componente | Onde | Como chega lá |
|---|---|---|
| App Next.js | Vercel (funções em `gru1`, São Paulo) — https://sentinela-sigma-eosin.vercel.app | Vercel Git integration: push em `main` → produção; pull request → preview. A promoção a produção exige os checks do CI verdes (Deployment Checks). |
| Banco (Postgres + PostGIS) | Supabase gerenciado em `sa-east-1` (São Paulo) | Job `deploy-db` do CI, depois de `quality` e `database` verdes em `main`: `supabase db push` (sem seed), no environment `production` do GitHub. |

- **Credenciais:** o CI usa apenas o secret `SUPABASE_DB_URL` (connection string do session pooler, escopo do projeto). A Vercel só tem as variáveis públicas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ver [`.env.example`](.env.example)). Nenhuma chave secreta fica na Vercel nem no repositório.
- **Auth:** cadastro público desabilitado; contas de agente/vigilância são criadas por um administrador.
- **App e banco publicam em paralelo (expand/contract):** todo código de app precisa funcionar com o schema anterior e com o novo. Migrations aditivas primeiro; remoção de coluna/tabela só numa release posterior, depois que nenhum código a usa.
- **Falha de migration = forward-fix:** cada migration é aplicada em transação; se falhar, o banco permanece na migration anterior. A correção é uma **nova** migration — nunca editar uma já aplicada.
- **Conferir antes de publicar:** `pnpm db:push:dry --db-url "$SUPABASE_DB_URL"` mostra o que seria aplicado, sem alterar nada.
- **Required checks:** `main` exige os checks `Lint, typecheck, test, build` e `Database (migrations, pgTAP, lint, types)`. Renomear esses jobs no workflow exige atualizar a branch protection (e os Deployment Checks da Vercel).

---

## Licença

[MIT](LICENSE) © 2026 Carlos Eduardo Coelho Freire Batista
