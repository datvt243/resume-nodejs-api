# 2026-09-02 — add-docx-export-format (plan)

- Worker: implementer
- Version: 0.1.0
- Node: `add-docx-export-format` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "#76" (GitHub issue #76 — Additional CV export formats
  (DOCX / JSON))

## Node exists? No — created this session
No node for DOCX export existed on the active diagram. JSON export
(`add-json-export-format`) is already SEALED and explicitly deferred DOCX
as "Noticed, not done" in its own evidence note
(`evidence/implementer/2026-08-29/add-json-export-format-diff.md`). Added
`add-docx-export-format` as a new PENDING row per the flowchart's
`exist -- no --> draft[DRAFT node] --> pick` branch.

## Scope — not ambiguous this round, no `AskUserQuestion` needed
Outside this loop, the operator already edited GitHub issue #76's body
directly: JSON marked done (commit `fc26b9f`), remaining scope narrowed to
DOCX only. `pick_next`'s "Task is ambiguous -> stop and ask" branch does
not apply — the scope decision already happened, just not through this
hub's evidence trail until now.

## Plan
1. `npm install docx` — confirmed available (`npm view docx version` →
   `9.7.1`), MIT-licensed, no native deps, matches the issue's own
   suggested library.
2. New `src/services/createDocx.ts`:
   - `buildDocxContent(RECORD)` — pure function, mirrors
     `createPDF.ts`'s `getDataCandidate` + `_helper()` split: flattens the
     aggregated candidate data (same shape `handlerGetAboutMe` already
     produces) into a plain, framework-agnostic content model (heading +
     lines per section) — no `docx` library types involved, so this half
     stays unit-testable the same way `createPDF.test.ts` tests
     `pageRender` today (no Puppeteer/browser mocking needed there either
     — `docx`'s `Packer.toBuffer` is pure/sync computation, no external
     process).
   - `renderDocxDocument(content)` — thin second half, turns the content
     model into an actual `docx` `Document`.
   - `createCVDocx(data, res)` — `Packer.toBuffer()` + sends the buffer
     with the correct `Content-Type`
     (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
     and a `Content-Disposition` filename, mirroring `createCV`'s
     PDF-sending shape in `createPDF.ts`.
3. `src/candidate_me/index.ts`'s `fnExportPDF`: add an
   `if (req.query.format === 'docx') { await createCVDocx(data, res); return; }`
   branch, same position/shape as the existing `format === 'json'` branch
   — same single `handlerGetAboutMe` call reused, no new data-fetch.
4. `src/routers/api/v1/index.ts`: `/download-pdf` Swagger doc — extend the
   `format` enum `[pdf, json]` → `[pdf, json, docx]`, add a
   `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   response content entry alongside the existing `application/pdf` /
   `application/json` ones.

## Code anchors (real, grepped)
- `src/candidate_me/index.ts:209-214` — existing `format === 'json'`
  branch, insertion point for the new `docx` branch right after it.
- `src/services/createPDF.ts` — sibling module this new file mirrors the
  shape of (`pageRender`/`getDataCandidate`/`createCV`).
- `src/routers/api/v1/index.ts` — existing `/download-pdf` Swagger block
  (`format` enum currently `[pdf, json]`).
- `package.json:51-53` — `pdfkit`/`pug`/`puppeteer` deps sit here; `docx`
  goes in the same dependencies block.

## Blockers
None. `doctrine/MEMORY.md`'s test/build commands are filled in (only
lint/typecheck is `<<FILL>>`, not needed for this task — no lint step
exists to run either way per that same file's note).

## Status
Plan complete → proceeding to `implement`.
