# 2026-09-12 — add-soft-delete-restore-cv-sections (SEAL)

- Worker: verifier (subagent, dispatched via Agent tool)
- Version: 0.1.0
- Node: `add-soft-delete-restore-cv-sections`
- New PM status: SEALED

## Isolation proof
Spawned as a genuinely separate Agent-tool subagent task (description:
"Verify soft-delete node independently"), with no memory of writing the
diff under review — the implementer's evidence note is the only artifact
carrying claims into this session; every citation below was re-derived by
reading the real current source files and re-running the real test/build
commands myself, not inferred from the note's prose.

## Reasoning
- Read the implementer note in full
  (`evidence/implementer/2026-09-12/add-soft-delete-restore-cv-sections-plan.md`),
  the node's row on `haven/diagrams/dev-loop.prime-mermaid.md`, `CLAUDE.md`'s
  forbidden-states table, and fetched `gh issue view 121` — the note's
  verbatim quote of the issue matches the real issue body, including the
  proposal's 4 bullets and the "should land after fix-idor" note (that
  precondition trap is already SEALED, 2026-09-08).
- `deletedAt` field: confirmed directly with
  `grep -n "deletedAt" src/models/{award,candidate,certificate,education,experience,generalInformation,project}.model.ts src/models/reference.modal.ts`
  — all 8 files have `deletedAt: { type: Number, default: null }`.
- `baseDeleteDocument`/`baseRestoreDocument` (`src/services/index.ts`): read
  the file directly. `baseDeleteDocument` does
  `MODEL.updateOne({ _id }, { deletedAt: Date.now() })`, ownership check
  (`candidateId.toString() !== userID`) unchanged, same
  `formatReturn`/`formatReturnFailed` shape. New `baseRestoreDocument`
  mirrors it, sets `deletedAt: null`, same ownership check pattern.
- `baseFindDocument` excludes soft-deleted docs by default: confirmed
  `idQuerySafe.safeQuery({ deletedAt: null }, fields)` at line 57 — since
  `safeQuery`'s allow-list merge means callers can't override this key,
  `baseGetAll` inherits it with zero caller changes, matching the note's
  claim.
- Critical check — `baseCheckDocumentById` (used by
  update/delete/restore/patch) does NOT route through `baseFindDocument`
  and does NOT filter on `deletedAt`: confirmed directly in
  `services/index.ts`'s `_baseHelper()` —
  `MODEL.findOne(idQuerySafe.safeQuery({}, { _id })).exec()`, no
  `deletedAt` key. This means restore/update/delete on an already
  soft-deleted document still finds it — verified this is exactly what
  the new `baseSoftDelete.test.ts` "even for an already soft-deleted
  document" restore test exercises.
- Restore routes: read the full content of all 6 router files
  (`education`, `experience`, `award`, `certificate`, `project`,
  `reference` — `src/routers/api/v1/*.route.ts`). Every one imports
  `baseRestore` from `BaseController.ts` and registers
  `router.post('/restore/:id', (req,res,next)=>{ req.params.collection =
  Collections.<X>; next(); }, baseRestore)`, identical pattern to the
  existing `DELETE /delete/:id` registration, correct `Collections`
  constant per file.
- `generalInformation.route.ts`: read in full — confirmed it has no
  `delete` route today (only `GET /`, `POST /create`, `PUT /update`,
  `PATCH /update`), so skipping its restore route is consistent, not a
  gap, exactly as the note claims.
- Ownership chain / IDOR-safety of the new restore path: read
  `src/middlewares/verifyToken.middleware.ts` directly — it unconditionally
  does `req.body.candidateId = _id` (the authenticated user's own id) on
  every successful verify, overwriting whatever the client sent, for every
  authenticated request. `baseDelete`/`baseRestore` in `BaseController.ts`
  both source `userID: req.body.candidateId || ''` — so the "same
  ownership check as delete" claim is real and not a client-trust
  regression.
- Locales: `grep -n "restore" src/locales/en.ts src/locales/vi.ts` —
  confirmed all 4 keys (`cannotRestore`, `restoreSuccess`, `restoreFailed`,
  `restoreNotYours`) exist in both files with sensible copy.
- New test file `src/__tests__/services/baseSoftDelete.test.ts`: read in
  full — 6 tests, fake-Mongoose-shaped model, exercises exactly what the
  note claims (owner-match sets/clears `deletedAt`, non-owner refused
  without calling `updateOne`, not-found fails without calling
  `updateOne`, restore works even when already soft-deleted). Legitimate
  direct unit coverage for new code paths created in this same diff — not
  scope creep.
- Ran the exact test command from `doctrine/MEMORY.md` myself:
  `cd /Users/_david/Workspace/Project/resume/resume-nodejs-api && npm test`
  → real output: `Test Suites: 14 passed, 14 total` / `Tests: 83 passed,
  83 total` — matches the note's claimed `83 passed, 83 total` exactly,
  independently reproduced, not just re-read from the note.
- Ran `npm run build` myself → `tsc && npm run copy` exited clean, no
  compiler errors, matching the note's claim.
- Seal gate: confirmed `git status` shows all 19 modified files +
  untracked `baseSoftDelete.test.ts` + the evidence dir as uncommitted
  working-tree changes; `git log --oneline -5` shows no new commit beyond
  the pre-existing history (`111be18` still HEAD's ancestor). The note's
  "Seal gate: none — no commit/push happened" is accurate.
- Proportion (SmallestDiff): diff matches issue #121's 4 proposal bullets
  exactly (deletedAt field, soft-delete instead of deleteOne, exclude-by-
  default find, restore endpoint). The account-level delete
  (`candidate.service.ts::handlerDelete`, confirmed by direct read: still
  does `CV_SECTION_MODELS.deleteMany` + on-disk file unlink, no
  `deletedAt` involved) was correctly left alone — issue #121's proposal
  bullets specify `deletedAt` on `Candidate` (done) and the
  find/delete/restore behavior for CV-section base ops only; they do not
  ask for an account-delete cascade behavior change, and converting that
  path would need a separate decision about the file-cleanup semantics
  that the note correctly declines to invent unprompted. This is a
  legitimate scoping call, not a silently dropped bullet — REOPEN not
  warranted on this basis.

## Re-run
`partial` — ran `npm test` and `npm run build` myself from the repo root
(not just re-read the note's pasted output) to independently confirm the
claimed 83/83 pass count and clean build, given this is a real,
non-trivial change spanning 8 models, `services/index.ts`,
`BaseController.ts`, 6 routers, and 2 locale files.
