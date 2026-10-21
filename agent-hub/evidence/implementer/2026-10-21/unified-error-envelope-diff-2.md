# 2026-10-21 - unified-error-envelope (diff, round 2 after REOPEN)

- Worker: implementer · Version: 0.1.0
- Node: `unified-error-envelope` (PENDING) · Issue #278 · Branch `278-feat-api-phase`
- Status: `sealed_pending_verifier`
- Responds to: `evidence/verifier/2026-10-21/unified-error-envelope-reopen.md`
- Everything else as in `unified-error-envelope-diff.md`; this round changes 2 files (verifyToken + its test) and adds the export-standard check.

## 1. PDF/DOCX export standard (`doctrine/standards/pdf-export-standard.md`)
The three export files changed only on their failure path. `git diff -w -- src/services/createPDF.ts src/services/createPDF.ats.ts src/services/createDocx.ts` is deletions only (29 lines, 0 additions once indentation is ignored):
- `createPDF.ts`: the `catch` block that wrote `res.status(500).send({ status:false, ... })` was removed. `try { ... } finally { browser?.close() }` is kept, so the browser is still closed on failure.
- `createPDF.ats.ts` and `createDocx.ts`: the `try`/`catch` wrapper was removed and the body is unchanged, only dedented.
- All three dropped their now-unused `logger` import. errorsMiddleware logs the failure, with its stack, instead.
No HTML, CSS, template string, locale lookup, date formatter, sanitizer, field selection, layout, metadata or persistence line changed. Rules 1-10 (letter-spacing, fonts, lang labels, MM/YYYY dates, list rendering, sanitization, forbidden PII fields, ATS single-column, PDF metadata, no PII on disk) all concern what gets rendered or stored, so none is affected. The rendering-path tests (`createPDF.test.ts` formatDate/getSkills/launch args, `createPDF.ats.test.ts` HTML checks, `createDocx.test.ts`, `atsChecks`) pass unchanged in the run below. This follows the precedent in `fix-error-middleware-mapping-diff.md` ("only touches the catch block ... none of the 10 invariants apply").

## 2. verifyToken scope (verifier proportion concern)
I dropped the 401 → 500 status change. `verifyToken`'s last catch branch is back to the same status and code as on staging, a 401 `INVALID_TOKEN`. The only difference is the message: it is now `t('auth.invalidToken', req.lang)` instead of the underlying `err.message` / hardcoded `'Invalid token.'`. That is what criterion (3) asks for, i18n of verifyToken's hardcoded messages. It also stops echoing raw library/driver text (API-STANDARD.md R5). Test: `verifyToken.test.ts` "answers any other failure with a 401 INVALID_TOKEN that does not echo its text" (blacklist store rejects → `InvalidTokenError`, message `'Invalid token'`). The release-note line "non-JWT failure inside verifyToken: 401 → 500" is withdrawn; there is no status change on that path.

## Test output (verbatim, `npm test` from repo root)
```
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 49 passed, 49 total
Tests:       454 passed, 454 total
Snapshots:   0 total
Time:        8.213 s, estimated 10 s
Ran all test suites.
```
(The exit warning was already present on staging.)

## Build output (verbatim, `npm run build`, exit 0, `grep -c "error TS"` = 0)
```
> resume-nodejs-api@1.14.0 build
> tsc && npm run copy


> resume-nodejs-api@1.14.0 copy
> cp -R ./src/views ./src/public ./dist/
```

## Lint
`eslint . -f json` per file vs the staging baseline: 276 → 275, and no file is above its baseline.

## Comments per code-comments.md
One `//` in `verifyToken.middleware.ts`, replacing the previous round's one: a single-sentence WHY ("Same 401 as before, but the underlying error's own text is never sent to the client."). No `(#N)` refs, no stacked `//`.
