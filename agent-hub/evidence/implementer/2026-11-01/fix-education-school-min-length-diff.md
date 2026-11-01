# 2026-11-01 - fix-education-school-min-length (diff)

- Worker: implementer · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-education-school-min-length`
- Task: `#331 Education school name requires 10+ characters, rejects real names like MIT`
- Branch: `331-education-school-name` · Plan: `evidence/implementer/2026-11-01/fix-education-school-min-length-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 81409
Measured from `agent-hub/` with:
`{ find . -maxdepth 1 -type f; find doctrine -type f; echo haven/diagrams/dev-loop.prime-mermaid.md; find haven/workers -type f; } | xargs cat | wc -c`

## Diff
| File | Why |
|---|---|
| `src/candidate_profile/education/education.validate.ts:11` | `school` `.min(10)` → `.min(1)`; `max(255)`, `.trim().strict()` unchanged |
| `src/__tests__/candidate_profile/education.validate.test.ts` (new) | `schemaEducation` accepts `MIT`/`RMIT`/`FPT`/`ĐH Huế` |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (verbatim from `doctrine/MEMORY.md`):
- `npx jest src/__tests__/candidate_profile/education.validate.test.ts`
- `npm test`
- `npm run build`
- `npm run lint`; `npx eslint <2 touched files>`

## Output
```
    ✓ accepts MIT (2 ms)
    ✓ accepts RMIT
    ✓ accepts FPT
    ✓ accepts ĐH Huế (1 ms)
Tests:       4 passed, 4 total
```
`npm test`:
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 52 passed, 54 total
Tests:       5 failed, 482 passed, 487 total
```
Base `staging` @ c040129 (= #334 merge): `Tests: 5 failed, 478 passed, 483 total`, same 2 suites (recorded in `evidence/implementer/2026-10-31/fix-lastname-min-length-diff.md`; local env: `.env` sets `TOKEN_EXP_IN`, Puppeteer Chrome not installed). 483 → 487 = the +4 new tests; failures unchanged.

`npm run build`: `build exit=0`
`npm run lint`: `✖ 274 problems (274 errors, 0 warnings)` (base 274).
`npx eslint` on touched files: 1 error, `education.validate.ts 10:3 no-unsafe-assignment` — line 10 is `_id,` (untouched, pre-existing); 0 in the new test file.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. `school` `min(1)`, `max(255)` kept | diff: `-  school: Joi.string().min(10).max(255)...` / `+  school: Joi.string().min(1).max(255)...` |
| 2. Test: short names accepted | `Tests: 4 passed, 4 total` (✓ MIT, RMIT, FPT, ĐH Huế) |
| 3. `npm test` + `npm run build` green | `build exit=0`; `5 failed, 482 passed, 487 total` — 5 identical to base, 0 new |
| 4. Lint adds zero new problems | 274 → 274 |
| Comments per code-comments.md | One 1-line why comment (school names are often short acronyms), no issue ref, no what-narration |

## Supersedes: none
## Still open: none

## Noticed, not done
- `.trim().strict()` on `school` rejects surrounding spaces — #332, separate node.
- `max` 255 vs frontend 100 left as-is (optional per issue).

## Seal gate
none — no commit/push/outward action taken.
