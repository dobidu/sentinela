# Handoff: Apresentação de progresso — Sentinela

**Data:** 2026-10-01
**Para:** quem vai montar a apresentação (pessoa ou agente)
**Objetivo:** apresentar tudo o que foi feito no projeto até agora, com fases e linha do tempo das ações concluídas.
**Idioma da apresentação:** português (público da disciplina).

---

## 1. Leia isto primeiro

Você não precisa de contexto anterior. Este documento traz o conteúdo, os números e a ordem sugerida dos slides. Todos os fatos abaixo foram conferidos no repositório (git log, runs do CI, arquivos `.paul/`) em 2026-10-01.

**Fontes de verdade, se precisar de detalhe:**

| Arquivo | O que tem |
|---|---|
| `.paul/PROJECT.md` | Requisitos, modelo de dados, decisões, métricas de sucesso |
| `.paul/ROADMAP.md` | Milestone v0.1 e as 5 fases |
| `.paul/STATE.md` | Posição atual, decisões acumuladas, pendências |
| `.paul/phases/01-fundacao/01-0{1,2,3}-PLAN.md` | O que cada plano se propôs a fazer |
| `.paul/phases/01-fundacao/01-0{1,2,3}-AUDIT.md` | O que a auditoria encontrou e corrigiu antes da execução |
| `.paul/phases/01-fundacao/01-0{1,2}-SUMMARY.md` | O que foi de fato entregue (01-03 ainda sem SUMMARY) |
| `README.md` | Visão pública do projeto |

**Links:**
- Repositório: https://github.com/dobidu/sentinela
- Produção: https://sentinela-sigma-eosin.vercel.app
- CI: https://github.com/dobidu/sentinela/actions/workflows/ci.yml

---

## 2. Mensagem central (1 frase)

> Em uma sessão de trabalho, a fundação do Sentinela saiu do papel: app no ar, banco geoespacial com privacidade por padrão, e um pipeline que testa, aplica migrations e só publica em produção com tudo verde — cada etapa planejada, auditada e verificada.

---

## 3. Formato sugerido

- **Duração:** 10–12 minutos, **12 slides**.
- **Tom:** técnico, direto, com evidência (números, prints do CI e da página no ar).
- **Visuais mais úteis:** linha do tempo horizontal; diagrama do fluxo push → CI → banco → app; tabela antes/depois da auditoria; print do Actions com os 3 jobs verdes; print da página de produção.

---

## 4. Linha do tempo das ações concluídas

Horários no fuso de Brasília (UTC−3), tirados do `git log` e dos runs do GitHub Actions.

| Data / hora | Marco | Evidência |
|---|---|---|
| **2026-09-10** 16:13–16:15 | Início do projeto: especificação (PROJECT, ROADMAP, STATE), estratégia git, licença MIT | commits `35d856c`, `6f83df8`, `e9e75ca` |
| **2026-09-24** ~14:50 | Retomada: roadmap do MVP definido em 5 fases; política LGPD confirmada | `.paul/ROADMAP.md` |
| 2026-09-24 15:00 | **Plano 01-01 entregue** — scaffold Next.js + testes + CI | commits `83b8da6`, `0104f41`; CI verde em 33s |
| 2026-09-24 15:26 | **Plano 01-02 entregue** — schema PostGIS + RLS + 87 testes pgTAP | commits `11df787`, `6f4ab75`; CI verde (job `database` 139s) |
| 2026-09-24 ~15:45 | Banco gerenciado criado em São Paulo; migrations aplicadas; signup fechado | projeto Supabase `sentinela`, região `sa-east-1` |
| 2026-09-24 16:01 | **Plano 01-03 aplicado** — CD do banco + app na Vercel | commits `b599cbb`, `ad5a310`; 3 jobs verdes |
| 2026-09-24 16:25–16:28 | Gate de produção comprovado: Vercel só publicou depois do CI | commit `bfa880c`; alias moveu 11s após o último check |
| 2026-09-24 18:40 | README atualizado com o que foi construído | commits `21ba47d`, `26da6bc` |
| 2026-10-01 | Dependabot abriu PR #4 com atualização da CLI do Supabase; o CI **barrou** por divergência de versão (proteção funcionando) | run `36819980874` |

**Leitura para o slide:** 1 dia de especificação (09-10) + 1 sessão de ~4h de implementação (09-24) concluíram os 3 planos da Fase 1. Isso é ~22 dias de um prazo de ~90 (início 2026-09-10).

---

## 5. Fases do projeto (milestone v0.1 MVP)

| # | Fase | Entrega | Status em 2026-10-01 |
|---|------|---------|----------------------|
| 1 | **Fundação** | App Next.js, CI/CD, schema PostGIS multi-município com RLS, deploy | **3/3 planos executados**; falta só o fechamento formal (UNIFY do 01-03 + transição de fase) |
| 2 | Relato do cidadão | PWA anônimo: foto + GPS + tipo de criadouro, fila offline | Não iniciada |
| 3 | Agregação em áreas de risco | Job PostGIS que materializa áreas de risco (< 30s para 10k relatos) | Não iniciada |
| 4 | Dashboard de vigilância | Mapa de calor, séries temporais, exportação; camada pública em grid ~100m | Não iniciada |
| 5 | Validação e entrega acadêmica | Teste em campo com agente de endemias, Lighthouse ≥ 90, artigo | Não iniciada |

Depois do MVP: v0.2 (triagem do agente + alerta por limiar) e análise de integração com e-SUS VS / SINAN.

### Fase 1 em detalhe (3 planos)

**01-01 — Scaffold + CI**
- Next.js 16 (App Router, TypeScript strict, pnpm), testes Vitest + Testing Library.
- Pipeline GitHub Actions: lint → typecheck → testes com cobertura → build.
- Prova de que o gate não é vazio: teste e erro de tipo quebrados de propósito fizeram o CI falhar.
- Supply chain: actions fixadas por SHA, Dependabot semanal.

**01-02 — Banco de dados**
- PostgreSQL 17 + PostGIS, 6 entidades (relato, área de risco, alerta, perfil, inspeção, município), todas com escopo de município.
- Privacidade no schema: token do dispositivo guardado só como hash SHA-256; foto por caminho em bucket privado, nunca URL; comentários LGPD nas colunas sensíveis.
- Integridade: trigger rejeita ponto fora do limite do município; FKs compostas impedem misturar dados de municípios; histórico de inspeção não pode ser apagado em cascata.
- Duas barreiras de acesso: privilégios mínimos (anônimo não tem nada; autenticado só lê) + RLS em todas as tabelas, restrito ao município.
- **87 testes pgTAP**. Injetar uma falha de RLS derrubou 5 deles (a suíte detecta regressão).

**01-03 — Deploy**
- Banco gerenciado no Supabase em **São Paulo**; app na Vercel com funções em **São Paulo (`gru1`)**: dados de cidadãos ficam no Brasil.
- CD: depois do CI verde em `main`, um job aplica as migrations no banco de produção, com uma única credencial restrita ao projeto.
- Vercel só promove para produção depois dos 3 checks do CI (comprovado).
- Cadastro público fechado; branch protection; secret scanning e push protection no GitHub.

---

## 6. Roteiro slide a slide

**Slide 1 — Título**
"Sentinela: relato e triagem de focos de arboviroses — Progresso da Fase 1 (Fundação)". Autor, disciplina, data 2026-10-01.

**Slide 2 — Problema e proposta**
Subnotificação de criadouros (dengue, zika, chikungunya). Proposta: canal de relato sem cadastro para o cidadão → agregação automática em áreas de risco → dashboard e alerta para a vigilância municipal. MVP = features 1 (relato), 3 (agregação) e 5 (dashboard).

**Slide 3 — Como o trabalho é conduzido**
Ciclo PAUL: **Plan → Audit → Apply → Unify**. Cada plano tem critérios de aceite verificáveis; uma auditoria (papel de engenheiro principal + compliance) revisa antes de executar; o fechamento (Unify) compara o planejado com o entregue.
Visual: ciclo com 4 setas.

**Slide 4 — Linha do tempo**
Linha horizontal com os marcos da seção 4. Destaque: 09-10 especificação → 09-24 três planos entregues → 10-01 proteção de CI em ação.

**Slide 5 — Roadmap do MVP**
Tabela das 5 fases (seção 5), Fase 1 marcada como executada.

**Slide 6 — 01-01: Fundação do código**
Stack, pipeline e o teste do "gate que falha quando deve". Print do Actions verde.

**Slide 7 — 01-02: Banco com privacidade por padrão**
Diagrama das 6 entidades com `municipality_id` em todas. Lado direito: "duas barreiras" (privilégios + RLS) e as garantias de integridade. Número grande: **87 testes pgTAP**.

**Slide 8 — 01-03: No ar**
Diagrama do fluxo:
`git push main → CI (quality + database) → Deploy database (migrations) → Vercel promove para produção`
Regiões: banco `sa-east-1`, app `gru1`. Print da página https://sentinela-sigma-eosin.vercel.app.

**Slide 9 — Auditoria antes de executar**
Tabela: por plano, quantos problemas a auditoria encontrou e corrigiu antes de qualquer código.

| Plano | Obrigatórios | Recomendados | Adiados (registrados) |
|---|---|---|---|
| 01-01 | 3 | 8 | 4 |
| 01-02 | 3 | 7 | 5 |
| 01-03 | 3 | 7 | 4 |
| **Total** | **9** | **22** | **13** |

Escolha 3 exemplos para contar, um de cada plano:
- 01-01: o typecheck quebraria num clone limpo (tipos do Next gerados em `.next/`); corrigido com `next typegen`.
- 01-02: o Supabase concede tudo ao usuário anônimo por padrão; sem a correção, toda tabela nova nasceria exposta.
- 01-03: o plano original colocaria um token com acesso à conta inteira do Supabase no CI de um repositório público; trocado por credencial restrita ao projeto.

**Slide 10 — Evidências e números**
- 3 planos executados; 9 commits de implementação em `main`; CI verde em todos os pushes para `main`.
- 87 testes pgTAP + teste de UI; 9 actions fixadas por SHA.
- Tempos de CI: `quality` ~32–42s, `database` ~125–139s, `Deploy database` ~20s.
- Gate de produção: alias da Vercel moveu 11s depois do último check.
- Proteção em ação (2026-10-01): PR do Dependabot que atualizava a CLI barrado pelo check de versão.

**Slide 11 — Pendências e riscos**
- Fechamento formal da Fase 1 (UNIFY do 01-03 + transição).
- Itens adiados com data: histórico/auditoria de status do relato (obrigatório no 1º caminho de escrita, fase 2), banco de staging para previews, política de retenção LGPD, backups (antes da validação em campo), pausa do free tier do Supabase após ~7 dias sem atividade.
- Riscos do projeto: prazo de 60h em 3 meses; sem convênio com prefeitura (validação com dados sintéticos + 1 agente de endemias).

**Slide 12 — Próximos passos**
1. Fechar a Fase 1 (UNIFY + transição).
2. Resolver os PRs abertos do Dependabot (#2, #3, #4), sincronizando a versão da CLI no workflow.
3. Fase 2 — relato do cidadão: PWA, foto com compressão, GPS, fila offline, primeiro caminho de escrita anônimo com rate limit e histórico.

---

## 7. Decisões que vale citar (com o porquê)

| Decisão | Por quê |
|---|---|
| PWA, não app nativo | Cidadão não instala nada; o atrito mata a taxa de relato |
| Cidadão anônimo, token só como hash | Minimização de dados (LGPD) e ainda permite deduplicar spam |
| Multi-município no schema desde o dia 1 | Retrofit de tenancy é caro |
| Área de risco materializada (job), não view | O alerta precisa de estado para não disparar de novo |
| Grid ~100m na camada pública | Geolocalização de quintal de terceiro é dado pessoal |
| Supabase e Vercel em São Paulo | Dados de cidadãos brasileiros ficam no Brasil |
| CD com credencial restrita ao projeto | Repositório é público; nada com acesso à conta inteira no CI |
| Produção só com CI verde | Deployment Checks da Vercel exigem os 3 checks |

---

## 8. Cuidados (o que NÃO afirmar)

- **Não dizer que a Fase 1 está "concluída/fechada".** Os 3 planos foram executados e verificados, mas o UNIFY do 01-03 e a transição de fase ainda não rodaram. Use "Fase 1 executada; fechamento formal pendente". (O `ROADMAP.md` ainda mostra 01-03 como "planning"; o `STATE.md` está correto: aplicado, aguardando UNIFY.)
- **Não apresentar nenhuma feature de usuário como pronta.** A página de produção é um placeholder; relato, agregação e dashboard são fases 2–4.
- **Não citar métricas de sucesso como atingidas** (tempo de relato < 60s, Lighthouse ≥ 90, agregação < 30s, validação em campo): ainda não medidas.
- **O CI está vermelho em um PR aberto** (Dependabot #4). Apresente como a proteção funcionando, não como "CI todo verde". `main` está verde.
- Os municípios do seed (João Pessoa, Cabedelo) são **sintéticos**, só para desenvolvimento local; o banco de produção está vazio.
- Não exibir em slide o conteúdo de `.env`, chaves ou o painel de API keys do Supabase.

---

## 9. Ativos para capturar (prints)

1. GitHub Actions: um run de `main` com `Lint, typecheck, test, build`, `Database (...)` e `Deploy database` verdes (ex.: run `36062974361`).
2. Página de produção https://sentinela-sigma-eosin.vercel.app.
3. Saída do `pnpm db:test`: "Files=2, Tests=87 … Result: PASS".
4. Vercel → Settings → Deployment Checks, com os 3 checks listados.
5. PR #4 do Dependabot mostrando o check "Check Supabase CLI version sync" barrando.

---
*Handoff criado: 2026-10-01 · baseado em git log, GitHub Actions e `.paul/` no commit `26da6bc`*
