# 2026-11-08 - linkedin-unparseable-end-date (verdict)
- Worker: verifier · Node: `linkedin-unparseable-end-date` (#401) · New PM status: SEALED
- Notes audited: `evidence/implementer/2026-11-08/linkedin-unparseable-end-date-plan.md`, `evidence/implementer/2026-11-08/linkedin-unparseable-end-date-diff.md`

## Isolation proof
Fresh Agent spawn, description "Verify node linkedin-unparseable-end-date" — not the implementer's `/todo #401` task string.

## Reasoning
| Criterion | Evidence cited in diff note |
|---|---|
| (1) Behavior #5 (updated): unparseable end date → `endDate: null`, `isCurrent: false` (education + experience) | test "an end date that is present but unparseable is a finished entry: endDate null, isCurrent false" ✓; doc Behavior #5 text read, matches |
| (1) blank / "Present" still `isCurrent: true` | existing "parses Education.csv and Positions.csv…" test ✓ (Night School + Current Co) |
| (2) test file passes, new test red on old parser | `6 passed, 6 total`; old parser: `1 failed, 5 passed, 6 total` |
| (3) `npm test` no new failures | `5 failed, 634 passed, 639 total` — same 5 local-env failures (atsPdfIntegration ×4, tokenExpiry ×1) as the sealed `ats-check-messages-i18n` note; 634 = 633 + 1 |
| (3) build clean / Typecheck (inside Build) | `npm run build \| grep -c "error TS"` → `0` |
| (3) lint ≤ 274, none new in touched files | `✖ 274 problems`; per-file now = staging base (1 pre-existing / 0) |
| comments per code-comments.md | one 1-line `//` WHY above `isOngoing`, no issue refs |
| Feature doc | `## Feature doc` line present; `## Feature doc changed` backed by operator answer recorded in doc Open questions (2026-11-07) + Changelog row |
| Supersedes / Still open | both `none`, grep `#401` → only this row |

Forbidden states: none hit. Seal gate: no outward action in this pass (ship is separate). Proportionality: 2 files, matches node. Doctrine proposal: none. Feature doc Status unchanged (fix SEAL, doc already verified).

## Re-run
none — audit-only; note output verbatim, commands match `doctrine/MEMORY.md`.
