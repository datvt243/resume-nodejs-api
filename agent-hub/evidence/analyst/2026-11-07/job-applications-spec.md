# analyst — job-applications — 2026-11-07

## Task (verbatim)
document job-applications

## Doc
`agent-hub/doctrine/features/job-applications.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/api/v1/index.ts` (`/application` behind `verifyToken`), `src/routers/api/v1/application.route.ts`
- `src/candidate_profile/application/application.controller.ts`, `application.service.ts`, `application.validate.ts`
- `src/models/application.model.ts` (`APPLICATION_STATUSES`)
- `src/config/joi.config.ts` (`company`, `position`)
- `src/candidate_me/`, `src/routers/index.ts` (grep: no application reference)

## Re-check vs code
Behavior 1–4 match code. Base CRUD controller/service + routes GET/create/update/delete/restore (`application.route.ts`); `company`/`position` `Joi.string().min(0).max(100).trim().required()` — confirmed with Joi that `""` passes; `appliedDate` number required; `status` valid `applied|interview|offer|rejected` required; `note` ≤1000, `jobLink` ≤500 plain string (open Q1); `profileId` 24-hex or null/'' → `checkProfileLink` (absent unchanged, null/'' → null, else non-deleted own profile or 400 `application.profileNotFound`); no transition check on update (open Q2); no public read path. No discrepancy.

## Questions + answers
Operator (2026-11-07): "behavior đúng" (Behavior section confirmed correct).
- `jobLink` isn't validated as a URL. Intended? → **Answer (operator 2026-11-07):** Change: validate http(s) URL when present — #409
- No status-transition rules (e.g. `rejected` → `applied` is allowed). Intended? → **Answer (operator 2026-11-07):** Change: forward only applied → interview → offer; applied/interview → rejected; offer and rejected are final — #410

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/job-applications-spec.md` set in doc + INDEX row; Issues #409, #410. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
