# 2026-11-08 - bulk-partial-message (plan)
- Worker: implementer · Version: 0.1.0
- Node: `bulk-partial-message` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#404` grep active + archive: 0 hits
- Task: `/todo #404` — "Bulk create: partial success returns 201 with the message `common.createFailed`"
- Branch: `404-bulk-create-partial` (via `gh issue develop`, from `staging` @ 075c28a)

## Hub bytes before
96370

## Feature doc: `doctrine/features/cv-section-crud.md`
Open question answered by operator 2026-11-07: "Bug: partial-success message — #404". Behavior #8 names no message → doc updated to that answer. Issue text: "A partial-success message (e.g. \"Created X of Y\"), vi + en".

## Acceptance
1. Behavior #8 (updated): partial success → 201 with `common.bulkPartialSuccess` filled with succeeded/total, vi + en; all succeeded → `createSuccess`; all failed → 400 (unchanged).
2. `npx jest src/__tests__/candidate_profile/BaseController.test.ts` passes; en + vi partial assertions fail on the old code.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/candidate_profile/BaseController.ts:300-308` (`fnBulkCreate` 201 branch)
- `src/locales/en.ts:51-56`, `src/locales/vi.ts:51-56` (`common.*`)
- placeholder pattern: `src/middlewares/errors.middleware.ts:17`, `src/utils/helper.ts:53`
