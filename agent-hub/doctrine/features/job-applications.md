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
   required), `note` (≤ 1000), `jobLink` (≤ 500; `''` or an `http`/`https` URL, else 400 with `details[].field = "jobLink"`), `profileId`.
3. `profileId`: absent → left unchanged; `null` or `''` → stored as
   `null` (unlinked); a 24-hex id must be a non-deleted profile of the
   caller, else 400 `application.profileNotFound`.
4. Applications are never shown on the public profile.

## Acceptance criteria
- `npx jest src/__tests__/candidate_profile/application.service.test.ts` passes.
- Create with `status: "hired"` → HTTP 400.
- Create with another candidate's profile id → HTTP 400.
- Create with `jobLink: "ftp://…"` → HTTP 400, `details` has field `jobLink`.

## Edge cases
- Linked profile later soft-deleted → application keeps the id; no cascade.

## Out of scope
- Reminders, status history.

## Open questions
- `jobLink` isn't validated as a URL. Intended? → **Answer (operator 2026-11-07):** Change: validate http(s) URL when present — #409
- No status-transition rules (e.g. `rejected` → `applied` is allowed). Intended? → **Answer (operator 2026-11-07, revised after research):** Change — add status `accepted`; create at any status; same status re-saved OK; forward to a higher rank allowed incl. skips (`applied → interview → offer → accepted`, `accepted` only from `offer`); backward → 400; `applied`/`interview`/`offer` → `rejected` allowed (rejected = process ended without a hire, incl. declined offer/withdrawn); `accepted` and `rejected` final — #410. Frontend follow-up: datvt243/resume-vuejs-website#423.

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/job-applications-spec.md` | - |
| 2026-11-07 | Q2 answer revised: #410 rules after research | operator revised after research, see `evidence/analyst/2026-11-07/job-applications-spec.md` (Round 2) | - |
| 2026-11-14 | Behavior #2: `jobLink` must be `''` or an http(s) URL; acceptance criterion added | operator answer to open question 1 (2026-11-07), #409 | `job-applications-validate` |
