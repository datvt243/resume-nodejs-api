# 2026-08-29 — add-public-profile-visibility-toggle (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-public-profile-visibility-toggle` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "#75" (GitHub issue #75 — Public profile visibility
  toggle for /api/me/:email)

## Scope
Issue #75 already specifies a concrete plan (model field + gate +
PATCH-only exposure) — no ambiguity worth an `AskUserQuestion` round this
time, unlike #76. Followed the issue's proposal as written.

## Diff
| File | Why |
|---|---|
| `src/models/candidate.model.ts` | Added `isPublic: { type: Boolean, default: true, required: false }` — default `true` preserves current behavior for every existing candidate (no migration needed, matches the issue's explicit ask). |
| `src/candidate/candidate.validate.ts` | Added `isPublic: _boolean` (reused the existing `_boolean = Joi.boolean()` export from `@/config/joi.config`, same as the `add-open-to-work-status` node) to `schemaCandidatePatch` ONLY — not the full `schemaCandidate` (PUT) — per the issue's explicit scope: "Expose the toggle via the existing `PATCH /api/v1/candidate/update` flow." |
| `src/candidate_me/index.ts` | `fnGetAboutMe` (the public, unauthenticated controller) — after calling `handlerGetAboutMe`, checks `_me.data?.isPublic === false` and if so returns the exact same failure shape as the pre-existing "email not found" branch (`formatReturnFailed('Email không tồn tại')`) — same message, same `success:false`/`data:null` shape, so a private profile can't be distinguished from a non-existent email (per the issue's explicit anti-enumeration requirement). **Deliberately did NOT touch `handlerGetAboutMe` itself** — it's also called directly by `fnExportPDF` (authenticated, self-only via `req.user._id`), and gating it there would have broken a candidate's ability to export their own PDF while their profile is set to private, which the issue never asked for (the flag is about public *discoverability*, not self-access). |
| `src/config/swagger.config.ts` | Added `isPublic: {type: 'boolean'}` to the `Candidate` schema definition — doc-only, matches the model field. The `PATCH /candidate/update` swagger doc block already references `$ref: '#/components/schemas/Candidate'` for its request body, so it picks up the new field automatically — no separate edit needed there. |

No change to `handlerUpdate` (`candidate.service.ts`) — it already applies
whatever's in `value` generically (`MODEL.updateOne({_id}, value)`), same
mechanism the `add-open-to-work-status` node relied on for
`generalInformation`.

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
Time:        6.215 s
Ran all test suites.
```
Same 10 suites / 52 tests as the prior sealed baseline
(`add-candidate-cv-upload-seal.md`) — zero regressions, zero new
automated tests added. `candidate_me/index.ts` and
`candidate/candidate.controller.ts` have zero pre-existing test coverage
(same gap already flagged in the `add-candidate-cv-upload` node) — this
change is a small, self-contained conditional in an already-untested
file, live-tested end-to-end instead (below).

## Manual live verification (`npm run dev`, real Mongo/Atlas, Redis falls
back to in-memory)

```
POST /api/v1/auth/register, GET /api/v1/auth/login → throwaway account, real token

# Default true (no migration needed for new accounts)
GET /api/me/<email> → success:true, data.isPublic: true

# PATCH /api/v1/candidate/update {isPublic: false}
# (had to include a dummy valid-format _id in the body — schemaCandidatePatch
#  requires it be present/ObjectId-shaped even though candidate.controller.ts's
#  fnUpdateFields always overwrites it server-side with req.user._id before
#  calling handlerUpdate; pre-existing quirk, not touched — same class as the
#  401-vs-400 quirk noted in the add-forgot-reset-password-flow node)
→ {"success":true,"message":"Cập nhật thành công",..., "isPublic":false, ...}

# Public view now indistinguishable from a non-existent email
GET /api/me/<email>
→ {"success":false,"message":"Email không tồn tại","errors":null,"data":null}
# (identical message/shape to the real "email not found" branch in
#  handlerGetAboutMe — confirmed by reading that branch's exact string)

# Self authenticated export still works (bypass confirmed)
GET /api/v1/download-pdf?token=<token>
→ HTTP 200, `file` confirms: real "PDF document, version 1.4, 1 pages"

# Toggled back to true
PATCH /api/v1/candidate/update {isPublic: true} → success:true, isPublic:true
GET /api/me/<email> → success:true (public view restored)

DELETE /api/v1/candidate (self-delete) → success:true
```
Dev server stopped after the check (`pkill -f "ts-node ./src/server.ts"`,
confirmed port 3001 free afterward). Test account and its generated PDF
export fully cleaned up — no leftover Mongo documents or on-disk files.

## Acceptance
| Criterion | Evidence |
|---|---|
| `Candidate.isPublic` defaults to `true` (no behavior change for existing/new accounts) | Model diff; live curl above — fresh account's `GET /api/me/:email` succeeds by default |
| `GET /api/me/:email` returns the identical "not found" shape when `isPublic === false` | Live curl above — same message/shape as the real not-found branch |
| No user-enumeration leak (private vs. non-existent indistinguishable) | Response bodies byte-for-byte identical between the two cases (same message string, same `data: null`) |
| Exposed via `PATCH /api/v1/candidate/update` | Live curl above — real PATCH request toggled the flag both directions |
| Self-export (`fnExportPDF`) unaffected by a private flag | Live curl above — PDF export succeeded (HTTP 200, real PDF bytes) while `isPublic` was `false` |
| `npm test` all pass, `npm run build` clean | Verbatim above |

## Noticed, not done (out of scope)
- `schemaCandidatePatch` requires a client-supplied, ObjectId-shaped `_id`
  even though `fnUpdateFields` always overwrites it server-side with
  `req.user._id` — pre-existing awkward-but-not-insecure quirk (the
  client's `_id` is validated for shape but then discarded, never
  trusted for the actual write), not introduced by this task, not fixed
  here (`SmallestDiff`). Worth its own node if the project owner wants
  the Joi schema relaxed to not require it at all.
- `isPublic` was NOT added to the full `schemaCandidate` (PUT schema) —
  matches the issue's explicit "PATCH flow" scope; a `PUT /update` call
  today would silently leave `isPublic` unchanged (Mongoose `updateOne`
  only touches keys present in the payload), which is correct/expected,
  not a gap.
- No automated test added — see Command section above for why.

## Seal gate
No outward-facing action yet (no commit/push) — `src/` diff shown above
(4 files, +19/-1 lines) for operator review, per seal gate.

## Status
`sealed_pending_verifier`
