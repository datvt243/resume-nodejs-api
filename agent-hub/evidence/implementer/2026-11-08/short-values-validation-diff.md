# 2026-11-08 - short-values-validation (diff)
- Worker: implementer · Version: 0.1.0
- Node: `short-values-validation` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #414` — "Validation: allow short education majors ("IT") and awards without a link"
- Plan: `evidence/implementer/2026-11-08/short-values-validation-plan.md`

## Hub bytes before
96341

## Feature doc
`doctrine/features/cv-section-crud.md`

## Feature doc changed: + Behavior #12 "Short values (operator, #414) — education `major.vi` needs only 1 char ("IT" is valid; empty → 400 on `major.vi`). Award `link` is optional (missing or `''` allowed, ≤ 100 chars) and must be a URL when present, else 400 on `link`. Implementation choice, not part of the operator's answer: only `http`/`https` schemes count as a URL, so `javascript:` links are refused." + acceptance line `npx jest src/__tests__/candidate_profile/award.validate.test.ts` passes — operator decision recorded in issue #414 body (2026-11-07): "`major.vi`: min 1" / "`award.link`: optional (empty allowed), still ≤ 100 chars; validate as a URL when present". Round 2: dropped the `school.vi` sentence (unchanged by this diff, `localizedName(1)` already on staging) and marked the http(s) restriction as an implementation choice (REOPEN `evidence/verifier/2026-11-08/short-values-validation-reopen.md` #3).

## Diff
| file | why |
|---|---|
| `src/candidate_profile/education/education.validate.ts` | `major: localizedName(3)` → `localizedName(1)` |
| `src/candidate_profile/awards/award.validate.ts` | `link` → `Joi.string().trim().max(100).uri({ scheme: ['http', 'https'] }).allow('').label('Liên kết')` — same idiom as `project.validate.ts:26` plus the URL check the issue asks for; `_stringDefault` import still used by `name`/`organization` |
| `src/__tests__/candidate_profile/education.validate.test.ts` | reject case "major vi shorter than 3" (`'IT'`) → "an empty major vi" (`''`); + `accepts a short major %s` for `'IT'`, `'Y'` |
| `src/__tests__/candidate_profile/award.validate.test.ts` (new) | link missing / `''` / https / http accepted; not a URL / `javascript:` / > 100 chars rejected with `path === 'link'` |

## Command
- `npx jest src/__tests__/candidate_profile/education.validate.test.ts src/__tests__/candidate_profile/award.validate.test.ts` (new code; then with `git show HEAD:` of both validate files swapped in, then restored — `git diff --stat` after restore shows both src files changed again)
- `npm test`
- `npm run build` (Typecheck: inside Build)
- `npx eslint .`
- per touched file: `npx eslint <4 files>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`
- comments: `git diff -U0 -- src | grep -cE '^\+.*(//|/\*)'`; `grep -nE '//|/\*' src/__tests__/candidate_profile/award.validate.test.ts`

## Output
```
new code:
PASS src/__tests__/candidate_profile/education.validate.test.ts
  schemaEducation — school
    ✓ accepts MIT (2 ms)
    ✓ accepts RMIT (1 ms)
    ✓ accepts FPT
    ✓ accepts ĐH Huế
    ✓ trims surrounding spaces from both languages of school and major (1 ms)
    ✓ accepts a short major IT
    ✓ accepts a short major Y
    ✓ accepts a missing en variant
    ✓ rejects school as a plain string (1 ms)
    ✓ rejects school without vi
    ✓ rejects an empty major vi
PASS src/__tests__/candidate_profile/award.validate.test.ts
  schemaAward — link
    ✓ accepts a link that is missing (3 ms)
    ✓ accepts a link that is empty
    ✓ accepts a link that is an https URL (5 ms)
    ✓ accepts a link that is an http URL (4 ms)
    ✓ rejects a link that is not a URL (1 ms)
    ✓ rejects a link that is a javascript: URL
    ✓ rejects a link that is longer than 100 chars
Tests:       18 passed, 18 total

old validators (git show HEAD:) + new tests:
    ✓ accepts MIT (3 ms)
    ✓ accepts RMIT (1 ms)
    ✓ accepts FPT
    ✓ accepts ĐH Huế
    ✓ trims surrounding spaces from both languages of school and major (1 ms)
    ✕ accepts a short major IT
    ✕ accepts a short major Y (1 ms)
    ✓ accepts a missing en variant
    ✓ rejects school as a plain string
    ✓ rejects school without vi
    ✓ rejects an empty major vi
    ✕ accepts a link that is missing (3 ms)
    ✓ accepts a link that is empty
    ✓ accepts a link that is an https URL (1 ms)
    ✓ accepts a link that is an http URL
    ✕ rejects a link that is not a URL (1 ms)
    ✕ rejects a link that is a javascript: URL
    ✓ rejects a link that is longer than 100 chars
Tests:       5 failed, 13 passed, 18 total
after restore, git diff --stat:
 src/__tests__/candidate_profile/education.validate.test.ts | 6 +++++-
 src/candidate_profile/awards/award.validate.ts             | 2 +-
 src/candidate_profile/education/education.validate.ts      | 2 +-

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts (5.802 s)
Test Suites: 2 failed, 64 passed, 66 total
Tests:       5 failed, 645 passed, 650 total

npm run build → tsc + copy, no "error TS" lines (tail: "> resume-nodejs-api@2.7.1 copy / > cp -R ./src/public ./dist/")
npx eslint .
✖ 274 problems (274 errors, 0 warnings)

per touched file (now | staging):
src/candidate_profile/education/education.validate.ts | ✖ 1 (10:3 no-unsafe-assignment, `_id`) | ✖ 1 (10:3 no-unsafe-assignment)
src/candidate_profile/awards/award.validate.ts | ✖ 1 (10:3 no-unsafe-assignment, `_id`) | ✖ 1 (10:3 no-unsafe-assignment)
src/__tests__/candidate_profile/education.validate.test.ts | 0 | 0
src/__tests__/candidate_profile/award.validate.test.ts | 0 | n/a (new file)
now, verbatim:
  award.validate.ts      10:3  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
  education.validate.ts  10:3  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
✖ 2 problems (2 errors, 0 warnings)

comments:
git diff -U0 -- src | grep -cE '^\+.*(//|/\*)'  → 0
grep -nE '//|/\*' award.validate.test.ts →
15:    ['an https URL', { link: 'https://example.com/award' }],
16:    ['an http URL', { link: 'http://example.com' }],
24:    ['longer than 100 chars', `https://example.com/${'a'.repeat(90)}`],
(URL literals only — no comments)
```
`npm test`: the 5 failures are the pre-existing local-env ones (atsPdfIntegration ×4 no bundled Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/parsed-entries-bulk-shape-diff.md`; 650 = 641 + 9 new cases (2 education + 7 award); 66 suites = 65 + new award suite.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) `major.vi: 'IT'` accepted | "accepts a short major IT" ✓ (✕ on old) |
| (1) empty `major.vi` still 400 on `major.vi` | "rejects an empty major vi" ✓ |
| (1) award link missing / empty / http(s) accepted | 4 "accepts a link that is …" ✓ ("missing" ✕ on old) |
| (1) non-URL / `javascript:` / > 100 → 400 on `link` | 3 "rejects a link that is …" ✓ (non-URL + `javascript:` ✕ on old) |
| (2) files pass; red on old | `18 passed, 18 total`; old `5 failed, 13 passed` |
| (3) `npm test` no new failures | `5 failed, 645 passed, 650 total` — same 5 env failures |
| (3) build clean | no `error TS` |
| (3) lint ≤ 274 | `✖ 274` |
| (3) none new in touched files | per file now = staging (the 2 pre-existing `_id` line-10 errors; new test file 0) |
| comments per code-comments.md | no comments added or changed (0 added comment lines in `src` diff; new test file has none — the 3 grep hits are URL literals) |

## Supersedes: none
`grep '#414' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- Issue names `cv-simple-sections.md`, which doesn't exist; documented in `cv-section-crud.md` instead.
- Frontend counterpart (datvt243/resume-vuejs-website form rules) not touched from here.
- An award with a stored non-URL `link` (allowed before) now 400s on its next update until the link is fixed or cleared.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
