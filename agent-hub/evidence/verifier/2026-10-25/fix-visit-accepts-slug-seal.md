# 2026-10-25 - fix-visit-accepts-slug (verdict)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `fix-visit-accepts-slug` (GitHub #320) in `haven/diagrams/dev-loop.prime-mermaid.md`
- Evidence audited: `evidence/implementer/2026-10-25/fix-visit-accepts-slug-plan.md`, `evidence/implementer/2026-10-25/fix-visit-accepts-slug-diff.md`
- New PM status: SEALED

## Isolation proof
Spawned as a fresh subagent via the Agent tool with description "Verify seal fix-visit-accepts-slug" and a task prompt naming this node and the two implementer notes; no implementation history in this context. Did not open the diff (only the notes + diagram + `git status` file list from the spawn context).

## Reasoning
- Command (step 4): `npx jest src/__tests__/candidate_me/index.test.ts`, `npm test`, `npm run build`, `npm run lint` — all match `doctrine/MEMORY.md`. Build row present: `BUILD_RC=0`.
- Output (step 5): no `...`/"truncated" markers; summary lines verbatim (`Tests: 45 passed, 45 total`; old code `Tests: 3 failed, 42 passed, 45 total`; `Tests: 5 failed, 471 passed, 476 total`; `✖ 274 problems`).
- AC1 (slug first, then email, both fail-closed via `candidateQuerySafe`): `✓ records a visit addressed by vanity slug, looked up by slug first` (`toHaveBeenCalledWith({ slug })`), `✓ falls back to email when no slug matches` (`toHaveBeenNthCalledWith(2, { email })`); existing `fails closed and never queries the DB when the email is rejected by QuerySafe` (`'$where:1'` → 404, `findOne` not called) still in the 45 passing — proves neither attempt reaches `findOne` with a rejected value.
- AC2 (route param + Swagger `{identifier}`, path shape unchanged, api.md row): diff table rows for `src/routers/index.ts` (`/api/me/:identifier/visit`, Swagger `{identifier}`, 404 "Unknown identifier"), `candidate.route.ts` text ref, `.claude/rules/api.md` row; `git status` shows all three modified; build clean.
- AC3 (tests): 3 new ✓ (slug → visit for c1; slug miss → email → visit; unknown → 2 lookups, 404, no visit) and they fail on old code (`3 failed`) — real regression proof; existing email + `$`-rejection tests pass.
- AC4 (test/build/lint no new): 5 failures = `auth/tokenExpiry` + `atsPdfIntegration` only, same pre-existing local-env 5 proven with diff stashed in `fix-create-returns-created-doc-diff.md` (SEALED earlier today); 476 = 473 + 3 new; `BUILD_RC=0`; lint 274 vs staging-stashed 274 → 0 new (first-pass `unbound-method` additions caught and fixed, rerun cited).
- Comments per code-comments.md: row present — one `//` WHY (slug-first + fail-closed) replacing a 2-line `//` stack (conforms to "never stack"), 404 `//` reworded, Swagger JSDoc functional only, no `(#N)` refs. No violation.
- 6b Supersedes: `## Supersedes: none`; active diagram grep for `#320` → only this row. OK.
- Forbidden states (step 7): ADHOC_WORK — node on diagram; NO_EVIDENCE — plan+diff notes present; EDIT_UNVERIFIED — runs cited verbatim incl. typecheck; CODE_IN_HAVEN — no code under `haven/`; DIAGRAM_DRIFT — resolved by this SEAL. None hit.
- Seal gate (step 8): `none` — no commit/push yet; correct.
- Proportion (step 9): 5 files, all named by the node's acceptance (code, route/Swagger x2, api.md, tests). Local `findBy` kept separate from `handlerGetAboutMe` to avoid churn; GET param rename deliberately not done (noted). No overreach.

## Re-run
none — audit-only (note verbatim, commands match doctrine, every criterion cited; node is not a `/release` gate).

## PM update
Row collapsed: full row appended (state SEALED) to `haven/diagrams/dev-loop-archive.md`; pointer row left in place. Pointer count hit 21 → deleted the oldest pointer `add-application-profile-link` (2026-10-16, full row already in archive).
