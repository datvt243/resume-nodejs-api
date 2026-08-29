# 2026-08-29 — add-candidate-cv-upload (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-candidate-cv-upload` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "frontend vừa bổ sung chức năng upload file CV, Backend
  hãy bổ sung tính năng này"

## Investigation (before touching code)

1. Audited the frontend repo (`/Users/_david/Workspace/Project/ResumeAPI/frontend`,
   separate working dir this session) — `git log` showed no dedicated
   "upload CV" feature commit; the actual state is an **uncommitted**
   working-tree change on branch `feature/home-dashboard-itviec-style`
   (`src/pages/home/PageHome.vue`). Read the file's own header comment
   and code: a file-picker (`accept="application/pdf"`) that only selects
   a file and shows a toast — `handleSelectFile` does NOT call any API;
   its own comment says explicitly "CHƯA gửi lên server vì backend chưa
   có endpoint lưu file upload" (not sent to server yet, backend has no
   save endpoint). This confirms the task's framing and also fixes the
   file type decision for me: PDF only, already baked into the frontend's
   `accept` attribute.
2. `grep -n "multer\|formidable\|busboy\|express-fileupload" package.json`
   → no existing upload library in this backend. `find src -iname
   "*upload*"` → nothing. Genuinely new feature, not a partial one to
   extend.

## Scope resolved (operator, via `AskUserQuestion`)
1. **Storage**: local disk, `src/public/uploads/cv/` — same pattern as
   the existing PDF export (`src/public/pdf/`), no new cloud
   credentials/SDK.
2. **Size limit**: 5 MB.
3. **Download**: yes, add a dedicated `GET` endpoint to retrieve the
   uploaded file (not upload-only).

## Diff
| File | Why |
|---|---|
| `package.json` / `package-lock.json` | Added `multer@^2.3.0` (dependency) + `@types/multer@^2.2.0` (devDependency, multer 2.x ships no bundled types) — real `npm install`, not hand-edited. |
| `src/middlewares/uploadCV.middleware.ts` (new) | `multer.diskStorage` config: destination `src/public/uploads/cv/` (created on first write via `fs.mkdirSync(..., {recursive:true})`, mirrors the on-demand-directory pattern), filename always `<candidateId>-cv.pdf` (deterministic — a re-upload overwrites in place, no separate old-file cleanup needed). `fileFilter` checks BOTH `mimetype === 'application/pdf'` AND `.pdf` extension — the frontend's `accept` attribute is client-side only and trivially bypassable, so this is the real enforcement. `limits: {fileSize: 5MB, files: 1}`. `uploadCVMiddleware` wraps multer's callback-style errors into this project's `formatReturn` response shape (400, translated message) instead of letting a raw `MulterError` fall through to the global error handler's generic 500 branch. |
| `src/models/candidate.model.ts` | Added `cvFile: { originalName: String, uploadedAt: Number }` — no `fileName` field stored; the on-disk filename is always deterministically `<candidateId>-cv.pdf`, so persisting it would be redundant. |
| `src/candidate/candidate.service.ts` | `handlerUploadCV(candidateId, originalName, lang)` — confirms the candidate exists, `updateOne`s the `cvFile` subdoc. `handlerGetCVFile(candidateId)` — returns `cvFile` only if `originalName` is set (distinguishes "never uploaded" from an empty subdoc). `handlerDelete` — added on-disk file cleanup: `fs.unlinkSync` on `<candidateId>-cv.pdf` if it exists, right after the existing Mongo cleanup. Previously self-delete only removed Mongo documents; the uploaded file (real personal data) would have been orphaned on disk otherwise. |
| `src/candidate/candidate.controller.ts` | `fnUploadCV` — reads `req.file` (set by the multer middleware before this handler runs), calls `handlerUploadCV` with the authenticated `req.user._id` (never a client-supplied id — same IDOR-safe pattern as `fnUpdate`/`fnDelete`). `fnDownloadCV` — looks up `cvFile` for `req.user._id`, 404s via `t('candidate.cvFileNotFound', ...)` if none, else `res.download(filePath, originalName)` — serves the real file with the original uploaded filename in `Content-Disposition`, through this authenticated route (not a static/public URL). |
| `src/routers/api/v1/candidate.route.ts` | Added `POST /upload-cv` (`uploadCVMiddleware` → `fnUploadCV`) and `GET /cv-file` (`fnDownloadCV`) + Swagger docs. **Placement matters**: both new routes are registered BEFORE the existing `GET /:email` route — `GET /:email` is a wildcard-style param route that would otherwise swallow `GET /cv-file` (Express matches same-method routes in registration order; `email` would just bind to the literal string `"cv-file"`). Caught this by reading the route file's actual registration order before writing, not by trial and error. |
| `src/config/swagger.config.ts` | Added `cvFile: {originalName, uploadedAt}` to the `Candidate` schema definition — doc-only, matches the model field. |
| `src/locales/{vi,en}.ts` | Added `candidate.cvUploadSuccess`, `candidate.cvFileTooLarge`, `candidate.cvInvalidFileType`, `candidate.cvUploadFailed`, `candidate.cvFileNotFound` — both languages, same i18n convention as the rest of `candidate.*`. |
| `.gitignore` | Added `src/public/uploads/cv/*` (keep `.gitkeep`) — uploaded files are real user data and must never be committed. Note: the existing `src/public/pdf/` directory has NO such rule and in fact already has a real generated PDF committed to the repo (`src/public/pdf/votan.it@gmail.com.pdf`) — pre-existing, out of scope to fix here, but this new `.gitignore` rule at least prevents the same mistake for the new upload path going forward. |
| `src/public/uploads/cv/.gitkeep` (new, untracked pending commit) | Makes the directory exist in a fresh clone / `dist/` (via the build's `cp -R ./src/public ./dist/` copy step) — same convention as `src/public/pdf/.gitkeep`. |

## Command
```
npm run build
```
Output: clean, `tsc && npm run copy` completed with no errors.

```
npm test
```
(run from `/Users/_david/Workspace/Project/ResumeAPI/backend`, copied
verbatim from `doctrine/MEMORY.md`)

### Output (verbatim, tail)
```
Test Suites: 10 passed, 10 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        5.887 s
Ran all test suites.
```
Same 10 suites / 52 tests as the prior sealed baseline
(`add-json-export-format-seal.md`) — zero regressions, zero new
automated tests added. `src/candidate/candidate.controller.ts` /
`.service.ts` have zero pre-existing test coverage (no
`candidate.controller.test.ts` / `candidate.service.test.ts` in
`src/__tests__/`) — given the significant amount of genuinely new logic
here (multer wiring, file I/O, ownership checks), live end-to-end testing
(below) stood in for automated coverage; flagged as a real gap in
"Noticed, not done."

## Manual live verification (`npm run dev`, real Mongo/Atlas, Redis falls
back to in-memory)

Two full passes (first pass caught a false-positive on the security
check, corrected by a second, more careful pass — both shown for
honesty, per this hub's "the honest red" value):

```
POST /api/v1/auth/register, GET /api/v1/auth/login → throwaway account, real token

# Invalid file type rejected
POST /api/v1/candidate/upload-cv (cv=test-cv.txt, text/plain)
→ {"success":false,"message":"Chỉ chấp nhận file PDF","errors":null,"data":null}

# Valid PDF accepted (reused a real download-pdf export as the test file)
POST /api/v1/candidate/upload-cv (cv=test-cv.pdf, application/pdf, filename=MyResume.pdf)
→ {"success":true,"message":"Tải CV lên thành công","data":{"originalName":"MyResume.pdf","uploadedAt":1787998147752}}

# Authenticated download works, correct filename in Content-Disposition
GET /api/v1/candidate/cv-file (Bearer token)
→ HTTP 200, Content-Type: application/pdf, Content-Disposition: attachment; filename="MyResume.pdf"
→ `file` confirms: real "PDF document, version 1.4, 1 pages"

# Unauthenticated download correctly rejected
GET /api/v1/candidate/cv-file (no token) → 401 NO_TOKEN (verifyToken middleware)

# cvFile metadata appears in the regular candidate GET response
GET /api/v1/candidate/:email → "cvFile": {"originalName": "MyResume.pdf", "uploadedAt": ...}
```

**Security finding, verified twice to be sure**: the uploaded file IS
reachable unauthenticated via the static path
`GET /uploads/cv/<candidateId>-cv.pdf` (confirmed via `Content-Type:
application/pdf` + `file` command showing a real PDF, not just an HTTP
200 — first pass mistakenly treated a bare 200 status as proof, but this
server returns 200 with a generic HTML fallback page for ANY unmatched
path under `/`, so status code alone is not evidence; corrected by
checking the actual response body/content-type). This is the exact same
trust model the pre-existing PDF-export path already has
(`src/public/pdf/<email>.pdf`) — not a new hole introduced by this task,
but real and worth recording. Added as a new Trap row in
`doctrine/domains/PROJECT.md`.

```
DELETE /api/v1/candidate (self-delete) → {"success":true,"message":"Xoá tài khoản thành công",...}

# Confirmed the on-disk file is genuinely gone after delete (not just the
# Mongo record) — re-checked the static path's actual content, not just
# its status code, to avoid repeating the earlier false-positive:
GET /uploads/cv/<candidateId>-cv.pdf (after delete)
→ Content-Type: text/html (the generic fallback page), NOT application/pdf
→ `file` confirms: "HTML document text", not a PDF
```
Dev server stopped after each check (`pkill -f "ts-node ./src/server.ts"`,
confirmed port 3001 free afterward each time). Both throwaway test
accounts fully cleaned up via self-delete — no leftover Mongo documents
or on-disk files.

## Acceptance
| Criterion | Evidence |
|---|---|
| `POST /api/v1/candidate/upload-cv` accepts a PDF (<=5MB), rejects non-PDF | Live curl above — real 400 on `.txt`, real 200 + persisted metadata on `.pdf` |
| File saved to `src/public/uploads/cv/`, one file per candidate, re-upload overwrites | Deterministic filename `<candidateId>-cv.pdf` in `uploadCV.middleware.ts`'s `filename` callback — no separate old-file tracking/cleanup needed by construction |
| `GET /api/v1/candidate/cv-file` downloads the candidate's own uploaded file, self-only | Live curl above — correct `Content-Disposition`, real PDF bytes (`file` confirmed), 401 when unauthenticated |
| Self-delete also removes the on-disk file (no orphaned personal data) | Live curl above — static path serves real PDF before delete, generic HTML fallback (not the file) after delete |
| `npm test` all pass, `npm run build` clean | Verbatim above |
| No new dependency beyond what's strictly needed | Only `multer` + `@types/multer` added — the standard, minimal Express multipart library |

## Noticed, not done (out of scope)
- No automated test suite added for `candidate.controller.ts`/
  `.service.ts` (zero pre-existing coverage for this file either) —
  live-tested end-to-end instead, see above. Flagging as a real gap this
  time (unlike prior thin-passthrough nodes) because genuinely new logic
  (file I/O, multer wiring) was added — a future node adding Jest
  coverage here (mocking `fs`/multer) would be worth doing.
- The static-file-exposure security finding (uploaded/generated personal
  files reachable unauthenticated via `/uploads/cv/*` and pre-existing
  `/pdf/*`) — recorded as a new Trap in `doctrine/domains/PROJECT.md`,
  not fixed here. Fixing it properly (moving storage outside `public/`,
  or adding an auth check at the static-file layer) would also affect the
  already-shipped PDF export path — bigger, cross-cutting change,
  deserves its own node and its own operator scope decision rather than
  being folded silently into this one.
- Frontend's `handleSelectFile` in `PageHome.vue` still doesn't call this
  new endpoint (was UI-only, per the task's own framing) — wiring the
  actual `fetch`/`axios` call is frontend work, out of scope for this
  backend-only task/hub.

## Seal gate
No outward-facing action yet (no commit/push) — `src/` diff shown above
(9 files modified + 1 new file `src/middlewares/uploadCV.middleware.ts`,
new dependency `multer`) for operator review, per seal gate.

## Status
`sealed_pending_verifier`
