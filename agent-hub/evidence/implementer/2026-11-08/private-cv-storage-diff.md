# 2026-11-08 - private-cv-storage (diff)
- Worker: implementer · Version: 0.1.0
- Node: `private-cv-storage` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #383` — "Generated PDFs and uploaded CVs are served from `public/` without auth"
- Plan: `evidence/implementer/2026-11-08/private-cv-storage-plan.md`

## Hub bytes before
96414

## Feature doc
`doctrine/features/cv-export.md`

## Feature doc changed: Behavior #8 "also written to `public/pdf/<email>.pdf` (raw email)" → "only streamed, never written to disk"; Changelog row 2026-11-08 — operator: open question "Bug — #383" (2026-11-07) + AskUserQuestion 2026-11-08 on legacy uploaded CVs → "Move them at startup (Recommended)"

## Diff
| file | why |
|---|---|
| `src/services/createPDF.ts` | `createCV`: `page.pdf` without `path`, `PDF_OUTPUT_DIR` + mkdir + unused `fs`/`path` imports removed; 1-line why comment; `renderPdfBuffer` doc comment no longer contrasts "minus the disk write" |
| `src/middlewares/uploadCV.middleware.ts` | `CV_UPLOAD_DIR` → `path.join(__dirname, '..', 'storage', 'cv')`; new `moveLegacyCvUploads(from, to)` (moves `*-cv.pdf`, new copy wins → legacy unlinked, other files ignored, no-op if old dir missing); header + constant comments updated |
| `src/server.ts` | `runServer` calls `moveLegacyCvUploads()` before `listen`, in try/catch → `logger.error`, never blocks boot; logs count when > 0 |
| `src/__tests__/services/createPDF.test.ts` | `createCV never writes the PDF to disk`: `page.pdf` called without `path`, buffer sent |
| `src/__tests__/middlewares/uploadCV.middleware.test.ts` (new) | `CV_UPLOAD_DIR` not under `public/`; move / newer-wins / no-op cases on a tmp dir |
| `.gitignore`, `.dockerignore` | `src/storage/cv/*` (real user data, never committed / never in the build context) |
| `Dockerfile` | stale comment about `dist/public/{pdf,uploads/cv}` write paths updated (comment only) |
| `agent-hub/doctrine/features/cv-export.md` | Behavior #8 + Changelog |

Readers of `CV_UPLOAD_DIR` follow the constant unchanged: `src/candidate/candidate.controller.ts:106` (`GET /cv-file`, authenticated), `src/candidate/candidate.service.ts:157` (account delete). ATS `PERSIST_EXPORTED_PDF` opt-in write (`createPDF.ats.ts:480`) untouched — see Noticed.

## Command
- `npx jest src/__tests__/services/createPDF.test.ts src/__tests__/middlewares/uploadCV.middleware.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
npx jest src/__tests__/services/createPDF.test.ts src/__tests__/middlewares/uploadCV.middleware.test.ts
Tests:       36 passed, 36 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 60 passed, 62 total
Tests:       5 failed, 594 passed, 599 total

npm run build | grep -c "error TS"
0

npm run lint
✖ 274 problems (274 errors, 0 warnings)

src/services/createPDF.ts | now: ✖ 9 problems (9 errors, 0 warnings) | base: ✖ 9 problems (9 errors, 0 warnings)
src/middlewares/uploadCV.middleware.ts | now: 0 problems | base: 0 problems
src/server.ts | now: ✖ 5 problems (5 errors, 0 warnings) | base: ✖ 5 problems (5 errors, 0 warnings)
src/__tests__/services/createPDF.test.ts | now: ✖ 4 problems (4 errors, 0 warnings) | base: ✖ 4 problems (4 errors, 0 warnings)
src/__tests__/middlewares/uploadCV.middleware.test.ts | now: 0 problems | base: (new file)
```
The 5 failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/public-profile-field-whitelist-diff.md`; +5 passed / +1 suite = the new tests.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) `createCV` writes nothing to disk | test "renders to a buffer only — page.pdf gets no path" in `Tests: 36 passed, 36 total`; `PDF_OUTPUT_DIR` removed |
| (2) `CV_UPLOAD_DIR` outside `public/` | test "CV_UPLOAD_DIR is not under the express.static public/ root"; constant diff |
| (3) legacy move: move / newer wins / ignores other files / no-op; boot never crashes | 3 `moveLegacyCvUploads` tests; `server.ts` try/catch → `logger.error` |
| (4) test files pass | `Tests:       36 passed, 36 total` |
| (5) `npm test` no new failures | `5 failed, 594 passed, 599 total` — same 5 env failures |
| (5) build clean | `0` `error TS` |
| (5) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base |
| comments per code-comments.md | why-comments only, no issue refs in `src/` non-test code |

## Supersedes: none
`grep '#383' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- `createPDF.ats.ts:480` still writes `public/pdf/<slug>-ats.pdf` when the opt-in `PERSIST_EXPORTED_PDF` env is set (debug aid, off by default, documented in `cv-export.md` Behavior #8) — still under `express.static` when enabled; out of the issue's scope.
- `doctrine/domains/PROJECT.md:53` trap ("anything under `src/public/` is unauthenticated") still true for `uploads/images/` (public section images, intended); its PDF/CV examples are now historical.
- The old `src/public/uploads/cv/.gitkeep` is kept so the legacy folder still exists for the boot move; can go once every deploy has migrated.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge`.
