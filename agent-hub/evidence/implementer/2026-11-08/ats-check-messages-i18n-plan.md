# 2026-11-08 - ats-check-messages-i18n (plan)
- Worker: implementer · Version: 0.1.0
- Node: `ats-check-messages-i18n` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#407` grep active + archive: 0 hits
- Task: `/todo #407` — "ATS check success message is hard-coded English" + issue comment (operator 2026-11-07): "localize every check message (vi + en via `req.lang`), not only the success message"
- Branch: `407-ats-check-success` (via `gh issue develop`, from `staging` @ 152a59e)

## Hub bytes before
96348

## Feature doc: `doctrine/features/ats-check.md`
Open question answered by operator 2026-11-07: "Bug: i18n — #407"; scope extension in the issue comment. Behavior #6 names no message language → doc updated.

## Acceptance
1. Behavior #6 (updated): response `message` + every check `message` localized vi/en in `req.lang`; headings still judged in the CV `lang`.
2. `npx jest src/__tests__/services/atsChecks.test.ts` passes; new language tests fail on the old code.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/candidate_me/ats-check.ts:88` (success message), `:68-80` (`checkInput`)
- `src/services/atsChecks.ts` — 10 check functions, 21 message strings (+ the #406 `notApplicable` one, already a key)
- `src/locales/{en,vi}.ts` `atsCheck` namespace (added by #406)
- placeholder idiom: `src/middlewares/errors.middleware.ts:17`
