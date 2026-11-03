---
description: "sentinela — current position and accumulated context"
type: ProjectState
about: "sentinela"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-10-01)

**Core value:** Um sistema de relato e triagem de focos de arboviroses, que agrega os relatos em áreas de risco e alerta a vigilância municipal.
**Current focus:** Phase 2 (Relato do cidadão) — 02-02 fechado (UNIFY 2026-11-03); próximo é planejar o 02-03

## Current Position

Milestone: v0.1 MVP — Relato, Agregação e Dashboard
Phase: 2 of 5 (Relato do cidadão) — In progress
Plan: 02-02 completo (SUMMARY em .paul/phases/02-relato-cidadao/02-02-SUMMARY.md); checkpoint human-action do keep-alive pendente
Status: Ready for next PLAN (02-03)
Last activity: 2026-11-03 — Projeto Supabase novo (vlrjhznkztgqulpgsxsd); PR #11 mergeado (1f0a483); Deploy database aplicou as migrations; ping 200; produção em Next 16.4.3; UNIFY do 02-02

Progress:
- Milestone: [███░░░░░░░] ~31% (1 de 5 fases; 5 de ~16 planos estimados)
- Phase 1: [██████████] 100% (3/3 planos) ✅
- Phase 2: [█████░░░░░] 50% (2/4 planos)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete — 02-02 fechado; pronto para PLAN do 02-03]
```

## Accumulated Context

### Decisions

| Decision | Phase | Impact |
|----------|-------|--------|
| 2026-11-03: Projeto Supabase recriado — `ftibuibtjgqxwthwvthf` (restore travado em "Coming up": `supabase_admin` com 28P01, schema `realtime` incompleto) → `vlrjhznkztgqulpgsxsd` (sentinela_db, sa-east-1, Data API ligada, "expose new tables" ligado, RLS automático desligado, signup off); antigo apagado | Plan 02-02 | GitHub vars/secret e Vercel Production trocados; Preview sem env |
| 2026-11-03: "Automatically expose new tables" fica ligado — `rls_base.sql` só revoga, o SELECT de `authenticated` vem do grant padrão (paridade com local/CI) | Plan 02-02 | Fase 4 depende disso; desligar exige migration com GRANT explícito |
| 2026-11-03: `SUPABASE_DB_URL` (environment production) = Session pooler; Direct connection é só IPv6 e falha nos runners do GitHub | Plan 02-02 | Vale também para `SUPABASE_KEEPALIVE_DB_URL` |
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
| 2026-10-08: Spec de UI/UX (`.paul/handoffs/HANDOFF-claude-design-2026-10-08.md`) é a fonte de verdade da interface: identidade "caderno de campo", 49 telas (P/S/X), 16 jornadas; inspirada no gov.br DS sem usar sua identidade | Phase 2 | 02-02/02-03 implementam §6 + §13.5; fase 4 implementa §7–8 + §13.6 |
| 2026-10-22: Enterprise audit performed on .paul/phases/02-relato-cidadao/02-02-PLAN.md. Applied 5 must-have, 3 strongly-recommended upgrades. Deferred 4. Verdict: conditionally acceptable | Phase 2 | Plan strengthened for enterprise standards |
| 2026-10-22: Fase 2 em 4 planos — 02-02 keep-alive + lib de relato + fluxo online (GPS); 02-03 mapa pin fixo + P-01 + Sobre/Privacidade + polimento; 02-04 PWA + fila offline | Plan 02-02 | Substitui a divisão em 3 de 2026-10-01 |
| 2026-10-22: Keep-alive por escrita diária no banco (`psql` + `SUPABASE_KEEPALIVE_DB_URL`, role `keep_alive_writer` confinado, environment production) em `private.keep_alive_beat`, mais ping REST; falha abre issue | Plan 02-02 | Ping REST de 3 em 3 dias não impediu a 3ª pausa (10-10 verde → 10-13 DNS fora) |
| 2026-10-22: Protocolo do cidadão (§16 #1) e modo sol (§16 #4) ficam para v0.2; instituição (§16 #3) = LAVID/UFPB, responsável Carlos Eduardo Batista | Plan 02-02 | P-05 sem código; P-08 não existe no MVP; Sobre/Privacidade no 02-03 |
| 2026-10-27: Checkpoint human-verify do 02-02 aprovado; ações (a)–(e) autorizadas. Deps incorporadas na branch (não merge individual): #8, #9, #10 (commits entram no histórico), TS 6 em vez do #3 (branch defasada), Next 16.4.3 por GHSA-2464-fhr4-w9xw/GHSA-673q-mjm6-r5xr (≤16.4.0, inclui 16.3.6 de produção) | Plan 02-02 | Um único push em main via PR #11 |
| 2026-10-27: WIP do 02-02 em branch `wip/02-02-relato-online` (sem push em main: ping de produção 404 e checkpoint não aprovado) | Plan 02-02 | Branch não dispara CI/deploy; integrar via PR |
| 2026-10-22: Dev local no macOS com Colima (Docker CLI) + pnpm 11.9.0 via npm; `supabase start` (stack completo, Storage incluso) | Plan 02-02 | Fluxo com escrita verificado localmente |
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
| EXIF não imposto no servidor (cliente modificado) | Audit 02-02 | S | Junto do blur de rosto/placa |
| CSP / headers de segurança | Audit 02-02 | S | Antes da fase 4 (login) |
| Schedule do GitHub desativado após 60 dias sem commit | Audit 02-02 | S | Pós-entrega (~12-10) |
| ESLint 10 (pnpm marca 9 como deprecated) vs. eslint-config-next 16 | UNIFY 01-01 | S | Quando Dependabot propuser |
| CI checando imutabilidade de migrations | Audit 01-02 | S | Entrada de colaborador |
| Política de retenção de relatos/fotos (LGPD) | Audit 01-02 | M | Antes da validação em campo (fase 5) |
| Dado pessoal em `description` livre | Audit 01-02 | S | Fase 2 (UI) |
| Banco de staging separado p/ previews | Audit 01-03 | M | Fase 2 (previews com escrita) |
| Backups/PITR | Audit 01-03 | M | Antes da validação em campo (fase 5) |
| **Checkpoint human-action do keep-alive (02-02):** no projeto novo, `alter role keep_alive_writer with login password '<forte, alfanumérica>';` + secret `SUPABASE_KEEPALIVE_DB_URL` (environment production, Session pooler, usuário `keep_alive_writer.vlrjhznkztgqulpgsxsd`); depois `gh workflow run keep-alive.yml` e conferir `beat_at`. Até lá o job diário falha e abre issue | UNIFY 02-02 | S | **Antes do 02-03** |
| Observar ≥ 7 dias sem pausa do projeto novo (desde 2026-11-03) | UNIFY 02-02 | S | UNIFY 02-03 |
| Lighthouse do fluxo de relato | UNIFY 02-02 | S | 02-03 (polimento) |
| `photo.ts` decodifica o bitmap inteiro (pico ~48 MB em foto de 12 MP) | UNIFY 02-02 | S | Se houver relato de travamento em aparelho fraco |
| Confirmar nome por extenso do LAVID em `/privacidade` | UNIFY 02-02 | S | 02-03 (Sobre/Privacidade) |
| `source-map-js` (high, GHSA-68fv-2mgg-jv7q) via next>postcss — só build-time | APPLY 02-02 | S | Quando o Next atualizar postcss |
| Expand/contract é regra documentada, sem verificação em CI | UNIFY 01-03 | S | Fase 2 (1ª migration nova) |
| ~~Projeto Supabase pausado repetidamente~~ — **encerrado em 2026-11-03** com projeto novo; histórico:  3ª pausa entre 10-10 e 10-13 (DNS fora; runs 10-13…10-22 falharam); restaurado pelo usuário em 10-22. Fix planejado: Task 1 do 02-02 (escrita diária). Antes: apesar de keep-alive agendado verde em 10-04 (run 37210625181, HTTP 200). Hipóteses não verificadas: RPC `select 1` (INVOKER, sem tocar tabela) não conta como atividade; janela < 7 dias; intervalo de 3 dias longo. Restaurado em 10-06 pelo usuário; **investigar como 1ª task do 02-02** (histórico: 1ª pausa 10-01 sem keep-alive) | UNIFY 02-01 | S | **1ª task do 02-02** |
| Limpeza de fotos órfãs no bucket (job service_role via Storage API) | Audit 02-01 | S | Fase 5 ou teto de upload a 50% |
| Rate limit por IP (hash com sal rotativo, LGPD) | Audit 02-01 | M | Se houver abuso observado |
| Máquina de estados de status do relato | Audit 02-01 | S | v0.2 (triagem) |
| Alerta quando tetos de upload/relato disparam | Audit 02-01 | S | Feature 4 (alertas) |
| 8 decisões de produto em aberto na spec de UI/UX (§16): protocolo do cidadão, janela/limiar k do mapa, instituição no "Sobre", modo sol, autoria do relato de agente, motivo de descarte/encaminhamento, RPC de gestão de usuários, permissões de admin | Spec UI/UX 2026-10-08 | S | Itens 1/3/4 no 02-02; demais fases 3–4/v0.2 |
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

Last session: 2026-11-03
Stopped at: UNIFY do 02-02 concluído e mergeado (PR #14, `8d702f2`); sessão pausada antes do checkpoint do keep-alive
Next action: usuário faz o checkpoint human-action do keep-alive → agente roda `gh workflow run keep-alive.yml` e confere `beat_at` → `/paul:plan` do 02-03
Resume file: .paul/HANDOFF-2026-11-03.md
Git strategy: `main` protegida; mudanças via PR (merge commit). Repo público em https://github.com/dobidu/sentinela; `.claude/` (PAUL Framework) e `graphify-out/` fora do versionamento via .gitignore
Resume context:
- Enterprise Plan Audit habilitado → fluxo é `plan → audit → apply → unify`
- MVP restrito às features 1 + 3 + 5; features 2 e 4 são v0.2
- Stack e modelo de dados (6 entidades) já decididos e registrados em PROJECT.md — não re-perguntar
- Produção: https://sentinela-sigma-eosin.vercel.app (Supabase ref **vlrjhznkztgqulpgsxsd** "sentinela_db", sa-east-1; Vercel gru1; Next 16.4.3). Fluxo push main → CI → Deploy database → Vercel (Deployment Checks)
- Fluxo de relato online em produção (`/relatar/*`, `/privacidade`); previews da Vercel sem env Supabase (envio desativado)
- Contrato de escrita anônima (02-01): upload em report-photos → `submit_report`; erros PT422/404/409/429 (tabela no README)
- Spec de UI/UX em .paul/handoffs/HANDOFF-claude-design-2026-10-08.md: tokens §5.2, tipografia §5.3, fluxo do relato §6, telas P-01…P-05 §13.5
- Keep-alive novo (escrita diária em `private.keep_alive_beat`) implantado mas inativo até o secret `SUPABASE_KEEPALIVE_DB_URL`
- Dev local: macOS `colima start` / Linux-WSL2 Docker Desktop; `pnpm exec supabase start` (stack completo; Studio 127.0.0.1:54323); `.env.local` pelo README; db:test 158/158 e Vitest 61/61
- WSL2: porta 3000 ocupada por outro processo → `pnpm dev` sobe na 3001
- graphify: grafo do repo em `graphify-out/` (local, ignorado no git)
- Handoffs de apresentação em .paul/handoffs/ — para slides; não são contexto de loop

---
*STATE.md — Updated after every significant action*
