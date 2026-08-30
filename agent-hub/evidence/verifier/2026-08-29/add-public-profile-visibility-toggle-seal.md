# 2026-08-29 — add-public-profile-visibility-toggle (verify_seal)

- Worker: verifier (subagent, dispatched via Agent tool, fresh session — no
  implementation history)
- Node: `add-public-profile-visibility-toggle`
- New PM status: **SEALED**
- Implementer note reviewed: `evidence/implementer/2026-08-29/add-public-profile-visibility-toggle-diff.md`
- GitHub issue: #75 (read directly via `gh issue view 75`)

## Reasoning

Read the real diff myself (`git status --short`, `git diff -- src/`), not
just the note's prose.

1. **Files match claim.** `git diff --stat -- src/` shows exactly the 4
   files claimed: `src/candidate/candidate.validate.ts` (3 lines, +2/-1),
   `src/candidate_me/index.ts` (+9), `src/config/swagger.config.ts` (+1),
   `src/models/candidate.model.ts` (+2). Total: 14 insertions, 1 deletion —
   slightly smaller than the note's stated "+19/-1" (minor inaccuracy in
   the note, not a scope gap — actual diff is smaller, not larger, so
   `SmallestDiff` still holds).

2. **`fnGetAboutMe` gate is post-success and byte-identical to the
   pre-existing not-found branch.** Read `src/candidate_me/index.ts` in
   full.
   - `fnGetAboutMe` (lines 25-48): calls `handlerGetAboutMe`, then checks
     `if (_me.success && (_me.data as any)?.isPublic === false) { return
     formatReturn(res, formatReturnFailed('Email không tồn tại')); }` —
     runs strictly AFTER the handler already succeeded.
   - `handlerGetAboutMe` (lines 50-134), pre-existing not-found branch
     (line 56): `if (!document) return formatReturnFailed('Email không
     tồn tại');` — the literal string `'Email không tồn tại'` is
     byte-identical between both branches, and both go through the same
     `formatReturnFailed()` helper, so the response shape
     (`success:false`, `data:null`, same `message`) is genuinely
     identical, not just similar. Confirmed anti-enumeration claim holds.
   - Read `handlerGetAboutMe` end-to-end (lines 50-134): no `isPublic`
     reference anywhere inside it — confirmed NOT modified to add this
     check, the gate lives only in the public wrapper.

3. **`fnExportPDF` bypasses the gate — self-export unaffected by
   privacy.** Read `fnExportPDF` (lines 136-181) in full: resolves
   `email` from `req.user._id` (authenticated, IDOR-safe), then calls
   `handlerGetAboutMe(email, lang)` directly (line 164) — never through
   `fnGetAboutMe`. Confirmed a private candidate (`isPublic:false`) can
   still export/see their own data via this authenticated path, exactly
   as the note claims.

4. **`isPublic` added only to `schemaCandidatePatch`, not `schemaCandidate`.**
   Read `src/candidate/candidate.validate.ts` in full: `isPublic: _boolean`
   (line 14) sits inside `schemaCandidatePatch` only; `schemaCandidate`
   (the full PUT schema, lines 22-46) has no `isPublic` field. Matches the
   issue's explicit "Expose the toggle via the existing `PATCH
   /api/v1/candidate/update` flow" scope. `_boolean` is a genuine
   pre-existing export (`Joi.boolean()`, `src/config/joi.config.ts:178`),
   not invented.

5. **Model field defaults to `true`.** Read `src/models/candidate.model.ts`
   in full: `isPublic: { type: Boolean, default: true, required: false }`
   (line 51) — preserves existing behavior for all current candidates, no
   migration needed/implied.

6. **`handlerUpdate` untouched, still generic.** Read
   `src/candidate/candidate.service.ts` in full (115 lines):
   `handlerUpdate` (lines 47-83) validates via `validateModel(MODEL,
   value)` then does `MODEL.updateOne({ _id: value._id || '' }, value)` —
   applies whatever keys are present in the validated `value` object
   generically. No `isPublic`-specific plumbing exists or was needed,
   confirmed by reading the whole function — `git diff` also shows this
   file was not touched at all.

7. **Build.** Ran `npm run build` myself from repo root:
   ```
   > tsc && npm run copy
   > cp -R ./src/views ./src/public ./dist/
   ```
   Clean, no errors.

8. **Tests.** Ran `npm test` myself from repo root (exact command per
   `doctrine/MEMORY.md`), verbatim tail of my own output:
   ```
   Test Suites: 10 passed, 10 total
   Tests:       52 passed, 52 total
   Snapshots:   0 total
   Time:        5.619 s, estimated 6 s
   Ran all test suites.
   ```
   Same 10 suites / 52 tests as the prior sealed baseline
   (`add-candidate-cv-upload-seal.md`) — zero regressions. No output
   truncation.

9. **Live end-to-end claim — sanity-checked via code, not re-run.** Did
   not re-run the full HTTP cycle (optional per task instructions). The
   claimed sequence (default true → PATCH false → public view returns
   identical not-found shape → self PDF export still works while private
   → PATCH back true → public view restored → self-delete cleanup) is
   fully consistent with the code paths read in points 2-6 above: the
   gate is a pure post-hoc check in `fnGetAboutMe` only, `handlerUpdate`
   generically persists `isPublic`, and `fnExportPDF` never passes
   through the gate. No contradiction found between the live-test
   narrative and the actual code.

10. **Issue match.** `gh issue view 75` confirms the issue's 3-part
    proposal: (a) `isPublic: boolean` default `true` on `Candidate` model
    — matches; (b) `GET /api/me/:email` returns 404/not-found-style
    response instead of the profile when `false`, same shape as
    "email not found" — matches, and in fact implemented more precisely
    (issue's own text suggested checking inside `handlerGetAboutMe`
    itself, but the implementer deliberately checked one layer up in
    `fnGetAboutMe` instead, with a documented reason: gating inside
    `handlerGetAboutMe` would have also blocked `fnExportPDF`'s
    self-access, which the issue never asked for). This is a sound
    interpretation of intent over literal text, not scope drift — the
    issue's actual requirement (public view blocked, no enumeration leak)
    is fully met; (c) exposed via existing `PATCH /update` flow — matches
    exactly, `schemaCandidatePatch` only, confirmed in point 4. No
    over-scope (DELETE/self-service scoping, full PUT schema, etc. — none
    touched) and no missing scope.

## Forbidden states checked
| State | Verdict |
|---|---|
| `ADHOC_WORK` | Clear — node exists on `haven/diagrams/dev-loop.prime-mermaid.md` (was already present as PENDING, added by implementer per normal loop practice), traced to GitHub issue #75. |
| `NO_EVIDENCE` | Clear — implementer note exists at the expected path with real command output. |
| `EDIT_UNVERIFIED` | Clear — I ran `npm run build` and `npm test` myself in this session and cited my own verbatim output above (not just the note's). |
| `CODE_IN_HAVEN` | Clear — `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` diff is a doc-only PM-status-row addition, no runnable code in `haven/`. |
| `DIAGRAM_DRIFT` | Resolved by this SEAL — PM status updated below to match the real, verified code state. |

## SmallestDiff check
4 files, 14 insertions / 1 deletion (verified via `git diff --stat`, not
the note's slightly-overstated "+19/-1"). No unrelated refactor — every
line traces directly to one of: the model field, the Joi patch-schema
field, the public-view gate, or the Swagger doc entry.

## Missing
None. Every acceptance criterion in the implementer note has independently
re-verified evidence above.

## Verdict: **SEAL**
