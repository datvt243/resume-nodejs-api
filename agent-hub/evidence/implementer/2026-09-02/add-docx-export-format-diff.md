# 2026-09-02 — add-docx-export-format (diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-docx-export-format` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "#76" (GitHub issue #76 — Additional CV export formats
  (DOCX / JSON); JSON half already SEALED separately, this covers the
  remaining DOCX scope per the operator's own edit to the issue body)

See `add-docx-export-format-plan.md` (same directory) for the `pick_next`
plan this implements.

## Diff
| File | Why |
|---|---|
| `package.json` / `package-lock.json` | Added `docx` (`^9.7.1`, confirmed via `npm view docx version` before installing) — MIT-licensed, no native deps, matches the library the issue itself suggested. |
| `src/services/createDocx.ts` (new) | `buildDocxContent(RECORD)` — pure content-model builder (heading + plain-string lines per section), same input shape as `createPDF.ts`'s `getDataCandidate`. `renderDocxDocument(content)` — turns that model into an actual `docx` `Document`. `createCVDocx(data, res)` — `Packer.toBuffer()` + sends with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document` and a `Content-Disposition` filename. Mirrors sections already in the PDF path: contact info, career/careerGoal, skills, experience, projects, education, awards, certificates, foreign languages, references — same data, different renderer. |
| `src/candidate_me/index.ts` | `fnExportPDF`: added `if (req.query.format === 'docx') { await createCVDocx(data, res); return; }` — same position/shape as the existing `format === 'json'` branch, right before the `createCV(data, res)` PDF fallback. No new data-fetch: reuses the exact same `handlerGetAboutMe(email, lang)` call already made for PDF/JSON. |
| `src/routers/api/v1/index.ts` | Swagger doc only: `/download-pdf`'s `format` enum `[pdf, json]` → `[pdf, json, docx]`, added an `application/vnd.openxmlformats-officedocument.wordprocessingml.document` response content entry. No route/logic change — `router.get('/download-pdf', verifyTokenByQuery, fnExportPDF)` line itself untouched. |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | New `add-docx-export-format` PENDING row (diagram-first, per `NodeBeforeCode`). |

New test file `src/__tests__/services/createDocx.test.ts` (6 tests) — see
Command/Output below.

## Command
```
npx tsc --noEmit
```
Output: clean, no errors.

```
npm test
```
(run from repo root, copied verbatim from `doctrine/MEMORY.md`)

### Output (verbatim, tail)
```
Test Suites: 11 passed, 11 total
Tests:       60 passed, 60 total
Snapshots:   0 total
Time:        4.611 s, estimated 6 s
Ran all test suites.
```
Baseline before this change was 10 suites / 54 tests (matches the last
sealed node on this branch, `add-json-export-format`) — this change adds
exactly 1 new suite / 6 new tests (`createDocx.test.ts`), zero
regressions elsewhere.

```
npm run build
```
Output: clean, `tsc && npm run copy` completed with no errors.

## Manual live verification (`npm run dev`, real Mongo/Atlas, Redis falls
back to in-memory — same setup as the JSON export node's precedent)

Registered one throwaway account (`docxexport-check+<timestamp>@example.com`),
deleted via the self-delete endpoint afterward — same pattern as
`add-json-export-format-diff.md`.

```
POST /api/v1/auth/register → {"success":true,"message":"Đăng ký thành công",...}
GET  /api/v1/auth/login    → {"success":true,"data":{"token":"...", ...}}

GET /api/v1/download-pdf?format=docx&token=<token>
→ HTTP 200
→ Content-Disposition: attachment; filename="docxexport-check+1788349877@example.com.docx"
→ Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
→ Content-Length: 8548
→ `file` confirms: "Microsoft Word 2007+"
→ Unzipped word/document.xml and grepped: real candidate email
  ("docxexport-check+1788349877@example.com") found inside — confirms
  actual content was rendered in, not an empty valid docx.

GET /api/v1/download-pdf?token=<token>            (no format — regression check)
→ HTTP 200, Content-Type: application/pdf, Content-Length: 13469
→ `file` confirms: "PDF document, version 1.4, 1 pages"

GET /api/v1/download-pdf?format=json&token=<token> (regression check)
→ HTTP 200, real aggregated JSON payload (same shape as before)

DELETE /api/v1/candidate (Authorization: Bearer <token>)
→ {"success":true,"message":"Xoá tài khoản thành công","errors":{},"data":null}
```
Dev server stopped after the check (`pkill -f "ts-node ./src/server.ts"`,
confirmed port 3001 free afterward). Test account fully cleaned up. Also
deleted the stray `src/public/pdf/<email>.pdf` file the PDF
regression-check curl generated as a side effect of `createCV` — not left
in the repo.

## Acceptance
| Criterion | Evidence |
|---|---|
| `GET /api/v1/download-pdf?format=docx` returns a real, valid .docx | Live curl above — real HTTP 200, correct `Content-Type`/`Content-Disposition`, `file` identifies it as "Microsoft Word 2007+" |
| The .docx actually contains the candidate's real data (not empty) | Unzipped `word/document.xml`, grepped the real test account's email — found |
| Reuses existing data-fetch (no duplicate query) | `candidate_me/index.ts` diff — `handlerGetAboutMe(email, lang)` called exactly once, same as before |
| No regression to the existing PDF/JSON paths | Live curls above — both still return correct content-type/shape |
| `npx tsc --noEmit` clean | Verbatim above |
| `npm test` all pass | Verbatim above — `Tests: 60 passed, 60 total` (54 baseline + 6 new) |
| `npm run build` clean | Verbatim above |
| Diagram-first (`NodeBeforeCode`) | `add-docx-export-format` PENDING row added to `dev-loop.prime-mermaid.md` before any `src/` edit |

## Noticed, not done (out of scope)
- DOCX formatting is intentionally simple (headings + bullet lines) —
  does not attempt pixel/layout parity with the PDF's HTML/CSS-styled
  boxes. Acceptable per `SmallestDiff`: the acceptance criterion is a
  real, correctly-populated, editable Word document, not visual parity
  with the PDF.
- No `lang`-aware section titles beyond what `buildDocxContent` inherits
  from the already-resolved `RECORD` fields (`resolveLocalizedText` runs
  upstream in `candidate_me/index.ts` before this function ever sees the
  data) — same behavior as the PDF path, not a new inconsistency.
- `format` still isn't validated via Joi (loose `=== 'docx'`/`=== 'json'`
  checks, anything else falls back to PDF) — pre-existing pattern from
  the JSON export node, not introduced here.

## Seal gate
No outward-facing action yet (no commit/push) — `src/` diff shown above
(4 files touched: `package.json`, `src/services/createDocx.ts` (new),
`src/candidate_me/index.ts`, `src/routers/api/v1/index.ts`; plus
`package-lock.json` auto-updated by `npm install`) for operator review,
per seal gate. `/todo`'s stricter gate also applies this round: no
commit/push happens even after SEAL, deferred to an explicit follow-up
request.

## Status
`sealed_pending_verifier`
