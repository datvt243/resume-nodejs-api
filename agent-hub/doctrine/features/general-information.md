# General information

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/general-information-spec.md`
- Source: backfill from code
- Issues: #408
- Anchors: `src/routers/api/v1/generalInformation.route.ts`, `src/candidate_profile/general_information/generalInformation.controller.ts`, `src/candidate_profile/general_information/generalInformation.service.ts`, `src/candidate_profile/general_information/generalInformation.validate.ts`, `src/models/generalInformation.model.ts`

## Goal
One record per candidate holding CV-wide data: desired position, career
summary and goal, skills, languages, salary, open-to-work.

## Behavior
1. All routes require a valid access token; `candidateId` comes from the token.
2. `GET /api/v1/general-information/` → 200 with the caller's record as
   an object (not a list), or `{}` when none exists.
3. `POST /create` (`schemaGeneralInformation`) → 201 with the record.
   Invalid → 400. The caller already has a non-deleted record → 409
   `generalInformation.alreadyExists`.
4. `PUT /update` validates with the full schema; `PATCH /update`
   validates with the patch schema (partial). Body must contain `_id`;
   unknown/soft-deleted `_id` → 404; another candidate's → 403;
   success → 200 with the updated record.
5. `mainSkills` holds at most 5 items; `professionalSkills[]` items need
   `name` and `exp`.
6. `career` and `careerGoal` are localized `{ vi, en }`.
7. No delete or restore route; the record is removed only by account delete.

## Acceptance criteria
- `npx jest src/__tests__/candidate_profile/generalInformation.controller.test.ts src/__tests__/candidate_profile/generalInformation.validate.test.ts` passes.
- Second `POST /general-information/create` for the same candidate → HTTP 409.
- `GET /general-information/` for a candidate with no record → HTTP 200, `data: {}`.

## Edge cases
- `mainSkills` with 6 items → 400.

## Out of scope
- Multiple general-information records per candidate.

## Open questions
- GET returns an object rather than the `data: []` + `meta` list shape every other list uses. That fits one record per candidate, but should `API-STANDARD.md` record it as an exception? → **Answer (operator 2026-11-07):** Intended
- Update needs the record's `_id` from the client even though there is only one per candidate. Should it be keyed by candidate instead? → **Answer (operator 2026-11-07):** Intended (same as other sections)
- The one-per-candidate rule is enforced in code (read then create → 409) AND by the model's unique index on `candidateId` (`src/models/generalInformation.model.ts:14`), but it isn't confirmed that the index exists in the prod DB. OK? → **Answer (operator 2026-11-07):** Intended: the unique index is in the model; confirming it exists in prod (and that there are no duplicates) is tracked in #408.

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-07 | Open question 3 rewritten to match code (unique index exists in model); operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/general-information-spec.md` | - |
