# 2026-11-05 - salary-desired-range — SEAL
- Worker: verifier · Version: 0.1.0
- Node: `salary-desired-range` (`haven/diagrams/dev-loop.prime-mermaid.md`), GitHub #362
- New PM status: SEALED (archived to `haven/diagrams/dev-loop-archive.md`)
- Note audited: `evidence/implementer/2026-11-05/salary-desired-range-plan.md`

## Isolation proof
Fresh Agent-tool subagent spawned with description "Verify salary-desired-range seal", bundle read from session scratchpad `verifier-bundle.md`; did not write the diff, no access to the implementer pass's reasoning.

## Reasoning
| Criterion (diagram row) | Evidence in note | Result |
|---|---|---|
| From/To fields, Number ≥ 0, either end optional | tests "accepts {From:1000,To:2000}", "{From:1000}", "{To:2000}", "{From:null,To:2000}", "{}"; negatives rejected on their own field; `npx jest src/__tests__/candidate_profile/generalInformation` → `Tests: 20 passed, 20 total` | Covered |
| `To < From` → 400, `details[].field = salaryDesiredTo` | "rejects To below From" → paths `['salaryDesiredTo']` with abortEarly:false (same as `validateSchema`) | Covered |
| Legacy doc `salaryDesired` → From = To (pre('init'), no migration) | "hydrates a document with only salaryDesired as an exact range" → From=To=1500; "keeps a stored range as is"; "defaults both ends to null" | Covered |
| swagger, locales, `.claude/rules/models.md` updated | Diff table rows for `swagger.config.ts`, `locales/{vi,en}.ts`, `.claude/rules/models.md`; all show `M` in session git status | Covered |
| Tests updated | +14 tests, `Tests: 5 failed, 543 passed, 548 total` vs baseline 534 total / 5 failed | Covered |
| `npm test` no new failure vs staging | Failing suites only `tokenExpiry.test.ts` + `atsPdfIntegration.test.ts` — same pre-existing set accepted in prior seals (e.g. `fix-trim-strict-rejects-spaces`), untouched by this diff | Covered |
| `npm run build` exit 0 (= Typecheck, `inside Build` per MEMORY.md) | `build_exit=0` | Covered |
| Lint ≤ 274, none new in touched files | `✖ 274 problems (274 errors, 0 warnings)` = baseline; 2 errors in `generalInformation.validate.ts` are unchanged `_id` lines present on stashed baseline (51/56 → 53/58, shifted +2) — same treatment as `add-main-skills`/`fix-trim-strict-rejects-spaces` seals | Covered |
| comments per code-comments.md | 1-line WHY on hook, `shortcut:` line on alias, no issue refs | Covered |

- Commands match `doctrine/MEMORY.md` (Test, Test one file, Build, Lint). Output is excerpted with `#` labels but no `...`/truncation markers; every cited count is present verbatim.
- `## Supersedes: none` — only one `#362` row on the active diagram. OK.
- Forbidden states: ADHOC_WORK no (node exists); NO_EVIDENCE no; EDIT_UNVERIFIED no (test/build/lint output cited); CODE_IN_HAVEN no (no code under `haven/`); DIAGRAM_DRIFT no (PM status updated by this SEAL).
- Seal gate: no outward-facing action in the note; ship deferred to after SEAL.
- PDF/DOCX export standard: not touched (note: no export prints salary).
- Proportionality: the Joi `salaryDesired` legacy alias is beyond the node's literal text, but it prevents the live Vue client (`salaryDesired` single value) from getting 400 on every save — a Care-lens requirement, small, marked `shortcut:` for removal. Accepted.

## Re-run
none — audit-only; note had verbatim counts, commands match doctrine, every criterion cited; node not outward-facing or a release gate.

## Collapse
Full row appended to `dev-loop-archive.md` as SEALED; active row replaced with pointer; pointer count would hit 21 → oldest pointer `fix-render-puppeteer-cache-dir` (2026-10-24, full row already in archive) removed.
