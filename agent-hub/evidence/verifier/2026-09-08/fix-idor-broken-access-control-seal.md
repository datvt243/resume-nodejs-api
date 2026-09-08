# 2026-09-08 — fix-idor-broken-access-control (verify_seal)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-idor-broken-access-control` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED

## Isolation proof

This pass runs as a genuinely separate subagent, spawned via the Agent
tool specifically for this `verify_seal` task (description: "Verifier:
fix-idor-broken-access-control"). It carries zero conversation history
from any implementer session — no memory of writing the backfill note or
of any prior session that touched this repo. `NeverVerifyOwnWork` is
satisfied by construction, not by self-declaration.

## Reasoning

Read in full: `evidence/implementer/2026-09-08/fix-idor-broken-access-control-backfill.md`,
the `fix-idor-broken-access-control` row in `haven/diagrams/dev-loop.prime-mermaid.md`
(PENDING at read time), `agent-hub/CLAUDE.md` (forbidden states + seal gate),
`agent-hub/doctrine/MEMORY.md` (test command).

**Command/doctrine match**: note's command `npm test` matches
`doctrine/MEMORY.md`'s documented Test command exactly. Aside (does not
block): `doctrine/MEMORY.md`'s path table names hub/repo path
`/Users/_david/Workspace/Project/ResumeAPI/backend[/agent-hub]`, but this
repo actually lives at
`/Users/_david/Workspace/Project/resume/resume-nodejs-api` — a stale path
in doctrine, not a command mismatch. Not re-run myself (audit-only for
this leaf per the re-run scope's default; the note's `npm test` output is
verbatim, not truncated: `Test Suites: 13 passed, 13 total / Tests: 77
passed, 77 total`).

**Independent source re-reads** (beyond the note's prose), per the
"Critical security / no new diff" re-run guidance:

- `src/middlewares/verifyToken.middleware.ts:53-55` — confirmed:
  `(req as any).user = { _id };` then `req.body.candidateId = _id;`
  unconditionally, after `jwtVerify` succeeds. Overwrites any
  client-supplied `candidateId`.
- `src/routers/api/v1/index.ts:24-32,81` — confirmed `verifyToken` (or
  `verifyTokenByQuery`) sits directly in front of every route that reads
  `req.body.candidateId`/`req.user._id`: `/candidate`, `/education`,
  `/award`, `/experience`, `/reference`, `/general-information`,
  `/project`, `/certificate` (all via `router.use(path, verifyToken,
  ...)`), and `/download-pdf` (`verifyTokenByQuery`). No route bypasses
  it.
- `src/services/index.ts:169` — `baseUpdateDocument` confirmed:
  `if (userID !== undefined && _existing?.candidateId !== undefined &&
  _existing.candidateId.toString() !== userID)` — checks the **existing**
  document's real owner (`_existing`, fetched by `_id` via
  `baseCheckDocumentById`), not the payload's own `candidateId`.
- `src/services/index.ts:110` — `baseDeleteDocument` confirmed analogous:
  `candidateId.toString() !== userID` checked against the fetched
  document's real owner.
- `src/candidate_profile/BaseService.ts:50-56` (`createCrudService`,
  shared by all 7 CV sections) — `handlerUpdate(item, userID, lang)`
  forwards `userID` straight into `baseUpdateDocument({..., userID})`.
  `handlerDelete` forwards `userID` into `baseDeleteDocument` the same
  way.
- `src/candidate_profile/BaseController.ts:158-169`
  (`createCrudController.fnUpdate`, shared by all 7 sections) — confirmed
  `service.handlerUpdate(value, (req as any).user?._id, ...)`: `userID` is
  the authenticated id, never anything from `req.body`.
- `src/candidate_profile/BaseController.ts:59-82` (`baseDelete`, shared)
  — confirmed `userID: req.body.candidateId || ''`; safe because
  `req.body.candidateId` was already forced to the real `_id` by
  `verifyToken` before this controller ever runs (transitive safety,
  confirmed by the router-level check above).
- Confirmed all 7 CV sections (`education`, `experience`, `award`,
  `certificate`, `project`, `reference`, `generalInformation`) route
  through the same shared `createCrudController`/`createCrudService`
  factory pair (`grep` across `src/candidate_profile/*/*.controller.ts`
  and `*.service.ts` — every one imports `createCrudController` /
  `createCrudService` from `BaseController`/`BaseService`), so the fix is
  not per-section duplicated logic that could have been missed on one
  section — it is centralized.
- `src/candidate/candidate.controller.ts:59` (`fnUpdate`) — confirmed
  `handlerUpdate({ ...value, _id: (req as any).user?._id }, ...)`: `_id`
  forced from the authenticated user, not the client payload. Same
  pattern at line 158 (`fnUpdateFields`). Candidate model keys on self
  `_id`, not `candidateId`, so this is correctly a separate fix from the
  middleware one, and it is present.
- `src/candidate_me/index.ts:181-190` (`fnExportPDF`) — confirmed `const
  _id = (req as any).user?._id;` used directly for the `Candidate.findOne`
  lookup; no `req.body.candidateId` read anywhere in this function.
- `src/candidate_profile/general_information/generalInformation.controller.ts:18,80,103`
  — `fnGet` reads `req.body.candidateId` (safe transitively, same
  reasoning as `baseDelete` above); `fnUpdate`/`fnUpdateFields` both pass
  `(req as any).user?._id` as `userID` into `handlerUpdate`.

No route, controller, or service call site was found that still trusts a
client-supplied `candidateId`/`_id` for a CV-section or candidate
mutation/read. The fix is centralized (router-level `verifyToken` +
shared `BaseController`/`BaseService`), not scattered — lower risk of a
missed call site than the note's file-by-file framing might suggest, and
independent re-reading corroborates every cited line.

**Seal gate**: `git status --porcelain` shows only the untracked
`agent-hub/evidence/implementer/2026-09-08/` note — no `src/` changes,
confirming the note's "no diff" claim; `git branch --show-current` is
`staging`, matching the note's stated branch. Nothing outward-facing
happened this session.

**Forbidden states** — none triggered: node exists on the diagram
(`ADHOC_WORK` clear); evidence note exists for the action taken
(`NO_EVIDENCE` clear); no claim without a cited, verbatim `npm test` read-back
plus my own independent file reads (`EDIT_UNVERIFIED` clear); no code
written into `haven/` (`CODE_IN_HAVEN` clear); PM status is being updated
in place to match the confirmed code state (`DIAGRAM_DRIFT` clear).

## Missing

None.

## Re-run

`partial` — did not re-run `npm test`/`npm run build` myself (note's
verbatim output already satisfies EvidenceOnly for that command; nothing
in `src/` changed since it ran). Did independently re-read every cited
source file myself rather than trusting the note's prose, per the "For
THIS node specifically" guidance: Critical security node, "no new diff"
claim over existing code warrants independent confirmation of the
load-bearing lines, which is what this pass did (10+ files/line-ranges
read directly, cited above with file:line).
