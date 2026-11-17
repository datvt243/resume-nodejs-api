# Plan — remove-express-session-unused-deps (#464)

- Issue: #464 https://github.com/datvt243/resume-nodejs-api/issues/464 · branch `464-remove-express-session-unused` (from `staging` @ 22718b0)
- Node: `remove-express-session-unused-deps` (PENDING, appended to `haven/diagrams/dev-loop.prime-mermaid.md`; slug absent from archive: `grep -c` → 0)
- Task type: refactor (labels `refactor`, `performance`) — `/todo` pass 0 skipped (not feat/bug).

## Hub bytes before: 97437

## Feature doc: doctrine/features/startup-config-env.md
The fix contradicts its Behavior #2 (`SESSION_SECRET` required ≥32 chars in prod, #458). Asked the operator (AskUserQuestion, 2026-11-15): answer "Drop it fully" → remove `SESSION_SECRET` from `process.config.ts` export + prod check, its test case, `jest.setup.ts`, CLAUDE.md/README env lists; doc Behavior #1/#2/#13 + Changelog row updated in this diff.

## Anchors (grep, real)
- `src/server.ts:13,17,21,52,55-56` — `body-parser` import, `express-session` import, `sessionConfig` import, `app.use(session(...))`, `bodyParser.urlencoded/json`
- `src/config/session.config.ts` (delete), `src/config/index.ts:13` (re-export)
- `src/config/process.config.ts:15,53,77` — `SESSION_SECRET` schema/destructure/export
- `src/__tests__/config/process.config.test.ts:8,29` — `SESSION_SECRET` fixture + 31-char case
- `src/__tests__/middlewares/errors.test.ts:10,29-30` — mirrors server's bodyParser setup
- `jest.setup.ts:4`, `CLAUDE.md:52`, `README.md:47`
- `package.json` deps: `express-session`, `@types/express-session`, `open`, `exit-hook`, `@types/exit-hook`, `body-parser`, `@types/winston`, `@types/http-status-codes`
- `utils/helper.ts:75-79` maps `entity.parse.failed`/`entity.too.large` — unchanged (Express 4's `express.json` is body-parser).

## depcheck (before)
```
Unused dependencies
* exit-hook
* express-rate-limit
* open
Unused devDependencies
* @types/exit-hook
* tsconfig-paths
```
`express-rate-limit`, `tsconfig-paths` not in the issue → out of scope (`tsconfig-paths` is used via `-r tsconfig-paths/register` in package.json scripts/nodemon.json — depcheck false positive).

## Acceptance criteria
See the node row (7 criteria).
