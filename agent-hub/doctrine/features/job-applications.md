# Job application tracker

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/job-applications-spec.md`
- Source: backfill from code
- Issues: #409, #410
- Anchors: `src/routers/api/v1/application.route.ts`, `src/candidate_profile/application/application.controller.ts`, `src/candidate_profile/application/application.service.ts`, `src/candidate_profile/application/application.validate.ts`, `src/models/application.model.ts`

## Goal
A candidate tracks the jobs they applied to, their status, and which CV
profile they sent.

## Behavior
1. Same CRUD contract as `cv-section-crud` rules 1–6, at
   `/api/v1/application`.
2. Fields: `company`, `position` (required, ≤ 100, `min(0)` so `""` passes), `appliedDate` (number, required),
   `status` (one of `applied`, `interview`, `offer`, `rejected`,
   required), `note` (≤ 1000), `jobLink` (≤ 500), `profileId`.
3. `profileId`: absent → left unchanged; `null` or `''` → stored as
   `null` (unlinked); a 24-hex id must be a non-deleted profile of the
   caller, else 400 `application.profileNotFound`.
4. Applications are never shown on the public profile.

## Acceptance criteria
- `npx jest src/__tests__/candidate_profile/application.service.test.ts` passes.
- Create with `status: "hired"` → HTTP 400.
- Create with another candidate's profile id → HTTP 400.

## Edge cases
- Linked profile later soft-deleted → application keeps the id; no cascade.

## Out of scope
- Reminders, status history.

## Open questions
- `jobLink` isn't validated as a URL. Intended? → **Answer (operator 2026-11-07):** Change: validate http(s) URL when present — #409
- No status-transition rules (e.g. `rejected` → `applied` is allowed). Intended? → **Answer (operator 2026-11-07):** Change: forward only applied → interview → offer; applied/interview → rejected; offer and rejected are final — #410

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/job-applications-spec.md` | - |
