# 2026-10-25 - fix-create-returns-created-doc (plan)

- Worker: implementer · Version: 0.1.0
- Node: `fix-create-returns-created-doc` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #319): "POST /{section}/create trả về toàn bộ danh sách (mảng) thay vì document vừa tạo — regression của #157" — `handlerCreate` truyền `hookAfterSave` chạy `baseFindDocument({ fields: { candidateId }, findOne: false })`; đề xuất: hook trả về chính document vừa tạo (hoặc bỏ hook, dùng kết quả `MODEL.create()`), thêm test response là object có `_id` khớp, spot-check ≥2 section.
- Branch: `319-post-section-create` (from freshly pulled `staging` @ 31733fa, linked via `gh issue develop`)

## Hub bytes before: 81405

## Node
No prior node for #319 / slug in active diagram or archive (grep 0). New row appended (AppendOnly), PENDING.

## Root cause (verified)
- CV-section models declare `_id: ObjectId` (no auto). `baseCreateDocument` calls `MODEL.create({ _id: null, ...document })`.
- `node -e` with real mongoose 8: `new M({_id:null})` → `_id: null` on the doc; the MongoDB driver fills `_id` only on the serialized copy it inserts → returned doc keeps null (#157). #157's fix refetched the whole list in `hookAfterSave` → array regression.

## Design
- `src/services/index.ts`: `MODEL.create({ ...document, _id: new Types.ObjectId() })` — returned doc carries the real id.
- `BaseService.ts` + `generalInformation.service.ts`: drop the list-refetch `hookAfterSave` (and no-op `hookHasErrors` alongside? keep — not in scope). `hookAfterSave` param itself stays in `baseCreateDocument` (has its own tests, no reason to churn).
- Update the #157 tests to the new contract (object, not array) + add a second-create case + generalInformation case + a real-mongoose id check.

## Anchors
`src/services/index.ts:252`, `src/candidate_profile/BaseService.ts:20-40`, `src/candidate_profile/general_information/generalInformation.service.ts:29-46`, tests `src/__tests__/candidate_profile/BaseService.test.ts`, `src/__tests__/services/baseCreateDocument.test.ts`.

## Blockers: none
