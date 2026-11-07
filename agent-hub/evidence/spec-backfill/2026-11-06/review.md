# spec-backfill review — 2026-11-06

- Isolation proof: this review ran as a separate spawned agent with task description "Verify nodejs specs vs code+live". It did not write the docs.
- Branch: `chore/agent-hub-analyst`. `src/` is identical to `origin/main` (`git diff origin/main...HEAD -- src` and `git diff HEAD -- src` are both empty), so live (release v2.7.0) = this branch's code.
- Scope: the 13 docs in `doctrine/features/` (INDEX.md excluded). No code changed, nothing committed. Every doc is still `Status: draft`.

## Mechanical checks (all 13 docs)
- Format: all 7 sections present, `- Status: draft`, `- Source: backfill from code`, an INDEX row for each → PASS.
- Anchors: every backticked path in each `- Anchors:` line exists → PASS.
- Test files cited: all 41 exist. Ran `npx jest <all 41 cited files>`: 39 suites passed, 2 failed (459/464 tests), both from the environment:
  - `src/__tests__/auth/tokenExpiry.test.ts`: "falls back to 1h" expected 3600 but got 10800, because the local `.env` sets `TOKEN_EXP_IN` and the test reloads config.
  - `src/__tests__/services/atsPdfIntegration.test.ts`: "Could not find Chrome (ver. 127.0.6533.88)". With `CI_NO_CHROME=1`: 4 skipped.

## Live checks (read-only, unauthenticated, ~20 requests, 1 PDF)
- `GET /health` → 200 `{"status":"ok",…}` (cold start 41.5s), no rate-limit headers (exempt).
- `GET /api-docs/` → 200 HTML. `/api-docs.json` paths match the v1 + `/api/me` routes in code (v2 is not documented in Swagger).
- `GET /api/me/search?q=developer&limit=3` → 200, items `{slug, firstName, lastName, positionDesired}` + `meta {page,limit,total,totalPages}`. `q=a` → 400 `BAD_REQUEST` "Từ khoá tìm kiếm phải dài từ 2 đến 100 ký tự". `q=c++` → 200, `[]` (taken literally, no regex error).
- `GET /api/me/vo-tan-dat?lang=en` → 200. Section items have no `_id`/`candidateId`/timestamps. `description` comes back as a resolved string. Candidate keeps `_id`, `email`, `phone`, `address`, `birthday`, `gender`, `marital`, `isPublic` (matches the public-profile open question 1). `?profile=xyz` → 200 (ignored).
- `GET /api/me/does-not-exist-zzz` → 404 `{"success":false,"error":{"code":"NOT_FOUND","message":"Email không tồn tại"}}`.
- `GET /api/me/vo-tan-dat/download-pdf?template=classic` → 400 "Chỉ hỗ trợ template=ats". `…/download-pdf?lang=en` (the single PDF call) → 200 `application/pdf`, `Content-Disposition: attachment; filename="Vo_Tan_Dat_Information_Technology_CV_EN.pdf"` (matches cv-export rule 7: no email, `_EN` suffix).
- `GET /api/v1/education/` with no token → 401 `NO_TOKEN`. `GET /api/v1/download-pdf` with no token → 401 `NO_TOKEN`. `Authorization: Bearer abc` → 401 `INVALID_TOKEN`.
- Unknown route `GET /api/v1/nope` → 404 `ROUTE_NOT_FOUND`. Wrong method `GET /api/v1/auth/register` → 404 `ROUTE_NOT_FOUND` (no 405).
- Error envelope everywhere: `{ success:false, error:{ code, message } }`. Rate-limit headers `x-ratelimit-limit: 100`, `x-ratelimit-remaining`.
- `x-ratelimit-remaining` went 97 → 90 over my 7 requests (as expected), then 90 → 68 over my next ~7 requests. So about 15 requests from someone else landed in my bucket. Explained by code: the limiter keys on `req.ip` and `trust proxy` is never set (grep: no hits in `src/`), so behind Render's proxy all clients probably share one bucket.
- Live vs code: no mismatch found.

## Per-doc verdicts
| Doc | Verdict | Notes |
|---|---|---|
| ats-check.md | PASS | Rules 1–6 match `candidate_me/ats-check.ts`, `atsChecks.ts` (10 ids, weights 2/1, round), `keywordMatcher.ts:47-60`. |
| auth-password-reset.md | FIXED | Rule 1: added the email TLD whitelist. Open question added: Redis consume is `GET`+`DEL`, not atomic (`utils/passwordReset.ts:67-68`, same in `emailVerification.ts:68`). |
| auth-register-login.md | FIXED | Rule 1: `email` only allows the TLDs `com`/`net`/`vn` (`config/joi.config.ts:41-44`; `node -e` with joi: `a@b.io` and `a@b.org` are both invalid). Rule 5: login re-validates with the register password rules (`auth.validate.ts` `schemaAuthLogin` uses `password`), so a malformed password → 400, not 401. The acceptance criterion now says the password must be rule-conforming. Open questions added: TLD whitelist; legacy passwords blocked at login; v2 router has no `authLimiter`, and the 150 limit never binds under the global 100. |
| auth-session-tokens.md | FIXED | Behavior is correct (`helper-auth.ts`, `verifyToken.middleware.ts`, `auth.controller.ts`, `sessionRevocation.ts:84-88`). The tokenExpiry acceptance criterion now notes it depends on the local env (see above). |
| candidate-account.md | FIXED | Rule 3: `introduction` is required (`candidate.validate.ts` → `joi.config.ts` `introduction ... .required()`). Added length limits, and unknown keys → 400 (`getObject` = plain `Joi.object`). Open question added: `GET /candidate/:email` fails open to `findOne({})` (`candidate.service.ts` `handlerGetInformationByEmail`; QuerySafe drops `$`/blank values, `querySafe.ts:19-27`). |
| cv-export.md | FIXED | Rule 1: tokens come from any `verifyToken` source, not just header/`?token=` (`routers/api/v1/index.ts:120` → `verifyTokenByQuery` = `verifyToken`). Rule 8: the ATS file name is the slugified email (`createPDF.ats.ts:482`). The atsPdfIntegration criterion now says it needs Chrome or `CI_NO_CHROME=1`. |
| cv-file-upload-import.md | FIXED | Rule 6 was wrong: the parsers return plain-string `school`/`major`/`description` (`parseCvPdf.service.ts:249,260`, `parseLinkedInExport.service.ts:92-98`), but education/experience schemas need `{vi,en}` (`education.validate.ts:11-16` `localizedName`/`descriptionOptional`, `experience.validate.ts` `description`). Sending them to `/bulk` as-is → 400. Open questions added: same, plus a failed oversized re-upload deletes the previous CV (multer 2.3.0 `storage/disk.js:46` writes to the final path, then `_removeFile` unlinks it on error, while `cvFile` metadata stays). |
| cv-profiles.md | FIXED | Rule 4 implied visits filter sections. They only store the body `profile` id (`candidate_me/index.ts` `resolveVisitProfileId`). Reworded. |
| cv-section-crud.md | FIXED | Behavior is correct (`BaseController.ts`, `services/index.ts`). Open question added: a `$`-containing `:id` on delete/restore fails open to `findOne({})` (`_baseHelper.baseCheckDocumentById` + `querySafe.ts`). |
| general-information.md | PASS | Matches `generalInformation.controller.ts`/`.service.ts` (409 `ConflictError`, `{}` when empty, PUT full / PATCH patch schema). |
| job-applications.md | PASS | Matches `application.validate.ts`/`.service.ts` `checkProfileLink`. Checked that `Joi.string().min(0).required()` accepts `""` (`node -e`: no error). |
| profile-visits.md | PASS | Matches `candidate_me/index.ts` (`visitorIp`, `normalizeReferrer`, `resolveVisitProfileId`) and `visitStats.service.ts` (default tz, 400 buckets, `%G-W%V`, sort count desc). |
| public-profile.md | FIXED | Behavior is correct and confirmed live (search shape, 400 on `q=a`, literal `c++`, 404 envelope, bad `?profile=` ignored, `template=classic` 400, PDF filename). Open question added: the global rate limit is shared because `trust proxy` is never set (live evidence above). Not checked live: private-vs-unknown 404 identity (no known private slug). |

## Real bugs found (not in the original Open questions)
1. `GET /api/v1/candidate/:email` fails open: an email with `$`, or blank after trim, returns an arbitrary candidate's full record (authenticated route).
2. `DELETE /<section>/delete/:id` and `POST /<section>/restore/:id` fail open the same way on `$` ids.
3. Oversized re-upload to `/candidate/upload-cv` deletes the previous stored CV while the DB still says one exists.
4. CV-PDF / LinkedIn import output can't be posted to `/education/bulk` / `/experience/bulk` unchanged (string vs `{vi,en}`).
5. Reset and verify tokens aren't strictly single-use under concurrency (Redis `GET`+`DEL`).
6. Global rate limit probably shared by all clients (`req.ip` without `trust proxy` behind Render). Live evidence is consistent but not conclusive.
7. The email TLD whitelist (`com`/`net`/`vn`) blocks register/login/forgot for every other TLD. This may be intended; it is now an open question.
