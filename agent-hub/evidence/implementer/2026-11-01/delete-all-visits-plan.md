# 2026-11-01 - delete-all-visits (plan)
- Worker: implementer · Version: 0.1.0
- Node: `delete-all-visits` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: "về lượt truy cập, thêm tính năng xóa toàn bộ truy cập, hard-delete" (GitHub #345, branch `345-v-l-t`)

## Hub bytes before: 83519

## Node
New node; slug and #345 absent from active diagram and archive.

## Acceptance
1. `handlerDeleteVisits(candidateId, lang)` in src/candidate/candidate.service.ts → `MODELS.Visit.deleteMany({ candidateId })`; `fnDeleteVisits` in candidate.controller.ts (id from `req.user._id` only); `router.delete('/visits', ...)` + swagger block in src/routers/api/v1/candidate.route.ts.
2. Unit test in src/__tests__/candidate/candidate.service.test.ts.
3. `candidate.deleteVisitsSuccess` in src/locales/vi.ts + en.ts; row in .claude/rules/api.md.
4. npm test / npm run build / npm run lint.

## Code anchors
- src/candidate/candidate.service.ts:118 (handlerGetVisits)
- src/candidate/candidate.controller.ts:175 (fnGetVisits)
- src/routers/api/v1/candidate.route.ts:241
- src/locales/{vi,en}.ts:66
- .claude/rules/api.md:48

## Out of scope
Deleting a single visit; account delete (handlerDelete) not removing Visits.
