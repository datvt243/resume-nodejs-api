# 2026-10-24 - claude-md-refactor (diff)
- Worker: implementer · Version: 0.1.0
- Node: `claude-md-refactor` · Issue #305 · Branch `305-docs-refactor-claude`
- Task: "docs: refactor CLAUDE.md theo best practices của Anthropic"

## Hub bytes before: 81279

## Diff
| File | Why |
|---|---|
| `CLAUDE.md` (459 → 86 lines, 31613 → ~9KB) | Kept: stack (compact), TS strictness rules, commands (+`npx jest <path>`, typecheck = build), env vars, build `copy` gotcha, conventions (alias, CV-section pattern, soft-delete, AppError/ERROR_STATUS, error/success envelope, logs), security invariants, workflow. Cut as derivable: `src/` tree, test-file table, error-class tree, logging internals, Path Aliases table (folded into 1 line), version/author line (said 1.9.0, `package.json` is 2.0.3). Cut as stale: middleware-order list (omitted `helmet` at `src/server.ts:37` and `notFoundHandler`) → replaced by pointer to `runServer`. `LOCAL_PORT` comment rewritten to match `src/server.ts:107` (unset → 3001 dev / 3008 prod). Added: pointer section to `.claude/rules/`, workflow (staging/main protection, `/todo`→`/ship`, `CONTRIBUTING.md`). |
| `.claude/rules/api.md` (new, 92 lines) | Old "API Endpoints" + "Auth Flow" sections, verbatim (headings demoted one level), `paths:` = routers/auth/candidate/candidate_me/candidate_profile/middlewares/utils/config. |
| `.claude/rules/models.md` (new, 49 lines) | Old "Models" + "Service Layer Pattern" sections, verbatim, `paths:` = models/services/candidate_profile. |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | Appended node row (IN_PROGRESS). |

## Command
From repo root, before edit (baseline) and after:
- `npm test`
- `npm run build`
- `npm run lint` (after, and on `git stash -u` baseline)
- `wc -l CLAUDE.md .claude/rules/*.md`
- `git check-ignore .claude/rules/api.md`

## Output
Baseline (before edit): `Test Suites: 2 failed, 48 passed, 50 total` / `Tests:       5 failed, 454 passed, 459 total`; build ended `> cp -R ./src/public ./dist/` (no tsc error).
After: `Test Suites: 2 failed, 48 passed, 50 total` / `Tests:       5 failed, 454 passed, 459 total`. Failing suites (both runs): `src/__tests__/auth/tokenExpiry.test.ts`, `src/__tests__/services/atsPdfIntegration.test.ts` — pre-existing, env-dependent, untouched by a docs-only diff.
Lint after: `✖ 275 problems (275 errors, 0 warnings)`; stash baseline: `✖ 275 problems (275 errors, 0 warnings)`.
`wc -l`: `86 CLAUDE.md`, `92 .claude/rules/api.md`, `49 .claude/rules/models.md`.
`git check-ignore` rc=1 (tracked).
Retention grep (count across new files, all ≥1): IDOR, QuerySafe, `rotated:`, 10s, CI_NO_CHROME, `npm run copy`, API-STANDARD, ERROR_STATUS, SERVICE_UNAVAILABLE, localizedTextSchema, deletedAt, createCrudService, ensureDefaultProfile, shadowed, jti, `150 req`, `credentials: true`, TOKEN_REFRESH_EXP_IN, MONGOBD_USER, noFallthroughCasesInSwitch, module-alias, `Tổng hợp`, sessionRevocation, geoip-lite, bulk.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. < 200 lines | `86 CLAUDE.md` |
| 2. derivable/stale cut | Diff table row 1; helmet at `src/server.ts:37` absent from old middleware list |
| 3. moved verbatim w/ paths | `.claude/rules/api.md`, `models.md` frontmatter |
| 4. retention | grep list above, all ≥1 |
| 5. test/lint unchanged | 5 failed/454 passed both runs; lint 275 = 275 |
| 6. not ignored | check-ignore rc=1 |
| Comments per code-comments.md | n/a — no source file touched |
| Typecheck | `npm run build` clean (tsc inside) |

## Supersedes: none
## Noticed, not done
- 2 suites fail on `staging` locally (tokenExpiry, atsPdfIntegration) — pre-existing, likely local `.env`/Chrome; not investigated.
- `npm run lint` reports 275 errors on `staging` (MEMORY.md still cites 360 baseline — stale number).
- `agent-hub/CLAUDE.md` (96 lines) is kit-owned; left for `/sys`.

## Seal gate
Operator asked in agent-hub-init session (2026-10-24): "kiểm tra các file claude.md tại project con và tiến hành điều chỉnh, xong tự ship merge luôn" — covers commit/push/PR/merge for this change.

## Correction (2026-10-24, implementer)
Diff table row 1 says "31613 → ~9KB" — actual `wc -c CLAUDE.md` = 5942 bytes. Line count (86) unaffected.
