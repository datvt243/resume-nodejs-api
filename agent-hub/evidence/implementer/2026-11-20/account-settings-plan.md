# 2026-11-20 - account-settings (plan)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `account-settings` (new PENDING row, added on this branch) · Task: `/todo #412` (label `enhancement`) · Branch: `feature/412-change-password-email` (cut from `staging` @ f46e58b)

## Hub bytes before: 99105

## Feature doc: doctrine/features/account-settings.md
Analyst pass 0 (`evidence/analyst/2026-11-20/account-settings-spec.md`, `-spec-r2.md`); operator answered Q1–Q10 "all defaults" in the main session. Open questions: none unanswered. Acceptance criteria = the doc's `## Acceptance criteria` (copied as the node's criteria by pointer).

## Slug check
`account-settings` not in `dev-loop-archive.md` (grep count 0); no other active row cites #412.

## Acceptance criteria self-check (step 5)
Clear: each criterion maps to `npx jest <file>` / `npm test` / `npm run build` / `npm run lint`. The two "Observable" criteria (old-password login 401, pre-change refresh rejected, 11th request 429) are covered by: service test (updateOne + invalidateAllSessions + fresh pair), existing `refreshToken.test.ts`/session-revocation semantics, and route-wiring test (`authLimiter` first handler on both routes, same pattern as #387). No rewrite needed.

## Anchors (grep-confirmed)
- `src/routers/api/v1/auth.route.ts` — new routes, `authLimiter` → `verifyToken` on change-*, confirm plain GET.
- `src/auth/auth.controller.ts`, `auth.service.ts`, `auth.validate.ts` — 3 handlers each layer.
- `src/utils/emailChange.ts` (new) — token util mirroring `utils/emailVerification.ts`, payload `{ candidateId, newEmail }`.
- `src/services/mail.ts` — 2 new kinds (`confirmEmailChange`, `emailChanged`) + optional body params.
- `src/locales/{en,vi}.ts`, `.claude/rules/api.md`.
- Trap: `verifyToken` writes `req.body.candidateId` → schemas include `candidateId` (house pattern from `joi.config`), else every call would fail the unknown-key rule.
