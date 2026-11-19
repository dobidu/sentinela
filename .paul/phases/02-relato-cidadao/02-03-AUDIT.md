# Enterprise Plan Audit Report

**Plan:** .paul/phases/02-relato-cidadao/02-03-PLAN.md
**Audited:** 2026-11-19
**Verdict:** conditionally acceptable

---

## 1. Executive Verdict

Condicionalmente aceitável. O plano não toca banco nem contrato de envio, mantém o mapa sem origem externa e tem checkpoint humano para o texto jurídico. Mas, como escrito, tinha quatro falhas que quebrariam produção ou o relato em silêncio:
- cache de um `.pmtiles` regenerado com o mesmo nome;
- 206/Range conferido só depois do merge;
- downloads de build sem verificação de integridade;
- corrida entre o centro do mapa e o município resolvido.

Com os upgrades aplicados, eu aprovaria.

## 2. What Is Solid

- **Sem migration, sem mudança em `submit_report`.** O risco fica confinado ao cliente e a reversão é um revert de PR.
- **Basemap na mesma origem.** Sem terceiro em runtime, sem chave, sem vazamento de localização para um provedor de tiles (LGPD) e compatível com a CSP futura.
- **GPS só por toque e fallback sem WebGL para o fluxo atual.** Preserva o caminho que já funciona em produção.
- **MapLibre lazy só em `/relatar/local`.** Protege a performance da entrada.
- **Dialog no passo 3 em vez de navegação.** Identifica corretamente que o provider só existe em `/relatar/*`.
- **Texto jurídico não afirmado pelo agente.** Fica para revisão do responsável.

## 3. Enterprise Gaps Identified

1. **Cache de arquivo com nome fixo.** PMTiles é lido por Range com offsets do cabeçalho. Um arquivo novo com o mesmo nome, misturado a respostas antigas em cache (CDN ou navegador), corrompe a leitura.
2. **Range na Vercel não comprovado antes do merge.** Se a Vercel não responder 206, o mapa de produção quebra para todos. O plano só conferia depois.
3. **Cadeia de suprimento do build.** O script baixa um binário executável e assets da internet sem hash. Um repo público executando um binário não verificado é um risco real.
4. **Corrida entre ponto e município.** Confirmar podia gravar o centro relido do mapa com o município de um centro anterior. O dado errado entra no banco sem erro.
5. **Localização trafegando a cada movimento.** Chamadas desnecessárias ao RPC (fora do bbox) e falta de transparência na política sobre esse tráfego.
6. **WCAG 2.5.7.** O pin fixo ainda exige arrastar o mapa. Só os botões + e − e o GPS não dão alternativa de posicionamento sem arrastar.
7. **Reprodutibilidade.** Os builds diários da Protomaps expiram, e o SHA do artefato não estava registrado, então não há como auditar qual dado está servido.
8. **Dialog.** Gestão de foco e nome acessível não estavam especificados.
9. **Marcadores `REVISAR`.** Podiam ir para produção.
10. **Tamanho no git.** Um binário de 30 MB por versão fica no histórico para sempre.

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Cache de PMTiles com nome fixo | decisions, AC-3, Task 1, files_modified | Nome com data + constante; `Cache-Control immutable` via `next.config.ts` |
| 2 | 206 só conferido após merge | AC-3, Task 1, verification | Conferência no preview antes do merge; se falhar, parar e decidir |
| 3 | Downloads sem integridade | decisions, AC-3, Task 1 | Versão + SHA-256 fixados; aborta se divergir; SHA do artefato no ATTRIBUTION |
| 4 | Corrida ponto ↔ município | decisions, AC-2, Task 1 | Par `{lon, lat, municipality}` atômico; Confirmar só se bate com o centro parado |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | RPC desnecessário fora da área | decisions, AC-2, Task 1 | Short-circuit no bbox estático |
| 2 | Transparência sobre o tráfego do ponto | AC-5, Task 2 | Política explica envio só para resolver o município, sem guarda |
| 3 | WCAG 2.5.7 | AC-2, Task 1, verification | Toque único centraliza; teclado; mapa focável com nome |
| 4 | Acessibilidade do dialog | AC-5, Task 2 | `showModal`, `aria-labelledby`, foco devolvido, teste |
| 5 | `REVISAR` em produção | AC-5, verification | grep vazio após o checkpoint |
| 6 | Tamanho e reprodutibilidade | Task 1, verification | Alvo ≤ 15 MB; 2 execuções → mesmo SHA ou explicação; ODbL no ATTRIBUTION |
| 7 | CSP futura e licenças | Task 1 | Diretivas no README; licenças das deps no SUMMARY |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|----------------------|
| 1 | Rate limit no `resolve_municipality` | STABLE, só leitura, sem custo de escrita; o debounce e o short-circuit reduzem o volume. Entra junto do rate limit por IP já deferido |
| 2 | E2E em navegador real (Playwright) para o mapa | O checkpoint manual cobre; o projeto ainda não tem infra de E2E. Avaliar na fase 5 |
| 3 | Telemetria de falha de mapa no cliente | O projeto não tem observabilidade de cliente; o fallback evita perder o relato |
| 4 | Git LFS para o basemap | Com alvo ≤ 15 MB e regeneração rara, o custo de LFS (config na Vercel) não compensa agora |

## 5. Audit & Compliance Readiness

- **Evidência:** SHA, origem e data do basemap no `ATTRIBUTION.md`; Lighthouse e licenças no SUMMARY; o texto jurídico é aprovado no checkpoint pelo responsável identificado.
- **Falha silenciosa:** a corrida de município e o cache corrompido eram as duas fontes de falha silenciosa. Ambas foram fechadas. Erro de tile tem mensagem visível.
- **Reconstrução:** o arquivo versionado por data permite saber qual dado estava em produção em cada commit.
- **Dono:** o checkpoint exige aprovação do responsável (LAVID/UFPB). A base legal não é decidida pelo agente.
- **Ainda fraco:** retenção "em definição" é uma lacuna real de LGPD. Já está deferida para antes da validação em campo (fase 5).

## 6. Final Release Bar

- **Antes de ir para produção:** 206 + cache immutable no preview; par ponto-município atômico com teste; script com hashes; texto de privacidade aprovado e sem `REVISAR`; Lighthouse ≥ 90 nas páginas leves.
- **Risco restante:** retenção indefinida; keep-alive ainda sem secret (produção pode pausar de novo ~11-26, fora do escopo deste plano mas bloqueia qualquer validação em produção).
- **Assinatura:** assino com os upgrades aplicados.

---

**Summary:** Applied 4 must-have + 7 strongly-recommended upgrades. Deferred 4 items.
**Plan status:** Updated and ready for APPLY

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*
