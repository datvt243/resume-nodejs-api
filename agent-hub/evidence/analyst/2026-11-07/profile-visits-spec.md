# analyst — profile-visits — 2026-11-07

## Task (verbatim)
document profile-visits

## Doc
`agent-hub/doctrine/features/profile-visits.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/index.ts`, `src/routers/api/v1/candidate.route.ts`
- `src/candidate_me/index.ts`
- `src/candidate/candidate.controller.ts`
- `src/candidate/candidate.service.ts`
- `src/candidate/visitStats.service.ts`
- `src/models/visit.model.ts`
- `src/__tests__/candidate_me/index.test.ts` (X-Forwarded-For cases)

## Re-check vs code
Behavior 2–5 match code (`candidate.service.ts:118-127`, `visitStats.service.ts:145-169,195-252`). Behavior 1 referrer/profile/geo/404 parts match (`candidate_me/index.ts:242-318`); no `isPublic` check confirmed.
**Discrepancy in Behavior 1:** doc says "IP = first valid `X-Forwarded-For`
entry, else socket IP". Code takes only the leftmost entry and uses it
if it is an IP, otherwise falls back to `req.ip` / socket address —
it does not scan for a later valid entry: `src/candidate_me/index.ts:274-279`.
Test pins it: `'<script>, 1.2.3.4'` → `req.ip`
(`src/__tests__/candidate_me/index.test.ts:125-127`). Proposed wording:
"IP = the leftmost `X-Forwarded-For` entry if it is a valid IP, else
`req.ip` / socket address". Not verified.

## Questions + answers
Operator (2026-11-07): "Behavior đúng" — given against the doc text, which misstates the XFF rule.
- Visits recorded for private profiles. Intended? → **Answer (operator 2026-11-07):** Change: don't record, 404 like the profile — #398
- No dedup/throttle per visitor. Intended? → **Answer (operator 2026-11-07):** Change: dedup, at most one visit per visitor per candidate per 24h — #399
- Candidate sees raw visitor IPs. Intended? → **Answer (operator 2026-11-07):** Intended (owner's own analytics)
- `GET /candidate/visits` no pagination. Page it? → **Answer (operator 2026-11-07):** Change: paginate — #396
- Account delete doesn't remove visits. → **Answer (operator 2026-11-07):** covered by #395
- NEW (unanswered): confirm Behavior 1 is corrected to the code's rule (leftmost XFF entry only if valid, else `req.ip`), as worded above.

## Result
status: needs_input — Behavior 1 misdescribes the IP rule (file:line above).
Answers recorded in the doc, Issues #395, #396, #398, #399 set in doc + INDEX; `Status: draft` kept; Changelog row added.

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "Behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.

## Round 2 (2026-11-07)
### Task (verbatim)
`profile-visits.md`: Behavior 1 IP wording → **fix the wording to match the code**: IP = the leftmost `X-Forwarded-For` entry if it is a valid IP, else `req.ip` / socket address (`src/candidate_me/index.ts:274-279`). Record the answer on that open question.
### Sources re-read
- `src/candidate_me/index.ts:274-279` (`visitorIp`: leftmost XFF entry, `isIP` check, else `req.ip || req.socket.remoteAddress`)
### Q + A
- Correct Behavior 1 to the code's XFF rule? → **Answer (operator 2026-11-07):** fix the wording to match the code
### Result
status: verified. Behavior 1 now reads "IP = the leftmost `X-Forwarded-For` entry if it is a valid IP, else `req.ip` / socket address". Every open question answered; operator confirmed Behavior. Status + INDEX row → verified; Issues #395, #396, #398, #399; Changelog row added.
### Isolation proof
Separate spawned agent (Agent tool), blank context; got only the dispatch prompt (operator answers). Anchor re-read myself.
