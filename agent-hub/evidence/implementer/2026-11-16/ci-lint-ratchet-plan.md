# 2026-11-16 — ci-lint-ratchet (plan)
- Worker: implementer · Version 0.1.0
- Node: `ci-lint-ratchet` (`haven/diagrams/dev-loop.prime-mermaid.md`, new PENDING row; slug/#462 absent from active + archive diagrams)
- Task: `#462 CI: run lint on push / PR — .github/workflows/node.js.yml runs only npm ci, build and test. Add - run: npm run lint after npm ci. Optional: a pre-commit hook (husky + lint-staged).`
- Branch: `chore/462-ci-run-lint` (from `staging` @ a6a2c65; name per new `PROJECT.md` convention `<type>/<issue>-<desc>`)

## Hub bytes before: 97624
## Feature doc: none (CI config, no product feature; no INDEX row)

## Operator decision
`npm run lint` on staging = 274 errors in 55 files (= `doctrine/MEMORY.md` Lint baseline). Adding it blocking as written would fail every PR. AskUserQuestion 2026-11-16 → "Ratchet on count (Recommended)": CI fails only if ESLint errors > checked-in baseline 274.

## Acceptance
1. Workflow has a lint step right after `npm ci`, on the existing push/PR triggers (`main`, `staging`).
2. Step exits 0 at the current count (274 ≤ 274) and exits 1 when count > baseline — shown by running the exact step body locally with `LINT_BASELINE=274` and `=273`.
3. ESLint crashing without a report fails the step (no silent pass).
4. Workflow YAML parses; step order = checkout, setup-node, npm ci, Lint, build, test.
5. `npm test` + `npm run build` (Typecheck: inside Build) green.

## Scope cut
Optional husky + lint-staged pre-commit hook: not done (issue marks it optional; adds 2 devDeps).
