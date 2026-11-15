# 2026-11-15 - job-applications-status-transitions (plan)

- Worker: implementer · Version: 0.1.0
- Node: `job-applications-status-transitions` in `haven/diagrams/dev-loop.prime-mermaid.md` (new row, PENDING, added on branch `410-job-applications-add`; slug not in `dev-loop-archive.md` (grep count 0), no other not-yet-SEALED row cites #410)
- Task (verbatim): "#410 Job applications: add `accepted` status and enforce status transitions" + issue body (rank applied=0/interview=1/offer=2; `accepted` only from `offer`; create at any status; same status OK; forward incl. skips OK; backward → 400 vi+en; open → `rejected` OK; `accepted`/`rejected` final)
- Issue: https://github.com/datvt243/resume-nodejs-api/issues/410 (label `enhancement`)

## Hub bytes before: 97385

## Feature doc: doctrine/features/job-applications.md
Status `verified`. Open question #2 answered by operator 2026-11-07 (revised after research) with exactly the #410 rules. Analyst pass 0 skipped (doc exists, no unanswered question). Behavior #2 lists status `applied|interview|offer|rejected` → this change adds `accepted` + a transition behavior; doc Behavior + Acceptance + Changelog get updated (operator decision already recorded in Open questions).

## Acceptance criteria
1. `accepted` is a valid status (model enum + Joi).
2. Create accepts any status (incl. `accepted`, `rejected`).
3. Update: same status → allowed; forward to higher rank incl. skips (`applied → offer`) → allowed; `offer → accepted` → allowed; `applied|interview → accepted` → 400; `applied|interview|offer → rejected` → allowed; backward (`offer → applied`) → 400; any change from `accepted`/`rejected` → 400. 400 message has vi + en text.
4. Update without `status`, or on a missing/foreign/deleted id → transition check doesn't fire; base update behavior (404/403) unchanged.
5. `npx jest src/__tests__/candidate_profile/application.service.test.ts` passes; `npm test` no new failures; `npm run build` exit 0.
6. `npm run lint` ≤ 274, none new in changed files.
7. Swagger + `.claude/rules/models.md` status list in sync.
8. Comments per `doctrine/standards/code-comments.md`.

## Code anchors
- `src/models/application.model.ts:10` — `APPLICATION_STATUSES`
- `src/candidate_profile/application/application.service.ts` — `handlerUpdate` (add the check beside `checkProfileLink`)
- `src/locales/{vi,en}.ts:105` — `application.*` messages
- `src/config/swagger.config.ts:287` — status enum
- Test: `src/__tests__/candidate_profile/application.service.test.ts`

## Blockers: none
