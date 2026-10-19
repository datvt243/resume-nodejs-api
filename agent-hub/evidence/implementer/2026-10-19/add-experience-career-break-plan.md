# 2026-10-19 — add-experience-career-break (implementer plan)

Worker: implementer · Version 0.1.0
Node: `add-experience-career-break` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row, PENDING — appended this pass)
Task (verbatim): `/todo "phần experience, bổ sung career break như linkendin"` → issue #267 (created), branch `267-phn-experience-b-sung` (from fresh `staging`)

## Hub bytes before: 238382

## pick_next output
- node: `add-experience-career-break`
- diagram: `dev-loop.prime-mermaid.md`
- current_state: PENDING
- acceptance: see diagram row (1)-(5)
- files: `src/models/experience.model.ts`, `src/candidate_profile/experience/experience.validate.ts`, `src/types/candidate.type.ts` (`ExperienceData`), `src/services/createPDF.ts:358` (`renderExperience`), `src/services/createPDF.ats.ts:149` (`buildExperienceSection`), `src/services/createDocx.ts:105`, `src/locales/{vi,en}.ts` (`cv.*`), `src/config/swagger.config.ts:169`, tests under `src/__tests__/`
- blocked_by: null (no `<<FILL>>` in doctrine/MEMORY.md)

## Design (smallest)
- Career break = an Experience doc flagged `isCareerBreak`, not a new collection → reuses CRUD/bulk/profile-id/soft-delete/public aggregation for free.
- Type list = LinkedIn's: careerTransition, caregiving, fullTimeParenting, gapYear, healthAndWellbeing, layoff, personalGoal, professionalDevelopment, relocation, retirement, travel, voluntaryWork. Exported const `CAREER_BREAK_TYPES` from the model (same pattern as `APPLICATION_STATUSES`).
- Labels via `t('cv.careerBreakTypes.<type>', lang)`; classic PDF + DOCX are vi-hardcoded today, so they use `'vi'`.

## Precedent
- `APPLICATION_STATUSES` (application.model.ts:10) + `.valid(...APPLICATION_STATUSES)` (application.validate.ts:16).
