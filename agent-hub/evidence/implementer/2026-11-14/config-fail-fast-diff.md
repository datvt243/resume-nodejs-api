# config-fail-fast — implement (implementer)

- Date: 2026-11-14 · Branch: `458-config-fail-fast` · Issue: #458
- Node: `config-fail-fast` (`haven/diagrams/dev-loop.prime-mermaid.md`) · Plan: `evidence/implementer/2026-11-14/config-fail-fast-plan.md`
- Status: sealed_pending_verifier

## Diff summary
- `src/config/process.config.ts`: the warn-only `requiredEnvVars` block is replaced by an exported `checkEnv(env = process.env)` run at import. Joi schema: `TOKEN_SECRET`/`TOKEN_REFRESH`/`SESSION_SECRET` string min 32 required; `MONGOBD_USER`/`MONGOBD_PASSWORD` required only when `MONGO_URI` is absent; `LOCAL_PORT`/`MONGO_MAX_POOL_SIZE`/`MONGO_MIN_POOL_SIZE`/`TRUST_PROXY_HOPS` optional numbers; `.unknown(true)`. Empty-string vars are dropped before validation (= unset, matching every consumer). `NODE_ENV=production` + any error → `throw new Error('Invalid environment variables:\n- ...')`; elsewhere only `any.required` errors → `console.warn`. Exports unchanged.
- `src/__tests__/config/process.config.test.ts` (new): 17 cases.
- `jest.setup.ts`, `session.config.ts`, `mongo.db.ts`, `server.ts`: unchanged.

## Commands (verbatim from doctrine/MEMORY.md)
- Test one file: `npx jest src/__tests__/config/` → `Test Suites: 5 passed, 5 total` / `Tests:       43 passed, 43 total`
- Test: `npm test` → `Test Suites: 2 failed, 67 passed, 69 total` / `Tests:       5 failed, 703 passed, 708 total`. The 5 failures are exactly: tokenExpiry "falls back to a 1h access token when TOKEN_EXP_IN is unset" + 4 × "ATS PDF integration (real Puppeteer + pdf-parse)". Pre-existing: same 5 failed on a clean `staging` worktree this session (`Tests: 5 failed, 2 passed, 7 total` for those two files), and the last 5 SEALED commits on staging record the same 5 env-only failures (local `.env` TOKEN_EXP_IN, no local Chrome). With `CI_NO_CHROME=1`: `Tests: 1 failed, 4 skipped, 699 passed` (before the review fix) — only tokenExpiry left.
- Typecheck (`inside Build`): `npm run build` → exit 0
- Lint: `npm run lint` → `✖ 274 problems (274 errors, 0 warnings)` = baseline 274; `npx eslint src/config/process.config.ts src/__tests__/config/process.config.test.ts` → exit 0 (none in changed files)

## Acceptance criteria → evidence
| # | Criterion | Evidence |
|---|---|---|
| 1 | `npx jest src/__tests__/config/` covers listed cases | 43/43 passed; process.config.test.ts cases listed below |
| 2 | Prod boot missing/short `TOKEN_SECRET` exits non-zero, names var, nothing listens | real boot below: exit 1, message names TOKEN_SECRET, 0 listeners on 39458 |
| 3 | Dev boot `TOKEN_SECRET` unset warns naming it, keeps starting | real boot below: warning names TOKEN_SECRET, process still running at 8s alarm (exit 142), Mongo connected |
| 4 | `npm test` passes, `jest.setup.ts` unchanged | `git diff --stat -- src` touches only process.config.ts (+ new test); suite failures = pre-existing 5 only (see Commands) |
| 5 | `npm run build` passes | exit 0 |
| 6 | Matches `features/startup-config-env.md` Behavior #2-#5 | Behavior 2 = schema; 3 = prod throw lists every failing var (abortEarly false); 4 = dev warn on missing only, short secret silent (test); 5 = MONGO_URI-only passes in prod and dev, no MONGOBD_* warning (tests) |
| — | Comments per `doctrine/standards/code-comments.md` | 1 JSDoc on exported `checkEnv` (WHY: prod vs elsewhere), 1 `//` WHY for empty-string drop; no issue refs |

### Test cases (process.config.test.ts, `npx jest` output)
- ✓ production: a valid config passes, numeric vars unset (1 ms)
- ✓ production: TOKEN_SECRET missing → throws naming it (10 ms)
- ✓ production: TOKEN_REFRESH of 31 chars → throws (1 ms)
- ✓ production: SESSION_SECRET of 31 chars → throws
- ✓ production: only MONGO_URI (no MONGOBD_*) passes
- ✓ production: blank vars count as unset (MONGO_URI + blank MONGOBD_*, blank numeric vars) → passes
- ✓ production: blank MONGO_URI with valid MONGOBD_* → passes
- ✓ production: blank TOKEN_SECRET → throws naming it (1 ms)
- ✓ production: neither MONGO_URI nor both MONGOBD_* → throws
- ✓ production: LOCAL_PORT=abc → throws
- ✓ production: MONGO_MAX_POOL_SIZE=abc → throws (1 ms)
- ✓ production: MONGO_MIN_POOL_SIZE=abc → throws
- ✓ production: TRUST_PROXY_HOPS=abc → throws
- ✓ development: missing secret warns naming it, does not throw
- ✓ development: MONGO_URI + blank MONGOBD_* does not warn (1 ms)
- ✓ development: a short secret neither throws nor warns
- Tests:       16 passed, 16 total

### Real boot — production (`NODE_ENV=production TOKEN_SECRET=short LOCAL_PORT=39458 node dist/server.js`, after `npm run build`)
```
exit 1
Error: Invalid environment variables:
- "TOKEN_SECRET" length must be at least 32 characters long
- "TOKEN_REFRESH" length must be at least 32 characters long
- "SESSION_SECRET" length must be at least 32 characters long
listeners on 39458: 0
```
### Real boot — development (`NODE_ENV=development TOKEN_SECRET= LOCAL_PORT=39459`, 8s alarm)
```
exit 142 (killed by alarm = still running)
⚠️  Missing required environment variables:
- "TOKEN_SECRET" is required
info: [MongoDB] Connected! {"service":"resume-api-backend","timestamp":"2026-11-14 20:08:15"}
```

## Review
- `/code-review medium` (forked): 4 findings, all correctness, same root cause — blank `KEY=` vars (as in the .env templates / docker-compose.prod.yml env_file) failed `string.empty`/`number.base`, so a MONGO_URI-only prod deploy with blank `MONGOBD_*`, or a blank optional numeric var, would refuse to boot; dev warned falsely about blank MONGOBD_*. **Fixed** once: drop `''` values before validation; dev filter now `any.required` only. +4 tests (blank MONGOBD_* with MONGO_URI passes in prod; blank MONGO_URI with MONGOBD_* passes; blank TOKEN_SECRET throws; dev MONGO_URI + blank MONGOBD_* no warning). Commands re-run after the fix (outputs above are post-fix).
- Reviewer's out-of-spec notes (`LOCAL_PORT=1.5`/`70000` accepted by `Joi.number()`): the spec only requires "a number" → not done, see below.
- `/security-review` (label `security`): no findings ≥ 8 confidence. Error/warn text comes from Joi messages for `any.required`/`string.min`/`number.base`, which name the key, never the value — secrets are not printed (confirmed in the real prod boot output above).

## Supersedes: none
`grep -n "#458" haven/diagrams/dev-loop.prime-mermaid.md` → only this node.

## Feature doc: agent-hub/doctrine/features/startup-config-env.md
Not changed by the implementer (no contradiction with Behavior).

## Noticed, not done
- Deploy risk for the operator: production now refuses to boot unless `TOKEN_SECRET`, `TOKEN_REFRESH`, `SESSION_SECRET` are each ≥ 32 chars. The local `.env` fails this (real prod-mode boot above lists all three); Render's values were not checked (no access). Check before `/release`.
- `Joi.number()` accepts non-integer / out-of-range ports (`1.5`, `70000`) — spec says "a number"; tighten in a follow-up if wanted.
- tokenExpiry test reads the local `.env` `TOKEN_EXP_IN` (pre-existing, not in scope).
