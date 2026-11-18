# auth-http-integration-tests — verify: SEAL

- Worker: verifier 0.1.0 · Node: `auth-http-integration-tests` (#463, branch `chore/463-auth-integration-tests`) on `haven/diagrams/dev-loop.prime-mermaid.md`
- Notes graded: `evidence/implementer/2026-11-18/auth-http-integration-tests-plan.md`, `evidence/implementer/2026-11-18/auth-http-integration-tests-diff.md`
- New PM status: **SEALED**

## Isolation proof
Agent-tool spawn, description "verify_seal auth-http-integration-tests", dispatched by `/todo #463` pass 2 on 2026-11-18, spawn=fresh. Did not write the diff; graded the notes only (diff itself not opened).

## Reasoning
Commands match `doctrine/MEMORY.md` (Test one file, Test, Build = Typecheck `inside Build`, Lint with baseline 274), all run from the repo root.

| Criterion | Evidence in note | OK |
|---|---|---|
| 1. register→login→GET→refresh→logout, logged-out token rejected | `✓ register → login → authenticated GET → refresh → logout, then the logged-out token is rejected` (GET 401 `TOKEN_REVOKED`, refresh 401 `TOKEN_REVOKED`) | yes |
| 2. rotated refresh reuse >10s revokes all sessions | `✓ reusing a rotated refresh token after the 10s grace window revokes every session` (reuse 401, both access tokens 401, rotated refresh 401) | yes |
| 3. cookie-only POST without CSRF → 403 | `✓ rejects a cookie-only state-changing request without the CSRF header` (403 `CSRF_TOKEN_INVALID`, nothing written) | yes |
| 4. client `candidateId` ignored (IDOR) | `✓ ignores a client-supplied candidateId (IDOR)` | yes |
| 5. unknown route → 404 standard shape | `✓ answers an unknown route with 404 in the standard error shape` | yes |
| 6. Redis absent → in-memory fallback | `✓ runs with Redis absent (in-memory blacklist/revocation fallback)`; criteria 1-3 pass with Redis never initialised | yes |
| One-file test green | `Tests: 6 passed, 6 total` | yes |
| `npm test` green | `Test Suites: 74 passed, 74 total` / `Tests: 790 passed, 790 total` | yes |
| `npm run build` green (typecheck) | `build exit 0`, `tsc exit 0` | yes |
| Lint ≤ 274, none in changed files | `✖ 273 problems`. Changed files: test file 0; `src/server.ts` 4, all pre-existing (5 on `staging`: lines 7/8 module-alias `require`, `isConnected && runServer(...)` 144→146; the floating `startServer();` is gone). Read as "none introduced": clearing pre-existing errors would be out of scope (`SmallestDiff`). Confirmed by re-run below. | yes |
| comments per code-comments.md | row present: JSDoc on `createApp`, WHY comment on `require.main` guard, test WHY notes, no `(#N)` refs | yes |
| Feature docs (`auth-session-tokens.md` #2-#7, #9; `auth-register-login.md` #1, #3, #5, #6) | Behavior → test mapping table in the diff note; I read both docs' Behavior sections, the mapping matches. Chore, not `feat` → doc Status untouched. | yes |
| Entry point unchanged | smoke: direct run reaches `connectMongo` (`ECONNREFUSED 127.0.0.1:1`); import → `imported, no start` | yes |

- Supersedes / Still open: `none` (grep `#463` → only this node). OK.
- Review: `/code-review medium`, 9 findings, each fixed or justified (jti bug + postinstall download moved to Noticed). No `security` label → no `/security-review` required. OK.
- Doctrine proposal: none.
- Forbidden states (5): none hit. Node exists on the active diagram; evidence present; no code in `haven/`; no own work graded; PM status only moves forward.
- Seal gate: no outward-facing action (no commit/push). OK.
- Proportionality: `src/server.ts` refactor (`createApp()` + `require.main` guard) is the minimum needed to import the app in tests; `CLAUDE.md` one-line rename keeps the doc accurate; dev deps are the three the plan names. Lockfile churn is npm's rewrite (`npm ls --all` exit 0). OK.

## Noted for the operator (not blocking)
- Diff note "Noticed, not done" #1, access tokens have no `jti`: same-second tokens are identical, so logout on one device can revoke another device's session. This is a real pre-existing prod bug and should get its own node/issue.
- #2: the `mongodb-memory-server` postinstall downloads mongod on `npm ci` (CI and the Docker deps stage). No GitHub CI run observed yet.

## Re-run: partial
`npx eslint src/server.ts src/__tests__/integration/auth.http.test.ts` and `git show staging:src/server.ts | npx eslint --stdin --stdin-filename src/server.ts`. Reason: the note shortened the lint messages with `...` (the output looks cut). Result matches the note exactly: after = 4 problems (7:1, 8:1, 146:5 ×2), test file clean; before = 5 problems (7:1, 8:1, 144:5 ×2, 150:1). Tests, build and full lint were not re-run.
