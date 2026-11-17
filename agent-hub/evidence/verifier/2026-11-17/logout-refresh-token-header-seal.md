# 2026-11-17 - logout-refresh-token-header (verdict: SEAL)
Worker: verifier · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `logout-refresh-token-header`
Notes audited: `evidence/implementer/2026-11-17/logout-refresh-token-header-plan.md`, `evidence/implementer/2026-11-17/logout-refresh-token-header-diff.md`
Issue: #475 (labels `bug`, `security`) · Branch: `fix/475-logout-refresh-token` (uncommitted)

## Isolation proof
Fresh Agent-tool subagent spawned with the task string "You are the agent-hub **verifier** worker, running as an independent subagent (you have NO access to the implementer's conversation …) Then run `verify_seal` on: Evidence notes … Node: `logout-refresh-token-header` …" — a dispatch prompt the implementer pass never had; this context holds no implementer reasoning.

## Re-run
none — audit-only (default). Not outward-facing (no commit/push), not a `/release` gate, and `doctrine/domains/PROJECT.md` lists no change class needing independent re-runs.

## Command check (step 4)
- `npm test`, `npx jest <path>`, `npm run build`, `npm run lint` — all match `doctrine/MEMORY.md` rows; Typecheck = `inside Build` → `npm run build` cited ("build exit=0").
- Lint baseline 274: note cites `✖ 274 problems (274 errors, 0 warnings)` (= baseline). Touched files: branch 23 = base 23 (`git stash`) — "none new" reading, same as prior seals (`logout-revokes-refresh`, `restrict-query-token-r2`).
- Output not cut/hidden (no `...`/"truncated" markers).

## Acceptance (node)
| Criterion | Evidence (cited from note) | Covered |
|---|---|---|
| 1. Logout with `Bearer <access>` + body `refreshToken` blacklists both; real helper; red on old code | Fixed: `✓ also blacklists the refresh token sent with the request` / `Tests: 13 skipped, 7 passed, 20 total`; old line restored: `✕ … Expected: "refresh_token"` / `Tests: 1 failed, 13 skipped, 6 passed, 20 total`; test uses `jest.requireActual` helper | yes |
| 2. `npm test` + `npm run build` green | `Tests: 781 passed, 781 total`, `Test Suites: 72 passed, 72 total`; `build exit=0` | yes |
| 3. Lint ≤ 274, none new in touched files | `274 problems`; touched 23 = 23 | yes |
| 4. Matches Behavior #7 (amended); #5 unchanged | `authRefreshToken` keeps `extractTokenFromRequest(req, 'refreshToken')` (default `allowHeader = true`); `refreshToken*.test.ts` (Bearer refresh) inside the 781 passed | yes |
| comments per code-comments.md | 3 comments cited: 1-sentence `//` WHY in `authLogout`, JSDoc `@param allowHeader` on exported fn, test `//` WHY; no issue refs/history | yes |

## Feature doc (step 6b)
`doctrine/features/auth-session-tokens.md` cited. `## Feature doc changed` present with operator answer "Logout only (Recommended)" recorded in the plan note. Behavior #7 amended (body/query/cookie, never header) — covered by criterion 1; Behavior #5 untouched (`git diff` of the doc shows only #7 + a Changelog row). Fix SEAL → doc Status left as is.
Minor, non-blocking: the new 2026-11-17 Changelog row was inserted above the older 2026-11-07 `logout-revokes-refresh` row (not in date order).

## Review (step 6b2)
`## Review` present: `/code-review medium` + `/security-review` (issue is `security`-labeled) inline; callers `verifyToken.middleware.ts:20`, `csrf.middleware.ts:17`, refresh at `auth.controller.ts:128` keep the default; CSRF path unchanged. No findings left open.

## Supersedes / Still open
`## Supersedes: none` — `grep "#475"` on the active diagram returns only this node (re-checked).

## Doctrine proposal
none.

## Forbidden states (step 7)
ADHOC_WORK: no (node on diagram) · NO_EVIDENCE: no · EDIT_UNVERIFIED: no (red/green + full suite + build + lint cited) · CODE_IN_HAVEN: no · DIAGRAM_DRIFT: no (PM status updated on this SEAL).

## Seal gate (step 8)
Not outward-facing — no commit/push. Feature-doc edit carries recorded operator approval.

## Proportionality (step 9)
3 `src/` files (helper param with backward-compatible default, 1 call site, 1 test) + diagram row + doc #7. Matches the node; no extras.

## Verdict
SEAL — every node criterion, the amended Behavior #7 and the comments row have cited evidence.

## PM status
Row archived verbatim (state SEALED) to `haven/diagrams/dev-loop-archive.md`; active row → pointer. Pointer rows would reach 21 → deleted the oldest (`ats-classic-not-applicable`, 2026-11-08; full row already in the archive).
