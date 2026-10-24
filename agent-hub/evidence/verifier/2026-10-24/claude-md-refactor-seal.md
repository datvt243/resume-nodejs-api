# 2026-10-24 - claude-md-refactor (SEAL)
- Worker: verifier · Version: 0.1.0
- Node: `claude-md-refactor` · Issue #305 · Branch `305-docs-refactor-claude`
- Notes audited: `evidence/implementer/2026-10-24/claude-md-refactor-{plan,diff}.md`

## Isolation proof
Agent-tool subagent spawned fresh by the agent-hub-init session with task "agent-hub VERIFIER worker ... Node to verify: `claude-md-refactor`"; no access to the implementer's conversation or reasoning, only files on disk.

## Verdict: SEAL

## Criteria
| # | Evidence | Verified |
|---|---|---|
| 1 <200 lines | note `86 CLAUDE.md` | read new file: 86 lines, matches |
| 2 derivable/stale cut | diff table row 1 | old (`git show HEAD:CLAUDE.md`) middleware list omits `helmet` (`src/server.ts:37`) + `notFoundHandler` (`:93`) → stale, confirmed; src tree/test table/error tree/logging/version line all derivable from code/`package.json` |
| 3 moved verbatim + `paths:` | `.claude/rules/api.md`, `models.md` | compared section-by-section vs old: API Endpoints, Auth Flow, Models, Service Layer identical text, headings demoted; both have `paths:` frontmatter |
| 4 retention | grep list in note | independent old-vs-new walk: every non-derivable fact present. Only drops beyond the note's list: i18n Accept-Language line, 60s blacklist cleanup, body-limit 1mb/413, jest config, Express/Mongoose minor versions — all derivable from `language.middleware.ts`, `tokenBlacklist.ts`, `body.config.ts`, `jest.config.ts`, `package.json` |
| 5 test/lint unchanged | 5f/454p both runs; lint 275=275 | docs-only diff (no `src/` touched); verbatim counts, not re-run |
| 6 not ignored | rc=1 | re-checked `git check-ignore .claude/rules/api.md` rc=1 |
| Comments per code-comments.md | n/a | no source file touched |
| Typecheck | `npm run build` clean | matches MEMORY.md Typecheck row |

## New-claim spot checks (true against code)
- `LOCAL_PORT` "unset → 3001 dev / 3008 prod": `src/server.ts:107` + `:131` (`parseInt(LOCAL_PORT || '3001')`), set → used in every env. True.
- Scripts `dev/build/start/test/lint/lint:fix/env:*/copy` match `package.json:7-24`; build = `tsc && npm run copy`.
- `CI_NO_CHROME` skip: `src/__tests__/services/atsPdfIntegration.test.ts:87`.
- `/health` + `/api-docs` before `rateLimitMiddleware`: `src/server.ts:73-88`.
- `ERROR_STATUS` in `errors/AppError.ts:41`; `sendError` in `utils/helper.ts:107`; `SERVICE_UNAVAILABLE` in `utils/timeout.ts:23`.
- Files exist: `src/alias.ts`, `API-STANDARD.md`, `CONTRIBUTING.md`, `agent-hub/README.md`, `src/config/swagger.config.ts`; `/ship [--merge]` and `/release` skills exist.

## Checks
- Command matches `doctrine/MEMORY.md` (`npm test`, `npm run build`). Output not truncated.
- 6b: no other open row for #305; `## Supersedes: none`.
- Forbidden states: none hit (node on diagram, evidence present, no code in haven, no diagram drift).
- Seal gate: operator approval quoted in diff note.
- Proportion: diff = CLAUDE.md + 2 rule files + diagram row; matches node.

## Re-run: none
Docs-only, not outward-facing/release; notes verbatim and cover every criterion. Only `git check-ignore` re-checked (not a build/test command).

## Noticed, not done
- `doctrine/domains/PROJECT.md:49` trap still says no `lint` script exists — stale (`package.json:21` has it). Also MEMORY.md lint baseline 360 vs 275 (implementer note). Doctrine follow-up, outside this node.
