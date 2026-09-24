---
phase: 01-fundacao
plan: 01
subsystem: infra
tags: [nextjs, typescript, pnpm, vitest, testing-library, eslint, github-actions, dependabot]

requires: []
provides:
  - App Next.js 16 (App Router, TS strict) com página placeholder "Sentinela"
  - Harness de teste Vitest 5 + Testing Library (jsdom) com cobertura v8/lcov
  - Pipeline CI no GitHub Actions (install → lint → typecheck → test:coverage → build)
  - Dependabot semanal para github-actions e npm
affects: [01-02 schema/RLS, 01-03 deploy, fase 2 relato, fase 3 cobertura ≥70% no núcleo]

tech-stack:
  added: [next@16.3.6, react@19.2.8, typescript@5.9.3, eslint@9.39.5, eslint-config-next@16.3.6, tailwindcss@4.3.3, vitest@5.0.1, "@vitest/coverage-v8@5.0.1", "@vitejs/plugin-react@6.1.1", jsdom@30.1.1, "@testing-library/react@16.3.3", "@testing-library/dom@10.4.2", "@testing-library/jest-dom@7.0.1"]
  patterns:
    - "typecheck = next typegen && tsc --noEmit (tipos de rota globais vivem em .next/types)"
    - "Actions de terceiros fixadas por SHA completo com tag em comentário"
    - "Testes co-localizados: src/**/*.test.{ts,tsx}"

key-files:
  created: [package.json, pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig.json, eslint.config.mjs, vitest.config.mts, vitest.setup.ts, src/app/layout.tsx, src/app/page.tsx, src/app/page.test.tsx, .github/workflows/ci.yml, .github/dependabot.yml, .nvmrc, AGENTS.md, CLAUDE.md]
  modified: [README.md, .gitignore]

key-decisions:
  - "typecheck roda next typegen antes do tsc"
  - "Sem next/font/google: fonte de sistema, build não depende de rede"
  - "Vite 8 resolve.tsconfigPaths nativo em vez de vite-tsconfig-paths"
  - "AGENTS.md/CLAUDE.md do Next 16 versionados"

patterns-established:
  - "Qualquer comando novo de qualidade entra em package.json E no ci.yml na mesma ordem"
  - "Mudanças em .github/workflows exigem token gh com escopo workflow"

duration: ~15min (APPLY)
started: 2026-09-24T17:52:00Z
completed: 2026-09-24T18:03:22Z
description: "Next.js 16 + TS strict com Vitest/Testing Library e CI GitHub Actions (SHA-pinned) verde em 33s"
type: Summary
about: "sentinela"
---

# Phase 1 Plan 01: Scaffold + CI Summary

**Next.js 16.3.6 (App Router, TS strict, pnpm 11) com Vitest 5 + Testing Library e pipeline GitHub Actions SHA-pinned — CI verde em 33s no primeiro push.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15min (APPLY) |
| Started | 2026-09-24T17:52Z |
| Completed | 2026-09-24T18:03Z |
| Tasks | 4 of 4 completed (3 auto PASS + 1 checkpoint aprovado) |
| Files | 17 criados, 2 modificados |
| CI | run [36038508664](https://github.com/dobidu/sentinela/actions/runs/36038508664) — success, 33s |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: App Next.js sobe e compila | Pass | `pnpm build` exit 0; dev serve `<h1>Sentinela</h1>` + `<title>Sentinela</title>` (verificado na porta 3123 — 3000 ocupada localmente) |
| AC-2: Gates de qualidade locais | Pass | lint/typecheck/test exit 0; 1 teste passando; `strict: true` |
| AC-3: Gate falha quando deve | Pass | asserção falsa → `pnpm test` exit 1; erro de tipo → `pnpm typecheck` exit 2 (TS2322); ambos revertidos |
| AC-4: Pipeline de CI válido e verde | Pass | actionlint exit 0; run no GitHub success em todos os passos; artifact `coverage-lcov` publicado |
| AC-5: Arquivos existentes preservados | Pass | `git diff LICENSE` vazio; README +21/−0; .gitignore só acréscimos (0 linhas removidas) |
| AC-6: Reprodutível a partir de árvore limpa | Pass | Cópia rsync sem node_modules/.next/coverage/next-env.d.ts: install/lint/typecheck/test:coverage/build exit 0; lint exit 0 após coverage/.next existirem; nenhum "Ignored build scripts" |
| AC-7: Supply chain do CI controlada | Pass | 4/4 `uses:` por SHA; `persist-credentials: false`; `contents: read`; dependabot.yml presente |

## Accomplishments

- Repositório reprodutível: clone limpo + `pnpm install --frozen-lockfile && pnpm build` funciona, provado em cópia isolada e no runner do GitHub.
- Gate de CI comprovadamente não-vazio (falhas provocadas quebram teste e tipo).
- Supply chain do CI endurecida desde o primeiro commit (SHA pin, sem credenciais persistidas, Dependabot).

## Task Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| Plano/roadmap (.paul) | `83b8da6` | docs | Roadmap v0.1, plano 01-01 + audit, handoff arquivado |
| Tasks 1–3 | `0104f41` | chore | Scaffold Next.js, Vitest, CI, Dependabot, README |

Tasks 1–3 num único commit (auto_commit: false; commit feito no checkpoint, conforme plano).

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `package.json` | Created | Scripts dev/build/start/lint/typecheck/test/test:watch/test:coverage; `packageManager: pnpm@11.9.0`; `engines.node >=24` |
| `pnpm-lock.yaml` | Created | Lockfile congelado no CI |
| `pnpm-workspace.yaml` | Created | `allowBuilds`: sharp/unrs-resolver explicitamente `false` |
| `tsconfig.json` | Created | TS strict, alias `@/*` → `src/*` |
| `next.config.ts`, `postcss.config.mjs` | Created | Config padrão do template (Tailwind 4) |
| `eslint.config.mjs` | Created | next core-web-vitals + typescript; ignora `.next/`, `out/`, `build/`, `coverage/`, `next-env.d.ts` |
| `vitest.config.mts`, `vitest.setup.ts` | Created | jsdom, `resolve.tsconfigPaths`, cobertura v8 text+lcov, jest-dom matchers |
| `src/app/layout.tsx`, `page.tsx`, `globals.css` | Created | Layout pt-BR + placeholder "Sentinela" |
| `src/app/page.test.tsx` | Created | Teste de fumaça do heading |
| `.github/workflows/ci.yml` | Created | Pipeline CI |
| `.github/dependabot.yml` | Created | Atualizações semanais (actions + npm agrupado minor/patch) |
| `.nvmrc` | Created | Node 24 |
| `AGENTS.md`, `CLAUDE.md` | Created | Regras de agente do Next 16 (gerados por `next dev` sob agente) |
| `README.md` | Modified | Badge CI + seção "Desenvolvimento" (só acréscimos) |
| `.gitignore` | Modified | + `/coverage`, `*.tsbuildinfo`, `next-env.d.ts`, `.vercel`, `.pnpm-debug.log*`, `.serena/` |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `typecheck` = `next typegen && tsc --noEmit` | `tsc` puro falha num clone limpo: `Cannot find name 'LayoutProps'` (tipo global gerado em `.next/types`) | CI roda typecheck antes do build sem depender de artefato |
| Remover `next/font/google` | Build não depende de rede externa (Google Fonts); menos variáveis no CI | Fonte de sistema; revisitar se design da fase 2 exigir fonte própria |
| `resolve.tsconfigPaths` nativo do Vite 8 | Remove dependência `vite-tsconfig-paths` | Uma dev dep a menos |
| Versionar `AGENTS.md`/`CLAUDE.md` | Next 16 recria em `next dev` sob agente; versionar mantém árvore limpa (decisão do usuário) | Agentes são orientados a ler docs da versão instalada |
| `@types/node` ^24 | Alinhar com `.nvmrc`/engines | — |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 2 | Previstos pelo audit; essenciais |
| Scope adjustments | 5 | Simplificações/alinhamentos, sem scope creep |
| Deferred | 1 | README desatualizado |

**Total impact:** Correções essenciais previstas no audit; nenhuma expansão de escopo.

### Auto-fixed Issues

**1. Typecheck dependente de `.next/`**
- **Found during:** Task 1 — **Issue:** `tsc --noEmit` sem `.next/` → TS2304 `LayoutProps` — **Fix:** script `next typegen && tsc --noEmit` — **Verification:** `rm -rf .next next-env.d.ts && pnpm typecheck` exit 0; idem na cópia limpa e no CI

**2. ESLint lintando `coverage/lcov-report`**
- **Found during:** Task 2 — **Issue:** warning em `coverage/lcov-report/block-navigation.js` após `test:coverage` — **Fix:** `coverage/**` em `globalIgnores` — **Verification:** `pnpm lint` exit 0 com `coverage/` presente

### Scope adjustments

1. `vite-tsconfig-paths` não usado (Vite 8 nativo) — plano listava a dependência.
2. `next/font/google` removido do layout do template.
3. `public/` (SVGs demo) e `favicon.ico` do template não copiados.
4. `AGENTS.md` + `CLAUDE.md` adicionados (não previstos em `files_modified`) — decisão do usuário no checkpoint.
5. `allowBuilds` do `pnpm-workspace.yaml` já veio explícito do template; plano previa criá-lo manualmente.

### Deferred Items

- README: seções "Status: planejamento (v0.0.0)" e "Roadmap" (lista antiga de 6 fases) desatualizadas — boundary "só acréscimos" impediu edição. Corrigir num plano futuro (ex.: 01-03 ou fase 5 de documentação).

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Push rejeitado: token OAuth sem escopo `workflow` para criar `.github/workflows/ci.yml` | Usuário rodou `gh auth refresh -h github.com -s workflow`; push refeito |
| Porta 3000 ocupada por outro projeto local (dubplate, Next 16.2.4) | Verificação do dev server em `--port 3123`; processo alheio não tocado |
| `pkill -f "next dev"` matou o próprio shell (padrão casou com a linha de comando) | Processos checados por PID; nenhum resíduo do sentinela |

## Next Phase Readiness

**Ready:**
- Gate de CI pronto para receber checagem de migrations (01-02) e deploy (01-03).
- Harness Vitest pronto para testes do núcleo (validação de relato, agregação).

**Concerns:**
- Cobertura atual 33% (só `page.tsx` coberto; `layout.tsx` não) — irrelevante agora; threshold ≥70% por diretório do núcleo entra na fase 3.
- ESLint 9 marcado "deprecated" pelo pnpm (10.x disponível); `eslint-config-next@16.3.6` pede ESLint 9 — Dependabot vai propor, avaliar compatibilidade antes de aceitar.
- Pushes diretos em `main` não são bloqueados por CI (branch protection deferida).

**Blockers:** None

---
*Built with PAUL Framework v1.4 · https://chrisai.cv/skool · https://youtube.com/@chris-ai-systems*
*Phase: 01-fundacao, Plan: 01*
*Completed: 2026-09-24*
