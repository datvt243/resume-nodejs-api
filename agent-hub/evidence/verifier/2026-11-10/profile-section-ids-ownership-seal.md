# 2026-11-10 - profile-section-ids-ownership (SEAL)
- Worker: verifier · Version: 0.1.0
- Node: `profile-section-ids-ownership` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub #405, branch `405-cv-profiles-reject`)
- New PM status: SEALED (collapsed: full row → `haven/diagrams/dev-loop-archive.md`, pointer row active; 21 pointer rows → oldest `fix-account-delete-cleanup` (2026-11-07) deleted, full row already archived at line 157)
- Notes audited: `evidence/implementer/2026-11-10/profile-section-ids-ownership-plan.md`, `evidence/implementer/2026-11-10/profile-section-ids-ownership-diff.md`

## Isolation proof
Fresh Agent spawn, description "Verify seal profile-section-ids-ownership", spawn token `VSEAL-405-2026-11-10-a`; task string opens "You are the agent-hub VERIFIER worker, running as an independent subagent with a blank context". The src/ diff was not opened (EvidenceOnly). One deviation, disclosed: a `grep` on `src/__tests__/candidate_profile/profile.service.test.ts` for "Tổng hợp", to confirm the feature doc's default-profile criterion has a test inside the 6/6 suite, plus a `grep` on `src/utils/helper.ts` for `errors` → `details` mapping.

## Reasoning
| Check | Evidence |
|---|---|
| Commands match `doctrine/MEMORY.md` | `npx jest src/__tests__/candidate_profile/profile.service.test.ts`, `npm test`, `npm run build` (Typecheck = inside Build), `npm run lint`, all from repo root |
| Typecheck | `npm run build` → `> cp -R ./src/public ./dist/` / `build exit=0` (tsc runs before copy) |
| Lint baseline | branch final `✖ 274 problems (274 errors, 0 warnings)` = baseline 274; first pass 276 (+2 `unbound-method`) fixed; `profile.service.ts`, `en.ts`, `vi.ts` 0 errors; test file 4 errors at pre-existing lines 45/46/62/63, same 4 as staging (same per-file-equals-base rule as `owner-export-profile-filter-seal.md`) |
| Output not cut | no `...`/truncated markers; jest summaries quoted; both earlier failed runs disclosed with cause |
| (1) suite incl. #405 cases | `Tests: 6 passed, 6 total`; cases: owned ids (incl. uppercase hex) → crud create called, query shape asserted; foreign/unknown → `ValidationError` 400 at `educationIds.1` + `referenceIds.0`, no create; update rejects then accepts |
| (2) `npm test` / build / lint | `Tests: 5 failed, 661 passed, 666 total`; the same 5 (tokenExpiry `TOKEN_EXP_IN`, 4 atsPdfIntegration no-Chrome) reproduced on stashed staging, matches the SEALED `owner-export-profile-filter` record (663 total + 3 new = 666); build exit 0; lint 274 |
| (3) feature doc Behavior | `doctrine/features/cv-profiles.md` Behavior 2 now states the rule; edge case + acceptance criterion + Changelog row `2026-11-10 … profile-section-ids-ownership` present (read) |
| (4) comments per code-comments.md | row present: 1 JSDoc on `checkSectionIds` (WHY: Joi checks shape only), 1 `//` WHY on `$in` merge; no issue refs in src comments |
| Issue: 400 with field/index | test asserts `statusCode 400` + `errors` per `<field>.<index>`; `sendError` maps `errors` → `details` (`helper.ts:114`) |
| Feature doc (6b) | cites `cv-profiles.md`; its 3 criteria: jest suite passes (6/6); foreign/unknown → 400 `<field>.<index>`, no write (above); default `Tổng hợp` profile → existing test at line 49 of the same suite, green in 6/6. `## Feature doc changed` applies the operator's recorded answer "Change: reject unknown/foreign/deleted ids with 400 — #405" (Open questions, 2026-11-07, present in the doc) |
| Supersedes / Still open | `none`; `grep '#405'` on active diagram → only this node |
| Doctrine proposal (6c) | none in note |
| Forbidden states | ADHOC_WORK no (node on diagram, implementer identity; disclosed NodeBeforeCode slip is a recipe-order issue, not the forbidden state, precedent `evidence/verifier/2026-10-21/unified-error-envelope-reopen.md`, `2026-11-09/dedup-visits-seal.md`); NO_EVIDENCE no (plan + diff notes); EDIT_UNVERIFIED no (test, typecheck, lint output cited); CODE_IN_HAVEN no (`find haven` for .ts/.js/.py/.sh → empty); DIAGRAM_DRIFT no (row updated here) |
| Seal gate | nothing outward-facing in this pass (no commit/push) |
| Proportionality | service wrapper + 1 locale key ×2 + 3 tests + feature doc, all in plan anchors; controller untouched |
| 11e | cited doc is already `verified`, so Status stays as is; INDEX row already lists `#405` |

## Noticed (not a REOPEN reason)
- Stale ids after a section entry is deleted make the next profile update fail with 400 until removed (the note says so). The frontend may need auto-pruning; worth a follow-up issue if so.

## Re-run
none — audit only, per `verify_seal` "Re-run scope": note is verbatim, commands match doctrine, every criterion is cited, not outward-facing, not a /release gate.
