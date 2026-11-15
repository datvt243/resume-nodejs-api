# 2026-11-14 - job-applications-validate (plan)

- Worker: implementer · Version: 0.1.0
- Node: `job-applications-validate` in `haven/diagrams/dev-loop.prime-mermaid.md` (new row, PENDING, added on branch `409-job-applications-validate`; slug not in `dev-loop-archive.md`, no other not-yet-SEALED row cites #409)
- Task (verbatim): "#409 Job applications: validate `jobLink` as an http(s) URL — Optional, but when present it must be an http/https URL, else 400 with the field in `details`. Issue https://github.com/datvt243/resume-nodejs-api/issues/409, branch 409-job-applications-validate. Spec: agent-hub/doctrine/features/job-applications.md"
- Issue: https://github.com/datvt243/resume-nodejs-api/issues/409 (label `enhancement`)

## Hub bytes before: 96759

## Feature doc: doctrine/features/job-applications.md
Status `verified`. Open question #1 answered by operator 2026-11-07: "Change: validate http(s) URL when present — #409". Analyst pass 0 skipped (doc exists, no unanswered question). Doc's `## Behavior` #2 says `jobLink (≤ 500)` — this change adds the operator-decided http(s) rule, so Behavior #2 gets updated + a `## Changelog` row (operator decision already recorded in the doc's Open questions).

## Acceptance criteria
1. `jobLink` absent or `""` → accepted (unchanged).
2. `jobLink` `http://…` / `https://…` → accepted.
3. `jobLink` any other value (`ftp://…`, `javascript:…`, bare text) → schema error.
4. `POST /application/create` (`fnCreate`) with a bad `jobLink` → HTTP 400, `error.details` contains `{ field: "jobLink" }`.
5. `npx jest src/__tests__/candidate_profile/application.service.test.ts` passes; `npm test` passes; `npm run build` (typecheck) passes.
6. `npm run lint` count ≤ 274 baseline, no error in changed files.
7. Comments per `doctrine/standards/code-comments.md`.

## Code anchors
- `src/candidate_profile/application/application.validate.ts:19` — `jobLink: Joi.string().allow('').max(500).trim()`
- Precedent: `src/candidate_profile/awards/award.validate.ts:14` — `.uri({ scheme: ['http', 'https'] }).allow('')`
- Test: `src/__tests__/candidate_profile/application.service.test.ts`

## Blockers: none
