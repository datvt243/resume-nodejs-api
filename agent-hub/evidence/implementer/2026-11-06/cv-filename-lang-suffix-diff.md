# 2026-11-06 - cv-filename-lang-suffix (diff)
- Worker: implementer · Version: 0.1.0
- Node: `cv-filename-lang-suffix` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #375` — "feat(download): thêm hậu tố ngôn ngữ _VI/_EN vào tên file CV"
- Branch: `375-feat-download-thêm` (off `staging` @ 8892b14, via `gh issue develop`)
- Status: sealed_pending_verifier

## Hub bytes before
83637

## Diff
| file | why |
|---|---|
| `src/services/createPDF.ats.ts` | `cvFilename` takes required `lang` in its object arg; appends `_${lang.toUpperCase()}` unless slugified base matches `/_(vi\|en)$/i`. ATS call passes `options.lang ?? 'vi'` (same default `renderAtsPdfBuffer` uses) |
| `src/services/createPDF.ts` | `createCV` options gain `lang?: SupportedLang`; passes `options.lang ?? 'vi'` |
| `src/services/createDocx.ts` | `createCVDocx` gains 4th param `lang: SupportedLang = 'vi'` (kept positional to match its existing `theme` param) |
| `src/candidate_me/public-pdf.ts` | passes already-resolved `lang` |
| `src/candidate_me/index.ts` | `fnExportPDF` passes its resolved `lang` (`:333`) to `createCVDocx` and `createCV` — previously only ATS got it |
| `src/config/swagger.config.ts` | `cvFileName` description mentions the suffix |
| `.claude/rules/models.md` | Candidate.cvFileName doc line mentions the suffix |
| `src/__tests__/services/createPDF.test.ts` | `cvFilename` table now vi/en × with/without cvFileName × already-suffixed (`_VI`, ` en`, `_Vi ` mixed case w/ other lang) × `venv` (ends `en` but no `_` → still suffixed); classic `createCV` en case |
| `src/__tests__/services/createDocx.test.ts` | expected names `_VI`; new `en` case |
| `src/__tests__/candidate_me/public-pdf.test.ts` | expected names: `lang=en` → `_EN`, no lang → `_VI` |

Design deviation from issue sketch: `lang` is a required field of the object arg rather than a defaulted 3rd positional — tsc then forces every one of the 4 callers to pass it (verified: build clean only after all 4 updated).

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api`:
1. `npx jest src/__tests__/services/createPDF.test.ts src/__tests__/services/createDocx.test.ts src/__tests__/candidate_me/public-pdf.test.ts src/__tests__/services/createPDF.ats.test.ts`
2. `npm test`
3. `npm run build` (Typecheck row = inside Build)
4. `npm run lint`
5. Baseline: `git stash -- src` → `npm test` + `npm run lint` → `git stash pop`

## Output
1. ```
Test Suites: 4 passed, 4 total
Tests:       75 passed, 75 total
```
2. After diff:
```
    ✕ falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default) (10 ms)
    ✕ renders a real PDF whose extracted text passes the full ATS check suite (6 ms)
    ✕ reports keyword coverage against a sample job description
    ✕ round-trips the en ATS PDF through the PDF CV import parser (2 ms)
    ✕ round-trips the vi ATS PDF through the PDF CV import parser (1 ms)
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 572 passed, 577 total
```
   Failure reasons (verbatim excerpts):
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
    Expected: 3600
    Received: 10800
FAIL src/__tests__/services/atsPdfIntegration.test.ts (5.784 s)
    Could not find Chrome (ver. 127.0.6533.88). This can occur if either
     1. you did not perform an installation before running the script (e.g. `npx puppeteer browsers install chrome`) or
```
3. `npm run build` → tsc exit clean, ends:
```
> resume-nodejs-api@2.6.1 copy
> cp -R ./src/public ./dist/
```
4. `✖ 274 problems (274 errors, 0 warnings)`
5. Baseline (base `staging`, src stashed):
```
    ✕ falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default) (34 ms)
    ✕ renders a real PDF whose extracted text passes the full ATS check suite (87 ms)
    ✕ reports keyword coverage against a sample job description (1 ms)
    ✕ round-trips the en ATS PDF through the PDF CV import parser (3 ms)
    ✕ round-trips the vi ATS PDF through the PDF CV import parser (2 ms)
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 566 passed, 571 total
```
   Lint before vs after: file list + `problems` line `diff` → `same-files`; per-message (position-stripped) sorted diff → `same-messages`.

## Acceptance
| Criterion | Evidence |
|---|---|
| `download-pdf?lang=en` → `_EN.pdf`; none/vi → `_VI.pdf` (classic) | createPDF.test.ts `createCV` cases: `Vo_Dat_CV_2026_VI.pdf` (no lang), `Dat_Vo_Backend_Developer_CV_EN.pdf` (`lang:'en'`); controller passes `lang` (`index.ts:364`) — Output 1 `75 passed` |
| ATS PDF | `createPDF.ats.ts:485` passes `options.lang ?? 'vi'`; controller already passes `{ lang }` (`index.ts:360`); covered by `cvFilename` unit table. No dedicated createCVAts header test (not added — same function, typed required arg) |
| public PDF | public-pdf.test.ts: `lang=en` → `Vo_Tan_Frontend_Developer_CV_EN.pdf`, default → `Dat_Vo_CV_VI.pdf` — Output 1 |
| DOCX | createDocx.test.ts: `Dat_Vo_CV_VI.docx`, `Dat_Vo_CV_CV_VI.docx`, `Dat_Vo_CV_EN.docx` — Output 1 |
| No double suffix, case-insensitive | table rows `Dat CV_VI`→`Dat_CV_VI.pdf`, `dat cv en`→`dat_cv_en.pdf`, `Dat CV_Vi `+en→`Dat_CV_Vi.pdf` — Output 1 |
| Tests updated + swagger | Diff table; `swagger.config.ts:155` |
| No new test failures | 5 failures identical by name before/after (Output 2 vs 5); both env-caused (local Chrome missing; local `.env` TOKEN_EXP_IN=3h) — +6 tests, all new pass |
| Typecheck | Output 3 build clean |
| Lint ≤ 274, none new in changed files | Output 4 + `same-messages` |
| comments per code-comments.md | 2 touched: `cvFilename` JSDoc (extended, WHY — distinguishes languages, kept `/** */`); new `//` one-liner in body explains WHY of the regex skip. No `(#N)` refs |
| PDF export standard (10 invariants) | Only the `Content-Disposition` filename changes — no rendered HTML/PDF/DOCX content touched, so letter-spacing/fonts/i18n labels/dates/lists/sanitized HTML/no DOB-photo/single-column/metadata are N/A (render path unchanged; no rendered-text extraction needed). On-disk path: unchanged (`slugifyFilename(email)` for ATS persist / email for classic — pre-existing, untouched). Filename stays slug-only `[A-Za-z0-9_]` + `_VI`/`_EN` → still header-safe |

## Supersedes: none
(grep of active diagram for `#375` → only this node)

## Still open: none

## Noticed, not done
- `atsPdfIntegration.test.ts` fails locally without Chrome instead of skipping — CLAUDE.md says it's skipped only when `CI_NO_CHROME` is set; local machine has neither. Env, not code.
- `tokenExpiry.test.ts` "unset" case reads the local `.env`'s TOKEN_EXP_IN (3h) — test isn't isolated from `.env`. Pre-existing.

## Seal gate
none (no commit/push; `gh issue develop` created the remote branch per `/todo` Bước 0)
