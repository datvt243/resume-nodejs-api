# 2026-11-09 - dedup-visits (SEAL)
- Worker: verifier · Version: 0.1.0
- Node: `dedup-visits` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub #399, branch `399-dedup-profile-visits`)
- New PM status: SEALED (collapsed: full row → `haven/diagrams/dev-loop-archive.md`, pointer row active; 21 pointer rows → oldest `remove-get-login` (2026-11-07) deleted, full row already archived at line 155)
- Notes audited: `evidence/implementer/2026-11-09/dedup-visits-plan.md`, `evidence/implementer/2026-11-09/dedup-visits.md`

## Isolation proof
Fresh Agent spawn whose task string is "run `verify_seal` on it … Spawn mode for this verdict: `spawn=fresh`" for node `dedup-visits`, not the implementer's task string ("#399 Dedup profile visits: one per visitor per 24h"). Diff not opened (EvidenceOnly).

## Reasoning
| Check | Evidence |
|---|---|
| Commands match `doctrine/MEMORY.md` | `npx jest <path>`, `npm test`, `npm run build` (Typecheck inside Build), `npm run lint`, all from the table |
| Typecheck | `npm run build` → exit 0, last lines `> resume-nodejs-api@2.7.2 copy` / `> cp -R ./src/public ./dist/`, re-run after the final comment edit |
| Lint baseline | `✖ 274 problems (274 errors, 0 warnings)` ≤ 274; first run 279, eslint json delta vs stashed base isolated to `unbound-method` in the touched test, fixed with the file's `jest.mocked` idiom → 274; none on changed src lines |
| Output not cut | no `...`/truncated markers; jest summaries quoted |
| repeat within 24h → same 200, nothing stored | `✓ stores nothing but still answers 200 when the same IP visited this candidate within 24h` (asserts exact `exists` filter with frozen `Date.now`, `create` not called, `{ success: true, data: null }`); run `Tests: 82 passed, 82 total` |
| no recent visit → stored | `✓ records the visit when that IP has no visit to this candidate in the last 24h` |
| empty/unknown IP never deduped | `✓ never dedups a visitor whose IP is unknown` (no `exists` call, `create` once) |
| `profile` not in key | asserted filter is `{ candidateId, ip, createdAt }` only; matches operator answer in the doc |
| index backs lookup | `schema.index({ candidateId: 1, ip: 1, createdAt: -1 })` in `visit.model.ts`; not test-exercised (mocked model), autoIndex caveat disclosed under Noticed — static-schema change, acceptable |
| `npm test` | `Tests: 5 failed, 654 passed, 659 total`; same 5 env failures (tokenExpiry `.env` TOKEN_EXP_IN, atsPdfIntegration no Chrome) as the SEALED `paginate-visits` note, +4 tests accounted for |
| comments per code-comments.md | row present: one `/** */` WHY block (stacked `//` merged per Style) with a `shortcut:` race marker, one single-line WHY `//` on the index, no issue refs (removed from test title) |
| Feature doc (6b) | cites `doctrine/features/profile-visits.md`; fix → Behavior 1 dedup sentence evidenced above, rest of Behavior 1 in the same 82-test run; doc's jest criterion: `candidate_me` targeted, `visitStats`/`candidate.service` inside `npm test` (only the 2 env suites failed). `## Feature doc changed` applies the operator answer "Change: dedup, at most one visit per visitor per candidate per 24h — #399" (recorded in Open questions 2026-11-07); Changelog row present |
| Supersedes / Still open | `none`; no other #399 row on the active diagram |
| Doctrine proposal (6c) | none in note |
| Forbidden states | ADHOC_WORK no (node on diagram; the disclosed NodeBeforeCode slip — row appended after the code edit — is a recipe-order issue, not the forbidden state, same precedent as `evidence/verifier/2026-10-21/unified-error-envelope-reopen.md`); NO_EVIDENCE no; EDIT_UNVERIFIED no (tests + typecheck + lint cited); CODE_IN_HAVEN no (`find haven` for .ts/.js/.py/.sh → empty); DIAGRAM_DRIFT no (row updated here) |
| Seal gate | nothing outward-facing in this pass (ship via `/ship`) |
| Proportionality | handler + model index + swagger line + api.md row + 3 tests, all named in the plan's anchors — within scope |
| 11e | fix SEAL — doc Status left as `verified` |

## Re-run
none — audit-only per `verify_seal` "Re-run scope" (bundle overrides the spawn prompt's "re-run yourself"): note verbatim, commands match doctrine, every criterion cited, not outward-facing.
