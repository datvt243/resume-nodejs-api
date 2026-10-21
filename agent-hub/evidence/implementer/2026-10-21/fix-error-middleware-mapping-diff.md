# 2026-10-21 - fix-error-middleware-mapping (diff)

- Worker: implementer · Version: 0.1.0
- Node: `fix-error-middleware-mapping` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING, last row)
- Task: `/todo #275` — "fix(api): phase 2/5 — errorsMiddleware maps body-parser/jwt/Mongoose errors, hides internal messages in prod"
- Branch: `275-fix-api-phase` (from `staging` @ c45537a)
- Plan note: `evidence/implementer/2026-10-21/fix-error-middleware-mapping-plan.md`
- Status: `sealed_pending_verifier`

## Hub bytes before: 242688

## Diff
`git diff --stat -- src`: 11 files, 123+/65-, plus new `src/__tests__/middlewares/errors.test.ts` (78 lines).

| File | Why |
|---|---|
| `src/errors/AppError.ts` | `ErrorCode.MALFORMED_JSON` / `PAYLOAD_TOO_LARGE`; options-object `isOperational?: boolean` (default `true`, so every existing caller unchanged) |
| `src/utils/helper.ts` | `handleError`'s mapping body moved verbatim into exported `toAppError(err, lang)` (`return next(X)` → `return X`); added body-parser `type` (`entity.parse.failed` → 400 `MALFORMED_JSON`, `entity.too.large` → 413 `PAYLOAD_TOO_LARGE`) and jsonwebtoken `name` (`TokenExpiredError` → `TOKEN_EXPIRED`, `JsonWebTokenError` → `INVALID_TOKEN`) branches; unknown → 500 `AppError` with `isOperational: false`, original stack copied. `handleError` = `next(toAppError(err, lang))` |
| `src/middlewares/errors.middleware.ts` | single path: `toAppError(err, req.lang)`, message replaced by `t('errors.internalServerError')` when non-operational and `NODE_ENV !== 'development'`; body keys unchanged (`success, errorCode, message, errors, stack(dev)`) |
| `src/middlewares/verifyToken.middleware.ts` | `jwt.TokenExpiredError` → `TokenExpiredError`, `jwt.JsonWebTokenError` → `InvalidTokenError` (was: both → TOKEN_EXPIRED); messages via i18n |
| `src/services/index.ts` | delete/restore catch: driver text logged, `errors` gets the translated failure message; `handlerCatchError` ReferenceError: logged, `errors: []` |
| `src/services/createDocx.ts` | catch: raw `error` object logged, no longer in the response body (message/status keys unchanged) |
| `src/locales/{en,vi}.ts` | `auth.tokenExpired`, `auth.invalidToken`, `errors.malformedJson`, `errors.payloadTooLarge` |
| `src/__tests__/middlewares/errors.test.ts` (new) | real HTTP + `bodyParser.json()` like `server.ts`: malformed JSON → 400 `MALFORMED_JSON`; 200kb body → 413 `PAYLOAD_TOO_LARGE`; production `Error('secret db text')` → 500, body exactly `{success,errorCode,message:'Lỗi hệ thống'}`, text absent, log keeps message+stack; development still shows message |
| `src/__tests__/auth/refreshToken.test.ts` | expired / malformed refresh token → `next` gets 401 `TOKEN_EXPIRED` / `INVALID_TOKEN`, operational, no response written by controller |
| `src/__tests__/middlewares/verifyToken.test.ts` | malformed jwt → `InvalidTokenError` 401 `INVALID_TOKEN` (not `TokenExpiredError`) |
| `src/__tests__/middlewares/asyncErrors.test.ts` | log line assertion follows the unified format `ERROR [INTERNAL_SERVER_ERROR]: mongo timeout` |

`/auth/refresh` controller itself unchanged: its catch already calls `handleError`, which now maps jwt errors to 401.

PDF/DOCX export standard: the `createDocx.ts` change only touches the catch block (no rendering/content change) — none of the 10 invariants apply.

## Command
From repo root `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (per `doctrine/MEMORY.md`):
- `npm test`
- `npm run build` (typecheck: `tsc`)
- `npm run lint` equivalent count: `npx eslint . -f json` summed, vs same on `staging` (`git stash -u`)

## Output
`npm test` (final run, after last edit):
```
Test Suites: 46 passed, 46 total
Tests:       412 passed, 412 total
```
`npm run build`:
```
> tsc && npm run copy
> resume-nodejs-api@1.14.0 copy
```
(no tsc errors printed)

Lint: staging baseline `276` problems; this branch first `280` (3× `no-require-imports` + 1 `no-unnecessary-type-assertion` in new test code) → fixed → `277` → per-file diff found the last one in `verifyToken.test.ts` → fixed; `verifyToken.test.ts` back to 15 messages = baseline, every other touched file equal to baseline (per-file count diff printed nothing else). Final: 276 = baseline.

## Acceptance
| Criterion | Evidence |
|---|---|
| malformed JSON → 400 `MALFORMED_JSON` | `errors.test.ts` "malformed JSON body → 400 MALFORMED_JSON" — in 412/412 |
| oversized body → 413 | `errors.test.ts` "body over the 100kb default limit → 413 PAYLOAD_TOO_LARGE" |
| expired refresh → 401 `TOKEN_EXPIRED`; malformed refresh → 401 `INVALID_TOKEN` | `refreshToken.test.ts` "forwards a 401 an expired/a malformed refresh token error, not a 500" (both ✓ in targeted run) |
| same for `verifyToken` | existing "TokenExpiredError when jwtVerify throws TokenExpiredError" + new "InvalidTokenError, not TokenExpiredError, on a malformed jwt" |
| production `Error('secret db text')` → 500 without the text | `errors.test.ts` "production: an unexpected error is a 500 without its message or stack…" |
| `handleError` no longer promotes unknown to operational | `toAppError` unknown branch `isOperational: false`; `candidate.controller.test.ts` still sees 500 + original message on the forwarded error (hidden only at the middleware) |
| no raw error text in delete/restore/DOCX | `services/index.ts` catches, `createDocx.ts` catch — logged only |
| new codes + i18n keys, body keys unchanged | `AppError.ts`, `locales/{en,vi}.ts`; `asyncErrors.test.ts` 404 body keys test still `['errorCode','message','success']` |
| `npm test`, `npm run build` green, lint ≤ baseline | Output above: 46/46, 412/412; build clean; lint 276 = 276 |
| comments per `doctrine/standards/code-comments.md` | new comments are WHY-only, `//` one-liners or `/** */` JSDoc on exported `toAppError`, no `(#N)` refs |

## Noticed, not done
- `verifyToken.middleware.ts` non-jwt fallback still `new InvalidTokenError(err.message)` — an unexpected error there (e.g. a Redis failure) surfaces its raw text as a 401. Phase 4 (#277) territory.
- CastError still sends Mongoose's own `err.message` in `errors` (model/path names). Not 500 text, untouched; `errors` shape is phase 5 (#278).
- `API-STANDARD.md` "Current deviations" row for phase 2 left in place (phase 1 also left its row; presumably cleared at release/phase 5).
- `createDocx.ts` failure body `{ status:false, message }` is a phase 5 envelope item.

## Seal gate
None — no commit/push/external action. Branch created via `gh issue develop` (Bước 0 of `/todo`).

## REOPEN round 1 — response (2026-10-21)
Verifier note: `evidence/verifier/2026-10-21/fix-error-middleware-mapping-reopen.md`. Two gaps, both evidence-only; no production code changed in this round.

### Gap 1 — Mongoose Cast/Validation/duplicate-key mapping evidence
Added tests (test files only):
- `src/__tests__/middlewares/errors.test.ts` — errors thrown straight into `errorsMiddleware` (the new direct path, not via `handleError`):
  - `/cast` throws `new mongoose.Error.CastError('ObjectId','nope','_id')` → 400 `BAD_REQUEST`, message `ID không đúng định dạng`
  - `/invalid` throws a real `mongoose.Error.ValidationError` with a `required` `ValidatorError` on `birthday` → 400 `VALIDATION_ERROR`, `errors: ['Ngày sinh là bắt buộc']`
  - `/duplicate` throws `Error('E11000 duplicate key ...')` with `code: 11000, keyValue: { email }` → 409 `CONFLICT`, message `email đã tồn tại`, body does not contain `E11000`
- `src/__tests__/utils/helper.test.ts` — `handleError` path: new "converts a Mongoose CastError into a 400 BadRequestError" (`statusCode 400`, `BAD_REQUEST`, `Invalid ID format`). Duplicate key (`slug`, `email`) and `required` ValidationError (vi + en) on the `handleError` path were already covered by the existing 3 tests in the same file.

Targeted run `npx jest src/__tests__/middlewares/errors.test.ts src/__tests__/utils/helper.test.ts` (verbatim):
```
    ✓ malformed JSON body → 400 MALFORMED_JSON (24 ms)
    ✓ body over the 100kb default limit → 413 PAYLOAD_TOO_LARGE (4 ms)
    ✓ Mongoose CastError reaching the middleware directly → 400 BAD_REQUEST (3 ms)
    ✓ Mongoose ValidationError reaching the middleware directly → 400 VALIDATION_ERROR with translated details (3 ms)
    ✓ duplicate key reaching the middleware directly → 409 CONFLICT, driver text not sent (3 ms)
    ✓ production: an unexpected error is a 500 without its message or stack, but the log keeps it (3 ms)
    ✓ development: an unexpected error still shows its message (3 ms)
    ✓ converts a Mongo duplicate-key error on `slug` into a ConflictError (issue #120)
    ✓ converts a Mongoose CastError into a 400 BadRequestError (1 ms)
    ✓ still converts a duplicate-key error on `email` the same way (regression check)
    ✓ translates a Mongoose "required" validation error via tErrorType, in vi and en (issue #160)
Tests:       11 passed, 11 total
```

### Gap 2 — new comment lines, quoted (`git diff -U0 -- src ':!src/__tests__'`, added comment lines)
```
+  // false = an unexpected failure (a bug): its message is never shown to the client in production      (AppError.ts, option field)
+    // TokenExpiredError extends JsonWebTokenError, so it must be checked first.                        (verifyToken.middleware.ts, instanceof order)
+    // Driver text stays in the log; the client only gets the translated failure message.              (services/index.ts, delete + restore catch)
+ * Map any thrown value to an `AppError`: known third-party errors (body-parser,
+ * jsonwebtoken, Mongoose, Mongo duplicate key) get their real status/code;
+ * anything else becomes a non-operational 500 whose message
+ * `errorsMiddleware` hides in production.                                                              (helper.ts, JSDoc on exported toAppError)
+  // body-parser and jsonwebtoken errors are recognized by their documented `type`/`name`.             (helper.ts)
+  // Keep the original stack so the log points at the real failure, not here.                           (helper.ts)
```
(`Pass error to global error handler via next()` JSDoc on `handleError` is the pre-existing block, moved below `toAppError`, text unchanged.)
Check against `doctrine/standards/code-comments.md`: each is a WHY (invariant, ordering trap, security rationale, debugging rationale) not a WHAT; one-sentence notes use `//`, the multi-sentence explanation on an exported function uses `/** */`; no `(#N)` refs; no stacked `//` lines; no `*/` in prose.

### Re-run after this round (verbatim)
`npm test`:
```
Test Suites: 46 passed, 46 total
Tests:       416 passed, 416 total
```
`npm run build`:
```
> resume-nodejs-api@1.14.0 build
> tsc && npm run copy
> resume-nodejs-api@1.14.0 copy
> cp -R ./src/views ./src/public ./dist/
```
(no `error TS` lines)
Lint (`npx eslint . -f json`, per-file count diff vs the `staging` baseline JSON): no file differs, `total 276` (= baseline 276).

Status: `sealed_pending_verifier`.
