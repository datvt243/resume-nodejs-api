# 2026-09-05 — add-logout-all-sessions (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-logout-all-sessions` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): `/todo "#74"` — GitHub issue #74, "Log out of all
  devices" — revoke all active sessions. Full issue body (problem +
  proposal) passed through as the task text.

## Hub bytes before: 49747

## Investigation (before touching code)
`pick_next` found no PENDING node for this task on the diagram. Per
`NodeBeforeCode`, before drafting a fresh node, grepped `src/` for any
prior work matching the issue's own vocabulary
(`tokenVersion`/`sessionsInvalidatedAt`/`logout-all`) to avoid duplicating
existing work:

```
grep -rn "logout-all\|logoutAll\|sessionsInvalidatedAt\|tokenVersion" src/ --include="*.ts"
```

Result: the feature is **already fully implemented and merged** —
`git log --oneline` shows `03bcb66 feat(auth): add logout-all endpoint to
revoke all sessions (#74)`, merged via `4cde424 Merge pull request #105
from datvt243/feat/issue-74-logout-all-sessions` (2026-09-02), currently
on `staging` (`git status`: clean, up to date with `origin/staging`). No
diagram node or evidence note exists for it — a bookkeeping gap from
whatever session did that work, not a fresh implementation task. Verified
`git log -1 --format=%B 03bcb66` includes `Closes #74` — the GitHub issue
is still OPEN only because the merge landed on `staging`, not `main`
(auto-close fires on default-branch merge only, per
`doctrine/domains/PROJECT.md`'s recorded 2026-08-30 release-workflow
decision) — not a sign the work is incomplete.

## Diff
No new `src/` changes — the implementation predates this session. Files
already in place (read, not modified, this pass):

| File | Role |
|---|---|
| `src/utils/sessionRevocation.ts` | `invalidateAllSessions` / `getSessionsInvalidatedAt` / `isSessionRevoked` — Redis-with-in-memory-fallback "invalidated-before" timestamp, same shape as `tokenBlacklist.ts` |
| `src/middlewares/verifyToken.middleware.ts` | Rejects any token whose `iat` predates the candidate's last logout-all (`TokenRevokedError`) |
| `src/auth/auth.controller.ts` | `authLogoutAll` handler (calls `invalidateAllSessions`); `authRefreshToken` also rejects a stale refresh token the same way |
| `src/routers/api/v1/auth.route.ts` | `router.post('/logout-all', verifyToken, authLogoutAll)` + Swagger doc block |
| `src/locales/en.ts`, `src/locales/vi.ts` | `logoutAllSuccess` message, both languages |
| `src/__tests__/middlewares/verifyToken.test.ts`, `src/__tests__/auth/refreshToken.test.ts`, `src/__tests__/auth/auth.controller.test.ts` | Existing test coverage for the revocation check + `authLogoutAll` |

Design note (from the code's own comments, `sessionRevocation.ts:1-18`):
deviates from the issue's `tokenVersion`-on-`Candidate`-model proposal on
purpose — avoids adding a Mongo field + an extra DB lookup per
authenticated request, reusing the existing Redis/mem blacklist pattern
instead. The issue text itself flagged this exact tradeoff as open
("worth measuring... before deciding the final design"), so this counts
as resolving that open question, not diverging from the ask.

## Command
```
npx tsc --noEmit
```
Output: clean, no errors (no stdout).

```
npm run build
```
Output:
```
> resume-nodejs-api@1.2.1 build
> tsc && npm run copy

> resume-nodejs-api@1.2.1 copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, no errors.

```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, copied
verbatim from `doctrine/MEMORY.md`)

Output (tail):
```
PASS src/__tests__/auth/auth.controller.test.ts
  auth.controller
    authLogoutAll
      ✓ invalidates all sessions for the authenticated candidate
      ✓ fails when there is no authenticated user on the request (1 ms)

Test Suites: 13 passed, 13 total
Tests:       77 passed, 77 total
Snapshots:   0 total
Time:        5.149 s
Ran all test suites.
```
Full relevant section also includes (same run):
```
    logout-all (issue #74)
      ✓ calls next with TokenRevokedError when token was issued before the last logout-all (1 ms)
      ✓ calls next and attaches req.user when token was issued after the last logout-all
      ✓ calls next with TokenRevokedError when a logout-all is in effect but the token has no iat
```
(from `src/__tests__/middlewares/verifyToken.test.ts`)

## Acceptance
| Criterion (from issue #74) | Evidence |
|---|---|
| A way to invalidate every outstanding token at once, not just the current one | `POST /api/v1/auth/logout-all` route registered (`auth.route.ts`), `authLogoutAll` controller calls `invalidateAllSessions(candidateId)` |
| Every previously-issued token instantly invalid, without enumerating/blacklisting each one | `sessionRevocation.ts` stores one per-candidate "invalidated-before" timestamp; `isSessionRevoked` compares every token's `iat` against it — O(1) regardless of how many tokens were issued |
| Checked on every authenticated request | `verifyToken.middleware.ts` calls `getSessionsInvalidatedAt` + `isSessionRevoked` before attaching `req.user`, same `TokenRevokedError` used for blacklisted tokens |
| Refresh path also covered (stolen long-lived refresh token) | `authRefreshToken` (`auth.controller.ts`) runs the identical check before minting a new pair — test: `'returns 403 when the refresh token predates the last logout-all (issue #74)'` in `refreshToken.test.ts` |
| Design tradeoff (extra Mongo lookup vs. cached read) actually decided, not left open | Redis/mem lookup chosen (matches existing blacklist check already on every request) — 0 new Mongo round trips, documented in the commit message and file header |
| `npm test` passes | See Command/Output above — 77/77, 13/13 suites |
| `npx tsc --noEmit` clean | See Command/Output above |
| `npm run build` clean | See Command/Output above |

## Noticed, not done
- GitHub issue #74 is still shown OPEN by `gh issue list` — expected per
  the `staging`→`main` release workflow (auto-close needs a `main`
  merge), not a defect in this node. Will self-resolve on the next
  `/release`, or can be closed manually by the operator now if desired —
  out of scope for `/todo` to close issues itself.
- This node is a documentation/evidence backfill, not new code — flagging
  for the verifier that "diff" here means "confirmed pre-existing,"
  matching `NodeBeforeCode`'s intent (a node must exist and be traceable)
  even though the code came first in real history.

## Seal gate
No outward-facing action taken this pass — no `commit`/`push` (nothing to
commit; only `agent-hub/` was written, which is not outward-facing per
`CLAUDE.md`). The `src/` code itself was already committed and merged in
a prior, separate session (PR #105) — that seal-gate approval, if any,
predates this note and is not re-litigated here.
