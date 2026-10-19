# 2026-10-19 — add-experience-career-break (implementer diff)

Worker: implementer · Version 0.1.0
Node: `add-experience-career-break` · status: sealed_pending_verifier
Plan: `evidence/implementer/2026-10-19/add-experience-career-break-plan.md`

## Diff (src/)
- `src/models/experience.model.ts` — `CAREER_BREAK_TYPES` (12 LinkedIn types) exported; fields `isCareerBreak` (Boolean, false), `careerBreakType` (String, enum `['', ...types]`, default '').
- `src/candidate_profile/experience/experience.validate.ts` — `company`/`position` `.when('isCareerBreak', { is: true, then: Joi.string().allow('').optional() })`; `careerBreakType` `.valid('', ...types)` + `.when(is true → invalid('').required())`.
- `src/types/candidate.type.ts` — `ExperienceData.isCareerBreak?`, `careerBreakType?`.
- `src/locales/{en,vi}.ts` — `cv.careerBreak` + `cv.careerBreakTypes.<12 keys>`.
- `src/services/createPDF.ats.ts` (`buildExperienceSection`) — career break title `t('cv.careerBreak', lang) — t('cv.careerBreakTypes.<type>', lang)`; regular entry unchanged.
- `src/services/createDocx.ts`, `src/services/createPDF.ts` (`renderExperience`) — same title, `'vi'` (both templates are vi-hardcoded today).
- `src/config/swagger.config.ts` — Experience schema documents both fields (enum from model const).
- Tests: NEW `src/__tests__/candidate_profile/experience.validate.test.ts` (6 tests); `src/__tests__/services/createPDF.ats.test.ts` +2 (en/vi title).

## Finding during implementation
Base `company`/`position` Joi (`Joi.string().min(0)...required()`, joi.config.ts:56-58) ALREADY accepts `''` for a regular job (checked with a throwaway test: `Joi.object({company}).validate({company:''})` → no error). So "regular job unchanged" = keys still required (cannot be omitted), not "non-empty". First test draft asserted non-empty → failed → corrected the test to the real pre-existing behavior; schema NOT tightened (out of scope, would change existing clients).

## Commands (verbatim output, repo root)
`npm test`:
```
Test Suites: 44 passed, 44 total
Tests:       396 passed, 396 total
```
(+ pre-existing "A worker process has failed to exit gracefully" warning, unrelated.)
`npm run build`: tsc clean, ends with `> resume-nodejs-api@1.13.1 copy` / `cp -R ./src/views ./src/public ./dist/`.
`npx eslint . -f json` total messages: `lint 276` = baseline 276 from `fix-public-profile-deleted-entries` seal (delta 0).
Targeted re-run after removing one blank line in the ATS test: `Tests: 24 passed, 24 total`.

## Noticed, not done
- Classic PDF + DOCX headings are vi-hardcoded (pre-existing) — career break label follows that, not `?lang=`.
- `parseLinkedInExport` / `parseCvPdf` do not detect career breaks (LinkedIn export `Positions.csv` has none) — not in scope.
- Nothing committed/pushed.
