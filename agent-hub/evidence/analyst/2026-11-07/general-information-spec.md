# analyst — general-information — 2026-11-07

## Task (verbatim)
document general-information

## Doc
`agent-hub/doctrine/features/general-information.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten; left `Status: draft`, unchanged)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/api/v1/index.ts`, `src/routers/api/v1/generalInformation.route.ts`
- `src/candidate_profile/general_information/generalInformation.controller.ts`, `generalInformation.service.ts`, `generalInformation.validate.ts`
- `src/models/generalInformation.model.ts`
- `src/services/index.ts` (`baseFindDocument` excludes `deletedAt != null`), `src/utils/helper.ts` (`formatReturn` default 400; E11000 handling)
- `git log -S"unique: true" -- src/models/generalInformation.model.ts`

## Re-check vs code
Behavior 1–7 match code (GET object or `{}`; create 201 / 400 / 409 `generalInformation.alreadyExists`; PUT full / PATCH patch schema, `_id` required; `mainSkills` max 5; `professionalSkills` name+exp required; `career`/`careerGoal` localized; only GET/POST/PUT/PATCH routes).

Discrepancy in open question 3's premise (not a Behavior item):
`src/models/generalInformation.model.ts:14` already declares
`candidateId: { ..., unique: true }` (added in 4eb104a, "perf: add MongoDB
indexes", #23); no `autoIndex: false` anywhere in `src/`, so Mongoose builds
it by default. The question "checked in code only, a unique index wanted?"
is false as written; the operator's answer "Bug: unique index — #408"
rests on it.

## Questions + answers
Operator (2026-11-07): "behavior đúng" (Behavior section confirmed correct).
- GET returns an object rather than the list shape … → **Answer (operator 2026-11-07):** Intended
- Update needs the record's `_id` … → **Answer (operator 2026-11-07):** Intended (same as other sections)
- The one-per-candidate rule is checked in code only … unique index wanted? → operator answer "Bug: unique index — #408" NOT recorded: premise contradicted by `src/models/generalInformation.model.ts:14`.
  Needs operator: is #408 (a) moot/close it, (b) "confirm the index actually exists in prod Mongo (autoIndex can fail silently on pre-existing duplicates)", or (c) something else?

## Result
status: needs_input — doc not verified, not edited; INDEX row stays `draft`.

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.

## Round 2 (operator 2026-11-07)
Operator: rewrite open question 3 to match the code; Behavior is right.
- GET returns an object rather than the list shape … → **Answer (operator 2026-11-07):** Intended
- Update needs the record's `_id` … → **Answer (operator 2026-11-07):** Intended (same as other sections)
- (rewritten) The one-per-candidate rule is enforced in code (read then create → 409) AND by the model's unique index on `candidateId` (`src/models/generalInformation.model.ts:14`), but it isn't confirmed that the index exists in the prod DB. OK? → **Answer (operator 2026-11-07):** Intended: the unique index is in the model; confirming it exists in prod (and that there are no duplicates) is tracked in #408.

Result: status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/general-information-spec.md` set in doc + INDEX row; Issues #408. Behavior unchanged. Round-1 `needs_input` superseded.
