# 2026-11-08 - parsed-entries-bulk-shape (seal)
- Worker: verifier · Version: 0.1.0
- Node: `parsed-entries-bulk-shape` (`haven/diagrams/dev-loop.prime-mermaid.md`, #388)
- New PM status: SEALED (row archived to `haven/diagrams/dev-loop-archive.md`; oldest pointer `reset-revokes-sessions` dropped, 20 pointers remain)
- Notes audited: `evidence/implementer/2026-11-08/parsed-entries-bulk-shape-plan.md`, `evidence/implementer/2026-11-08/parsed-entries-bulk-shape-diff.md`

## Isolation proof
Fresh Agent spawn, description "Verify node parsed-entries-bulk-shape" — distinct from the implementer's `/todo #388` task string. Diff not opened; only the notes, the diagram row and the cited feature doc were read.

## Reasoning
| Criterion | Evidence cited in the note | OK |
|---|---|---|
| (1) Behavior #6 — parsed entries post to bulk unchanged, LinkedIn + PDF, finished + ongoing | "✓ LinkedIn: every education and experience, finished and ongoing", "✓ PDF CV: …" against the real `schemaEducation`/`schemaExperience` | yes |
| (1) Behavior #6 — exact shape (`_id: null`, `{ vi, en }`, no null `endDate`) | "✓ parses Education.csv and Positions.csv into the expected shapes" (literal `toEqual` + `not.toHaveProperty('endDate')`) | yes |
| (1) Behavior #5 — unparseable end → no `endDate`, `isCurrent: false` | "✓ an end date that is present but unparseable is a finished entry: no endDate, isCurrent false" | yes |
| (2) 3 files pass; bulk test red on old parsers | `Tests: 17 passed, 17 total`; old parsers `Tests: 2 failed, 2 total` with `"_id" is required. "school" must be of type object…` | yes |
| (2) atsPdfIntegration round-trip with real Chrome | `Tests: 4 passed, 4 total` (system Chrome via `PUPPETEER_EXECUTABLE_PATH`) | yes |
| (3) `npm test` no new failures | `Tests: 5 failed, 636 passed, 641 total`; FAIL suites = tokenExpiry + atsPdfIntegration, the known local-env failures (same as `linkedin-unparseable-end-date-diff.md`); 636 = 634 + 2 new | yes |
| Typecheck (MEMORY.md: inside Build) | `npm run build \| grep -c "error TS"` → `0` | yes |
| Lint ≤ 274 baseline, none new in touched files | `✖ 274 problems`; per-file now = base (1 pre-existing in `parseLinkedInExport.service.ts`, same on staging) | yes |
| comments per code-comments.md | row present: JSDoc why on `ParsedDates`, `//` why on `localized`, no issue refs in non-test `src/` | yes |
| Feature doc `cv-file-upload-import.md` acceptance line `parsedEntriesBulkSchema.test.ts` passes | covered by the 17-passed run | yes |
| Feature doc acceptance — `uploadCvPdfParse.test.ts`, `candidate.controller.test.ts` pass | not among the FAIL suites of the full `npm test` (63 suites passed) | yes |
| `## Feature doc changed` has operator answer | "Bug — #388" (2026-11-07) + AskUserQuestion 2026-11-08 "Parser emits full shape", "Both vi and en" | yes |
| Supersedes / Still open | `none` / `none`, grep `#388` → only this row | yes |

- Commands match `doctrine/MEMORY.md` (Test one file, Test, Build, Lint); output not truncated.
- Forbidden states: ADHOC_WORK no (node on diagram) · NO_EVIDENCE no · EDIT_UNVERIFIED no (typecheck + tests cited) · CODE_IN_HAVEN no (no non-md/yaml files under `haven/`) · DIAGRAM_DRIFT no (row updated here).
- Seal gate: no outward-facing action in this pass; commit/push left to `/ship`.
- Proportionality: parsers + their tests + swagger/api.md, all named by the node row. Fix SEAL: feature doc Status left as is (already verified).
- Doctrine proposal: none.

## Re-run
none — audit-only; note cites verbatim output for every criterion, commands match doctrine, not a `/release` gate.
