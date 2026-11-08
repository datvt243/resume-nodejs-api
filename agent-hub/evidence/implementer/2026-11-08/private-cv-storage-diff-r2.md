# 2026-11-08 - private-cv-storage (diff, round 2)
- Worker: implementer · Version: 0.1.0
- Node: `private-cv-storage` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #383` — REOPEN round 1 (`evidence/verifier/2026-11-08/private-cv-storage-reopen.md`): (1) no `doctrine/standards/pdf-export-standard.md` rule-by-rule check although `src/services/createPDF.ts` is touched; (2) node criterion (1) "matches `features/candidate-account.md` CV paths" had no Acceptance row.
- Round 1 note (diff, commands, outputs unchanged — no code change in round 2): `evidence/implementer/2026-11-08/private-cv-storage-diff.md`

## Hub bytes before
96414

## Feature doc
`doctrine/features/cv-export.md` (changed in round 1, see round 1 note). `doctrine/features/candidate-account.md` — unchanged, see Acceptance row below.

## Diff (round 2 delta)
None in `src/` — evidence-only round.

## Command
- `git diff origin/staging -U0 -- src/services/createPDF.ts | grep '^@@'`
- `grep -n "fs\.\|writeFile\|public\|path:" src/services/createPDF.ts`
- `grep -n "^export const createCV\|^export const renderPdfBuffer\|^export const pageRender\|^const getHTMLLayout" src/services/createPDF.ts`
- `git diff origin/staging --stat -- src/services/createPDF.ats.ts src/services/createDocx.ts`
- `grep -n -i "path\|disk\|uploads\|public" doctrine/features/candidate-account.md` (for the CV-paths row)

## Output
```
$ git diff origin/staging -U0 -- src/services/createPDF.ts | grep '^@@'
@@ -8,2 +7,0 @@ import puppeteer, { Browser } from 'puppeteer';
@@ -28,14 +25,0 @@ import {
@@ -48,3 +31,0 @@ export const createCV = async (data: AggregatedCandidateData, res: Response, opt
@@ -67 +48 @@ export const createCV = async (data: AggregatedCandidateData, res: Response, opt
@@ -73,0 +55 @@ export const createCV = async (data: AggregatedCandidateData, res: Response, opt
@@ -75 +56,0 @@ export const createCV = async (data: AggregatedCandidateData, res: Response, opt
@@ -95 +76 @@ export const createCV = async (data: AggregatedCandidateData, res: Response, opt

$ grep -n "fs\.\|writeFile\|public\|path:" src/services/createPDF.ts
55:    // Buffer only, never written under public/ — express.static would serve it without auth.

$ grep -n "^export const createCV\|^export const renderPdfBuffer\|^export const pageRender\|^const getHTMLLayout" src/services/createPDF.ts
29:export const createCV = ...
82:export const renderPdfBuffer = ...
103:export const pageRender = ...
459:const getHTMLLayout = ...

$ git diff origin/staging --stat -- src/services/createPDF.ats.ts src/services/createDocx.ts
(no output — both files unchanged)
```
Every hunk is at new line ≤ 76, i.e. inside the imports, the removed `PDF_OUTPUT_DIR` block, `createCV`'s disk-write lines (mkdir/`URL`/`email` destructure/`path:`) and `renderPdfBuffer`'s doc comment (old line 95). `pageRender` (line 103) and `getHTMLLayout` (line 459) — the whole HTML/CSS template, labels, dates, skills, sanitization — have no hunk, so the rendered HTML handed to `page.setContent` is byte-identical to `staging`; only `page.pdf`'s options lose `path`.

## pdf-export-standard.md — rule by rule
| Rule | Status | Evidence |
|---|---|---|
| 1 No `letter-spacing` | unchanged by this diff | no hunk in `pageRender`/`getHTMLLayout` (CSS lives there); output HTML identical → extracted text identical to staging |
| 2 No network fonts / wait for fonts | unchanged | `page.setContent(..., { waitUntil: 'domcontentloaded' })` and template `<head>` not in any hunk |
| 3 Labels / `<html lang>` / `<title>` follow `lang` | unchanged | template + `options.lang` handling not in any hunk (`lang` still only reaches `cvFilename`) |
| 4 Dates `MM/YYYY` zero-padded | unchanged | `formatDate` is below line 103, no hunk |
| 5 Per-item list fields render | unchanged | `getSkills`-style helpers below line 103, no hunk |
| 6 Free text sanitized | unchanged | sanitization in `pageRender` path, no hunk |
| 7 No DOB/gender/marital/photo | unchanged | template field selection below line 103, no hunk |
| 8 ATS single-column | n/a | `classic`/`modern` is the non-ATS visual template (explicit carve-out); `createPDF.ats.ts` unchanged |
| 9 PDF metadata | unchanged | classic path never set metadata (ATS path does, `createPDF.ats.ts` unchanged) |
| **10 No PII on disk, nothing under `public/`** | **now satisfied for classic/modern** — this is the fix | before: `page.pdf({ path: \`${PDF_OUTPUT_DIR}/${email}.pdf\` })` under `public/pdf/` with the raw email in the filename; after: no `fs`, no `path:`, no `public` in `createPDF.ts` (grep above: only the comment on line 55); `res.send(pdfBuffer)` only; test "renders to a buffer only — page.pdf gets no path, the buffer is sent" (round 1, `Tests: 36 passed, 36 total`). Uploaded CVs: `CV_UPLOAD_DIR` now `storage/cv/` (test "CV_UPLOAD_DIR is not under the express.static public/ root"); filename stays `<candidateId>-cv.pdf` (id, not PII). **Pre-existing exception, not touched:** `createPDF.ats.ts:480` still writes `public/pdf/<slug-email>-ats.pdf` when the opt-in `PERSIST_EXPORTED_PDF` is set (off by default) — out of #383's scope, listed under Noticed in round 1 |

Rules 1-5 asked for extracted-text evidence "unless the note shows the template output didn't change" (REOPEN reason 1) — the hunk list above is that evidence.

## Acceptance (round 2 additions; round 1 rows unchanged)
| Criterion | Evidence |
|---|---|
| pdf-export-standard.md rules 1-10 | table above |
| (1) matches `features/candidate-account.md` CV paths | the doc names no on-disk CV path (Behavior #6: "the uploaded CV file on disk" only; verifier round 1 confirmed the same) → consistent with `storage/cv/`; account delete still removes it via `CV_UPLOAD_DIR` (`src/candidate/candidate.service.ts:157`, unchanged) |
| comments per code-comments.md | unchanged from round 1 |

## Supersedes: none
## Still open: none
## Noticed, not done
- (round 1) `PERSIST_EXPORTED_PDF` opt-in ATS write under `public/pdf/` — breaks rule 10's "even then never under `public/`"; pre-existing, candidate for its own issue.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge`.
