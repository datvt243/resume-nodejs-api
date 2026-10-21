# 2026-10-21 - fix-status-codes (diff)

- Worker: implementer · Version: 0.1.0
- Node: `fix-status-codes` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING, last row)
- Task: `/todo #276` — "fix(api): phase 3/5 — correct status codes (create, validation, register, login, refresh, bulk)"
- Branch: `276-fix-api-phase` (from `staging` @ 9828871)
- Plan note: `evidence/implementer/2026-10-21/fix-status-codes-plan.md`
- Status: `sealed_pending_verifier`

## Hub bytes before: 244034

## Diff
`git diff --stat -- src`: 14 files changed, 175 insertions(+), 89 deletions(-), plus new `src/__tests__/candidate_profile/generalInformation.controller.test.ts` (59 lines).

| File | Why |
|---|---|
| `src/auth/auth.controller.ts` | register/login validation 401 → 400; register success 200 → 201; register duplicate → `next(AppError 409 EMAIL_EXISTS)`; login failure → `next(InvalidCredentialsError)` (401 `INVALID_CREDENTIALS`, i18n fallback `auth.invalidCredentials`); refresh rotated/blacklisted/predates-logout-all/lost-claim (4 sites) 403 → `next(TokenRevokedError)` (401 `TOKEN_REVOKED`, same message at all 4 so reuse detection stays unobservable) |
| `src/auth/auth.service.ts` | `handlerLogin`: unknown email and wrong password both return `t('auth.invalidCredentials')` (anti-enumeration) |
| `src/candidate/candidate.controller.ts` | `fnUpdate`/`fnUpdateFields` validation 401 → 400 |
| `src/candidate_profile/general_information/generalInformation.controller.ts` | `fnCreate` failure 201 → 400; `fnUpdate`/`fnUpdateFields` validation 401 → 400 |
| `src/candidate_profile/BaseController.ts` | `fnCreate` failure 201 → 400; `fnBulkCreate` all items failed → 400 `success:false`, written with `res.status().json()` and the same 4 body keys as `formatResponse` (which would null `data`), so `data.results`/`summary` survive; partial success unchanged (201, `success:true`) |
| `src/errors/AppError.ts` | `ErrorCode.EMAIL_EXISTS` |
| `src/locales/{en,vi}.ts` | `auth.invalidCredentials` added; `auth.emailNotFound`/`auth.wrongPassword` removed (only user was `handlerLogin`, grep-confirmed) |
| tests | see Acceptance |

Envelope note (for the verifier to judge against "keep the envelope keys"): the 3 auth rows whose acceptance requires an error code (`EMAIL_EXISTS`, `INVALID_CREDENTIALS`, `TOKEN_REVOKED`) now answer through `errorsMiddleware`, the only existing writer of `errorCode`. Their body is the middleware's existing error body `{ success:false, errorCode, message }` (+`errors` when set) instead of `formatReturn`'s `{ success:false, message, errors, data:null }`. No new envelope was introduced; it is the same body every `AppError` already gets (e.g. `verifyToken`'s 401 `TOKEN_REVOKED`). All other rows keep `formatReturn`'s keys; bulk all-fail keeps them exactly (test asserts keys).

## Command
From repo root `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (per `doctrine/MEMORY.md`):
- `npm test`
- `npm run build` (typecheck: `tsc`)
- Lint: `npx eslint . -f json` summed, per-file diff vs the same on `staging` (`git stash -u`)

## Output
`npm test` (verbatim):
```
Test Suites: 47 passed, 47 total
Tests:       426 passed, 426 total
```
`npm run build` (verbatim, no `error TS` lines):
```
> resume-nodejs-api@1.14.0 build
> tsc && npm run copy
> resume-nodejs-api@1.14.0 copy
> cp -R ./src/views ./src/public ./dist/
```
Lint: first count `base 276 now 277`, single new finding `generalInformation.controller.test.ts 23:@typescript-eslint/no-unnecessary-type-assertion` (an `as never` in a new test). Removed; `npx eslint src/__tests__/candidate_profile/generalInformation.controller.test.ts` → no output (0 problems), `npx tsc --noEmit -p .` → no output, that suite re-run `Tests: 3 passed, 3 total`. Every other file's count equal to baseline → total 276 = baseline 276.

Intermediate (first full run after the production edits, before test updates): `Tests: 19 failed, 397 passed, 416 total` — all 19 in `src/__tests__/auth/*` and all asserting the old 403/401/200 statuses or the 2 old login messages; updated as listed below.

## Acceptance
| Criterion | Evidence |
|---|---|
| create failure is never 2xx (BaseController) | `BaseController.test.ts` "fnCreate answers a failed create with 400, never 201" + "fnCreate still answers a successful create with 201" |
| create failure is never 2xx (generalInformation) | new `generalInformation.controller.test.ts` "a failed create answers 400, never 201" (real valid body reaches the mocked failing service) |
| validation → 400 (auth) | `auth.controller.test.ts` register + login "should fail on validation error" now assert `StatusCodes.BAD_REQUEST` |
| validation → 400 (candidate) | `candidate.controller.test.ts` "PUT /update answers 400, not 401", "PATCH /update answers 400, not 401" |
| validation → 400 (generalInformation) | `generalInformation.controller.test.ts` "PUT /update …" / "PATCH /update validation failure answers 400, not 401" (service never called) |
| register 201 / 409 `EMAIL_EXISTS` | `auth.controller.test.ts` "should register successfully" asserts `StatusCodes.CREATED`; new "answers a duplicate email with 409 EMAIL_EXISTS via errorsMiddleware" |
| one login-failure message + `INVALID_CREDENTIALS` | `auth.service.test.ts` "should fail if user not found" and "should fail if password incorrect" both expect `'Email hoặc mật khẩu không chính xác'`; `auth.controller.test.ts` new "answers a failed login with 401 INVALID_CREDENTIALS via errorsMiddleware" (no cookies set) + en fallback `'Incorrect email or password'` |
| refresh revoked → 401 `TOKEN_REVOKED` | `refreshToken.test.ts` `expectRevoked` (no `res.status`, `next` once with `{statusCode:401, errorCode:'TOKEN_REVOKED'}`) on blacklisted, raced claim, predates logout-all, and all 4 reuse cases; "answers a reused token exactly like a logged-out one" now compares the forwarded `{statusCode, errorCode, message}`; `auth.controller.test.ts` blacklisted + en message; `refreshTokenReuse.test.ts` end-to-end on real jwt + in-memory stores: every former 403 is 401, race `[200, 401]` |
| bulk all-fail → 400 | `BaseController.test.ts` "fnBulkCreate answers 400 with success:false when every item fails, keeping results/summary" (keys exactly `data, errors, message, success`; summary `{total:2, succeeded:0, failed:2}`) |
| release note lists the status changes | text below, to go into the commit message + PR body (no CHANGELOG file exists; `/release` builds notes from merged PR bodies) |
| `npm test`, `npm run build` green, lint ≤ baseline | Output above: 47/47 suites, 426/426 tests; build clean; lint 276 = 276 |
| comments per `doctrine/standards/code-comments.md` | new/changed comment lines quoted below — WHY only, `//` for one sentence, `/** */` for multi-sentence, no `(#N)` refs |

Comment lines added/changed in production code (`git diff -- src ':!src/__tests__'`):
```
+  // Same answer for an unknown email and a wrong password, so login can't be used to probe which emails are registered.   (auth.service.ts)
+       * Every item failed: a 400 with `success: false`. Written directly with
+       * the same body keys because utils/helper.ts's formatResponse() nulls
+       * out `data` whenever `success` is false, which would drop
+       * `results`/`summary`, the one thing the caller needs here.                                      (BaseController.ts)
+       * At least one item was created: envelope `success` stays true and
+       * per-item outcome lives in `results[].success`/`summary`, for the same
+       * formatResponse() reason as above.                                                              (BaseController.ts, rewrites the old block)
```

## Release note (status changes)
- `POST /<section>/create` (all CV sections, `generalInformation`): failed create → **400** (was 201 with `success:false`).
- `POST /<section>/bulk` (`education`, `experience`): every item failed → **400** `success:false`, `data.results`/`summary` still present (was 201). Partial success unchanged (201).
- Validation failures → **400** (was 401): `POST /auth/register`, `POST /auth/login`, `PUT|PATCH /candidate/update`, `PUT|PATCH /generalInformation/update`.
- `POST /auth/register`: success → **201** (was 200); duplicate email → **409 `EMAIL_EXISTS`** (was 401).
- `POST /auth/login`: unknown email and wrong password → one message, **401 `INVALID_CREDENTIALS`**. i18n keys `auth.emailNotFound`/`auth.wrongPassword` replaced by `auth.invalidCredentials`.
- `POST /auth/refresh`: revoked / rotated-away / raced / predating logout-all → **401 `TOKEN_REVOKED`** (was 403).
- Body: the register-duplicate, login-failure and refresh-revoked responses now come from the global error handler — `{ success:false, errorCode, message }` (no `data:null`).
- Clients: resume-vuejs-website#252 (401 interceptor must not treat validation as auth — now fixed server-side — but must treat refresh 401 `TOKEN_REVOKED` as "log out", previously 403), datvt243.github.io#244.

## Noticed, not done
- Login timing still differs (bcrypt only runs when the email exists), so enumeration by timing remains possible. Out of the status-code scope.
- `auth.loginFailed` is now only a fallback on the success path (`message || t('auth.loginFailed')`), effectively dead; left for phase 4/5.
- Bulk partial success stays 201 (standard allows 207/200); issue scope was only all-fail.
- `API-STANDARD.md` "Current deviations" rows for phase 3 left in place, same as phases 1–2.

## Seal gate
None — no commit/push/external action. Branch created via `gh issue develop` (Bước 0 of `/todo`).
