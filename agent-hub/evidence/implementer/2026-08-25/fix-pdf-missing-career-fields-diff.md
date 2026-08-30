# 2026-08-25 — fix-pdf-missing-career-fields (implement)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-pdf-missing-career-fields` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "#87" (GitHub issue #87 — PDF export missing career / careerGoal fields)

## Diff
| File | Why |
|---|---|
| `src/services/createPDF.ts` | Added `renderCareer(generalInformation)` to the `_helper()` object — renders `career`/`careerGoal` as a new "Định hướng nghề nghiệp" box (via the existing `_boxContent` helper, same pattern as every other section), placed right after `renderInfo(candidate)` and before `renderSkills` in `pageRender`. Omits the whole box if both fields are empty; omits either `<p>` line individually if only one is set. No object-shape handling needed — `career`/`careerGoal` are already resolved to plain strings by `candidate_me/index.ts`'s `resolveLocalizedText` before `pageRender` ever sees them (confirmed by reading that call path again, same as the `feat-multilang-resume-content` verifier did). |
| `src/__tests__/services/createPDF.test.ts` (new) | `pageRender` had zero test coverage before this — added 3 cases: both fields render, both-empty omits the box entirely, only-one-set renders only that line. Caught my own test-authoring bug immediately: `_boxContent` uppercases its heading (`title.toUpperCase()`), so asserting on the literal-case Vietnamese string failed until the assertion was fixed to the actual uppercased output — a real (if trivial) example of `readback` catching something, not rubber-stamping. |

## Command
```
npm test
```
(run from `/Users/_david/Workspace/Project/ResumeAPI/backend`, copied verbatim from `doctrine/MEMORY.md`)

## Output (verbatim, tail)
```
Test Suites: 10 passed, 10 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        4.31 s, estimated 5 s
Ran all test suites.
```
First run (before fixing my own test's case-sensitivity bug) — verbatim:
```
Test Suites: 1 failed, 9 passed, 10 total
Tests:       2 failed, 50 passed, 52 total
```
Both failures were in the new `createPDF.test.ts` only, both the same
root cause (asserting the pre-uppercase string against `_boxContent`'s
`.toUpperCase()`'d heading) — not a bug in the implementation. Fixed the
assertions, re-ran, clean.

Also ran `npm run build` (extra) — `tsc && npm run copy` completed with no
output (no errors).

## Acceptance
| Criterion | Evidence |
|---|---|
| `career`/`careerGoal` actually appear in the PDF's rendered HTML | `createPDF.test.ts` — `renders career and careerGoal into the PDF content` asserts both string values present in `pageRender()`'s output |
| No box rendered when both fields are empty (no empty section clutter) | `createPDF.test.ts` — `omits the career box entirely when both fields are empty` |
| Partial data (only one of the two set) renders cleanly | `createPDF.test.ts` — `renders only whichever of career/careerGoal is present` |
| No regression to existing PDF rendering (info/skills/experience/etc.) | Full suite still 52/52 — no existing test touched `createPDF.ts` before (0 pre-existing tests for this file), so "no regression" here means the new tests pass and nothing else changed |
| `npm test` passing | Verbatim above |

## Noticed, not done
- `pageRender`/`_helper()` still has zero tests for every OTHER render function (`renderInfo`, `renderSkills`, `renderExperience`, ...) — only the new `renderCareer` path got covered, matching `SmallestDiff` (this task is about #87 specifically, not a general test-coverage sweep for `createPDF.ts`).
- Still no literal PDF file has been opened/screenshotted with real Puppeteer output for this specific fix — same class of gap the `feat-multilang-resume-content` verifier flagged as non-blocking, for the same reason (the code path producing the HTML is directly tested; only the Puppeteer→PDF rendering step itself is untested, and that step is unchanged by this diff).
- Placement of the new "Định hướng nghề nghiệp" box (right after basic info, before skills) is a judgment call — no design spec existed. If the actual project owner wants it elsewhere (e.g. right before Experience), that's a one-line reorder in `pageRender`, not a schema/logic change.

## Seal gate
No outward-facing action yet (no commit/push) — `src/` diff shown in chat for operator review, per seal gate.

## Status
`sealed_pending_verifier`
