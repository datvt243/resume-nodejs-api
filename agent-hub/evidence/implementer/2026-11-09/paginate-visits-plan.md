# paginate-visits — plan (pick_next)

- Task: #396 Paginate `GET /candidate/visits` — https://github.com/datvt243/resume-nodejs-api/issues/396
- Branch: `396-paginate-get-candidate` (from `staging` @ 17164b3)
- Node: `paginate-visits` (new, PENDING, appended to `haven/diagrams/dev-loop.prime-mermaid.md`; slug not in `dev-loop-archive.md`, no other row cites #396)

## Hub bytes before: 96902

## Feature doc: agent-hub/doctrine/features/profile-visits.md
Status verified; the open question "paginate?" is answered by the operator (2026-11-07): "Change: paginate — #396". Behavior 2 currently says "all of the caller's visits", so the operator's recorded answer changes it. The diff updates Behavior 2 and adds a `## Changelog` row (step 5b, explicit answer already in the doc).

## Acceptance criteria clarified: "page / limit like other list endpoints (same meta shape), newest first" → concrete:
1. `?page=`/`?limit=` are positive integers; anything missing or invalid falls back to page 1 / limit 20. Limit is capped at 100, the same as `MAX_PAGE_LIMIT` and `/api/me/search` (which pages by default, the precedent for an unbounded list).
2. Sorted `createdAt` desc, `_id` desc as a tiebreak so pages are stable.
3. `meta = listMeta(total, page, limit)`, where `total` = `Visit.countDocuments({ candidateId })`.
4. Verified by `npx jest src/__tests__/candidate/candidate.service.test.ts` (new cases), then `npm test`, `npm run build` and `npm run lint` (≤ 274, none in changed files).

## Anchors
- `src/candidate/candidate.service.ts:121` `handlerGetVisits`
- `src/candidate/candidate.controller.ts:179` `fnGetVisits`
- `src/routers/api/v1/candidate.route.ts:221-246` swagger
- `src/candidate_me/search.ts:50` `parsePositiveInt` (private; moved to `src/services/index.ts` next to `listMeta` so both lists share it)
- `.claude/rules/api.md` `/visits` row (docs in sync)

## Blocked by: none
