# 2026-08-29 — add-open-to-work-status (plan)

- Worker: implementer
- Version: 0.1.0
- Node: `add-open-to-work-status` (NEW — no matching PENDING node existed on
  `haven/diagrams/dev-loop.prime-mermaid.md`; created via the diagram's
  documented "no node exists -> DRAFT node" path, added as a PENDING row)
- Task (verbatim): "phần thông tin candidate tôi muốn thêm field hiển thị
  trạng thái có đang open to work hay không"

## Ambiguity resolved (operator, via `AskUserQuestion`)
Task text alone didn't specify model, data type, or PDF scope. Asked
operator directly rather than guessing (`pick_next` failure branch: "Task
is ambiguous -> Stop and ask, don't guess"):
1. **Model**: `generalInformation` (job-seeking info, same group as
   `workLocation`/`workForm`/`positionDesired`) — not `Candidate`.
2. **Data type**: `Boolean` (`openToWork`, default `false`) — not an enum.
3. **PDF export**: NOT included — API-response-only field, `createPDF.ts`
   untouched. Keeps the diff to model + validation only.

## Code anchors (grepped, real paths)
- `src/models/generalInformation.model.ts` — add schema field.
- `src/candidate_profile/general_information/generalInformation.validate.ts`
  — add to both `schemaGeneralInformation` (full) and
  `schemaGeneralInformationPatch` (partial) so PUT/POST/PATCH all accept it.
- No controller/service change needed — `generalInformation.controller.ts`
  passes the full validated `value` through to `handlerCreate`/
  `handlerUpdate` (`src/candidate_profile/general_information/
  generalInformation.service.ts`), which write straight to the Mongoose
  model — no field allowlist to update.
- `src/candidate_me/index.ts` — no change needed; `generalInformation` is
  spread through as-is (only `career`/`careerGoal` get explicit
  language-resolution treatment), so a new plain `Boolean` field flows
  through to `GET /api/me/:email` automatically.
- Confirmed no prior references anywhere (`grep -rn "openToWork" src/
  agent-hub/` → zero hits) — genuinely new field, not a rename/revive.

## Blockers
None. Lint/typecheck `<<FILL>>` in `doctrine/MEMORY.md` doesn't block this
task — only `npm test` is required per `NORTHSTAR.md`'s "done" definition,
and that command is filled in.

## Acceptance criteria (for verifier)
1. `generalInformation.model.ts` has `openToWork: Boolean` with a sane
   default (`false`).
2. Both `schemaGeneralInformation` and `schemaGeneralInformationPatch`
   (Joi) accept `openToWork` as a boolean.
3. `POST /create`, `PUT /update`, `PATCH /update` on
   `/api/v1/generalInformation` accept and persist `openToWork`.
4. `GET /api/me/:email` returns `openToWork` inside `generalInformation`
   unmodified (no language-resolution needed — it's a boolean, not
   localized text).
5. `npm test` — all suites pass, zero regressions.
6. `createPDF.ts` NOT touched (explicit operator scope decision).

## Seal gate
No outward-facing action yet — implementation follows this plan note.
