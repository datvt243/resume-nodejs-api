# 2026-08-25 — fix-pdf-missing-career-fields (verify)

- Worker: verifier (subagent, dispatched via Agent tool, fresh session — no implementation history)
- Node: `fix-pdf-missing-career-fields` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: **SEALED**
- Note graded: `evidence/implementer/2026-08-25/fix-pdf-missing-career-fields-diff.md`

## Reasoning

Read the real `src/` diff directly (not just the implementer's note), per this task's explicit dispatch instructions.

1. **`renderCareer` added and actually wired up, correctly placed.**
   `src/services/createPDF.ts:91` — `_content += _.renderCareer(generalInformation);` sits between
   `_content += _.renderInfo(candidate);` (line 90) and `_content += _.renderSkills(generalInformation);`
   (line 92) inside `pageRender`. `renderCareer` is defined in the `_helper()` return object at
   lines 235-249, not a dead/unused definition — it is called on line 91.

2. **No-op when both fields empty.**
   `createPDF.ts:242` — `if (!career && !careerGoal) return '';` — returns before ever calling
   `_boxContent`, so no empty box is emitted.

3. **Renders only the field that's present.**
   `createPDF.ts:245-246` — two independent `&&`-guarded string appends, one per field
   (`career && (_result += ...)`, `careerGoal && (_result += ...)`) — confirmed each fires
   independently, not gated on the other.

4. **Tests are real, not trivially-true.** Read `src/__tests__/services/createPDF.test.ts` in full
   (61 lines, 3 cases). Each calls the actual exported `pageRender()` with a realistic
   `RECORD`-shaped payload and asserts on the real returned `html` string:
   - Case 1 (`career and careerGoal into the PDF content`) asserts both string values literally
     appear in `html`, plus the uppercased heading `ĐỊNH HƯỚNG NGHỀ NGHIỆP` (correctly anticipating
     `_boxContent`'s `title.toUpperCase()` at `createPDF.ts:199` — not a copy-paste of a wrong
     assumption).
   - Case 2 (`omits the career box entirely when both fields are empty`) asserts the heading is
     **absent** — a real negative assertion, not vacuous.
   - Case 3 (`renders only whichever of career/careerGoal is present`) sets only `career`, asserts
     `QA Engineer` and the heading are present but the string `Mục tiêu nghề nghiệp` (the
     `careerGoal` label from `createPDF.ts:246`) is **absent** — this is the one assertion that
     would actually fail if the individual-field guard logic were broken (e.g. if the two `&&`
     appends were wrongly OR'd together into one always-both-or-neither block). Confirmed I ran it
     — see Command/Output below, all 3 pass.

5. **No `{vi,en}` object-shape regression.** Read `src/candidate_me/index.ts` end-to-end myself
   rather than trusting the implementer's claim. `resolveLocalizedText` (lines 19-23) unwraps
   `{vi,en}` → single string, `.vi`/`.en` fallback, or `''`. `handlerGetAboutMe` applies it to
   `generalInformation.career`/`careerGoal` explicitly at lines 115-116, reassigning
   `dataResult.generalInformation` as a new plain object *before* that function returns. Both
   `fnGetAboutMe`'s public-profile path and `fnExportPDF` (line 155: `handlerGetAboutMe(email, lang)`
   → line 160: `createCV(data, res)` → `pageRender(data)`) go through this same resolution step, so
   `generalInformation.career`/`careerGoal` are guaranteed plain strings by the time `pageRender`
   (and thus `renderCareer`) sees them. No object-shape handling was needed in `renderCareer`, and
   none was added — correct match to the already-sealed `feat-multilang-resume-content` design.

## Command run (verbatim, from `doctrine/MEMORY.md`, self-executed — not copied from the implementer)

```
npm test
```
Run from `/Users/_david/Workspace/Project/ResumeAPI/backend`.

### Output (verbatim tail)
```
Test Suites: 10 passed, 10 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        4.239 s, estimated 5 s
Ran all test suites.
```

### Isolated confirmation the new suite itself ran and passed (verbatim)
```
PASS src/__tests__/services/createPDF.test.ts
  pageRender
    ✓ renders career and careerGoal into the PDF content (issue #87) (10 ms)
    ✓ omits the career box entirely when both fields are empty
    ✓ renders only whichever of career/careerGoal is present
```

### `npx tsc --noEmit` (self-executed, extra check beyond the note)
No output, exit clean — zero type errors.

## Regression check
10 test suites / 52 tests total, up from the prior sealed baseline of 9 suites / 49 tests
(`feat-multilang-resume-content-seal.md`) plus the interim `add-forgot-reset-password-flow` node's
suite count — the +1 suite / +3 tests delta is exactly the new `createPDF.test.ts` file. No existing
test file was modified; no pre-existing test failed.

## Issue #87 scope check
`gh issue view 87` — problem statement: `pageRender` never renders `generalInformation.career`/
`careerGoal` into the exported PDF. Proposal: "Add `career`/`careerGoal` to whatever the PDF
template consumes ... matching however the other already-rendered fields ... are wired through
`createPDF.ts`." Note: the issue text speculates this goes through `views/*.pug` — that's
inaccurate; `createPDF.ts`'s `pageRender` builds HTML via plain JS string templates (`_boxContent`,
`getHTMLLayout`) with zero Pug involvement anywhere in this file (confirmed: no `pug`/`.render(`
reference in `createPDF.ts`; the `src/views/*.pug` tree is unrelated, used for other routes). The
diff matches the actual pattern used by every other field in this file (`_boxContent`, same call
shape as `renderEducation`/`renderExperience`/etc.), which is the real ask underneath the issue's
(incorrect) Pug guess. Scope satisfied.

## Forbidden-states check (`agent-hub/CLAUDE.md`)
| State | Hit? | Why |
|---|---|---|
| `ADHOC_WORK` | No | Node exists on `dev-loop.prime-mermaid.md`, worker identity present |
| `NO_EVIDENCE` | No | Implementer note exists; this verdict note exists |
| `EDIT_UNVERIFIED` | No | `npm test` and `tsc --noEmit` run by me, this session, output pasted verbatim above |
| `CODE_IN_HAVEN` | No | Only this `.md` verdict + PM status table row written to `agent-hub/` |
| `DIAGRAM_DRIFT` | No (fixed by this note) | PM status now updated to SEALED to match verified code state |

## Proportion (`SmallestDiff`)
Diff is exactly one new render function + its call site + one new isolated test file for that
function. No unrelated refactor, no touching of other `_helper()` render functions. Matches node
scope.

## Seal gate
No outward-facing action (no commit/push) at either the implementer or verifier stage — moot here.

## Verdict
**SEAL.** All 5 acceptance criteria from the implementer's note independently re-verified against
the real `src/` diff (not the note's prose), tests run and read back by me, no forbidden-state hit,
scope matches issue #87.
