# 2026-11-18 - fix-access-token-jti (seal)
Worker: verifier · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-access-token-jti` (#490, branch `fix/490-access-token-jti`) · New PM status: SEALED

Notes graded: `evidence/implementer/2026-11-18/fix-access-token-jti-plan.md`, `evidence/implementer/2026-11-18/fix-access-token-jti-diff.md`

## Isolation proof
Agent-tool spawn, description "verify_seal fix-access-token-jti", dispatched by `/todo "add jti to access tokens"` (issue #490) pass 2 on 2026-11-18 — fresh subagent context, no access to the implementer pass; diff not opened, only the notes.

## Reasoning
| Criterion (node row, as clarified) | Evidence cited in note | Result |
|---|---|---|
| (1) two same-second logins → distinct access tokens; logout one → other still 200 | `PASS src/__tests__/integration/auth.http.test.ts (11.081 s)`; red-before with old `jwtSign`: `✕ logging out one session leaves another session signed in the same second working (459 ms)` | met |
| (2) `jwtSign` same payload/same second → distinct `jti` | `PASS src/__tests__/utils/jwt.test.ts`; red-before `✕ gives every token its own jti, so the same payload signed in the same second never repeats (7 ms)`, `Tests: 2 failed, 6 passed, 8 total` | met |
| (2) auth unit tests still pass | 9 `src/__tests__/auth/*` suites PASS; `Test Suites: 10 passed, 10 total` / `Tests: 77 passed, 77 total` | met |
| (3) `npm test` green | `Test Suites: 75 passed, 75 total` / `Tests: 792 passed, 792 total` | met |
| (3) build green + Typecheck (`inside Build`, MEMORY.md) | `build exit 0`, `tsc exit 0` (same exit-code form accepted on prior seals) | met |
| (3) lint ≤ 274 baseline, none new in changed files | `✖ 273 problems (273 errors, 0 warnings)`; per-file before=after for all 7 touched files, new test `new=0` | met |
| comments per code-comments.md | row present: one WHY `//` on `jwt.sign`, two stale caller comments removed, no `(#N)` refs | met |
| Feature doc `auth-session-tokens.md` Behavior #7 (logout blacklists only the sent token) / #2 (blacklisted → 401) | criterion (1) test: phone 401 after its logout, laptop 200 | met |
| Feature doc `auth-register-login.md` Behavior #6 (refresh carries unique `jti`) | now set for every token in shared `jwtSign`; `refreshToken.test.ts`, `refreshTokenReuse.test.ts` PASS | met |

- Commands (step 4): `npm test`, `npx jest <path>`, `npm run build`, `npm run lint` — all match `doctrine/MEMORY.md`, run from repo root.
- Output (step 5): verbatim result lines; the `hc4v…` token abbreviation sits only in a parenthetical about the superseded pre-review shape, not in evidence for any criterion.
- Criteria rewrite: `## Acceptance criteria clarified` line present (sanctioned by `pick_next` step 5), reason = `/code-review` finding #1 (fix moved into the shared signer).
- Supersedes/Still open: `none`, grep of `#490` on active diagram confirms only this node.
- Review (6b2): `/code-review medium` — 4 findings, #1 and #4 fixed, #2/#3 moved to `## Noticed, not done` with reasons; label `bug`, not `security` → no `/security-review` required.
- Doctrine proposal (6c): none in note.
- Forbidden states (7): ADHOC_WORK no (node existed PENDING) · NO_EVIDENCE no · EDIT_UNVERIFIED no · CODE_IN_HAVEN no · DIAGRAM_DRIFT no (status updated by this verdict).
- Seal gate (8): no outward-facing action in the diff; `/todo` step 0 `gh` calls recorded.
- Proportionality (9): shared signer + caller cleanup + tests + `.claude/rules/api.md` auth-flow doc sync — matches the node's stated fix, nothing extra.

## Re-run
none — audit-only; note's output verbatim, commands match doctrine, every criterion cited; no Re-run-scope exception applies (not outward-facing, not a `/release` gate).

## Follow-ups (not blocking)
Noticed-not-done #1 (`isSessionRevoked` second-precision `iat < invalidatedAt`) deserves its own node/issue.
