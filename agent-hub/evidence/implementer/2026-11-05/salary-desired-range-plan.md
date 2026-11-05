# 2026-11-05 - salary-desired-range
- Worker: implementer · Version: 0.1.0
- Node: `salary-desired-range` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: GitHub #362 "feat(general-information): đổi mức lương mong muốn thành khoảng từ – đến" — via `/todo "fix hết 4 issues"`, branch `362-feat-general-information` (off staging @ 6682019)

## Hub bytes before: 84195
(measured after adding this node's own PENDING row)

## Decisions (issue said "chốt khi implement")
- Both ends optional, each `Number ≥ 0` or null; `To ≥ From` only checked when From is a number.
- Legacy read: `pre('init')` hook on the generalInformation schema copies a stored `salaryDesired` to From and To when neither is stored — same no-migration approach as the localized-text hydrate plugin (`src/models/part/index.ts`, #357).
- Legacy write: `resume-vuejs-website/src/models/generalInformation.model.ts:102` still posts a single required `salaryDesired`; dropping it from Joi would turn every save of that form into a 400 the moment this ships. So Joi still accepts `salaryDesired` and an object-level `.custom()` maps it to From = To (only when no range field is sent) and strips it — marked `shortcut:` for removal once the Vue client sends the range.
- No PDF/DOCX/ATS output prints the salary (`grep -rn salary src/services src/candidate_me` → nothing), so no render change.

## Diff
| File | Why |
|---|---|
| `src/models/generalInformation.model.ts` | `salaryDesired` → `salaryDesiredFrom`/`salaryDesiredTo` (Number, default null); pre('init') legacy hydrate |
| `src/candidate_profile/general_information/generalInformation.validate.ts` | From/To schema + `To ≥ From`; legacy `salaryDesired` alias + `.custom()` mapping |
| `src/config/swagger.config.ts` | GeneralInformation: From/To replace salaryDesired |
| `src/locales/{vi,en}.ts` | `fieldLabels.salaryDesiredFrom/To` (kept `salaryDesired` — still a valid input label) |
| `.claude/rules/models.md` | GeneralInformation row |
| `src/__tests__/candidate_profile/generalInformation.validate.test.ts` | +14 tests: range accepted/rejected with field path, legacy input mapping, legacy hydrate, null defaults |
| (`generalInformation.controller.test.ts` unchanged — its `salaryDesired: 1000` payload still validates through the alias, still passes) |

## Command
- `npx jest src/__tests__/candidate_profile/generalInformation`
- `npm test` · `npm run build` · `npm run lint` · `npx eslint` on touched files (+ on `git stash -- src` baseline)

## Output
```
# first run: 1 failed — "accepts {"salaryDesiredTo": 2000}":
#   "Lương mong muốn đến" limit references "ref:salaryDesiredFrom" which must be a number
# cause: Joi `when(is: Joi.number())` matches undefined by default → fixed to `is: Joi.number().required()`
# npx jest src/__tests__/candidate_profile/generalInformation (after fix)
Tests:       20 passed, 20 total
# npm test (staging baseline after #361 merge = 534 total, 5 failed)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 56 passed, 58 total
Tests:       5 failed, 543 passed, 548 total
# npm run build
build_exit=0
# npm run lint
✖ 274 problems (274 errors, 0 warnings)
# npx eslint touched files — after
src/candidate_profile/general_information/generalInformation.validate.ts
  53:3  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
  58:3  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
# same files on baseline (git stash -- src)
  51:3  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
  56:3  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
```
Both lint lines are the unchanged `_id: _id,` lines (shifted +2 by the new `salary` const) — the same `any`-typed `joi.config.ts:33` `_id` as every validator. `generalInformation.model.ts` and the test file: 0 errors.

## Acceptance
| Criterion | Evidence |
|---|---|
| Create/update take From/To | "accepts {From:1000,To:2000}", "{From:1000}", "{To:2000}", "{From:null,To:2000}", "{}" |
| `To < From` → 400 with `details` on the right field | "rejects To below From" → paths `['salaryDesiredTo']` (abortEarly:false, same as `validateSchema`); negatives → their own field |
| GET returns range; legacy doc returns right value | "hydrates a document with only salaryDesired as an exact range" → From=To=1500; "keeps a stored range as is"; "defaults both ends to null" |
| Swagger + models.md updated | diff rows above |
| Tests updated | +14, 548 total vs 534 baseline, 5 failed = baseline 5 |
| Typecheck (inside Build) | build_exit=0 |
| Lint ≤ 274, none new in touched files | 274; only pre-existing `_id` lines |
| comments per code-comments.md | 1-line WHY on the hook; `shortcut:` line on the alias (project's shortcut form); no issue refs |

## Supersedes: none
## Noticed, not done
- `resume-vuejs-website` form + `datvt243.github.io/types/resume-document.ts:36` (`salaryDesired: number`) still model a single value — they need their own change to send/read the range; public `/api/me` now returns From/To instead of `salaryDesired`.
- Stored `salaryDesired` stays in Mongo (not in schema, so never returned) — no migration, by design.
## Seal gate: covered by operator "Approve all 4" (AskUserQuestion, this session) — ship after SEAL only
