# 2026-11-01 - fix-trim-strict-rejects-spaces (diff)

- Worker: implementer · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-trim-strict-rejects-spaces`
- Task: `#332 Fields with .trim().strict() reject surrounding spaces with 400 instead of trimming`
- Branch: `332-fields-with-trim` · Plan: `evidence/implementer/2026-11-01/fix-trim-strict-rejects-spaces-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 81467
Measured from `agent-hub/` with:
`{ find . -maxdepth 1 -type f; find doctrine -type f; echo haven/diagrams/dev-loop.prime-mermaid.md; find haven/workers -type f; } | xargs cat | wc -c`

## Diff
| File | Why |
|---|---|
| `src/config/joi.config.ts` | `.strict()` removed from `email` (own line, was :44), `firstName`, `lastName`, `fullName`, `company`, `position`, `phone`, `_stringDefault` — `.trim()` now trims |
| `src/candidate_profile/education/education.validate.ts:11-12` | `school`, `major`: `.trim().strict()` → `.trim()` |
| `src/candidate_profile/profile/profile.validate.ts:16` | `name`: `.trim().strict()` → `.trim()` |
| `src/__tests__/config/joi.config.test.ts` | +3 tests: `' An '` → `{ value: 'An' }`; `123` and `'   '` still rejected |
| `src/__tests__/candidate_profile/education.validate.test.ts` | +1 test: `' MIT '` / `' Computer Science '` trimmed in `value` |

Remaining `.strict()` after the diff (`grep -rn "strict()" src | grep -v __tests__`):
```
src/config/joi.config.ts:47:export const password = ...regex(passwordRegex).trim().strict().required();
src/auth/auth.validate.ts:10:export const password = ...regex(passwordRegex).trim().strict().label('Password').required();
src/auth/auth.validate.ts:28:  token: Joi.string().trim().strict().required(),
src/candidate_profile/project/project.validate.ts:15:  companyId: Joi.string().trim().strict(),
```

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (verbatim from `doctrine/MEMORY.md`):
- `npx jest src/__tests__/config/joi.config.test.ts src/__tests__/candidate_profile/education.validate.test.ts`
- `npm test`
- `npm run build`
- `npm run lint`

## Output
```
    ✓ accepts MIT (1 ms)
    ✓ accepts RMIT
    ✓ accepts FPT (1 ms)
    ✓ accepts ĐH Huế
    ✓ trims surrounding spaces from school and major
    ✓ accepts An
    ✓ accepts Vy
    ✓ accepts Hà
    ✓ accepts Tú
    ✓ accepts Nguyễn
    ✓ rejects an empty string
    ✓ trims surrounding spaces instead of rejecting them (1 ms)
    ✓ still rejects 123
    ✓ still rejects "   "
Tests:       14 passed, 14 total
```
`npm test`:
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 52 passed, 54 total
Tests:       5 failed, 486 passed, 491 total
```
Base `staging` @ 2f45cde (= #335 merge): `Tests: 5 failed, 482 passed, 487 total`, same 2 suites (recorded in `evidence/implementer/2026-11-01/fix-education-school-min-length-diff.md`; local env: `.env` sets `TOKEN_EXP_IN`, Puppeteer Chrome not installed). 487 → 491 = the +4 new tests; failures unchanged.

`npm run build`: `build exit=0`
`npm run lint`: `✖ 274 problems (274 errors, 0 warnings)` (base 274).

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. `.strict()` dropped from the 11 user-typed fields; callers store trimmed `value` | Diff table above; callers save `value` per plan note anchors (`valid.ts:27-30`, `BaseController.ts:214-218,227-231`); `✓ trims surrounding spaces instead of rejecting them`, `✓ trims surrounding spaces from school and major` |
| 2. Passwords, `token`, `companyId` keep `.strict()` | remaining-`strict()` grep above: exactly those 4 lines |
| 3. Trim + still-reject tests | `Tests: 14 passed, 14 total` incl. `✓ still rejects 123`, `✓ still rejects "   "` |
| 4. `npm test` + `npm run build` green | `build exit=0`; `5 failed, 486 passed, 491 total` — 5 identical to base, 0 new |
| 5. Lint adds zero new problems | 274 → 274 |
| Comments per code-comments.md | No comments added or changed (new tests sit under the existing 1-line header comments) |

## Supersedes: none
## Still open: none

## Noticed, not done
- Issue says "14 fields"; the grep finds 15 `.strict()` sites, 11 changed and 4 kept on purpose (see plan Decisions).
- `company`/`position` have `min(0)` + `required()` — `''` is still rejected (Joi `string.empty`), unchanged by this diff.

## Seal gate
none — no commit/push/outward action taken.
