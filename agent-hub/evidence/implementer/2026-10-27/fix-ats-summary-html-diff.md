# 2026-10-27 - fix-ats-summary-html (diff)

- Worker: implementer · Version: 0.1.0
- Node: `fix-ats-summary-html` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #326): "ATS PDF template prints raw <p> tags in the summary section"
- Branch: `326-ats-pdf-template`
- Status: sealed_pending_verifier

## Hub bytes before: 81191

## Diff
| File | Why |
|---|---|
| `src/services/createPDF.ats.ts:361` | `<p class="summary">${escapeHtml(content.summary)}</p>` → `<div class="summary">${sanitizeDescription(content.summary)}</div>` — same xss allow-list as descriptions (rule 6); div because CKEditor `<p>` inside `<p>` is invalid |
| `src/__tests__/services/createPDF.ats.test.ts` | new test: summary `<p>Frontend Developer</p><script>` → `<div class="summary"><p>Frontend Developer</p>`, no `&lt;p&gt;`, no `<script>` |

No comment added/changed (code-comments.md: n/a).

## Command
- `npx jest src/__tests__/services/createPDF.ats.test.ts`
- `npm test`
- `npm run build` (Typecheck)
- `npm run lint`
- `PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx jest src/__tests__/services/atsPdfIntegration.test.ts`
- Real extraction: scratch script `renderAtsPdfBuffer` (vi, introduction `<p>Frontend Developer với hơn 4 năm kinh nghiệm, hướng dẫn thành viên mới.</p>`) → `extractPdfText`, run via `npx ts-node -T -P tsconfig.json -r tsconfig-paths/register <script>`; before = `git stash` of `createPDF.ats.ts`.

## Output
```
createPDF.ats.test.ts: Tests: 19 passed, 19 total
npm test (branch): Test Suites: 2 failed, 50 passed, 52 total / Tests: 5 failed, 472 passed, 477 total
npm test (src stashed = staging): Tests: 5 failed, 471 passed, 476 total — same 5 (tokenExpiry x1, atsPdfIntegration x4)
npm run build: exit clean, ends "> cp -R ./src/public ./dist/"
npm run lint: before ✖ 274 problems / after ✖ 274 problems
atsPdfIntegration w/ system Chrome: Tests: 4 passed, 4 total
```
Extracted PDF text:
```
== after fix
TÓM TẮT
Frontend Developer với hơn 4 năm kinh nghiệm, hướng dẫn thành viên mới.
== before fix (staging)
TÓM TẮT
<p>Frontend Developer với hơn 4 năm kinh nghiệm, hướng dẫn thành viên mới.</p>
```

## Pre-existing failures (env, not this diff)
- `atsPdfIntegration` x4: "Could not find Chrome (ver. 127.0.6533.88)" in `.cache/puppeteer` — passes 4/4 with `PUPPETEER_EXECUTABLE_PATH` = system Chrome.
- `tokenExpiry` "falls back to a 1h access token": Expected 3600 / Received 10800 — local `.env` has `TOKEN_EXP_IN=3h`.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) summary via `sanitizeDescription`, no `&lt;p&gt;` | diff line 361; new test passes (19/19); extracted text "after fix" has no `<p>` |
| (2) `<script>` in summary stripped | new test `not.toContain('<script>')` passes |
| (3) unit test added | `createPDF.ats.test.ts` "renders the CKEditor-authored summary as sanitized HTML" |
| (4) test/build/lint | 472 passed, 5 failures identical on staging (env); build clean; lint 274 → 274 |
| comments per code-comments.md | no comment added |

## PDF standard (pdf-export-standard.md)
1 letter-spacing: unchanged, existing invariants test passes · 2 fonts: unchanged · 3 i18n: heading still `t('cv.summary')`, TÓM TẮT in vi extraction · 4 dates: n/a · 5 lists: n/a · 6 sanitize: this fix — summary now sanitized (was escaped, safe but wrong) · 7 forbidden fields: n/a · 8 single column: `<div>` block, no layout CSS · 9 metadata: unchanged · 10 PII paths: unchanged, in-memory.

## Supersedes: none

## Noticed, not done
- `createDocx.ts:209` puts `introduction` (and all descriptions, :115-156) into DOCX as plain text → DOCX export will also show literal `<p>`. Separate export path, not in #326's scope.
- Classic `createPDF.ts:279` injects `introduction` unsanitized (`${introduction}`) → rule 6 violation (HTML injection surface). Out of scope.
- Local env: Puppeteer Chrome not installed in `.cache/puppeteer`; `.env` `TOKEN_EXP_IN=3h` breaks `tokenExpiry` fallback test.

## Seal gate: none (no outward-facing action)
