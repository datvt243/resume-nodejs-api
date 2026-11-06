# analyst — cv-profiles — 2026-11-07

## Task (verbatim)
document cv-profiles

## Doc
`agent-hub/doctrine/features/cv-profiles.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/api/v1/profile.route.ts`
- `src/candidate_profile/profile/profile.controller.ts`, `profile.service.ts`, `profile.validate.ts`
- `src/candidate_profile/BaseController.ts`, `src/services/index.ts` (shared CRUD)
- `src/candidate_me/index.ts` (`?profile=` filter, `resolveVisitProfileId`)

## Re-check vs code
Behavior 1–4 match code. Routes `GET /`, `POST /create`, `PUT /update`, `DELETE /delete/:id`, `POST /restore/:id` on base controller/service (`profile.route.ts`); schema `name` 1–100 trimmed required, six `objectIdArray` 24-hex default `[]` (`profile.validate.ts`); `GET /` runs `ensureDefaultProfile` (count non-deleted = 0 → create `Tổng hợp` with all non-deleted ids) before `baseGetAll`; public filter `candidate_me/index.ts:118-175`; visit stores id only (`:289-295`). No ownership/existence check on listed ids (open question 1). No discrepancy.

## Questions + answers
Operator (2026-11-07): "behavior đúng" (Behavior section confirmed correct).
- The listed ids aren't checked for ownership or existence on create/update. Public rendering only reads the owner's own entries, so foreign ids just match nothing. Should they be rejected up front? → **Answer (operator 2026-11-07):** Change: reject unknown/foreign/deleted ids with 400 — #405
- The default `Tổng hợp` profile is a snapshot: entries added later aren't added to it. Intended? → **Answer (operator 2026-11-07):** Intended
- A GET has a write side effect (creates the default profile). Intended? → **Answer (operator 2026-11-07):** Intended
- Owner export (`GET /download-pdf`) and `POST /cv/ats-check` don't accept `?profile=`. Should they? → **Answer (operator 2026-11-07):** Change — #400

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/cv-profiles-spec.md` set in doc + INDEX row; Issues #400, #405. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
