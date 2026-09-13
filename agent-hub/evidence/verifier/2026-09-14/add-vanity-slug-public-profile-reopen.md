# 2026-09-14 — add-vanity-slug-public-profile

- **Worker**: verifier (subagent, dispatched via Agent tool)
- **Node**: `add-vanity-slug-public-profile` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- **New PM status**: REOPEN (was PENDING, stays PENDING — no diagram edit made)

## Isolation proof

Spawned as a `general-purpose` subagent via the Agent tool with task
description "Verify seal for add-vanity-slug-public-profile", run in the
foreground by the orchestrating session as part of a `/todo #120` flow,
round 1. No prior turns in this conversation, no access to whatever
session produced the implementation diff — a detail only the orchestrator
could hand me, not something carried over from an implementation history.

## Reasoning

Read only `evidence/implementer/2026-09-14/add-vanity-slug-public-profile-diff.md`
(never opened the `src/` diff directly). Cross-checked against
`haven/diagrams/dev-loop.prime-mermaid.md`'s `add-vanity-slug-public-profile`
row and the live GitHub issue (`gh issue view 120`).

- **Node exists on diagram**: yes, `add-vanity-slug-public-profile` PENDING
  row present. Not `ADHOC_WORK`.
- **Command matches doctrine**: `doctrine/MEMORY.md` specifies `npm test`
  and `npm run build` from the repo root. The note's repo-root path
  deviates from what's literally written in `doctrine/MEMORY.md`
  (`/Users/_david/Workspace/Project/ResumeAPI/backend`, which does not
  exist on this machine). Verified independently: `git remote get-url
  origin` from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`
  returns `github.com/datvt243/resume-nodejs-api`, matching
  `doctrine/domains/PROJECT.md`'s already-documented repo and the note's
  own explanation. Explanation holds up — not treated as a defect, per
  recipe step 4.
- **Acceptance criteria** (issue #120 proposal bullets):
  1. `slug` field, unique/sparse/lowercase/URL-safe, auto-generated —
     cited: `candidate.model.ts` diff description + passing test
     assertion `slug: expect.stringMatching(/^new-[a-z0-9]+$/)` inside
     `Tests: 83 passed, 83 total`. Covered.
  2. `GET /api/me/:slug` (extend existing handler), slug-first
     email-fallback — cited: `candidate_me/index.ts::handlerGetAboutMe`
     diff description. Covered by description, not by a runtime
     assertion, but the note is honest about that scope.
  3. Slug editable via `PATCH .../update`, uniqueness → `ConflictError`
     on collision — the note's own Acceptance table entry says this is
     **"reasoned, not live-DB-tested (no Mongo instance in this pass)"**.
     This is a claim of correct behavior with no executed evidence behind
     it — not a passing test, not a live request, just inference from
     reading an unrelated code path. Not covered per `EvidenceOnly`.
  4. `fnExportPDF`/download-pdf unaffected — cited: unchanged call site,
     reasoned not tested, but this is a true negative (no code touched)
     so reasoning-only is acceptable here — nothing to execute.
  5. Build clean / tests pass — see next finding below.

## Missing

1. **Truncated test output** (recipe step 5, exact trigger: `'...'`). The
   note's "2nd run, after fixing the mock" `npm test` output block
   contains a literal `...` between the sample per-test checkmarks and
   the suite summary:
   ```
         ✓ should fail if email already exists
       ...

   Test Suites: 14 passed, 14 total
   ```
   This is an elision, not verbatim output — it hides whatever the other
   12 test files' individual results were (and possibly more of this
   same file's tests). Per the recipe: `'...'` in the output is called
   out by name as a REOPEN trigger, independent of whether the summary
   line looks fine. I did not re-run `npm test` myself (audit-only
   default, recipe "Re-run scope") because the fix here is on the
   implementer's side: paste the real verbatim tail, not a hand-trimmed
   excerpt.
2. **Acceptance criterion #3 unproven.** The PATCH-slug-uniqueness →
   `ConflictError` claim in the Acceptance table is reasoning ("the
   existing generic Mongo duplicate-key path already covers it"), not an
   executed test or live request. The note's own "Noticed, not done"
   section flags this same gap and suggests "If the verifier has DB
   access, worth a live PATCH-to-a-taken-slug check" — I do not have a
   live Mongo instance in this pass either, so I can't independently
   confirm it myself; either a unit/integration test needs to be added
   and actually run, or a live check needs to happen and be pasted
   verbatim into a revised note before this criterion counts as covered.

## Forbidden states scan

- `ADHOC_WORK` — no, node exists.
- `NO_EVIDENCE` — no, note was written.
- `EDIT_UNVERIFIED` — **hit**, for the two Missing items above: a result
  (full test pass, ConflictError behavior) is effectively being claimed
  without a fully verbatim/executed proof.
- `CODE_IN_HAVEN` — no, note only.
- `DIAGRAM_DRIFT` — no, diagram left at PENDING (matches code not yet
  sealed).

## Seal gate

Note records operator approval of the `src/` diff in-session ("approve,
go ahead") before this note was written. Recorded correctly; not itself
a reason to REOPEN.

## Re-run

`none`. Per recipe's re-run scope: the note already fails on verbatim-ness
(step 5) and on a named missing acceptance criterion (step 6) — REOPEN on
the note's own contents, no need to spend an `npm test`/`npm run build`
re-run confirming a note that's already broken.
