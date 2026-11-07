# 2026-11-07 - fix-section-id-empty-query (plan)
- Worker: implementer · Version: 0.1.0
- Node: `fix-section-id-empty-query` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug grep in `dev-loop-archive.md`: 0 hits; no prior active row for #381
- Task: `/todo #381` — "Section delete/restore acts on the collection's first document when `:id` contains `$`"
- Branch: `381-section-delete-restore-acts` (off `staging` @ 0141d71, via `gh issue develop`)

## Hub bytes before
93030

## Feature doc: `doctrine/features/cv-section-crud.md`
Behavior #5 (delete: unknown id → 404) and #6 (restore: unknown id → 404) are the spec. Open question for #381 answered by operator 2026-11-07: "Bug — #381". No contradiction, doc unchanged.

## Acceptance
1. Dropped `_id` → `baseCheckDocumentById` returns `isExist:false` without querying → delete/restore 404, `updateOne` never called.
2. Regression tests in `src/__tests__/services/baseSoftDelete.test.ts`.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.
4. Comments per code-comments.md.

## Anchors
- `src/services/index.ts:304-345` `_baseHelper().baseCheckDocumentById` (fix — root cause, shared)
- callers: `baseDeleteDocument` :146, `baseRestoreDocument` :169, `baseUpdateDocument` :202, `basePatchDocument` :280 (all `if (!isExist) throw new NotFoundError`)
- idiom: `'email' in safeEmailQuery` guard, `src/candidate_me/index.ts:104` (and #380's fix)
