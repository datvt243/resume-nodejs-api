# 2026-10-21 - fix-async-errors-and-404 (plan)
- Worker: implementer · Version: 0.1.0
- Node: `fix-async-errors-and-404` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `#274 fix(api): phase 1/5 — async error safety + 404 for every method`

## Hub bytes before: 240647

## Current state (code anchors)
- Unprotected awaits: `src/candidate/candidate.controller.ts:27-40` (`fnGetInformationById`, `fnGetInformationByEmail`), `src/candidate_me/index.ts:326-327` (`fnExportPDF` dynamic import + `findOne` before `try`).
- `notFoundHandler` defined `src/middlewares/errors.middleware.ts:52`, never mounted.
- GET-only catch-alls: `src/routers/index.ts:218` (`/api/*`), `:227` (`/*` Hello World 200), `src/routers/api/v1/index.ts:121`, `src/routers/api/v2/index.ts:14`.
- No `process.on('unhandledRejection')` in `src/server.ts`.

## Decision
- asyncHandler (standard §4 reference impl), wrapped at route registration (not at controller export, so existing controller unit tests that `await fnX(req,res)` keep working). No new dependency. Also wraps router-level async `verifyToken`/`verifyTokenByQuery` uses.
- Landing page: kept as intentional landing on exact `GET /` only; every other unknown path (any method) → `notFoundHandler` → 404 JSON `NOT_FOUND`.

## Acceptance
See node row. Lint baseline measured on branch base: 276 problems.

## Blockers
none
