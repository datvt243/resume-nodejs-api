# 2026-11-08 - cv-upload-temp-rename (plan)
- Worker: implementer · Version: 0.1.0
- Node: `cv-upload-temp-rename` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#384` grep active + archive: 0 hits
- Task: `/todo #384` — "A failed (oversized) CV re-upload deletes the previously stored CV" (+ issue comment: `cvFile` record with missing file → 404)
- Branch: `384-a-failed-oversized` (via `gh issue develop`, from `staging` @ e67ede7)

## Hub bytes before
96395

## Feature doc: `doctrine/features/cv-file-upload-import.md`
Open questions answered by operator 2026-11-07: "Bug — #384" (temp name + rename) and "Bug: return 404 — tracked in #384 (comment)". Behavior #2/#3 don't state either → doc updated to those answers (+ stale `public/uploads/cv` path from before #383 corrected).

## Acceptance
1. Matches Behavior #2 (rejected re-upload keeps the stored CV) and #3 (missing file → 404).
2. `npx jest src/__tests__/middlewares/uploadCV.middleware.test.ts src/__tests__/candidate/candidate.controller.test.ts` passes; the oversized re-upload test fails on the old middleware.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/middlewares/uploadCV.middleware.ts:54-62` (diskStorage filename), `:87-121` (multer callback)
- `src/candidate/candidate.controller.ts:87-110` (`fnDownloadCV`)
- callers of `CV_UPLOAD_DIR`/`-cv.pdf`: `candidate.controller.ts`, `candidate.service.ts:157` (account delete — unchanged, final name unchanged)
