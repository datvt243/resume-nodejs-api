# 2026-10-21 - fix-status-codes (plan)

- Worker: implementer · Version: 0.1.0
- Node: `fix-status-codes` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended PENDING)
- Task: `/todo #276` — "fix(api): phase 3/5 — correct status codes (create, validation, register, login, refresh, bulk)"
- Branch: `276-fix-api-phase` (from `staging` @ 9828871)

## Hub bytes before: 244034

## Code anchors
- `src/candidate_profile/BaseController.ts` fnCreate (201 always), fnBulkCreate (201 always)
- `src/candidate_profile/general_information/generalInformation.controller.ts` fnCreate (201 always), fnUpdate/fnUpdateFields (401 validation)
- `src/auth/auth.controller.ts` authRegister/authLogin (401 validation, register 200/401), authRefreshToken (4× 403 revoked)
- `src/auth/auth.service.ts` handlerRegister (duplicate), handlerLogin (emailNotFound vs wrongPassword)
- `src/candidate/candidate.controller.ts` fnUpdate/fnUpdateFields (401 validation)

## Plan
- Status-only rows (create failure, validation, register success, bulk all-fail): change `statusCode` passed to `formatReturn`.
- Rows needing an error code (EMAIL_EXISTS, INVALID_CREDENTIALS, TOKEN_REVOKED): `next(new <AppError subclass>)` so `errorsMiddleware` writes the existing `{ success, errorCode, message, errors }` error body (the only path that carries `errorCode` today).
- New `ErrorCode.EMAIL_EXISTS`; one `auth.invalidCredentials` key replacing `emailNotFound`/`wrongPassword`.
- Bulk all-fail: `formatResponse` nulls `data` when `success:false`, so write the same body keys directly to keep `data.results`.
