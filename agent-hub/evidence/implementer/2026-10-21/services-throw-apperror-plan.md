# 2026-10-21 - services-throw-apperror (plan)

- Worker: implementer · Version: 0.1.0
- Node: `services-throw-apperror` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended PENDING)
- Task: `/todo #277` — "refactor(api): phase 4/5 — services throw AppError, response helpers, single code→status map"
- Branch: `277-refactor-api-phase` (from `staging` @ cc0a418)

## Hub bytes before: 244815

## Code anchors
- `src/errors/AppError.ts` — status passed by hand per subclass / per caller; no SERVICE_UNAVAILABLE
- `src/services/index.ts` baseDelete/Restore/Update/Patch/CreateDocument — `formatReturnFailed` for not-found / not-yours / validation; delete/restore `modifiedCount===0` → success text with success:false; catch blocks swallow DB errors
- `src/candidate_profile/BaseService.ts` — every handler catches and returns `{ success:false }` (timeout → 400)
- `src/utils/timeout.ts` withTimeout — rejects with plain Error (→ 500)
- `src/candidate_profile/application/application.service.ts`, `general_information/generalInformation.service.ts` — returned failures
- `src/candidate_profile/BaseController.ts`, `general_information/generalInformation.controller.ts` — success/failure branching on `_result.success`; bulk must now catch per item
- `src/candidate_me/index.ts` (fnGetAboutMe, handlerGetAboutMe, handlerRecordVisit, fnExportPDF), `public-pdf.ts`, `ats-check.ts`, `src/candidate/candidate.controller.ts` fnGetInformationById/Email — not found → 400
- Status passed by hand: `auth/auth.controller.ts:42`, `utils/helper.ts:76,78,84`, `middlewares/errors.middleware.ts:37`

## Plan
- `ERROR_STATUS: Record<ErrorCode, number>` in AppError.ts; AppError derives `statusCode` from `errorCode`; drop the `statusCode` option and the positional overload (only caller: notFoundHandler).
- withTimeout rejects with `AppError(SERVICE_UNAVAILABLE)`; new i18n key `errors.serviceUnavailable`.
- Base services throw NotFoundError / AuthorizationError(FORBIDDEN) / ValidationError / BadRequestError; DB driver errors propagate (→ 500, hidden in prod). Decision: another candidate's id → 403 FORBIDDEN (matches standard §2/§3 and existing baseUploadImages).
- `src/utils/response.ts` ok()/created() keeping today's success keys (`success, message, errors, data`).
- Out of scope (phase 5): envelope shape, i18n of hardcoded messages, remaining validation/upload `formatReturn` failure sites.
