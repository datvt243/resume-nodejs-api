# 2026-08-29 — add-json-export-format — SEAL

- Worker: verifier (independent fresh subagent, Agent tool)
- Node: `add-json-export-format` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- GitHub issue: #76 (verified via `gh issue view 76`, own read, not the note's summary)
- Implementer note reviewed: `evidence/implementer/2026-08-29/add-json-export-format-diff.md`
- Verdict: **SEAL**

## Method
Did not trust the note's prose. Read `git status --short` first, then the
real diff myself for both touched files, ran build and tests myself, read
the actual `handlerGetAboutMe`/`formatReturn` source, and read the actual
GitHub issue myself.

## Acceptance criteria — walked one at a time

1. **New JSON branch, correct placement, no PDF regression.**
   `git diff -- src/candidate_me/index.ts` (read directly, not inferred)
   confirms `fnExportPDF` now destructures `{ success, message, data }`
   (message newly added) from the existing `handlerGetAboutMe(email, lang)`
   call, then:
   ```
   if (req.query.format === 'json') {
     formatReturn(res, { success, message, data });
     return;
   }
   ```
   placed AFTER the pre-existing `if (!success) { ...; return; }` guard and
   BEFORE the pre-existing `await createCV(data, res);` line, which is
   otherwise untouched. Any `format` value other than exactly `'json'`
   (including absent) falls through unchanged to the PDF path. Confirmed.

2. **Reuses the same data-fetch, no duplicate query.**
   Read the diff hunk directly — `handlerGetAboutMe(email, lang)` is called
   exactly once, same call site as before; only the destructuring
   changed (`message` added to the existing `{ success, data }`). No new
   `await`, no new query, no new import of a data-fetching function.
   Confirmed.

3. **Return shape actually matches what the new branch expects.**
   Read `handlerGetAboutMe` end-to-end in `src/candidate_me/index.ts`
   (lines 41–125): on success it returns
   `{ success: true, data: dataResult, message: 'Lấy thông tin ứng viên thành công' }`
   — exactly the three keys the new branch destructures. Read
   `formatReturn` in `src/utils/helper.ts` (line 207 on): accepts
   `{ success, message, errors, data, statusCode, ... }`, computes a status
   code (200 on success), and calls `res.status(...).json(formatResponse(...))`
   — genuinely serializes as JSON. The manual live-test claim in the note
   (`Content-Type: application/json`, matching payload shape with
   `generalInformation`/`experiences`/`educations`/etc.) is structurally
   plausible against this real code path — confirmed by reading source, not
   just trusting the curl transcript.

4. **IDOR-safe pattern untouched.** Read the full `fnExportPDF` function
   (lines 126–171). `email` is resolved from `(req as any).user?._id` →
   `MODEL.Candidate.findOne(idQuerySafe.safeQuery({}, { _id }))` — the
   authenticated user's own id from the verified JWT, never a
   client-supplied query param. The new JSON branch sits downstream of
   this resolution and inherits the same safety automatically; it does not
   introduce any new way to specify whose data to fetch. Confirmed.

5. **Swagger diff is doc-only.** `git diff -- src/routers/api/v1/index.ts`
   shows only new `format` query-param and `application/json` response
   content added inside the existing JSDoc comment block on
   `/download-pdf`. The actual route line
   `router.get('/download-pdf', verifyTokenByQuery, fnExportPDF);` is
   outside the diff hunk, unchanged. Confirmed — no route/logic touched.

6. **No new dependency.** `git diff -- package.json` — empty, no output.
   Confirmed.

7. **DOCX out of scope.** `git diff --stat -- src/services/createPDF.ts` —
   empty, no output. `gh issue view 76`'s own proposal text lists JSON
   (`?format=json`, "cheapest addition, no new dependency") and DOCX
   (`?format=docx`, "needs a DOCX generation library... and a new
   template") as two separate suggested shapes, explicitly recommending
   "splitting into two issues once scoped." This diff implements exactly
   the JSON half. Confirmed both from the diff and from reading the issue
   text myself.

8. **Build.** Ran `npm run build` myself from
   `/Users/_david/Workspace/Project/ResumeAPI/backend`. Output:
   ```
   > nodejs-resume-api@1.1.0 build
   > tsc && npm run copy

   > nodejs-resume-api@1.1.0 copy
   > cp -R ./src/views ./src/public ./dist/
   ```
   Clean, no `tsc` errors. Confirmed.

9. **Tests.** Ran `npm test` myself (exact command from
   `doctrine/MEMORY.md`, run from repo root). Verbatim tail of my own run:
   ```
   Test Suites: 10 passed, 10 total
   Tests:       52 passed, 52 total
   Snapshots:   0 total
   Time:        4.413 s, estimated 5 s
   Ran all test suites.
   ```
   Matches the prior sealed baseline (10 suites / 52 tests, e.g.
   `consolidate-v1-v2-auth-seal.md`) — zero regressions, zero new tests
   (consistent with the note's stated reason: `candidate_me/index.ts` has
   no pre-existing coverage for any function, confirmed independently by
   `grep -rln "fnExportPDF\|candidate_me" src/__tests__/` returning no
   matches). Not truncated, not redacted.

## SmallestDiff proportion check
`git diff --stat -- src/candidate_me/index.ts src/routers/api/v1/index.ts`:
```
 src/candidate_me/index.ts   | 10 +++++++++-
 src/routers/api/v1/index.ts | 13 ++++++++++++-
 2 files changed, 21 insertions(+), 2 deletions(-)
```
2 files, 21/2 — a thin conditional branch plus a doc-only Swagger addition.
No unrelated refactor, no DOCX work, no touch to `createPDF.ts` or any
CV-section controller/service. Proportionate to the node.

## Forbidden states — checked all 5
| State | Verdict |
|---|---|
| `ADHOC_WORK` | Not hit — node exists on `dev-loop.prime-mermaid.md` (was PENDING going in), diff traces to it. |
| `NO_EVIDENCE` | Not hit — implementer note exists; this verifier note now exists too. |
| `EDIT_UNVERIFIED` | Not hit — build and tests re-run by me, verbatim output above, not inferred from the note. |
| `CODE_IN_HAVEN` | Not hit — no `.ts`/`.js`/runnable code touched under `haven/`; only this evidence note and the diagram PM-status row (prose) were written. |
| `DIAGRAM_DRIFT` | Resolved by this SEAL — PM status updated below to match shipped code. |

## Minor observation (non-blocking)
The live manual test left one generated file,
`src/public/pdf/jsonexport-check+1787996905@example.com.pdf`, in the
working tree (untracked, not gitignored — same directory already held a
pre-existing `votan.it@gmail.com.pdf` from normal product usage, so this
is consistent with existing directory behavior, not a new pattern). Does
not affect `git diff` of `src/` logic, does not affect build/tests, and is
not part of the reviewed code diff. Flagging for hygiene, not blocking
SEAL — the implementer's actual cleanup claim (self-delete of the DB
account via `DELETE /api/v1/candidate`) was about data, not this rendered
file, and that claim is unrelated to code correctness.

## Seal gate
No outward-facing action (commit/push) has happened yet — working-tree
diff only. Nothing for this verifier pass to gate; commit/push, if and
when it happens, is a separate future seal-gate checkpoint.

## Result
All 9 acceptance criteria have independently-gathered, cited evidence.
Diff is proportionate. No forbidden state hit. **SEAL.**
