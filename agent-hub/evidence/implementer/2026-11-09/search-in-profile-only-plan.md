# search-in-profile-only — plan (pick_next)

- Task: #397 Public search should not match entries outside every profile — https://github.com/datvt243/resume-nodejs-api/issues/397
- Branch: `397-public-search-should` (from `staging` @ 01fa125)
- Node: `search-in-profile-only` (new, PENDING, appended to `haven/diagrams/dev-loop.prime-mermaid.md`; slug not in `dev-loop-archive.md`, no other row cites #397)

## Hub bytes before: 96170

## Feature doc: agent-hub/doctrine/features/public-profile.md
Status verified; open question 3 answered by the operator (2026-11-07): "Change: search must only match entries that belong to at least one of the candidate's profiles — #397". Behavior 6 currently says "non-deleted rows only", so the operator's recorded answer changes it. The diff updates Behavior 6 + adds a `## Changelog` row (step 5b, explicit answer already in the doc). Pass 0 analyst skipped: doc exists, no unanswered open question.

## Acceptance criteria clarified: "only match entries in ≥1 non-deleted profile" → concrete:
1. Experience / education hit counts only when a non-deleted (`deletedAt: null`) profile whose `candidateId` equals the entry's `candidateId` lists the entry's `_id` in `experienceIds` / `educationIds`. Pairing on candidateId because profile writes don't ownership-check the ids (`profile.validate.ts`), so a profile listing another candidate's entry must not count.
2. General information has no profile id list and is shown in every `?profile=` view (Behavior 4), so a general-information hit counts only when the candidate has ≥1 non-deleted profile.
3. A candidate whose only hits are outside every profile is not returned and not counted in `meta.total`.
4. Verified by `npx jest src/__tests__/candidate_me/search.test.ts` (new cases), then `npm test`, `npm run build`, `npm run lint` (≤ 274, none in changed files).

## Anchors
- `src/candidate_me/search.ts:54` `handlerSearchPublicProfiles`
- `src/models/profile.model.ts` (`experienceIds`, `educationIds`, `candidateId`, `deletedAt`)
- `src/__tests__/candidate_me/search.test.ts` (model mock gains `Profile.find`, Experience/Education `find`)
- `.claude/rules/api.md:77` `/api/me/search` row (docs in sync)

## Blocked by: none
