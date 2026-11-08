# 2026-11-08 - candidate-email-self-only (diff)
- Worker: implementer · Version: 0.1.0
- Node: `candidate-email-self-only` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #394` — "`GET /candidate/:email` should only return the caller's own record"
- Plan: `evidence/implementer/2026-11-08/candidate-email-self-only-plan.md`

## Hub bytes before
97638

## Feature doc
`doctrine/features/candidate-account.md`

## Feature doc changed: Behavior #2 "200 with the candidate document for that email; unknown email → 404" → "200 with the caller's own document when `:email` is the caller's email; unknown or another candidate's email → the same 404 (self only, #394)"; Changelog row 2026-11-08 added — operator: "Change: self only — #394" (Open questions, answered 2026-11-07)

## Diff
| file | why |
|---|---|
| `src/candidate/candidate.controller.ts` | `fnGetInformationByEmail`: 404 unless `String(doc._id) === req.user?._id` (token carries only `_id`, `src/types/express.d.ts:11`) — same `candidate.userNotFound` 404 as unknown email, so existence isn't confirmed |
| `src/__tests__/candidate/candidate.controller.test.ts` | new `describe('GET /:email is self only (issue #394)')`: other id → 404, own id → 200 |
| `src/routers/api/v1/candidate.route.ts` | Swagger summary → "Get own candidate profile by email (another candidate's email → 404)" |
| `.claude/rules/api.md` | endpoint row for `GET /:email` → self only |
| `agent-hub/doctrine/features/candidate-account.md` | Behavior #2 + Changelog (see above) |

## Command
- `npx jest src/__tests__/candidate/candidate.controller.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build)
- `npm run lint`; touched files: `npx eslint src/candidate/candidate.controller.ts src/__tests__/candidate/candidate.controller.test.ts src/routers/api/v1/candidate.route.ts` with and without the diff (`git stash`)

## Output
```
npx jest src/__tests__/candidate/candidate.controller.test.ts
  GET /:email is self only (issue #394)
Tests:       14 passed, 14 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 59 passed, 61 total
Tests:       5 failed, 588 passed, 593 total

npm run build
> resume-nodejs-api@2.7.1 copy
> cp -R ./src/public ./dist/

npm run lint
✖ 274 problems (274 errors, 0 warnings)

touched files, with diff:    ✖ 7 problems (7 errors, 0 warnings)   (lines 45, 60, 113, 237, 239, 252 — none on the changed line 40)
touched files, without diff: ✖ 7 problems (7 errors, 0 warnings)
```
Pre-existing failures: the same 5 fail on `380-get-candidate-email` merged with `staging` before this diff (session 2026-11-08); on a clean `origin/staging` worktree with no `.env`, `atsPdfIntegration` (4, real Puppeteer, local Chrome) fails and `tokenExpiry` passes — `tokenExpiry` "falls back to a 1h access token when TOKEN_EXP_IN is unset" reads the local `.env`. Neither file is touched by this diff. CI (`build (20.x)`/`build (22.x)`) is the clean-env check at ship time.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) other candidate's email → 404, own → 200; matches Behavior #2 (updated) | controller diff; tests "answers 404 for another candidate's email" / "answers 200 for the caller's own email" in `Tests: 14 passed, 14 total` |
| (2) controller test file passes | `Tests:       14 passed, 14 total` |
| (3) `npm test` no new failures vs staging | `Tests: 5 failed, 588 passed, 593 total` — the 5 are the pre-existing env failures above (+2 passed = the new tests) |
| (3) build clean | `npm run build` ends at `cp -R ./src/public ./dist/`, no `tsc` error |
| (3) lint ≤ 274, none new in touched files | `✖ 274 problems`; touched files 7 → 7 |
| comments per code-comments.md | one 1-line why comment citing #394 |

## Supersedes: none
`grep '#394' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.

## Still open: none

## Noticed, not done
- `tokenExpiry.test.ts` depends on the local `.env` (fails when `TOKEN_EXP_IN` is set locally) — test isolation issue, out of scope.

## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (operator: "ok resolve conflict rồi merge, tiếp #394", following the original `/todo … xong tự chạy /ship --merge`).
