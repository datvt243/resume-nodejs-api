# 2026-08-30 — add-project-cert-award-image-upload (round 2, post-REOPEN)

- Worker: implementer
- Version: 0.1.0
- Node: `add-project-cert-award-image-upload` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "issue #72 image upload" (via `/todo`)
- Prior round: `evidence/implementer/2026-08-30/add-project-cert-award-image-upload-diff.md`
  (status `sealed_pending_verifier`) → verdict:
  `evidence/verifier/2026-08-30/add-project-cert-award-image-upload-reopen.md`

## REOPEN reason (verbatim from independent verifier subagent)
> Acceptance row 1 claims the endpoint enforces "<=5 files, <=5MB each,"
> but the cited live evidence only tests type-rejection (.txt) and a
> normal 2-file success case — no request ever attempted a 6th file or an
> oversized file, so the count/size limit enforcement (and the note's own
> claim that MulterError maps to a 400 response, a separate code path
> from the fileFilter type check that was tested) is asserted, not
> evidenced.

## What the re-test found: a REAL bug, not just a missing-evidence gap
Ran the exact missing live tests the verifier named — a 6-file upload
(count limit = 5) and a >5MB single-file upload — against the round-1
code, unmodified, before touching anything:

- Oversized file (>5MB): correctly caught, `400` +
  `images.fileTooLarge` — matches round-1's claim.
- 6 files (count limit): **NOT** caught by the round-1 catch block, which
  only checked `err.code === 'LIMIT_FILE_SIZE'`. Multer's
  `LIMIT_FILE_COUNT` MulterError fell through to the generic
  `handleError`, returning `500 INTERNAL_SERVER_ERROR` with a raw stack
  trace in the response body — the round-1 note's claim that "MulterError
  errors mapped to `formatReturn(400, ...)`" was true for the size case
  only, false for the count case. This is the real defect the verifier's
  missing-evidence flag surfaced.

## Diff (delta on top of round-1)
| File | Why |
|---|---|
| `src/candidate_profile/BaseController.ts` | `baseUploadImages`'s catch block: added an explicit `err.code === 'LIMIT_FILE_COUNT'` branch alongside the existing `LIMIT_FILE_SIZE` one, returning `400` + `t('images.tooManyFiles', lang)` instead of falling into `handleError`'s generic 500. Two lines. |
| `src/locales/en.ts`, `src/locales/vi.ts` | New `images.tooManyFiles` key, both languages, matching the style of the existing `images.*` keys. |

No other file touched in this round.

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
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        5.017 s, estimated 7 s
Ran all test suites.
```
Same 10 suites / 54 tests as the round-1 baseline — zero regressions.

## Manual live re-verification (`npm run dev`, real Mongo/Atlas, Redis
falls back to in-memory), addressing the REOPEN reason directly

```
POST /api/v1/auth/register + login → fresh throwaway account, real token
POST /api/v1/project/create → real project, _id captured

# Before the fix (round-1 code, unmodified) — 6 files, count limit = 5
POST /api/v1/project/:id/images (6 real PNGs)
→ HTTP 500 {"success":false,"errorCode":"INTERNAL_SERVER_ERROR",
   "message":"Too many files","stack":"Error: Too many files\n    at
   handleError (.../utils/helper.ts:136:5)\n    at baseUploadImages
   (.../BaseController.ts:115:16)..."}
   ← confirms the verifier's flagged gap was hiding a real bug, not just
     missing evidence.

# Before the fix — oversized file (>5MB), sanity check (this one DID work)
POST /api/v1/project/:id/images (1 file, 6MB)
→ HTTP 400 {"success":false,"message":"File vượt quá dung lượng cho phép
   (5 MB mỗi ảnh)","errors":null,"data":null}

# After the fix — 6 files, count limit = 5
POST /api/v1/project/:id/images (6 real PNGs)
→ HTTP 400 {"success":false,"message":"Quá số lượng file cho phép (tối đa
   5 ảnh mỗi lần)","errors":null,"data":null}

# After the fix — oversized file (>5MB), re-confirmed unchanged
POST /api/v1/project/:id/images (1 file, 6MB)
→ HTTP 400 {"success":false,"message":"File vượt quá dung lượng cho phép
   (5 MB mỗi ảnh)","errors":null,"data":null}

# After the fix — exactly 5 valid files (boundary, should still succeed)
POST /api/v1/project/:id/images (5 real PNGs)
→ HTTP 200 {"success":true,"message":"Tải ảnh lên thành công",
   "data":{"images":[...5 URLs...]}}

DELETE /api/v1/candidate (self-delete) → success:true
```

**Cleanup verified**: `ls src/public/uploads/images/ | grep <projectId>`
showed 5 files present before delete, empty (no match) after — no
orphaned files left by any of the throwaway test runs in this round. Dev
server stopped after checks (`pkill -f "ts-node ./src/server.ts"`,
port 3001 confirmed free). Scratch test image files
(`/tmp/rpi-images/`, context file `/tmp/rpi-reopen-ctx.txt`) removed
after use — not committed anywhere.

## Acceptance (delta — re-confirms row 1 from round-1's table with real evidence this time)
| Criterion | Evidence |
|---|---|
| Endpoint enforces <=5 files per request, rejects the 6th with a clean 4xx (not a 500/stack leak) | Live curl above — before: real `500` + stack trace; after: real `400` + friendly message |
| Endpoint enforces <=5MB per file, rejects oversized files with a clean 4xx | Live curl above — real `400` both before and after (this path was already correct) |
| Fix does not regress the success path at the exact boundary (5 files, all valid) | Live curl above — real `200` + persisted `images[]` for exactly 5 files |
| `npm test` all pass, `npm run build` clean | Verbatim above |

## Noticed, not done (out of scope)
- Same out-of-scope items as round-1's note (the still-PENDING
  `fix-idor-broken-access-control` node; no automated test suite for
  `BaseController.ts`; no image resizing/compression) — unchanged by this
  round's fix.

## Seal gate
No outward-facing action yet (no commit/push) — `src/` diff (the 2-line
`BaseController.ts` catch branch + 2 locale-key additions on top of
round-1's diff) shown to operator for review, per seal gate.

## Status
`sealed_pending_verifier`
