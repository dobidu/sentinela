# Handoff: UI/UX do Sentinela para o Claude Design

**Data:** 2026-10-08
**Para:** Claude Design (protótipo navegável + design system) e, depois, quem implementar em Next.js 16
**Idioma da interface:** português do Brasil (pt-BR), linguagem simples
**Status do produto:** backend de escrita anônima pronto (plano 02-01). A interface ainda é o scaffold do Next. Este documento é a fonte de verdade para o design das três superfícies do MVP.

Os fatos do produto foram conferidos em `.paul/PROJECT.md`, `.paul/ROADMAP.md`, `README.md` e `supabase/migrations/` em 2026-10-08. As boas práticas vêm de pesquisa feita na mesma data; as fontes estão no §15. Itens marcados **[proposta]** dependem de backend que ainda não existe e devem aparecer no protótipo como estado futuro, sem bloquear o MVP.

---

## 1. Resumo em uma frase

> Um app de bolso, calmo e confiável, em que **qualquer pessoa relata um foco do mosquito em menos de 60 segundos, sem cadastro e até sem internet**, e um painel em que a **vigilância municipal enxerga onde agir primeiro**, sem expor a casa de ninguém.

## 2. Contexto do produto

O Sentinela combate a **subnotificação de arboviroses** (dengue, zika, chikungunya). O ciclo funciona assim:

1. Cidadãos (e agentes de endemias) relatam **focos/criadouros** do *Aedes aegypti*: foto, localização e tipo do criadouro.
2. Um job PostGIS agrega os relatos em **áreas de risco** (grid de ~100 m).
3. A **vigilância municipal** vê essas áreas num painel e decide para onde mandar equipes.

| Item | Valor |
|---|---|
| Municípios atendidos hoje | João Pessoa e Cabedelo (PB). O schema é multi-município |
| Natureza | Projeto acadêmico (disciplina de 60 h, entrega até ~2026-12-10), **sem convênio com prefeitura** |
| Plataforma | PWA mobile-first (Next.js 16 + React 19 + Tailwind CSS v4), Supabase (Postgres/PostGIS) em São Paulo |
| Produção | https://sentinela-sigma-eosin.vercel.app |

### 2.1 Escopo do design

| Superfície | Usuário | Prioridade | Entra no MVP? |
|---|---|---|---|
| **A. Relato do cidadão** (PWA) | Cidadão anônimo, no celular, na rua | **P0** | Sim, planos 02-02 (online) e 02-03 (offline) |
| **B. Mapa público de risco** | Qualquer pessoa | P1 | Sim, fase 4 (camada em grid ~100 m) |
| **C. Painel da vigilância** | Vigilância municipal (login) | P1 | Sim, fase 4: mapa, séries temporais, exportação CSV |
| **D. Triagem do agente em campo** | Agente de endemias (login, celular) | P2 | v0.2, mas o design deve **prever** a fila e os status |
| **E. Alertas por limiar** | Vigilância | P2 | v0.2, prever espaço no painel |

**Entregar primeiro:** A completo (todos os estados), depois C e B. D e E podem ficar em wireframe de média fidelidade.

## 3. Pessoas

**Dona Socorro, 58 anos, moradora do Valentina (JP).** Android de entrada, 3G instável, plano de dados pré-pago, letra grande no celular. Viu pneus com água no terreno baldio ao lado. Não quer criar conta, não quer "se meter em confusão" e tem receio de que o vizinho saiba quem denunciou. Relata uma vez e talvez nunca mais.
→ Precisa de: zero cadastro, poucos toques, letra grande, garantia visível de anonimato, confirmação clara de que "foi".

**Lucas, 24 anos, estudante.** Usa o app algumas vezes por mês, curioso com o mapa e com o que aconteceu com o relato.
→ Precisa de: rapidez, mapa público bonito e legível, retorno sobre o relato **[proposta]**.

**Agente Marta, agente de combate às endemias.** Celular corporativo ou pessoal, sol forte, uma mão ocupada, conexão ruim dentro de quadras. Visita imóveis e também relata focos.
→ Precisa de: alto contraste ao sol, alvos grandes, fila offline, uso com uma mão.

**Dr. Renato, coordenação de vigilância ambiental.** Desktop no escritório e às vezes tablet. Decide a alocação de equipes semanalmente e presta contas à secretaria.
→ Precisa de: "onde está pior agora e está piorando?", prioridade explicada, exportação, nada de alarme falso.

## 4. Princípios de design

1. **Um relato, um minuto.** Meta mensurável: abrir → enviar em **< 60 s** e **≤ 3 telas**. Cada campo extra precisa justificar sua existência.
2. **Uma coisa por tela.** Padrão GOV.UK *one thing per page*: uma ideia por tela, com título, voltar e um botão principal. Funciona melhor para quem tem pouca confiança digital e para tratar erros.
3. **Anonimato que se vê.** O app *mostra* que é anônimo ("Você não precisa se identificar") e explica, no momento certo, o que acontece com a foto e a localização.
4. **Calmo, não alarmista.** Nada de mosquito gigante, vermelho sobre preto ou estética de epidemia. O tom é "você está cuidando do seu bairro". Campanhas baseadas em medo cansam.
5. **Nunca mentir sobre o envio.** Offline, o app diz "salvo no aparelho, será enviado sozinho". "Enviado" só aparece quando o servidor confirmou.
6. **Legível ao sol.** Contraste acima do mínimo da WCAG nos elementos críticos, alvos grandes e nada de texto sobre foto ou mapa sem fundo.
7. **Dado vira ação, ação vira retorno.** No painel, toda prioridade mostra o *porquê*. Para o cidadão, todo relato tem um destino rastreável **[proposta]**.
8. **Inspirado no gov.br, sem se passar pelo gov.br.** Ver §10.

## 5. Identidade visual

### 5.1 Conceito: "caderno de campo"

A estética remete ao **caderno de campo do agente de endemias** e à **cartografia**:
- papel quente em vez de branco que ofusca;
- tinta escura e grid fino como motivo, eco das células de 100 m;
- curvas de nível sutis em ilustrações e estados vazios;
- **carimbos** para status (RECEBIDO, VISITADO, FOCO ELIMINADO), com leve rotação de −2° e textura de tinta apenas decorativa.

A cor principal é o **verde-azulado da água parada** (o problema), e o acento é **terracota/ocre**, de muro, telha e solo urbano nordestino. Fica distinto do visual genérico de SaaS (azul + cinza + gradiente roxo) e não parece site oficial do governo.

**Assinatura visual:** o marcador de mapa do Sentinela é uma **gota d'água com um ponto de mira** (o "sentinela"). Ele aparece como ícone do app, como pin de localização e no estado de sucesso.

### 5.2 Paleta (tokens)

Contrastes calculados (WCAG 2.x) contra o fundo indicado.

**Tema claro (padrão)**

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `--paper` | `#F7F3EA` | Fundo do app | n/a |
| `--surface` | `#FFFDF8` | Cartões, folhas inferiores | n/a |
| `--ink` | `#1B1F23` | Texto principal | 14,97:1 no paper |
| `--ink-muted` | `#4A5058` | Texto secundário | 7,35:1 |
| `--line` | `#D9D2C3` | Divisórias, grid decorativo | decorativo |
| `--agua` (primária) | `#0F4C5C` | Botão principal, links, foco | 8,59:1 no paper |
| `--on-agua` | `#FFFFFF` | Texto sobre a primária | 9,51:1 |
| `--terracota` (acento) | `#9A3B22` | Destaques, ilustração, carimbos | 6,27:1 |
| `--ocre` | `#E0A030` | Só decoração ou fundo (nunca texto sobre o paper) | n/a |
| `--ok` | `#2F6B3F` | Sucesso ("Enviado") | 5,75:1 |
| `--atencao` | `#8A5A00` | Aviso ("Na fila") | 5,35:1 |
| `--erro` | `#B3261E` | **Só** erro de formulário ou sistema | 5,9:1 |

**Tema escuro** (respeitar `prefers-color-scheme`; o padrão é o claro, porque o uso é externo e de dia)

| Token | Hex | Contraste |
|---|---|---|
| `--paper` | `#121719` | n/a |
| `--ink` | `#ECE6DA` | 14,54:1 |
| `--ink-muted` | `#A9B0B6` | 8,24:1 |
| `--agua` | `#7CC4D2` (texto `#0B2B33` sobre ela: 7,59:1) | 9,19:1 |
| `--terracota` | `#F09A7A` | 8,27:1 |
| `--erro` | `#F2B8B5` | 10,58:1 |

**Escala de risco (dado, separada da marca).** A escala é sequencial e cresce em luminosidade, então continua legível para daltônicos e não usa a dupla vermelho/verde. A cor de marca nunca é usada para dado.

| Nível (`risk_level`) | Rótulo público | Preenchimento | Borda | Texto sobre o preenchimento |
|---|---|---|---|---|
| `low` | **Baixo** | `#F1DDA6` areia | `#B89A4E` 1 px | ink (12,34:1) |
| `medium` | **Médio** | `#D9822B` ocre-queimado | `#8A5A00` 1 px | ink (5,67:1) |
| `high` | **Alto** | `#7A2335` vinho | `#4A1520` 2 px **+ hachura diagonal** | branco (9,91:1) |
| sem dados / suprimido | **Sem dados** | transparente + hachura cinza `#8C7F68` | n/a | n/a |

Regras:
- O nível nunca é comunicado só pela cor (WCAG 1.4.1). Usar rótulo, ícone e hachura no "Alto".
- O preenchimento "Baixo" tem pouco contraste com o fundo (1,21:1). Por isso a **borda é obrigatória**.
- Testar a escala em simulador de deuteranopia e protanopia antes de fechar.
- **Célula vazia nunca usa a cor de "Baixo".** "Sem relato" é diferente de "risco baixo".

### 5.3 Tipografia

Todas as fontes são gratuitas (OFL, Google Fonts) e têm ç, ã, õ, ê, á. Carregar via `next/font/google`, subset `latin`.

| Papel | Fonte | Por quê |
|---|---|---|
| Títulos e display | **Bricolage Grotesque** (variável; pesos 600–800; `opsz`) | Tem personalidade, foge do visual genérico e é calorosa |
| Texto, formulários, UI | **Atkinson Hyperlegible Next** (400/700) | Feita para baixa visão; diferencia I/l/1 e O/0. Ideal ao sol e para leitores com pouca prática |
| Números, códigos, tabelas do painel | **IBM Plex Mono** ou algarismos tabulares da Atkinson | Protocolo e colunas alinhadas |

**Escala de tipo (mobile):**

| Uso | Tamanho / altura de linha |
|---|---|
| Corpo | **18 px** / 1,5 (mínimo 16 px em qualquer texto) |
| Rótulos | 16 px / 1,4, peso 700 |
| Título de tela | 28 px / 1,15 |
| Display de sucesso | 36 px |

O painel desktop usa corpo de 16 px.

**Não usar** Rawline nem Raleway: são a tipografia da marca gov.br e sugeririam um vínculo oficial que não existe.

### 5.4 Forma, espaço, elevação e movimento

**Forma e espaço**
- Grid de 8 px; margem lateral de 16 px no mobile.
- Raio de 12 px em cartões e 999 px em chips. Botões com 14 px de raio: arredondados, mas não pílula.
- Bordas de 1,5 px em `--ink` a 12 % em vez de sombras pesadas. A estética é de papel, quase plana. Sombra só na folha inferior do mapa.

**Ícones e ilustração**
- Ícones de traço de 2 px, cantos arredondados. Lucide ou Phosphor como base.
- **Ícones próprios** para os 8 tipos de criadouro (§6.4), no mesmo traço.
- Ilustrações em traço, com uma cor plana de preenchimento e sem gente com rosto realista. Nada de mosquito "monstro"; se aparecer mosquito, que seja pequeno e esquemático.

**Movimento**
- 150 a 250 ms, `ease-out`.
- O sucesso tem um único momento expressivo: o carimbo "RECEBIDO" bate na tela com escala 1,15→1 e leve rotação. Não usar confete.
- Respeitar `prefers-reduced-motion`: sem animação, apenas a troca de estado.

## 6. Superfície A: relato do cidadão (P0)

### 6.1 Arquitetura

```
[Início] ──▶ [1 Foto] ──▶ [2 Local] ──▶ [3 Tipo + enviar] ──▶ [Pronto]
   │                                                            │
   ├─▶ [Meus relatos] (lista local, status da fila)     ◀───────┘
   ├─▶ [Mapa de risco] (superfície B)
   └─▶ [Sobre / Privacidade]
```

A meta de ≤ 3 telas conta só os passos 1, 2 e 3. Início e Pronto não contam.

### 6.2 Tela Início

- Logo + nome **Sentinela** + linha de valor: *"Viu água parada que pode virar foco do mosquito? Avise a vigilância em menos de um minuto."*
- **Botão principal enorme**, na zona do polegar: **"Relatar foco"**, com 56 px de altura e largura total.
- Abaixo do botão: *"Sem cadastro. Você não precisa se identificar."*, com ícone de cadeado.
- Secundários: "Ver mapa de risco" e "Meus relatos (2)". O contador só aparece se houver relatos.
- Selo discreto de quem mantém: *"Projeto acadêmico — não é um canal oficial da prefeitura"*, com link para Sobre. Isso evita falsa expectativa de atendimento.
- Se houver relatos pendentes na fila, mostrar um banner fino no topo: *"1 relato aguardando internet"* (§6.7).

### 6.3 Passo 1 de 3: Foto

**Layout**
- Título: **"Fotografe o local com água parada"**.
- Ao tocar em "Abrir câmera", usar `<input type="file" accept="image/*" capture="environment">`. É o mais robusto em Android de entrada. Oferecer "Escolher da galeria" como link secundário.
- **Aviso no momento certo**, acima do botão, com ícone de olho: *"Fotografe só o recipiente ou o local. Evite pessoas, rostos, placas de carro e números de casa."*

**Depois da foto**
- Pré-visualização grande, com "Tirar outra" e **"Usar esta foto"** como botão principal.
- Compressão no aparelho logo após a escolha, com indicador *"Preparando foto…"*.

**Parâmetros técnicos da foto (para quem implementar)**
- WebP ou JPEG, **até 2 MB** (limite do bucket); alvo de ~300–500 KB.
- Maior lado de 1280–1600 px.
- **EXIF removido**, o que também tira o GPS da foto.

**Erros**
- Arquivo que não é imagem: *"Esse arquivo não é uma foto. Tente de novo."*
- Câmera negada: explicar como liberar e oferecer a galeria.

A foto é **obrigatória**: o contrato do backend exige `photo_path`.

### 6.4 Passo 2 de 3: Local

- Título: **"Onde está o foco?"**
- Mapa ocupando ~60 % da altura. O **pin fica fixo no centro** e a pessoa **arrasta o mapa** por baixo dele. Isso resolve o critério WCAG 2.5.7 (alternativa a arrastar o pin) e é mais fácil com o polegar.
- Botões "+" e "−" de zoom visíveis e "Usar minha localização" (ícone de mira).
- **Permissão de GPS só depois de um toque**, nunca ao carregar a página. Ao lado do botão: *"Usamos sua localização só para marcar o foco no mapa."*

**Precisão e fallback**
- Mostrar o círculo de precisão do GPS.
- Se a precisão for pior que ~50 m: *"A localização está imprecisa. Arraste o mapa até o ponto certo."*
- Se o GPS for negado, o mapa abre centrado no município e a pessoa navega até o ponto. **[proposta]** busca por endereço ou ponto de referência.

**Município e confirmação**
- Embaixo do mapa, um cartão com o município resolvido pelo ponto (RPC `resolve_municipality`): *"📍 João Pessoa"*.
- Fora da área: *"Ainda não atendemos esse local. O Sentinela funciona em João Pessoa e Cabedelo."* O botão fica desabilitado, com o motivo visível.
- Botão principal: **"Confirmar local"**.

**Aviso de privacidade** (ícone de escudo, texto curto): *"Sua localização exata fica visível só para a equipe de saúde. No mapa público, mostramos apenas áreas de ~100 m."*

**Mapa:** o basemap é dessaturado, em tons de papel, para o pin e o risco dominarem. Atribuição "© OpenStreetMap" sempre visível.

### 6.5 Passo 3 de 3: Tipo + enviar

**Escolha do tipo**
- Título: **"O que você viu?"**
- **Grade 2×4 de cartões grandes** (mínimo de 48 px de alvo; na prática ~150×110 px). Cada cartão tem ícone próprio e rótulo em linguagem simples.
- Seleção única. O cartão selecionado ganha borda de 3 px `--agua` e um check, sem depender só da cor.

| Valor (`breeding_site_type`) | Rótulo para o cidadão | Ícone sugerido | Grupo LIRAa (só no painel; **conferir no manual do MS**) |
|---|---|---|---|
| `pneu` | Pneu | pneu com gota | D1 |
| `caixa_dagua` | Caixa d'água / tonel destampado | caixa sem tampa | A1/A2 |
| `vaso_planta` | Vaso ou prato de planta | vaso com pratinho | B |
| `calha` | Calha ou laje com água | calha | C |
| `piscina` | Piscina ou fonte sem cuidado | piscina | C |
| `lixo_entulho` | Lixo ou entulho | saco/entulho | D2 |
| `recipiente_diverso` | Garrafa, balde, lata… | garrafa + balde | B/D2 |
| `outro` | Outro lugar | ponto de interrogação | n/a |

**Descrição e envio**
- Campo opcional **"Quer contar mais alguma coisa?"**, com contador de até 500 caracteres. Microaviso: *"Não escreva nomes, telefones ou endereço completo."*
- Resumo compacto antes do botão: miniatura da foto, município e tipo, cada um com "alterar". Isso evita pedir a mesma informação duas vezes (WCAG 3.3.7).
- Botão principal: **"Enviar relato"**.

### 6.6 Tela Pronto

**Online, confirmado pelo servidor**
- Carimbo animado **RECEBIDO** (§5.4) e o título *"Obrigado! Seu relato chegou à vigilância."*
- **Dica de ação**, que transforma o relato em cuidado: *"Se for seguro, vire o recipiente, tampe ou jogue a água fora. Isso já elimina o foco."*
- **[proposta]** Código de protocolo curto (ex.: `SNT-7K3P`) com "copiar" e "compartilhar", para acompanhar o status sem conta. Exige uma RPC pública de consulta por código, que ainda não existe. No protótipo, mostrar como estado futuro.
- **[proposta]** Se já houver relatos naquela célula: *"Outras pessoas também relataram focos nesta área."* Isso reforça que o relato importa.
- Ações: "Relatar outro foco" e "Ver mapa de risco".
- Momento de oferecer **instalar o app**. Usar `beforeinstallprompt` com UI própria, só depois do primeiro relato bem-sucedido; nunca na primeira visita e nunca de novo se a pessoa recusou. Texto: *"Quer o Sentinela na tela inicial? Abre mais rápido e funciona sem internet."*

**Offline** (plano 02-03)
- Carimbo **SALVO** em `--atencao` em vez de RECEBIDO.
- Texto: *"Seu relato está salvo no celular e será enviado sozinho quando houver internet. Pode fechar o app."*

### 6.7 Estados da fila offline e "Meus relatos"

Cada relato local tem um estado visível, sempre com **ícone e texto**:

| Estado | Rótulo | Ícone | Cor |
|---|---|---|---|
| Salvo, sem rede | **Aguardando internet** | nuvem riscada | `--atencao` |
| Enviando | **Enviando…** | spinner discreto | `--agua` |
| Confirmado | **Enviado ✓** | check | `--ok` |
| Erro retentável (`PT404`, `PT429`, rede) | **Vamos tentar de novo** + "Tentar agora" | relógio | `--atencao` |
| Erro definitivo (`PT422`, `PT409`) | **Precisa de atenção** + ação específica | alerta | `--erro` |

**Comportamento da fila**
- Retentativa automática com backoff.
- Ao voltar a conexão, esperar ~2 s antes de mudar o indicador, para não piscar.
- Erro retentável nunca aparece como "falhou".
- Banner global no topo enquanto houver pendências: *"2 relatos aguardando internet"*. Ao tocar, abre "Meus relatos".
- "Meus relatos" fica **só no aparelho**: lista com miniatura, tipo, data e estado.
  - **[proposta]** Status vindo do servidor: Recebido → Em análise → Visitado (foco confirmado / eliminado / não encontrado).
  - Mapeamento dos valores do servidor: `report_status` `pending`/`confirmed`/`dismissed`/`resolved` e `inspection_outcome` `not_found`.

### 6.8 Mensagens de erro (mapa do contrato da API)

| Código | Situação | Mensagem ao cidadão | Ação |
|---|---|---|---|
| `PT422` (fora da área) | Ponto fora de JP/Cabedelo | *"Ainda não atendemos esse local."* | Voltar ao passo 2 |
| `PT422` (validação) | Dado inválido | *"Algo no relato não está certo: [campo]. Corrija e envie de novo."* | Ir ao campo |
| `PT404` | Foto não chegou ou expirou | (silencioso) reenvia a foto sozinho | Automático; se falhar 3×, "Vamos tentar de novo" |
| `PT409` | Foto já usada | (silencioso) gera novo nome e reenvia | Automático |
| `PT429` | Limite de 5/h ou 20/dia por aparelho | *"Você já enviou muitos relatos agora. O relato ficou salvo e será enviado mais tarde."* | Fica na fila |
| Rede | Sem conexão | Vira estado offline (§6.7) | Fila |

**Regras de erro**
- Validação inline, no campo, ao sair dele, nunca enquanto a pessoa digita.
- A mensagem diz **como resolver**.
- Rolar até a mensagem e mantê-la acima do teclado.
- Nunca mostrar código técnico ao cidadão.

### 6.9 Sobre e privacidade

Aviso de privacidade **em camadas**:
1. **Primeira camada:** 5 tópicos curtos sob *"Como usamos seus dados"*.
   - Não pedimos nome nem telefone.
   - Um código aleatório identifica só o aparelho, para evitar spam, e guardamos dele apenas uma versão embaralhada.
   - A foto fica em área privada, vista só pela equipe de saúde.
   - A localização exata é vista só pela equipe; o público vê áreas de ~100 m.
   - Finalidade: vigilância em saúde.
2. **Segunda camada:** política completa, com controlador (projeto acadêmico e responsável), retenção (**pendente de definição**: avisar com "em definição") e contato.

A página também deixa claro *"Projeto acadêmico de [instituição] — não substitui o Disque-Saúde / Vigilância do município"*, com o telefone municipal quando houver.

## 7. Superfície B: mapa público de risco (P1)

- **Mapa** de tela cheia no mobile, com folha inferior arrastável (com alternativa por botão) contendo legenda e explicação. No desktop, mapa + painel lateral de 360 px.
- **Camada:** células de ~100 m coloridas pela escala de risco (§5.2). **Nunca** pontos individuais, foto ou coordenada exata.
  - Células com poucos relatos, abaixo de um limiar k (sugestão k ≥ 3–5, a definir na fase 3), aparecem como "Sem dados" ou são fundidas com as vizinhas.
- **Legenda em classes**: Baixo, Médio, Alto e Sem dados, com hachura, nunca um gradiente contínuo.
  - Ao lado, a janela de tempo (*"últimos 30 dias"*, valor a confirmar na fase 3) e um link **"O que isso significa?"**.
  - Esse link explica em linguagem simples: risco = concentração de relatos recentes na área, não número de casos de dengue.
- **Seletor de município** quando houver mais de um.
- **Data de atualização** visível: *"Atualizado há 2 h"*. A área de risco é materializada por job.
- **Interação:** tocar numa célula mostra *"Área com risco Médio · 4 relatos nos últimos 30 dias"*, sem endereço.
- **CTA fixo:** "Relatar foco aqui". Abre o fluxo A já no passo 1.
- **Estados vazios:** *"Nenhuma área de risco nos últimos 30 dias. Continue de olho!"*, com ilustração de grid limpo.
- **Tecnologia recomendada:** MapLibre GL JS (WebGL, leve com milhares de células) e basemap vetorial próprio via Protomaps/PMTiles (OSM, estilos CC0, pode ser cacheado offline). Não usar os tiles de openstreetmap.org em produção. Fallback raster simples se não houver WebGL.

## 8. Superfície C: painel da vigilância (P1)

### 8.1 Princípios

- A **home é mapa + fila de prioridades**, não um mural de KPIs. Painéis com excesso de informação são pouco usados por quem decide (revisão BMC Public Health 2024).
- **No máximo 4 KPIs**, em linha fina no topo:
  - Relatos novos (7 dias)
  - Aguardando triagem
  - Áreas em "Alto"
  - Tendência vs. semana anterior (seta + %, com texto)
- **Evitar fadiga de alerta:**
  - Vermelho/vinho só para o nível mais alto.
  - "Tempo desde o relato" em texto neutro ("há 3 dias") e não pintado de vermelho.
  - Só o crítico interrompe; o resto vai para a fila.

### 8.2 Layout desktop (≥ 1280 px)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Sentinela · Vigilância · João Pessoa  [Últimos 30 dias ▾]     Renato ▾ │
├─────────────────────────────────────────────────────────────────────┤
│ Novos 7d: 128 │ Aguardando: 41 │ Áreas Alto: 6 │ ▲ 18% vs. sem. anterior │
├──────────────────────────────────────┬──────────────────────────────┤
│                                      │ Prioridades                  │
│          MAPA (risco + pontos        │ ┌──────────────────────────┐ │
│          exatos para staff)          │ │ ALTO · Valentina, cél. 12│ │
│                                      │ │ 9 relatos · 3 caixas d'água│
│                                      │ │ Por quê: densidade ↑, A1/A2│
│                                      │ └──────────────────────────┘ │
│                                      │ …                            │
├──────────────────────────────────────┴──────────────────────────────┤
│ Série temporal: relatos/dia por nível de risco  [Exportar CSV]       │
└─────────────────────────────────────────────────────────────────────┘
```

O município aparece fixo no cabeçalho, sem seletor: cada usuário da equipe só enxerga o próprio município (regra de acesso do banco). Ver tudo junto é só no mapa público.

### 8.3 Componentes

**Mapa da vigilância**
- Duas camadas alternáveis: áreas de risco e **relatos individuais com coordenada exata** (só para staff).
- Clusters em zoom baixo.
- Clique abre um detalhe com foto via URL assinada, tipo, grupo LIRAa, data e status.

**Fila de prioridades**
- Agrupa relatos da mesma célula numa **ocorrência** com N relatos.
- Ordena por um escore transparente: densidade, tipo (A1/A2 pesa mais) e idade.
- Cada item mostra **"Por quê"** em uma linha.

**Série temporal**
- Linhas ou barras empilhadas por dia/semana.
- Anotações de eventos (ex.: "mutirão no bairro") são **[proposta]**.

**Exportação CSV**
- Filtros visíveis: período, município, nível e tipo.
- O arquivo traz cabeçalho em pt-BR e uma linha de metadados com o filtro aplicado.

**Tabela de relatos** (vista alternativa)
- Ordenável, com algarismos tabulares e filtros em chips.
- Navegação por teclado: `j`/`k` para mover, `Enter` para abrir.

### 8.4 Triagem (P2, v0.2: prever espaço)

- Ações por relato: **Confirmar foco**, **Descartar** (com motivo: duplicado / sem foco / imagem imprópria) e **Marcar visitado** (resultado = `inspection_outcome`: confirmado, descartado, eliminado, não encontrado).
- Os status espelham o que o cidadão verá **[proposta]**.
- O agente usa a mesma tela no **celular**: fila em lista, botão "Abrir no mapa / rota" e registro de visita offline.
- Alertas (feature 4) aparecem como cartão fixo no topo da fila: *"Área X cruzou o limiar"*, com "Ciente" (`acknowledged_at`).

### 8.5 Login

- E-mail + senha (Supabase Auth). Sem cadastro público; contas são criadas por admin.
- Permitir colar senha e usar gerenciador (WCAG 3.3.8). Mostrar/ocultar senha.
- Mensagem neutra no erro de login.

### 8.6 Responsividade

- Tablet: mapa em cima, fila embaixo.
- Celular: abas "Fila | Mapa | Gráficos".

## 9. Acessibilidade (WCAG 2.2 AA como piso)

**Alvos, foco e contraste**
- **Alvos:** mínimo de 24×24 px exigido; **usar 48×48 px** no app do cidadão e 40 px no painel. Espaço de 8 px entre alvos.
- **Contraste:** texto ≥ 4,5:1 e UI/ícones ≥ 3:1 são o piso. Nos **CTAs e status do app do cidadão, ≥ 7:1** por causa do uso ao sol; a paleta do §5.2 já atende.
- **Foco visível:** anel de 3 px em `--agua` com 2 px de offset. O foco nunca fica escondido por cabeçalho fixo, folha inferior ou banner (2.4.11).

**Alternativas e semântica**
- **Sem dependência de cor:** risco e status sempre com texto e ícone; "Alto" com hachura.
- **Arrastar:** toda interação de arrastar (mapa, folha inferior) tem alternativa por botão (2.5.7).
- **Leitores de tela:**
  - cada tela tem um `h1` único;
  - etapas anunciadas ("Passo 2 de 3: Local");
  - status da fila em `aria-live="polite"` e erros em `aria-live="assertive"`;
  - cartões de tipo como `radiogroup`.

**Texto e movimento**
- **Zoom de texto até 200 %** sem quebrar o layout. Respeitar a fonte grande do sistema (unidades `rem`).
- **Movimento reduzido** respeitado (§5.4).

**Linguagem simples**
- Seguir a Lei 15.263/2025 (Política Nacional de Linguagem Simples): frases curtas, voz ativa, palavras do dia a dia, sem siglas sem explicação.
- Vocabulário:

| Escrever | Evitar |
|---|---|
| "foco do mosquito" / "água parada" | "criadouro positivo" |
| "relatar" | "notificar" |
| "área de risco" | "cluster" |

**"Modo sol" [proposta]:** alternância de alto contraste (fundo branco puro, tinta preta e bordas mais grossas) no menu.

## 10. Relação com o gov.br Design System

- O Padrão Digital de Governo é **obrigatório só para órgãos federais**. Estados e municípios podem usá-lo como referência.
- O Sentinela **não é um canal oficial**. Copiar o cabeçalho, as cores ou a tipografia gov.br (Rawline/Raleway) sugeriria um vínculo oficial que não existe, o que é um risco de confiança e de imitação de órgão público.
- **Adotar do gov.br:** convenções de interação, piso de acessibilidade, linguagem simples e padrões familiares (ex.: link de acessibilidade, mensagens de erro).
- **Manter identidade própria**, com o selo "Projeto acadêmico".
- Se uma prefeitura adotar o sistema, a camada de tokens (§5.2) permite trocar a marca para a identidade municipal sem refazer componentes.

## 11. Microcopy de referência

| Onde | Texto |
|---|---|
| CTA principal | Relatar foco |
| Subtítulo do início | Viu água parada que pode virar foco do mosquito? Avise a vigilância em menos de um minuto. |
| Anonimato | Sem cadastro. Você não precisa se identificar. |
| Passo 1 | Fotografe o local com água parada |
| Aviso da foto | Fotografe só o recipiente ou o local. Evite pessoas, rostos, placas de carro e números de casa. |
| Passo 2 | Onde está o foco? |
| Pedido de GPS | Usamos sua localização só para marcar o foco no mapa. |
| Fora da área | Ainda não atendemos esse local. O Sentinela funciona em João Pessoa e Cabedelo. |
| Passo 3 | O que você viu? |
| Descrição | Quer contar mais alguma coisa? (opcional) |
| Aviso da descrição | Não escreva nomes, telefones ou endereço completo. |
| Sucesso | Obrigado! Seu relato chegou à vigilância. |
| Dica de ação | Se for seguro, vire o recipiente, tampe ou jogue a água fora. |
| Offline | Seu relato está salvo no celular e será enviado sozinho quando houver internet. Pode fechar o app. |
| Limite | Você já enviou muitos relatos agora. O relato ficou salvo e será enviado mais tarde. |
| Instalar | Quer o Sentinela na tela inicial? Abre mais rápido e funciona sem internet. |
| Mapa vazio | Nenhuma área de risco nos últimos 30 dias. Continue de olho! |

**Tom de voz:** fale "você" e use frases de até ~15 palavras. Use verbos no imperativo gentil ("Fotografe", "Arraste") e no máximo um emoji funcional (📍). Nunca use tom de culpa ("Você está colocando sua família em risco").

## 12. Requisitos técnicos que afetam o design

- **Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (tokens em `@theme` no `globals.css`). Ainda não há biblioteca de componentes. Os componentes devem ser simples de implementar em Tailwind; se precisarem de primitivos acessíveis, Radix/React Aria são aceitáveis.
- **Peso:** o PWA precisa abrir bem em 3G.
  - Fontes em subset `latin`, no máximo 2 famílias no app do cidadão.
  - Ilustrações em SVG inline e leves.
  - Sem vídeo, sem Lottie pesado.
  - Mapa carregado só no passo 2 (lazy).
- **Metas:** Lighthouse PWA/mobile ≥ 90; relato em < 60 s.
- **PWA:** precisa de ícone (192/512 + maskable), `theme_color` = `--agua`, `background_color` = `--paper`, e `screenshots` no manifest, para o diálogo rico de instalação no Android. A splash usa o símbolo gota + mira sobre o paper.
- **Orientação:** só retrato no app do cidadão; o painel é responsivo.
- **Dados que o cliente envia** (contrato fixo, não inventar campos novos):
  - token do aparelho, longitude e latitude;
  - tipo (um dos 8 do §6.5);
  - caminho da foto;
  - descrição opcional (≤ 500).

## 13. Sistema navegável completo: funcionalidades, telas e navegação

Esta seção é o **mapa de construção do protótipo**. Todas as funcionalidades do produto (MVP, v0.2 e propostas) estão listadas, cada uma ligada às telas que a entregam. Cada tela tem ID, rota, quem acessa, conteúdo, ações com destino e estados. Com ela, o protótipo navegável deve cobrir **todas as telas** e **todas as ligações**, sem beco sem saída.

**Fases das telas**

| Marca | Significado |
|---|---|
| **MVP** | Entra na v0.1 (fases 2 a 4) |
| **v0.2** | Triagem e alertas |
| **[proposta]** | Precisa de backend novo |

Todas as telas aparecem no protótipo. As v0.2 e [proposta] levam um selo discreto "Em breve", visível só no modo demonstração (§13.8).

### 13.1 Papéis e acesso

| Papel | Como entra | Escopo | O que vê |
|---|---|---|---|
| **Cidadão** | Sem login (token aleatório no aparelho) | Qualquer município atendido | App público (`/`) |
| **Agente** (`agent`) | Login | Só o próprio município | Campo (fila, visitas) + painel em leitura + relatar |
| **Vigilância** (`surveillance`) | Login | Só o próprio município | Painel completo + alertas + exportar |
| **Admin** (`admin`) | Login | Só o próprio município | Tudo da vigilância + usuários + município |

Regras que o design deve refletir:
- Não existe cadastro público de equipe; quem cria contas é o admin.
- Ninguém da equipe troca de município na interface.
- Foto e coordenada exata aparecem **só** nas telas autenticadas.
- O agente também relata focos pelo mesmo fluxo do cidadão (§6). Logado, o relato segue anônimo no banco, porque o contrato não grava autor; ver §16.

### 13.2 Catálogo de funcionalidades

**Cidadão (app público)**

| ID | Funcionalidade | Fase | Telas |
|---|---|---|---|
| F01 | Relatar foco: foto, local, tipo, descrição, envio | MVP | P-02 → P-03 → P-04 → P-05 |
| F02 | Fila offline com reenvio automático e manual | MVP | P-05, P-06, P-07, banner global |
| F03 | Meus relatos (histórico local do aparelho) | MVP | P-06, P-07 |
| F04 | Acompanhar relato por protocolo | [proposta] | P-08, P-07 |
| F05 | Mapa público de risco em grid ~100 m | MVP | P-09, P-10 |
| F06 | Instalar o app (PWA) | MVP | P-05, P-12 |
| F07 | Sobre o projeto e aviso de privacidade em camadas | MVP | P-11, P-13 |
| F08 | Como reconhecer um foco (guia ilustrado curto) | MVP (conteúdo estático) | P-14 |
| F09 | Ajustes do aparelho: modo sol, tema e **apagar meus dados deste aparelho** (relatos locais + novo token) | MVP; modo sol [proposta] | P-12 |
| F10 | Funcionar sem internet (página offline, cache do app) | MVP | P-15 |

**Equipe: acesso**

| ID | Funcionalidade | Fase | Telas |
|---|---|---|---|
| F20 | Entrar e sair | MVP | S-01 |
| F21 | Esqueci a senha / nova senha (e-mail do Supabase Auth) | MVP | S-02, S-03 |
| F22 | Primeiro acesso por convite (definir senha) | MVP | S-03 |
| F23 | Minha conta (nome, trocar senha, sair) | MVP | S-30 |

**Vigilância**

| ID | Funcionalidade | Fase | Telas |
|---|---|---|---|
| F30 | Visão geral: KPIs, mapa resumido, prioridades, tendência | MVP | S-10 |
| F31 | Mapa operacional: camadas de áreas, relatos exatos e visitas; filtros | MVP | S-11 |
| F32 | Lista de relatos com busca, filtros e ordenação | MVP | S-12 |
| F33 | Detalhe do relato: foto, local exato, tipo, histórico de status, visitas | MVP | S-13 |
| F34 | Áreas de risco: lista e detalhe (relatos da área, evolução do nível) | MVP | S-14, S-15 |
| F35 | Análises: séries temporais por nível, tipo e bairro/área | MVP | S-16 |
| F36 | Exportar CSV com filtros | MVP | S-17 |
| F37 | Alertas por limiar: lista, detalhe, dar ciência | v0.2 | S-18, S-19, sino no cabeçalho |
| F38 | Triagem: confirmar, descartar com motivo, marcar duplicado | v0.2 | S-13 (ações), S-12 (seleção em lote) |
| F39 | Encaminhar ocorrência para um agente | [proposta] | S-13, S-15 |

**Agente em campo (mobile)**

| ID | Funcionalidade | Fase | Telas |
|---|---|---|---|
| F40 | Fila de campo: ocorrências do município, por prioridade ou distância | v0.2 | S-20 |
| F41 | Detalhe da ocorrência + "Como chegar" (abre o app de mapas) | v0.2 | S-21 |
| F42 | Registrar visita: resultado (`inspection_outcome`) + observações | v0.2 | S-22 |
| F43 | Visitas guardadas offline e sincronizadas | v0.2 | S-20, S-23 |
| F44 | Minhas visitas (histórico) | v0.2 | S-23 |
| F45 | Relatar foco encontrado em campo (reusa F01) | MVP | P-02…P-05 |

**Admin**

| ID | Funcionalidade | Fase | Telas |
|---|---|---|---|
| F50 | Usuários: listar, convidar, mudar papel, desativar | MVP | S-24, S-25, S-26 |
| F51 | Município: dados, contorno no mapa, municípios atendidos | MVP (leitura) | S-27 |
| F52 | Regras de alerta: limiar de densidade × janela | v0.2 | S-28 |
| F53 | Registro de atividade (mudanças de status e quem fez) | v0.2 | S-29 |

**Sistema (todas as superfícies)**

| ID | Funcionalidade | Telas |
|---|---|---|
| F60 | Página não encontrada | X-01 |
| F61 | Erro inesperado com "Tentar de novo" | X-02 |
| F62 | Sem permissão (papel errado) | X-03 |
| F63 | Sessão expirada → volta ao login preservando o destino | X-04 |
| F64 | Carregamento (skeletons) e estados vazios em toda lista e mapa | todas |

### 13.3 Mapa do site

```
APP PÚBLICO (sem login)                       PAINEL DA EQUIPE (login)
/                         P-01 Início          /painel/entrar              S-01
/relatar/foto             P-02 Passo 1         /painel/recuperar-senha     S-02
/relatar/local            P-03 Passo 2         /painel/nova-senha          S-03
/relatar/tipo             P-04 Passo 3         /painel                     S-10 Visão geral
/relatar/pronto           P-05 Pronto          /painel/mapa                S-11
/meus-relatos             P-06                 /painel/relatos             S-12
/meus-relatos/[id]        P-07                 /painel/relatos/[id]        S-13
/acompanhar               P-08 [proposta]      /painel/areas               S-14
/mapa                     P-09                 /painel/areas/[id]          S-15
/mapa?celula=…            P-10 (folha)         /painel/analises            S-16
/sobre                    P-11                 /painel/exportar            S-17
/ajustes                  P-12                 /painel/alertas             S-18 v0.2
/privacidade              P-13                 /painel/alertas/[id]        S-19 v0.2
/como-reconhecer          P-14                 /painel/campo               S-20 v0.2
/offline                  P-15                 /painel/campo/[id]          S-21 v0.2
                                               /painel/campo/[id]/visita   S-22 v0.2
SISTEMA                                        /painel/campo/visitas       S-23 v0.2
404                       X-01                 /painel/usuarios            S-24
erro                      X-02                 /painel/usuarios/convidar   S-25
/painel/sem-permissao     X-03                 /painel/usuarios/[id]       S-26
/painel/entrar?expirou=1  X-04                 /painel/municipio           S-27
                                               /painel/municipio/alertas   S-28 v0.2
                                               /painel/atividade           S-29 v0.2
                                               /painel/conta               S-30
```

### 13.4 Estruturas de navegação

**App público (mobile)**
- **Barra inferior com 4 abas:** Início · Mapa · Meus relatos · Mais.
  - "Mais" abre P-12 com links para P-11, P-13, P-14 e P-08.
  - "Meus relatos" mostra um contador de pendências.
- O botão "Relatar foco" é o protagonista de P-01. Também aparece como **botão flutuante** no Mapa (P-09) e em Meus relatos (P-06).
- **Dentro do fluxo de relato (P-02 a P-04) a barra inferior some.**
  - Cabeçalho com "← Voltar", "Passo N de 3" e "✕ Cancelar".
  - Cancelar com dados preenchidos pede confirmação: *"Descartar este relato?"* com "Continuar relato" e "Descartar".
- **Banner da fila** (§6.7) fixo abaixo do cabeçalho em qualquer tela pública enquanto houver pendências. Toque → P-06.
- **Desktop:** cabeçalho horizontal com os mesmos 4 destinos. O fluxo de relato fica centrado numa coluna de 480 px. O mapa ocupa a tela.

**Painel da equipe**
- **Desktop (≥ 1024 px):** barra lateral fixa de 240 px, recolhível para só ícones.
  - **Vigilância:** Visão geral · Mapa · Relatos · Áreas de risco · Análises · Alertas (v0.2, com contador) · Exportar
  - **Campo** (agente; vigilância vê só leitura): Fila de campo · Minhas visitas
  - **Administração** (só admin): Usuários · Município · Regras de alerta (v0.2) · Atividade (v0.2)
  - **Rodapé:** Minha conta · Sair · "Abrir app público ↗"
- **Cabeçalho:**
  - nome do município fixo;
  - filtro global de período (7 / 30 / 90 dias / personalizado), que vale para Visão geral, Mapa, Relatos, Áreas e Análises;
  - sino de alertas (v0.2);
  - menu do usuário.
- **Mobile (agente):** barra inferior **Fila · Mapa · Relatar · Conta**. "Relatar" abre o fluxo público P-02 dentro da casca do painel, e o "Pronto" volta para a Fila.
- **Mobile (vigilância/admin):** barra inferior **Visão · Mapa · Relatos · Mais**. "Mais" lista as demais seções.
- **Migalhas** nas telas de detalhe: "Relatos › #A3F2". O "Voltar" preserva filtros e posição da lista.

**Destino depois do login**

| Papel | Desktop | Celular |
|---|---|---|
| Agente | S-20 Fila | S-20 Fila |
| Vigilância | S-10 Visão geral | S-10 Visão geral |
| Admin | S-10 Visão geral | S-10 Visão geral |

### 13.5 Telas do app público

Formato: **conteúdo** · **ações → destino** · **estados**.

**P-01 Início** (`/`) · F01, F02, F05
- **Conteúdo:**
  - logo e frase de valor (§6.2);
  - botão "Relatar foco";
  - selo de anonimato;
  - cartão "Risco no seu município", um mini-mapa estático do grid com o nível predominante;
  - cartão "Como reconhecer um foco";
  - selo "Projeto acadêmico".
- **Ações:**
  - Relatar foco → P-02
  - Mini-mapa → P-09
  - Como reconhecer → P-14
  - Selo → P-11
  - Banner da fila → P-06
- **Estados:** primeira visita; com pendências; offline (o botão de relatar continua ativo).

**P-02 Passo 1: Foto** (`/relatar/foto`) · F01 (§6.3)
- **Ações:**
  - Abrir câmera → seletor do sistema → prévia
  - Galeria → prévia
  - Usar esta foto → P-03
  - ✕ → confirmação → P-01
- **Estados:** vazio; preparando foto; prévia; arquivo inválido; câmera negada.

**P-03 Passo 2: Local** (`/relatar/local`) · F01 (§6.4)
- **Ações:**
  - Usar minha localização → pede permissão → centra o mapa
  - Confirmar local → P-04
  - ← → P-02, mantendo a foto
- **Estados:** aguardando permissão; localizando; precisão boa; precisão ruim (> 50 m); GPS negado; fora da área (botão desabilitado); sem internet (mapa sem tiles: *"Sem internet o mapa não carrega, mas o GPS funciona. Confirme o ponto do GPS ou volte mais tarde."*).

**P-04 Passo 3: Tipo + enviar** (`/relatar/tipo`) · F01 (§6.5)
- **Ações:**
  - "alterar" no resumo → P-02 ou P-03
  - Enviar → P-05
  - "Não sei o tipo?" → P-14 em folha sobreposta, voltando para P-04
- **Estados:** nada selecionado (Enviar desabilitado, com dica *"Escolha o que você viu"*); selecionado; enviando (botão com spinner, toda a tela travada); erro de validação.

**P-05 Pronto** (`/relatar/pronto`) · F01, F02, F04, F06 (§6.6)
- **Ações:**
  - Relatar outro foco → P-02
  - Ver mapa → P-09
  - Ver meus relatos → P-06
  - Copiar protocolo [proposta]
  - Instalar app → diálogo do sistema
- **Estados:** recebido (online); salvo (offline); salvo por limite (PT429).

**P-06 Meus relatos** (`/meus-relatos`) · F02, F03
- **Conteúdo:**
  - lista local (miniatura, tipo, bairro/município, data relativa, carimbo de estado da §6.7);
  - no topo, um resumo *"3 enviados · 1 aguardando internet"* e o botão "Enviar agora" quando há pendências.
- **Ações:**
  - item → P-07
  - Enviar agora → força a sincronização
  - "Acompanhar por código" → P-08
- **Estados:** vazio (*"Você ainda não fez relatos neste aparelho."* + Relatar foco); com pendências; tudo enviado; erro definitivo em algum item.

**P-07 Detalhe do meu relato** (`/meus-relatos/[id]`) · F02, F03, F04
- **Conteúdo:**
  - foto (local, do aparelho);
  - tipo, data e município;
  - mini-mapa **do próprio aparelho**: ponto exato, porque o dado é da própria pessoa;
  - descrição;
  - linha do tempo de estado (local: salvo → enviado; **[proposta]** do servidor: recebido → em análise → visitado);
  - protocolo [proposta].
- **Ações:**
  - Tentar agora (pendente)
  - Corrigir e reenviar (erro definitivo) → P-03 ou P-04 com os dados
  - Apagar do aparelho, com confirmação. Pendente: *"Ele ainda não foi enviado e será perdido."* Já enviado: *"Some só deste celular; a vigilância continua com o relato."*
- **Estados:** 5 estados da §6.7 + 4 estados do servidor [proposta].

**P-08 Acompanhar relato** (`/acompanhar`) · F04 · [proposta]
- **Conteúdo:** campo para o código `SNT-XXXX`. O resultado é um cartão com status, data e município, **sem foto e sem local**, porque qualquer pessoa com o código veria.
- **Estados:** código inválido; não encontrado; encontrado em cada um dos 4 status do servidor.

**P-09 Mapa de risco** (`/mapa`) · F05 (§7)
- **Conteúdo:**
  - mapa;
  - seletor de município;
  - legenda recolhível;
  - "Atualizado há X";
  - botão flutuante "Relatar foco";
  - botão "Minha localização" (só centra o mapa, nada é enviado).
- **Ações:**
  - tocar numa célula → P-10
  - "O que isso significa?" → folha explicativa
  - Relatar foco → P-02
- **Estados:** carregando; sem áreas no período; offline (último mapa em cache, com aviso *"Mapa de [data]; sem internet agora"*); sem WebGL (lista por bairro como alternativa).

**P-10 Detalhe da célula** (folha sobre P-09) · F05
- **Conteúdo:** nível com rótulo e ícone, nº de relatos na janela, tendência (↑ ↓ =) e dica de prevenção curta.
- **Ações:** Relatar foco aqui → P-02, com P-03 já centrado na célula; fechar → P-09.

**P-11 Sobre** (`/sobre`) · F07
- **Conteúdo:**
  - o que é;
  - como funciona, em 3 passos ilustrados (você relata → agrupamos em áreas → a vigilância age);
  - quem faz (projeto acadêmico, instituição, contato);
  - *"Não é canal oficial"*, com telefone do serviço municipal;
  - código aberto (link do GitHub);
  - versão.
- **Ações:** → P-13, → P-14.

**P-12 Mais / Ajustes** (`/ajustes`) · F06, F07, F09
- **Conteúdo, em grupos:**
  - Aparência: tema claro/escuro/automático e modo sol [proposta];
  - App: Instalar na tela inicial, só se instalável;
  - Meus dados: Apagar dados deste aparelho;
  - Informação: links para Sobre, Privacidade, Como reconhecer e Acompanhar relato.
- **Apagar dados:** confirmação em duas etapas, com o texto *"Isso apaga seus relatos salvos neste celular e cria um novo código de aparelho. Relatos já enviados continuam com a vigilância. Relatos que ainda não foram enviados serão perdidos (N)."*

**P-13 Privacidade** (`/privacidade`) · F07: aviso em camadas (§6.9). Primeira camada no topo, "Ler política completa" expande a segunda. Âncoras por seção.

**P-14 Como reconhecer um foco** (`/como-reconhecer`) · F08
- **Conteúdo:**
  - 8 cartões ilustrados, um por tipo (§6.5), cada um com "onde costuma aparecer" e "o que fazer" (virar, tampar, escovar a borda, descartar);
  - um aviso: *"Não mexa em propriedade alheia: relate."*
- **Ações:** Relatar foco → P-02.

**P-15 Sem internet** (`/offline`) · F10
- Fallback do service worker para páginas que não estão no cache.
- Texto: *"Você está sem internet. Ainda dá para relatar: o relato fica salvo e sai sozinho depois."*
- **Ações:** Relatar foco → P-02; Meus relatos → P-06.

### 13.6 Telas do painel da equipe

**S-01 Entrar** (`/painel/entrar`) · F20
- **Conteúdo:** marca + "Área da equipe de saúde", e-mail, senha (mostrar/ocultar), "Esqueci minha senha" e link "Voltar ao app público".
- **Ações:** Entrar → destino por papel (§13.4); esqueci → S-02.
- **Estados:** erro neutro (*"E-mail ou senha incorretos."*); conta desativada (*"Seu acesso foi desativado. Fale com o administrador."*); sessão expirada (X-04 = esta tela com aviso); offline.

**S-02 Recuperar senha** (`/painel/recuperar-senha`) · F21
- **Conteúdo:** campo de e-mail.
- **Depois de enviar:** sempre a mesma resposta, *"Se o e-mail existir, enviamos um link."* Isso não revela se a conta existe.
- **Ações:** → S-01.

**S-03 Definir nova senha** (`/painel/nova-senha`) · F21, F22
- Chega pelo link do e-mail, de recuperação ou de convite.
- **Conteúdo:** nova senha + confirmação, regras visíveis enquanto digita (tamanho mínimo) e um título diferente no convite: *"Bem-vindo(a), defina sua senha"*.
- **Ações:** salvar → destino por papel.
- **Estados:** link expirado → *"Este link expirou"* + "Pedir outro" → S-02.

**S-10 Visão geral** (`/painel`) · F30 (§8.1–8.2)
- **Conteúdo:**
  - 4 KPIs;
  - mapa resumido;
  - lista "Prioridades" (top 5 ocorrências com "Por quê");
  - gráfico de tendência;
  - cartão de alertas abertos (v0.2).
- **Ações:**
  - KPI "Aguardando triagem" → S-12 filtrada
  - KPI "Áreas em Alto" → S-14 filtrada
  - ocorrência → S-15
  - mapa → S-11
  - gráfico → S-16
  - alerta → S-19
- **Estados:** sem dados no período; carregando; job de agregação atrasado (*"Áreas calculadas há 26 h. O cálculo automático pode estar parado."*).

**S-11 Mapa operacional** (`/painel/mapa`) · F31
- **Conteúdo:**
  - mapa em tela cheia;
  - painel de camadas: Áreas de risco · Relatos (pontos exatos, agrupados no zoom baixo) · Visitas (v0.2) · Contorno do município;
  - filtros: tipo, status, nível;
  - legenda.
- **Ações:**
  - ponto → cartão flutuante com miniatura, tipo, status, "Abrir" → S-13
  - célula → cartão com "Ver área" → S-15
  - desenhar retângulo para exportar a seleção → S-17 [proposta]
- **Estados:** camadas vazias; muitos pontos (agrupar).

**S-12 Relatos** (`/painel/relatos`) · F32, F38
- **Conteúdo:**
  - tabela: miniatura, código curto, tipo + grupo LIRAa, bairro/área, nível da área, status, recebido há, visitas;
  - busca por código;
  - filtros em chips;
  - ordenação;
  - paginação ou rolagem infinita.
  - No celular, vira lista de cartões.
- **Ações:** linha → S-13; seleção em lote → "Marcar como duplicado" e "Descartar" (v0.2); Exportar esta lista → S-17 com os filtros copiados.
- **Estados:** vazio; vazio por filtro (*"Nenhum relato com esses filtros"* + "Limpar filtros"); carregando.

**S-13 Detalhe do relato** (`/painel/relatos/[id]`) · F33, F38, F39
- **Conteúdo:**
  - foto grande via URL assinada, com zoom e um aviso caso contenha pessoas (*"Imagem de uso interno"*);
  - mapa com o ponto exato;
  - coordenadas com "copiar";
  - tipo + grupo LIRAa;
  - descrição;
  - área de risco a que pertence;
  - **linha do tempo de status** (`report_status_event`: de → para, origem cidadão/equipe/sistema, quem e quando);
  - visitas (`inspection`);
  - relatos próximos (mesma célula) como possíveis duplicados.
- **Ações:**
  - v0.2: Confirmar foco · Descartar (motivo obrigatório: duplicado / sem foco visível / imagem imprópria / fora de contexto) · Marcar resolvido
  - [proposta]: Encaminhar para agente
  - Ver área → S-15
  - Como chegar (abre app de mapas)
  - anterior/próximo da lista (teclas `j`/`k`)
- **Estados:** foto indisponível (URL expirou → recarrega sozinho); relato de outro município → X-03; ação em andamento; conflito (*"Este relato foi atualizado por Marta há 1 min."* + recarregar).

**S-14 Áreas de risco** (`/painel/areas`) · F34
- **Conteúdo:** lista ordenada por nível e tendência: nível, nº de relatos, variação vs. janela anterior, tipos predominantes, "calculada em". Alternância Lista | Mapa.
- **Ações:** área → S-15.
- **Estados:** nenhuma área no período.

**S-15 Detalhe da área** (`/painel/areas/[id]`) · F34, F39
- **Conteúdo:**
  - mapa da célula e vizinhas;
  - nível atual com histórico (mini linha do tempo de nível);
  - relatos da área, em lista compacta → S-13;
  - distribuição por tipo;
  - visitas feitas;
  - alertas da área (v0.2).
- **Ações:** Encaminhar área para agente [proposta]; Exportar relatos da área → S-17.

**S-16 Análises** (`/painel/analises`) · F35
- **Conteúdo:**
  - série de relatos por dia/semana, empilhada por nível;
  - barras por tipo de criadouro (rótulo do cidadão + grupo LIRAa);
  - ranking de áreas por crescimento;
  - tempo até a visita (v0.2).
- **Interação:** filtro de período global + comparação com o período anterior. Cada gráfico tem "Ver como tabela" (acessibilidade) e "Baixar CSV".
- **Estados:** dados insuficientes (*"Poucos relatos no período para mostrar tendência."*).

**S-17 Exportar** (`/painel/exportar`) · F36
- **Conteúdo:**
  - formulário: conjunto (relatos / áreas de risco / visitas), período, status, tipo e nível;
  - prévia das 5 primeiras linhas e contagem total;
  - aviso LGPD: *"O arquivo contém localização exata. Não compartilhe fora da equipe de saúde."*
- **Ações:** Baixar CSV.
- **Estados:** nenhuma linha; arquivo grande (gerando…).

**S-18 Alertas** (`/painel/alertas`) · F37 · v0.2
- **Conteúdo:** lista com área, regra disparada, quando, status (novo / ciente) e quem deu ciência. Abas: Novos · Todos.
- **Ações:** alerta → S-19; "Ciente" direto na linha.
- **Estados:** sem alertas (*"Nenhuma área cruzou o limiar."*).

**S-19 Detalhe do alerta** (`/painel/alertas/[id]`) · F37 · v0.2
- **Conteúdo:** regra (ex.: "≥ 5 relatos em 7 dias na célula"), valor observado, mini-mapa e relatos que dispararam.
- **Ações:** Dar ciência (registra quem e quando); Ver área → S-15; Encaminhar [proposta].

**S-20 Fila de campo** (`/painel/campo`) · F40, F43 · v0.2
- **Conteúdo:**
  - lista de ocorrências pendentes;
  - alternância de ordem: Prioridade | Mais perto de mim (pede GPS);
  - cada cartão tem tipo, bairro, distância, recebido há e nº de relatos;
  - indicador de sincronização das visitas offline.
- **Ações:** cartão → S-21; alternar para Mapa (S-11 simplificado).
- **Estados:** fila vazia (*"Nada pendente na sua área. Bom trabalho!"*); offline (fila do último download + aviso); visitas aguardando envio.

**S-21 Ocorrência em campo** (`/painel/campo/[id]`) · F41 · v0.2
- **Conteúdo:** foto, tipo, mapa com o ponto, descrição e relatos agrupados.
- **Ações:** **Como chegar** (abre Google Maps/Waze por intent); **Registrar visita** → S-22.
- **Layout:** botões de 56 px na zona do polegar.

**S-22 Registrar visita** (`/painel/campo/[id]/visita`) · F42 · v0.2
- **Conteúdo:**
  - resultado como 4 cartões grandes: **Foco confirmado** · **Foco eliminado na hora** · **Não era foco** · **Não encontrei o local** (`confirmed` / `resolved` / `dismissed` / `not_found`);
  - observações opcionais;
  - data e hora (agora, editável).
- **Ações:** Salvar → S-20, com toast *"Visita registrada"* ou *"Visita salva; será enviada quando houver internet"*.

**S-23 Minhas visitas** (`/painel/campo/visitas`) · F43, F44 · v0.2
- **Conteúdo:** histórico do agente por dia, com estado de sincronização por item (mesmos estados da §6.7).

**S-24 Usuários** (`/painel/usuarios`) · F50 · admin
- **Conteúdo:** tabela com nome, e-mail, papel (chip), status (ativo / convite pendente / desativado) e último acesso.
- **Ações:** Convidar → S-25; linha → S-26.

**S-25 Convidar usuário** (`/painel/usuarios/convidar`) · F50 · admin
- **Conteúdo:** nome, e-mail e papel (rádio com explicação de cada papel em 1 linha). O município é fixo, o do admin.
- **Ações:** Enviar convite → S-24 com toast.
- **Estados:** e-mail já cadastrado.

**S-26 Usuário** (`/painel/usuarios/[id]`) · F50 · admin
- **Conteúdo:** dados, papel editável, reenviar convite, **Desativar acesso** (confirmação com consequência explícita) e histórico de ações do usuário (v0.2).
- **Estados:** o admin não pode desativar a si mesmo.

**S-27 Município** (`/painel/municipio`) · F51 · admin
- **Conteúdo:** nome, código IBGE, mapa do contorno, totais e lista dos municípios atendidos pelo sistema (só leitura).

**S-28 Regras de alerta** (`/painel/municipio/alertas`) · F52 · v0.2
- **Conteúdo:**
  - editor simples: "Avisar quando uma área tiver ≥ [N] relatos em [D] dias" e nível mínimo;
  - prévia: *"Com esta regra, 4 áreas teriam disparado nos últimos 30 dias"*;
  - canal (no painel; e-mail [proposta]).

**S-29 Atividade** (`/painel/atividade`) · F53 · v0.2
- **Conteúdo:** registro cronológico de mudanças de status e de usuários: quem, o quê, quando e origem. Filtros por pessoa e tipo. Só leitura.

**S-30 Minha conta** (`/painel/conta`) · F23
- **Conteúdo:** nome, e-mail (só leitura), papel e município (só leitura), trocar senha, tema e sair.

### 13.7 Telas de sistema

| ID | Tela | Conteúdo | Ações |
|---|---|---|---|
| X-01 | Não encontrado | Ilustração de grid vazio + *"Esta página não existe."* | Ir ao início (público) / Visão geral (painel) |
| X-02 | Erro inesperado | *"Algo deu errado do nosso lado."* | Tentar de novo · Ir ao início. Nunca mostrar stack ou código |
| X-03 | Sem permissão | *"Seu perfil não tem acesso a esta área."* | Voltar ao destino do papel |
| X-04 | Sessão expirada | S-01 com faixa *"Sua sessão expirou. Entre de novo."* | Após login, volta à tela de origem |

**Padrões transversais** (aplicar em todas as telas):
- skeleton de carregamento com o formato do conteúdo, nunca spinner de tela cheia;
- estado vazio com ilustração + frase + ação;
- toasts no rodapé (mobile) ou canto inferior (desktop), com 5 s e "Desfazer" quando a ação for reversível;
- confirmação modal só para ações destrutivas;
- banner de sem-internet no painel: *"Sem conexão. Mostrando dados de [hora]."*

### 13.8 Jornadas para testar no protótipo

Cada jornada deve ser clicável de ponta a ponta.

| # | Jornada | Caminho |
|---|---|---|
| J1 | Relato online (caminho feliz) | P-01 → P-02 → P-03 → P-04 → P-05 → P-09 |
| J2 | Relato sem internet e envio depois | P-01 (offline) → P-02…P-04 → P-05 (salvo) → banner → P-06 → (volta a rede) → P-07 enviado |
| J3 | GPS negado | P-03 negado → arrastar mapa → P-04 |
| J4 | Fora da área | P-03 em Recife → botão desabilitado + mensagem → P-11 |
| J5 | Limite atingido | P-04 enviar → P-05 (salvo por limite) → P-06 "Vamos tentar de novo" |
| J6 | Consultar mapa e relatar ali | P-09 → P-10 → P-02 → P-03 centrado |
| J7 | Apagar dados do aparelho | P-12 → confirmação 1 → confirmação 2 → P-06 vazio |
| J8 | Acompanhar por código [proposta] | P-05 copiar → P-08 → resultado "Visitado" |
| J9 | Rotina semanal da vigilância | S-01 → S-10 → S-14 (Alto) → S-15 → S-13 → S-17 → CSV |
| J10 | Triagem em lote (v0.2) | S-10 KPI Aguardando → S-12 filtrada → selecionar 3 → Duplicado → toast "Desfazer" |
| J11 | Alerta (v0.2) | sino → S-18 → S-19 → Dar ciência → S-15 |
| J12 | Dia do agente (v0.2) | S-01 (celular) → S-20 → S-21 → Como chegar → S-22 offline → S-20 "1 visita aguardando" |
| J13 | Agente relata foco em campo | S-20 → aba Relatar → P-02…P-05 → S-20 |
| J14 | Admin convida agente | S-24 → S-25 → toast → S-03 (visão do convidado) → S-20 |
| J15 | Esqueci a senha | S-01 → S-02 → e-mail → S-03 → S-10 |
| J16 | Sessão expirada | S-13 → X-04 → S-01 → S-13 |

**Modo demonstração do protótipo** (não vai para o produto). Um botão flutuante discreto "Demo" abre um painel com:
- **Papel:** Cidadão · Agente · Vigilância · Admin. A troca leva ao destino do papel.
- **Simular:** Offline · GPS negado · GPS impreciso · Fora da área · Limite (PT429) · Erro inesperado · Lista vazia · Primeira visita.
- **Dispositivo:** celular 360×800 · tablet 768×1024 · desktop 1440×900.
- **Tema:** claro · escuro · modo sol.
- **Mostrar selos "Em breve":** liga/desliga.

### 13.9 Dados de exemplo para o protótipo

Os dados são fictícios mas plausíveis. Não usar nomes ou endereços reais de pessoas.

**Lugares e pessoas**
- **Municípios:** João Pessoa (IBGE 2507507) e Cabedelo (2503209).
- **Bairros de JP:** Valentina, Mangabeira, Cristo Redentor, Bairro dos Estados, Manaíra, Torre, Gramame.
- **Bairros de Cabedelo:** Centro, Intermares, Poço.
- **Equipe (JP):**
  - Renato Albuquerque, vigilância;
  - Marta Silva, agente;
  - José Nunes, agente;
  - Ana Costa, admin;
  - 1 convite pendente: Paula Ramos, agente.

**Relatos**
- **80 relatos em 60 dias**, com pico nas últimas 2 semanas em Valentina e Mangabeira.
- **Por tipo:** pneu 18, caixa d'água 14, vaso/prato 16, lixo/entulho 12, calha 6, piscina 4, recipiente diverso 8, outro 2.
- **Por status:** pending 45, confirmed 18, dismissed 9, resolved 8.

**Áreas de risco:** 28 células com relato: 6 Alto, 9 Médio, 13 Baixo. Mais células "Sem dados" (abaixo do limiar k).

**Visitas e alertas**
- 30 visitas (`inspection`): confirmed 12, resolved 8, dismissed 6, not_found 4.
- 3 alertas: 2 novos (Valentina, Mangabeira) e 1 ciente (Torre, ciência de Renato).

**Aparelho do cidadão (Meus relatos):** 4 relatos locais, um em cada estado (enviado, aguardando internet, vamos tentar de novo, precisa de atenção). Um enviado tem protocolo `SNT-7K3P` [proposta].

**Fotos:** usar ilustrações ou fotos genéricas de recipientes com água, **sem pessoas, placas ou números de casa**, coerentes com a regra que o próprio app ensina.

## 14. Entregáveis esperados do Claude Design

1. **Design system:** tokens (cores claro/escuro, escala de risco, tipo, espaço, raio), componentes e ícones dos 8 tipos de criadouro + símbolo gota-mira.
   - Componentes: botão (primário, secundário, link), cartão de tipo, chip, banner de fila, carimbo de status, campo de texto com contador, folha inferior, legenda de mapa, KPI, item de fila, tabela, linha do tempo de status, toast, modal de confirmação, skeleton, estado vazio, barra lateral, barra inferior.
2. **Protótipo navegável completo**, cobrindo **todas as telas do §13** (P-01…P-15, S-01…S-30, X-01…X-04) ligadas pela navegação do §13.4.
   - Inclui o modo demonstração e os dados de exemplo do §13.9.
   - O app público é desenhado em mobile e desktop; o painel em desktop e celular.
3. **Todos os estados** listados em cada tela. No mínimo, as jornadas J1–J16 do §13.8 precisam ser clicáveis de ponta a ponta.
4. **Fidelidade:** alta para MVP; média é aceitável para v0.2 e [proposta], que levam o selo "Em breve" no modo demonstração.
5. **Checagem:** contraste de todos os pares usados, simulação de daltonismo da escala de risco e teste das telas com zoom de 200 %.

**Fora do escopo do design agora:** cadastro de cidadão (não existe por decisão), notificações por SMS/WhatsApp e integração com e-SUS/SINAN.

## 15. Fontes da pesquisa (2026-10-08)

**Formulários e civic tech**
- GOV.UK Design System, *Question pages*: https://design-system.service.gov.uk/patterns/question-pages
- GOV.UK, *One thing per page*: https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/
- FixMyStreet, experiência do cidadão: https://fixmystreet.org/pro-manual/citizens-experience/
- Nesta, FixMyStreet: https://www.nesta.org.uk/feature/civic-exchange/fixmystreet/
- web.dev, *User location*: https://web.dev/articles/user-location
- Lighthouse, geolocalização ao carregar: https://developer.chrome.com/docs/lighthouse/best-practices/geolocation-on-start

**Apps de dengue e engajamento**
- Aedes na Mira (PB): https://www.conass.org.br/?p=4510
- Dengue SC: https://condominiosc.com.br/radar/2423-governo-lanca-aplicativo-de-celular-para-denuncias-de-focos-de-aedes-aegypti-em-santa-catarina
- Goiânia Contra o Aedes: https://www.maisgoias.com.br/cidades/goiania-contra-o-aedes-aplicativo-ajuda-a-denunciar-criadouros-do-mosquito/
- SOS Dengue (SBC, 2024): https://sol.sbc.org.br/index.php/ercemapi/article/view/30166
- NEA myENV (Singapura): https://www.nea.gov.sg/myENV
- Mosquito Alert, retenção de participantes: https://openpub.fmach.it/retrieve/b2352ba2-53a0-4bcf-8fad-fb5fd13a248a/2024%20STE%20Da%20Re.pdf
- GLOBE Mosquito Habitat Mapper: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9316649/
- Mo-Buzz, adoção por inspetores: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5643840/
- Mozzify, avaliação de usabilidade (MARS): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7978406/

**PWA e offline**
- web.dev, prompt de instalação: https://web.dev/learn/pwa/installation-prompt
- browser-image-compression: https://www.npmjs.com/package/browser-image-compression

**Acessibilidade e linguagem**
- W3C, novidades da WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Contraste sob luz solar (NTNU): https://ntnuopen.ntnu.no/ntnu-xmlui/handle/11250/2588645
- Lei 15.263/2025, Linguagem Simples: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15263.htm

**gov.br**
- gov.br DS 4.0: https://www.serpro.gov.br/menu/noticias/noticias-2024/design-system-4.0
- Manual de marca: https://www.gov.br/sri/pt-br/central-de-conteudo/manuais/enpp-manual/00_enpp-manual-da-marca-v1.pdf

**Mapas e privacidade espacial**
- LIRAa, classificação de risco: https://www.saude.mg.gov.br/wp-content/uploads/2019/11/LIRAaLIAoutubro2019-c1f.pdf
- LIRAa, grupos de depósito: https://www.saude.df.gov.br/documents/37101/554390/LIRAa_Novembro_2021_Versao_final.pdf
- Decisão MapLibre (caso público): https://git.lsit.ucsb.edu/publicdata/j40-cejst-2/src/branch/main/docs/decisions/0007-maplibre.md
- Supressão de células com contagem baixa: https://arxiv.org/pdf/2509.12950
- Protomaps: https://github.com/Overlandmap/protomaps

**Painéis e alertas**
- Princípios de painéis de saúde pública (BMC 2024): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10848508/
- Fadiga de alerta: https://eudl.eu/doi/10.4108/eai.13-7-2017.152886

**LGPD**
- Consulta da ANPD sobre anonimização: https://www.mayerbrown.com/pt/insights/publications/2024/02/anonymization-and-pseudonymization-anpd-kicks-off-public-consultation-on-preliminary-study

**Tipografia**
- Atkinson Hyperlegible Next: https://teaching.nmc.edu/theres-a-new-font-in-town/
- Bricolage Grotesque: https://fontsource.org/fonts/bricolage-grotesque/cdn

**Lacunas conhecidas da pesquisa**
- As páginas de gov.br/ds não carregaram, então os princípios oficiais não foram conferidos.
- Os grupos LIRAa D1/D2/E precisam ser conferidos no manual do Ministério da Saúde.
- O limiar k de supressão de células será definido na fase 3.
- O prazo de retenção (LGPD) segue pendente.

---

## 16. Decisões em aberto para o dono do produto

1. O protocolo + consulta de status pelo cidadão (**[proposta]** §6.6/§6.7) entra no MVP? Exige uma RPC pública nova (plano futuro).
2. A janela do mapa público será de 30 dias? E qual o limiar k de supressão? (fase 3)
3. Qual nome da instituição e do responsável aparece em "Sobre" e na política de privacidade?
4. "Modo sol" entra no MVP ou na v0.2?
5. O relato feito por agente logado deve registrar autoria ou origem "equipe"? Hoje `submit_report` grava tudo como anônimo/cidadão (§13.1).
6. Motivo de descarte (S-13) e encaminhamento para agente (F39) não existem no schema. Entram na v0.2 junto com a triagem?
7. Usuários, convite e desativação (S-24…S-26) precisam de RPC ou Edge Function com privilégio de admin. Hoje as contas são criadas manualmente. Isso entra no MVP (fase 4) ou fica manual até a v0.2?
8. Mudar o papel de um usuário (S-26) e definir as regras de alerta (S-28) ficam só com o admin? A proposta é que sim.

*Handoff criado em 2026-10-08. Não altera o loop PAUL: o próximo passo continua sendo `/paul:plan` para o 02-02, que deve usar a §6 deste documento como especificação de UI.*
