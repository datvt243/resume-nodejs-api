# dedup-visits — plan (pick_next)

- Task: #399 Dedup profile visits: one per visitor per 24h — https://github.com/datvt243/resume-nodejs-api/issues/399
- Branch: `399-dedup-profile-visits` (from `staging` @ 4b09fbb)
- Node: `dedup-visits` (new, PENDING, appended to `haven/diagrams/dev-loop.prime-mermaid.md`; slug not in `dev-loop-archive.md`, no other row cites #399). The row was appended after the code edit, not before (a `NodeBeforeCode` ordering slip in this pass, recorded here and not hidden). The node's content matches the plan below.

## Hub bytes before: 96174

## Feature doc: agent-hub/doctrine/features/profile-visits.md
Status verified. The open question "No dedup… Intended?" was answered by the operator (2026-11-07): "Change: dedup, at most one visit per visitor per candidate per 24h — #399". That answers the issue's "decide whether `profile` is part of the key": the key is visitor + candidate, so `profile` is not part of it. Pass 0 (analyst) was skipped: the doc exists and every question in it is answered.

## Acceptance criteria clarified: "at most one visit per visitor (IP) per candidate per 24h; repeat → 200, nothing stored" → concrete:
1. Before `Visit.create`, `Visit.exists({ candidateId, ip, createdAt: { $gte: now − 24h } })`. A hit returns the same 200 body (`visitRecorded`, `data: null`) and makes no `create` call.
2. No hit → the visit is stored as before.
3. Empty / `'unknown'` IP → no dedup lookup, always stored (otherwise every IP-less visitor would collapse into one).
4. Compound index `{ candidateId: 1, ip: 1, createdAt: -1 }` on `Visit` backs the lookup.
5. Verified by `npx jest src/__tests__/candidate_me` (new cases), then `npm test`, `npm run build`, and `npm run lint` (≤ 274, none in changed files).

## Anchors
- `src/candidate_me/index.ts` `handlerRecordVisit`
- `src/models/visit.model.ts`
- `src/routers/index.ts` swagger for `/api/me/{identifier}/visit`
- `.claude/rules/api.md` visit row

## Blocked by: none
