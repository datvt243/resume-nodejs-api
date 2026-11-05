# 2026-11-05 - add-cv-file-name
- Worker: implementer · Version: 0.1.0
- Node: `add-cv-file-name` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: GitHub #363 "feat(candidate): thêm field cvFileName làm tên file khi download CV PDF" — via `/todo "fix hết 4 issues"`, branch `363-feat-candidate-thêm` (off staging @ b088a3c)

## Hub bytes before: 84303
(measured after adding this node's own PENDING row)

## Decisions (issue said "chốt khi implement")
- Field on **Candidate** (one name per candidate), set via `PATCH /candidate` (`schemaCandidatePatch`, next to `slug`/`isPublic`).
- Two layers: Joi rejects `/ \ " CR LF` and > 100 chars (400); at use, `slugifyFilename` keeps only `[A-Za-z0-9_]` — so the header can never carry a quote/CRLF/path even for a value stored before validation.
- One helper `cvFilename({ cvFileName, content }, ext)` replaces `atsPdfFilename` (its 2 callers migrated; no other reference: `grep -rn atsPdfFilename src` → none). Classic PDF and DOCX get the same fallback name by calling the pure `buildAtsContent({ RECORD: data })` for `fullName`/`headline`.
- Trap found + fixed in the shared slugifier: NFD does not decompose `đ/Đ`, so "Đạt" slugified to "at" (pre-existing for ATS filenames, would hit most Vietnamese `cvFileName` values) → explicit `đ→d`, `Đ→D`.
- Public PDF cache key is `JSON.stringify(data)` (`public-pdf.ts:41`), and the filename is computed outside the cache from `data`, so a changed `cvFileName` is never served stale.

## Diff
| File | Why |
|---|---|
| `src/models/candidate.model.ts` | `cvFileName: String, default ''` |
| `src/candidate/candidate.validate.ts` | Joi `cvFileName` (trim, max 100, no `\ / " CR LF`, allow '') |
| `src/utils/querySafe.ts` | `cvFileName` in `candidateQuerySafe` allow-list — `candidate.service.ts:83` selects the PATCH response through `whitelistSelect`, without it the updated value is not echoed back |
| `src/types/candidate.type.ts` | `AggregatedCandidateData.cvFileName?` |
| `src/services/createPDF.ats.ts` | `cvFilename()` helper; `đ/Đ` slugify fix; ATS download uses it |
| `src/candidate_me/public-pdf.ts` | public PDF uses `cvFilename` |
| `src/services/createPDF.ts` | classic PDF now sets `Content-Disposition: attachment` (had none) |
| `src/services/createDocx.ts` | DOCX name via `cvFilename(…, 'docx')` — no more `<email>.docx` |
| `src/config/cors.config.ts` | `exposedHeaders: ['Content-Disposition']` |
| `src/config/swagger.config.ts`, `.claude/rules/models.md` | Candidate `cvFileName` |
| tests | new `candidate/candidate.validate.test.ts` (9); `createPDF.test.ts` (+8, fake res gains `setHeader`); `createDocx.test.ts` (+2); `public-pdf.test.ts` (+1); `cors.config.test.ts` (+1) |

## Command
- `npx jest src/__tests__/candidate src/__tests__/services/createDocx.test.ts src/__tests__/services/createPDF.test.ts src/__tests__/candidate_me src/__tests__/config/cors.config.test.ts`
- `npm test` · `npm run build` · `npm run lint` · `npx eslint` on touched files (after vs `git stash -- src`)

## Output
```
# first targeted run: 7 failed — e.g.
#   Expected: "attachment; filename=\"Vo_Dat_CV_2026.pdf\""  Received: "attachment; filename=\"Vo_at_CV_2026.pdf\""
#   → đ/Đ slugify trap above, fixed in slugifyFilename; plus 1 wrong expectation in my own test (CR/LF are real chars, not "\r\n" text)
# targeted run after fix
Tests:       280 passed, 280 total
# npm test (staging baseline after #362 merge = 548 total, 5 failed)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 564 passed, 569 total
# npm run build
build_exit=0
# npm run lint — first run 275 (1 new: no-unnecessary-type-assertion, my `as any` at createPDF.test.ts:335) → removed
✖ 274 problems (274 errors, 0 warnings)
# npx eslint 10 touched source files: 11 errors before (git stash -- src) = 11 errors after, same rules/lines:
#   candidate.validate.ts 11:3, 25:3 no-unsafe-assignment (`_id` lines, unchanged)
#   createPDF.ts 253-319 (9×) no-unused-expressions (template-building code, untouched)
# after removing the cast: createPDF.test.ts → Tests: 26 passed, 26 total; build_exit=0
```
The 5 `npm test` failures are the baseline `tokenExpiry` (local `.env`) + `atsPdfIntegration` (no Chrome).

## Acceptance
| Criterion | Evidence |
|---|---|
| Set `cvFileName` via API; dangerous chars → 400 | `candidate.validate.test.ts`: accepts '', Vietnamese, dots, 100 chars; rejects slash, backslash, `"`, CR/LF, 101 chars on path `cvFileName` |
| Sanitised when used (no header injection / traversal) | `cvFilename` cases `'../../etc/passwd'` → `etc_passwd.pdf`, quote+CRLF payload → `a_filename_evil_exe_X_Injected_1.pdf` |
| Every download uses `cvFileName`; fallback as before | classic: "createCV sends the classic PDF as an attachment named from cvFileName" / "falls back to <fullName>_<headline>_CV … never the email"; ATS+public: "names the attachment from the candidate cvFileName when set" + existing `Vo_Tan_Frontend_Developer_CV.pdf` test still green; DOCX: "uses cvFileName when set", "falls back to the name, never the email" |
| `Content-Disposition` readable cross-origin | cors test "exposes Content-Disposition …" |
| `cvFileName` in GET candidate + public resume | code path: GET candidate `findById().select('-password')` (`candidate.service.ts:59`) and public `findOne(…, { __v:0, createdAt:0, updatedAt:0, candidateId:0 })` (`candidate_me/index.ts:88`) are exclusion-only → new path returned; PATCH response via allow-list entry (diff). No dedicated DB test (mocked-model suites only) |
| Swagger, models.md, tests | diff rows; 569 total vs 548 (+21) |
| Typecheck (inside Build) | build_exit=0 |
| Lint ≤ 274, none new in touched files | 274; touched-file errors identical before/after |
| comments per code-comments.md | 1-line WHY on Joi pattern, CORS, đ/Đ; JSDoc on exported `cvFilename`; model comment in the file's existing Vietnamese style |

## Supersedes: none
## Noticed, not done
- `slugifyFilename` turns `.` into `_` (`cv.final` → `cv_final.pdf`) — kept, matches existing ATS naming.
- Fallback for a candidate with no headline is `<name>_CV_CV.<ext>` (pre-existing ATS format).
- Clients (`resume-vuejs-website`, `datvt243.github.io`) need their own change to set/read `cvFileName` and to read the header.
## Seal gate: covered by operator "Approve all 4" (AskUserQuestion, this session) — ship after SEAL only
