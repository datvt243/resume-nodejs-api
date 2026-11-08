# 2026-11-08 - soft-deleted-writes-404 (plan)
- Worker: implementer · Version: 0.1.0
- Node: `soft-deleted-writes-404` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#403` grep active + archive: 0 hits
- Task: `/todo #403` — "Soft-deleted section entries are still treated as existing (delete again, image upload)"
- Branch: `403-soft-deleted-section` (via `gh issue develop`, from `staging` @ 87fa0a4)

## Hub bytes before
96362

## Feature doc: `doctrine/features/cv-section-crud.md`
Open questions answered by operator 2026-11-07: "Bug: 404 — #403" (delete again) and "Bug: 404 — #403" (image upload on a soft-deleted entry). Behavior #5/#9 say only "Unknown id → 404" → doc updated to those answers. Behavior #6 (restore finds deleted entries) must keep working.

## Acceptance
1. Behavior #5: delete of an already soft-deleted id → 404, `deletedAt` untouched. Behavior #9: image upload on a soft-deleted id → 404, no file parsed. Behavior #6 restore unchanged.
2. `npx jest src/__tests__/services/baseSoftDelete.test.ts src/__tests__/candidate_profile/BaseController.test.ts` passes; both new tests fail on the old code.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/services/index.ts:143-160` (`baseDeleteDocument`), `:163-180` (`baseRestoreDocument`, unchanged), `:304-335` (`baseCheckDocumentById` + `excludeDeleted` doc block)
- `src/candidate_profile/BaseController.ts:140-160` (`baseUploadImages`)
- `baseCheckDocumentById` callers: delete, restore, update, patch (update/patch already pass `excludeDeleted`)
