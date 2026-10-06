# Handoff: Atualização dos slides — o que mudou depois dos handoffs de hoje

**Data:** 2026-10-06 (depois do UNIFY do 02-01)
**Para:** quem vai atualizar os slides montados a partir de:
- `HANDOFF-aula-2026-10-06.md` (método / jornada, 11 slides)
- `HANDOFF-arquitetura-2026-10-06.md` (arquitetura planejada × realizada, 15 slides)

**Como usar:** é um **diff**. Cada item diz o slide afetado, o texto que sai e o que entra. Slides não listados continuam válidos.

---

## 1. O que aconteceu desde os handoffs

| Hora (06/10) | Fato | Evidência |
|---|---|---|
| manhã | Projeto Supabase encontrado **INACTIVE** (2ª pausa) | `supabase projects list` |
| — | Checado: **a CLI não tem comando de restore**, nem na 2.117 (projeto) nem na 2.119 (última); `projects` só tem list/create/delete | `supabase projects --help` |
| — | O usuário reativou pela Management API (o agente não pode: o classificador de permissões barra) → `ACTIVE_HEALTHY` | sessão |
| — | Sondas da demo OK: `ping` 200, `resolve_municipality` 200, `submit_report` no oceano 422 | sessão |
| — | Push do `d2ab953` (handoffs + STATE); CI verde, "Remote database is up to date" | run [37425333689](https://github.com/dobidu/sentinela/actions/runs/37425333689) |
| — | **UNIFY do 02-01 concluído**: `02-01-SUMMARY.md`; Fase 2 em 1/3; loop fechado | `.paul/phases/02-relato-cidadao/02-01-SUMMARY.md` |

**Estado agora:** produção **ativa**, demo ao vivo funciona; loop PAUL em **IDLE**, próximo passo `/paul:plan` do 02-02.

---

## 2. Mudanças nos slides da aula (`HANDOFF-aula-2026-10-06.md`)

### Slide 4 — Linha do tempo
**Acrescentar ao fim:** `10-06 → restore → UNIFY 02-01 (loop fechado)`.

### Slide 10 — "O loop continua: achado de 10-06"
**Sai:** "o banco pausou de novo" como fato sem desfecho.
**Entra:**
- O loop registrou o resultado: no SUMMARY, o **AC-7 ficou "Pass (configuração) / Fail (efeito)"**. O keep-alive existe e roda, mas não cumpre o objetivo. O UNIFY não maquia isso.
- A investigação virou a **1ª task do próximo plano (02-02)**, não uma nota solta.
- **Hipótese nova, mais forte (ainda não verificada):** o run de 10-04 foi o primeiro *depois* do fix do checkpoint, que transformou `ping` em `select 1` sem tocar tabela. A versão anterior lia `municipality`. Se confirmada, **a correção de uma lacuna (advisor) criou outra (keep-alive)**. Isso liga direto ao slide sobre controles que interagem.

### Slide 11 — Próximos passos
**Sai:** "2. UNIFY do 02-01 (ainda aberto)."
**Entra:**
1. 02-02 começando pela investigação do keep-alive (hipótese do `select 1`).
2. 02-02: formulário de relato (foto comprimida, GPS, ≤ 3 telas) e remoção das env do Supabase dos previews.
3. 02-03: PWA + fila offline usando o contrato idempotente.

### Slide novo (opcional, entre 9 e 10) — "Lacuna no próprio método"
Bom para uma disciplina sobre loops:
- A regra do PAUL para "fase concluída" é **nº de PLANs = nº de SUMMARYs na pasta**.
- Na Fase 2 só o 02-01 tinha sido escrito, então a regra dava **1 = 1 → "fase completa"**, e a transição de fase dispararia errado.
- O agente cruzou com o ROADMAP (3 planos previstos) e **não** fez a transição.
- Lição: a regra assume que todos os planos da fase são escritos antes do primeiro APPLY. Com planejamento incremental (um plano por vez), ela falha. Uma melhoria possível é declarar o número de planos no ROADMAP e checar contra ele.

### §6 Demo
**Sai:** o aviso "só se o banco estiver ativo / reativar antes da aula".
**Entra:** "banco ativo desde 06/10 (restore manual)". O plano B com prints continua útil se pausar de novo.

### §8 Cuidados
- **Sai:** "o UNIFY ainda não rodou".
- **Entra:** "02-01 fechado (UNIFY 10-06); Fase 2 em 1 de 3 planos; ainda não existe UI de relato".
- **Mantém:** não dizer que o keep-alive resolveu.

---

## 3. Mudanças nos slides de arquitetura (`HANDOFF-arquitetura-2026-10-06.md`)

### Slide 6 — Planejado × realizado
| Linha | Sai | Entra |
|---|---|---|
| Operação no free tier | "❌ aberto — projeto pausou de novo em 10-06" | "❌ aberto — pausou 2×; restaurado em 10-06 pelo usuário (CLI sem restore); keep-alive com efeito **Fail** no SUMMARY" |
| Escrita do cidadão | "✅ no banco; sem UI" | igual, acrescentando "**loop fechado (UNIFY 10-06)**" |

### Slide 11 — Lacunas que escaparam (tabela §5.2)
**Linha 2 (keep-alive)**, coluna "Raiz": acrescentar "+ possível efeito colateral do fix da linha 3 (`ping` virou `select 1`), **hipótese**".

**Linha nova (8):**

| # | Lacuna | Como apareceu | Custo | Raiz |
|---|---|---|---|---|
| 8 | **Sem caminho automatizável de restore** | A CLI não tem restore; a API existe, mas o agente é barrado pelo classificador | Toda pausa exige humano | Operação de recuperação não planejada; dependência de um passo humano |

### Slide 12 — Caso: pausa do free tier
**Substituir a narrativa por quatro tempos:**
1. Audit 01-03 adiou o keep-alive para a fase 5 (risco tratado como de *feature*).
2. 10-01: pausa → CD falha → restore manual → keep-alive criado.
3. 10-01: fix do checkpoint troca `ping` para `select 1` (por outro motivo: o advisor).
4. 10-06: pausa de novo com keep-alive verde → restore manual → UNIFY marca **Fail (efeito)** → investigação vira 1ª task do 02-02.

Mensagem: *risco de tempo + controles que interagem + verificação pontual*, três lições num caso só.

### Slide 14 — O que ainda não tem plano
**Acrescentar linha:** "Recuperação de pausa: hoje só manual (dashboard/API por humano). Planejar detecção + procedimento, ou sair do free tier na validação em campo."

### Slide 15 — Lições
**Acrescentar a 8ª:** "Correções também têm efeito colateral: um fix de segurança (ping sem privilégio) pode ter desligado um controle operacional (keep-alive). Rever quem depende do que você mudou."

### Números a corrigir em qualquer slide
| Onde aparece | Era | Agora |
|---|---|---|
| Pendências abertas no STATE | 23 | **20** (3 fechadas no UNIFY: histórico de status, RPC de município, keep-alive original substituído pela pendência de investigação) |
| Fase 2 | "1/3, UNIFY aberto" | **1/3 fechado** |
| Testes pgTAP | 141 | 141 (sem mudança) |
| Commits da jornada | 5 | 5 de código/processo em 10-01 + `d2ab953` (docs) em 10-06 |

### §8 Cuidados
- **Sai:** "Produção está pausada agora".
- **Entra:** "Produção ativa desde 06/10 (restore manual). Pode pausar de novo: o keep-alive não está provado."
- **Mantém:** "a causa da 2ª pausa não foi investigada", agora com a hipótese do `select 1` como a mais provável, **sem afirmar**.

---

## 4. Prints novos sugeridos

1. `02-01-SUMMARY.md` → tabela "Acceptance Criteria Results", linha **AC-7: Pass (configuração) / Fail (efeito)**. É o melhor print para mostrar o UNIFY sendo honesto.
2. `02-01-SUMMARY.md` → "Issues Encountered", linha da 2ª pausa com as 3 hipóteses.
3. Saída de `supabase projects --help` mostrando só `list/create/delete` (slide 11 da arquitetura, linha 8).
4. Run [37425333689](https://github.com/dobidu/sentinela/actions/runs/37425333689): CI verde depois do restore.

---
*Handoff criado: 2026-10-06 · baseado em `02-01-SUMMARY.md`, STATE.md pós-UNIFY e runs do GitHub Actions*
