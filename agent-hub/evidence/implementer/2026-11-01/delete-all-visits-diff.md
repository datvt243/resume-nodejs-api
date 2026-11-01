# 2026-11-01 - delete-all-visits
- Worker: implementer · Version: 0.1.0
- Node: `delete-all-visits` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: "về lượt truy cập, thêm tính năng xóa toàn bộ truy cập, hard-delete" (GitHub #345, branch `345-v-l-t`)
- Status: sealed_pending_verifier

## Hub bytes before
83519

## Diff
| File | Why |
|---|---|
| src/candidate/candidate.service.ts | `handlerDeleteVisits(candidateId, lang)` → `MODELS.Visit.deleteMany({ candidateId }).exec()`, returns `data: { deletedCount }`; 1-line why comment (hard delete: Visit has no deletedAt) |
| src/candidate/candidate.controller.ts | `fnDeleteVisits` — id only from `req.user._id` (AuthenticationError otherwise), `ok(res, data, message)` |
| src/routers/api/v1/candidate.route.ts | `router.delete('/visits', asyncHandler(fnDeleteVisits))` + swagger block; same router as GET /visits (behind verifyToken → CSRF check inline for cookie-only auth) |
| src/locales/vi.ts, src/locales/en.ts | `candidate.deleteVisitsSuccess` |
| .claude/rules/api.md | DELETE `/visits` row |
| src/__tests__/candidate/candidate.service.test.ts | Visit mock gets `deleteMany`; test asserts call args `[[{ candidateId: 'cand1' }]]` and `data: { deletedCount: 3 }` |

## Command
- `npx jest src/__tests__/candidate/candidate.service.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build)
- `npm run lint`

## Output
Single file:
```
Tests:       9 passed, 9 total
```
`npm test`:
```
FAIL src/__tests__/auth/tokenExpiry.test.ts (5.755 s)
FAIL src/__tests__/services/atsPdfIntegration.test.ts (7.098 s)
Test Suites: 2 failed, 53 passed, 55 total
Tests:       5 failed, 489 passed, 494 total
```
Same 2 suites / 5 tests fail on base (proved on base in evidence/implementer/2026-11-01/add-main-skills-diff.md: "Tests: 5 failed, 2 passed, 7 total" with src stashed) — local .env TOKEN_EXP_IN + real Chrome; 489 = 488 + this node's 1 new test.

`npm run build`: `build exit=0`

`npm run lint`: first run `✖ 275 problems` — 1 new `unbound-method` at the test's `expect(MODELS.Visit.deleteMany)`; rewritten to assert on `(… as jest.Mock).mock.calls`; rerun:
```
✖ 274 problems (274 errors, 0 warnings)
```
= baseline 274. Remaining errors in touched files are pre-existing (test file 121/136/172-174 unbound-method in older tests; controller 44/59/112 unchanged lines, 236/238/251 = base 225/227/240 shifted +11).

## Acceptance
| Criterion | Evidence |
|---|---|
| service + controller + route, id from JWT only | Diff rows 1–3 |
| unit test deleteMany args + deletedCount | "Tests: 9 passed, 9 total" |
| vi/en message + api.md row | Diff rows 4–5 |
| npm test green except pre-existing | "Tests: 5 failed, 489 passed, 494 total"; same 5 on base |
| build | build exit=0 |
| lint ≤ 274 | "✖ 274 problems" |
| comments per code-comments.md | 1 why-comment on handlerDeleteVisits; controller comment mirrors fnGetVisitStats's |

## Supersedes
none

## Noticed, not done
- Account self-delete (`handlerDelete`, CV_SECTION_MODELS) does not delete the candidate's Visit documents — orphaned visits remain after account deletion.
- No controller-level test for fnDeleteVisits (fnGetVisits has none either).

## Seal gate
none (no commit/push; `/todo` without `--ship`)
