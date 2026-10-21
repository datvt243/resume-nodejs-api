# 2026-10-21 - fix-error-middleware-mapping (SEAL)

- Worker: verifier (independent subagent via Agent tool), round 2
- Node: `fix-error-middleware-mapping` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row, updated in place)
- New PM status: SEALED

## Isolation proof
Spawned fresh via the Agent tool, task "Re-verify fix-error-middleware-mapping round 2", with a dispatch prompt carrying the verifier bundle (manifest, SOUL, verify_seal recipe). No implementation-session history. I graded only the implementer plan + diff notes, the round-1 verdict note, and the node row. I did not open the diff.

## Reasoning
| Criterion (node row) | Evidence in note | Verdict |
|---|---|---|
| (1a) body-parser parse/too-large → 400 `MALFORMED_JSON` / 413 `PAYLOAD_TOO_LARGE` | `errors.test.ts` real `bodyParser.json()` tests, ✓ in verbatim targeted run | OK |
| (1b) jwt expired/malformed → 401 `TOKEN_EXPIRED`/`INVALID_TOKEN` | `refreshToken.test.ts` expired + malformed tests | OK |
| (1c) Mongoose Cast/Validation + duplicate key (round-1 gap) | Direct-to-middleware: CastError → 400 `BAD_REQUEST`, ValidationError → 400 `VALIDATION_ERROR` w/ translated details, 11000 → 409 `CONFLICT` without `E11000` text. Via `handleError`: new CastError test + existing slug/email duplicate + required-validation (vi/en) tests. All ✓ in verbatim run, 11/11 | OK (closed) |
| (1d) unknown → non-operational 500 | `toAppError` unknown branch `isOperational: false`; production test | OK |
| (2) prod hides non-operational message | production test: exact body `{success,errorCode,message:'Lỗi hệ thống'}`, text absent; dev still shows it | OK |
| (3) `handleError` no longer promotes unknown | unknown branch non-operational; `candidate.controller.test.ts` still forwards a 500 | OK |
| (4) `/auth/refresh` + `verifyToken` expired vs malformed | refresh tests + verifyToken "InvalidTokenError, not TokenExpiredError" | OK |
| (5) delete/restore/`handlerCatchError`/DOCX log, don't send | per-file diff rows plus the quoted comment "Driver text stays in the log…". No dedicated test; accepted in round 1 as catch-block removal | OK (weak) |
| (6) i18n vi+en, body keys unchanged | locale keys listed; key-set test `['errorCode','message','success']` | OK |
| PDF/DOCX standard | `createDocx.ts` touches only the catch block, no rendering change. Note says none of the 10 invariants apply and gives the reason | OK |
| Tests / Typecheck / lint (MEMORY.md cmds) | `npm test` 46/46 suites, 416/416 (verbatim, after round 2); `npm run build` = `tsc && npm run copy`, no `error TS`; lint 276 = baseline, no per-file diff | OK |
| comments per `doctrine/standards/code-comments.md` (round-1 gap) | 6 added comment blocks quoted verbatim. Each one explains WHY: the isOperational meaning, the instanceof ordering trap, the security reason for logging driver text, the stack-preservation reason, and JSDoc on the exported `toAppError`. One-sentence comments use `//`; the multi-sentence comment uses `/** */`. No `(#N)` refs, no stacked `//` | OK (closed) |

Forbidden states: ADHOC_WORK no (node on diagram, `/todo #275`); NO_EVIDENCE no; EDIT_UNVERIFIED no (test + build output verbatim, typecheck via build); CODE_IN_HAVEN no; DIAGRAM_DRIFT no (row updated to SEALED in place).
Seal gate: nothing outward-facing (no commit/push).
Proportion: the round-2 changes touch only test files. The production diff stays within the 6 items, and the out-of-scope items go to #277/#278.

## Re-run
none. I audited the notes only. Output is verbatim, the commands match MEMORY.md, and nothing is truncated. The node is not a release gate.
