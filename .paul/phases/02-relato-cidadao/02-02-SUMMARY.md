---
phase: 02-relato-cidadao
plan: 02
subsystem: ui
tags: [nextjs, react, supabase, supabase-js, vitest, pgtap, github-actions, keep-alive, lgpd, pwa-ready]

requires:
  - phase: 02-01
    provides: RPC submit_report, resolve_municipality, ping, bucket report-photos, contrato de erro PT422/404/409/429
  - phase: 01-03
    provides: CD de migrations (Deploy database), produção sa-east-1, Vercel com Deployment Checks
provides:
  - Fluxo online de relato em 3 passos (/relatar/foto → local → tipo → pronto) com tokens §5.2 e fontes §5.3
  - Biblioteca src/lib/report (device-token, photo sem EXIF, location, submit idempotente, errors, breeding-sites)
  - Cliente Supabase lazy (getClient/isSupabaseConfigured) que não quebra build nem preview sem env
  - /privacidade com a 1ª camada LGPD (LAVID/UFPB)
  - Heartbeat diário no banco (private.keep_alive_beat + role keep_alive_writer confinado) e workflow keep-alive com issue de falha
  - Produção em projeto Supabase novo (ref vlrjhznkztgqulpgsxsd) e Next 16.4.3
affects: [02-03 mapa e P-01 (passo Local, Sobre/Privacidade), 02-04 PWA/fila offline (submit idempotente, PT429/PT404 retentáveis), fase 4 dashboard (grants de authenticated vêm do default da Supabase)]

tech-stack:
  added: ["@supabase/supabase-js 2.117.3", "Supabase CLI 2.121.0", "Next 16.4.3", "TypeScript 6.0.3", "Bricolage Grotesque + Atkinson Hyperlegible Next (next/font)"]
  patterns:
    - "Cliente Supabase criado só sob demanda; sem env, o envio fica desativado com aviso"
    - "Retentativa reusa o mesmo photo_path e token (idempotência do submit_report); só PT404/PT409 geram nome novo"
    - "Foto reamostrada (≤1600 px, ≤2 MB, WebP/JPEG) e recusada se a saída ainda tiver EXIF"
    - "Keep-alive com credencial própria de menor privilégio, nunca a do owner"
    - "Dependências do Dependabot incorporadas numa branch de integração e mergeadas por um único PR"

key-files:
  created:
    - supabase/migrations/20261022185608_keep_alive_heartbeat.sql
    - supabase/tests/database/keep_alive.test.sql
    - src/lib/supabase/client.ts
    - src/lib/report/{device-token,photo,location,submit,errors,breeding-sites}.ts
    - src/app/relatar/{layout,page,report-draft,step-header}.tsx
    - src/app/relatar/{foto,local,tipo,pronto}/page.tsx
    - src/app/privacidade/page.tsx
    - src/app/_components/{icons,ui}.tsx
  modified:
    - .github/workflows/keep-alive.yml
    - .github/workflows/ci.yml
    - .github/dependabot.yml
    - src/app/{globals.css,layout.tsx,page.tsx}
    - src/lib/database.types.ts
    - package.json
    - README.md

key-decisions:
  - "Projeto Supabase novo em vez de esperar o suporte: o restore do antigo travou em 'Coming up' com supabase_admin sem login"
  - "Next 16.4.3 incorporado no 02-02 por 2 RCE críticas (GHSA-2464-fhr4-w9xw, GHSA-673q-mjm6-r5xr)"
  - "TS 6 por commit próprio em vez do PR #3 (branch defasada)"

patterns-established:
  - "Rotas de passo usam um contexto de rascunho (useReportDraft) e redirecionam para /relatar/foto se a foto sumiu da memória"
  - "Mensagens ao cidadão nunca mostram código técnico; o mapeamento fica em errors.ts"

duration: ~12 dias de calendário (2026-10-22 → 2026-11-03), em 4 sessões
started: 2026-10-22T19:00:00Z
completed: 2026-11-03T17:30:00Z
description: "Cidadão relata um foco em 3 passos (foto sem EXIF, GPS, tipo) contra o Supabase, com envio idempotente e mensagens claras; produção migrada para um projeto Supabase novo com Next 16.4.3; heartbeat diário no banco pronto, aguardando a credencial"
type: Summary
about: "sentinela"
---

# Phase 2 Plan 02: Keep-alive com escrita + lib de relato + fluxo online Summary

**O cidadão abre o Sentinela, tira ou escolhe uma foto (reamostrada e sem EXIF), usa o GPS, escolhe o tipo de criadouro e envia; o relato chega ao banco por `submit_report` com retentativa idempotente e mensagens sem jargão. Desde 2026-11-03 isso está em produção, num projeto Supabase novo (o antigo não voltou do restore), com Next 16.4.3. O heartbeat diário no banco está implantado; falta só a credencial do `keep_alive_writer` para ele rodar.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | 2026-10-22 → 2026-11-03 (4 sessões; bloqueio de produção de 10-22 a 11-03) |
| Tasks | 3 auto + checkpoint human-verify aprovado; checkpoint human-action **pendente** |
| Files | 50 arquivos, +4310/−922 (inclui lockfile e deps) |
| PR | [#11](https://github.com/dobidu/sentinela/pull/11), merge `1f0a483` |
| CI em main | [41679641416](https://github.com/dobidu/sentinela/actions/runs/41679641416): lint/typecheck/test/build ✓, Database ✓, Deploy database ✓ (3ª tentativa, ver Issues) |
| pgTAP | 141 → **158** (+17 keep_alive) |
| Vitest | **61/61**; cobertura de `src/lib/report` 84,9% |
| Escalations | DONE_WITH_CONCERNS nas tasks 1 e 3; 1 BLOCKED (produção 404) resolvido com projeto novo |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Heartbeat no banco, invisível para a API | Pass | `keep_alive.test.sql` (17): tabela append-only em `private`, anon/authenticated sem privilégio, `keep_alive_writer` NOLOGIN sem superuser/BYPASSRLS/CREATEROLE; allowlist de anon intacta; `db:lint`/`db:advisors` limpos. Desvio: role também tem SELECT (ver Deviations) |
| AC-2: Keep-alive diário que escreve no banco | **Pendente** | Workflow em main (cron `23 10 * * *`, psql + ping REST, job `notify` com issue `ops`). Nenhum run com escrita ainda: falta o checkpoint human-action (login do role + secret `SUPABASE_KEEPALIVE_DB_URL`). Até lá o job falha e abre a issue, por desenho |
| AC-3: Higiene de dependências | Pass | CLI 2.121.0 em `package.json` e `ci.yml` (check de sincronia verde). Destino dos PRs: #8, #9, #10 **merged** via #11; #3 **fechado** (superseded, TS 6 em `0426927`); #6 **fechado** pelo usuário; `dependabot.yml` ignora major de `@types/node` |
| AC-4: Biblioteca de relato correta e testada | Pass | Testes de token (fallback de sessão), foto (HEIC → mensagem, ≤1600 px, ≤2 MB, sem EXIF), submit (ordem dos parâmetros, mesmo `photo_path` na retentativa de rede, nome novo em PT404/PT409), errors, breeding-sites (8 valores), cliente sem env. Integração local: reenvio devolve o mesmo id |
| AC-5: Fluxo de 3 passos contra o Supabase local | Pass | Checkpoint human-verify aprovado em 2026-10-27: RECEBIDO só após resposta; 1 linha `pending` com `photo_path` |
| AC-6: Estados de erro e borda | Pass | Aprovado no checkpoint (GPS negado, fora da área, sem tipo, PT429, recarga sem foto, duplo toque, sem env). Preview da Vercel agora sem env → envio desativado |
| AC-6b: Transparência LGPD | Pass | `/privacidade` publicada (HTTP 200 em produção) e linkada nos passos |
| AC-7: Identidade e acessibilidade | Pass | Tokens §5.2 claro/escuro, fontes via next/font, h1 único, alvos ≥ 48 px, foco 3 px, radiogroup, aria-live. Lighthouse não rodou |

## Accomplishments

- Fluxo de relato online completo e em produção (`/relatar/*`), com a lib testada por trás e envio idempotente que a fila offline do 02-04 vai reusar.
- Produção saiu do bloqueio: projeto Supabase novo `vlrjhznkztgqulpgsxsd` (sa-east-1), migrations aplicadas pelo CD, `ping` 200, `resolve_municipality` devolve João Pessoa, anon recebe `42501` em leitura direta de `report`.
- Produção deixou de rodar Next 16.3.6 (2 RCE críticas); bundle aponta só para o ref novo.
- Keep-alive redesenhado com escrita real no banco e alerta por issue — falta ativar.

## Task Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| Tasks 1–3 | `2659fb7` | wip | Keep-alive + CLI/deps, lib de relato, fluxo P-02→P-05 (pausa no human-verify) |
| Deps | `74e96c8`, `a8c0191`, `87b812f` | chore | Dependabot #8, #9, #10 |
| Segurança | `f825ad5` | fix | Next e eslint-config-next 16.4.3 |
| Deps | `0426927` | chore | TypeScript 6.0.3 |
| Estado | `2d41c9a` | wip | Pausa aguardando ping de produção |
| Integração | `1f0a483` | merge | PR #11 em main |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Recriar o projeto Supabase (`ftibuibtjgqxwthwvthf` → `vlrjhznkztgqulpgsxsd`) | Restore travado em "Coming up" desde 10-22; logs com `28P01` para `supabase_admin` e `realtime.subscription` ausente — só o suporte resolveria; produção sem dado real e schema todo em migrations | Ref, keys e `SUPABASE_DB_URL` trocados; secret key antiga exposta no git deixa de existir |
| "Automatically expose new tables" **ligado** no projeto novo | `rls_base.sql` só revoga; o SELECT de `authenticated` depende do grant padrão da Supabase (paridade com local/CI) | Fase 4: leitura de staff depende disso; desligar exigiria migration com GRANT explícito |
| Merge do #11 com merge commit | Commits do Dependabot no histórico marcam #8/#9/#10 como merged | Histórico de main com merge da branch WIP |
| Next 16.4.3 e TS 6 dentro do 02-02 | Segurança (RCE) e branch do #3 defasada | Escopo de deps maior que o plano |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 3 | Necessários, sem scope creep de produto |
| Scope additions | 3 | Deps de segurança e troca de projeto Supabase |
| Deferred | 4 | Registrados em STATE.md |

**Total impact:** o produto saiu como planejado; o desvio grande foi operacional (projeto Supabase novo).

### Auto-fixed Issues

**1. Privilégio: `keep_alive_writer` precisa de SELECT**
- **Found during:** Task 1
- **Issue:** AC-1 dizia só INSERT e DELETE; `returning` e o prune exigem SELECT
- **Fix:** grant + policy de SELECT só em `private.keep_alive_beat`
- **Verification:** pgTAP prova que não há acesso a nenhuma outra tabela

**2. Storage duplicado responde 400/`KeyAlreadyExists`**
- **Found during:** Task 2 (integração local)
- **Fix:** `classifyStorageError` trata `statusCode '409'` dentro de 400 como "já enviado"

**3. Arquivos fora de `files_modified`**
- `src/app/_components/*`, `src/app/relatar/page.tsx`, `step-header.tsx`, `relatar.test.tsx`, `src/lib/supabase/client.test.ts`, `src/lib/report/location.test.ts` — extração de componentes e testes; dentro do escopo funcional

### Scope additions

- Next 16.4.3 (além do #10) por GHSA-2464-fhr4-w9xw / GHSA-673q-mjm6-r5xr
- TS 6.0.3 por commit próprio no lugar do #3
- Projeto Supabase novo (fora do plano; decisão do usuário em 2026-11-03)

### Deferred Items

- Checkpoint human-action do keep-alive (login do `keep_alive_writer` + `SUPABASE_KEEPALIVE_DB_URL`) — usuário fará depois
- Observar ≥ 7 dias sem pausa do projeto novo (a contar de 2026-11-03) — verificação no UNIFY do 02-03
- Lighthouse do fluxo
- `photo.ts` decodifica o bitmap inteiro (pico ~48 MB numa foto de 12 MP)

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Produção 404 PGRST202 desde 10-22 (schema cache vazio, Database "Coming up") | Logs mostraram `supabase_admin` sem login e schema `realtime` incompleto: restore quebrado. Projeto novo criado em 2026-11-03; antigo apagado |
| Deploy database: `failed to parse connection string` | Secret colado com formato inválido; refeito |
| Deploy database: `ECONNREFUSED` em IPv6 (`db.<ref>.supabase.co`) | Era a Direct connection; runners do GitHub não têm IPv6 → Session pooler |
| Keep-alive antigo falhou 10-13…10-25 e após 11-03 | Esperado: projeto antigo fora; novo keep-alive depende do checkpoint pendente |
| CLI 2.121 gera `database.types.ts` sem formatar | Diff grande sem mudança de tipo; não atualizar a CLI sem bump sincronizado com `ci.yml` |
| `gh pr close` negado ao agente em 10-27 | #6 fechado pelo usuário; #3 fechado pelo agente em 11-03 com autorização |

## Next Phase Readiness

**Ready:**
- Fluxo online e lib de relato para o 02-03 (mapa no passo Local, P-01, Sobre) e o 02-04 (fila offline sobre o `submit` idempotente)
- Produção estável no projeto novo, previews sem escrita

**Concerns:**
- Keep-alive inativo até o checkpoint: o projeto novo pode pausar como o antigo
- Mensagem do PT429 sem fila ("Tente de novo mais tarde") até o 02-04
- Job do keep-alive com `environment: production` cria registros de deployment
- Confirmar o nome por extenso do LAVID em `/privacidade`

**Blockers:**
- None para o 02-03 (o keep-alive é recomendado antes, não bloqueante)

---
*Built with PAUL Framework v1.4 · https://chrisai.cv/skool · https://youtube.com/@chris-ai-systems*
*Phase: 02-relato-cidadao, Plan: 02*
*Completed: 2026-11-03*
