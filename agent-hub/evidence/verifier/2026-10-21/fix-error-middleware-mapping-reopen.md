# 2026-10-21 - fix-error-middleware-mapping (REOPEN)

- Worker: verifier (independent subagent via Agent tool)
- Node: `fix-error-middleware-mapping` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row)
- New PM status: PENDING (unchanged — REOPEN)

## Isolation proof
Spawned fresh via the Agent tool with task "Verify seal fix-error-middleware-mapping" and a dispatch prompt carrying the verifier bundle (manifest, SOUL, verify_seal recipe); no implementation-session history. Graded only the two implementer notes (`evidence/implementer/2026-10-21/fix-error-middleware-mapping-{plan,diff}.md`) and the node row — the diff itself was not opened.

## Reasoning
| Criterion (node row) | Evidence in note | Verdict |
|---|---|---|
| (1a) body-parser `entity.parse.failed`/`entity.too.large` → 400/413 | `errors.test.ts` malformed JSON + 200kb body tests, real `bodyParser.json()` | OK |
| (1b) jwt `TokenExpiredError`/`JsonWebTokenError` → 401 codes | `refreshToken.test.ts` expired/malformed tests | OK |
| (1c) Mongoose Cast/Validation + duplicate key mapped by `toAppError` | Only "mapping body moved verbatim" — no test name, no output, no excerpt. `errorsMiddleware` now routes every error through `toAppError` (new path for Mongoose errors reaching the middleware directly) and nothing in the note shows those three branches still map correctly | MISSING |
| (1d) anything else → non-operational 500 | `toAppError` unknown branch + production `Error('secret db text')` test | OK |
| (2) prod hides non-operational message | `errors.test.ts` production test: body exactly `{success,errorCode,message:'Lỗi hệ thống'}`, text absent; dev still shows message | OK |
| (3) `handleError` no longer promotes unknown | unknown branch `isOperational: false`; `candidate.controller.test.ts` still sees 500 + message on forwarded error | OK |
| (4) `/auth/refresh` + `verifyToken` expired vs malformed | refresh tests + new verifyToken "InvalidTokenError, not TokenExpiredError" test | OK |
| (5) delete/restore/`handlerCatchError`/DOCX log not send | Diff table rows for `services/index.ts`, `createDocx.ts` — assertion only, no test, but these are catch-block removals stated per file; acceptable as described | OK (weak) |
| (6) i18n vi+en; body keys unchanged | `locales/{en,vi}.ts` keys listed; `asyncErrors.test.ts` key-set test still `['errorCode','message','success']` | OK |
| Tests / build / lint | `npm test` 46/46 suites, 412/412; `npm run build` ran `tsc && npm run copy` with no errors; lint 276 = 276 baseline (eslint JSON count, same as `npm run lint`) | OK |
| comments per `doctrine/standards/code-comments.md` | Self-assertion only ("WHY-only, `//` one-liners…"), no quoted comment lines | OK (weak) |

Forbidden states: ADHOC_WORK no (node exists, via `/todo #275`); NO_EVIDENCE — partial, see (1c); EDIT_UNVERIFIED no (test + build output present); CODE_IN_HAVEN no (only the PENDING row added to haven); DIAGRAM_DRIFT no.
Seal gate: nothing outward-facing (no commit/push). Proportion: diff stays within the six acceptance items; "Noticed, not done" items correctly deferred to #277/#278.

## Missing
1. Acceptance (1c): evidence that `toAppError` maps Mongoose `CastError`, `ValidationError`, and duplicate key (`code 11000`) to their 4xx codes, both via `handleError` and when the error reaches `errorsMiddleware` directly. Cite the existing or new test names (e.g. in `helper.test.ts` / `errors.test.ts`) and show them passing in the run output, or add a test if none exists.
2. (Cheap, while at it) quote the new comment lines (or `git diff | grep '^+.*//'`) in the comments row instead of asserting them.

## Re-run
none — audited the notes only; the gap is missing evidence, not a suspect result.
