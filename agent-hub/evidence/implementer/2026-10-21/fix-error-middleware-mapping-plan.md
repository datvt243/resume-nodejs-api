# 2026-10-21 - fix-error-middleware-mapping (plan)

- Worker: implementer · Version: 0.1.0
- Node: `fix-error-middleware-mapping` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended PENDING)
- Task: `/todo #275` — "fix(api): phase 2/5 — errorsMiddleware maps body-parser/jwt/Mongoose errors, hides internal messages in prod"
- Branch: `275-fix-api-phase` (from `staging`, `gh issue develop`)

## Hub bytes before: 242688
(root `*.md` + `doctrine/` + active diagram + implementer/verifier bundles, measured after appending the PENDING row)

## Acceptance (from issue #275)
1. malformed JSON → 400 `MALFORMED_JSON`; oversized body → 413 `PAYLOAD_TOO_LARGE`
2. expired refresh token → 401 `TOKEN_EXPIRED`; malformed refresh token → 401 `INVALID_TOKEN`; same for `verifyToken`
3. `NODE_ENV=production`: unexpected `Error('secret db text')` → 500, body lacks the text
4. `handleError` stops promoting unknown errors to operational `AppError`
5. delete/restore/DOCX stop sending raw error text (logged instead)
6. new codes `MALFORMED_JSON`, `PAYLOAD_TOO_LARGE` + i18n keys; body keys unchanged
7. `npm test`, `npm run build` green, lint not above baseline

## Code anchors
- `src/middlewares/errors.middleware.ts:15-50` — trusts every `AppError`, unknown → generic 500
- `src/utils/helper.ts:37-85` — `handleError`; `:83-84` wraps unknown as operational `AppError(500, err.message)`
- `src/errors/AppError.ts:9-29,83` — `ErrorCode` enum, `isOperational` hardcoded `true`
- `src/auth/auth.controller.ts:154` — `jwtVerify` throws → 500
- `src/middlewares/verifyToken.middleware.ts:77-79` — every `JsonWebTokenError` → `TOKEN_EXPIRED`
- `src/services/index.ts:170,200,383` and `src/services/createDocx.ts:247-251` — raw error text to client

## Plan (smallest diff)
- Move `handleError`'s mapping body into exported `toAppError(err, lang)` in `utils/helper.ts` (same file, keeps existing tests valid); add body-parser + jwt branches; unknown → `AppError` with `isOperational: false` (original stack kept).
- `handleError` = `next(toAppError(err, lang))`; `errorsMiddleware` = `toAppError(err, req.lang)` then one response path, message hidden when non-operational outside development.
- `AppError` options gain optional `isOperational`; `ErrorCode` gains 2 codes.
- verifyToken: split `TokenExpiredError` vs `JsonWebTokenError`. Refresh: errors reach `handleError` → `toAppError` jwt branches (no controller change needed if the catch already uses `handleError`).
