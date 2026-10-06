# Handoff: Arquitetura do Sentinela — planejada × realizada, e as lacunas de planejamento

**Data:** 2026-10-06
**Para:** quem vai apresentar (disciplina de programação com agentes e loops)
**Duração:** 20 min, 15 slides (~1min20 por slide)
**Idioma:** português
**Foco:** comparar a arquitetura **planejada** com a **realizada** e mostrar **onde o planejamento falhou**: o que os audits pegaram, o que escapou deles e o que continua sem plano.

Fatos conferidos em 2026-10-06 em `.paul/` (PROJECT, ROADMAP, STATE, PLAN/AUDIT/SUMMARY de 01-01 a 02-01), `git log` e GitHub Actions. Para o método (loop PAUL), veja `HANDOFF-aula-2026-10-06.md`.

---

## 1. Mensagem central

> A arquitetura saiu como planejada no esqueleto (PWA + Postgres/PostGIS gerenciado + CI/CD), mas quase todo o **detalhe de segurança e operação** foi decidido **depois** do plano inicial: 42 correções vieram dos audits antes do código e 7 problemas escaparam até a execução ou a produção. As lacunas mais caras não estavam nas features. Estavam nos **padrões das plataformas**, no **tempo** (o que só falha dias depois) e na **diferença entre local e produção**.

---

## 2. Arquitetura planejada (PROJECT.md, 2026-09-10 → 09-24)

```
 Cidadão (anônimo)        Agente / Vigilância (login)
        │                          │
        ▼                          ▼
 ┌──────────────────────────────────────────────┐
 │ PWA Next.js (mobile-first)                   │
 │  • foto c/ compressão client-side • GPS      │
 │  • reporter_token no dispositivo             │
 │  • fila offline (service worker)             │
 │  • dashboard: mapa de calor, séries, CSV     │
 └───────────────┬──────────────────────────────┘
                 │ Vercel
                 ▼
 ┌──────────────────────────────────────────────┐
 │ Supabase gerenciado                          │
 │  Auth (roles agent/surveillance/admin)       │
 │  Postgres + PostGIS, multi-município         │
 │   6 entidades: report, risk_area, alert,     │
 │   profile, inspection, municipality          │
 │  Storage: bucket privado + URL assinada      │
 │  Job de agregação → risk_area materializada  │
 │  Camada pública generalizada (grid ~100m)    │
 └──────────────────────────────────────────────┘
 CI/CD GitHub Actions desde o início
```

**Decisões de base (09-10):** PWA em vez de app nativo; cidadão anônimo com token do dispositivo; multi-município no schema desde o dia 1; `risk_area` materializada (o alerta precisa de estado); grid ~100m na camada pública (LGPD); e-SUS/SINAN fora do MVP.

**O que o plano inicial não dizia:** como o anônimo escreveria no banco, quem roda os jobs privilegiados, como se protege a chave pública, como o deploy do app se coordena com o do banco, e como o free tier se comporta.

---

## 3. Arquitetura realizada (2026-10-06)

```
 Navegador ── publishable key (pública por design) ──┐
                                                     │
 ┌───────────────────────────┐        ┌──────────────▼─────────────────────────────┐
 │ Vercel gru1 (São Paulo)   │        │ Supabase sa-east-1 (São Paulo)  [free]      │
 │ Next.js 16 — placeholder  │        │                                             │
 │ só env NEXT_PUBLIC_*      │        │ API pública (PostgREST /rpc):               │
 │ produção só com CI verde  │        │   submit_report       (SECURITY DEFINER)    │
 │ (Deployment Checks)       │        │   resolve_municipality(SECURITY DEFINER)    │
 └───────────────────────────┘        │   ping                (INVOKER)             │
                                      │ Storage report-photos: anon só INSERT,      │
 ┌───────────────────────────┐        │   nome UUID v4, 2 MB, teto 300/h e 3000     │
 │ GitHub Actions            │        │ schema private: helpers de policy           │
 │ quality ─┐                │ db URL │ public: 7 tabelas, RLS em todas,            │
 │ database ┼─▶ deploy-db ───┼───────▶│   tenancy por FK composta, trigger espacial,│
 │ (pgTAP,  │   (só main,   │escopo  │   report_status_event append-only           │
 │  lint,   │    environment│projeto │ JP + Cabedelo (malha IBGE)                  │
 │  advisor,│    production)│        │ anon: 0 tabelas, 3 funções                  │
 │  tipos)  │               │        └─────────────────────────────────────────────┘
 │ keep-alive (cron 3 dias)  │
 └───────────────────────────┘
```

### Planejado × realizado, por componente

| Componente | Planejado | Realizado | Status |
|---|---|---|---|
| Hosting | Vercel + Supabase gerenciado | Vercel `gru1` + Supabase `sa-east-1` (dados no Brasil) | ✅ (região foi decisão posterior) |
| CI/CD | "desde o início" | 3 jobs + keep-alive; actions por SHA; branch protection; produção só com CI verde | ✅ e mais rígido que o plano |
| Modelo de dados | 6 entidades | 6 + `report_status_event`; `User`→`profile`; `photo_url`→`photo_path`; token só como hash | ✅ com refinamentos |
| Isolamento por município | "escopo de município em toda tabela" | FK composta `(id, municipality_id)`, RLS por município, testado | ✅ |
| Escrita do cidadão | não especificada | Storage direto + RPC `submit_report` (idempotente, rate limit, contrato de erro HTTP) | ✅ no banco; **sem UI** |
| PWA / offline / compressão | sim | — | ⏳ 02-02/02-03 |
| Auth de staff | Supabase Auth + roles | roles e RLS prontos; signup fechado; **sem fluxo de criação de staff** | ⚠️ parcial |
| Fotos para staff (URL assinada) | sim | bucket sem leitura nenhuma | ⏳ fase 4 |
| Agregação (`risk_area`) | job | tabela pronta; **job e agendador indefinidos** | ⏳ fase 3 |
| Camada pública grid ~100m | sim | não desenhada | ⏳ fase 4 |
| Dashboard | sim | — | ⏳ fase 4 |
| Operação no free tier | não considerada | keep-alive criado depois do incidente; **projeto pausou de novo em 10-06** | ❌ aberto |

---

## 4. Decisões de arquitetura que emergiram depois do plano inicial

Nenhuma destas estava no PROJECT.md de 09-10. Todas vieram de audit, de pergunta ao humano ou de incidente.

| Decisão | Origem | Por quê |
|---|---|---|
| Duas barreiras: privilégios mínimos **e** RLS | Audit 01-02 | O Supabase concede tudo ao `anon` por padrão; com só RLS, um erro de policy expõe tudo |
| Tenancy por FK composta, não por trigger | Audit 01-02 | Garantia declarativa e testável contra misturar municípios |
| Trigger espacial fail-closed, SECURITY DEFINER | Audit 01-02 | A versão inicial aceitaria ponto quando o município não fosse visível ao role |
| CD com credencial escopada ao projeto; job de deploy sem dependência npm | Audit 01-03 | O plano punha um token com acesso à **conta inteira** no CI de um repo público |
| Produção só com CI verde | Audit 01-03 | A Git integration da Vercel publicaria commit com CI vermelho |
| Expand/contract + forward-fix | Audit 01-03 | App e banco publicam **em paralelo**: não há orquestração de release |
| Escrita anônima só por RPC, não por policy de INSERT | Plano 02-01 | Validação, hash e município resolvidos no servidor |
| Foto via Storage direto (sem rota de servidor) | Decisão do humano (02-01) | Nenhuma chave secreta na Vercel |
| Previews sem escrita (em vez de staging) | Decisão do humano (02-01) | Custo: um segundo projeto free também pausa |
| Reenvio idempotente, contrato de erro HTTP, tetos de upload | Audit 02-01 | Fila offline (02-03) e chave pública exigem isso **no banco** |
| Schema `private` para helpers de policy | Checkpoint 02-01 (produção) | Advisor de produção (lints 0028/0029) |

---

## 5. As lacunas de planejamento (núcleo da apresentação)

### 5.1 Pegas pelo audit, antes de qualquer código

| Plano | Obrigatórias | Recomendadas | Adiadas |
|---|---|---|---|
| 01-01 scaffold + CI | 3 | 8 | 4 |
| 01-02 schema + RLS | 3 | 7 | 5 |
| 01-03 deploy | 3 | 7 | 4 |
| 02-01 escrita anônima | 4 | 7 | 6 |
| **Total** | **13** | **29** | **19** |

Os mesmos padrões se repetem:

| Padrão de lacuna | Exemplos |
|---|---|
| **Padrões inseguros da plataforma** | `anon` com todos os grants (Supabase); signup aberto; tags mutáveis de actions; credenciais persistidas no checkout |
| **Fail-open** | trigger espacial aceitando ponto sem município visível |
| **Destruição de histórico** | FK em cascata apagaria inspeções |
| **Privilégio amplo demais** | token de conta no CI; job de deploy rodando código npm com secret |
| **Sistemas distribuídos** | reenvio não idempotente; corrida no rate limit; erro sem código HTTP utilizável |
| **Abuso e custo** | upload anônimo sem teto enche o free tier |
| **Reprodutibilidade** | typecheck dependia de `.next/`, ou seja, quebraria num clone limpo |

**Leitura:** o plano funcional (o *quê*) estava razoável. O que faltava era o modelo de ameaça e o modelo de falha (o *e se*). O audit fez esse papel sistematicamente.

### 5.2 Escaparam do audit e apareceram na execução ou em produção

| # | Lacuna | Como apareceu | Custo | Raiz |
|---|---|---|---|---|
| 1 | **Pausa do free tier** | Audit 01-03 **adiou** o keep-alive para a fase 5 ("só importa na validação em campo"). Em 10-01, o `Deploy database` falhou com o banco pausado | Incidente + restore manual | Adiamento por **fase** de um risco que é de **tempo** |
| 2 | **Keep-alive verificado só no dia** | Run agendado de 10-04 recebeu HTTP 200; projeto **INACTIVE** em 10-06 | Produção fora agora | Verificação pontual não prova propriedade temporal (causa ainda não investigada) |
| 3 | **Advisor local ≠ produção** | CLI 2.117 do CI sem os lints 0028/0029; produção acusou 6 funções expostas | Spec fix + migration extra | Paridade de ambiente assumida |
| 4 | **`config push` enviaria a config local inteira** | Descoberto no APPLY 01-03 (`site_url` 127.0.0.1 iria para produção) | Desvio: PATCH pontual na Management API | Ferramenta com efeito maior que o pretendido |
| 5 | **Dois controles que se chocam** | Dependabot subiu a CLI no `package.json`; o check de sincronia (criado no 01-03) barrou o PR | PRs vermelhos até o 02-01 | Controle novo sem ajustar o que interage com ele |
| 6 | **Constraint nova × teste protegido** | `unique (photo_path)` quebrou fixture em `schema.test.sql` (boundary) | Pausa para decisão humana | Boundaries congelam arquivos que a evolução do schema precisa tocar |
| 7 | **Comportamento oculto da plataforma** | `storage.protect_delete` bloqueia DELETE direto; malha IBGE em SIRGAS 2000, não WGS 84 | Ajuste de teste; nota na migration | Documentação da plataforma não lida no plano |

Também fora do plano: Docker como pré-requisito local (o APPLY ficou BLOCKED até ligar) e a primeira promoção da Vercel sem checks configurados (precisou de commit vazio para provar o gate).

### 5.3 Ainda sem plano (riscos arquiteturais em aberto)

| Lacuna | Por que é arquitetural | Quando morde |
|---|---|---|
| **Quem executa trabalho privilegiado?** Agregação, limpeza de fotos órfãs, alertas e URL assinada precisam de privilégio, e a regra hoje é "nenhuma chave secreta em lugar nenhum" | Tensão direta entre menor privilégio e jobs. Caminho provável: `pg_cron` dentro do banco, a confirmar no free tier | Fase 3 |
| **Viabilidade do free tier** | Pausa, 1 GB de storage, sem backup/PITR. A validação em campo depende de o banco estar de pé | Fase 5 (e já agora) |
| **Grid ~100m da camada pública** | View, RPC ou tabela materializada? Afeta LGPD e performance | Fase 4 |
| **Provisionamento de staff** | Signup fechado, mas não existe ferramenta para o admin criar agentes | Fase 4 (antes, na validação) |
| **Ambiente de staging** | Previews sem escrita resolvem o 02-02, mas não testam escrita antes de produção | Quando houver escrita na UI |
| **Retenção LGPD + backups** | Sem política de expurgo de relatos e fotos | Antes da validação em campo |
| **Abuso** | Sem rate limit por IP (IP é dado pessoal) e sem alerta quando os tetos disparam | Ao abrir para o público |
| **Máquina de estados do status** | Histórico registra qualquer transição; nada impede `resolved → pending` | v0.2 (triagem) |
| **Testes E2E e SAST** | Adiados desde o 01-01 | Fase 2 (fluxo de relato) |

O STATE.md tem hoje **23 pendências abertas**, cada uma com origem e prazo de revisão.

---

## 6. Roteiro slide a slide (20 min)

| # | Slide | Tempo | Conteúdo |
|---|---|---|---|
| 1 | Título | 0:30 | "Arquitetura do Sentinela: planejada × realizada — e o que o plano não viu" |
| 2 | Problema e restrições | 1:00 | Subnotificação de arboviroses; anônimo, offline, LGPD, 60h, free tier |
| 3 | Arquitetura planejada | 1:30 | Diagrama da §2 + decisões de base |
| 4 | O que o plano não dizia | 1:00 | As 5 perguntas sem resposta do fim da §2 |
| 5 | Arquitetura realizada | 2:00 | Diagrama da §3 |
| 6 | Planejado × realizado | 1:30 | Tabela da §3 (cores ✅ ⏳ ⚠️ ❌) |
| 7 | Decisões que emergiram | 1:30 | Tabela da §4: destacar que 8 de 11 vieram de audit ou incidente |
| 8 | Caminho de escrita em detalhe | 1:30 | Sequência: upload → `submit_report` → validação → município → foto → rate limit → insert → evento; tabela de erros PT422/404/409/429 |
| 9 | Lacunas pegas pelo audit | 1:30 | Placar 13/29/19 + tabela de padrões (§5.1) |
| 10 | Exemplo: o token de conta inteira | 1:00 | 01-03: o plano punha no CI de repo público um token com acesso a todos os projetos Supabase da conta; virou credencial escopada ao projeto |
| 11 | Lacunas que escaparam | 2:00 | Tabela da §5.2, foco nos itens 1–3 |
| 12 | Caso: pausa do free tier (duas vezes) | 1:30 | Adiado por fase → incidente → keep-alive → pausou de novo. Lição: risco de **tempo** não se adia por **fase**, e verificação pontual não prova comportamento contínuo |
| 13 | Caso: local ≠ produção | 1:00 | Advisor do CI × advisor da nuvem; corrigido o plano antes do código; sondas em produção sem gravar dados |
| 14 | O que ainda não tem plano | 1:30 | Tabela da §5.3, destacando "quem executa trabalho privilegiado?" |
| 15 | Lições para planejar com agentes | 1:00 | §7 |

---

## 7. Lições (slide final)

1. **Plano funcional não é plano de arquitetura.** O que faltou foi modelo de ameaça e modelo de falha; um audit adversarial explícito supriu isso de forma consistente (42 correções antes do código).
2. **Os padrões das plataformas são a maior fonte de lacuna.** Supabase, GitHub e Vercel vieram com padrões inseguros ou com comportamentos não documentados no plano.
3. **Adiar por fase só serve para risco de feature.** Risco que depende do tempo (pausa, expiração, cota) precisa de plano desde o dia em que o recurso existe.
4. **Verificação pontual não prova propriedade temporal.** O keep-alive passou no dia e falhou na semana. O que depende do tempo precisa de monitoramento contínuo.
5. **Paridade local/produção é uma suposição; teste-a.** Sondas sem escrita em produção pegaram o que o CI não pegava.
6. **Controles interagem.** Um check novo (sincronia da CLI) quebrou outro processo (Dependabot). Ao criar controle, revise quem ele afeta.
7. **Pendência boa tem origem e prazo.** As 23 abertas estão rastreáveis; a que falhou (keep-alive) tinha o prazo errado, não a falta de registro.

---

## 8. Cuidados (o que NÃO afirmar)

- **Produção está pausada agora** (projeto `INACTIVE` desde antes de 10-06). Não prometa demo ao vivo sem antes restaurar no dashboard do Supabase.
- **A causa da segunda pausa não foi investigada.** Hipóteses: o `ping` virou `select 1` sem tocar tabela e pode não contar como atividade; a janela é menor que 7 dias; o intervalo de 3 dias é longo. Apresente como hipóteses.
- **Não há UI de relato.** A arquitetura de escrita existe e está testada no banco; o app em produção ainda é placeholder.
- **A Fase 2 está em 1 de 3 planos**, e o 02-01 ainda não passou pelo UNIFY.
- Os números de audit (13/29/19) somam os 4 planos; "42 correções" = obrigatórias + recomendadas.
- `pg_cron` como solução para jobs privilegiados é **caminho provável, não decisão**.
- Não mostrar chaves, `.env` nem o painel de API keys.

---

## 9. Ativos para capturar

1. `.paul/PROJECT.md` → seções "Tech Stack" e "Key Decisions" (planejado).
2. `supabase/migrations/` (4 arquivos) e o cabeçalho de `20261001185320_report_write_path.sql` com o contrato de erro.
3. `.paul/phases/01-fundacao/01-03-AUDIT.md` → tabela Must-Have (exemplo do token de conta).
4. `.paul/phases/02-relato-cidadao/02-01-PLAN.md` → bloco `<!-- checkpoint-fix -->`.
5. GitHub Actions: run [36906443389](https://github.com/dobidu/sentinela/actions/runs/36906443389) (deploy falhando no banco pausado) e o keep-alive agendado verde de 10-04 ([37210625181](https://github.com/dobidu/sentinela/actions/runs/37210625181)).
6. `.paul/STATE.md` → tabela "Deferred Issues" (23 linhas, com origem e prazo).

---
*Handoff criado: 2026-10-06 · baseado em `.paul/` (PROJECT, ROADMAP, STATE, PLAN/AUDIT/SUMMARY 01-01 a 02-01), git log até `a286155` e GitHub Actions*
