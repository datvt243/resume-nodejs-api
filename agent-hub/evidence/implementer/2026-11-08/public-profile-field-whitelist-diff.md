# 2026-11-08 - public-profile-field-whitelist (diff)
- Worker: implementer · Version: 0.1.0
- Node: `public-profile-field-whitelist` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #382` — "Public profile payload exposes every candidate field except password"
- Plan: `evidence/implementer/2026-11-08/public-profile-field-whitelist-plan.md`

## Hub bytes before
96417

## Feature doc
`doctrine/features/public-profile.md`

## Feature doc changed: Behavior #3 "200 with the candidate (password, `__v`, timestamps removed)" → "200 with only the public candidate fields firstName, lastName, introduction, socialMedia, slug, email, phone, address (every other candidate field … dropped)"; Open question #382 answer extended; Changelog row 2026-11-08 — operator: AskUserQuestion 2026-11-08 "which personal fields should stay in the public profile?" → "email, phone, address"

## Diff
| file | why |
|---|---|
| `src/candidate_me/index.ts` | `PUBLIC_PROFILE_FIELDS` whitelist (8 candidate fields + 7 section keys); `fnGetAboutMe` filters `_me.data` to it after the `isPublic` check. `handlerGetAboutMe` untouched — shared with owner export (`index.ts`), `ats-check.ts`, `public-pdf.ts` |
| `src/__tests__/candidate_me/index.test.ts` | "GET /api/me/:email returns only the public whitelist of candidate fields": full candidate doc (birthday, gender, marital, cvFile, cvFileName, emailVerified, isPublic, `_id`) → response keys = exactly the 15 whitelisted |
| `agent-hub/doctrine/features/public-profile.md` | Behavior #3, open-question answer, Changelog |

Swagger (`src/routers/index.ts` `/api/me/{email}`) lists no candidate fields → unchanged.

## Command
- `npx jest src/__tests__/candidate_me/index.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; touched files `npx eslint src/candidate_me/index.ts src/__tests__/candidate_me/index.test.ts` with and without the diff (`git stash`)

## Output
```
npx jest src/__tests__/candidate_me/index.test.ts
Tests:       50 passed, 50 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 59 passed, 61 total
Tests:       5 failed, 589 passed, 594 total

npm run build | grep -c "error TS"
0

npm run lint
✖ 274 problems (274 errors, 0 warnings)

touched files, with diff:    ✖ 45 problems (45 errors, 0 warnings)
touched files, without diff: ✖ 45 problems (45 errors, 0 warnings)
```
The 5 failures are the pre-existing local-env ones (atsPdfIntegration ×4: local Chrome, also fail on a clean `origin/staging` worktree; tokenExpiry ×1: local `.env`), same as `candidate-email-self-only` (`evidence/implementer/2026-11-08/candidate-email-self-only-diff.md`); +1 passed = the new test.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) public response = whitelist only; matches Behavior #3 (updated) | new test asserts exact key set; `Tests: 50 passed, 50 total` |
| (2) test file passes | `Tests:       50 passed, 50 total` |
| (3) `npm test` no new failures | `5 failed, 589 passed, 594 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; touched 45 → 45 |
| comments per code-comments.md | one 1-line why comment above the whitelist, no issue ref |

## Supersedes: none
`grep '#382' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- The public PDF (`public-pdf.ts`) still receives the full record internally; it only uses `cvFileName` for the filename and renders no birthday/gender/marital — no exposure, left as is.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge`.
