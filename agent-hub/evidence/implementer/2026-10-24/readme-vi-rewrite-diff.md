# 2026-10-24 - readme-vi-rewrite (plan + diff)
- Worker: implementer · Version: 0.1.0
- Node: `readme-vi-rewrite` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended)
- Task: "docs: viết lại README bằng tiếng Việt theo chuẩn README" — issue #309, branch `309-docs-readme-vi` (off `staging`)

## Hub bytes before: 81267

## Acceptance criteria
1. README in Vietnamese (technical terms/commands in English).
2. Standard Readme order: title → description → TOC (file ≥100 lines) → features → quick start/install → usage (API docs, commands) → contributing → license.
3. No emoji in headings.
4. Every command/path in README exists (package.json scripts, files, compose files).
5. No stale facts: no hardcoded version (old said 1.9.0; package.json now 2.1.0), no endpoint tables duplicating Swagger + `.claude/rules/api.md`, no src/ tree, no test-file list.
6. Every non-duplicated user-facing fact of the old README kept: Node engine range + SlowBuffer reason, env vars, Docker dev/prod (+ ports, Mongo 7, Redis not containerized), troubleshooting, branch model, deploy-on-main → Render, author, ISC license, issue link.
7. `npm test` / `npm run lint` / `npm run build` unchanged (docs-only).

## Diff
| File | Why |
|---|---|
| `README.md` (≈330 → 109 lines) | Rewritten per criteria above. Endpoint tables, auth flow, src tree, test list, per-dependency version tables, production notes dropped → links to `/api-docs`, `API-STANDARD.md`, `CONTRIBUTING.md`, `CLAUDE.md`. License stated as ISC from `package.json`, noting no `LICENSE` file exists. Old copy: agent-hub-init session scratchpad `nodejs-README.old.md`, and `git show HEAD:README.md`. |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | Appended node row (IN_PROGRESS). |

## Command
From repo root: `npm test`, `npm run lint`, `npm run build`, `wc -l README.md`, `ls .env.example API-STANDARD.md CONTRIBUTING.md docker-compose.yml`, `grep -n isCareerBreak -r src/models`.

## Output
- `Test Suites: 2 failed, 48 passed, 50 total` / `Tests:       5 failed, 454 passed, 459 total` — same as staging baseline recorded in `claude-md-refactor-diff.md` (pre-existing: tokenExpiry, atsPdfIntegration).
- `✖ 275 problems (275 errors, 0 warnings)` — same baseline.
- `npm run build`: no error lines.
- `109 README.md`. All 4 files listed exist. `src/models/experience.model.ts:35: isCareerBreak` (supports "career break" claim).
- `.github/workflows/deploy.yml:1: name: Build & Deploy to Render` (supports deploy claim).

## Acceptance
| Criterion | Evidence |
|---|---|
| 1–3 | README.md content |
| 4 | file checks above; scripts from `package.json` (`dev build start test lint lint:fix env:setup copy` present) |
| 5 | no version string; no endpoint tables (grep `\| POST` → 0) |
| 6 | README sections Bắt đầu nhanh / Docker / Xử lý sự cố / Đóng góp / License |
| 7 | test/lint counts above |
| Comments per code-comments.md | n/a — no source file touched |

## Supersedes: none
## Noticed, not done
- No `LICENSE` file despite `"license": "ISC"` in package.json — operator decision.
## Seal gate
Operator asked in agent-hub-init session (2026-10-24): "update readme ở 3 project con, tự merge luôn, hãy viết bằng tiếng Việt".
