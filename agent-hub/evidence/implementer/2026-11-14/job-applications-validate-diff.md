# 2026-11-14 - job-applications-validate (diff)

- Worker: implementer · Version: 0.1.0
- Node: `job-applications-validate` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING — state not touched by implementer)
- Branch: `409-job-applications-validate` (from `staging` @ 72cd118)
- Task (verbatim): "#409 Job applications: validate `jobLink` as an http(s) URL — Optional, but when present it must be an http/https URL, else 400 with the field in `details`. Issue https://github.com/datvt243/resume-nodejs-api/issues/409, branch 409-job-applications-validate. Spec: agent-hub/doctrine/features/job-applications.md"
- Plan: `evidence/implementer/2026-11-14/job-applications-validate-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 96759

## Feature doc: doctrine/features/job-applications.md
## Feature doc changed: Behavior #2 `jobLink (≤ 500)` → `jobLink (≤ 500; '' or an http/https URL, else 400 with details[].field = "jobLink")`; acceptance criterion added "Create with `jobLink: "ftp://…"` → HTTP 400, `details` has field `jobLink`"; `## Changelog` row 2026-11-14 — operator: "Change: validate http(s) URL when present — #409" (doc's Open questions #1, answered 2026-11-07)

## Diff
| File | Why |
|---|---|
| `src/candidate_profile/application/application.validate.ts:19` | `jobLink` adds `.uri({ scheme: ['http', 'https'] })` — same idiom as `award.validate.ts:14`; `.allow('')` keeps empty/absent valid |
| `src/__tests__/candidate_profile/application.service.test.ts` | New `schemaApplication jobLink` block (accepts `''`/http/https; rejects bare host, `ftp://`, `javascript:`, >500 chars) + `POST /application/create with a non-http(s) jobLink` (400, `details[0].field === 'jobLink'`, service not called) |
| `src/config/swagger.config.ts:287` | Application schema `jobLink` documents maxLength 500 + http(s)-or-'' rule (keep Swagger in sync per `.claude/rules/api.md`) |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, verbatim from `doctrine/MEMORY.md`:
1. `npx jest src/__tests__/candidate_profile/application.service.test.ts` (Test one file)
2. `npm test` (Test)
3. `npm run build` (Typecheck = inside Build)
4. `npm run lint` (Lint, baseline 274)
5. Baseline comparison: `git stash push -- src` → `npm test` + `npx eslint src/candidate_profile/application/application.validate.ts` → `git stash pop`

## Output
1. Test one file (after fixing my own first-draft controller test, which wrongly expected the validation error via `next`; `BaseController.fnCreate` answers validation failures directly via `formatReturn` — `BaseController.ts:215-216`):
```
  schemaApplication jobLink
    ✓ accepts ""
    ✓ accepts "http://acme.com/jobs/1" (5 ms)
    ✓ accepts "https://acme.com/jobs?id=1" (4 ms)
    ✓ rejects "acme.com/jobs" (1 ms)
    ✓ rejects "ftp://acme.com/jobs"
    ✓ rejects "javascript:alert(1)"
    ✓ rejects "https://acme.com/aaaa…(500 a's)"
  POST /application/create with a non-http(s) jobLink
    ✓ answers 400 with jobLink in details (2 ms)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
```
(The 500-char test name is shortened above only because the `a` run is 500 characters long; it's the sole change from the real output.)

2. `npm test` with diff:
```
Test Suites: 2 failed, 64 passed, 66 total
Tests:       5 failed, 669 passed, 674 total
```
Failing: `src/__tests__/auth/tokenExpiry.test.ts` (1 — `Expected: 3600` / `Received: 10800`, "falls back to a 1h access token when TOKEN_EXP_IN is unset") and `src/__tests__/services/atsPdfIntegration.test.ts` (4 — `Could not find Chrome (ver. 127.0.6533.88)`).
   `npm test` on base (`git stash push -- src`, no diff):
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Tests:       5 failed, 661 passed, 666 total
```
   → same 5 failures pre-exist, environment-only (local env TOKEN_EXP_IN value; no local Chrome for Puppeteer). Diff adds +8 tests, all passing; 0 new failures.

3. `npm run build`:
```
> tsc && npm run copy
> resume-nodejs-api@2.7.2 copy
> cp -R ./src/public ./dist/
build exit=0
```

4. `npm run lint`:
```
✖ 274 problems (274 errors, 0 warnings)
```
   `npx eslint` on the 3 changed files: 1 error, `application.validate.ts 11:3 @typescript-eslint/no-unsafe-assignment` (the `_id` import line, untouched). Same file on base: `✖ 1 problem (1 error, 0 warnings)` → pre-existing, not on a changed line.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. absent / `''` accepted | `✓ still accepts an application without profileId` (no jobLink) + `✓ accepts ""` |
| 2. http/https accepted | `✓ accepts "http://acme.com/jobs/1"`, `✓ accepts "https://acme.com/jobs?id=1"` |
| 3. other values rejected | `✓ rejects "acme.com/jobs"`, `✓ rejects "ftp://acme.com/jobs"`, `✓ rejects "javascript:alert(1)"`, `✓ rejects "https://acme.com/aaa…"` (>500) |
| 4. create → 400 + `details` field `jobLink` | `✓ answers 400 with jobLink in details` |
| 5. tests + typecheck | one file: `Tests: 25 passed, 25 total`; `npm test`: `5 failed, 669 passed, 674 total` — the 5 are identical on base (`5 failed, 661 passed, 666 total`); `npm run build` exit=0 |
| 6. lint ≤ 274, none new in changed files | `✖ 274 problems (274 errors, 0 warnings)`; the only changed-file error (`application.validate.ts:11`) is identical on base |
| 7. comments per code-comments.md | no comments touched (Swagger `description` is API doc text, not a code comment) |

## Supersedes: none
## Still open: none (#410 is a separate issue, no diagram row yet)

## Noticed, not done
- Lint error in touched file `application.validate.ts:11:3` (`no-unsafe-assignment` on the `_id` key): `_id` = `objectIdValidator.objectId().required()` (`src/config/joi.config.ts:33`, joi-objectid extension typed `any`). Pre-existing (identical on base, see Output 4) and systemic — `npx eslint src/candidate_profile/*/*.validate.ts | grep -c no-unsafe-assignment` → `10`. Not fixed here per `implement.md` failure branch "Lint/typecheck reports errors the diff didn't introduce" (SmallestDiff); fix belongs at `joi.config.ts` in the lint initiative, not in this node.
- `src/locales/{en,vi}.ts` `joiErrors` has no `string.uriCustomScheme` / `string.uri` template → the `details[].message` falls back to Joi's English message (`"jobLink" must be a valid uri with a scheme matching the http|https pattern`) even for `lang=vi` — verified with `npx ts-node -r tsconfig-paths/register -T -e "…formatValidateError(error, 'vi')…"` → `[{"field":"jobLink","message":"\"jobLink\" must be a valid uri with a scheme matching the http|https pattern"}]`. Same pre-existing gap for `award.link`. Candidate small node: add the template in both locales.
- Pre-existing env-only test failures: `tokenExpiry.test.ts` reads the real `TOKEN_EXP_IN` from local `.env` (10800) so its "unset" fallback test fails locally; `atsPdfIntegration.test.ts` needs Chrome (`CI_NO_CHROME` skip not set locally).
- Existing rows with a stored non-URL `jobLink` will now fail validation when updated via `PUT /update` (full-object update) until the user fixes or clears the link. No data migration was in scope (the operator decided validate-when-present).

## Seal gate: none (no commit/push/external call — `/ship` handles it)
