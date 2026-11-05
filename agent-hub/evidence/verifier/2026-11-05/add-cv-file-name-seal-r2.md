# 2026-11-05 — add-cv-file-name (verifier verdict, r2)

- Worker: verifier · Version: 0.1.0 (subagent, dispatched via Agent tool)
- Node: `add-cv-file-name` (`haven/diagrams/dev-loop.prime-mermaid.md`), GitHub #363
- Notes read: `evidence/implementer/2026-11-05/add-cv-file-name-plan.md` (r1, via previous verdict), `evidence/verifier/2026-11-05/add-cv-file-name-reopen.md`, `evidence/implementer/2026-11-05/add-cv-file-name-diff-r2.md`
- New PM status: SEALED (PENDING → SEALED; collapsed to archive)

## Isolation proof
Spawned as a fresh `Agent` with description "Re-verify add-cv-file-name r2" (differs from the r1 verifier's "Verify add-cv-file-name seal" and from any implementer task string). No implementer turns in context. Did not write this diff.

## Reasoning
| Criterion | Verdict |
|---|---|
| All r1 criteria (PATCH validation, `cvFilename()` helper, 4 export paths, CORS exposedHeaders, `cvFileName` in GET/PATCH/public, swagger + models.md + tests, `npm test` 5 baseline failures / 569 total, build_exit=0, lint 274 ≤ 274, comments per code-comments.md, Supersedes none, seal gate "Approve all 4", proportionality) | cited in previous verdict; r2 states no `src/` change — stands |
| Project extension: `pdf-export-standard.md` 10 rules | now cited rule-by-rule in r2 (`## pdf-export-standard.md — rule by rule`). Rules 1-8 "not touched" backed by keyword grep over changed export lines = `0` and the verbatim changed-line list (only header lines, imports, helper, đ/Đ slugify step). Rule 9: `applyPdfMetadata` call untouched. Rule 10: `cvFilename(` appears only in the 4 `Content-Disposition` lines; disk writes (`createPDF.ats.ts:478`, `createPDF.ts:75`) are unchanged lines; the classic `<email>.pdf` write is pre-existing, logged under `## Noticed, not done` |
| Rules 1-5 text-extraction clause | not required — no rule 1-5 code changed (grep = 0) |

Forbidden states: `ADHOC_WORK` no · `NO_EVIDENCE` no · `EDIT_UNVERIFIED` no (REOPEN gap closed) · `CODE_IN_HAVEN` no · `DIAGRAM_DRIFT` no (PM updated).

## Missing
none

## Noticed
Pre-existing rule-10 violation `createPDF.ts:75` (classic PDF written to `public/pdf/<email>.pdf`) — deserves its own node; not a blocker for this one.

## Re-run
`partial` — node is outward-facing (public PDF endpoint, header sanitisation, CORS). Re-ran read-only, same as r2 note's commands:
- `grep -rn "cvFilename(" src --exclude-dir=__tests__` → 4 lines, identical to the note (public-pdf.ts:80, createDocx.ts:243, createPDF.ts:85, createPDF.ats.ts:481)
- `grep -n "writeFileSync\|path: \`" …` → `createPDF.ts:75`, `createPDF.ats.ts:478`, identical
- changed-line keyword grep → `0`, identical
Build/test/lint not re-run (no `src/` change since the r1 verifier's partial re-run).
