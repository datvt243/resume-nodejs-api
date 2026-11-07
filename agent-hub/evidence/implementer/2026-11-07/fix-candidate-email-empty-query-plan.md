# 2026-11-07 - fix-candidate-email-empty-query (plan)
- Worker: implementer · Version: 0.1.0
- Node: `fix-candidate-email-empty-query` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug grep in `dev-loop-archive.md`: 0 hits; no prior active row for #380
- Task: `/todo #380` — "GET /candidate/:email returns another candidate's record when the email contains `$` or is blank"
- Branch: `380-get-candidate-email` (off `staging` @ 0141d71, via `gh issue develop`)

## Hub bytes before
93030

## Feature doc: `doctrine/features/candidate-account.md`
Behavior #2 (unknown email → 404) is the spec. Open question on #380 answered by operator 2026-11-07: "Bug — #380". No contradiction, doc unchanged.

## Acceptance
1. `handlerGetInformationByEmail` returns `null` without calling `findOne` when `safeQuery` drops the email (`$`-containing or blank) → controller `fnGetInformationByEmail` already maps `null` → `NotFoundError` (404).
2. Regression test in `src/__tests__/candidate/candidate.service.test.ts`.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/candidate/candidate.service.ts:63` (fix)
- `src/candidate/candidate.controller.ts:36-41` (null → 404, unchanged)
- `src/candidate_me/index.ts:104` (existing `'email' in safeEmailQuery` guard — same idiom reused)
- only caller: `src/routers/api/v1/candidate.route.ts:372`
