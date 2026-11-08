# 2026-11-08 - ats-classic-not-applicable (plan)
- Worker: implementer · Version: 0.1.0
- Node: `ats-classic-not-applicable` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#406` grep active + archive: 0 hits
- Task: `/todo #406` — "ATS check with `template=classic`: `metadata` always fails, `standard-headings` checks nothing" (+ comment: frontend datvt243/resume-vuejs-website#461 needs a "not applicable" state matching the response shape chosen here)
- Branch: `406-ats-check-with` (via `gh issue develop`, from `staging` @ c98dec6)

## Hub bytes before
96346

## Feature doc: `doctrine/features/ats-check.md`
Open question answered by operator 2026-11-07: "Bug: report both as not applicable for classic, excluded from score — #406". Behavior #4 states the score over all checks → doc updated (Behavior #4 + new #4b with the chosen shape).

## Response shape (implementer's choice, issue left it open)
Additive optional field `applicable: false` on the two checks; `passed: true` so a frontend reading only `passed` doesn't show a red failure; `message` = localized "not applicable" text. All other checks: no `applicable` field (unchanged shape). Recorded in swagger + `api.md` for the frontend issue.

## Acceptance
1. Behavior #4/#4b: classic → `standard-headings` + `metadata` `applicable: false`, excluded from `score`; `ats` unchanged; `checks` still has 10 items.
2. `npx jest src/__tests__/services/atsChecks.test.ts src/__tests__/candidate_me/index.test.ts` passes; the new classic tests fail on the old code.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/services/atsChecks.ts` (`AtsCheckResult`, `AtsCheckInput`, `checkStandardHeadings`, `checkMetadata`, `scoreChecks`)
- `src/candidate_me/ats-check.ts:49-80` (classic branch + `checkInput`)
- `src/routers/api/v1/cv.route.ts:55-75` (swagger), `.claude/rules/api.md` ats-check row
- PDF export standard (`agent-hub/CLAUDE.md` project extension): not triggered — no `createPDF*.ts`/`createDocx.ts` change; the classic render is untouched
