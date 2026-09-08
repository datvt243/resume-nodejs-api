# 2026-09-08 — fix-idor-broken-access-control (backfill confirmation)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-idor-broken-access-control` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "fix-idor-broken-access-control"

## Hub bytes before: 54774

## Finding: code already fixed, node just never got a verifier pass

`pick_next` located the node as PENDING and I went to `implement`. Before
writing any diff, per `SmallestDiff` I re-read every file the original
plan touched — all 7 already carry the fix, live on this branch
(`staging`), same shape as commit `f355e2f` ("fix: close broken access
control, password leak, and 3 other API bugs", `origin/develop`, later
folded into `staging` via `1ec67de`'s ancestry):

- `src/middlewares/verifyToken.middleware.ts:53-55` — after setting
  `req.user = { _id }`, forces `req.body.candidateId = _id`, overwriting
  anything the client sent. Applied via `verifyToken`/`verifyTokenByQuery`
  on every relevant route (`src/routers/api/v1/index.ts:25-32,81`):
  `/candidate`, `/education`, `/award`, `/experience`, `/reference`,
  `/general-information`, `/project`, `/certificate`, `/download-pdf`.
- `src/services/index.ts` `baseUpdateDocument` (line ~169) — checks
  `_existing.candidateId.toString() !== userID` against the EXISTING
  document's real owner, not the payload.
- `src/candidate_profile/BaseService.ts` `handlerUpdate` — takes and
  forwards `userID`.
- `src/candidate_profile/BaseController.ts` `fnUpdate` (line 164) — passes
  `(req as any).user?._id` as that `userID`.
- `src/candidate_profile/general_information/generalInformation.controller.ts`
  — `fnUpdate`/`fnUpdateFields` pass `(req as any).user?._id` the same way.
- `src/candidate/candidate.controller.ts` `fnUpdate`/`fnUpdateFields` —
  force `value._id = (req as any).user?._id` before calling `handlerUpdate`
  (Candidate uses self `_id`, not `candidateId`, so the middleware fix
  alone doesn't cover it — this file-specific fix is present too).
- `src/candidate_me/index.ts` `fnExportPDF` — uses
  `(req as any).user?._id` directly, not `req.body.candidateId`.

Because the middleware forces `req.body.candidateId` to the real owner's
id on every authenticated route, the remaining call sites that read
`req.body.candidateId` (`BaseController.ts` `baseGetAll`, `baseDelete`,
`generalInformation.controller.ts` `fnGet`, and `fnCreate` via
`validateSchema({..., item: {...req.body}})`) are safe **transitively** —
by the time any controller runs, that field can no longer be
client-controlled. Confirmed by reading `src/routers/api/v1/index.ts` top
to bottom: no route touching these controllers skips `verifyToken`.

No PENDING acceptance criterion was left unmet by the existing code — so
there is no new diff to write. This matches the exact same bookkeeping-gap
pattern already recorded for `add-pagination-filtering-cv-sections` (#73)
and `add-logout-all-sessions` (#74): code merged and (here, unlike #73/#74)
an implementer evidence note already existed
(`evidence/implementer/2026-08-21/fix-idor-broken-access-control-diff.md`,
status `sealed_pending_verifier`) — but no verifier pass ever ran, so the
diagram PM status was never advanced off PENDING.

## Diff

None. `git status` clean at task start, `git log` shows the fix already
present on `staging`. Writing a second, identical diff would violate
`SmallestDiff`.

## Command

```
npm test
```

## Output

```
Test Suites: 13 passed, 13 total
Tests:       77 passed, 77 total
Snapshots:   0 total
Time:        6.139 s
Ran all test suites.
```

(No `npm run build` re-run — no `src/` file touched this session.)

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-idor-broken-access-control` |
| Smallest diff | None needed — fix already present, verified by direct file reads cited above |
| Exact test command run + output read back | `npm test` → `Tests: 77 passed, 77 total` (this session, 2026-09-08) |
| Original exploit vectors closed | Central fix in `verifyToken.middleware.ts` + per-file `_id`/`candidateId` force, cited per file above; live re-test of the exploit already recorded in `evidence/implementer/2026-08-21/fix-idor-broken-access-control-diff.md` (5 manual re-tests, verbatim output) — not re-run live this session since no code changed since that note |

## Noticed, not done

- Sibling PENDING nodes `fix-candidate-password-leak`,
  `fix-refresh-token-expiry-unused`, `fix-v2-register-missing-await`,
  `fix-create-response-null-id` appear to have the **same** bookkeeping
  gap — `f355e2f`'s commit message covers all 5 fixes, and a quick check
  of `candidate.service.ts` (`select('-password')` present) suggests
  `fix-candidate-password-leak` is also already fixed in current code.
  Not verified in depth or touched — out of scope for this node
  (`SmallestDiff`, one node per task). Worth a follow-up `/todo` per node.
- `fnGetInformationById` in `candidate.controller.ts` — noted as unrouted
  dead code in the original 2026-08-21 note; still unrouted, still not
  touched.

## Seal gate

No outward-facing action — no `src/` diff, no commit, no push. Nothing to
show for approval.

## Status

`sealed_pending_verifier`
