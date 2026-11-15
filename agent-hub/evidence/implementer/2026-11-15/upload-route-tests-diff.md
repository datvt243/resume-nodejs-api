# upload-route-tests — diff (implementer, implement)

- Date: 2026-11-15 · Branch: `402-add-tests-for` · Issue: #402
- Node: `upload-route-tests` (`haven/diagrams/dev-loop.prime-mermaid.md`) · Plan: `evidence/implementer/2026-11-15/upload-route-tests-plan.md`
- Status: sealed_pending_verifier

## Diff summary
- `src/__tests__/candidate/cvFileRoutes.test.ts` (new, 8 tests): real `candidate.route.ts` mounted on express behind a stub `req.user` (verifyToken has its own tests), driven over HTTP with `fetch` + `FormData` — same harness as `src/__tests__/middlewares/uploadCV.middleware.test.ts`. `handlerUploadCV` / `handlerGetCVFile` spied (no DB).
- `src/__tests__/candidate_profile/imageUploadRoutes.test.ts` (new, 27 tests = 9 × award/certificate/project via `describe.each`): real section routers, `findById` / `updateOne` spied on the model; real multer writes to `IMAGE_UPLOAD_DIR`, files cleaned up by `<entryId>-` prefix.
- No production code changed: `git diff --quiet staging -- src` → "no tracked src changes"; `git status --short src` lists only the 2 new files.

## Commands (verbatim from doctrine/MEMORY.md)
- Test one file: `npx jest src/__tests__/candidate/cvFileRoutes.test.ts src/__tests__/candidate_profile/imageUploadRoutes.test.ts` → `Tests:       35 passed, 35 total`
- Test: `npm test` → `Test Suites: 2 failed, 69 passed, 71 total` / `Tests:       5 failed, 738 passed, 743 total`. The 5 failures are exactly the known env-only ones: `src/__tests__/auth/tokenExpiry.test.ts` (1 — `Expected: 3600` / `Received: 10800`, local `.env` TOKEN_EXP_IN) and `src/__tests__/services/atsPdfIntegration.test.ts` (4 — `Could not find Chrome (ver. 127.0.6533.88)`). Same 5 recorded in `evidence/implementer/2026-11-14/config-fail-fast-diff.md` and the other 2026-11-14 notes; this diff touches no tracked file, and neither suite imports the new files. First run (31 new tests): 734 passed, same 5 failed → +4 tests from the review fixes = 738 incl. 35 new.
- Typecheck (`inside Build`): `npm run build` → `build rc=0`
- Lint: `npm run lint` → `✖ 274 problems (274 errors, 0 warnings)` = baseline 274. `npx eslint <2 new files>` → `lint-new rc=0` (first run had 1 `no-unnecessary-type-assertion` in imageUploadRoutes.test.ts:55, total 275 — fixed by dropping `as any`).
- Cleanup: after the full run `ls src/public/uploads/images src/storage/cv | grep -c "test-img-routes\|test-cv-routes"` → `0`.

## Acceptance criteria → evidence (verbatim jest output, last run)
CV (`cv-file-upload-import.md` Behavior #2-3):
- ✓ stores a valid PDF and answers 200 with { originalName, uploadedAt }
- ✓ rejects a file over 5MB with 400 cvFileTooLarge
- ✓ rejects a non-PDF mime type with 400 FILE_INVALID_TYPE
- ✓ rejects a non-.pdf extension with 400 FILE_INVALID_TYPE
- ✓ answers 400 when the request carries no file
- ✓ answers 404 on GET /cv-file before any upload, even with a file on disk
- ✓ answers 404 on GET /cv-file when the record exists but the file is gone
- ✓ downloads the stored file under its original name
Images (`cv-section-crud.md` Behavior #9), each of `POST /award|certificate|project/:id/images`:
- ✓ stores the images and answers 200 with existing + new URLs
- ✓ answers 404 for an unknown id and writes nothing
- ✓ answers 404 for a soft-deleted entry and writes nothing
- ✓ answers 403 for another candidate's entry and writes nothing
- ✓ answers 400 when the request carries no file
- ✓ answers 400 for a file over 5MB
- ✓ answers 400 for more than 5 files
- ✓ answers 400 FILE_INVALID_TYPE for a non-image mime type
- ✓ answers 400 FILE_INVALID_TYPE for a disallowed extension
- `Tests:       35 passed, 35 total`
- Mutation check (tests catch a real regression): temporarily removed `|| document.deletedAt` from `baseUploadImages` → `✕ answers 404 for a soft-deleted entry and writes nothing` ×3, `Tests: 3 failed, 24 passed, 27 total`; reverted with `git checkout -- src/candidate_profile/BaseController.ts`, `git status --short src` back to only the 2 new files.
- Comments per `doctrine/standards/code-comments.md`: file-header `/** */` says why (HTTP-level, services/models spied so no DB); one `//` WHY line ("Stands in for verifyToken"); no `(#N)` refs.

## Review
- `/code-review medium` (forked): 10 findings, 0 correctness bugs in production code — all "assertion too weak" on the tests plus 2 cleanups. Fixed:
  1. CV > 5MB asserted only 400 → now asserts `t('candidate.cvFileTooLarge')` message.
  2. cv-file 404 passed regardless of the record → "before any upload" now seeds the file on disk; added "record exists but file gone" case.
  3/7. Image size/count/type rejections didn't check disk → each now asserts `storedFiles()` empty and `updateOne` not called; size and type cases send a valid file first, so multer's cleanup of a partial batch is proven.
  4. No soft-deleted case → added (it.each with unknown id); mutation check above.
  5. Size vs count indistinguishable → assert `images.fileTooLarge` / `images.tooManyFiles` / `images.noFilesUploaded` messages.
  6. CV invalid-type didn't assert service not called → added.
  9. Oversize test duplicated the middleware test weakly → now asserts the specific message (the middleware test keeps the previous-CV-intact check).
- Not done (cleanup, out of scope): 8 shared harness helper; 10 temp dir instead of real upload dirs — see below.
- `/security-review`: n/a (label `testing`, not `security`).

## Supersedes: none
## Still open: none (grep `#402` in the active diagram → only this row)

## Feature doc: agent-hub/doctrine/features/cv-file-upload-import.md, agent-hub/doctrine/features/cv-section-crud.md (unchanged — tests only)

## Noticed, not done
- Express + `listen(0)` + stub-user harness now in 3 test files (`uploadCV.middleware.test.ts` + the 2 new); a shared `startTestServer(mount)` helper would dedupe it — not added (new abstraction, not asked).
- Tests write to the real `src/public/uploads/images` / `src/storage/cv` (the dirs are module constants); a killed run can leave `test-img-routes-<pid>-*` files (gitignored). Same pattern as the existing upload test.
- Mongo writes are mocked; no in-memory Mongo test here (that's #463's scope for auth).
