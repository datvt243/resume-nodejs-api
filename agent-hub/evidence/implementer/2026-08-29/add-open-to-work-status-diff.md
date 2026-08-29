# 2026-08-29 — add-open-to-work-status (implement)

- Worker: implementer
- Version: 0.1.0
- Node: `add-open-to-work-status` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "phần thông tin candidate tôi muốn thêm field hiển thị
  trạng thái có đang open to work hay không" (scope resolved by operator
  via `AskUserQuestion` — see
  `evidence/implementer/2026-08-29/add-open-to-work-status-plan.md`)

## Diff
| File | Why |
|---|---|
| `src/models/generalInformation.model.ts` | Added `openToWork: { type: Boolean, default: false, required: false }` right after `workForm` — same grouping as the other job-seeking-preference fields, same style as the file's existing optional fields. |
| `src/candidate_profile/general_information/generalInformation.validate.ts` | Added `openToWork: _boolean` (reused the existing `_boolean = Joi.boolean()` export from `@/config/joi.config` — no new Joi primitive needed) into the `_sub` object, which both `schemaGeneralInformation` (full, PUT/POST) and `schemaGeneralInformationPatch` (PATCH) spread — one addition covers all 3 write paths. |
| `src/config/swagger.config.ts` | Added `openToWork: { type: 'boolean' }` to the `GeneralInformation` schema definition, same position as the model field, to avoid doc drift. |

No controller/service change needed — `generalInformation.controller.ts`
passes the whole validated `value` through to
`generalInformation.service.ts`'s `handlerCreate`/`handlerUpdate`, which
write straight to the Mongoose model (no per-field allowlist to update).
No `candidate_me/index.ts` change needed — `generalInformation` is spread
through to `GET /api/me/:email` as-is (only `career`/`careerGoal` get
explicit language-resolution treatment); a plain `Boolean` field flows
through unmodified. `createPDF.ts` intentionally untouched — operator
scope decision (API-response-only, no PDF rendering).

## Command
```
npm test
```
(run from `/Users/_david/Workspace/Project/ResumeAPI/backend`, copied
verbatim from `doctrine/MEMORY.md`)

## Output (verbatim, tail)
```
Test Suites: 10 passed, 10 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        5.073 s
Ran all test suites.
```
Same 10 suites / 52 tests as the prior sealed baseline
(`fix-pdf-missing-career-fields-seal.md`) — zero regressions, zero new
tests added. No new test was written because this field addition follows
the exact same pattern as the pre-existing `workLocation`/`workForm`
fields, neither of which has dedicated test coverage — adding a
schema-only passthrough field is not new business logic to cover
(`SmallestDiff`; matches the existing coverage baseline for this file
rather than inventing an out-of-scope test sweep).

Also ran `npm run build` (extra) — `tsc && npm run copy` completed with no
output (no errors).

## Acceptance
| Criterion | Evidence |
|---|---|
| `generalInformation.model.ts` has `openToWork: Boolean`, default `false` | Diff row above — `src/models/generalInformation.model.ts` |
| Both Joi schemas (full + patch) accept `openToWork` as boolean | `openToWork: _boolean` added to `_sub`, spread into both `schemaGeneralInformation` and `schemaGeneralInformationPatch` — `src/candidate_profile/general_information/generalInformation.validate.ts` |
| `POST /create`, `PUT /update`, `PATCH /update` on `/api/v1/generalInformation` accept + persist `openToWork` | Controller passes full validated `value` through unchanged to `handlerCreate`/`handlerUpdate` → Mongoose model — no allowlist blocks it (verified by reading `generalInformation.controller.ts` + `generalInformation.service.ts`, no code change needed there) |
| `GET /api/me/:email` returns `openToWork` inside `generalInformation` unmodified | `candidate_me/index.ts`'s `handlerGetAboutMe` spreads `generalInformation` as-is except for explicit `career`/`careerGoal` overwrites — verified by reading that function, no code change needed |
| `npm test` all pass | Verbatim above — `Tests: 52 passed, 52 total` |
| `createPDF.ts` not touched | `git diff --stat` for this task touches exactly 3 files: `generalInformation.model.ts`, `generalInformation.validate.ts`, `swagger.config.ts` — no `createPDF.ts` in the diff |

## Noticed, not done
- No dedicated test file exists for `generalInformation.validate.ts` or
  `generalInformation.model.ts` (checked: `grep -rln "generalInformation"
  src/__tests__/` only matches `createPDF.test.ts`, unrelated) — same gap
  applies to every other field in this model already (`workLocation`,
  `workForm`, `positionDesired`, ...). Out of scope for this task to fix
  generally; flagged here if the project owner wants schema-level test
  coverage as a future node.
- `openToWork` is not exposed in the exported PDF — explicit operator
  decision this round, not an oversight.

## Seal gate
No outward-facing action (no commit/push) — `src/` diff shown above (3
files, +5/-0 lines) for operator review, per seal gate.

## Status
`sealed_pending_verifier`
