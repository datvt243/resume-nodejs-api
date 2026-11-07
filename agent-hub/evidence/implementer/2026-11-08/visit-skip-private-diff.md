# 2026-11-08 - visit-skip-private (diff)
- Worker: implementer · Version: 0.1.0
- Node: `visit-skip-private` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #398` — "Don't record visits for private profiles"
- Plan: `evidence/implementer/2026-11-08/visit-skip-private-plan.md`

## Hub bytes before
96366

## Feature doc
`doctrine/features/profile-visits.md`

## Feature doc changed: Behavior #1 "unknown → 404 (same as public profile)" → "unknown or private (`isPublic: false`) → 404 with the same message as the public profile, nothing stored"; + Changelog row — operator: "Change: don't record, 404 like the profile — #398" (2026-11-07, recorded in the doc's Open questions)

## Diff
| file | why |
|---|---|
| `src/candidate_me/index.ts` | `handlerRecordVisit`: `.select('_id isPublic')`; `if (!candidate \|\| candidate.isPublic === false) throw profileNotFound(req.lang)` — before geo/referrer/profile work and `Visit.create`. `=== false` matches `fnGetAboutMe:77` (a doc without the field defaults to public). Comment updated |
| `src/__tests__/candidate_me/index.test.ts` | private candidate → rejects with `{ statusCode: 404, message: profileNotFound('en').message }`, `Visit.create` not called |
| `src/routers/index.ts` | swagger 404 description: "Unknown identifier or private profile (nothing recorded)" |
| `.claude/rules/api.md` | visit row: unknown or private → 404, nothing stored |

## Command
- `npx jest src/__tests__/candidate_me/index.test.ts` (new code; then with `git show HEAD:src/candidate_me/index.ts` swapped in, then restored); `--verbose -t "handlerRecordVisit"`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
npx jest src/__tests__/candidate_me/index.test.ts
Tests:       51 passed, 51 total
old handler + new test:
      ✕ 404s a private profile (isPublic: false) with the unknown-profile message, recording nothing (1 ms)
Tests:       1 failed, 50 passed, 51 total

npx jest src/__tests__/candidate_me/index.test.ts --verbose -t "handlerRecordVisit"
      ✓ fails closed and never queries the DB when the email is rejected by QuerySafe (2 ms)
      ✓ records a visit addressed by vanity slug, looked up by slug first
      ✓ falls back to email when no slug matches (1 ms)
      ✓ 404s a private profile (isPublic: false) with the unknown-profile message, recording nothing
      ✓ 404s an unknown identifier after trying slug and email, recording nothing (1 ms)
      ✓ stores only the normalized referrer hostname from the body, ignoring the Referer header
      ✓ still records the visit with a null referrer when the body has none
      ✓ stores the leftmost X-Forwarded-For IP and its geo location, not the proxy address (1 ms)
      ✓ falls back to req.ip when X-Forwarded-For is not an IP (2 ms)
      ✓ stores the body profile id when it is a non-deleted profile of the visited candidate (1 ms)
      ✓ stores null, without failing the visit, for a foreign or deleted profile id
      ✓ stores null and never queries Profile for undefined
      ✓ stores null and never queries Profile for ""
      ✓ stores null and never queries Profile for "abc"
      ✓ stores null and never queries Profile for "$gt"
      ✓ stores null and never queries Profile for "64b7f0c2a1b2c3d4e5f607990"
      ✓ stores null and never queries Profile for {"$ne": null}
      ✓ stores null and never queries Profile for ["64b7f0c2a1b2c3d4e5f60799"] (1 ms)
      ✓ stores null and never queries Profile for 42
Tests:       32 skipped, 19 passed, 51 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 62 passed, 64 total
Tests:       5 failed, 623 passed, 628 total

npm run build | grep -c "error TS"
0
npm run lint
✖ 274 problems (274 errors, 0 warnings)
per touched file (now | base):
src/candidate_me/index.ts | ✖ 29 problems | ✖ 29 problems
src/routers/index.ts | 0 | 0
src/__tests__/candidate_me/index.test.ts | ✖ 16 problems | ✖ 16 problems
```
The verbose block is the full, uncut output (19 ✓). The 5 `npm test` failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/login-password-any-length-diff.md`; 623 = 622 + 1 new test.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) Behavior #1 — private → 404, same message as public profile, nothing stored | "404s a private profile (isPublic: false) with the unknown-profile message, recording nothing" ✓ |
| (1) public profiles still recorded | "records a visit addressed by vanity slug…" ✓, "falls back to email when no slug matches" ✓ |
| (2) test file passes, red on old handler | `51 passed, 51 total`; old: `1 failed, 50 passed, 51 total` |
| (3) `npm test` no new failures | `5 failed, 623 passed, 628 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base |
| comments per code-comments.md | one `//` WHY line updated in `handlerRecordVisit`; swagger description is a functional doc block; no issue refs |

## Supersedes: none
`grep '#398' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- `src/candidate_me/index.ts` (29) and its test (16) carry pre-existing lint errors, same on staging, part of the 274 baseline.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
