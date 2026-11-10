# owner-export-profile-filter — implement

- Task: #400 Support `?profile=` on owner export (`GET /download-pdf`) and `POST /cv/ats-check` — https://github.com/datvt243/resume-nodejs-api/issues/400. Branch `400-support-profile-on` (base `staging` @ d685d0c)
- Node: `owner-export-profile-filter` (PENDING, `haven/diagrams/dev-loop.prime-mermaid.md`, last row, appended before any code edit)
- Plan: `evidence/implementer/2026-11-10/owner-export-profile-filter-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 96166

## Feature doc: agent-hub/doctrine/features/cv-export.md
## Feature doc changed: cv-export Behavior 2 (was "without `?profile=` filtering" → `?profile=` filters every format, same rule as public routes); ats-check Behavior 2 (query `?profile=`) + Issues line gains #400; cv-profiles Behavior 4 lists the two owner routes. One Changelog row 2026-11-10 in each, node `owner-export-profile-filter`. Authorized by the operator's recorded answer to the open question ("Change: support it — #400", 2026-11-07) in cv-export.md and cv-profiles.md.

## Diff (src + docs)
- `src/candidate_me/index.ts` `fnExportPDF`: reads `req.query.profile` (string only, else undefined) and passes `profileId` to `handlerGetAboutMe` — before the format branch, so json/docx/pdf/ats all get it. Comment in `handlerGetAboutMe` profile-resolution block: "since this is a public, unauthenticated route" → "on the public routes and the owner's export alike" (the fallback rationale no longer only applies to public routes).
- `src/candidate_me/ats-check.ts` `fnAtsCheck`: same `profileId` read from `req.query.profile`, passed to `handlerGetAboutMe`.
- Filter rule itself NOT re-implemented: `handlerGetAboutMe` already scopes the Profile lookup to `{ _id (QuerySafe), candidateId: <caller>, deletedAt: null }` and falls back to unfiltered for malformed / QuerySafe-rejected / unresolved ids — existing tests in `handlerGetAboutMe — profile filtering (issue #133)` cover those branches. The caller id comes from `req.user._id` (`verifyToken`), so a foreign profile can't resolve (IDOR).
- Swagger: `profile` query param added to `/api/v1/download-pdf` (`src/routers/api/v1/index.ts`) and `/api/v1/cv/ats-check` (`src/routers/api/v1/cv.route.ts`).
- `.claude/rules/api.md`: both endpoint rows mention `?profile=`.
- Tests (`src/__tests__/candidate_me/index.test.ts`): new describe `own-CV endpoints — ?profile= filter`, 4 cases (`it.each` over both handlers): `?profile=<id>` → `Profile.findOne` filter contains `{ _id, candidateId: <caller>, deletedAt: null }` and `Education.find` filter has `_id: { $in: <profile educationIds> }`; no `?profile` → `Profile.findOne` never called, `Education.find` filter has no `_id`. fnExportPDF runs with `format=json` (no render); fnAtsCheck is stopped right after the data fetch with `jest.spyOn(createPDF.ats, 'renderAtsPdfBuffer').mockRejectedValue(...)`, restored in `afterEach`.
- Callers: `fnExportPDF` only used by `src/routers/api/v1/index.ts:120`; `fnAtsCheck` only by `src/routers/api/v1/cv.route.ts` `router.post('/ats-check')`. `handlerGetAboutMe` signature unchanged (`profileId` already optional), so its other callers (`fnGetAboutMe`, `public-pdf.ts`) are unaffected.

## Acceptance
| Criterion | Evidence |
|---|---|
| download-pdf passes `?profile=` (every format) | `npx jest src/__tests__/candidate_me/index.test.ts` → `Tests: 58 passed, 58 total`, incl. `✓ GET /api/v1/download-pdf filters sections to the caller's own non-deleted profile` and `✓ GET /api/v1/download-pdf stays unfiltered without ?profile=`. `profileId` is read before the `format` branches (all formats share the one `handlerGetAboutMe` call). |
| ats-check passes `?profile=` | same run: `✓ POST /api/v1/cv/ats-check filters sections to the caller's own non-deleted profile`, `✓ POST /api/v1/cv/ats-check stays unfiltered without ?profile=` |
| tests prove the change (red without it) | `git stash push -- src/candidate_me/index.ts src/candidate_me/ats-check.ts` + same jest file → `✕ GET /api/v1/download-pdf filters sections …`, `✕ POST /api/v1/cv/ats-check filters sections …`, `Tests: 2 failed, 56 passed, 58 total`; stash popped after. |
| same rule as public routes (missing/invalid → unfiltered) | rule lives in `handlerGetAboutMe`, unchanged; same run still green on `✓ falls back to unfiltered data when the given profile id does not resolve for this candidate`, `✓ never queries Profile when the given id is rejected by QuerySafe`, `✓ treats a malformed profile id (abc) like no profile …` |
| swagger documents `profile` | `src/routers/api/v1/index.ts` + `src/routers/api/v1/cv.route.ts` `- in: query / name: profile` blocks; `npm run build` compiles them (doc comments, no runtime check). |
| `npm test` | `Test Suites: 2 failed, 64 passed, 66 total` / `Tests: 5 failed, 658 passed, 663 total`. The 5 failures are the same pre-existing ones recorded in `evidence/implementer/2026-11-09/dedup-visits.md` (659 total there; +4 = this node's new cases): `tokenExpiry.test.ts` `✕ falls back to a 1h access token when TOKEN_EXP_IN is unset …` and 4 in `ATS PDF integration (real Puppeteer + pdf-parse)` (`✕ renders a real PDF whose extracted text passes the full ATS check suite`, `✕ reports keyword coverage against a sample job description`, `✕ round-trips the en ATS PDF …`, `✕ round-trips the vi ATS PDF …` — needs local Chrome, see cv-export acceptance note / `CI_NO_CHROME`). None in a touched file. |
| Typecheck (`inside Build`) | `npm run build` → last lines `> resume-nodejs-api@2.7.2 copy` / `> cp -R ./src/public ./dist/`, `build exit 0`; re-run after the final test edit: `build exit 0` |
| Lint ≤ 274, none new in changed files | final `npm run lint` → `✖ 274 problems (274 errors, 0 warnings)`. First run gave 278: +4 `@typescript-eslint/unbound-method` at the new `expect(MODEL.X.find)` lines in the test; rewritten to `(… as jest.Mock).mock.calls[0][0]` (the file's existing pattern). Per-file counts after vs stashed base: `index.ts 29/29`, `ats-check.ts 5/5`, `routers/api/v1/index.ts 0/0`, `cv.route.ts 0/0`, `index.test.ts 16/16` (after the fix). |
| comments per code-comments.md | Changed: 1 line in the `/** */` block in `handlerGetAboutMe` (WHY of the fallback, now covering the owner routes). Added: `// Stop fnAtsCheck right after the data fetch — rendering is out of scope here.` in the test (1-sentence WHY, `//`). Swagger `@swagger` param blocks (functional doc). No issue refs added. |
| pdf-export-standard 10 invariants | Not applicable: no file in `src/services/createPDF*.ts` / `createDocx.ts` touched and no new format; only the aggregated input data is narrowed by the existing filter. Rendering, fonts, labels, dates, sanitization, metadata, paths unchanged. |

## Supersedes: none
No other not-yet-SEALED row on the active diagram cites #400 (`grep "#400" haven/diagrams/dev-loop.prime-mermaid.md` → only this node).

## Still open: none

## Noticed, not done
- Download filename is the same with or without `?profile=` (no profile name suffix) — not asked for.
- The ATS-check `profile` is a query param while its other options are body fields; the issue specified `?profile=`, kept as asked.
