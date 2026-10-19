# 2026-10-19 — add-experience-career-break (implementer diff, round 2 after REOPEN)

Worker: implementer · Version 0.1.0
Node: `add-experience-career-break` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row, PENDING) · status: sealed_pending_verifier
Task (verbatim): `/todo "phần experience, bổ sung career break như linkendin"` → issue #267
Supersedes the format of `add-experience-career-break-diff.md` (kept, not deleted). Addresses `evidence/verifier/2026-10-19/add-experience-career-break-reopen.md`: missing Acceptance table, comments row, pdf-export-standard check (+ real text extraction vi/en), verbatim build output, Seal gate section, classic PDF/DOCX render tests.

## Hub bytes before
238382 (from plan note)

## Diff
| file | why |
|---|---|
| `src/models/experience.model.ts` | export `CAREER_BREAK_TYPES` (12 LinkedIn types); fields `isCareerBreak` (Boolean, false), `careerBreakType` (String, enum `['', ...types]`, default `''` → existing docs without the field get `''`, valid) |
| `src/candidate_profile/experience/experience.validate.ts` | `company`/`position` `.when('isCareerBreak', { is: true, then: Joi.string().allow('').optional() })`; `careerBreakType` `.valid('', ...types).when(is true → invalid('').required())`. Same `schemaExperience` serves `/create`, `/update`, `/bulk` (experience.controller.ts:10-11 `createCrudController({ schema: schemaExperience })`) |
| `src/types/candidate.type.ts` | `ExperienceData.isCareerBreak?`, `careerBreakType?` |
| `src/locales/en.ts`, `src/locales/vi.ts` | `cv.careerBreak` + `cv.careerBreakTypes.<12>` |
| `src/services/createPDF.ats.ts` | career-break title from `t(..., lang)` |
| `src/services/createPDF.ts`, `src/services/createDocx.ts` | same title, `t(..., 'vi')` (templates are vi-hardcoded, see rule 3 below) |
| `src/config/swagger.config.ts` | Experience schema documents both fields |
| `src/__tests__/candidate_profile/experience.validate.test.ts` (new) | 6 validation tests |
| `src/__tests__/services/createPDF.ats.test.ts` | +2 (en/vi title) |
| `src/__tests__/services/createPDF.test.ts` | +1 classic render (round 2) |
| `src/__tests__/services/createDocx.test.ts` | +1 DOCX render (round 2) |
Round 2 also removed an issue ref `(#267)` from the new test file's JSDoc header (code-comments.md "Delete: issue refs").

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (doctrine/MEMORY.md):
- `npm test`
- `npm run build`
- `npm run lint` equivalent count: `npx eslint . -f json` → summed message count
- PDF extraction: scratch script (scratchpad, not in repo) calling real `renderAtsPdfBuffer(data, { lang })` ×vi/en + `renderPdfBuffer(data)` (classic) → `extractPdfText` (pdf-parse), run via `TS_NODE_TRANSPILE_ONLY=1 npx ts-node -r tsconfig-paths/register --project tsconfig.json <script>`

## Output
`npm test`:
```
Test Suites: 44 passed, 44 total
Tests:       398 passed, 398 total
```
`npm run build` (tail, verbatim; `npm run build 2>&1 | grep -c "error TS"` → `0`):
```
> resume-nodejs-api@1.13.1 copy
> cp -R ./src/views ./src/public ./dist/
```
Lint: `lint 276` (baseline 276 → delta 0).
Targeted: `npx jest src/__tests__/services/createPDF.test.ts src/__tests__/services/createDocx.test.ts` → `Tests:       27 passed, 27 total`.

Extracted text (pdf-parse), fixture = 1 job (09/2021–present) + 1 career break `caregiving` (09/2020–12/2021):
```
=== ATS vi ===
Jane Doe
jane@example.com
KINH NGHIỆM LÀM VIỆC
Senior Engineer — New Co
09/2021 – Hiện tại
Led team
Công nghệ: TypeScript
Nghỉ việc tạm thời — Chăm sóc người thân
09/2020 – 12/2021
Cared for family
=== ATS en ===
Jane Doe
jane@example.com
EXPERIENCE
Senior Engineer — New Co
09/2021 – Present
Led team
Stack: TypeScript
Career break — Caregiving
09/2020 – 12/2021
Cared for family
=== CLASSIC ===
J A N E   D O E
- jane@example.com
K I N H   N G H I Ệ M   L À M   V I Ệ C
SENIOR ENGINEER
09/2021
New Co
Led team
TypeScript
NGHỈ VIỆC TẠM THỜI
09/2020 - 12/2021
Chăm sóc người thân
Cared for family
```

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) model fields `isCareerBreak` + `careerBreakType` enum, `''` default | `experience.model.ts` diff; enum `['', ...CAREER_BREAK_TYPES]`, `default: ''` |
| (2a) career break: company/position empty OR omitted accepted | `experience.validate.test.ts` "accepts a career break with empty company/position and a known type", "accepts a career break that omits company/position entirely" — pass |
| (2b) career break needs a known type; unknown → reject | "rejects a career break without a type" (missing + `''`), "rejects an unknown career break type" (`'vacation'`) — pass |
| (2c) regular job unchanged | "still requires company/position keys for a regular job", "accepts a regular job with the model default careerBreakType \"\"" — pass. Pre-existing: base Joi `company`/`position` already accept `''` (throwaway check `Joi.object({company}).validate({company:''})` → no error) — not tightened |
| (3) ATS/classic/DOCX render "Career break — <type>" | ATS: createPDF.ats.test.ts "renders a localized career-break title (en)"/"(vi)"; classic: createPDF.test.ts "renders a career break with the localized label + type…"; DOCX: createDocx.test.ts "renders a career break as \"Nghỉ việc tạm thời — <type>\"…" — all in `Tests: 398 passed`; extracted text above shows `Career break — Caregiving` / `Nghỉ việc tạm thời — Chăm sóc người thân` / classic `NGHỈ VIỆC TẠM THỜI` + `Chăm sóc người thân` |
| (4) swagger documents fields | `swagger.config.ts` diff (`isCareerBreak`, `careerBreakType` enum from model const) |
| (5) tests + build green, lint delta 0 | `Tests: 398 passed, 398 total`; build `error TS` count 0; `lint 276` = 276 |
| comments per code-comments.md | 2 production comments added, both WHY, `//` 1-sentence: `experience.model.ts` "// LinkedIn's career-break types; labels live in locales `cv.careerBreakTypes.*`"; `experience.validate.ts` "// A career break has no employer: company/position become optional, a known type is required instead." Test file JSDoc header: no issue ref (removed in round 2). No existing comment changed |

## pdf-export-standard.md (all 10 rules)
| Rule | Status |
|---|---|
| 1 no letter-spacing | Diff adds no CSS. ATS: only `letter-spacing: normal` (createPDF.ats.ts:342), extracted ATS text has no spaced letters. Classic: `grep -c letter-spacing src/services/createPDF.ts` = 5 both on `git stash`ed staging and with diff (pre-existing, classic template; extracted `J A N E   D O E` / heading spacing is pre-existing). The new career-break title in classic extracts unspaced (`NGHỈ VIỆC TẠM THỜI`) |
| 2 fonts | not touched |
| 3 labels follow lang | ATS: `t(..., lang)` — extraction proves vi/en differ correctly. Classic + DOCX: pre-existing vi-hardcoded headings ("Kinh nghiệm làm việc" etc.); new label uses `t(..., 'vi')` to match the rest of those documents (not mixed-language). Making classic/DOCX honor `?lang=` is out of scope → Noticed |
| 4 dates MM/YYYY | formatters not touched; extraction shows `09/2020 – 12/2021`, `09/2021` (September padded) |
| 5 per-item lists render | skills untouched; extraction shows `Công nghệ: TypeScript` / `Stack: TypeScript` / classic `TypeScript` |
| 6 sanitize free text | description still goes through `sanitizeDescription` (ATS) / existing paths; new title text is from our locale files only (no user input), `careerBreakType` is enum-validated at Joi + Mongoose |
| 7 no DOB/gender/marital/photo | not touched |
| 8 ATS single column | no layout change; title still `<p class="entry-title">` |
| 9 metadata | not touched |
| 10 no PII on disk | not touched; extraction ran in memory (`renderAtsPdfBuffer`/`renderPdfBuffer`) |

## Noticed, not done
- Classic PDF + DOCX ignore `?lang=` (pre-existing vi-hardcoded templates; rule 3 gap predates this node).
- Classic template letter-spacing on name/section headings (pre-existing).
- LinkedIn ZIP / PDF CV importers don't detect career breaks.
- Pre-existing unrelated `git stash@{0}` ("issues-ls done-dev reclassification") left untouched; my temporary `git stash`/`pop` for the letter-spacing baseline was popped immediately.

## Seal gate
none — nothing committed, pushed, or sent externally.
