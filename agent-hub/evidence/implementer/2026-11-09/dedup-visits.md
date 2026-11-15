# dedup-visits — implement

- Task: #399 Dedup profile visits: one per visitor per 24h. Branch `399-dedup-profile-visits` (base `staging` @ 4b09fbb)
- Node: `dedup-visits` (PENDING, `haven/diagrams/dev-loop.prime-mermaid.md`, last row)
- Plan: `evidence/implementer/2026-11-09/dedup-visits-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 96174

## Feature doc: agent-hub/doctrine/features/profile-visits.md
## Feature doc changed: Behavior 1 gains the dedup rule (one visit per visitor IP per candidate per 24h; a repeat answers the same 200 and stores nothing; profile not in the key; an empty/unknown IP is never deduped). Changelog row added 2026-11-09 (operator answer #399, node dedup-visits). This applies the operator's recorded answer in `## Open questions`.

## Diff (src + docs)
- `src/candidate_me/index.ts`: new `VISIT_DEDUP_WINDOW_MS = 24h`. `handlerRecordVisit`, after resolving the IP: when the IP is real (not `''`/`'unknown'`) and `MODEL.Visit.exists({ candidateId: candidate._id, ip, createdAt: { $gte: new Date(Date.now() - 24h) } })` matches, it returns the same success object without running geoip, profile resolution or `create`. The success object is built once (`recorded`) and returned on both paths, so the response is identical. The query values are server-derived (`candidate._id` from the DB, `ip` either `isIP`-validated or `req.ip`), with no client-controlled object, the same as the existing `create`.
- `src/models/visit.model.ts`: `schema.index({ candidateId: 1, ip: 1, createdAt: -1 })`.
- `src/routers/index.ts`: the swagger 200 description notes the repeat-within-24h behavior.
- `.claude/rules/api.md`: visit row updated.
- Tests (`src/__tests__/candidate_me/index.test.ts`): the mock gains `Visit.exists`, plus 3 cases: a repeat within 24h (exact `exists` filter with a frozen `Date.now`, no `create`, success body), no recent visit → `create` once, and an unknown IP → no `exists` call, `create` once. Existing tests use `ip: ''` and are unaffected. XFF tests hit `exists` → `undefined` → stored as before.
- Callers: `handlerRecordVisit` is called only by `fnRecordVisit` (`src/candidate_me/index.ts`). The route is `src/routers/index.ts:165`.

## Acceptance
| Criterion | Evidence |
|---|---|
| repeat within 24h → 200 body, nothing stored | `npx jest src/__tests__/candidate_me` → `Tests: 82 passed, 82 total`, including `✓ stores nothing but still answers 200 when the same IP visited this candidate within 24h` (asserts `exists` called with `{ candidateId: 'c1', ip: '10.0.0.1', createdAt: { $gte: new Date(now - 86400000) } }`, `create` not called, result `{ success: true, data: null }`) |
| no recent visit → stored | same run: `✓ records the visit when that IP has no visit to this candidate in the last 24h` |
| unknown IP never deduped | same run: `✓ never dedups a visitor whose IP is unknown` |
| index backs the lookup | `src/models/visit.model.ts` `schema.index({ candidateId: 1, ip: 1, createdAt: -1 })`. Not exercised by a test (mocked model). Prod index creation relies on Mongoose autoIndex, see Noticed. |
| `npm test` | `Test Suites: 2 failed, 64 passed, 66 total` / `Tests: 5 failed, 654 passed, 659 total`. The failures are the same 5 pre-existing ones recorded in `evidence/implementer/2026-11-09/paginate-visits.md`: `tokenExpiry.test.ts` "falls back to a 1h access token when TOKEN_EXP_IN is unset" (local `.env` sets it) and the 4 tests in `atsPdfIntegration.test.ts` (no local Chrome). Neither touches visits. Before this diff: 655 total, 5 failed. +4 tests = 3 new + 1 already on staging after paginate-visits. |
| Typecheck (`inside Build`) | `npm run build` → exit 0 (last lines `> resume-nodejs-api@2.7.2 copy` / `> cp -R ./src/public ./dist/`), re-run after the final comment edit: `build exit 0` |
| Lint ≤ 274, none in changed files | final `npm run lint` → `✖ 274 problems (274 errors, 0 warnings)`. The first run gave 279. A per-file/rule diff of `eslint -f json .` against the stashed base showed the only delta was `src/__tests__/candidate_me/index.test.ts @typescript-eslint/unbound-method 16 -> 21`, from my `expect(MODEL.Visit.x)`. I switched those to `jest.mocked(MODEL.Visit).x` (the file's existing idiom) and the count is back to 274. No lint error falls on the changed lines of `src/candidate_me/index.ts` (hunks 250-251, 276-283, 292) or `src/models/visit.model.ts` (39-41). |
| comments per code-comments.md | Added: a `/** */` block in `handlerRecordVisit` (WHY: reloads inflate counts, why an unknown IP is excluded, plus a `shortcut:` marker for the check-then-create race). It was first written as 2 stacked `//` lines and merged into one block per the Style rule. Also added `// Backs the 24h per-IP dedup lookup in handlerRecordVisit (candidate_me/index.ts).` in the model (WHY the index exists). No issue refs in source (the `(#399)` was removed from the new test title). The swagger line is functional doc. |

## Supersedes: none
No other not-yet-SEALED row on the active diagram cites #399.

## Still open: none

## Noticed, not done
- Race: two concurrent first visits from the same IP can both be stored (check-then-create). It is marked in code with `shortcut:`. Acceptable for analytics; exact dedup would need a unique bucket key.
- The new index is created by Mongoose autoIndex on startup. If prod disables autoIndex, it has to be built by hand (like #408 for `candidateId`). Without it the lookup still works through the existing `candidateId` index, just slower.
- Old visits (before this change) are not retro-deduped.
- Design choice: the 200 for a deduped repeat is byte-identical to a stored one (it doesn't reveal whether the IP visited before).
