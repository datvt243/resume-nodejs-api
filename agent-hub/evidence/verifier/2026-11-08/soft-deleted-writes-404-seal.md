# 2026-11-08 - soft-deleted-writes-404 (seal)
- Worker: verifier · Version: 0.1.0
- Node: `soft-deleted-writes-404` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub #403)
- New PM status: SEALED (row archived to `haven/diagrams/dev-loop-archive.md`, pointer row on the active diagram; oldest pointer `add-familiar-skills` dropped to keep 20)
- Notes audited: `evidence/implementer/2026-11-08/soft-deleted-writes-404-plan.md`, `evidence/implementer/2026-11-08/soft-deleted-writes-404-diff.md`

## Isolation proof
Fresh Agent spawn, description "Verify node soft-deleted-writes-404" — not the implementer's `/todo #403` task string. Diff not opened; verdict from the notes only.

## Reasoning
| Criterion | Evidence (diff note) | OK |
|---|---|---|
| (1) Behavior #5: delete of soft-deleted id → 404, `deletedAt` untouched | ✓ "answers 404 for an already soft-deleted document, leaving deletedAt untouched"; red on old code (✕ same test) | yes |
| (1) Behavior #9: image upload on soft-deleted id → 404, nothing parsed | ✓ "answers 404 before parsing or storing any file"; red on old code | yes |
| (1) Behavior #6 restore unchanged | ✓ "clears deletedAt ... even for an already soft-deleted document", ✓ "answers 404, never a 'restored successfully' message..." | yes |
| (2) the two jest files pass, new tests red on old code | `Tests: 28 passed, 28 total`; old: `2 failed, 26 passed, 28 total` | yes |
| (3) `npm test` no new failures vs staging | `5 failed, 625 passed, 630 total` = same 5 local-env failures as `visit-skip-private-diff.md` (623 + 2 new) | yes |
| (3) build clean / Typecheck (`inside Build` per MEMORY.md) | `npm run build \| grep -c "error TS"` → `0` | yes |
| (3) lint ≤ 274 baseline, none new in touched files | `✖ 274 problems`; per-file now = base (2/31/0/0); the one new error found was fixed and re-run (`28 passed`, file → 0) | yes |
| comments per code-comments.md | row present: two 1-line `//` WHY comments, doc block kept true, no issue refs in non-test `src/` | yes |

- Feature doc: `## Feature doc` cites `doctrine/features/cv-section-crud.md`; `## Feature doc changed` carries the operator answer ("Bug: 404 — #403" ×2), present in the doc's Open questions + Changelog row. Fix SEAL → doc Status left as is (step 11e).
- `## Supersedes: none` / `## Still open: none` present; `#403` grep → only this row.
- Doctrine proposal: none.
- Forbidden states: ADHOC_WORK no (node on diagram), NO_EVIDENCE no, EDIT_UNVERIFIED no (outputs verbatim, typecheck cited), CODE_IN_HAVEN no, DIAGRAM_DRIFT no (status updated here).
- Seal gate: no outward action in the implement pass (commit/push via `/ship`).
- Proportionality: 2 `src/` files + 2 tests, matches the node's fix scope.
- Output cut/hidden: no `...`/truncated markers; excerpts are labelled per command.

## Re-run
none — audit-only; note verbatim, commands match `doctrine/MEMORY.md`, no re-run trigger applies.
