# 2026-08-30 — add-project-cert-award-image-upload (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-project-cert-award-image-upload` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "#72" (GitHub issue #72 — Image upload endpoint for
  project / certificate / award)

## Investigation (before touching code)

1. Confirmed `Project`/`Certificate`/`Award` models all have `images: {
   type: Array, of: String }` with no way to populate it except pasting
   pre-hosted URLs (matches the issue exactly).
2. Read `BaseController.ts`/`BaseService.ts`/`services/index.ts` end to
   end to understand the existing ownership-check story, since the issue
   explicitly says "same pattern as the rest of `candidate_profile/*`,
   see the IDOR fix from 2026-08-21." **Found live**: that "IDOR fix" is
   NOT actually landed — `fix-idor-broken-access-control` is still
   PENDING on this diagram. Specifically:
   - `baseDeleteDocument`/`baseUpdateDocument` (`services/index.ts`) DO
     internally implement a correct ownership check
     (`candidateId.toString() !== userID`).
   - But `BaseController.ts`'s `baseDelete` passes `userID: req.body.candidateId
     || ''` — the CLIENT-SUPPLIED value, not `req.user._id` — completely
     defeating the check. `baseGetAll` similarly trusts `req.body.candidateId`
     with no auth cross-check at all.
   - `createCrudController`'s `fnUpdate` DOES correctly pass `req.user._id`,
     so `PUT /update` is not vulnerable — only list (`GET /`) and delete
     (`DELETE /delete/:id`) are.
   This means the issue's own assumption (that the pattern to copy is
   already safe) doesn't hold. **Built the new endpoint's ownership check
   from scratch, correctly, rather than copying `baseDelete`'s vulnerable
   pattern** — it uses `req.user._id` directly, matching the *intent* of
   the issue's ask, not its (mistaken) premise about existing code.

## Scope resolved (operator, via `AskUserQuestion`)
1. **Multiple files per request**: yes — `multer.array('images', 5)`, not
   one-at-a-time.
2. **images[] update**: server appends directly to the target record's
   `images[]` and persists in the same request — not a separate
   return-URL-then-client-PUTs flow.

Size limit (5MB/file) and allowed types (jpg/png/webp/gif, checked via
both mimetype and extension) were not asked about — implementation
details with a clear precedent already set by the CV upload node (5MB),
adapted for images (multiple common web image formats vs. PDF-only).

## Diff
| File | Why |
|---|---|
| `src/middlewares/uploadImages.middleware.ts` (new) | `multer.diskStorage` to `src/public/uploads/images/` (created on first write). Filename `<recordId>-<timestamp>-<random>.<ext>` — unique per file (unlike the CV upload's deterministic overwrite-in-place name, these are additive), never derived from the client's original filename. `fileFilter` checks both `mimetype.startsWith('image/')` and file extension. `limits: {fileSize: 5MB, files: 5}`. |
| `src/candidate_profile/BaseController.ts` | New `baseUploadImages` — reads `:id`/`:collection` (collection set by each route's inline middleware, matching `baseDelete`'s existing wiring), looks up the document via the existing `modelObject` map, checks `document.candidateId.toString() === req.user._id` **before** running multer (so an unauthorized request never gets its file parsed/written to disk), then runs `uploadImagesMiddleware` manually (`await new Promise(...)` wrapping its callback), appends the resulting URLs to `images[]`, persists, returns the updated array. MulterError/invalid-type errors mapped to `formatReturn(400, ...)` instead of falling into the generic 500 handler — same discipline as `uploadCVMiddleware`. |
| `src/routers/api/v1/{project,award,certificate}.route.ts` | Added `POST /:id/images` to each, same `req.params.collection = Collections.X` inline-middleware wiring `baseDelete` already uses, + Swagger docs. |
| `src/candidate/candidate.service.ts` | `handlerDelete` — now also collects every `images[]` entry across `Project`/`Certificate`/`Award` for the candidate **before** those documents are deleted, then unlinks each corresponding file from `IMAGE_UPLOAD_DIR` after the Mongo deletes. Extends the existing CV-file cleanup (added in the `add-candidate-cv-upload` node) to this new file class — same reasoning: self-delete previously only cleaned up Mongo documents, leaving any uploaded files as orphaned real personal data on disk. |
| `src/locales/{vi,en}.ts` | New `images.*` keys: `noFilesUploaded`, `uploadSuccess`, `fileTooLarge`, `invalidFileType`, `uploadFailed` — both languages. |
| `.gitignore` | `src/public/uploads/images/*` (keep `.gitkeep`) — same rule already added for `uploads/cv/`. |
| `src/public/uploads/images/.gitkeep` (new, untracked pending commit) | Makes the directory exist in a fresh clone / `dist/` build, same convention as `uploads/cv/`. |

No change needed to `src/config/swagger.config.ts` — the `Project`/
`Certificate`/`Award` schema definitions already had `images: {type:
'array', items: {type: 'string'}}` from before this task.

## Design note: intentionally NOT the same Trap as CV upload
The recorded Trap for `add-candidate-cv-upload` was about a *private*
file (CV) being reachable unauthenticated via `express.static` on
`public/`. These images are different: they belong to a candidate's
*public* portfolio (rendered on `GET /api/me/:email`, no auth) — serving
them via a plain static URL is the correct, intentional design here, not
a repeat of that gap. No new Trap added for this reason.

## Command
```
npm run build
```
Output: clean, `tsc && npm run copy` completed with no errors (confirmed
via `npx tsc --noEmit` directly too, zero type errors).

```
npm test
```
(run from `/Users/_david/Workspace/Project/ResumeAPI/backend`, copied
verbatim from `doctrine/MEMORY.md`)

### Output (verbatim, tail)
```
Test Suites: 10 passed, 10 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        6.53 s, estimated 284 s
Ran all test suites.
```
Same 10 suites / 54 tests as the prior sealed baseline
(`add-email-verification-seal.md`) — zero regressions, zero new
automated tests. `BaseController.ts`/`candidate_profile/*` have zero
pre-existing test coverage (no test file references them), matching the
same gap already flagged for the CV upload node; live-tested end-to-end
instead (below).

**Aside, for the honest record**: an earlier run of this same `npm test`
command (before this final clean run) took 307s and printed jest's
"worker process has failed to exit gracefully... Active timers can also
cause this" warning, alongside an `npm run build` that also ran far
slower than usual. Investigated before treating it as a real regression:
`ps aux` showed 3 separate unrelated projects' `tsserver`/`vite`/mason
LSP processes consuming very heavy concurrent CPU/memory on this
machine at the time (multiple gigabytes, multiple minutes of CPU each).
Both the slow test run and the slow build run still exited with code 0
and the exact same pass counts as the later clean run — re-ran `npm
test` once system load had settled and got the normal ~6.5s result with
no warning, confirming this was environmental contention, not a leak
introduced by this task's code (which adds no timers/intervals at all —
unlike `passwordReset.ts`/`tokenBlacklist.ts`/`emailVerification.ts`,
`uploadImages.middleware.ts` has no `setInterval`).

## Manual live verification (`npm run dev`, real Mongo/Atlas, Redis falls
back to in-memory)

```
POST /api/v1/auth/register + login → account A, real token
POST /api/v1/project/create → real project, _id captured

# Invalid file type rejected
POST /api/v1/project/:id/images (images=test.txt, text/plain)
→ {"success":false,"message":"Chỉ chấp nhận file ảnh (jpg, png, webp, gif)",...}

# Valid: 2 real PNGs uploaded in one request
POST /api/v1/project/:id/images (images=[img1.png, img2.png])
→ {"success":true,"message":"Tải ảnh lên thành công",
   "data":{"images":["/uploads/images/<id>-...-....png","/uploads/images/<id>-...-....png"]}}

# Static URL actually serves the real image
GET /uploads/images/<filename> → HTTP 200, Content-Type: image/png
→ `file` confirms: real "PNG image data"

# GET /project shows the persisted images[] update
GET /api/v1/project (Bearer A) → images[] matches exactly what was returned above

# IDOR check: account B cannot upload into account A's project
POST /api/v1/project/:id/images (Bearer B) → HTTP 403,
  "message":"Không thể cập nhật thông tin không phải của bạn"

# Nonexistent project id
POST /api/v1/project/000000000000000000000099/images (Bearer A) → HTTP 404,
  "message":"Xảy ra lỗi! Không tìm thấy ID"

DELETE /api/v1/candidate (account A, self-delete) → success:true
```

**Cleanup-on-delete, verified as a genuine before/after comparison** (this
is what led to writing the `handlerDelete` fix above — first pass
without it left orphaned files, confirmed by `ls`, then fixed and
re-verified clean):
```
# Fresh account C: create project → upload 2 images → confirm files exist on disk
ls src/public/uploads/images/ → both files present

DELETE /api/v1/candidate (account C) → success:true

# After the fix: files actually gone, not just the Mongo documents
ls src/public/uploads/images/ → (empty, confirmed clean)
```

All 3 throwaway test accounts (A, B, C) fully cleaned up via self-delete.
Dev server stopped after each check (`pkill -f "ts-node ./src/server.ts"`,
confirmed port 3001 free afterward). `git status --short src/public/`
clean before finishing — no leftover generated PDFs or orphaned images.

## Acceptance
| Criterion | Evidence |
|---|---|
| `POST /api/v1/{project\|certificate\|award}/:id/images` accepts multiple images (<=5, <=5MB each), rejects non-images | Live curl above — real 400 on `.txt`, real 200 + persisted `images[]` on 2 real PNGs |
| Ownership enforced via `req.user._id`, not client-supplied data | Live curl above — real 403 when account B targets account A's project; code reads `document.candidateId.toString() === candidateId` from `req.user._id`, never `req.body` |
| Images appended directly to the record's `images[]`, persisted | Live curl above — `GET /project` reflects the exact same array the upload response returned |
| Uploaded files served correctly (public, matching the issue's own suggested static pattern) | Live curl above — real `Content-Type: image/png`, real PNG bytes via `file` |
| Self-delete also removes on-disk image files (no orphaned personal data) | Live curl above — files present before delete, confirmed gone after, for a genuinely fresh account |
| `npm test` all pass, `npm run build` clean | Verbatim above |

## Noticed, not done (out of scope)
- The actual `fix-idor-broken-access-control` bug in `baseGetAll`/
  `baseDelete` (trusting `req.body.candidateId`) — found again while
  investigating this task, NOT fixed here (that's the existing PENDING
  node's scope; fixing it would touch every CV section's list/delete
  routes, well beyond "add an image upload endpoint"). This task's own
  new endpoint is unaffected/safe by construction.
- No dedicated automated test suite added for `BaseController.ts` (zero
  pre-existing coverage for this file) — live-tested end-to-end instead,
  same gap class as the CV upload node.
- No image resizing/thumbnailing/compression — issue didn't ask for it,
  out of scope.

## Seal gate
No outward-facing action yet (no commit/push) — `src/` diff shown above
(7 modified files + 1 new file `src/middlewares/uploadImages.middleware.ts`)
for operator review, per seal gate.

## Status
`sealed_pending_verifier`
