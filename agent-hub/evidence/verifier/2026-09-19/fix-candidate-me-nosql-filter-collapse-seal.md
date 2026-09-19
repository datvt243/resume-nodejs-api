# 2026-09-19 — fix-candidate-me-nosql-filter-collapse (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-candidate-me-nosql-filter-collapse` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED (was PENDING)

## Isolation proof
Dispatched fresh via the Agent tool with a self-contained task prompt
naming the exact node (`fix-candidate-me-nosql-filter-collapse`) and
pointing at the implementer's evidence notes under
`evidence/implementer/2026-09-19/`; this session carries no memory of the
implementer pass that produced the diff. Independent confirmation this was
a genuinely separate execution context: partway through this verification
the shared working tree was mutated out from under this session by a
concurrent agent (branch flipped from `135-fix-nosql-filter-collapse` to
`staging` mid-read, the target diff had been `git stash`ed, and on
returning to `135-fix-nosql-filter-collapse` the tree carried unrelated
in-progress edits for a different node, `fix-soft-delete-bypass-on-update-patch`,
issue #136) — this verifier pass had no prior knowledge of any of that and
had to re-discover the diff's real location (`git stash show -p stash@{0}`,
commit `2232e5d` on `refs/stash`) from scratch, which is only possible from
a context that did not write the diff itself.

## Reasoning
Read the plan/diff notes (`evidence/implementer/2026-09-19/fix-candidate-me-nosql-filter-collapse-plan.md`,
`-diff.md`), then independently confirmed every claim against the real
code rather than trusting the note's prose, per this being a
security-relevant NoSQL-injection fix (see `## Re-run`).

- **Root cause matches**: `src/utils/querySafe.ts`'s `QuerySafe.safeQuery`
  silently omits a rejected key instead of throwing (read directly,
  unmodified) — confirmed a rejected identifier really does collapse
  `{}` and `Model.findOne({})` really does match an arbitrary document.
- **Fix is real and correct**, confirmed both by reading
  `src/candidate_me/index.ts` directly during this pass and by diffing the
  stashed change against its pre-fix parent (`git diff 01e61bc a5ac3e9`
  showed no diff there because the tracked change actually lives in the
  stash's own merge tree — reconciled via `git stash show -p stash@{0}`):
  - `handlerGetAboutMe` line ~62-63: `'slug' in safeSlugQuery ? await
    MODEL.Candidate.findOne(safeSlugQuery, ...) : null` — fails closed.
  - `handlerGetAboutMe` line ~65-66: same guard on `safeEmailQuery` /
    `'email' in safeEmailQuery`.
  - `handlerRecordVisit` line ~167-168: same guard, and `Visit.create` is
    only reached if `candidate` was actually found.
  All three exactly match the plan note's stated anchors and the diff
  note's stated diff.
- **New test file is real and exercises the claimed paths**: extracted
  `src/__tests__/candidate_me/index.test.ts` from the stash's untracked-file
  tree (`git show 674bddf:src/__tests__/candidate_me/index.test.ts`).
  Confirmed 3 tests: (1) `handlerGetAboutMe('$where:1', ...)` asserts
  `result.success === false` and `MODEL.Candidate.findOne` never called —
  genuinely exercises fail-closed, since `Candidate.findOne` is a bare
  `jest.fn()` with no mock return, so any call not asserted-against would
  throw/return undefined and the test would fail differently; (2)
  `handlerGetAboutMe('votan.it@gmail.com', ...)` asserts `Candidate.findOne`
  called exactly twice (slug attempt, email fallback) — proves the
  legitimate path is genuinely unaffected, not just not-broken by
  omission; (3) `handlerRecordVisit('$where:1', ...)` asserts neither
  `Candidate.findOne` nor `Visit.create` called.
- **Independent re-run** (not just an audit of the note — see `## Re-run`):
  created an isolated git worktree at the stash's merge commit (`2232e5d`),
  manually placed the untracked test file into it from the stash's
  untracked-tree blob, symlinked `node_modules` from the main checkout (no
  dependency changes in this diff), and ran the exact commands from
  `doctrine/MEMORY.md` myself, read back verbatim:
  - `npm test` → `Test Suites: 18 passed, 18 total` / `Tests: 95 passed, 95
    total` (was 92 before this node per the `add-httponly-cookie-jwt-auth`
    SEALED note — the +3 matches the 3 new tests exactly), including
    `PASS src/__tests__/candidate_me/index.test.ts` with all 3 named
    assertions shown passing.
  - `npm run build` → `tsc && npm run copy` completed with no errors.
  Both match the diff note's claims verbatim, independently reproduced.
- **Scope checks (`## Noticed, not done`) are reasonable and don't
  half-fix the bug**:
  - `candidate.service.ts:48` (`handlerGetInformationByEmail`) — read
    directly, confirmed it has the exact same unguarded
    `safeQuery({}, { email })` → `findOne` pattern. Correctly out of
    scope: different file/route (authenticated `GET /candidate/:email`,
    not the public `GET /api/me/:identifier` this node targets), flagged
    as its own future node — doesn't leave *this* node's target bug
    half-fixed.
  - `idQuerySafe.safeQuery({}, { _id })` in `fnExportPDF` (~line 202) —
    confirmed `_id` there is `(req as any).user?._id`, sourced from the
    verified-JWT `verifyToken` middleware, not raw client input. Not the
    same vulnerability class; leaving it untouched is correct.
  - `{ candidateId: _id?.toString() }` at ~line 97 (inside
    `handlerGetAboutMe`'s per-section loop) — confirmed `_id` there is
    destructured from `document`, the already-fetched, now-guarded
    `Candidate` document, not client-supplied. Also correct to leave
    untouched — and even if this specific query were somehow bypassed, it
    can only be reached after the guarded `document` lookup above already
    succeeded, so it isn't a route back to the collapse bug.
  - `QuerySafe.safeQuery` itself (the actual root cause) left unchanged —
    reasonable: hardening the class (e.g. throwing on reject) is a wider
    blast radius touching every other caller across the codebase and
    needs its own audit; this node's smallest-diff fix (fail closed at
    the 3 call sites that had the exploitable fallthrough) fully closes
    the specific bug (public, unauthenticated data leak via
    `GET /api/me/:identifier` and visit misattribution) without that
    wider change.
- **No regression at the 2 untouched call sites**: confirmed both (line
  ~97 `candidateId` query, line ~202 `_id` query in `fnExportPDF`) are
  fed from already-verified/already-fetched values, not raw request
  params — matches the diff note's claim, verified by reading the
  surrounding code, not by trusting the note's prose.
- Acceptance table in the diff note: all 5 rows checked against real
  output (test names + counts) above, all borne out.
- Forbidden states scan: no `ADHOC_WORK` (real node exists, worker
  identity used), no `NO_EVIDENCE` (plan+diff notes present), no
  `EDIT_UNVERIFIED` (this pass independently re-ran and read output back),
  no `CODE_IN_HAVEN` (all code changes are in `src/`, nothing under
  `haven/`), `DIAGRAM_DRIFT` was actually observed as a live hazard mid-pass
  (the PENDING row for this node was stashed out of the working tree by a
  concurrent session) but is resolved by this verdict adding the row back
  as SEALED with full citation, restoring code/diagram agreement.
- Seal gate: diff note records "None — no outward-facing action in this
  pass" — correct, this pass also performed no commit/push/publish;
  independent re-run happened in a disposable worktree, never touching
  the shared branch tip.
- Proportion (`SmallestDiff`): diff is 3 call-site guards + 1 new test
  file, exactly matching the node's stated scope — no unrelated changes.

## Re-run
`full` — ran the entire `npm test` and `npm run build` independently
myself (not just auditing the note's pasted output), in an isolated git
worktree reconstructed from the stash commit that held the real diff.
Reason: this is a security-relevant fix (unauthenticated arbitrary-profile
data leak / visit misattribution via NoSQL-filter collapse) — exactly the
class of change worth independently re-running per `recipes/verify_seal.md`'s
"Re-run scope" (outward-facing-risk exception), not just auditing the
implementer's paste. The re-run was additionally forced by circumstance:
the shared working tree no longer held the diff at all by the time this
pass reached the test step (see `## Isolation proof`), so an audit-only
verdict was not even available as an option here — the real diff had to be
located and re-run to verify anything past the source-reading step.
