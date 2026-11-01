# 2026-11-01 - add-main-skills
- Worker: implementer · Version: 0.1.0
- Node: `add-main-skills` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: "phần thông tin skill, tôi muốn thêm Main Skills, có tối đa 5 skill (skill này giống với persional skill)" (GitHub #343, branch `343-ph-n-th-ng`)
- Status: sealed_pending_verifier

## Hub bytes before
83545

## Diff
| File | Why |
|---|---|
| src/models/generalInformation.model.ts | `mainSkills: { type: [personalSkills], default: [] }` — reuses the personalSkills `{ name }` sub-schema |
| src/candidate_profile/general_information/generalInformation.validate.ts | Joi `mainSkills` array of `{ name }`, `.max(5)`, in `_sub` (so both PUT and PATCH schemas get it) |
| src/types/candidate.type.ts | `GeneralInformationData.mainSkills?: Skill[]` |
| src/config/swagger.config.ts | `mainSkills` property, `maxItems: 5` |
| src/locales/vi.ts, src/locales/en.ts | field label `Kỹ năng chính` / `Main skills` |
| src/__tests__/candidate_profile/generalInformation.validate.test.ts (new) | 5 accepted, 6 rejected with path `['mainSkills']` |

## Command
- `npx jest src/__tests__/candidate_profile/generalInformation.validate.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build)
- `npm run lint`
- Baseline: `git stash push -- src` then `npx jest src/__tests__/auth/tokenExpiry.test.ts src/__tests__/services/atsPdfIntegration.test.ts` and `npx eslint src/candidate_profile/general_information/generalInformation.validate.ts`, then `git stash pop`

## Output
New test file:
```
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```
(First run failed 2/2 with `"_id" is required` — fixture lacked `_id`; fixed in the test, not the code.)

`npm test`:
```
Test Suites: 2 failed, 53 passed, 55 total
Tests:       5 failed, 488 passed, 493 total
FAIL src/__tests__/auth/tokenExpiry.test.ts  (Expected: 3600 Received: 10800)
FAIL src/__tests__/services/atsPdfIntegration.test.ts (4 real-Puppeteer tests)
```
Same on base with `src/` changes stashed:
```
Test Suites: 2 failed, 2 total
Tests:       5 failed, 2 passed, 7 total
```
→ pre-existing, environment-dependent (local `.env` TOKEN_EXP_IN; local Chrome), not caused by this diff.

`npm run build`:
```
> resume-nodejs-api@2.2.4 copy
> cp -R ./src/public ./dist/
build exit=0
```

`npm run lint`:
```
✖ 274 problems (274 errors, 0 warnings)
```
Changed files: 2 errors in generalInformation.validate.ts at 48:3 / 53:3 (`no-unsafe-assignment`, `positionDesired`/`career`). Base has the same 2 at 43:3 / 48:3 → shifted +5 lines by the insert, pre-existing.

## Acceptance
| Criterion | Evidence |
|---|---|
| model field `mainSkills` default `[]` | Diff row 1 |
| Joi max 5: 5 accepted, 6 rejected | "Tests: 2 passed, 2 total" on generalInformation.validate.test.ts |
| type + swagger + locale label | Diff rows 3–5 |
| `npm test` green except pre-existing | "Tests: 5 failed, 488 passed"; same 5 fail on base ("5 failed, 2 passed, 7 total") |
| `npm run build` | build exit=0 |
| lint ≤ 274, none new in changed files | "✖ 274 problems"; 2 in changed file identical on base (43/48 → 48/53) |
| comments per code-comments.md | No comments added |

## Supersedes
none

## Noticed, not done
- `mainSkills` is not rendered in PDF / DOCX / ATS exports (createPDF.ts, createDocx.ts, createPDF.ats.ts) — not requested.
- `.claude/rules/models.md` GeneralInformation row does not list mainSkills (nor several other existing fields).
- tokenExpiry.test.ts fails locally when `.env` sets TOKEN_EXP_IN (test not isolated from env).

## Seal gate
none (no commit/push; `/todo` without `--ship`)
