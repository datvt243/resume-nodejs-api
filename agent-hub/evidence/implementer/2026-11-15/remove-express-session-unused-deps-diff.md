# 2026-11-15 — remove-express-session-unused-deps (diff)
- Worker: implementer · Version 0.1.0
- Node: `remove-express-session-unused-deps` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: `#464 Remove express-session (unused, MemoryStore leak) and unused dependencies`
- Branch: `464-remove-express-session-unused` (from `staging` @ 22718b0)
- Status: sealed_pending_verifier
- Plan: `evidence/implementer/2026-11-15/remove-express-session-unused-deps-plan.md`

## Hub bytes before: 97437
## Feature doc changed: doctrine/features/startup-config-env.md
Operator answer (AskUserQuestion, 2026-11-15) "Drop it fully": `SESSION_SECRET` removed from Behavior #1, #2, #13, Acceptance #1; `session.config.ts` anchor dropped (doc + `INDEX.md` row); Open question 2 marked superseded; Changelog row added (node `remove-express-session-unused-deps`).

## Diff
- `src/config/session.config.ts` — deleted (`git rm`); `src/config/index.ts` — its re-export removed.
- `src/server.ts` — dropped `body-parser` + `express-session` imports, `sessionConfig` import, `app.use(session(sessionConfig()))`; `bodyParser.urlencoded/json` → `express.urlencoded/json` with the same `{ extended: true, limit: REQUEST_BODY_LIMIT }` / `{ limit: REQUEST_BODY_LIMIT }`.
- `src/config/process.config.ts` — `SESSION_SECRET` removed from `envSchema`, destructure, export.
- `src/__tests__/config/process.config.test.ts` — `SESSION_SECRET` dropped from `validProd` (so "a valid config passes" now proves it's no longer required); 31-char case `['TOKEN_REFRESH','SESSION_SECRET']` → `['TOKEN_SECRET','TOKEN_REFRESH']`.
- `src/__tests__/middlewares/errors.test.ts` — mirrors server: `bodyParser.*` → `express.*`, import removed.
- `jest.setup.ts` — `SESSION_SECRET` default line removed.
- `CLAUDE.md`, `README.md`, `.env.example`, `.env.development`, `.env.production` — `SESSION_SECRET` lines removed (env templates edited via Read/Edit; Bash access to `.env*` is deny-ruled, so no `git diff` of them was printed here).
- `package.json` / `package-lock.json` — `npm uninstall express-session @types/express-session open exit-hook @types/exit-hook body-parser @types/winston @types/http-status-codes`.
- No comments added/changed in `src/` (code-comments.md: n/a).

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api`:
- `npx jest src/__tests__/config/ src/__tests__/middlewares/errors.test.ts`
- `npm test`
- `npm run build` (Typecheck row: inside Build)
- `npm run lint`
- `npx depcheck`
- `grep -rn "express-session\|SESSION_SECRET\|body-parser'" src jest.setup.ts`

## Output
Targeted:
```
Test Suites: 6 passed, 6 total
Tests:       52 passed, 52 total
```
errors.test.ts (verbose, after the swap):
```
    ✓ malformed JSON body → 400 MALFORMED_JSON (27 ms)
    ✓ JSON body over REQUEST_BODY_LIMIT → 413 PAYLOAD_TOO_LARGE (13 ms)
    ✓ urlencoded body over REQUEST_BODY_LIMIT → 413 PAYLOAD_TOO_LARGE (5 ms)
    ✓ bodies over the old 100kb default but under REQUEST_BODY_LIMIT are accepted (8 ms)
```
`npm test`:
```
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. ...
Test Suites: 72 passed, 72 total
Tests:       781 passed, 781 total
```
`npm run build`: `build exit=0` (tsc + copy).
`npm run lint`: `✖ 274 problems (274 errors, 0 warnings)` — = baseline 274. Changed files listed by lint: only `src/server.ts`, 5 errors, all pre-existing lines (`require()` at 7:1/8:1, floating promise / unused expression at 144:5, floating promise at 150:1 — same rules at 147:5/153:1 on staging). None in the other touched files.
`npx depcheck` after:
```
Unused dependencies
* express-rate-limit
Unused devDependencies
* tsconfig-paths
```
(before: also `exit-hook`, `open`, `@types/exit-hook` — see plan note.)
grep: 1 hit, `src/config/body.config.ts:9` — a prose comment ("body-parser's 100kb default"), still accurate (express.json is body-parser); 0 code hits.

## Acceptance
1. 0 code hits for express-session/SESSION_SECRET/body-parser import — grep above ✅
2. depcheck no longer lists `open`/`exit-hook`/`@types/exit-hook` — output above ✅
3. targeted jest 52/52 incl. 400/413 cases ✅
4. `npm test` 781/781 ✅
5. `npm run build` exit 0 ✅
6. lint 274 ≤ 274, no new errors in changed files ✅
7. feature doc updated (see `## Feature doc changed`) ✅

## Supersedes: none
## Still open: none

## Review
`/code-review medium` (forked) on the working-tree diff: confirmed no remaining imports, `@types` removals safe (packages ship own types), express.json/urlencoded behavior-identical. Findings:
- `.env.example:23`, `.env.development:19`, `.env.production:19` still had `SESSION_SECRET` → fixed (lines removed).
- `agent-hub/evidence/ship/2026-11-15/config-fail-fast-ship.md` modified → false positive for this diff: that modification predates this pass (present in the session-start `git status`); not mine, must not ride into the #464 commit — `/ship` should stage only this node's files.
- Not checked by review: gitignored local `.env` (deny-ruled) — may still carry a dead `SESSION_SECRET=` line; harmless (`envSchema.unknown(true)`).

## Noticed, not done
- depcheck flags `express-rate-limit` (not in #464; `src/middlewares` has its own rate limiter) — worth a follow-up issue after confirming.
- `tsconfig-paths` flagged by depcheck is a false positive (`-r tsconfig-paths/register` in package.json scripts + nodemon.json).
- Jest "worker process has failed to exit gracefully" warning — not investigated whether pre-existing on staging.
- Render/hosting env may still define `SESSION_SECRET` — harmless, operator can delete it.

## Seal gate: none (no outward-facing action; nothing committed/pushed)
