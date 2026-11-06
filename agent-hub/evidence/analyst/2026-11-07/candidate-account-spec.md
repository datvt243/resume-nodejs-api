# analyst — candidate-account — 2026-11-07

## Task (verbatim)
document candidate-account

## Doc
`agent-hub/doctrine/features/candidate-account.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/api/v1/candidate.route.ts`, `src/routers/api/v1/index.ts`
- `src/candidate/candidate.controller.ts`
- `src/candidate/candidate.service.ts`
- `src/candidate/candidate.validate.ts`
- `src/config/joi.config.ts`
- `src/models/candidate.model.ts`
- `src/middlewares/verifyToken.middleware.ts`
- `src/utils/valid.ts`, `src/utils/helper.ts` (`formatReturn`, E11000 → 409)
- `src/__tests__/candidate/candidate.validate.test.ts`

## Re-check vs code
Behavior 1, 2, 5, 6, 7 match code. **Discrepancy in Behavior 3 and 4:**
both Joi schemas require a body `_id` (24-hex ObjectId):
`src/candidate/candidate.validate.ts:11` and `:25` use `_id` from
`src/config/joi.config.ts:33` (`objectIdValidator.objectId().required()`).
The controller validates `{ ...req.body }` (`candidate.controller.ts:44,236-239`)
before forcing `_id` to the token's id (`:59,251`), and `verifyToken` only
injects `candidateId`, not `_id` (`verifyToken.middleware.ts:72`).
So `PATCH { "slug": "x-y-z" }` without `_id` → 400; the doc says PATCH
takes "only isPublic, slug, cvFileName, socialMedia" and lists PUT's
required fields without `_id`. Tests always send `_id`
(`candidate.validate.test.ts:3,7`). Not verified.

## Questions + answers
Operator (2026-11-07): "Behavior đúng" — given against the doc text, which omits the `_id` requirement.
- `GET /candidate/:email` reads anyone's record. Self-only? → **Answer (operator 2026-11-07):** Change: self only — #394
- Account delete keeps Visit docs and doesn't revoke tokens. Intended? → **Answer (operator 2026-11-07):** Bug: delete visits + revoke all sessions — #395
- Unknown/deleted caller id → 400 not 404. Intended? → **Answer (operator 2026-11-07):** Intended
- `marital`/`gender` booleans. Intended? → **Answer (operator 2026-11-07):** Intended
- `GET /candidate/:email` fails open on `$`/blank. 404? → **Answer (operator 2026-11-07):** Bug — #380
- NEW (unanswered): PUT and PATCH `/candidate/update` reject a body without a 24-hex `_id` (400), although the value is then ignored and replaced by the token's id. Add "body must carry a 24-hex `_id` (ignored)" to Behavior 3/4 as-is, or is it a bug to track?

## Result
status: needs_input — Behavior 3/4 misdescribe the request contract (file:line above).
Answers recorded in the doc, Issues #380, #394, #395 set in doc + INDEX; `Status: draft` kept; Changelog row added.

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "Behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.

## Round 2 (2026-11-07)
### Task (verbatim)
`candidate-account.md`: the Behavior gap (PUT/PATCH `/candidate/update` body must contain a 24-hex `_id`, `candidate.validate.ts:11,25`, validated before it is replaced by the token's id) → **Intended: write it into Behavior 3 and 4 as the code does it.** Record the answer on that open question.
### Sources re-read
- `src/candidate/candidate.validate.ts:10-11,24-25` (`_id: _id` in both schemas)
- `src/config/joi.config.ts:33` (`_id = objectIdValidator.objectId().required()`)
### Q + A
- PUT/PATCH require a 24-hex body `_id`, then replaced by token id. Document as-is or bug? → **Answer (operator 2026-11-07):** Intended: write it into Behavior 3 and 4 as the code does it
### Result
status: verified. Behavior 3 + 4 now state the required `_id` (24-hex, else 400; replaced by the token's id). Every open question answered; operator confirmed Behavior. Status + INDEX row → verified; Issues #380, #394, #395; Changelog row added.
### Isolation proof
Separate spawned agent (Agent tool), blank context; got only the dispatch prompt (operator answers). Anchors re-read myself.
