# 2026-11-05 - add-project-type-experience-link — SEAL
- Worker: verifier · Version: 0.1.0
- Node: `add-project-type-experience-link` (`haven/diagrams/dev-loop.prime-mermaid.md`), GitHub #361
- New PM status: SEALED
- Note audited: `evidence/implementer/2026-11-05/add-project-type-experience-link-plan.md`

## Isolation proof
Fresh Agent-tool subagent spawned with description "Verify add-project-type-experience-link" and a verifier bundle at scratchpad `verifier-bundle.md` (session fda1f66b-…); no memory of the implement pass; diff not opened (note-only audit, plus a grep of the unchanged `BaseController.ts` to confirm a cited call path).

## Reasoning
| # | Criterion | Evidence (from note) | Result |
|---|---|---|---|
| 1 | Model + Joi `type` (default personal) + `experienceId` replacing unused `companyId` | diff rows model/validate; tests "defaults type to personal", "accepts …company…", "rejects an unknown type"; `companyId` no-reader grep across sibling repos cited | Covered |
| 2 | Joi: company → 24-hex required; personal → only null/'' | "rejects company without experienceId", "rejects company with a malformed id", "rejects personal with an experienceId", "accepts … null/'' personal" | Covered |
| 3 | Foreign/deleted/missing Experience → 400, nothing written, create + update | "rejects another candidate's, a deleted or a missing experience with 400 on create/update, writing nothing" (query includes `candidateId` + `deletedAt: null`, crud mocks not called) | Covered |
| 4 | Bulk create covered | note cites `BaseController.ts` fnBulkCreate → `service.handlerCreate`; confirmed by grep: `BaseController.ts:278 await service.handlerCreate(value, lang)`, file unchanged vs HEAD | Covered |
| 5 | Via `idQuerySafe` (NoSQL injection) | "rejects company with an operator object", "never queries Experience when the candidate id is rejected by QuerySafe" | Covered |
| 6 | Legacy project without `type` reads back `personal` | "reads a legacy project without type back as personal" (hydrate → `{ type: 'personal', experienceId: null }`) | Covered |
| 7 | swagger + `.claude/rules/models.md` updated | diff rows `swagger.config.ts`, `.claude/rules/models.md` | Covered |
| 8 | Tests in `src/__tests__/candidate_profile/` | new `project.service.test.ts`; targeted run `Tests: 23 passed, 23 total` (18 new + 5 #364 link tests); 516 → 534 total = +18 | Covered |
| 9 | `npm test` no new failure vs staging | `Tests: 5 failed, 529 passed, 534 total`; same 2 env suites (`tokenExpiry`, `atsPdfIntegration`) as the 516-total baseline | Covered (pre-existing only) |
| 10 | `npm run build` exit 0 / Typecheck (inside Build per MEMORY.md) | `build_exit=0` | Covered |
| 11 | Lint ≤ 274, none new in touched files | `✖ 274 problems` = baseline; touched-file eslint: 1 error at `project.validate.ts:11:3` = the pre-existing `_id`/`objectIdValidator` line (10:3 on base, accepted at `fix-project-link-optional` seal), shifted by one import line | Covered |
| 12 | comments per code-comments.md | row present: JSDoc WHY on `checkExperienceLink`, 1-line WHYs on model default + Joi rule, no issue refs | Covered |

- Commands match `doctrine/MEMORY.md` (Test, Test one file, Build, Lint); output verbatim, no truncation markers.
- Forbidden states: ADHOC_WORK no (node on diagram, branch `361-feat-project-phân`) · NO_EVIDENCE no · EDIT_UNVERIFIED no (typecheck + lint cited) · CODE_IN_HAVEN no · DIAGRAM_DRIFT resolved by this SEAL.
- Seal gate: no outward-facing action yet; operator "Approve all 4" recorded, ship after SEAL.
- Proportionality: model/validate/service + locale keys + swagger + models.md + test — all required by the node; cascade on Experience soft-delete correctly left in Noticed.
- Supersedes: none; no other open #361 row on the active diagram.

## Re-run
none — audit-only; note verbatim, commands match doctrine, every criterion cited. Security invariant (IDOR/QuerySafe) touched but node is not outward-facing, not a release gate, and PROJECT.md lists no mandatory re-run class; the one code-path claim (bulk create) was confirmed by grep of unchanged code, not by re-running any command.
