# 2026-08-29 — add-json-export-format (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-json-export-format` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "#76" (GitHub issue #76 — Additional CV export formats
  (DOCX / JSON))

## Scope resolved (operator, via `AskUserQuestion`)
Issue #76 itself suggests splitting into two separate pieces of work
(JSON near-free, DOCX needs a new dependency + template). Ambiguous which
to do without asking (`pick_next` failure branch: "Task is ambiguous ->
Stop and ask, don't guess"):
1. **Scope**: JSON export only this round — matches the issue's own
   framing, no new dependency, smallest diff. DOCX left as a separate
   follow-up node (needs a library decision, e.g. `docx` npm package, and
   a new template).
2. **Endpoint shape**: `?format=json` on the EXISTING
   `GET /api/v1/download-pdf` route — not a new `/export` endpoint. Reuses
   the route, auth (`verifyTokenByQuery`), and Swagger doc entry that
   already exist; smallest change to wiring.

## Diff
| File | Why |
|---|---|
| `src/candidate_me/index.ts` | `fnExportPDF`: destructured `message` alongside the existing `success`/`data` from `handlerGetAboutMe`'s return, added an early branch — `if (req.query.format === 'json') { formatReturn(res, { success, message, data }); return; }` — placed right after the existing `!success` guard and before `createCV(data, res)`. No new data-fetch: reuses the exact same `handlerGetAboutMe(email, lang)` call the PDF path already makes. Any other/missing `format` value falls through unchanged to the pre-existing `createCV(data, res)` PDF path — zero behavior change for existing callers. |
| `src/routers/api/v1/index.ts` | Swagger doc only: added a `format` query param (`enum: [pdf, json]`, default `pdf`) and an `application/json` response content entry alongside the existing `application/pdf` one, on the same `/download-pdf` doc block. No route/logic change here — `router.get('/download-pdf', verifyTokenByQuery, fnExportPDF)` line itself is untouched. |

No new npm dependency. `services/createPDF.ts` untouched — DOCX explicitly
out of scope this round.

## Command
```
npm run build
```
Output: clean, `tsc && npm run copy` completed with no errors.

```
npm test
```
(run from `/Users/_david/Workspace/Project/ResumeAPI/backend`, copied
verbatim from `doctrine/MEMORY.md`)

### Output (verbatim, tail)
```
Test Suites: 10 passed, 10 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        4.518 s, estimated 5 s
Ran all test suites.
```
Same 10 suites / 52 tests as the prior sealed baseline
(`consolidate-v1-v2-auth-diff.md`) — zero regressions, zero new tests
added. `src/candidate_me/index.ts` has zero pre-existing test coverage
(grepped: `grep -rln "fnExportPDF\|candidate_me" src/__tests__/` → no
matches, for any function in this file, not just this one) — writing a
new test suite for the whole file's Mongo/Puppeteer-dependent flow is a
larger undertaking than this task's scope; the change itself is a thin
~6-line branch that delegates entirely to `handlerGetAboutMe` (unchanged,
untested either way) and `formatReturn` (existing, shared utility), so
live-testing (below) stood in for automated coverage this round.

## Manual live verification (`npm run dev`, real Mongo/Atlas, Redis
falls back to in-memory)

Registered one throwaway account
(`jsonexport-check+<timestamp>@example.com`) rather than reusing a real
production account, specifically so it could be deleted afterward via the
already-implemented `DELETE /api/v1/candidate` self-delete endpoint
(`fnDelete`, confirmed routed in `candidate.route.ts:110`) — avoids
leaving junk data, unlike the `add-candidate-self-delete` cleanup burden
noted in earlier evidence.

```
POST /api/v1/auth/register → {"success":true,"message":"Đăng ký thành công",...}
GET  /api/v1/auth/login    → {"success":true,"data":{"token":"...", ...}}

GET /api/v1/download-pdf?format=json&token=<token>
→ HTTP 200, Content-Type: application/json; charset=utf-8
→ {"success":true,"message":"Lấy thông tin ứng viên thành công","errors":null,
   "data":{"_id":"...","email":"jsonexport-check+...@example.com",
   "generalInformation":{},"experiences":[],"educations":[],"references":[],
   "projects":[],"certificates":[],"awards":[],...}}

GET /api/v1/download-pdf?token=<token>   (no format — regression check)
→ HTTP 200, Content-Type: application/pdf, Content-Length: 14271
→ `file` confirms: "PDF document, version 1.4, 1 pages"

DELETE /api/v1/candidate (Authorization: Bearer <token>)
→ {"success":true,"message":"Xoá tài khoản thành công","errors":{},"data":null}
```
Dev server stopped after the check (`pkill -f "ts-node ./src/server.ts"`,
confirmed port 3001 free afterward). Test account fully cleaned up — no
leftover data.

## Acceptance
| Criterion | Evidence |
|---|---|
| `GET /api/v1/download-pdf?format=json` returns the aggregated candidate data as JSON | Live curl above — real HTTP 200, `Content-Type: application/json`, real aggregated payload shape (`generalInformation`, `experiences`, `educations`, etc.) |
| No new dependency | `git diff --stat` for this task touches exactly `candidate_me/index.ts` + `routers/api/v1/index.ts` — no `package.json` change |
| Reuses existing data-fetch (no duplicate query) | `candidate_me/index.ts` diff — `handlerGetAboutMe(email, lang)` called exactly once, same as before; the branch only decides what to do with its result |
| No regression to the existing PDF path | Live curl above — `format` omitted still returns a real, valid PDF (`file` command confirms PDF 1.4, 1 page), same `Content-Length` class as before this change |
| `npm test` all pass | Verbatim above — `Tests: 52 passed, 52 total` |
| DOCX explicitly out of scope | `services/createPDF.ts` not in the diff; no `docx` (or similar) added to `package.json` |

## Noticed, not done (out of scope)
- DOCX export (`?format=docx`) — the other half of issue #76, deliberately
  deferred per the operator's scope decision this round. Needs its own
  node once a DOCX library is chosen (e.g. `docx` npm package) and a
  template designed — a materially bigger lift than this JSON addition.
- No dedicated automated test for `fnExportPDF`/`format=json` — see
  Command section above for why; live-tested end-to-end instead. Flagging
  for a future node if `candidate_me/index.ts` gets test coverage more
  broadly (it currently has none, for any function).
- `format` isn't validated via Joi (just a loose `=== 'json'` check,
  anything else falls back to PDF) — matches the existing lightweight
  pattern already used for `lang` on this same handler
  (`req.query.lang === 'en' ? 'en' : 'vi'`), not a new inconsistency.

## Seal gate
No outward-facing action yet (no commit/push) — `src/` diff shown above
(2 files, +23/-2 lines) for operator review, per seal gate.

## Status
`sealed_pending_verifier`
