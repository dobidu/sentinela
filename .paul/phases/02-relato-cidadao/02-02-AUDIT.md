# Enterprise Plan Audit Report

**Plan:** .paul/phases/02-relato-cidadao/02-02-PLAN.md
**Audited:** 2026-10-22
**Verdict:** Conditionally acceptable (depois das upgrades aplicadas)

---

## 1. Executive Verdict

**Condicionalmente aceitável.** O plano original tinha dois defeitos que eu não assinaria:

1. Um job **diário** usando a credencial de owner do banco (`SUPABASE_DB_URL`, a mesma do CD), contrariando a decisão de menor privilégio do 01-03.
2. A publicação, em produção, de um formulário que coleta **foto de terceiro + geolocalização precisa** sem nenhum aviso de privacidade no momento da coleta. O aviso só viria no 02-03.

Também havia dois defeitos de correção que gerariam incidentes reais:
- retentativa após queda de rede poderia criar relato duplicado ou foto órfã;
- `pnpm build` no CI (sem variáveis do Supabase) quebraria se o client fosse criado no import.

Com as upgrades abaixo, eu aprovaria o push para produção, condicionado ao gate de produção (ping 200) e ao checkpoint de credencial.

## 2. What Is Solid

- **Contrato do 02-01 intocado** (ping, submit_report, policy do bucket). A UI consome um contrato já provado por 141 testes, sem expandir a superfície de anon.
- **Verificação com escrita só no Supabase local; em produção só sondas.** Mantém o padrão do 02-01 e evita poluir dados de vigilância com relatos de teste.
- **Previews sem env do Supabase.** É uma barreira estrutural (sem credencial não há escrita), não uma convenção.
- **Uma dependência nova (`supabase-js`) e nenhuma `@supabase/ssr`.** O cidadão é anônimo e client-only, e a superfície de supply chain fica mínima.
- **EXIF removido por re-encode no cliente**, mais conferência manual com exiftool. É a medida certa para LGPD, já que o GPS da foto é dado pessoal.
- **Mensagens de erro sem código técnico, com classificação de erro retentável vs. permanente** feita a partir do contrato do servidor. Isso prepara a fila do 02-04.
- **Escopo cortado explicitamente** (mapa, PWA, protocolo, modo sol), com destino para cada item.

## 3. Enterprise Gaps Identified

1. **Credencial de owner num cron diário.** `SUPABASE_DB_URL` tem DDL e acesso total. Usá-la 365×/ano num workflow amplia a janela de exposição: qualquer edição futura do `keep-alive.yml` em main herda poder total.
2. **Coleta sem transparência (LGPD art. 9º).** O push de 02-02 publica a coleta. O link para a política e a identificação do controlador precisam existir no ato da coleta.
3. **Idempotência quebrada na borda do cliente.** O plano mandava gerar nome novo de foto em toda retentativa. Se a rede cai depois do upload, ou depois do RPC sem resposta, a retentativa sobe outra foto e cria outro relato, porque a idempotência do servidor é por token + foto. O resultado é relato duplicado e foto órfã.
4. **Build/CI sem env.** O job `quality` do CI não tem variáveis. Um client criado no import quebra o prerender e o preview. O plano dizia "erro claro se env faltar", o que, implementado como throw, derruba o CI.
5. **Falha silenciosa do keep-alive.** Houve 4 runs vermelhos (10-13 → 10-22) sem ninguém agir por 9 dias. O plano mantinha o mesmo mecanismo de notificação.
6. **Heartbeat singleton não deixa evidência.** Com upsert numa linha, depois de uma nova pausa não há como reconstruir se os beats aconteceram. É justamente a hipótese que o plano quer provar.
7. **Gate de produção ausente.** Hoje o PostgREST de produção responde 404. Um push dispararia Deploy database contra um banco degradado, e a Vercel publicaria uma UI apontando para uma API quebrada.
8. **HEIC e memória.** Fotos da galeria do iPhone (HEIC) passam no `image/*` mas falham no decode do Chrome. Bitmaps de 12 MP em Android de entrada podem derrubar a aba.
9. (Deferido) EXIF não é imposto no servidor; um cliente modificado pode subir foto com GPS.
10. (Deferido) Sem CSP/headers de segurança no app.
11. (Deferido) Workflows agendados são desativados pelo GitHub após 60 dias sem commit.

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Credencial de owner no keep-alive | AC-1, AC-2, Task 1, decisões, boundaries, novo checkpoint human-action | Role `keep_alive_writer` NOLOGIN na migration, confinado a `private.keep_alive_beat`. Login + senha + secret `SUPABASE_KEEPALIVE_DB_URL` criados pelo usuário fora do repo. pgTAP prova o confinamento. Proibido cair para o owner sem decisão |
| 2 | Coleta sem aviso LGPD | Novo AC-6b, Task 3, files_modified, scope limits, verification | `/privacidade` (1ª camada §6.9 + controlador LAVID/UFPB, contato, retenção "em definição") linkada nos 3 passos |
| 3 | Retentativa não idempotente | AC-4, AC-6, Task 2 (`submit.ts`), Task 3, verification | Rede/timeout reusa o mesmo `photoPath` + token; nome novo só em PT404/PT409; botão travado; teste de duplo toque e de queda após upload |
| 4 | Build/preview sem env | AC-4, AC-6, Task 2 (`client.ts`), Task 3, verification | `getClient()` lazy + `isSupabaseConfigured()`; UI com "Envio desativado neste ambiente de teste"; `pnpm build` sem `.env.local` na verificação |
| 5 | Push sem gate de produção | Checkpoint human-verify (passo 6), boundaries | Pré-condição: ping 200 em produção + migration list só com a nova pendente; senão, sem push |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Falha silenciosa do keep-alive | AC-2, Task 1 | Job `notify` abre ou comenta a issue "Keep-alive falhou" (label `ops`) e fecha no próximo verde; `issues: write` só nesse job |
| 2 | Heartbeat sem histórico | AC-1, Task 1 | Tabela append-only `keep_alive_beat` com prune > 90 dias na mesma transação |
| 3 | HEIC / memória em Android de entrada | AC-4, Task 2 (`photo.ts`) | Falha de decode vira o erro amigável com sugestão de câmera; `resizeWidth/Height` no decode quando suportado |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|----------------------|
| 1 | EXIF não imposto no servidor | Só o próprio cliente oficial sobe fotos; um atacante que sobe EXIF expõe a própria localização. Revisitar junto com o blur de rosto/placa (já deferido) antes de expor imagem |
| 2 | CSP e headers de segurança | O app ainda não renderiza conteúdo de terceiros nem tem sessão de staff. Entra antes da fase 4 (login) ou da validação em campo |
| 3 | Desativação de schedule após 60 dias sem commit | O repo tem commits frequentes até a entrega (~12-10). O job `notify` torna uma desativação visível pela ausência de beats. Documentado no comentário do workflow |
| 4 | Fotos órfãs quando o RPC falha de forma permanente | Já deferido no audit 02-01 (job de limpeza); a idempotência aplicada reduz o volume |

## 5. Audit & Compliance Readiness

- **Evidência defensável:** pgTAP para o confinamento do role e para a superfície de anon; histórico de beats com 90 dias; issue de incidente com link do run; SUMMARY com destino dos PRs do Dependabot.
- **Falha silenciosa:** coberta para o keep-alive (issue). O fluxo do cidadão nunca diz "Enviado" sem confirmação do servidor (AC-5/AC-6).
- **Reconstrução pós-incidente:** `keep_alive_beat` mais o histórico de Actions permitem datar a última atividade antes de uma pausa. Isso também serve de dado para o artigo.
- **Responsabilidade:** o controlador fica identificado na `/privacidade`; o restore e a criação de secret ficam explicitamente com o usuário.
- **Falharia numa auditoria real, ainda:** retenção de relatos/fotos indefinida ("em definição") e ausência de base legal explícita na política. Os dois já estão como deferred (fase 5), mas precisam fechar antes da validação em campo.

## 6. Final Release Bar

**Precisa ser verdade antes do push:**
- `ping` de produção = 200;
- pgTAP verde, incluindo o confinamento do `keep_alive_writer`;
- `pnpm build` sem env;
- `/privacidade` no ar e linkada;
- teste de rede cortada sem relato duplicado;
- env do Supabase removida do Preview na Vercel.

**Riscos se publicado como está (pós-upgrades):**
- a hipótese do keep-alive pode estar errada; só a observação de ≥ 7 dias prova;
- sem mapa, quem nega o GPS não consegue relatar até o 02-03;
- a retenção de dados está indefinida.

**Assinatura:** assino com as upgrades aplicadas e o gate de produção respeitado. Sem eles, não.

---

**Summary:** Applied 5 must-have + 3 strongly-recommended upgrades. Deferred 4 items.
**Plan status:** Updated and ready for APPLY

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*
