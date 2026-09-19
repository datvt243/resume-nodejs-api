# 2026-09-19 — fix-soft-delete-bypass-on-update-patch (plan)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-soft-delete-bypass-on-update-patch` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: baseCheckDocumentById in src/services/index.ts (shared by
  baseUpdateDocument and basePatchDocument) does a plain findOne({_id})
  with no deletedAt filter, so soft-deleted CV-section entries can still
  be edited. Candidate soft-deletes an Award via DELETE
  /award/delete/:id (deletedAt set, correctly hidden from GET /award),
  then calls PUT /award/update on the same _id — the update succeeds and
  silently mutates a record that is supposed to be gone, unlike the
  pre-soft-delete hard-delete behavior where this would 404. Fix:
  baseCheckDocumentById's ownership/existence lookup should exclude
  deletedAt-set documents, consistent with how baseFindDocument already
  excludes them by default. Found by /code-review on 2026-09-19 (finding
  2 of 10). GitHub issue #136.

## Hub bytes before: 64581

## Root cause
`add-soft-delete-restore-cv-sections` (issue #121) made `baseFindDocument`
exclude `deletedAt`-set documents by default, but never touched the
separate `baseCheckDocumentById` helper — used only by
`baseUpdateDocument`/`basePatchDocument` (existence + ownership check) and
`baseDeleteDocument`/`baseRestoreDocument` (existence + ownership check).
Result: `GET`/list correctly hides a soft-deleted document, but
`PUT`/`PATCH .../update` on its `_id` still finds and mutates it.

## Anchors
- `src/services/index.ts:404` — `baseCheckDocumentById` (root cause)
- `src/services/index.ts:204` — `baseUpdateDocument`'s call site
- `src/services/index.ts:330` — `basePatchDocument`'s call site
- `src/services/index.ts:107` — `baseDeleteDocument`'s call site (NOT
  changed — see Plan)
- `src/services/index.ts:148` — `baseRestoreDocument`'s call site (NOT
  changed — must keep finding soft-deleted docs to restore them)

## Plan
Add an opt-in 4th parameter to `baseCheckDocumentById`
(`{ excludeDeleted?: boolean }`, default unset/false — preserves current
behavior for every existing caller). When `excludeDeleted: true`, the
query gains `deletedAt: null` in its base query, same pattern
`baseFindDocument` already uses
(`idQuerySafe.safeQuery({ deletedAt: null }, fields)`). Pass
`excludeDeleted: true` from `baseUpdateDocument` and `basePatchDocument`
only — `baseRestoreDocument` needs the opposite (find a document
regardless of `deletedAt`, by design, per its own existing comment), and
`baseDeleteDocument` re-marking `deletedAt` on an already-deleted
document is harmless (not a data-mutation risk), so left at the default
too. Smallest diff: one helper signature + 2 call sites in one file, no
schema/route change.
