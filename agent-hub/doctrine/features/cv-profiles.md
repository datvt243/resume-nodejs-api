# CV profiles (named subsets)

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/cv-profiles-spec.md`
- Source: backfill from code
- Issues: #400, #405
- Anchors: `src/routers/api/v1/profile.route.ts`, `src/candidate_profile/profile/profile.controller.ts`, `src/candidate_profile/profile/profile.service.ts`, `src/candidate_profile/profile/profile.validate.ts`, `src/candidate_me/index.ts`

## Goal
A candidate builds several tailored versions of their CV (e.g. one per
job type), each a named selection of their existing section entries,
without duplicating data.

## Behavior
1. Same CRUD contract as `cv-section-crud` rules 1–6, at `/api/v1/profile`
   (`GET /`, `POST /create`, `PUT /update`, `DELETE /delete/:id`,
   `POST /restore/:id`).
2. Fields: `name` (1–100 chars, required), `educationIds`,
   `experienceIds`, `projectIds`, `certificateIds`, `awardIds`,
   `referenceIds` (arrays of 24-hex ids, default `[]`).
3. `GET /` first creates a default profile named `Tổng hợp` containing
   every current non-deleted entry of the six sections when the caller
   has no non-deleted profile, then lists.
4. A profile is used by `?profile=<id>` on the public profile, the
   public PDF, the owner export (`GET /download-pdf`) and
   `POST /cv/ats-check`: each section is filtered to the ids listed on that profile
   (see `public-profile`). Visit recording only stores the id from the
   body `profile` field for stats, no filtering (see `profile-visits`).

## Acceptance criteria
- `npx jest src/__tests__/candidate_profile/profile.service.test.ts` passes.
- First `GET /profile/` for a candidate with no profile → `data` has exactly one item named `Tổng hợp`.

## Edge cases
- Deleting every profile, then `GET /` → a fresh default profile is created again.
- An id in the arrays that isn't a 24-hex string → 400.

## Out of scope
- Section ordering or per-profile field overrides.

## Open questions
- The listed ids aren't checked for ownership or existence on create/update. Public rendering only reads the owner's own entries, so foreign ids just match nothing. Should they be rejected up front? → **Answer (operator 2026-11-07):** Change: reject unknown/foreign/deleted ids with 400 — #405
- The default `Tổng hợp` profile is a snapshot: entries added later aren't added to it. Intended? → **Answer (operator 2026-11-07):** Intended
- A GET has a write side effect (creates the default profile). Intended? → **Answer (operator 2026-11-07):** Intended
- Owner export (`GET /download-pdf`) and `POST /cv/ats-check` don't accept `?profile=`. Should they? → **Answer (operator 2026-11-07):** Change — #400

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/cv-profiles-spec.md` | - |
| 2026-11-10 | Behavior 4: `?profile=` also on owner export + ATS check | operator answer #400 | owner-export-profile-filter |
