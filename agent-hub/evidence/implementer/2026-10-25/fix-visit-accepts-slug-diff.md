# 2026-10-25 - fix-visit-accepts-slug (diff)

- Worker: implementer · Version: 0.1.0
- Node: `fix-visit-accepts-slug` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #320): "POST /api/me/:value/visit chỉ nhận email, link slug bị 404 — không ghi được lượt xem/nguồn"
- Plan: `evidence/implementer/2026-10-25/fix-visit-accepts-slug-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 81396

## Diff
| File | Why |
|---|---|
| `src/candidate_me/index.ts` | `fnRecordVisit` reads `req.params.identifier`; `handlerRecordVisit(identifier, req)` uses local `findBy('slug' \| 'email')` (candidateQuerySafe.safeQuery + key-survived check, `.select('_id')`), `slug ?? email`; comments updated (WHY fail-closed, slug-first). |
| `src/routers/index.ts` | Route `/api/me/:identifier/visit` (same URL shape for clients); Swagger path `{identifier}`, param description (slug first or email), dropped `format: email`, 404 "Unknown identifier". |
| `src/routers/api/v1/candidate.route.ts` | Swagger text reference `POST /api/me/{email}/visit` → `{identifier}`. |
| `.claude/rules/api.md` | Endpoint row path + "by vanity slug (checked first) or email; unknown → 404". |
| `src/__tests__/candidate_me/index.test.ts` | +3 tests in `handlerRecordVisit`: slug → 1 `findOne({ slug })`, visit created for c1; slug miss → 2nd call `findOne({ email })`, visit created; unknown → 2 calls, 404, no visit. |
GET `/api/me/:email` does not record visits (`grep Visit.create src` → only `handlerRecordVisit`) → no double count; GET untouched.

## Command
From repo root per `doctrine/MEMORY.md`: `npx jest src/__tests__/candidate_me/index.test.ts`; `npm test`; `npm run build` (Typecheck); `npm run lint` (staging baseline measured with diff stashed: `✖ 274 problems`). Regression proof: `git stash push src/candidate_me/index.ts` then the test file.

## Output
Targeted (diff applied):
```
      ✓ records a visit addressed by vanity slug, looked up by slug first (1 ms)
      ✓ falls back to email when no slug matches
      ✓ 404s an unknown identifier after trying slug and email, recording nothing
Tests:       45 passed, 45 total
```
With old `src/candidate_me/index.ts` (stashed):
```
      ✕ records a visit addressed by vanity slug, looked up by slug first (2 ms)
      ✕ falls back to email when no slug matches
      ✕ 404s an unknown identifier after trying slug and email, recording nothing
Tests:       3 failed, 42 passed, 45 total
```
Existing `fails closed and never queries the DB when the email is rejected by QuerySafe` (`'$where:1'` → 404, `findOne` not called) still passes (in the 45).

`npm test`:
```
Test Suites: 2 failed, 50 passed, 52 total
Tests:       5 failed, 471 passed, 476 total
```
Failing suites `auth/tokenExpiry.test.ts` + `services/atsPdfIntegration.test.ts` only = the same 5 pre-existing local-env failures as in `fix-create-returns-created-doc-diff.md` (proven there with diff stashed). 476 = 473 + 3 new.

`npm run build`: `BUILD_RC=0`.
`npm run lint`: `✖ 274 problems (274 errors, 0 warnings)`; staging (diff stashed) `✖ 274 problems` → 0 new. Per file: test file 16 = 16 before/after. First pass showed 279/275 (new test lines used `expect(MODEL.Candidate.findOne)` → `unbound-method`); switched new lines to `jest.mocked(MODEL.Candidate).findOne` / `jest.mocked(MODEL.Visit).create` (pattern already in this file), rerun 274.

## Acceptance
| # | Criterion | Evidence |
|---|---|---|
| 1 | slug first, then email, both fail-closed via candidateQuerySafe | diff `findBy`; `✓ records a visit addressed by vanity slug…` (`toHaveBeenCalledWith({ slug })`), `✓ falls back to email…` (`toHaveBeenNthCalledWith(2, { email })`); `$where:1` fail-closed test still passes |
| 2 | route param + Swagger `{identifier}`; api.md updated | diffs routers/index.ts, candidate.route.ts, api.md |
| 3 | tests slug→visit, unknown→404 after both attempts, existing pass | 3 ✓ above, `Tests: 45 passed`; fail on old code `3 failed` |
| 4 | test/build no new failures, lint 0 new | 5 = pre-existing 5; `BUILD_RC=0`; lint 274 = 274 |
| 5 | comments per code-comments.md | Changed: one `//` (WHY slug-first + fail-closed) replacing a 2-line `//` stack; `//` 404 note reworded. Swagger JSDoc functional text only. No `(#N)` refs. |

## Supersedes: none
Grepped active diagram for `#320` — only this node.

## Noticed, not done
- Visit POST still records visits for private (`isPublic: false`) profiles, as before (GET hides them). Unchanged behavior, out of scope.
- `GET /api/me/:email` param name kept (rename not asked; route works for slugs already).

## Seal gate: none
No commit/push yet.
