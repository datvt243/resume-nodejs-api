# 2026-11-16 — ci-lint-ratchet (diff)
- Worker: implementer · Version 0.1.0
- Node: `ci-lint-ratchet` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: `#462 CI: run lint on push / PR — .github/workflows/node.js.yml runs only npm ci, build and test. Add - run: npm run lint after npm ci. Optional: a pre-commit hook (husky + lint-staged).`
- Branch: `chore/462-ci-run-lint` (from `staging` @ a6a2c65)
- Status: sealed_pending_verifier
- Plan: `evidence/implementer/2026-11-16/ci-lint-ratchet-plan.md`

## Hub bytes before: 97624
## Feature doc: none

## Diff
`.github/workflows/node.js.yml` (+7), after `- run: npm ci`:
```
    # Ratchet: fail only on errors above the pre-existing baseline; lower LINT_BASELINE as errors get fixed, never raise it.
    - name: Lint (ratchet)
      env:
        LINT_BASELINE: 274
      run: |
        npx eslint . -f json -o eslint-report.json || true
        node -e 'const n = require("./eslint-report.json").reduce((a, f) => a + f.errorCount, 0); console.log(`ESLint errors: ${n} (baseline ${process.env.LINT_BASELINE})`); if (n > Number(process.env.LINT_BASELINE)) process.exit(1);'
```
No `src/` change. One why-comment added (per `doctrine/standards/code-comments.md`: explains the non-obvious baseline rule, not the what).
`|| true` only swallows eslint's own exit 1 for errors; if eslint dies before writing the report, `require` throws → step fails (criterion 3).

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api`:
- Exact step body extracted from the YAML by node regex, run with `LINT_BASELINE=274` then `=273` via `bash -e -c "$STEP"`; then `rm -f eslint-report.json`; missing-report case `node -e 'require("./eslint-report.json")'`.
- `ruby -ryaml -e '...steps.map{name||run||uses}'` (YAML parse + order)
- `npm run build` (Typecheck row: inside Build), `npm test`

## Output
```
--- LINT_BASELINE=274
ESLint errors: 274 (baseline 274)
exit=0
--- LINT_BASELINE=273
ESLint errors: 274 (baseline 273)
exit=1
--- missing report (eslint crashed)
exit=1
actions/checkout@v4
Use Node.js ${{ matrix.node-version }}
npm ci
Lint (ratchet)
npm run build --if-present
npm test
```
`npm run build`: `build exit=0`
`npm test`:
```
Test Suites: 72 passed, 72 total
Tests:       781 passed, 781 total
```
Lint count before change (staging, `npx eslint . -f json` summed): `errors 274 files 55` — = `doctrine/MEMORY.md` baseline 274.

## Acceptance
1. Lint step right after `npm ci`, triggers unchanged (push/PR on main, staging) — diff + step list ✅
2. 274 → exit 0; baseline 273 → exit 1 ✅
3. Missing report → exit 1 ✅
4. YAML parses, order checkout/setup/ci/lint/build/test ✅
5. build exit 0, 781/781 ✅
- Comments per code-comments.md: 1 why-comment ✅

## Review
`/code-review` not run as a skill (7-line YAML diff); inline pass over the whole workflow file:
- Lint runs once per matrix node (20.x, 22.x) — duplicate but cheap; kept, no matrix split (SmallestDiff).
- Only `errorCount` counted; warnings ignored — current warnings 0, rule set is all `error`. Fine.
- `eslint-report.json` written into the CI checkout only, not committed; build/test don't read it.
No correctness/security findings.

## Supersedes: none
## Still open: none

## Noticed, not done
- Optional husky + lint-staged pre-commit hook (issue: "Optional") — skipped, adds 2 devDeps.
- `doctrine/MEMORY.md` Lint row could point at `LINT_BASELINE` in the workflow as the enforced number; not edited (verifier/operator call).
