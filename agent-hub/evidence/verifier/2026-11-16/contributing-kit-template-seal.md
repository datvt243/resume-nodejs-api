# 2026-11-16 - contributing-kit-template - SEAL

Worker: verifier · Version: 0.1.0 · Node: `contributing-kit-template` · Issue #480 · Branch `chore/480-contributing-kit-template`
Input: `evidence/implementer/2026-11-16/contributing-kit-template-plan.md`

## Isolation proof
Fresh Agent-tool spawn; task string: "You are the agent-hub VERIFIER ... run `verify_seal` exactly per the recipe's numbered steps on: Evidence note: agent-hub/evidence/implementer/2026-11-16/contributing-kit-template-plan.md ... Reply with only: verdict (SEAL or REOPEN), the verdict note path, and if REOPEN the specific reasons". No implementer reasoning in context.

## Re-run
partial — `npm test` and `npm run build` (from repo root, per `doctrine/MEMORY.md`). Reason: the dispatching operator explicitly asked for them to be re-run, and this doc is outward-facing contributor guidance.
```
Test Suites: 72 passed, 72 total
Tests:       781 passed, 781 total
build exit 0
```
Lint not run: no `.ts`/`.js` touched.

## Criteria
| Criterion | Verdict | Independent evidence |
|---|---|---|
| (1) claims match repo | ✅ | CI steps: `.github/workflows/node.js.yml` = `npm ci` → `Lint (ratchet)` `LINT_BASELINE: 274` → `npm run build --if-present` → `npm test`, matrix 20.x/22.x, so the check names are `build (20.x)`/`build (22.x)`. Protection: `gh api .../branches/{main,staging}/protection` → `enforce_admins:true`, review count 0, force-push false, deletion false, contexts `build (20.x)`,`build (22.x)`, `strict:false` (both branches). Node range: `package.json` engines `>=20.19.0 <23.0.0`. Commands: `doctrine/MEMORY.md` table. Branch naming + type rules: `doctrine/domains/PROJECT.md` "Branch naming", match. `/ship` → `Closes #<n>`: `ship.sh:93-96`; `--merge` targets `SHIP_MAIN_BRANCH=staging` (`ship.env`) through a PR (`SHIP_MERGE_VIA=pr`) with `gh pr merge --merge`. `/ship` refuses on main/staging: `ship/SKILL.md:50` guard. Bump rules: `release.sh:38-42` (`!`/BREAKING → major, `feat` → minor, else patch) + `release.env` `RELEASE_AUTO_BUMP=true`. Release: gate `npm ci`/`npm run build`/`npm test` (`release.env`), `gh pr merge --merge`, annotated tag `vX.Y.Z`, deploy `deploy.yml` (exists). `/release [patch|minor|major]`, `/todo "<task>"|#<n> [--ship]`, `/issues-ls --group`, `done-dev`, `[TAG]` group, `priority: <level>`, `[P0]`–`[P4]`, `status: <value>`: the skills' SKILL.md frontmatter/steps. |
| (2) no old rule lost | ✅ | Compared `git show HEAD:CONTRIBUTING.md` with the working copy: branch from staging, PRs into staging, `main` only through release, protection with `enforce_admins` (no direct push, owner included), review count 0 + rationale + "raise when a 2nd maintainer joins", required checks history (2026-08-30) + rationale + `strict:false` rationale, 6 release steps, merge not squash + rationale, issues close only on the default branch, Claude Code command table, `/ship` refuses main/staging. All present. |
| (3) tests + build green | ✅ | Re-run output above, same as the note. |
| comments per code-comments.md | n/a | No code touched. |

## Checks
- Command matches `doctrine/MEMORY.md` (Test, Build; Typecheck = inside Build) ✅ · output not cut ✅
- Feature doc: `none` (docs-only) ✅ · Review: `skipped — docs` on a docs task ✅ · Supersedes/Still open: none; no other open row for #480 ✅
- Doctrine proposal: none
- Forbidden states: ADHOC_WORK no (node on diagram) · NO_EVIDENCE no · EDIT_UNVERIFIED no · CODE_IN_HAVEN no · DIAGRAM_DRIFT no
- Seal gate: not outward-facing (no push/merge in this node) → none needed ✅
- Proportionality: CONTRIBUTING.md + node row only ✅

## Observations (non-blocking)
- "Releasing" lists gate (1) before version bump (2); in `release.sh` the bump commit is made locally on `release/vX.Y.Z` before the gate runs (step 4 of the script). Nothing is pushed before the gate passes, so the documented effect ("red stops here") holds; the previous version had the same ordering.
- `PROJECT.md`'s "unclear → ask" for branch type isn't carried over. That's agent guidance, and PROJECT.md is declared the source of truth.

## Verdict: SEAL
PM status: `contributing-kit-template` IN_PROGRESS → SEALED, full row archived to `haven/diagrams/dev-loop-archive.md`; oldest pointer row (`bulk-partial-message`, 2026-11-08) removed to keep 20.
