# 2026-09-02 — add-docx-export-format (seal)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `add-docx-export-format` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED

## Reasoning
Evidence note only was read (`evidence/implementer/2026-09-02/add-docx-export-format-diff.md`),
per `EvidenceOnly` — `src/` files (`createDocx.ts`, `candidate_me/index.ts`,
`routers/api/v1/index.ts`) were not opened directly, nor was `git diff` run.

Test command matches `doctrine/MEMORY.md` verbatim (`npm test`, run from
repo root) — not an invented command. Output cited is the standard Jest
summary tail (`Test Suites: 11 passed, 11 total` / `Tests: 60 passed, 60
total` / `Time: 4.611 s` / `Ran all test suites.`) with no `...` or
"truncated" marker — same tail-only citation pattern already accepted on
prior SEALED nodes (`add-visit-tracking`, `fix-visit-model-missing-id`).
Baseline of 54 tests / 10 suites matches the PM status table's own record
of the last sealed node on this branch; this note's delta is exactly +1
suite / +6 tests (`createDocx.test.ts`), consistent and not surprising for
a new-module feature.

Acceptance criteria walked one at a time, all cited:
1. `GET /api/v1/download-pdf?format=docx` returns a real, valid `.docx` —
   live curl cited: HTTP 200, `Content-Type:
   application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
   `Content-Disposition` filename, and `file` command output identifying it
   as "Microsoft Word 2007+" (not just a Content-Type header claim).
2. The `.docx` actually contains the candidate's real data — cited: word
   archive unzipped, `word/document.xml` grepped, the specific throwaway
   test account's email (`docxexport-check+1788349877@example.com`) found
   inside — rules out an empty-but-valid document.
3. Reuses existing data-fetch, no duplicate query — cited: diff table row
   states `handlerGetAboutMe(email, lang)` called exactly once, same call
   already made for PDF/JSON, branch inserted at the same point as the
   existing `format === 'json'` check.
4. No regression to existing PDF/JSON paths — cited: same live-verification
   session re-curled both `?format=json` (real aggregated JSON, same shape)
   and no-format (`application/pdf`, `file` confirms "PDF document, version
   1.4, 1 pages") after the docx branch was added.
5. `npx tsc --noEmit` clean — cited verbatim ("clean, no errors").
6. `npm test` all pass — cited verbatim, `60 passed, 60 total` (54 baseline
   + 6 new, matches PM table baseline).
7. `npm run build` clean — cited verbatim (`tsc && npm run copy` completed,
   no errors).
8. Diagram-first (`NodeBeforeCode`) — plan note (read for context) shows
   the `add-docx-export-format` PENDING row was drafted before any `src/`
   edit, per the `exist -- no --> draft` branch; PM table confirms the row
   existed pre-SEAL.

Forbidden-state scan (5 states, `agent-hub/CLAUDE.md`):
- `ADHOC_WORK` — no hit; node exists on the diagram (was PENDING, drafted
  first per the plan note).
- `NO_EVIDENCE` — no hit; both plan and diff notes present.
- `EDIT_UNVERIFIED` — no hit; `npm test`/`npm run build`/`tsc --noEmit`
  outputs are read back verbatim, plus an additional live manual
  verification pass (curl + `file` + unzip/grep) beyond what the recipe
  requires.
- `CODE_IN_HAVEN` — no hit; the only `haven/`-tree write is the diagram's
  PENDING/SEALED row text, no `.ts`/`.js`/`.sh` leaked in.
- `DIAGRAM_DRIFT` — no hit; PM status is being updated in this same pass to
  match the shipped (but uncommitted) code state.

Seal gate: note's own "Seal gate" section confirms no commit/push happened
— diff shown for operator review only, correctly not outward-facing per
`/todo`'s stricter gate. Confirmed, not re-litigated.

Proportion (`SmallestDiff`): 4 `src/` files touched (1 new service module,
1 branch added to an existing controller, 1 Swagger-only doc edit, plus
`package.json`/`package-lock.json` for the new dependency) plus 1 new test
file — proportionate to "add a new export format," mirrors the existing
`format === 'json'` branch shape exactly, no unrelated refactor bundled in.

## Re-run scope
Per the recipe's 2026-09-02 "Re-run scope" addendum: this node is not
outward-facing (no commit/push per the note) and not a `/release` gate, the
note's command matches doctrine, and its output is not truncated — so this
verdict is taken straight off the note's citations, no independent
`npm test`/`npm run build` re-run performed.

No forbidden-state hits. Verdict: SEAL.
