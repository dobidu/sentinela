---
phase: 02-relato-cidadao
plan: 01
subsystem: database
tags: [supabase, postgres, postgis, rls, storage, postgrest, pgtap, github-actions, lgpd]

requires:
  - phase: 01-02
    provides: schema PostGIS, RLS deny-by-default, FK composta, EXECUTE revogado de PUBLIC
  - phase: 01-03
    provides: CD de migrations (deploy-db), produção sa-east-1, check de sincronia da CLI
provides:
  - RPC submit_report (anon) com hash do token no banco, município pelo ponto, reenvio idempotente, rate limit serializado e contrato de erro PT422/404/409/429
  - Bucket privado report-photos (anon só INSERT, nome UUID v4, 2 MB, teto 300/h e 3000)
  - report_status_event append-only com source (citizen/staff/system); report.updated_at; unique(photo_path)
  - João Pessoa e Cabedelo em produção (malha IBGE)
  - RPCs resolve_municipality e ping; schema private para helpers de policy
  - Workflow keep-alive; Dependabot sem bump da Supabase CLI
affects: [02-02 formulário (contrato de erro, ordem upload→RPC, resolve_municipality), 02-03 fila offline (idempotência, PT429/PT404 retentáveis), fase 3 agregação (quem roda job privilegiado), fase 4 dashboard (leitura de foto por staff, current_* em private)]

tech-stack:
  added: [Supabase Storage (bucket privado), PostgREST SQLSTATE PTnnn → HTTP, actionlint v1.7.12 (local)]
  patterns:
    - "Escrita anônima só por RPC SECURITY DEFINER; anon sem privilégio de tabela"
    - "API pública em public; helpers de policy em private (fora do PostgREST)"
    - "Erros de RPC como SQLSTATE PTnnn com mensagem fixa, sem ecoar parâmetros"
    - "Rate limit com pg_advisory_xact_lock por chave (token, município)"
    - "Trilha append-only por trigger, inclusive contra postgres/service_role"
    - "Sondas sem escrita em produção no checkpoint"

key-files:
  created:
    - supabase/migrations/20261001185320_report_write_path.sql
    - supabase/migrations/20261001195629_private_policy_helpers.sql
    - supabase/tests/database/report_write.test.sql
    - .github/workflows/keep-alive.yml
  modified:
    - supabase/seed.sql
    - supabase/tests/database/rls.test.sql
    - supabase/tests/database/schema.test.sql
    - src/lib/database.types.ts
    - .github/dependabot.yml
    - README.md

key-decisions:
  - "Foto via Storage direto + RPC; nenhuma chave secreta na Vercel"
  - "Reenvio com mesmo token + foto devolve o mesmo id (antes de qualquer outra checagem)"
  - "Helpers de policy no schema private; submit_report e resolve_municipality são as únicas exceções aceitas do advisor"
  - "Municípios de produção: João Pessoa + Cabedelo, malha IBGE embutida na migration"

patterns-established:
  - "Toda função nova: contrato público em public com GRANT explícito; helper em private"
  - "Advisor de produção (--linked) faz parte da verificação de checkpoint"
  - "Prova de não-vacuidade (fault injection) para controles de segurança"

duration: ~2h10 (PLAN 15:45 → fix em produção 16:59, incluindo audit e BLOCKED do Docker)
started: 2026-10-01T18:45:00Z
completed: 2026-10-01T20:05:00Z
description: "Caminho de escrita anônimo no banco: submit_report idempotente com rate limit e contrato de erro HTTP, bucket privado com teto, histórico append-only, JP + Cabedelo em produção, keep-alive"
type: Summary
about: "sentinela"
---

# Phase 2 Plan 01: Caminho de escrita anônimo Summary

**O cidadão anônimo consegue, só com a publishable key, subir uma foto para um bucket privado e registrar um relato pela RPC `submit_report`, que resolve o município pelo ponto, guarda só o hash do token, aceita reenvio idempotente, limita volume e responde com códigos HTTP que a fila offline consegue tratar. Tudo em produção, com 141 testes pgTAP e só 2 exceções documentadas no advisor.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~2h10 (plan + audit + apply + checkpoint fix) |
| Tasks | 4 auto (1, 2, 3 e 3b do checkpoint) + checkpoint aprovado |
| Files | 4 criados, 6 modificados (+919/−36 no código) |
| CI | [36917305271](https://github.com/dobidu/sentinela/actions/runs/36917305271) (feature) e [36918302223](https://github.com/dobidu/sentinela/actions/runs/36918302223) (fix), 3 jobs verdes |
| pgTAP | 87 → **141** (schema 41, rls 48, report_write 52) |
| Escalations | 1 BLOCKED (Docker sem integração WSL), 1 decisão de boundary, 1 issue de checkpoint (Spec) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Municípios reais e seed coerente | Pass | 2 municípios `st_isvalid` em local e produção; centro de JP só em JP; seed sem os retângulos; `db:reset` 2× exit 0 |
| AC-2: Relato anônimo válido | Pass | pgTAP: status pending, município pelo ponto, hash = sha256(token), evento citizen null→pending, token ausente do registro |
| AC-2b: Reenvio idempotente | Pass | Mesmo id; nenhum relato/evento novo; outro token → PT409 |
| AC-3: Recusas fail-closed | Pass | Oceano, foto inexistente, foto > 1h, path, descrição > 500, token nil, token não v4, NaN, faixa, tipo nulo → SQLSTATE exato; nada criado |
| AC-3b: Contrato de erro HTTP | Pass | Em produção: PT404 → HTTP 404, PT422 → HTTP 422; mensagens fixas testadas; tabela no README |
| AC-4: Rate limit | Pass | 6º/h e 21º/24h → PT429; outro token livre; teto 200/h do município; advisory lock presente (prova por inspeção, ver limitações) |
| AC-4b: Teto de upload | Pass | 300º upload da hora aceito, 301º recusado; teto total de 3000 recusa |
| AC-5: Superfície de anon (revisado no checkpoint) | Pass | anon em public = {ping, resolve_municipality, submit_report}; em private = {can_upload_report_photo}; 0 tabelas; storage só INSERT no padrão; advisor de produção = 4 WARNs aceitos |
| AC-6: Histórico de status | Pass | source citizen/staff/system; sem evento para status igual; UPDATE/DELETE/TRUNCATE recusados até para postgres; DELETE de relato com histórico → 23503 |
| AC-7: Keep-alive e Dependabot | Pass (configuração) / **Fail (efeito)** | Workflow sem secrets, `permissions: {}`, runs manuais e agendado (10-04) com HTTP 200; PR #4 fechado, grupo #5 verde. **Mas o projeto pausou de novo antes de 2026-10-06**: o keep-alive não cumpre seu objetivo (ver Issues) |

## Accomplishments

- Primeiro caminho de escrita do sistema, desenhado para a fila offline do 02-03: reenvio seguro e erros classificados como retentáveis ou permanentes **no banco**, não no cliente.
- Superfície pública mínima e provada: 3 funções em public para anon, teste de igualdade de conjunto por assinatura, e injeção de falha derrubando os testes certos (#11, #32, #33, #36).
- Trilha de status defensável numa auditoria: append-only por trigger, com origem, até contra o service_role.
- Verificação em produção sem gravar dados: sondas 404/422/401, catálogo do bucket e advisor `--linked`.

## Task Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| Plano + audit | `9cc581b` | docs | PLAN + AUDIT 02-01, STATE/ROADMAP |
| Tasks 1–3 | `8a7b726` | feat | Migration, seed, testes, tipos, keep-alive, Dependabot, README |
| Task 3b (checkpoint) | `a286155` | fix | Schema private, ping INVOKER, testes, README, plano revisado |
| Registro do APPLY | `d2ab953` | docs | STATE/ledger + handoffs |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migrations/20261001185320_report_write_path.sql` | Created | Municípios IBGE, report_status_event, updated_at, unique(photo_path), bucket + policy, 4 funções públicas |
| `supabase/migrations/20261001195629_private_policy_helpers.sql` | Created | Schema private; move 3 helpers; ping INVOKER |
| `supabase/tests/database/report_write.test.sql` | Created | 52 testes do caminho de escrita |
| `.github/workflows/keep-alive.yml` | Created | Ping a cada 3 dias com a publishable key (variável de repo) |
| `supabase/seed.sql` | Modified | Sem os retângulos sintéticos (conflito com o unique de ibge_code) |
| `supabase/tests/database/rls.test.sql` | Modified | Allowlist exata de anon por assinatura (public + private); refs a private.current_* |
| `supabase/tests/database/schema.test.sql` | Modified | Só fixtures `'x.jpg'` → `x1..x7.jpg` (exceção de boundary aprovada) |
| `src/lib/database.types.ts` | Modified | Tipos regenerados |
| `.github/dependabot.yml` | Modified | `ignore: supabase` |
| `README.md` | Modified | Escrita anônima (tabela de erros), exceções do advisor, keep-alive, atualização da CLI |

Fora do repo: variáveis de repositório `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`.

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Idempotência checada antes de município e foto | Reenvio da fila offline > 1h depois do upload receberia PT404 mesmo com o relato criado | 02-03 pode retentar sem estado extra |
| Schema `private` para helpers de policy | Advisor de produção (lints 0028/0029) | Regra para toda função nova |
| `ping` como `select 1` INVOKER | Não precisa de privilégio | **Possível causa da nova pausa** (hipótese, ver Issues) |
| Policy de upload para anon **e** authenticated | Agente logado relata pelo mesmo canal | Sem caminho separado para staff |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Spec fix no checkpoint | 1 | Task 3b + migration extra; AC-5 revisado |
| Exceção de boundary aprovada | 1 | `schema.test.sql` (só fixtures) |
| Ajustes de implementação | 5 | Sem impacto em AC |
| Deferred novos | 2 | CLI do CI ≥ 2.119; keep-alive ineficaz |

**Total impact:** um problema de spec (paridade local × produção) corrigido antes do código; o resto são ajustes. O keep-alive não cumpre o objetivo e volta como pendência prioritária.

### Spec fix (checkpoint)

**Advisor de produção ≠ advisor local**
- **Found during:** checkpoint (sondas em produção)
- **Issue:** lints 0028/0029 do advisor hospedado apontaram 6 funções SECURITY DEFINER expostas; o CLI 2.117 do CI não tem esses lints
- **Classificação:** Spec. O plano assumiu paridade e não separava API pública de helper de policy
- **Fix:** plano revisado (AC-5 + Task 3b) **antes** do código; migration `private_policy_helpers`
- **Verification:** advisor `--linked` = 4 WARNs aceitos; funções movidas → 404 na REST; 141 testes
- **Commit:** `a286155`

### Ajustes de implementação

1. Sem `isfinite` para `float8` no Postgres: NaN e ±Infinity caem na checagem de faixa (`between`), com teste.
2. `storage.protect_delete` bloqueia DELETE direto: o teste do teto total usa `storage.allow_delete_query` só na própria transação.
3. Keep-alive captura o status HTTP em vez de `--fail-with-body` (log sem corpo da resposta).
4. Malha IBGE em SIRGAS 2000 gravada como 4326 (diferença submétrica, comentada na migration).
5. Idempotência movida para antes de município/foto (ver Decisions).

### Deferred Items

- Advisor do CI sem os lints de produção → atualizar a Supabase CLI para ≥ 2.119 com bump sincronizado (02-02).
- Keep-alive ineficaz → investigar antes do 02-02 (ver Issues).
- Do audit (já no STATE): limpeza de fotos órfãs, rate limit por IP, máquina de estados, alerta de tetos, conferência mensal da CLI.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Docker sem integração WSL (BLOCKED) | Usuário ativou no Docker Desktop (29.7.2) |
| `unique (photo_path)` quebrou fixture em arquivo protegido | Agente parou e perguntou; usuário aprovou trocar só os literais |
| `gh variable get` inexistente na versão do gh | Leitura via `gh api .../actions/variables/...` |
| **Projeto pausou de novo** (INACTIVE em 2026-10-06) apesar do keep-alive agendado verde em 10-04 | Usuário restaurou em 10-06 (classificador impede o agente); CI do `d2ab953` verde depois. **Causa não investigada.** Hipóteses: (a) `ping` = `select 1` sem tocar tabela pode não contar como atividade, já que a primeira versão tocava `municipality`; (b) janela de inatividade < 7 dias; (c) intervalo de 3 dias longo |

### Limitações de teste registradas

- A concorrência do rate limit não é testável em pgTAP com uma conexão: a prova é por inspeção de `pg_locks`.
- O mapeamento PTnnn → HTTP só foi provado em produção (404 e 422); 409 e 429 dependem do mesmo mecanismo do PostgREST, sem sonda.

## Next Phase Readiness

**Ready:**
- Contrato estável para o 02-02: ordem upload → `submit_report`, tabela de erros, `resolve_municipality` para mostrar o município antes do envio.
- Contrato para o 02-03: reenvio com mesmo token + foto é seguro; PT429/PT404 retentáveis.
- Tipos TS com as 3 RPCs públicas.

**Concerns:**
- **Keep-alive não impede a pausa**: produção pode cair de novo a qualquer momento, e o CD falha junto.
- Previews da Vercel ainda têm as env do Supabase (remoção prevista no 02-02, antes de existir código que escreve).
- CI não detecta regressões que só o advisor de produção vê.

**Blockers:** None para planejar o 02-02. A investigação do keep-alive deve ser a primeira task.

---
*Built with PAUL Framework v1.4 · https://chrisai.cv/skool · https://youtube.com/@chris-ai-systems*
*Phase: 02-relato-cidadao, Plan: 01*
*Completed: 2026-10-01 (UNIFY: 2026-10-06)*
