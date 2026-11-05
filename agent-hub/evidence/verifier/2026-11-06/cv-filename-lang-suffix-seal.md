# 2026-11-06 - cv-filename-lang-suffix (verdict)
- Worker: verifier · Version: 0.1.0
- Node: `cv-filename-lang-suffix` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #375)
- Notes audited: `evidence/implementer/2026-11-06/cv-filename-lang-suffix-plan.md`, `evidence/implementer/2026-11-06/cv-filename-lang-suffix-diff.md`
- New PM status: SEALED (row collapsed into `haven/diagrams/dev-loop-archive.md`; oldest pointer row `claude-md-refactor` pruned per step 11c — its full row already in the archive)

## Isolation proof
Fresh Agent-tool subagent spawned with description "verify_seal cv-filename-lang-suffix #375" — not the implementer's task string (`/todo #375`). No memory of the implement pass; diff not opened, only the two notes.

## Reasoning
| Criterion | Cited evidence |
|---|---|
| classic PDF: `lang=en` → `_EN`, none/vi → `_VI` | createPDF.test.ts `createCV` cases `Vo_Dat_CV_2026_VI.pdf` / `Dat_Vo_Backend_Developer_CV_EN.pdf`; controller passes lang (`index.ts:364`); Output 1 `Tests: 75 passed, 75 total` |
| ATS PDF | `createPDF.ats.ts:485` passes `options.lang ?? 'vi'`, controller `{ lang }` at `index.ts:360`; behaviour covered by `cvFilename` unit table; `lang` is a required field so tsc forces the caller (Output 3 build clean). No dedicated header test — accepted: same function, type-enforced wiring |
| public PDF | public-pdf.test.ts `_EN` (lang=en) / `Dat_Vo_CV_VI.pdf` (default) — Output 1 |
| DOCX | createDocx.test.ts `Dat_Vo_CV_VI.docx`, `Dat_Vo_CV_CV_VI.docx`, `Dat_Vo_CV_EN.docx` — Output 1 |
| no double suffix, any case | rows `Dat CV_VI`→`Dat_CV_VI.pdf`, `dat cv en`→`dat_cv_en.pdf`, `Dat CV_Vi `+en→`Dat_CV_Vi.pdf`, `venv` still suffixed — Output 1 |
| tests updated + swagger `cvFileName` | Diff table (3 test files, `swagger.config.ts:155`) |
| `npm test` clean | Output 2 `Tests: 5 failed, 572 passed, 577 total` vs baseline Output 5 `5 failed, 566 passed, 571 total`; same 5 names; verbatim reasons are env (no local Chrome; local `.env` TOKEN_EXP_IN=3h → `Received: 10800`). Neither touches filename code. Accepted as "no new failure vs staging", the bar the previous sibling nodes (#361/#362/#363) sealed on; +6 new tests all pass |
| `npm run build` / Typecheck (inside Build) | Output 3: build reached `npm run copy` (runs only after `tsc &&` succeeds) |
| Lint ≤ 274, none in changed files | Output 4 `✖ 274 problems (274 errors, 0 warnings)`; before/after `same-files` + `same-messages` |
| comments per code-comments.md | `cvFilename` JSDoc extended (WHY, `/** */`), one `//` WHY line on the regex skip, no `(#N)` refs |
| PDF export standard | Only `Content-Disposition` filename changes; render path untouched, so rules 1-9 N/A with reason given; rule 10 on-disk path unchanged. Rendered-text extraction not required since rules 1-5 not touched |
| Supersedes / Still open | both `none`; grep of active diagram for #375 → only this node (confirmed) |

Forbidden states: ADHOC_WORK no (node on diagram) · NO_EVIDENCE no (plan + diff notes) · EDIT_UNVERIFIED no (verbatim output for test, build, lint) · CODE_IN_HAVEN no (no non-md/yaml file in `haven/`) · DIAGRAM_DRIFT no (status moved to SEALED here).
Seal gate: no commit/push; remote branch from `gh issue develop` is the `/todo` step-0 flow, recorded.
Proportionality: every touched file is a caller of `cvFilename`, its test, or a required doc line (swagger, `.claude/rules/models.md`). Positional `lang` on `createCVDocx` matches its existing `theme` param. No extra scope.

## Re-run
none — audit-only. Output is verbatim, commands match `doctrine/MEMORY.md`, not a `/release` gate, and `doctrine/domains/PROJECT.md` lists no re-run class for this change.
