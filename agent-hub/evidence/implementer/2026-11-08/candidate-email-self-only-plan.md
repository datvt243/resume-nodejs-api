# 2026-11-08 - candidate-email-self-only (plan)
- Worker: implementer · Version: 0.1.0
- Node: `candidate-email-self-only` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug grep in active + `dev-loop-archive.md`: 0 hits; no prior active row for #394
- Task: `/todo #394` — "`GET /candidate/:email` should only return the caller's own record"
- Branch: `394-candidate-email-self` (off `staging` @ bc4a3f1, via `gh issue develop`)

## Hub bytes before
97638

## Feature doc: `doctrine/features/candidate-account.md`
Behavior #2 ("200 with the candidate document for that email") contradicts the fix. Operator already answered the open question 2026-11-07: "Change: self only — #394" → Behavior #2 is updated in this diff + Changelog row (see diff note `## Feature doc changed`).

## Acceptance
1. `fnGetInformationByEmail`: record found but `_id` ≠ `req.user._id` → 404 `candidate.userNotFound` (same as unknown email); own email → 200.
2. Tests in `src/__tests__/candidate/candidate.controller.test.ts` via `npx jest src/__tests__/candidate/candidate.controller.test.ts`.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none in touched files.

## Anchors
- `src/candidate/candidate.controller.ts:36-41` (fix)
- `src/types/express.d.ts:11` (`req.user = { _id }` — token carries only the id, so compare ids, not emails)
- only caller: `src/routers/api/v1/candidate.route.ts:372` (behind `verifyToken`)
