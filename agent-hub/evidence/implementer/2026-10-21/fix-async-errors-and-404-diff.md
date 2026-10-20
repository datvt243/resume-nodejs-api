# 2026-10-21 - fix-async-errors-and-404 (diff)
- Worker: implementer · Version: 0.1.0
- Node: `fix-async-errors-and-404` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `#274 fix(api): phase 1/5 — async error safety + 404 for every method`
- Issue/branch: #274 · `274-fix-api-phase` (from `staging` @ e8c3932)

## Hub bytes before
240647

## Diff
| File | Why |
|---|---|
| `src/utils/asyncHandler.ts` (new) | Standard §4 reference impl: forwards rejected handler promise to `next(err)` |
| `src/routers/index.ts`, `src/routers/api/v1/*.route.ts` (13), `src/routers/api/v1/index.ts`, `src/routers/api/v2/auth.route.ts` | Every async route handler wrapped at registration (`asyncHandler(fnX)`), plus router-level `verifyToken`/`verifyTokenByQuery`. Controllers untouched, so unit tests that `await fnX(req,res)` still work |
| `src/routers/index.ts`, `src/routers/api/v1/index.ts`, `src/routers/api/v2/index.ts` | Removed the 3 GET-only `/*`/`/api/*` 404 catch-alls; landing page narrowed from `GET /*` (200 for any path) to exact `GET /` |
| `src/server.ts` | `app.use(notFoundHandler)` after router, before `errorsMiddleware`; `process.on('unhandledRejection')` logs via Winston |
| `src/__tests__/middlewares/asyncErrors.test.ts` (new) | Real router + notFoundHandler + errorsMiddleware over real HTTP: rejecting service → JSON 500 + logged service error + no unhandledRejection; GET/POST/PUT/DELETE × `/api/nope`,`/api/v1/nope`,`/api/v2/nope` → 404 `NOT_FOUND`; unknown non-API GET → 404; `GET /` → 200 landing |
| `src/__tests__/auth/v2AuthRoute.test.ts` | Was asserting `handle === authRegister` (identity breaks under the wrapper); now asserts the v2 layer invokes the (mocked) v1 `authRegister` with the same req/res/next — same intent: no separate v2 code path |

Decision (acceptance 3): asyncHandler, not `express-async-errors` — no new dependency, standard's own reference impl, explicit at each route. Landing page: kept intentionally on exact `GET /` only; every other unknown path, any method → 404 JSON.

## Command
- `npm test` (repo root)
- `npm run build` (repo root)
- `npm run lint` equivalent count: `npx eslint . -f json` summed errorCount+warningCount
- Single file: `npx jest src/__tests__/middlewares/asyncErrors.test.ts`

## Output
Full suite run 1 (machine under load — Chrome debug profile + Puppeteer suites concurrently): `Test Suites: 4 failed, 41 passed, 45 total` / `Tests: 8 failed, 397 passed, 405 total`. Failures: `v2AuthRoute.test.ts` real (identity assertion, fixed above); `uploadCvPdfParse`, `atsPdfIntegration`, `asyncErrors` were `Exceeded timeout of 5000 ms` / `30000 ms` (suite times 92–187 s vs ~3 s isolated).

Full suite run 2 (after v2 test fix + lint fixes):
```
Test Suites: 45 passed, 45 total
Tests:       405 passed, 405 total
Time:        76.866 s, estimated 204 s
```
test exit 0

Build: exit 0, `grep -c "error TS"` → 0

Lint: baseline on clean branch base 276 → after 276. Intermediate 279 (`require-await` on async jest mocks) fixed by returning resolved promises.

asyncErrors.test.ts isolated: `Tests: 7 passed, 7 total`.

Mutation: `asyncHandler(fnGetInformationByEmail)` → `fnGetInformationByEmail` in `candidate.route.ts`: `✕ a rejecting service returns the JSON 500 from errorsMiddleware (2016 ms)` / `TimeoutError: The operation was aborted due to timeout` / `Tests: 1 failed, 6 skipped`. File restored (`grep -c "asyncHandler(fnGetInformationByEmail)"` → 1). First mutation attempt (without fetch abort signal) hung and was killed; test then gained `AbortSignal.timeout(2000)` + `server.closeAllConnections()` so a regression fails fast instead of hanging.

## Acceptance
| Criterion | Evidence |
|---|---|
| asyncHandler added + async handlers wrapped, one approach | `src/utils/asyncHandler.ts`; `grep -rnE "^router\.(get\|post\|put\|patch\|delete)\(" src/routers \| grep -v asyncHandler` leaves only multi-line openers (wrapped inside) — tsc requires a Promise return so a sync handler can't be wrapped by mistake |
| unhandledRejection logged | `src/server.ts` diff |
| notFoundHandler mounted once, all methods; 3 GET-only catch-alls gone | `server.ts` diff; asyncErrors.test GET/POST/PUT/DELETE ✓ |
| rejecting handler → JSON 500, no unhandled rejection | asyncErrors.test "a rejecting service…" ✓ + mutation ✕ |
| Landing-page decision recorded | this note + code comment `src/routers/index.ts` |
| npm test, build green, lint ≤ baseline | `Tests: 405 passed, 405 total`; build 0 `error TS`; lint 276 = 276 |
| comments per code-comments.md | 4 added: asyncHandler JSDoc (1-sentence WHY on exported API), `server.ts` `//` (why: Node ≥15 exits), `routers/index.ts` `//` (why landing is root-only), asyncErrors test mock `//`, v2 test `//`; no issue refs, no stacked `//` |

## Noticed, not done
- 404 body is now `errorsMiddleware`'s shape `{ success, errorCode, message, errors? }` instead of the removed catch-alls' `{ success, message, errors: null, data: null }` — clients reading `data` on a 404 get `undefined` instead of `null`. Envelope unification is phase 5 (#278).
- `notFoundHandler` message still `Route <url> not found` without method; standard's `ROUTE_NOT_FOUND` code is a phase 4/5 change.
- Heavy concurrent load (Chrome debug profile) makes Puppeteer/HTTP suites hit the 5 s/30 s jest timeouts; not a code issue.

## Seal gate
none — no commit/push/outward action taken.
