# 2026-10-21 - fix-async-errors-and-404 (diff, round 2 after REOPEN)
- Worker: implementer · Version: 0.1.0
- Node: `fix-async-errors-and-404` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `#274 fix(api): phase 1/5 — async error safety + 404 for every method`
- Answers: `evidence/verifier/2026-10-21/fix-async-errors-and-404-reopen.md` (5 missing items). Round-1 note `fix-async-errors-and-404-diff.md` still holds the full diff table, decision and mutation result; this note adds the missing verbatim evidence.

## Hub bytes before
240647

## Diff (round 2 only)
| File | Why |
|---|---|
| `src/__tests__/middlewares/asyncErrors.test.ts` | 404 matrix now also asserts the exact body key set `['errorCode','message','success']` (plus `errorCode: 'NOT_FOUND'`) |

## Decision — "Keep the current error body keys" (REOPEN item 1)
Issue #274 Scope says: "Mount `notFoundHandler` … Remove the 3 GET-only catch-alls. Keep the current error body keys (no envelope change in this phase)." Removing the catch-alls necessarily removes their ad-hoc `{success,message,errors:null,data:null}` body; the clause therefore means the **error contract `errorsMiddleware` already returns for every other error** (`success`, `errorCode`, `message`, `errors?`, dev-only `stack`) is not changed here — `errorsMiddleware` itself has zero diff in this phase. The `{ success:false, error:{code,message,details} }` envelope is phase 5 (#278). Pinned by the new key-set assertion. The difference for clients (404 `data` now absent instead of `null`) stays listed under Noticed.

## Command
`npm test` · `npm run build` · `npm run lint` (all from repo root, verbatim from `doctrine/MEMORY.md`). Lint "before" = same command after `git stash push -u -m "274-lint-baseline"` (working tree → 0 changed paths), then `git stash pop` (→ 23 changed paths, restored).

## Output
### Criterion 1 + 3 + 2 — grep / server.ts (verbatim)
```
$ grep -rnE "^router\.(get|post|put|patch|delete|use)\(.*(fn|base|auth)[A-Za-z]+\)?;$" src/routers | grep -v asyncHandler
src/routers/api/v1/auth.route.ts:17:router.use(authLimiter);
(exit 0 — 1 = no unwrapped single-line handler)
$ grep -rnE "^  (fn|base|auth)[A-Za-z]+,$" src/routers   # bare multi-line handler args (import lists excluded below)
src/routers/api/v1/candidate.route.ts:20:  fnParseCvPdf,
(exit 0)
$ grep -rnc "asyncHandler(" src/routers
src/routers/api/v1/candidate.route.ts:10
src/routers/index.ts:4
src/routers/api/v1/application.route.ts:5
src/routers/api/v1/certificate.route.ts:6
src/routers/api/.gitkeep:0
src/routers/api/v1/profile.route.ts:5
src/routers/api/v1/generalInformation.route.ts:4
src/routers/api/v1/auth.route.ts:9
src/routers/api/v1/cv.route.ts:1
src/routers/api/v1/award.route.ts:6
src/routers/api/v1/index.ts:12
src/routers/api/v1/project.route.ts:6
src/routers/api/v1/reference.route.ts:5
src/routers/api/v1/experience.route.ts:6
src/routers/api/v2/index.ts:0
src/routers/api/v2/auth.route.ts:2
src/routers/api/v1/education.route.ts:6
$ grep -rn "verifyToken\|verifyTokenByQuery" src/routers | grep -v import | grep -v "^\S*:\s*\*"
src/routers/api/v1/auth.route.ts:128:router.post('/logout-all', asyncHandler(verifyToken), asyncHandler(authLogoutAll));
src/routers/api/v1/index.ts:27:router.use('/candidate', asyncHandler(verifyToken), routeCandidate);
src/routers/api/v1/index.ts:28:router.use('/education', asyncHandler(verifyToken), routeEducation);
src/routers/api/v1/index.ts:29:router.use('/award', asyncHandler(verifyToken), routeAward);
src/routers/api/v1/index.ts:30:router.use('/experience', asyncHandler(verifyToken), routeExperience);
src/routers/api/v1/index.ts:31:router.use('/reference', asyncHandler(verifyToken), routeReference);
src/routers/api/v1/index.ts:32:router.use('/general-information', asyncHandler(verifyToken), routeGeneralInformation);
src/routers/api/v1/index.ts:33:router.use('/project', asyncHandler(verifyToken), routeProject);
src/routers/api/v1/index.ts:34:router.use('/certificate', asyncHandler(verifyToken), routeCertificate);
src/routers/api/v1/index.ts:35:router.use('/application', asyncHandler(verifyToken), routeApplication);
src/routers/api/v1/index.ts:36:router.use('/profile', asyncHandler(verifyToken), routeProfile);
src/routers/api/v1/index.ts:37:router.use('/cv', asyncHandler(verifyToken), routeCv);
src/routers/api/v1/index.ts:120:router.get('/download-pdf', asyncHandler(verifyTokenByQuery), asyncHandler(fnExportPDF));
$ grep -n "unhandledRejection" -A3 src/server.ts; grep -n "notFoundHandler" src/server.ts
28:process.on('unhandledRejection', (reason) => {
29-  logger.error('Unhandled promise rejection', { error: reason instanceof Error ? reason.message : String(reason), stack: reason instanceof Error ? reason.stack : undefined });
30-});
31-
19:import { errorsMiddleware, notFoundHandler, rateLimitMiddleware, startMemStoreCleanup, requestLogger, languageMiddleware } from '@/middlewares';
90:  app.use(router);
91:  app.use(notFoundHandler);
92:  app.use(errorsMiddleware);
```
Reading the grep: the only single-line `router.*` hit without asyncHandler is `router.use(authLimiter)` (rate-limit middleware, not a route handler — see Noticed); the only bare `  fnX,` hit is `candidate.route.ts:20 fnParseCvPdf,` which is the import list (lines 9–21 `import { … } from '@/candidate/candidate.controller'`), not a route arg. Every `verifyToken`/`verifyTokenByQuery` mount is wrapped. `asyncHandler` returns `RequestHandler` from `fn: (...) => Promise<unknown>`, so tsc rejects wrapping a non-promise handler; build below has 0 type errors.

### npm test
```
Test Suites: 45 passed, 45 total
Tests:       405 passed, 405 total
Time:        18.139 s, estimated 67 s
```
exit 0

### npm run build (tail, verbatim)
```

> resume-nodejs-api@1.14.0 build
> tsc && npm run copy


> resume-nodejs-api@1.14.0 copy
> cp -R ./src/views ./src/public ./dist/

```
exit 0 (`tsc` printed nothing → 0 type errors)

### npm run lint
before (stashed, branch base):
```
✖ 276 problems (276 errors, 0 warnings)
  20 errors and 0 warnings potentially fixable with the `--fix` option.

```
after:
```
✖ 276 problems (276 errors, 0 warnings)
  20 errors and 0 warnings potentially fixable with the `--fix` option.

```

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) asyncHandler wraps every async route handler + router-level verifyToken, one approach | grep block above: zero unwrapped route handlers; 13 `verifyToken`/`verifyTokenByQuery` lines all `asyncHandler(...)`; no `express-async-errors` in diff |
| (2) unhandledRejection logged via Winston | `src/server.ts:28-30` excerpt above — `logger` is `@/logger` (Winston) |
| (3) notFoundHandler once, after router, before errorsMiddleware, all methods; 3 catch-alls gone; error keys unchanged | `server.ts:90-92` excerpt; asyncErrors.test GET/POST/PUT/DELETE × 3 paths assert 404 + `NOT_FOUND` + exact key set; `errorsMiddleware` untouched; decision above |
| (4) landing-page decision recorded | round-1 note Decision + `src/routers/index.ts` comment; test "GET / still serves the landing page" + "unknown non-API GET is a 404" |
| (5) tests: rejecting service → JSON 500, no unhandled rejection | asyncErrors.test case ✓ in `Tests: 405 passed`; round-1 mutation ✕ |
| (5) npm test + build green, lint ≤ 276 | `Tests: 405 passed, 405 total`; build exit 0; lint `✖ 276 problems` before = after |
| comments per code-comments.md | 5 comments added in total: `asyncHandler.ts` JSDoc (WHY, exported API), `server.ts` `//` (why: Node ≥15 exits), `routers/index.ts` `//` (why root-only), asyncErrors test 2× `//` (mock must return a promise; key set is the pre-envelope contract), v2AuthRoute test `//` replaced in place. No issue refs, no stacked `//`. (Round-1 note said "4 added" while listing 5 — 5 is correct, plus this round's 1 test comment.) |

## Noticed, not done
- `createRateLimiter` (`rateLimit.middleware.ts:57`) and app-level `rateLimitMiddleware` are async middleware, not wrapped: their Redis calls are inside try/catch with an in-memory fallback (`:74`–`:106`). Out of this node's scope (route handlers + verifyToken); worth wrapping in phase 4.
- 404 body for the removed catch-alls: `data: null`/`errors: null` → absent. Phase 5 envelope.

## Seal gate
none — no commit/push/outward action taken.
