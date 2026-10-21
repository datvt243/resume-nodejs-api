# 2026-10-21 - unified-error-envelope (plan)

- Worker: implementer · Version: 0.1.0
- Node: `unified-error-envelope` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended PENDING)
- Task: `/todo #278` — "feat(api)!: phase 5/5 — unified error envelope + list meta (breaking)"
- Branch: `278-feat-api-phase` (from `staging` @ 7cc0840, after #277 merged)

## Hub bytes before: 247388
Measured right after appending this node's PENDING row (the row itself is included). See "Ordering slip" below.

## Ordering slip (disclosed)
The PENDING row was appended to the diagram AFTER the src edits had started in this session, not before (`NodeBeforeCode`). It sits on this phase's own branch, so it ships with the diff it describes, but the recipe ordering was not followed. Nothing was committed or pushed before the row existed.

## Code anchors
- Error writers: `middlewares/errors.middleware.ts` (old `{ errorCode, message, errors }`), `utils/helper.ts` `formatReturn` failure branch (no code), `services/createPDF.ts` / `createPDF.ats.ts` / `createDocx.ts` (`{ status:false }` 500), `middlewares/rateLimit.middleware.ts` (429 without code), direct `res.status(400).json(formatReturnFailed(...))` in `candidate_me/{index,public-pdf,ats-check}.ts`
- `errors` shapes: `utils/valid.ts` formatValidateError (`path[0]` map), `services/index.ts` modelValidate (field-name array, empty message), `utils/valid.ts` validateModel (Mongoose message + names), `utils/helper.ts` toAppError Mongoose (message array) and CastError (raw string)
- Lists: `services/index.ts` baseFindDocument (`{ items, pagination }` with `limit`), `candidate_me/search.ts` (`{ items, pagination }`), `candidate/candidate.service.ts` handlerGetVisits (`{ count, visits }`)
- Hardcoded messages: `candidate_me/*`, `middlewares/verifyToken.middleware.ts`, `csrf.middleware.ts`, notFoundHandler, rate limiter
- Swagger: `config/swagger.config.ts`, route JSDoc in `routers/**`

## Plan
One writer `sendError` (helper.ts) used by errorsMiddleware, formatReturn's failure branch (code derived from status unless given), the rate limiter; PDF/DOCX failures rethrow to it; `details` = `{ field, message }[]` everywhere; lists `data: []` + `meta`; i18n keys for the remaining messages; swagger `ErrorResponse` + `meta`; API-STANDARD.md deviations emptied in this repo.
