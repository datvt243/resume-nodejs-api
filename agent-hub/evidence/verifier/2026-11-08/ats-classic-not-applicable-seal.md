# 2026-11-08 - ats-classic-not-applicable (SEAL)
- Worker: verifier · Version: 0.1.0
- Node: `ats-classic-not-applicable` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub #406)
- New PM status: SEALED (collapsed: full row → `haven/diagrams/dev-loop-archive.md`, pointer row active; 21 pointer rows → oldest `fix-project-link-optional` deleted, full row already archived at line 144)
- Notes audited: `evidence/implementer/2026-11-08/ats-classic-not-applicable-plan.md`, `evidence/implementer/2026-11-08/ats-classic-not-applicable-diff.md`

## Isolation proof
Fresh Agent spawn, description "Verify node ats-classic-not-applicable" — not the implementer's task string (`/todo #406`). Same spawn continued after an API rate-limit cut (coordinator message, not a REOPEN resume). Diff not opened (EvidenceOnly).

## Reasoning
| Check | Evidence |
|---|---|
| Commands match `doctrine/MEMORY.md` | `npx jest <file>`, `npm test`, `npm run build` (Typecheck inside Build), `npm run lint` — all from the table |
| Typecheck | `npm run build \| grep -c "error TS"` → `0` |
| Lint baseline | `✖ 274 problems (274 errors, 0 warnings)` ≤ 274; per touched file now = base (ats-check.ts 5/5 pre-existing, other 5 files 0/0) |
| Output not cut | jest verbose + summaries verbatim; the old-code compile errors are an explicitly labeled `\| head -5` of a suite that does not compile — the claim (red on old code) is fully proven by those lines, nothing the verdict needs is hidden |
| (1) classic → both checks `applicable: false`, localized en + vi | "reports standard-headings and metadata as not applicable, with a localized message" ✓ |
| (1) excluded from score, still 10 checks | "leaves not-applicable checks out of the score" ✓ (10 checks, 8 applicable, score 100) |
| (1) `ats` unchanged, no `applicable` field | "still judges both checks for the ats template" ✓ + 25 pre-existing check tests ✓ |
| (2) both files pass, red on old code | `28 passed, 28 total`; `51 passed, 51 total`; old code: TS2353 (`template` not in `AtsCheckInput`) / TS2339 (`applicable` not on `AtsCheckResult`) |
| (3) `npm test` no new failures | `5 failed, 629 passed, 634 total` — same 5 env failures (atsPdfIntegration ×4, tokenExpiry ×1) as `bulk-partial-message-diff.md` (626 passed); 629 = 626 + 3 new |
| comments per code-comments.md | row present: 2 one-sentence JSDoc WHY on new fields, classic-branch `/** */` rewritten to stay true, one `//` in test, no issue refs in non-test `src/` |
| Feature doc (6b) | `## Feature doc` cites `doctrine/features/ats-check.md`; fix → Behavior #4/#4b evidenced above; doc acceptance: `atsChecks.test.ts` + `index.test.ts` cited passing, `keywordMatcher.test.ts` inside `npm test` (only the 2 named env suites fail), 10 checks evidenced. `## Feature doc changed` carries operator answer "Bug: report both as not applicable for classic, excluded from score — #406" (recorded in the doc's Open questions, 2026-11-07) |
| Supersedes / Still open | `none` / `none`; active diagram has no other `#406` row |
| Doctrine proposal (6c) | none in note |
| PDF export standard | not triggered — no `createPDF*.ts`/`createDocx.ts` change |
| Forbidden states | ADHOC_WORK no (node on diagram); NO_EVIDENCE no; EDIT_UNVERIFIED no (tests + typecheck cited); CODE_IN_HAVEN no (`find haven` non-md/yaml → empty); DIAGRAM_DRIFT no (row updated here) |
| Seal gate | none outward-facing in this pass (ship is `/ship --merge`) |
| Proportionality | 7 files: service field + helper + score skip, handler passes `template`, 2 locale keys, swagger + `api.md` doc of the new field (in node scope), 3 tests — matches node scope |
| 11e | fix SEAL — doc Status left as `verified` |

## Re-run
none — audit-only; note verbatim, commands match doctrine, every criterion cited.
