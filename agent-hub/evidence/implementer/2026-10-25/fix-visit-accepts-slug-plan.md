# 2026-10-25 - fix-visit-accepts-slug (plan)

- Worker: implementer · Version: 0.1.0
- Node: `fix-visit-accepts-slug` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #320): "POST /api/me/:value/visit chỉ nhận email, link slug bị 404 — không ghi được lượt xem/nguồn" — đề xuất: `handlerRecordVisit` resolve `:value` giống `handlerGetAboutMe` (slug trước, rồi email), giữ fail-closed `candidateQuerySafe`; kiểm tra GET có tự đếm lượt xem không; đổi param/Swagger `{email}` → `{identifier}`; test slug → 200 + visit, slug không tồn tại → 404.
- Branch: `320-post-api-me` (from freshly pulled `staging` @ cc3717b after #322 merge, linked via `gh issue develop`)

## Hub bytes before: 81396

## Node
No prior node for #320 / slug (grep 0 in active + archive). New row appended, PENDING.

## Findings
- `grep Visit.create src` → only `handlerRecordVisit` → GET never counts; no double count once POST works.
- Existing visit tests mock `Candidate.findOne(...).select().exec()` → keep that call shape.

## Design
- `handlerRecordVisit(identifier, req)`: small local `findBy('slug'|'email')` (safeQuery + key-survived check + `.select('_id')`), `slug ?? email`. Not shared with `handlerGetAboutMe` (different projection, would churn its tests) — SmallestDiff.
- `fnRecordVisit` reads `req.params.identifier`; route `/api/me/:identifier/visit`; Swagger param renamed, 404 text "Unknown identifier".
- `.claude/rules/api.md` row.

## Anchors
`src/candidate_me/index.ts:228-249`, `src/routers/index.ts:123-165`, `src/__tests__/candidate_me/index.test.ts:54-120`, `.claude/rules/api.md` Other table.

## Blockers: none
