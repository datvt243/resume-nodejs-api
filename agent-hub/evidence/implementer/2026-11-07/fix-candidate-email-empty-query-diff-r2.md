# 2026-11-07 - fix-candidate-email-empty-query (diff, round 2)
- Worker: implementer · Version: 0.1.0
- Node: `fix-candidate-email-empty-query` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #380`
- Branch: `380-get-candidate-email` (off `staging` @ 0141d71)
- Status: sealed_pending_verifier
- Supersedes note: `evidence/implementer/2026-11-07/fix-candidate-email-empty-query-diff.md` (round 1)

## Reopen addressed
From `evidence/verifier/2026-11-07/fix-candidate-email-empty-query-reopen.md`:
1. No `## Acceptance` table / no "comments per code-comments.md" row → added below.
2. `npm test` output not verbatim (`● ...`, `(4 tests)`) → re-ran; every `✕` line pasted verbatim, after AND baseline.
3. No `## Seal gate` line → added.
4. Code comment carried `(#380)` → removed (code-comments.md "Delete: Issue/PR refs"). Test title keeps `(#380)`: the standard governs comments, and the file's existing idiom names issues in test titles (`describe('... (issue #152)')`, `(issue #158)`).

## Hub bytes before
93030

## Feature doc: `doctrine/features/candidate-account.md` (Behavior #2 "unknown email → 404" restored; doc unchanged)

## Diff
| file | why |
|---|---|
| `src/candidate/candidate.service.ts` | `handlerGetInformationByEmail`: `if (!('email' in safeEmailQuery)) return null;` before `findOne`, + 1-line `//` WHY comment. Same guard as `src/candidate_me/index.ts:104`. Controller (`candidate.controller.ts:39`) already maps `null` → `NotFoundError` 404 |
| `src/__tests__/candidate/candidate.service.test.ts` | `it.each(['a$b@x.com', '   '])` → resolves `null`, `findOne` `.mock.calls` length 0 |

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. Dropped email → `null` without querying (→ 404), Behavior #2 | Output 1: `✓ returns null without querying when safeQuery drops the email "a$b@x.com" (#380)` and `"   "` |
| 2. Regression test passes | Output 1: `Tests:       11 passed, 11 total` |
| 3a. `npm test` no new failures vs staging | Output 2 after: `Tests:       5 failed, 574 passed, 579 total`; baseline: `Tests:       5 failed, 572 passed, 577 total` — identical 5 `✕` names in both, +2 = new tests |
| 3b. `npm run build` clean (Typecheck inside Build) | Output 3: `BUILD_EXIT=0` |
| 3c. `npm run lint` ≤ 274, none new in touched files | Output 4: `✖ 274 problems (274 errors, 0 warnings)`; touched files 5 before / 5 after, all pre-existing `unbound-method` at test lines 126/141/177/178/179 (lines shift +5 after diff); `candidate.service.ts` 0 |
| comments per code-comments.md | 1 comment added, `candidate.service.ts:65`: `// safeQuery drops a \`$\`/blank email — without this guard findOne({}) returns an arbitrary candidate.` — WHY (trap), 1 sentence `//` inside function body, no issue ref. No other comments touched |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api`:
1. `npx jest src/__tests__/candidate/candidate.service.test.ts`
2. `npm test` (after); baseline: `git stash` → `npm test` → `git stash pop`
3. `npm run build`
4. `npm run lint`

## Output
1. ```
      ✓ returns null without querying when safeQuery drops the email "a$b@x.com" (#380) (1 ms)
      ✓ returns null without querying when safeQuery drops the email "   " (#380)
Tests:       11 passed, 11 total
```
2. After diff (`grep -E "✕|^Tests:|^Test Suites:|^FAIL"`):
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
    ✕ falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default) (15 ms)
FAIL src/__tests__/services/atsPdfIntegration.test.ts
    ✕ renders a real PDF whose extracted text passes the full ATS check suite (4 ms)
    ✕ reports keyword coverage against a sample job description (1 ms)
    ✕ round-trips the en ATS PDF through the PDF CV import parser (1 ms)
    ✕ round-trips the vi ATS PDF through the PDF CV import parser (1 ms)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 574 passed, 579 total
```
   Baseline (staging, diff stashed), same grep:
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
    ✕ falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default) (7 ms)
FAIL src/__tests__/services/atsPdfIntegration.test.ts
    ✕ renders a real PDF whose extracted text passes the full ATS check suite (14 ms)
    ✕ reports keyword coverage against a sample job description
    ✕ round-trips the en ATS PDF through the PDF CV import parser
    ✕ round-trips the vi ATS PDF through the PDF CV import parser (1 ms)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 572 passed, 577 total
```
   Failure reasons in after-run (`grep ... | sort | uniq -c`), both env-only:
```
   8     Could not find Chrome (ver. 127.0.6533.88). This can occur if either
   2     Expected: 3600
   2     Received: 10800
```
3. ```
> cp -R ./src/public ./dist/

BUILD_EXIT=0
```
4. ```
✖ 274 problems (274 errors, 0 warnings)
```

## Seal gate
none — no outward-facing action (no commit/push/API call); `src/` diff shown to operator in chat.

## Supersedes: none
## Still open
- `fix-candidate-password-leak` (PENDING) — different bug (#152), already fixed on staging but never sealed; DIAGRAM_DRIFT candidate, not this node's scope.

## Noticed, not done
- #394 (`GET /candidate/:email` → self-only, operator answer 2026-11-07) — separate issue.
