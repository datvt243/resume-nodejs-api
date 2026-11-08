# 2026-11-08 - trust-proxy-hops (diff)
- Worker: implementer · Version: 0.1.0
- Node: `trust-proxy-hops` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: #386 — "Global rate limit is likely shared by every client behind Render's proxy"
- Plan: `evidence/implementer/2026-11-08/trust-proxy-hops-plan.md`

## Hub bytes before
96406

## Feature doc
`doctrine/features/public-profile.md`

## Feature doc changed: Behavior #1 "the global rate limit applies." → "…applies, keyed per client IP (`TRUST_PROXY_HOPS` proxy hops trusted; 1 on Render)."; open question #386 answer extended; Changelog row 2026-11-08 — operator: "Bug — #386" (2026-11-07) + "browser gọi thẳng Render URL, không qua relay" (2026-11-08)

## Diff
| file | why |
|---|---|
| `src/config/proxy.config.ts` (new) | `trustProxySetting(raw = process.env.TRUST_PROXY_HOPS)` → positive integer or `undefined` |
| `src/config/index.ts` | re-export, like the other config files |
| `src/server.ts` | `runServer`: `app.set('trust proxy', N)` right after `express()` when set; unset → nothing (current behavior) |
| `src/__tests__/config/proxy.config.test.ts` (new) | parsing table (1, 2, unset, '', 0, -1, abc, 1.5); real Express server: 1 hop → `req.ip` = rightmost XFF, forged left entry ignored; unset → socket address |
| `src/middlewares/httpsRedirect.middleware.ts` | comment only: no longer claims `trust proxy` is never enabled (behavior unchanged — still reads `x-forwarded-proto` itself) |
| `src/candidate_me/index.ts` | `visitorIp` comment only: no "site's relay" (operator: no relay), explains why the visit keeps the leftmost entry while the rate limit uses the trusted one (behavior unchanged) |
| `CLAUDE.md` | Environment Variables: `TRUST_PROXY_HOPS` |
| `agent-hub/doctrine/features/public-profile.md` | Behavior #1, answer, Changelog |

Not touched: `.env.example` (reading it was denied by the session's permission rules) — listed under Noticed. `req.secure`/`req.protocol` are not read by app code (`grep`); but Express internals are: with `trust proxy` on, `req.secure` becomes true behind Render's TLS, so `express-session` (`src/config/session.config.ts`: `cookie: { secure: true }`, `saveUninitialized: true`) will start sending its `connect.sid` cookie, which it skipped before (insecure-looking request). `grep req.session` in `src/` (non-test) → no reader, so no functional effect — listed under Noticed.

## Command
- `npx jest src/__tests__/config/proxy.config.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
npx jest src/__tests__/config/proxy.config.test.ts
Tests:       10 passed, 10 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 61 passed, 63 total
Tests:       5 failed, 604 passed, 609 total

npm run build | grep -c "error TS"
0

npm run lint
✖ 274 problems (274 errors, 0 warnings)

src/server.ts | now: ✖ 5 problems (5 errors, 0 warnings) | base: ✖ 5 problems (5 errors, 0 warnings)
src/config/index.ts | now: 0 problems | base: 0 problems
src/middlewares/httpsRedirect.middleware.ts | now: 0 problems | base: 0 problems
src/candidate_me/index.ts | now: ✖ 29 problems (29 errors, 0 warnings) | base: ✖ 29 problems (29 errors, 0 warnings)
src/config/proxy.config.ts | now: 0 problems | base: (new file)
src/__tests__/config/proxy.config.test.ts | now: 0 problems | base: (new file)
```
The 5 failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/private-cv-storage-diff.md`; +10 passed / +1 suite = the new tests.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) 1 hop → rightmost XFF; forged left entry ignored; unset → socket address | tests "1 hop: req.ip is the rightmost X-Forwarded-For entry…" and "unset: req.ip stays the socket address…" (real Express + http) in `Tests: 10 passed, 10 total` |
| (1) invalid values → not trusted | `it.each` table: '', 0, -1, abc, 1.5 → `undefined` |
| (2) test file passes | `Tests:       10 passed, 10 total` |
| (3) `npm test` no new failures | `5 failed, 604 passed, 609 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base |
| (4) live two-client check | **not done** — needs `TRUST_PROXY_HOPS=1` set on Render + a deploy; operator follow-up, not claimed |
| comments per code-comments.md | why-comments only, no issue refs in non-test `src/` |

## Supersedes: none
`grep '#386' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- `.env.example` should list `TRUST_PROXY_HOPS` (couldn't read it: permission denied in this session).
- Until `TRUST_PROXY_HOPS=1` is set on the Render service, behavior is unchanged (one shared bucket).
- Side effect once `TRUST_PROXY_HOPS` is set: `express-session` starts setting an unused `connect.sid` cookie (see Diff). `express-session` looks unused app-wide (no `req.session` reader) — removing it is a separate cleanup.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge`; setting the Render env var is a separate operator action.
