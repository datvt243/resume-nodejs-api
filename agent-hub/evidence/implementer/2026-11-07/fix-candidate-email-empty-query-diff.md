# 2026-11-07 - fix-candidate-email-empty-query (diff)
- Worker: implementer · Version: 0.1.0
- Node: `fix-candidate-email-empty-query` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #380`
- Branch: `380-get-candidate-email` (off `staging` @ 0141d71)
- Status: sealed_pending_verifier

## Hub bytes before
93030

## Feature doc: `doctrine/features/candidate-account.md` (Behavior #2 restored; doc unchanged)

## Diff
| file | why |
|---|---|
| `src/candidate/candidate.service.ts` | `handlerGetInformationByEmail`: `if (!('email' in safeEmailQuery)) return null;` before `findOne` — same guard as public route `src/candidate_me/index.ts:104`. Controller already turns `null` into 404 |
| `src/__tests__/candidate/candidate.service.test.ts` | `it.each(['a$b@x.com', '   '])` → resolves `null`, `findOne` never called. Asserts via `.mock.calls` length (not `expect(MODELS.Candidate.findOne)`) to avoid adding a new `unbound-method` lint error |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api`:
1. `npx jest src/__tests__/candidate/candidate.service.test.ts`
2. `npm test`
3. `npm run build` (Typecheck row = inside Build)
4. `npm run lint`; plus `npx eslint` on the 2 touched files
5. Baseline: `git stash` → `npm test` + `npx eslint` touched files → `git stash pop`

## Output
1. ```
      ✓ returns null without querying when safeQuery drops the email "a$b@x.com" (#380)
      ✓ returns null without querying when safeQuery drops the email "   " (#380)
Tests:       11 passed, 11 total
```
2. After diff:
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
  ● ... › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
FAIL src/__tests__/services/atsPdfIntegration.test.ts
  ● ATS PDF integration (real Puppeteer + pdf-parse) › (4 tests)
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 574 passed, 579 total
```
   Baseline (staging, diff stashed): same 2 suites fail, `Tests: 5 failed, 572 passed, 577 total`. Pre-existing env failures (local `TOKEN_EXP_IN` set; no Chrome installed) — identical to `evidence/implementer/2026-11-06/cv-filename-lang-suffix-diff.md`. +2 = the new tests.
3. `npm run build` → `BUILD_EXIT=0` (tsc + copy).
4. `✖ 274 problems (274 errors, 0 warnings)` = baseline 274. Touched files: 5 errors after, 5 before (all pre-existing `unbound-method` at test lines 126/141/177-179; `candidate.service.ts` 0).

## Supersedes: none
## Still open
- `fix-candidate-password-leak` (PENDING) — different bug (#152 password leak), same function; its fix already landed on staging (see header of `candidate.service.test.ts`) but the row was never sealed — DIAGRAM_DRIFT candidate, not this node's scope.

## Noticed, not done
- #394 (operator answer: `GET /candidate/:email` should be self-only) — separate issue, not touched.
