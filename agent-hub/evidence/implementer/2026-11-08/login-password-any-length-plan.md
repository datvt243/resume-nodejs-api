# 2026-11-08 - login-password-any-length (plan)
- Worker: implementer · Version: 0.1.0
- Node: `login-password-any-length` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#390` grep active + archive: 0 hits
- Task: `/todo #390` — "Login rejects accounts whose password predates the current password rules"
- Branch: `390-login-rejects-accounts` (via `gh issue develop`, from `staging` @ 27665c8)

## Hub bytes before
96376

## Feature doc: `doctrine/features/auth-register-login.md`
Open question answered by operator 2026-11-07: "Bug: login should only require a non-empty password — #390". Behavior #5 still states the register rules → doc updated to that answer.

## Acceptance
1. Matches Behavior #5 (updated): login password = non-empty string ≤ 128; wrong password stays 401.
2. `npx jest src/__tests__/auth/auth.validate.test.ts` passes; its short-password test fails on the old schema.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/auth/auth.validate.ts:18-21` (`schemaAuthLogin`); only caller `src/auth/auth.controller.ts:60`
- `PASSWORD_MAX_LENGTH` from `src/config/joi.config.ts`
