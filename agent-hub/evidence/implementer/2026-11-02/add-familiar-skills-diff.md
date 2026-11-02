# 2026-11-02 - add-familiar-skills (diff)
- Worker: implementer · Version: 0.1.0
- Node: `add-familiar-skills` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: "tương tự mainSkills, bổ sung FamiliarSkills không limit" (GitHub #349)
- Status: sealed_pending_verifier

## Hub bytes before: 83521

## Diff
| File | Why |
|---|---|
| src/models/generalInformation.model.ts | `familiarSkills: { type: [personalSkills], default: [] }` after `mainSkills` |
| src/candidate_profile/general_information/generalInformation.validate.ts | `_sub.familiarSkills` = `Joi.array().items({ name: Joi.string() })`, no `.max()` (shared by PUT + PATCH schemas, like mainSkills) |
| src/types/candidate.type.ts | `GeneralInformationData.familiarSkills?: Skill[]` |
| src/config/swagger.config.ts | `familiarSkills` array property, no `maxItems` |
| src/locales/vi.ts / en.ts | field label `Kỹ năng quen thuộc` / `Familiar skills` |
| src/__tests__/candidate_profile/generalInformation.validate.test.ts | new describe: 20 familiarSkills accepted |

## Command
- `npx jest src/__tests__/candidate_profile/generalInformation.validate.test.ts`
- `npm test`
- `npm run build` (Typecheck = inside Build)
- `npm run lint`; plus `npx eslint src/candidate_profile/general_information/generalInformation.validate.ts` before (git stash) / after

## Output
Focused:
```
  schemaGeneralInformationPatch — familiarSkills
    ✓ accepts any number of familiar skills (1 ms)
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```
Full `npm test`:
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
    ✕ falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default) (9 ms)
FAIL src/__tests__/services/atsPdfIntegration.test.ts
    ✕ renders a real PDF whose extracted text passes the full ATS check suite (5 ms)
    ✕ reports keyword coverage against a sample job description (2 ms)
    ✕ round-trips the en ATS PDF through the PDF CV import parser (1 ms)
    ✕ round-trips the vi ATS PDF through the PDF CV import parser (1 ms)
Test Suites: 2 failed, 53 passed, 55 total
Tests:       5 failed, 490 passed, 495 total
```
Same 5 failures recorded on base for `add-main-skills` (ef79e0a commit msg: "5 failed ... same 5 fail on base: tokenExpiry env + real-Puppeteer ATS"); 490 passed = 488 + 2 net new tests on staging since then incl. this one.
Build: `build exit 0`.
Lint: `✖ 274 problems (274 errors, 0 warnings)` (= baseline 274). `generalInformation.validate.ts` listed but pre-existing: `✖ 2 problems` both with and without this diff (lines 48/53 → 51/56, `no-unsafe-assignment` on the exported schemas, unrelated to the new key).

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. model field default [] | Diff row 1 |
| 2. Joi no max + test 20 accepted | `✓ accepts any number of familiar skills`; `Tests: 3 passed, 3 total` |
| 3. type + swagger + locales | Diff rows 3–5; `build exit 0` |
| 4. test/build/lint | `Tests: 5 failed, 490 passed` (pre-existing env failures only); `build exit 0`; `274 problems` = baseline, none new in changed files |
| comments per code-comments.md | No comments added/changed |

## Supersedes: none
## Still open: none

## Noticed, not done
- familiarSkills (like mainSkills) isn't rendered in PDF/DOCX/ATS exports — not requested.

## Seal gate
none (no commit/push; operator ships via /ship)
