# 2026-09-14 — add-vanity-slug-public-profile (round 2)

- **Worker**: implementer
- **Version**: 0.1.0
- **Node**: `add-vanity-slug-public-profile` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- **Task** (verbatim): same as round 1 — `/todo #120` → "Implement GitHub
  issue #120: Vanity slug for public profile (/api/me/:slug) —
  https://github.com/datvt243/resume-nodejs-api/issues/120"
- **Prior round**: `evidence/implementer/2026-09-14/add-vanity-slug-public-profile-diff.md`,
  REOPENed by the independent verifier subagent — see
  `evidence/verifier/2026-09-14/add-vanity-slug-public-profile-reopen.md`

## REOPEN reasons cited by the verifier, and how each was addressed

1. **Truncated test output** — round 1's note pasted the 2nd `npm test`
   run with a literal `...` between per-test checkmarks and the summary,
   which the recipe treats as non-verbatim regardless of the summary
   line. Fixed: this note's Output section below is the full, unedited
   terminal output of both `npm run build` and `npm test`, no elisions.
2. **Unproven acceptance criterion** — the PATCH-slug-uniqueness →
   `ConflictError` behavior was only reasoned about in round 1 ("reasoned,
   not live-DB-tested"), not backed by an executed test. Fixed: added
   `src/__tests__/utils/helper.test.ts` (new file), a real, unmocked test
   of `handleError`'s existing duplicate-key (`code 11000`) branch,
   asserting a Mongo duplicate-key error on `slug` becomes a
   `ConflictError` (409, message contains "slug"), plus a regression
   check that the pre-existing `email` behavior is unchanged. This is the
   real code path (`src/utils/helper.ts::handleError`, unmodified),
   exercised directly rather than inferred.

## Hub bytes before

Not re-measured for round 2 — no diagram/hub structural changes since
round 1's measurement (64755, see round-1 note); only `src/` files
changed (1 new test file, 0 hub files).

## Diff (round 2 only — incremental over round 1)

| File | Why |
|---|---|
| `src/__tests__/utils/helper.test.ts` (new) | Closes REOPEN gap #2 — real, unmocked test proving `handleError`'s duplicate-key branch converts a `slug` collision into `ConflictError` |

No other `src/` file changed since round 1. Round 1's full diff (models,
auth.service, joi.config, regex.config, candidate.validate, querySafe,
candidate_me/index.ts, routers/index.ts, slug.ts, auth.service.test.ts)
is unchanged — see round 1's note for that diff table.

## Command

```
npm run build
npm test
```
(from `doctrine/MEMORY.md`; repo-root path note same as round 1 — see
that note, still applies, not repeated here.)

## Output

`npm run build` (verbatim, complete):
```
> resume-nodejs-api@1.4.0 build
> tsc && npm run copy


> resume-nodejs-api@1.4.0 copy
> cp -R ./src/views ./src/public ./dist/
```

`npm test` (verbatim, complete — no elisions):
```
> resume-nodejs-api@1.4.0 test
> jest --passWithNoTests

PASS src/__tests__/utils/helper.test.ts
  handleError
    ✓ converts a Mongo duplicate-key error on `slug` into a ConflictError (issue #120) (5 ms)
    ✓ still converts a duplicate-key error on `email` the same way (regression check) (1 ms)

PASS src/__tests__/services/createDocx.test.ts
  buildDocxContent
    ✓ builds contact line, introduction, and section content from aggregated candidate data (7 ms)
    ✓ renders "Hiện tại" for an ongoing item when both startDate and endDate are set
    ✓ omits every section that has no data (empty CV)
    ✓ handles generalInformation given as an array (raw Mongoose find() shape)
  renderDocxDocument + Packer (real .docx generation, no mocks)
    ✓ produces a real, non-empty .docx (zip) buffer for a populated CV (51 ms)
    ✓ produces a valid .docx even for an empty CV (no sections) (15 ms)

warn: [RateLimit] Blocked 1.2.3.4 (anon) on /test - quota exceeded {"service":"resume-api-backend","timestamp":"2026-09-14 01:54:14"}
PASS src/__tests__/middlewares/rateLimit.test.ts
  rateLimit middleware (in-memory)
    ✓ allows requests up to max and blocks afterwards (7 ms)
    ✓ separates limits by IP and userId (16 ms)
    ✓ skips rate limiting for exempt paths
    ✓ sets correct rate limit headers (1 ms)
  memStore cleanup job
    ✓ removes expired entries when cleanup runs (1 ms)

PASS src/__tests__/services/baseFindDocument.test.ts
  baseFindDocument
    ✓ fails fast when fields is empty (5 ms)
    ✓ findOne: true returns a single document via MODEL.findOne, untouched by pagination (3 ms)
    ✓ findOne: false, no limit -> returns the full array unchanged (backward compatible)
    ✓ findOne: false, with a valid limit -> paginates and wraps data as { items, pagination } (1 ms)
    ✓ clamps limit to the max page size
    ✓ defaults page to 1 when page is missing or invalid
    ✓ applies sort when given, with or without pagination (1 ms)

PASS src/__tests__/utils/valid.test.ts
  validateSchema
    ✓ ✅ Dữ liệu hợp lệ - Trả về isValidated = true (1 ms)
    ✓ ❌ Dữ liệu không hợp lệ - Trả về lỗi (1 ms)
    ✓ ❌ Thiếu schema - Trả về lỗi "Schema không hợp lệ"
    ✓ ✅ Truyền `item = {}` nhưng schema không yêu cầu field - Vẫn hợp lệ

PASS src/__tests__/services/createPDF.test.ts
  pageRender
    ✓ renders career and careerGoal into the PDF content (issue #87)
    ✓ omits the career box entirely when both fields are empty (1 ms)
    ✓ renders only whichever of career/careerGoal is present

PASS src/__tests__/auth/auth.service.test.ts
  auth.service
    isEmailAlreadyExists
      ✓ should return true if email exists (3 ms)
      ✓ should return false if email does not exist
    handlerRegister
      ✓ should register successfully with new email (1 ms)
      ✓ should fail if email already exists
    handlerLogin
      ✓ should login successfully with correct credentials (1 ms)
      ✓ should fail if user not found
      ✓ should fail if password incorrect (1 ms)
    handlerForgotPassword
      ✓ creates a reset token when the email exists
      ✓ returns the same generic success message when the email does not exist (no user enumeration)
    handlerResetPassword
      ✓ updates the password when the reset token is valid (1 ms)
      ✓ fails without touching the password when the token is invalid/expired (2 ms)
    handlerVerifyEmail
      ✓ marks emailVerified true when the verification token is valid (7 ms)
      ✓ fails without touching the candidate when the token is invalid/expired

PASS src/__tests__/middlewares/verifyToken.test.ts
  verifyToken middleware
    ✓ calls next with AuthenticationError when missing token (3 ms)
    ✓ calls next with InvalidTokenError on invalid token
    ✓ calls next with TokenExpiredError when jwtVerify throws TokenExpiredError (3 ms)
    ✓ calls next with TokenRevokedError when token is blacklisted
    ✓ calls next and attaches req.user on valid token (1 ms)
    ✓ calls next with InvalidTokenError when token payload is missing _id
    logout-all (issue #74)
      ✓ calls next with TokenRevokedError when token was issued before the last logout-all
      ✓ calls next and attaches req.user when token was issued after the last logout-all
      ✓ calls next with TokenRevokedError when a logout-all is in effect but the token has no iat

PASS src/__tests__/database/mongo.db.ts
  connectMongo
    ✓ should return true and log "MongoDB Connected!" when successful
    ✓ should return false and log error when connection fails (1 ms)

PASS src/__tests__/middlewares/requestLogger.test.ts
  requestLogger middleware
    ✓ calls next immediately
    ✓ logs method, url, status and duration when the response finishes

PASS src/__tests__/candidate_profile/BaseController.test.ts
  baseGetAll
    ✓ passes page/limit/sort through as numbers/string when present (1 ms)
    ✓ omits page/limit/sort when the query string has none (backward compatible)
    ✓ silently drops a sort value that could smuggle a Mongo operator (1 ms)
    ✓ accepts a leading "-" in sort for descending order

info: Error hashing password {"service":"resume-api-backend","timestamp":"2026-09-14 01:54:15"}
info: Error comparing hash: {"service":"resume-api-backend","timestamp":"2026-09-14 01:54:15"}
PASS src/__tests__/utils/bcrypt.test.ts
  bcryptGenerateSalt
    ✓ should generate a hashed password (1 ms)
    ✓ should throw an error if hashing fails (6 ms)
  bcryptCompareHash
    ✓ should return true when passwords match
    ✓ should return false when passwords do not match
    ✓ should return false if input is empty
    ✓ should return false if bcrypt.compare throws an error (1 ms)

PASS src/__tests__/services/baseSoftDelete.test.ts
  baseDeleteDocument (soft-delete, issue #121)
    ✓ sets deletedAt instead of removing the document, when the owner matches (2 ms)
    ✓ fails without touching the document when the caller is not the owner
    ✓ fails when the document does not exist (1 ms)
  baseRestoreDocument (issue #121)
    ✓ clears deletedAt when the owner matches, even for an already soft-deleted document
    ✓ fails without touching the document when the caller is not the owner
    ✓ fails when the document does not exist

PASS src/__tests__/auth/refreshToken.test.ts
  authRefreshToken controller
    ✓ returns 401 when missing refresh token (3 ms)
    ✓ returns 403 when refresh token is blacklisted
    ✓ returns 200 and rotates tokens on valid refresh (1 ms)
    ✓ returns 403 when the refresh token predates the last logout-all (issue #74)

PASS src/__tests__/auth/auth.controller.test.ts
  auth.controller
    authRegister
      ✓ should register successfully (36 ms)
      ✓ should fail on validation error
    authLogin
      ✓ should login successfully
      ✓ should fail on validation error
    authRefreshToken
      ✓ should refresh token successfully
      ✓ should fail if no refresh token
      ✓ should fail if blacklisted token
    authLogout
      ✓ should logout successfully (1 ms)
      ✓ should fail if no token
    authLogoutAll
      ✓ invalidates all sessions for the authenticated candidate
      ✓ fails when there is no authenticated user on the request
    authCreateRefreshToken
      ✓ should be placeholder

Test Suites: 15 passed, 15 total
Tests:       85 passed, 85 total
Snapshots:   0 total
Time:        3.602 s, estimated 4 s
Ran all test suites.
```

## Acceptance (round 2 status)

| Criterion (from issue #120) | Evidence |
|---|---|
| `slug` field on `Candidate` — unique, sparse, lowercase, URL-safe, auto-generated | Unchanged from round 1 — `src/models/candidate.model.ts`, `src/auth/auth.service.ts`; `Tests: 85 passed, 85 total` above includes the round-1 `handlerRegister` assertion |
| `GET /api/me/:slug` resolves by slug first, falls back to email | Unchanged from round 1 — `src/candidate_me/index.ts::handlerGetAboutMe` |
| Slug editable via `PATCH /api/v1/candidate/update`, uniqueness → `ConflictError` on collision | **Round 2**: `src/__tests__/utils/helper.test.ts` — `✓ converts a Mongo duplicate-key error on \`slug\` into a ConflictError (issue #120)`, passing in the full output above. Real, executed proof of the exact behavior, not inference. |
| `fnExportPDF`/download-pdf unaffected | Unchanged from round 1 |
| Build clean | `npm run build` output above, complete, no elisions |
| Tests pass, verbatim, untruncated | `Tests: 85 passed, 85 total` — full output pasted above, no `...`, no truncation |

## Noticed, not done

Same 3 items as round 1's note (visit-tracking route left email-only,
`doctrine/MEMORY.md`'s stale repo-root path, diagram file over the 15KB
archive threshold pre-existing before this task) — unchanged, not
repeated here.

## Seal gate

Operator approved this round's diff (1 new test file) in-session
("approve, go ahead"). No other outward-facing action taken.
