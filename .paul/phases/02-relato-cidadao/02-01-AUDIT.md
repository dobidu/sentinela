# Enterprise Plan Audit Report

**Plan:** .paul/phases/02-relato-cidadao/02-01-PLAN.md
**Audited:** 2026-10-01
**Verdict:** conditionally acceptable (aceitável depois das correções aplicadas)

---

## 1. Executive Verdict

**Conditionally acceptable.** O desenho geral está certo: escrita só por RPC SECURITY DEFINER, município resolvido no servidor, hash calculado no servidor, allowlist de anon, bucket privado. Na versão original, porém, eu não aprovaria para produção, por quatro motivos:

1. **Retry não é idempotente.** A fila offline (02-03) promete 100% de entrega. Com o plano original, se a resposta de um `submit_report` bem-sucedido se perde na rede, o reenvio recebe "foto já usada" (erro permanente) e o cliente não tem como saber que o relato existe. O resultado é a fila descartar um relato entregue ou ficar retentando para sempre.
2. **O upload anônimo não tem limite nenhum.** O rate limit protege só a RPC. Qualquer um com a publishable key, que é pública, enche o bucket do free tier (1 GB) com arquivos de 2 MB em minutos. As fotos órfãs nunca são limpas.
3. **O contrato de erro não serve para o cliente.** Os códigos `P0429`/`P0404` caem todos em HTTP 400 no PostgREST, então o cliente não distingue o que é retentável do que é permanente, e essa é exatamente a decisão de que a fila offline precisa.
4. **O rate limit é furável por concorrência.** É um read-then-insert sem serialização: N chamadas paralelas do mesmo token passam juntas.

Com as correções aplicadas, eu aprovaria.

## 2. What Is Solid

- **`municipality_id` nunca vem do cliente**, e o trigger de boundary do 01-02 continua como segunda barreira. Isso fecha a escrita cross-tenant por construção.
- **Hash do token no servidor + token em parâmetro `uuid`**: o token nunca é persistido e o formato é validado pelo tipo.
- **A allowlist de anon é um teste de igualdade de conjunto**, não "contém". Qualquer função exposta por acidente quebra o CI.
- **Nenhum relato de teste em produção**, e a prova fica no pgTAP. Isso evita sujar a trilha de auditoria append-only com dado sintético.
- **Keep-alive sem secrets, sem checkout e com `permissions: {}`**: superfície mínima para um cron num repo público.
- **GeoJSON embutido na migration**, sem rede no deploy: deploy reprodutível e auditável (com fonte e data).

## 3. Enterprise Gaps Identified

1. Retry não idempotente: conflito com o requisito de 100% de entrega offline.
2. Upload anônimo sem teto: DoS de storage e esgotamento do free tier; órfãs acumulam.
3. SQLSTATE sem mapeamento HTTP: o cliente não classifica a recusa.
4. Rate limit sujeito a corrida (sem lock).
5. Trilha de status fraca: `changed_by` null não distingue cidadão de service_role; UPDATE sem mudança gera ruído; a trilha é mutável por service_role, então não é defensável numa auditoria.
6. Premissa implícita de que o owner das funções lê `storage.objects` e passa pelo RLS de `report`. Se a plataforma mudar, o erro só aparece em produção.
7. O plano não exercitava nenhum caminho de `submit_report` em produção. Diferenças entre o Supabase local e o hospedado (versão do schema de storage, roles) só apareceriam no 02-02, com usuário real.
8. A allowlist por nome não pega overload com outra assinatura.
9. Token aceitava qualquer UUID, inclusive o nil, que é compartilhável e furaria a semântica de "1 token por dispositivo".
10. Ordem lon/lat e valores não finitos não estavam especificados: fonte clássica de bug geoespacial silencioso.
11. Na falha, o keep-alive não diz o que fazer, e a pausa já aconteceu uma vez.
12. O teto global por município (200/h) pode ser esgotado por um atacante e bloquear cidadãos legítimos. É uma troca de disponibilidade aceita, mas tem que estar explícita.

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Retry não idempotente | AC-2b (novo), Task 1, Task 2 | Mesmo token + mesma foto → devolve o id existente, sem evento e sem consumir limite; token diferente → PT409; corrida resolvida pelo unique + captura de `unique_violation` |
| 2 | Upload anônimo sem teto | AC-4b (novo), AC-5, Task 1, Task 2 | `can_upload_report_photo()` SECURITY DEFINER na policy de INSERT: < 300/h e < 3000 no total; allowlist passa para 4 funções |
| 3 | Contrato de erro sem HTTP | AC-3b (novo), AC-4, Task 1, Task 3 | SQLSTATE `PT429/PT404/PT409/PT422` → HTTP; tabela código → HTTP → retentável → ação no README; mensagens sem ecoar parâmetros |
| 4 | Rate limit furável por concorrência | AC-4, Task 1, Task 2 | `pg_advisory_xact_lock` por hash do token e por município; prova por inspeção de `pg_locks`, com a limitação registrada |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Trilha de status fraca | AC-6, Task 1, Task 2 | Coluna `source` (citizen/staff/system); evento só com mudança real; append-only por trigger (UPDATE/DELETE/TRUNCATE) |
| 2 | Premissa de privilégio implícita | Task 1, Task 2 | Premissa fixada em teste pgTAP |
| 3 | Produção não exercitada | Checkpoint (passos 6–7) | Sondas sem escrita: PT404 (foto inexistente) e 422 (oceano); catálogo do bucket conferido |
| 4 | Allowlist por nome | AC-5, Task 2 | Comparação por `regprocedure` |
| 5 | Token nil / não v4 | AC-3, Task 1 | Validação de versão e variante; nil recusado |
| 6 | lon/lat e não finitos | AC-3, Task 1 | `isfinite` + faixas; `st_makepoint(lon, lat)` explícito; descrição vazia → null |
| 7 | Keep-alive sem instrução de recuperação | AC-7, Task 3 | `::error::` com a ação de restore + rerun |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|----------------------|
| 1 | Limpeza de fotos órfãs | Exige job com service_role (remoção via Storage API). O dano fica limitado pelo teto de 3000 objetos (fail-closed). Revisitar antes da validação em campo (fase 5) ou quando o teto chegar a 50% |
| 2 | Rate limit por IP | IP é dado pessoal (LGPD) e exigiria hash com sal rotativo + retenção curta. Os tetos global e de upload limitam o dano. Reavaliar se houver abuso observado |
| 3 | Máquina de estados de status | Não existe caminho de escrita de status antes da v0.2 (triagem). O histórico append-only já garante a reconstrução |
| 4 | Observabilidade de abuso (alerta quando o teto dispara) | Sem canal de alerta no MVP. As recusas aparecem nos logs de API do Supabase. Revisitar com a feature 4 (alertas) |
| 5 | O `ignore` do Dependabot suprime também security updates da CLI | A CLI é ferramenta de dev/CD, não roda no app. Fazer conferência manual mensal (documentada no README) |
| 6 | Foto não vinculada ao token no upload | O path é UUID v4 aleatório, não listável por anon e expira em 1h. Sequestrar a foto de outro cidadão exige adivinhar 122 bits |

## 5. Audit & Compliance Readiness

- **Evidência defensável:** sim, depois das correções. Toda criação e transição de status fica numa trilha append-only, com origem (`source`) e autor (`changed_by`). Os testes pgTAP provam cada controle, com fault injection.
- **Falhas silenciosas:** os tetos são fail-closed (recusam, não degradam); o keep-alive falha alto, com notificação. Ainda silencioso: tetos atingidos não geram alerta (deferido 4).
- **Reconstrução pós-incidente:** `report_status_event` + `report.created_at/updated_at` + hash do token permitem agrupar relatos por dispositivo sem identificar a pessoa. Fotos órfãs não têm trilha (deferido 1).
- **Responsabilidade:** escrita anônima só por uma RPC com contrato documentado; qualquer outra escrita exige service_role, que não existe no app nem no CI.
- **Falharia numa auditoria real:** a ausência de política de retenção de relatos e fotos (já deferida desde o Audit 01-02, revisita na fase 5). Antes da validação em campo, isso vira bloqueante.

## 6. Final Release Bar

**Antes de shippar:** todos os ACs (incluindo 2b, 3b e 4b) provados em pgTAP; allowlist com 4 assinaturas; sondas sem escrita em produção retornando PT404 e 422; keep-alive verde; tabela de erros no README.

**Riscos se shippar assim:**
- Um atacante consegue esgotar o teto de upload ou o teto por município e negar serviço por até 1h.
- As órfãs se acumulam até o teto de 3000.
- Não há alerta de abuso.

Os três são riscos de disponibilidade, não de confidencialidade nem de integridade.

**Assinaria:** sim, para o MVP acadêmico com dados de 2 municípios, desde que a política de retenção e a limpeza de órfãs entrem antes da validação em campo.

---

**Summary:** Applied 4 must-have + 7 strongly-recommended upgrades. Deferred 6 items.
**Plan status:** Updated and ready for APPLY

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*
