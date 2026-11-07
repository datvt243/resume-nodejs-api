# 2026-11-08 - bulk-partial-message (SEAL)
- Worker: verifier · Version: 0.1.0
- Node: `bulk-partial-message` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub #404)
- New PM status: SEALED (collapsed: full row → `haven/diagrams/dev-loop-archive.md`, pointer row active; 21 pointer rows → oldest `add-project-type-experience-link` deleted, full row already archived at line 145)
- Notes audited: `evidence/implementer/2026-11-08/bulk-partial-message-plan.md`, `evidence/implementer/2026-11-08/bulk-partial-message-diff.md`

## Isolation proof
Fresh Agent spawn, description "Verify node bulk-partial-message" — not the implementer's task string (`/todo #404`). Diff not opened (EvidenceOnly).

## Reasoning
| Check | Evidence |
|---|---|
| Commands match `doctrine/MEMORY.md` | `npx jest <file>`, `npm test`, `npm run build` (Typecheck inside Build), `npm run lint` — all from the table |
| Typecheck | `npm run build \| grep -c "error TS"` → `0` |
| Lint baseline | `✖ 274 problems (274 errors, 0 warnings)` ≤ 274; per touched file now = base (BaseController.ts 31/31, en/vi/test 0/0) |
| Output not cut | no `...`/truncated markers; jest summary + verbose lines verbatim |
| (1) Behavior #8 partial → 201 + en message | "is best-effort: one invalid item…" ✓ asserting `'Created 1 of 2 items'` |
| (1) vi message | "words a partial success as \"X of Y\" in Vietnamese too…" ✓ (`'Đã thêm 2/3 mục'`) |
| (1) all-succeeded / all-failed unchanged | "reports summary.failed: 0 when every item succeeds" ✓; "fnBulkCreate answers every-item-failed with one 400 envelope…" ✓ |
| (2) file passes, red on old code | `Tests: 17 passed, 17 total`; old code: `2 failed, 15 passed, 17 total` (exactly the en + vi tests ✕) |
| (3) `npm test` no new failures | `5 failed, 626 passed, 631 total` — same 5 env failures (atsPdfIntegration ×4, tokenExpiry ×1) as `soft-deleted-writes-404-diff.md`; 626 = 625 + 1 new test |
| comments per code-comments.md | "no comments touched" row present |
| Feature doc (6b) | `## Feature doc` cites `doctrine/features/cv-section-crud.md`; fix → Behavior #8 evidenced above. `## Feature doc changed` carries operator answer "Bug: partial-success message — #404" (recorded in the doc's Open questions, 2026-11-07) |
| Supersedes / Still open | `none`; active diagram has no other `#404` row |
| Doctrine proposal (6c) | none in note |
| Forbidden states | ADHOC_WORK no (node on diagram); NO_EVIDENCE no; EDIT_UNVERIFIED no (test + typecheck cited); CODE_IN_HAVEN no (`find haven` non-md/yaml → empty); DIAGRAM_DRIFT no (row updated here) |
| Seal gate | none outward-facing in this pass (ship is `/ship --merge`) |
| Proportionality | 4 files: 2 locale keys, one branch in `fnBulkCreate`, 1 assertion change + 1 new test — matches node scope |
| 11e | fix SEAL — doc Status left as `verified` |

## Re-run
none — audit-only; note verbatim, commands match doctrine, every criterion cited.
