# 2026-11-08 - private-cv-storage (verdict, round 2)
- Worker: verifier · Version: 0.1.0
- Node: `private-cv-storage` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #383)
- Notes audited: `evidence/implementer/2026-11-08/private-cv-storage-diff-r2.md` (re-read from disk), plus round 1 `private-cv-storage-plan.md` / `private-cv-storage-diff.md` (diff, commands and outputs unchanged)
- Verdict: **SEAL**
- New PM status: SEALED. Full row appended to `haven/diagrams/dev-loop-archive.md`; active row collapsed to a pointer. Step 11c: 21 → 20 pointer rows, pruned the oldest `cv-filename-lang-suffix` (2026-11-06, first in file order; full row confirmed at archive line 149).

## Isolation proof
Resumed round 2 via coordinator message: "Round 2 for node private-cv-storage (#383): re-read `agent-hub/evidence/implementer/2026-11-08/private-cv-storage-diff-r2.md` from disk ...". The original spawn task string was "You are the agent-hub **verifier** worker for the repo at /Users/_david/... (git branch `383-generated-pdfs-uploaded` ...)". The implementer's task was `/todo #383`. My context holds only my round 1 verdict, none of the implementer's reasoning.

## Reasoning
| Criterion | Cited evidence | Result |
|---|---|---|
| Round 1 gap 1: pdf-export-standard.md rules 1-10 | r2 rule-by-rule table. Hunk list `git diff origin/staging -U0 -- src/services/createPDF.ts`: every hunk at new line ≤ 76. `pageRender` is at line 103 and `getHTMLLayout` at line 459, with no hunk, so the template HTML is unchanged and rules 1-7 and 9 hold as on staging (this meets the extracted-text exemption round 1 allowed). Rule 8 is n/a (classic/modern is not ATS-branded; `createPDF.ats.ts`/`createDocx.ts` have an empty `--stat`). Rule 10: grep shows no `fs.`/`writeFile`/`path:` in `createPDF.ts`, only the comment on line 55. The buffer-only test is in `Tests: 36 passed, 36 total` | met |
| Round 1 gap 2: node (1b) `candidate-account.md` CV paths | r2 Acceptance row: the doc names no on-disk path (consistent with what I checked in round 1); account delete follows `CV_UPLOAD_DIR` | met |
| Node (1a) Behavior #8 (updated) | round 1: buffer-only test + doc text | met |
| Node (2) target tests | round 1: `Tests: 36 passed, 36 total` | met |
| Node (3) npm test / build / lint | round 1: `5 failed, 594 passed, 599 total` (same 5 env failures); `error TS` count `0`; `✖ 274`, per-file now = base | met |
| comments per code-comments.md | round 1 row; r2 adds no code. The one comment cited in r2 (`// Buffer only, never written under public/ — express.static would serve it without auth.`) is a `//` why, no issue ref | met |
| Feature doc (fix, Behavior #8) | operator answers recorded in round 1; fix SEAL, so Status stays `verified` (step 11e) | met |
| Doctrine proposal | none | n/a |
| Supersedes / Still open | `none` / `none` | ok |
| Forbidden states | ADHOC_WORK no · NO_EVIDENCE no · EDIT_UNVERIFIED no · CODE_IN_HAVEN no (only `.md` touched in `haven/`) · DIAGRAM_DRIFT no (status moved here) | ok |
| Seal gate | no outward action; `/ship --merge` follows | ok |
| Proportionality | r2 is evidence-only; round 1 scope unchanged | ok |

Noted, not blocking: `createPDF.ats.ts:480` opt-in `PERSIST_EXPORTED_PDF` write under `public/pdf/` predates this node and is outside #383. It breaks rule 10's "never under `public/`", so it is a candidate for its own issue.

## Re-run
none (audit-only: outputs verbatim, commands match `doctrine/MEMORY.md`, not a release gate). No command re-run, no diff opened.
