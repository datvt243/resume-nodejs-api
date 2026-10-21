# 2026-10-20 — audit-response-error-handling (verifier SEAL)

Worker: verifier subagent via Agent tool · Version 0.1.0
Node: `audit-response-error-handling` (`haven/diagrams/dev-loop.prime-mermaid.md:153`)
New PM status: SEALED (was PENDING)

## Isolation proof
Fresh Agent-tool spawn. Given an "Operator-specific adversarial checklist" (spot-check >=6 file:line claims incl. BaseController.ts:217, candidate.controller.ts:27/35, candidate_me/index.ts:326, helper.ts:83-84, errors.middleware.ts:16-36, validation->401 lines, notFoundHandler mount, auth.service.ts:94/98; re-run probe; sample-code plausibility) that the implementer pass never saw.

## Reasoning
Spot-checks against `src/` (read-only sed/grep), all confirmed:
- Critical #1: `BaseController.ts:217` `formatReturn(res, { statusCode: StatusCodes.CREATED, ..._result })`; same at `generalInformation.controller.ts:58`.
- Critical #2: `candidate.controller.ts:27` (fnGetInformationById) and `:35` (fnGetInformationByEmail, routed `candidate.route.ts:334`) await with no try/catch; `handlerGetInformationByEmail` (`candidate.service.ts:64-68`) has no catch either; `candidate_me/index.ts:326` findOne precedes the `try` at :338. grep for express-async-errors / asyncHandler / unhandledRejection / catchAsync / process.on in src + package.json: zero hits.
- High #3: `helper.ts:83-84` wraps unknown err as `AppError(err.message, 500)`; `errors.middleware.ts:16-31` returns AppError message verbatim; prod-hide only at :36 for non-AppError.
- High #6: 401 on validation confirmed at `auth.controller.ts:32,64`, `candidate.controller.ts:46,231`, `generalInformation.controller.ts:70,86`.
- High #8: `notFoundHandler` only defined (`errors.middleware.ts:52`), never imported/mounted; GET-only catch-alls at `routers/index.ts:218,227` (227 = 200 "Hello World"), `api/v1/index.ts:121`, `api/v2/index.ts:14`.
- Medium #9/#10: `auth.controller.ts:42` OK/UNAUTHORIZED, `auth.service.ts:31` duplicate email; `:94` emailNotFound / `:98` wrongPassword distinct messages.
- Also: High #5 `auth.controller.ts:154` jwtVerify outside a jwt-aware catch; Medium #14 `services/index.ts:168,198` success message regardless of modifiedCount; Medium #11 `valid.ts:61` `path[0]`.
- Non-blocking imprecision: High #5 parenthetical says verifyToken "map đúng" at `verifyToken.middleware.ts:77-79`; it maps to 401 (correct status) but every JsonWebTokenError becomes `TokenExpiredError` code (TOKEN_EXPIRED even for malformed tokens). Line refs are right; worth a line in follow-up fix node 2.
- Sample code §4: plausible against real deps (`http-status-codes` has REQUEST_TOO_LONG=413, TOO_MANY_REQUESTS=429; `req.lang` exists in express.d.ts; `t`, `logger`, `NODE_ENV` exports exist). Not shipped.

Criteria:
1. Per-endpoint table: report §1. OK.
2. Ranked findings with file:line: §2 (2C/6H/8M/5L), spot-checked above. OK.
3. Unified standard: §3 envelope + status map + error-code map. OK.
4. Sample code (middleware, AppError, response helper, asyncHandler): §4. OK.
5. Runtime-proven: verifier re-ran probe under NODE_ENV=production — createFail 201 success:false, malformedJson 500, unknownPost 404 text/html, badRefresh 500 "invalid token"; 1 passed. Matches note. Probe uses real controller/middleware; only tokenBlacklist mocked.
6. Zero src diff: `git status --short` shows only agent-hub changes; `git diff --stat staging -- src` empty (before and after probe). Note cites `npm test` 44 suites/398 tests passed and `npm run build` exit 0, 0 `error TS`.
- comments per code-comments.md: n/a, no code touched. OK.

Forbidden states: ADHOC_WORK no (row exists line 153); NO_EVIDENCE no; EDIT_UNVERIFIED no (no src edit); CODE_IN_HAVEN no (haven diff = 1 row only; sample code lives in evidence/); DIAGRAM_DRIFT no.
Seal gate: no outward-facing action. SmallestDiff: diff = 1 diagram row. OK.

## Re-run
partial: re-ran the runtime probe (copied in, run, deleted, git status re-checked clean). Did not re-run full `npm test`/`npm run build` — zero src diff, note has full outputs.
