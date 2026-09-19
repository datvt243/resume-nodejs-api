# 2026-09-19 — fix-soft-delete-bypass-on-update-patch (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-soft-delete-bypass-on-update-patch`
- New PM status: SEALED (was PENDING)

## Isolation proof
Dispatched fresh via the Agent tool by the coordinator session with a
self-contained task description naming this exact node and evidence paths
to grade — no memory of, or participation in, the implementer session that
wrote `src/services/index.ts`'s diff or the new test file. Confirmed via
`git branch --show-current` (`136-soft-deleted-cv-section`) and `git
status` at the start of this pass that the working-tree changes under
review were already present before I touched anything — I did not author
them in this session.

## Reasoning
Read both implementer evidence notes (`-plan.md`, `-diff.md`), then — per
this task's explicit defensive-verification directive and the recipe's
"Re-run scope" exception for security/data-integrity-relevant fixes —
independently read the real current `src/services/index.ts` and
`src/utils/querySafe.ts`, and independently re-ran the exact commands from
`doctrine/MEMORY.md`.

1. **Fix present and correctly wired.** Read all of
   `baseCheckDocumentById`, `baseUpdateDocument`, `basePatchDocument`,
   `baseDeleteDocument`, `baseRestoreDocument` in
   `src/services/index.ts` (lines 101-437). `baseCheckDocumentById` gained
   the opt-in 4th param `opts: { excludeDeleted?: boolean } = {}`
   (line 410-415); when set, `baseQuery = opts.excludeDeleted ?
   { deletedAt: null } : {}` (line 428) is merged into the query via
   `idQuerySafe.safeQuery(baseQuery, { _id })`. `baseUpdateDocument`
   (line 205-207) and `basePatchDocument` (line 334-336) both now call it
   with `excludeDeleted: true`. `baseDeleteDocument` (line 107) and
   `baseRestoreDocument` (line 148) call sites are byte-for-byte unchanged
   — no 4th arg, so `opts` defaults to `{}` and behavior is identical to
   before this fix. This matches the plan/diff notes exactly, and
   `git diff -- src/services/index.ts` shows nothing beyond this (one
   signature + 2 call sites + comments) — proportionate, no scope creep
   (`SmallestDiff`).
2. **`idQuerySafe` precedent confirmed, not a new untested assumption.**
   Read `src/utils/querySafe.ts`: `idQuerySafe = new QuerySafe(['_id',
   'candidateId', 'email'])`. `safeQuery(baseQuery, userInput)` spreads
   `baseQuery` first, then only merges `userInput` keys that are (a) in
   the allow-list and (b) a string — `deletedAt` is not in the allow-list,
   so it can never be overridden by caller input, exactly the same
   guarantee `baseFindDocument` already relies on at line 57
   (`idQuerySafe.safeQuery({ deletedAt: null }, fields)`, issue #121,
   already SEALED). Same pattern, same file, same precedent — not new
   risk.
3. **New test file exercises the real behavior.**
   `src/__tests__/services/baseUpdatePatchSoftDelete.test.ts`: fake model's
   `findOne` mimics real Mongo filtering (`query.deletedAt === null &&
   doc?.deletedAt ? null : doc`). Four tests: soft-deleted doc → both
   `baseUpdateDocument` and `basePatchDocument` return `success: false`
   and assert `model.updateOne` was **not** called (proves the bug is
   closed, not just that the return value changed); non-deleted doc → both
   still call `updateOne` with the right args and return `success: true`
   (regression check). This is exactly the claimed coverage.
4. **`npm test` re-run independently** (not just audited) from
   `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, matching
   `doctrine/MEMORY.md` exactly:
   ```
   Test Suites: 18 passed, 18 total
   Tests:       96 passed, 96 total
   Snapshots:   0 total
   Time:        3.796 s, estimated 5 s
   Ran all test suites.
   ```
   Matches the implementer note's `96 passed, 96 total` verbatim (only the
   wall-clock time differs, as expected on a re-run).
5. **`npm run build` re-run independently**: `tsc && npm run copy`
   completed with no errors or warnings — typecheck clean.
6. **`baseRestoreDocument`'s existing "already soft-deleted" test still
   passes and is untouched by this fix.** Read
   `src/__tests__/services/baseSoftDelete.test.ts` lines 46-53: "clears
   deletedAt when the owner matches, even for an already soft-deleted
   document" — asserts `model.updateOne` called with `{ deletedAt: null }`
   and `success: true`. Confirmed passing inside the same `npm test` run
   in item 4 (18/18 suites, no failures). This test only reaches
   `baseRestoreDocument`, whose call site to `baseCheckDocumentById` is
   unchanged (no `excludeDeleted` passed), so it was never at risk from
   this diff — restore correctly keeps finding soft-deleted documents.
7. **"Noticed, not done" scope call is reasonable and doesn't half-fix the
   bug.** Leaving `baseDeleteDocument`/`baseRestoreDocument` on the
   inclusive default is correct and necessary: `baseRestoreDocument` must
   find an already-soft-deleted document to restore it (verified in item
   6), and `baseDeleteDocument` re-stamping `deletedAt` on an
   already-deleted document is a no-op-equivalent, not a data-mutation
   risk. Flagging `basePatchDocument`'s missing ownership check
   (`userID` isn't even a parameter) as a separate, out-of-scope issue is
   correct scope discipline — that gap pre-dates this node, is orthogonal
   to the soft-delete bypass being fixed here, and fixing the specific
   bug named in issue #136 (soft-deleted docs bypassing update/patch)
   does not require touching it. The specific bug is fully closed for
   both `baseUpdateDocument` and `basePatchDocument`, the two call sites
   named in the issue.

No forbidden state hit: real worker identity + node on diagram
(`ADHOC_WORK` clear), both evidence notes present with verbatim output
(`NO_EVIDENCE` clear), every claim independently re-verified by reading
the real files and re-running the real commands myself, not inferred
(`EDIT_UNVERIFIED` clear), only `.md` touched in `haven/`
(`CODE_IN_HAVEN` clear), PM status only moves PENDING → SEALED, never
demoted (`DIAGRAM_DRIFT` addressed by this note's own diagram update
below). Seal gate: implementer note correctly records "none" — no
outward-facing action in this pass, working-tree only.

## Re-run
`full` — independently re-ran both `npm test` (item 4) and `npm run
build` (item 5) myself from the real working tree, not just audited the
note's paste. Reason: this task explicitly named this a
security/data-integrity-relevant fix (soft-delete bypass allowing mutation
of a document that should be inaccessible) and directed defensive
independent verification — matches the "Re-run scope" exception in
`recipes/verify_seal.md` (this class of change is exactly where
independent-confirmation cost is worth paying), on top of the coordinator's
explicit instruction to read the real current file contents rather than
trust the note's prose alone.
