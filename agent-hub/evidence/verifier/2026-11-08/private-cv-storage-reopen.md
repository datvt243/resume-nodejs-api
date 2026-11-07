# 2026-11-08 - private-cv-storage (verdict)
- Worker: verifier · Version: 0.1.0
- Node: `private-cv-storage` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #383)
- Notes audited: `evidence/implementer/2026-11-08/private-cv-storage-plan.md`, `evidence/implementer/2026-11-08/private-cv-storage-diff.md`
- Verdict: **REOPEN**
- New PM status: unchanged (IN_PROGRESS). REOPEN is a verdict, not a state.

## Isolation proof
Fresh Agent spawn with the task string "You are the agent-hub **verifier** worker for the repo at /Users/_david/... (git branch `383-generated-pdfs-uploaded`, uncommitted working tree = the diff under review). You are a fresh, independent subagent ...". The implementer's task string was `/todo #383`. My context holds none of the implementer's reasoning.

## Reasoning
| Criterion | Cited evidence | Result |
|---|---|---|
| Node (1a) matches `cv-export.md` Behavior #8 (updated) | Test "renders to a buffer only — page.pdf gets no path" in `Tests: 36 passed, 36 total`; Behavior #8 now reads "only streamed, never written to disk" | met |
| Node (1b) matches `features/candidate-account.md` CV paths | Not cited in the note's `## Acceptance` table. (I checked: the doc names no on-disk path, Behavior line 35 only says "uploaded CV file on disk", so it is consistent, but the note must say so.) | missing citation |
| Node (2) target tests pass | `npx jest ...createPDF.test.ts ...uploadCV.middleware.test.ts` → `Tests: 36 passed, 36 total` | met |
| Node (3a) `npm test` no new failures | `5 failed, 594 passed, 599 total`; same 5 env failures as the `public-profile-field-whitelist` seal (589 passed then, +5 = new tests) | met |
| Node (3b) build / Typecheck (inside Build) | `npm run build \| grep -c "error TS"` → `0` | met |
| Node (3c) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base for all 5 touched `.ts` files | met |
| Plan (3) legacy move, boot never crashes | 3 `moveLegacyCvUploads` tests in the 36; `server.ts` try/catch → `logger.error` | met |
| comments per code-comments.md | Row present: why-comments only, no issue refs in `src/` non-test code | met |
| Feature doc (fix, Behavior #8) | `## Feature doc changed` line records operator answers (2026-11-07 "Bug — #383"; AskUserQuestion 2026-11-08 "Move them at startup (Recommended)"). Changelog row matches. Fix SEAL would leave Status `verified` | met |
| **Project extension: PDF/DOCX export** (`agent-hub/CLAUDE.md` + `doctrine/standards/pdf-export-standard.md` Enforcement) | Diff touches `src/services/createPDF.ts`. The note must confirm each of the 10 rules or name which don't apply and why. Neither note mentions `pdf-export-standard.md` (grep: 0 hits). The standard says: "A verifier seeing an export-code diff with no mention of this file should treat that as a gap." Rule 10 is the point of this fix, so it needs explicit confirmation | **missing** |
| Doctrine proposal | none | n/a |
| Supersedes / Still open | `none` / `none`; `#383` matches only this row | ok |
| Forbidden states | ADHOC_WORK no · NO_EVIDENCE no · EDIT_UNVERIFIED no (outputs cited) · CODE_IN_HAVEN no · DIAGRAM_DRIFT no | ok |
| Seal gate | no outward action in this pass | ok |
| Proportionality | createPDF/upload dir/boot move/ignore files/one Dockerfile comment, all tied to the node + operator answer | ok |

## Missing
1. `pdf-export-standard.md` compliance for the `createPDF.ts` change: add a row per rule 1-10 to the diff note's `## Acceptance`, confirmed (e.g. rule 10: no disk write, cite the test) or named as not applicable with the reason (e.g. rules 1-8 not touched, since template HTML/CSS is unchanged, citing the diff). Per the standard's Failure mode, any rule 1-5 claim needs extracted-text evidence, unless the note shows the template output is unchanged.
2. A `## Acceptance` row for node criterion (1b) `features/candidate-account.md` CV paths (the doc is consistent, so one citation line is enough).

## Re-run
none (audit-only: outputs verbatim, commands match `doctrine/MEMORY.md`, not a release gate). Read only `doctrine/features/candidate-account.md` (grep for CV paths) and `doctrine/standards/pdf-export-standard.md`. No command re-run, no diff opened.
