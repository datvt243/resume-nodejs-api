# 2026-09-01 — fix-visit-model-missing-id (verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-visit-model-missing-id` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED (was PENDING)

## Reasoning

- **Evidence-only compliance**: read only
  `evidence/implementer/2026-09-01/fix-visit-model-missing-id-diff.md`, plus
  `doctrine/MEMORY.md`, `NORTHSTAR.md`, `CLAUDE.md`, and the diagram file
  itself. Did not open the `src/` diff directly.
- **Test command matches doctrine verbatim**: note cites `npm test`, the
  exact command in `doctrine/MEMORY.md`. Path prefix in the note
  (`/Users/_david/Workspace/Project/resume-nodejs-api`) differs from
  `doctrine/MEMORY.md`'s stale pre-rename path
  (`.../ResumeAPI/backend`) — same non-blocking staleness already called
  out and accepted in the prior `add-visit-tracking` SEAL row; the command
  string itself is unchanged, so not a blocker.
- **Output not truncated/redacted**: no `...`/"truncated" markers in either
  the `curl`, `grep`, reproduction-script, or `npm test` output blocks.
- **Acceptance table, row by row**:
  1. Root cause identified with a real, cited error — YES. Live `curl -sS
     -X POST` against the actual production URL returned a quoted
     `500 {"errorCode":"INTERNAL_SERVER_ERROR","message":"document must
     have an _id before saving"}`; `grep -rn "_id before saving"
     node_modules/mongoose/lib` cited to the exact source line
     (`model.js:312`), not guessed.
  2. Fix verified to actually change `_id` assignment behavior — YES. A
     standalone, throwaway in-memory reproduction (no DB connection, no
     writes) printed real before/after `_id` values: `undefined` on the
     schema with the bare `_id: ObjectId` redeclaration (both Visit and an
     Award-style analog), vs a real generated `ObjectId(...)` once that
     field is removed — a genuine repro, not an assertion.
  3. `npm run build` clean — cited as clean with no errors; `tsc` is
     silent on success, consistent with prior SEALED precedent
     (`add-visit-tracking`) treating this the same way.
  4. `npm test` 54/54 unchanged — verbatim tail pasted: `Test Suites: 10
     passed, 10 total` / `Tests: 54 passed, 54 total`, matching the
     established 10/54 baseline.
  5. Regression tracked as a new node, not a reopen of SEALED
     `add-visit-tracking` — YES, confirmed against the diagram: the
     `add-visit-tracking` row is untouched and still reads SEALED; this
     work landed under its own new `fix-visit-model-missing-id` node per
     LAI-13.
- **Forbidden states scan**:
  - `ADHOC_WORK` — node exists on the diagram (was PENDING before this
    verdict) — not ad hoc.
  - `NO_EVIDENCE` — implementer note exists at the cited path.
  - `EDIT_UNVERIFIED` — real terminal output pasted for both build and
    test claims.
  - `CODE_IN_HAVEN` — the throwaway `test-schema.js` repro script is
    explicitly noted as deleted after use, never committed, never placed
    under `haven/` — no leak.
  - `DIAGRAM_DRIFT` — `add-visit-tracking`'s SEALED row was not flipped
    back to PENDING/REOPEN; this is correctly a brand-new node instead.
- **Seal gate**: note states no commit/push happened, diff deferred to
  operator/`/ship`/`/release`. Correct — no outward-facing action is the
  right state here, not a gap.
- **Proportion**: diff is exactly what the "Scope decision" describes —
  removing one `_id: ObjectId,` field from `src/models/visit.model.ts`,
  replaced with an explanatory comment; no other file touched. Matches
  the bug precisely, no unrelated refactor.

Verdict: **SEAL**.
