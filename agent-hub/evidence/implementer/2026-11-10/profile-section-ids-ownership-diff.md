# 2026-11-10 - profile-section-ids-ownership (implement)
- Worker: implementer · Version: 0.1.0 · Node: `profile-section-ids-ownership` · Plan: `evidence/implementer/2026-11-10/profile-section-ids-ownership-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 96177

## Feature doc: doctrine/features/cv-profiles.md
## Feature doc changed: Behavior 2 + edge case + acceptance criterion + Changelog row (see plan note), per operator answer #405.

## Diff
| file | why |
|---|---|
| `src/candidate_profile/profile/profile.service.ts` | `handlerCreate`/`handlerUpdate` now wrap the crud ones with `checkSectionIds`: per section, one `find({candidateId (via idQuerySafe), _id: {$in: ids}, deletedAt: null}, '_id')`; every id not returned → detail `{field: '<field>.<index>', message}`; any detail → `ValidationError` (400) before any write. Missing/unsafe candidateId → no query, every id rejected (fail closed). Ids compared lowercased (Joi allows A-F; ObjectId.toString() is lowercase). |
| `src/locales/en.ts`, `src/locales/vi.ts` | new `profile.entryNotFound` message |
| `src/__tests__/candidate_profile/profile.service.test.ts` | mocks `createCrudService`; 3 new #405 tests: owned ids (incl. uppercase hex) → crud create called with item + query shape asserted, untouched section not queried; foreign ids → `ValidationError` 400 with `educationIds.1` + `referenceIds.0`, no create; update rejects then accepts |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (verbatim from `doctrine/MEMORY.md`):
- `npx jest src/__tests__/candidate_profile/profile.service.test.ts`
- `npm test`
- `npm run build` (Typecheck row = `inside Build`)
- `npm run lint`

## Output
`npx jest src/__tests__/candidate_profile/profile.service.test.ts`:
```
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        1.695 s, estimated 2 s
```
(first run failed: `ReferenceError: Cannot access 'mockCrudCreate' before initialization` — jest.mock hoisting, fixed with lazy closures; second run 1 failed / 5 passed — the uppercase-hex case, cause was the test mock comparing `id === owned` case-sensitively while Mongo casts hex case-insensitively; mock fixed, code unchanged.)

`npm test` (branch, final):
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 64 passed, 66 total
Tests:       5 failed, 661 passed, 666 total
```
Same two suites on clean `staging` (`git stash`, then `npx jest src/__tests__/auth/tokenExpiry.test.ts src/__tests__/services/atsPdfIntegration.test.ts`):
```
  ● access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155) › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
  ● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
  ● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
Test Suites: 2 failed, 2 total
Tests:       5 failed, 2 passed, 7 total
```
→ the 5 failures are pre-existing on `staging`, identical set; zero new failures.

`npm run build`:
```
> resume-nodejs-api@2.7.2 copy
> cp -R ./src/public ./dist/

build exit=0
```

`npm run lint`: staging `✖ 274 problems (274 errors, 0 warnings)`; branch first pass `✖ 276 problems` (2 new `@typescript-eslint/unbound-method` at test lines 117/118, `expect(MODELS.X.find)`), fixed by asserting on `(… as jest.Mock).mock.calls`; branch final `✖ 274 problems (274 errors, 0 warnings)`. `npx eslint` on the test file now: 4 errors at lines 45, 46, 62, 63 — all pre-existing lines (`expect(ProfileModel.create)`/`expect(MODELS.Education.find)` in the #133 tests), same 4 as on staging. `profile.service.ts`, `en.ts`, `vi.ts`: 0.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. profile.service test passes incl. #405 cases | `## Output` → 6/6 passed |
| 2. `npm test` no new failures; build clean; lint ≤ 274, none new | `## Output` → same 5 failures on staging; build exit 0; lint 274 = baseline, touched-line errors 0 |
| 3. feature doc Behavior updated | `doctrine/features/cv-profiles.md` Behavior 2 + Changelog row 2026-11-10 |
| 4. comments per code-comments.md | 1 JSDoc above `checkSectionIds` (why: Joi checks shape only) + 1 `//` (why `$in` merge is safe); no issue refs in src comments |
| Issue: 400 with offending field/index | test "rejects unknown/foreign/deleted ids…" asserts `statusCode 400`, `errors` = `[educationIds.1, referenceIds.0]`; `sendError` maps `errors` → `details` |

## Supersedes: none
(grep `#405` in active diagram: only this node.)

## Noticed, not done
- `tokenExpiry.test.ts` fails on staging too (env-dependent, likely `TOKEN_EXP_IN` set in local `.env`); `atsPdfIntegration` needs Chrome (`CI_NO_CHROME` unset locally). Out of scope.
- `ensureDefaultProfile`'s 6 model casts duplicate `SECTION_ID_FIELDS`; left as-is (SmallestDiff).
- Deleting a section entry later leaves its id in profiles (stale id then fails the next update of that profile with 400 until removed) — consistent with the operator's rule; flag if the frontend needs auto-pruning.

## Process slip
`NodeBeforeCode`: src edited before the PENDING row existed; row appended right after (see plan note).

## Seal gate
No outward-facing action (no commit/push). None requested.
