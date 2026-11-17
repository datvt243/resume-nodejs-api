# 2026-11-17 - auth-service-throw-apperror (plan)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `auth-service-throw-apperror` · Branch: `refactor/460-auth-service-throw` (cut from `origin/staging` @ 7bb612f, in worktree `../resume-nodejs-api-460` so the operator's uncommitted #475 work in the primary checkout stays untouched — operator: "checkout mới từ staging và fix")
Task: GitHub #460 "Auth service: throw AppError instead of returning { success: false }" — replace the `{ success:false, message }` returns in `auth.service.ts` with the matching `AppError` subclass (i18n message kept), drop the branching in the controller. Acceptance (issue): `grep "success: false" src/auth` empty; contract tests assert `{ success:false, error:{ code, message } }` for invalid reset/verify tokens.

## Hub bytes before: 97847

## Feature doc: doctrine/features/auth-register-login.md, doctrine/features/auth-password-reset.md
Behavior kept: register duplicate → 409 `EMAIL_EXISTS`; bad credentials → 401 `INVALID_CREDENTIALS`; unknown/expired/used verify or reset token → 400.

## Acceptance criteria clarified: `grep "success: false" src/auth` is empty → `grep -n "success: false" src/auth/auth.service.ts` is empty and the controller no longer branches on a service `success` flag
Why: the remaining `success: false` hits in `auth.controller.ts` are `formatReturn(res, { success: false, ... })` validation/no-token responses — the codebase-wide controller idiom (`BaseController.ts:153/244/257` uses the same), and `formatReturn` already routes `success:false` through `sendError` (`utils/helper.ts:166-169`), so they do not bypass the error envelope. The issue's Problem/Proposal is about the service; rewriting those controller calls is out of scope (`SmallestDiff`). Flagged to the operator in the final report.

## Anchors
- `src/auth/auth.service.ts:32,84,96,100,158` — the 5 `{ success:false }` returns
- `src/auth/auth.controller.ts:41-42,74-90,205-211,267-273` — branching on `success`
- `src/__tests__/auth/auth.service.test.ts`, `src/__tests__/auth/auth.controller.test.ts` — tests asserting the old return shape
