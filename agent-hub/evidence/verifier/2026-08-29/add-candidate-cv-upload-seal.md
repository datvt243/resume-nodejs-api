# 2026-08-29 — add-candidate-cv-upload — SEAL

- Worker: verifier (independent fresh subagent, Agent tool)
- Node: `add-candidate-cv-upload` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Implementer note reviewed: `evidence/implementer/2026-08-29/add-candidate-cv-upload-diff.md`
- Verdict: **SEAL**

## Method
Did not trust the note's prose. Ran `git status --short`, read the real
`git diff -- src/ package.json .gitignore` myself, read the new untracked
file `src/middlewares/uploadCV.middleware.ts` in full, read the full
`src/routers/api/v1/candidate.route.ts` and `src/routers/api/v1/index.ts`,
read `src/models/candidate.model.ts` and `src/utils/i18n.ts`, ran
`npm run build` and `npm test` myself, and checked `node_modules`/
`package-lock.json` directly for the new dependency. This is a larger diff
than recent nodes (new dep, new file, several touched files) so extra
scrutiny was applied per dispatch instructions.

## Acceptance criteria — walked one at a time

1. **Route registration order — `/upload-cv` and `/cv-file` before `/:email`.**
   Read `src/routers/api/v1/candidate.route.ts` directly, line by line:
   `router.post('/upload-cv', ...)` at line 41, `router.get('/cv-file', ...)`
   at line 62, `router.get('/:email', ...)` at line 92. Confirmed both new
   routes are registered strictly before the wildcard param route.
   Additionally confirmed this order is not even load-bearing for auth —
   `src/routers/api/v1/index.ts:25` mounts
   `router.use('/candidate', verifyToken, routeCandidate)`, so `verifyToken`
   runs before any route inside `candidate.route.ts` regardless of
   in-file order. Confirmed.

2. **`fileFilter` checks both mimetype AND extension.** Read
   `uploadCV.middleware.ts` lines 43–48 directly:
   ```
   const isPdfMime = file.mimetype === 'application/pdf';
   const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
   if (isPdfMime && isPdfExt) return cb(null, true);
   cb(new Error('INVALID_FILE_TYPE'));
   ```
   Both checks are combined with `&&` — a `.txt` file relabeled with a
   spoofed `Content-Type: application/pdf` header would still fail the
   extension check, and vice versa. Confirmed real double-check, not
   trusting the client's `Content-Type` alone.

3. **Deterministic filename, not client-supplied.** Read the `filename`
   callback (lines 30–37): `cb(null, \`${candidateId}-cv.pdf\`)` where
   `candidateId = (req as any).user?._id` — the authenticated user's id
   from the verified JWT (set by `verifyToken` upstream), never
   `file.originalname` or anything else client-controlled. No path
   traversal surface — the client-supplied `originalname` is only ever
   stored as metadata (`cvFile.originalName` in Mongo) and later passed as
   the second argument to `res.download(filePath, name)`, which controls
   only the `Content-Disposition` header, not the filesystem path used to
   read the file. Confirmed.

4. **`fnUploadCV`/`fnDownloadCV` use `req.user._id` only.** Read
   `candidate.controller.ts` directly:
   - `fnUploadCV`: `handlerUploadCV((req as any).user?._id, file.originalname, ...)`
   - `fnDownloadCV`: `const candidateId = (req as any).user?._id;`
   Both match the exact same pattern already used by `fnUpdate`
   (`{ ...value, _id: (req as any).user?._id }`) and `fnDelete`
   (`handlerDelete((req as any).user?._id, ...)`) in the same file — grep
   confirmed all four call sites use `(req as any).user?._id`, none use a
   client-supplied id/body field. Confirmed IDOR-safe.

5. **`handlerDelete` now removes the on-disk CV file too.** Read
   `candidate.service.ts` diff directly:
   ```
   const cvFilePath = path.join(CV_UPLOAD_DIR, `${_id}-cv.pdf`);
   if (fs.existsSync(cvFilePath)) fs.unlinkSync(cvFilePath);
   ```
   placed after the pre-existing Mongo cleanup (`CV_SECTION_MODELS`
   deletion + `MODEL.deleteOne`), before the final success return.
   Confirmed. Also confirmed live: `src/public/uploads/cv/` on disk
   currently contains only `.gitkeep` — no leftover uploaded file from the
   implementer's live test run, consistent with the delete claim.

6. **`multer`/`@types/multer` really `npm install`ed, not hand-edited.**
   `node_modules/multer/package.json` → `"version": "2.3.0"`,
   `node_modules/@types/multer/package.json` → `"version": "2.2.0"` — both
   match `package.json`'s declared `^2.3.0`/`^2.2.0`. `package-lock.json`
   has real registry entries with `resolved` URLs and `integrity` hashes
   for both (`node_modules/multer` at line 9092, `node_modules/@types/multer`
   at line 3357) — this is what a real `npm install` produces, not a
   hand-typed line. Confirmed.

7. **Build.** Ran `npm run build` myself from
   `/Users/_david/Workspace/Project/ResumeAPI/backend`. Output:
   ```
   > nodejs-resume-api@1.1.0 build
   > tsc && npm run copy

   > nodejs-resume-api@1.1.0 copy
   > cp -R ./src/views ./src/public ./dist/
   ```
   Clean, no `tsc` errors — the new multer types/imports (including
   `Express.Multer.File`) are wired correctly. Confirmed.

8. **Tests.** Ran `npm test` myself (exact command from
   `doctrine/MEMORY.md`, from repo root). Verbatim tail of my own run:
   ```
   Test Suites: 10 passed, 10 total
   Tests:       52 passed, 52 total
   Snapshots:   0 total
   Time:        4.383 s, estimated 5 s
   Ran all test suites.
   ```
   Matches the prior sealed baseline (10 suites / 52 tests) — zero
   regressions, zero new tests (consistent with the note's own flagged gap:
   `candidate.controller.ts`/`.service.ts` have no pre-existing coverage).
   Not truncated, not redacted.

9. **Live end-to-end claim — sanity-checked via code reading, not
   re-run.** Did not repeat the full HTTP cycle (avoiding a third
   throwaway Atlas account). Instead read `fnDownloadCV`,
   `handlerGetCVFile`, and `handlerDelete` directly:
   - `handlerGetCVFile` (`candidate.service.ts`): `MODEL.findById(candidateId).select('cvFile')`,
     returns `null` unless `cvFile.originalName` is set — genuinely
     distinguishes "never uploaded" from an empty subdoc, matches the
     404 claim.
   - `fnDownloadCV`: 404s via `t('candidate.cvFileNotFound', ...)` when
     `handlerGetCVFile` returns null, else `res.download(filePath, ...)`
     — a real file-serving call through the authenticated route, not a
     redirect to the static path. `verifyToken` on the parent router
     guarantees the 401-when-unauthenticated claim structurally (request
     never reaches this handler without a valid token).
   These read as genuine, not stubbed — the note's live-test transcript is
   structurally consistent with the real code paths. Confirmed.

## Trap-row accuracy check (security claim)
Read `src/server.ts` directly: line 105,
`app.use(express.static(path.join(__dirname, 'public')));` — mounts static
serving over the entire `public/` directory with no auth middleware in
front of it, and this line sits before the API router in the middleware
stack. `src/public/uploads/cv/<candidateId>-cv.pdf` (new) and
`src/public/pdf/<email>.pdf` (pre-existing PDF export) both live under this
tree and are therefore reachable unauthenticated by anyone who knows/
guesses the filename. The new Trap row added to
`doctrine/domains/PROJECT.md` describing this is factually accurate.
Confirmed by reading `server.ts` myself, not taken on the note's word.

## SmallestDiff proportion check
`git diff --stat -- src/ package.json .gitignore` plus the one new
untracked file. Every changed/added file maps directly onto "upload +
download + cleanup a CV file":
- `package.json`/`package-lock.json` — the one new dependency needed.
- `src/middlewares/uploadCV.middleware.ts` (new) — the multer config
  itself.
- `src/models/candidate.model.ts` — the one new field to store upload
  metadata.
- `src/candidate/candidate.service.ts` — upload/get/delete-cleanup logic.
- `src/candidate/candidate.controller.ts` — the two new handlers.
- `src/routers/api/v1/candidate.route.ts` — the two new routes + Swagger
  docs for them.
- `src/config/swagger.config.ts` — doc-only addition matching the new
  model field, same pattern as every prior sealed node.
- `src/locales/{vi,en}.ts` — 5 new message keys, all actually referenced
  by the new code (`t('candidate.cvUploadSuccess', ...)` etc. — confirmed
  by grep, no unused keys).
- `.gitignore` — one new rule to keep uploaded user files out of git.
No unrelated refactor found. No touch to `createPDF.ts`, no touch to any
other CV-section controller/service, no touch to auth. Proportionate to
the node despite being a larger diff than recent nodes — the size is
explained by genuinely new surface (new dependency + new middleware file),
not scope creep.

## Forbidden states — checked all 5
| State | Verdict |
|---|---|
| `ADHOC_WORK` | Not hit — node exists on `dev-loop.prime-mermaid.md` (was PENDING going in), diff traces to it. |
| `NO_EVIDENCE` | Not hit — implementer note exists; this verifier note now exists too. |
| `EDIT_UNVERIFIED` | Not hit — build and tests re-run by me, verbatim output above, not inferred from the note. |
| `CODE_IN_HAVEN` | Not hit — no `.ts`/`.js`/runnable code touched under `haven/`; only this evidence note and the diagram PM-status row (prose) were written. |
| `DIAGRAM_DRIFT` | Resolved by this SEAL — PM status updated below to match shipped code. |

## Minor observations (non-blocking)
- Two leftover untracked files from the implementer's live test session
  remain in `src/public/pdf/`
  (`cvupload-check+1787998138@example.com.pdf`,
  `cvupload-verify+1787998213@example.com.pdf`, generated because the
  test reused the download-pdf export as its test-file source). Not
  committed, not gitignored (pre-existing gap in that directory's
  `.gitignore` coverage, already noted by the implementer as out of scope
  for this task), does not affect the reviewed `src/` logic or build/test
  results. Flagging for hygiene only.
- `(req as any).file` / `(req as any).user` casts throughout the new
  controller code avoid extending the real `Express.Request` type
  properly (a `types/express.d.ts` augmentation already exists for
  `user`, but isn't used here, and no augmentation exists for multer's
  `file`). Not a correctness bug — `tsc` compiles clean and the runtime
  behavior is correct — just a style gap consistent with the rest of this
  controller file already using the same `as any` pattern for `req.user`.

## Seal gate
No outward-facing action (commit/push) has happened yet — working-tree
diff only. Nothing for this verifier pass to gate; commit/push, if and
when it happens, is a separate future seal-gate checkpoint.

## Result
All 9 numbered acceptance criteria plus the security Trap-row claim have
independently-gathered, cited evidence. Diff is proportionate despite its
larger size. No forbidden state hit. **SEAL.**
