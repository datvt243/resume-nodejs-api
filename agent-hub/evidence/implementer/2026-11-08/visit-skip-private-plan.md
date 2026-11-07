# 2026-11-08 - visit-skip-private (plan)
- Worker: implementer · Version: 0.1.0
- Node: `visit-skip-private` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#398` grep active + archive: 0 hits
- Task: `/todo #398` — "Don't record visits for private profiles"
- Branch: `398-dont-record-visits` (via `gh issue develop`, from `staging` @ e3725c3)

## Hub bytes before
96366

## Feature doc: `doctrine/features/profile-visits.md`
Open question answered by operator 2026-11-07: "Change: don't record, 404 like the profile — #398". Behavior #1 says only "unknown → 404" → doc updated to that answer.

## Acceptance
1. Matches Behavior #1 (updated): private candidate → 404 with the public-profile message, no `Visit.create`.
2. `npx jest src/__tests__/candidate_me/index.test.ts` passes; the private-profile test fails on the old handler.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/candidate_me/index.ts:262-284` (`handlerRecordVisit`), `:20` (`profileNotFound`), `:77` (same `isPublic === false` check in `fnGetAboutMe`)
- `src/routers/index.ts:125-165` (swagger), `.claude/rules/api.md` visit row
