# Handoff: Aula — a jornada de 2026-10-01 no Sentinela

**Data:** 2026-10-06
**Para:** quem vai apresentar na disciplina de programação com agentes e loops
**Duração sugerida:** 10–12 min, 11 slides
**Idioma:** português
**Foco:** o **método** (loop PAUL com agente + humano), com os artefatos como evidência

Todos os fatos foram conferidos em 2026-10-06 no `git log`, nos runs do GitHub Actions e nos arquivos `.paul/`. Para o contexto do projeto (problema, stack, Fase 1), veja o handoff anterior: `.paul/handoffs/HANDOFF-apresentacao-2026-10-01.md`.

---

## 1. Mensagem central (1 frase)

> Uma sessão de trabalho com agente retomou o projeto depois de 7 dias parado, fechou a Fase 1, sobreviveu a um incidente de produção e entregou o primeiro caminho de escrita do sistema. Cada passo foi planejado, auditado, executado com prova e verificado em produção, e o humano decidiu nos pontos que importam.

---

## 2. O que é o loop (slide de método)

```
          ┌──────────── STATE.md / ROADMAP / PROJECT (memória externa) ────────────┐
          ▼                                                                        │
  PLAN ──▶ AUDIT ──▶ APPLY ──────────────────────────▶ UNIFY ──────────────────────┘
  ACs     revisão     Execute → Qualify por task          planejado × entregue
  Given/  adversarial checkpoints humanos                 SUMMARY, decisões,
  When/   aplica      classificação de falha              pendências, transição
  Then    correções   (Intent / Spec / Code)              de fase
```

- **Memória fora do modelo:** `STATE.md` (posição, decisões, pendências), `ROADMAP.md`, `PROJECT.md`, `paul.toml` + `ledger.toml` (trilha de ações). Depois de 7 dias sem tocar no projeto, `/paul:resume` reconstruiu o contexto e sugeriu **uma única** próxima ação.
- **Plano é contrato:** critérios de aceite Given/When/Then; cada task tem `files`, `action`, `verify` e `done`, ligados a um AC; `boundaries` (o que não pode mudar).
- **Audit antes de executar:** o agente assume o papel de engenheiro principal + compliance, classifica achados (obrigatório / recomendado / adiável) e **reescreve o plano** antes de qualquer código.
- **Execute/Qualify:** cada task termina com o `verify` rodado de novo e o resultado comparado ao AC. Status honesto: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED.
- **Humano nos portões:** decisões de arquitetura, aprovação de commit/push (`auto_commit: false`), checkpoints de verificação e exceções de boundary.

---

## 3. Linha do tempo da jornada (2026-10-01, horário de Brasília)

| Hora | Passo do loop | O que aconteceu | Evidência |
|---|---|---|---|
| ~15:00 | **RESUME** | Projeto parado desde 09-24. O agente leu STATE + handoff, achou o ponto (01-03 aplicado, falta UNIFY) e propôs uma ação | `.paul/STATE.md` |
| 15:23 | **UNIFY 01-03 + transição** | SUMMARY com 6/6 ACs, desvios registrados; Fase 1 fechada; PROJECT/ROADMAP atualizados | `185b85d`, `01-03-SUMMARY.md` |
| 15:25 | Incidente | `Deploy database` falhou: o Supabase free tier **pausou** o banco após 7 dias sem atividade | run `36906443389` |
| ~15:30 | Portão de segurança | O agente tentou reativar o projeto pela API; o **classificador de permissões bloqueou** ("modificar recurso compartilhado"). O agente não contornou: passou o comando para o humano rodar | sessão |
| 15:33 | Recuperação | Humano reativou; o agente rodou de novo o job que falhou → verde | run `36906443389` (re-run) |
| 15:35 | Registro | Incidente e keep-alive antecipado (Fase 5 → Fase 2) no STATE; varredura de credenciais no histórico do git antes de seguir | `e1a17bd` |
| ~15:45 | **PLAN 02-01** | Fase 2 dividida em 3 planos; **4 decisões** perguntadas ao humano (divisão, upload da foto, previews, municípios) | `02-01-PLAN.md` |
| ~16:00 | **AUDIT 02-01** | Veredito "aceitável com condições": **4 obrigatórios + 7 recomendados aplicados**, 6 adiados | `02-01-AUDIT.md` |
| ~16:10 | **APPLY** | Docker indisponível → status **BLOCKED** honesto; humano ligou; migration + 139 testes; **injeção de falha** provou os testes | sessão |
| ~16:20 | Boundary | Novo `unique` quebrou um teste num arquivo protegido → o agente **parou e perguntou** antes de editar | sessão |
| 16:50 | Deploy | Commits do plano e da feature; o CD aplicou exatamente 1 migration em produção | `9cc581b`, `8a7b726`, run `36917305271` |
| 16:55 | **Checkpoint** | Sondas em produção **sem escrever dados**: 404/422 corretos, anon bloqueado (401). Mas o **advisor de produção** acusou 6 funções expostas | sessão |
| 16:57 | Classificação | Falha classificada como **Spec** (não Code): o plano supôs que o advisor local = produção. **Plano corrigido antes do código** | `02-01-PLAN.md` (checkpoint-fix) |
| 16:59 | Fix | Migration nova (forward-fix): helpers de policy no schema `private`; só 2 exceções aceitas e documentadas | `a286155`, run `36918302223` |
| 10-04 | Operação | Keep-alive agendado rodou sozinho → HTTP 200 | run `37210625181` |
| 10-06 | **Achado novo** | O projeto está **pausado de novo** apesar do keep-alive verde (ver §8) | `supabase projects list` |

---

## 4. Artefatos gerados na jornada

**Processo (`.paul/`):**

| Artefato | Papel no loop |
|---|---|
| `01-03-SUMMARY.md` | Fecha o loop do deploy: ACs, desvios, pendências |
| `02-01-PLAN.md` | Contrato: 7 ACs originais + 4 do audit + 1 revisão no checkpoint; 4 tasks + checkpoint |
| `02-01-AUDIT.md` | Relatório do audit: gaps, correções aplicadas, adiados com justificativa |
| `STATE.md`, `ROADMAP.md`, `PROJECT.md` | Memória: decisões datadas, pendências com prazo, posição do loop |
| `paul.toml`, `ledger.toml` | Trilha das ações (plan/apply/unify/transition com timestamp) |

**Produto (código):**

| Artefato | O que entrega |
|---|---|
| `supabase/migrations/20261001185320_report_write_path.sql` | João Pessoa + Cabedelo (malha IBGE), histórico de status append-only, bucket privado de fotos com teto, RPC `submit_report` |
| `supabase/migrations/20261001195629_private_policy_helpers.sql` | Forward-fix do checkpoint: helpers fora da API pública |
| `supabase/tests/database/report_write.test.sql` | 52 testes do caminho de escrita |
| `.github/workflows/keep-alive.yml` | Ping a cada 3 dias, sem secrets |
| `.github/dependabot.yml` | Para de propor bump da CLI que quebrava o CI (PR #4 fechado; o grupo novo #5 está verde) |
| `README.md` | Contrato de erro (tabela código → HTTP → retentável), keep-alive, exceções do advisor |

**Números da jornada:**

| | Antes (09-24) | Depois (10-01) |
|---|---|---|
| Testes pgTAP | 87 | **141** |
| Migrations | 2 | **4** |
| Funções que o anônimo executa | 0 | **3** (lista fechada, testada por assinatura) |
| Municípios em produção | 0 | **2** |
| Commits em `main` | — | 5 (todos com CI verde) |

---

## 5. Roteiro slide a slide

**Slide 1 — Título**
"Sentinela: uma jornada no loop PAUL — retomada, incidente e primeiro caminho de escrita". Data da jornada: 2026-10-01.

**Slide 2 — Onde estávamos**
Fase 1 executada em 09-24, sem fechamento formal; projeto parado 7 dias. Pergunta da aula: *como um agente retoma um projeto sem "lembrar" de nada?* Resposta: memória em arquivos (§2).

**Slide 3 — O loop**
Diagrama da §2. Destacar os 3 tipos de portão humano: decisão, aprovação de push e checkpoint.

**Slide 4 — Linha do tempo**
Versão enxuta da §3: Resume → Unify → Incidente → Plan → Audit → Apply → Checkpoint → Fix.

**Slide 5 — Incidente e segurança**
O banco pausou; o agente tentou reativar; **o classificador barrou**; o agente não contornou e entregou o comando ao humano. Logo depois, antes de planejar, rodou a varredura de credenciais por pedido do humano. Ponto da aula: o agente opera *dentro* de limites, e quem age em recurso externo é o humano.

**Slide 6 — Planejar com o humano**
As 4 decisões perguntadas (com a recomendação do agente) e as respostas: Storage direto + RPC; previews sem escrita; **João Pessoa + Cabedelo** (o humano escolheu diferente da recomendação, que era só JP).

**Slide 7 — O audit muda o plano (o slide mais importante)**
Antes/depois, com 3 exemplos:
- **Reenvio idempotente:** a fila offline perderia relatos quando a resposta se perde na rede → mesmo token + mesma foto devolve o mesmo id.
- **Upload sem teto:** a chave pública permitiria encher o bucket gratuito em minutos → 300/h e 3000 no total, recusa por padrão.
- **Erro sem HTTP útil:** tudo virava 400 → códigos `PT429/404/409/422`, com tabela "retentável?" para o cliente.
Placar: 4 obrigatórios + 7 recomendados aplicados, 6 adiados com justificativa.

**Slide 8 — Executar com prova**
- Execute/Qualify por task; o **BLOCKED** do Docker reportado sem "fingir".
- **Injeção de falha:** afrouxar o limite e abrir leitura do bucket → exatamente 4 testes caem → reverte. Teste que não falha quando deve não vale nada.
- **Boundary:** arquivo protegido → o agente perguntou antes de editar.

**Slide 9 — Checkpoint e classificação de falha**
Produção ≠ local: o advisor da nuvem tinha regras que o CLI do CI não tinha. A falha foi classificada como **Spec**, então o plano foi corrigido **antes** do código e saiu uma migration de forward-fix. Resultado: só 2 exceções, documentadas. Mostrar as sondas sem escrita (§6).

**Slide 10 — O loop continua: achado de 10-06**
O keep-alive rodou verde em 10-04, mas o banco pausou de novo. É honestidade de engenharia: a verificação daquele dia não prova que funciona com o tempo. Isso vira item do próximo UNIFY/PLAN, não um "funcionou".

**Slide 11 — Próximos passos**
1. Reativar o banco e investigar o keep-alive (hipóteses na §8).
2. UNIFY do 02-01 (ainda aberto).
3. 02-02: formulário de relato (foto comprimida, GPS, ≤ 3 telas); 02-03: PWA + fila offline.

---

## 6. Demo ao vivo (opcional, ~1 min) — só se o banco estiver ativo

**Antes da aula:** reativar o projeto (dashboard do Supabase → `sentinela` → Restore). Leva alguns minutos.

```bash
U=$(gh api repos/dobidu/sentinela/actions/variables/SUPABASE_URL -q .value)
K=$(gh api repos/dobidu/sentinela/actions/variables/SUPABASE_PUBLISHABLE_KEY -q .value)
rpc() { curl -s -w '  HTTP %{http_code}\n' -X POST "$U/rest/v1/rpc/$1" -H "apikey: $K" -H 'Content-Type: application/json' -d "$2"; }

rpc resolve_municipality '{"p_lon":-34.8641,"p_lat":-7.1195}'        # 200 → João Pessoa
rpc submit_report '{"p_reporter_token":"7d3f2a10-1c2b-4a5e-9f00-000000000abc","p_lon":-34.60,"p_lat":-7.10,"p_breeding_site_type":"pneu","p_photo_path":"7d3f2a10-1c2b-4a5e-9f00-0000000000ff.webp"}'   # 422 oceano
rpc submit_report '{"p_reporter_token":"7d3f2a10-1c2b-4a5e-9f00-000000000abc","p_lon":-34.8641,"p_lat":-7.1195,"p_breeding_site_type":"pneu","p_photo_path":"7d3f2a10-1c2b-4a5e-9f00-0000000000ff.webp"}' # 404 foto inexistente
curl -s -o /dev/null -w 'tabela report: HTTP %{http_code}\n' "$U/rest/v1/report?select=id" -H "apikey: $K"   # 401
```

Nenhuma dessas chamadas grava dados. **Não rode** `submit_report` com foto real em produção: o histórico é append-only e o relato não pode ser apagado.

Plano B sem banco: mostrar o run [36918302223](https://github.com/dobidu/sentinela/actions/runs/36918302223) (3 jobs verdes) e o `02-01-AUDIT.md`.

---

## 7. Decisões que vale citar (com o porquê)

| Decisão | Por quê |
|---|---|
| Foto direto no Storage + RPC, sem chave secreta na Vercel | Mantém o menor privilégio do 01-03; o banco valida tudo |
| Município resolvido pelo ponto, nunca pelo cliente | Impede escrita em outro município por construção |
| Histórico de status append-only, com origem (`citizen/staff/system`) | Trilha defensável numa auditoria, até contra o service_role |
| Helpers de policy em schema `private` | Só o contrato público fica na API |
| Forward-fix, nunca editar migration aplicada | Produção e repositório não divergem |
| Nenhum relato de teste em produção | Não poluir uma trilha que não pode ser apagada |

---

## 8. Cuidados (o que NÃO afirmar)

- **Não dizer que a Fase 2 está pronta.** 02-01 foi aplicado e verificado, mas o **UNIFY ainda não rodou**; 02-02 e 02-03 não começaram. Não existe tela de relato: a página de produção ainda é placeholder.
- **Não dizer que o keep-alive resolveu a pausa.** Fato: o run de 10-04 recebeu HTTP 200 e o projeto está `INACTIVE` em 10-06. Hipóteses, **não verificadas**: (a) o critério de atividade do free tier não conta chamadas RPC que não tocam tabela (depois do fix, `ping` faz só `select 1`); (b) a janela de pausa é menor que 7 dias; (c) o intervalo de 3 dias é longo demais. Fale delas como hipóteses.
- **Dependabot:** o fix funcionou (PR #4 fechado, grupo novo #5 verde), mas há PRs major abertos (#3 TypeScript 6, #6 @types/node 26) sem avaliação.
- O roll da secret key `default` do Supabase segue pendente (4 caracteres expostos no histórico; key não usada).
- Não exibir `.env`, chaves ou o painel de API keys. A publishable key é pública, mas não precisa aparecer em slide.
- Os números de testes (141) são do CI de 10-01; não houve mudança de código desde então.

---

## 9. Ativos para capturar (prints)

1. Trecho do `02-01-AUDIT.md`: tabela "Must-Have" (slide 7).
2. Bloco `<!-- audit-added -->` / `<!-- checkpoint-fix -->` dentro do `02-01-PLAN.md`, mostrando o plano mudando antes do código.
3. Run [36906443389](https://github.com/dobidu/sentinela/actions/runs/36906443389): `Deploy database` vermelho (incidente) e depois verde no re-run.
4. Run [36918302223](https://github.com/dobidu/sentinela/actions/runs/36918302223): 3 jobs verdes com a migration de fix.
5. Saída do `pnpm db:test`: `Files=3, Tests=141 … Result: PASS`.
6. Aba Actions → Keep-alive: run agendado de 10-04 verde (slide 10, junto com o status `INACTIVE`).

---
*Handoff criado: 2026-10-06 · baseado em git log (`26da6bc..a286155`), GitHub Actions e `.paul/`*
