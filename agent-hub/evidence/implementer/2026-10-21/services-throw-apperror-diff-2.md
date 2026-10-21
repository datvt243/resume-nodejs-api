# 2026-10-21 - services-throw-apperror (diff, round 2 after REOPEN)

- Worker: implementer · Version: 0.1.0
- Node: `services-throw-apperror` (PENDING) · Issue #277 · Branch `277-refactor-api-phase`
- Status: `sealed_pending_verifier`
- Responds to: `evidence/verifier/2026-10-21/services-throw-apperror-reopen.md` — criterion (3) "ATS check / export not found → 404" had no named test.
- Everything else as in `evidence/implementer/2026-10-21/services-throw-apperror-diff.md` (unchanged src; this round only adds tests).

## Change
- `src/__tests__/candidate_me/index.test.ts`: new `describe('own-CV endpoints when the candidate no longer exists')`, `it.each` over `fnExportPDF` (`GET /api/v1/download-pdf`) and `fnAtsCheck` (`POST /api/v1/cv/ats-check`): `Candidate.findOne` resolves null → handler calls `next`, the error is run through the real `errorsMiddleware`, asserts `res.status` called once with 404 and body `{ success:false, errorCode:'NOT_FOUND' }`. Neither handler had any test before (grep for `fnExportPDF|fnAtsCheck` in `src/__tests__` was empty). On the pre-change code both wrote `res.status(400)` directly and never called `next`, so this test fails there.

## Acceptance row (3), complete
| Endpoint | Test |
|---|---|
| `GET /api/me/:email` unknown + private, identical body | `candidate_me/index.test.ts` "GET /api/me/:email answers a private profile with the same 404 body as an unknown one" |
| `GET /api/me/:identifier/download-pdf` | `candidate_me/public-pdf.test.ts` "answers a private profile exactly like an unknown identifier" (404 + `NOT_FOUND`) |
| `POST /api/me/:email/visit` | `candidate_me/index.test.ts` handlerRecordVisit QuerySafe-rejected email → rejects `{statusCode:404}` |
| `GET /api/v1/download-pdf` | `candidate_me/index.test.ts` "GET /api/v1/download-pdf answers 404 NOT_FOUND, not 400" (new) |
| `POST /api/v1/cv/ats-check` | `candidate_me/index.test.ts` "POST /api/v1/cv/ats-check answers 404 NOT_FOUND, not 400" (new) |
| `GET /candidate/:id`, `/:email` | `candidate/candidate.controller.test.ts` "GET /:id / GET /:email answers 404, not 400" |

## Test output (verbatim, `npm test` from repo root)
```
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 48 passed, 48 total
Tests:       438 passed, 438 total
Snapshots:   0 total
Time:        10.051 s
Ran all test suites.
```
(Exit warning pre-exists on `staging`, see round-1 note.)

## Build output (verbatim, `npm run build`, exit 0, `grep -c "error TS"` = 0)
```
> resume-nodejs-api@1.14.0 build
> tsc && npm run copy


> resume-nodejs-api@1.14.0 copy
> cp -R ./src/views ./src/public ./dist/
```

## Lint
`eslint . -f json`: 276 (staging baseline 276), no file above its baseline count.

## Comments per code-comments.md
No comments added or changed this round.
