# 2026-08-30 — add-project-cert-award-image-upload (verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `add-project-cert-award-image-upload` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: REOPEN (was PENDING — unchanged)
- Evidence read: `evidence/implementer/2026-08-30/add-project-cert-award-image-upload-diff.md`
  (note only — did not open the `src/` diff directly, per EvidenceOnly)

## Reasoning

1. **Node exists on diagram, not ad-hoc.** Confirmed `add-project-cert-award-image-upload`
   row is present in `haven/diagrams/dev-loop.prime-mermaid.md`, currently PENDING, and
   its description matches the note's summary (multer array upload, IDOR-safe-by-construction
   ownership check, `handlerDelete` cleanup extension). No ADHOC_WORK.

2. **Test command matches doctrine.** `doctrine/MEMORY.md` line 17 pins the test command as
   `npm test` from `/Users/_david/Workspace/Project/ResumeAPI/backend` — exactly what the
   note cites, and the note explicitly says it copied the command verbatim from that file.

3. **Test output not truncated in a disqualifying way.** The note shows "Output (verbatim,
   tail)" — same exact phrasing/convention used in the already-SEALED
   `add-candidate-cv-upload-diff.md` note (10 suites/52 tests then, 10 suites/54 now, delta
   explained). This is established, previously-accepted hub convention (summary tail, not a
   redacted/edited log) — not a truncation red flag by itself.

4. **Ownership/IDOR claim: genuinely demonstrated, not just asserted.** The note's "Manual
   live verification" section shows a real second account (B) issuing
   `POST /api/v1/project/:id/images` against account A's project and getting a real
   `HTTP 403` with the standard "not yours" message — this is a live curl result, not an
   inference from reading code. Criterion satisfied.

5. **Persistence/serving/cleanup criteria: demonstrated.**
   - `images[]` persistence: `GET /project` shown to reflect the same URLs the upload
     response returned.
   - Static serving: real `Content-Type: image/png` + `file` confirming real PNG bytes.
   - Self-delete cleanup: explicit before/after `ls` on a fresh throwaway account (C) —
     files present before delete, confirmed empty after. This is a real before/after
     comparison, not an assertion.
   These three rows in the Acceptance table are fully cited.

6. **Proportion: `handlerDelete` change is in-scope, not scope creep.** It mirrors the same
   cleanup pattern already SEALED for CV files in `add-candidate-cv-upload`
   (orphaned-file prevention on self-delete) applied to the same new file class this task
   introduces. Not an unrelated refactor.

7. **Seal gate respected.** Note's own "Seal gate" section states no commit/push has
   happened yet, diff shown for operator review. No outward-facing action taken without
   approval.

8. **Pre-existing IDOR bug (`baseGetAll`/`baseDelete` trusting `req.body.candidateId`)**
   correctly identified as out of the still-PENDING `fix-idor-broken-access-control`
   node's scope, not silently absorbed or silently ignored — logged under "Noticed, not
   done" and not claimed as fixed here.

## Missing

- **Acceptance row 1's own stated bounds are not evidenced.** The row's criterion text is
  "accepts multiple images (**<=5, <=5MB each**), rejects non-images", but the cited
  evidence ("real 400 on `.txt`, real 200 + persisted `images[]` on 2 real PNGs") only
  proves: (a) a non-image is rejected, and (b) 2 images — well under the 5-file cap —
  succeed. No live request was shown attempting a 6th file or an oversized (>5MB) file, so
  the actual count/size **enforcement** is unproven, only asserted (the note itself frames
  5MB/5-files as "implementation details with a clear precedent," not something it tested).
- **The Diff table's own claim is broader than what was tested.** It states
  "MulterError/invalid-type errors mapped to `formatReturn(400, ...)`" — the note
  demonstrates the invalid-*type* branch (a `fileFilter` rejection) but never exercises a
  genuine `MulterError` (e.g. `LIMIT_FILE_COUNT` / `LIMIT_FILE_SIZE`, thrown by multer's
  `limits` option, a different code path than `fileFilter`). Whether that specific
  error-mapping branch actually returns 400 (vs. falling through to the generic 500
  handler) is untested.
- Per EvidenceOnly, since I did not (per instruction) open `src/middlewares/uploadImages.middleware.ts`
  directly to independently confirm the `limits: {fileSize: 5MB, files: 5}` config, I have
  no way to corroborate this claim by any other means than the untested live path above —
  so it stands as an asserted, not cited, part of an acceptance criterion.

REOPEN is for this one gap. Everything else in the note (ownership/IDOR live test,
persistence, static serving, self-delete cleanup, build/test clean, seal gate) is
adequately evidenced.
