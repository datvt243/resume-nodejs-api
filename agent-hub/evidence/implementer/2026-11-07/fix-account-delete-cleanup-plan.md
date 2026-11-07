# 2026-11-07 - fix-account-delete-cleanup (plan)

- Worker: implementer · Version: 0.1.0
- Node: `fix-account-delete-cleanup` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #395` — "Account delete should remove visits and revoke all sessions"

## Hub bytes before: 93048

## Feature doc: doctrine/features/candidate-account.md

Behavior #6 gets visits + session revocation added, per the operator's
recorded answer (Open questions: "Bug: delete visits + revoke all
sessions — #395").

## Anchors
- `src/candidate/candidate.service.ts` `handlerDelete`
- `src/utils/sessionRevocation.ts` `invalidateAllSessions` (reused, same as `authLogoutAll`)
- `src/__tests__/candidate/candidate.service.test.ts`

## Acceptance
Copied onto the node: jest file with new assertions, `npm test`, `npm run build`, lint ≤ 274 with none in changed files, Behavior #6.
