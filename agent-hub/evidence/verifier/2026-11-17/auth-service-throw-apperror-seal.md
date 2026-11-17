# 2026-11-17 - auth-service-throw-apperror (SEAL)
Worker: verifier · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `auth-service-throw-apperror` (GitHub #460) · Graded: `evidence/implementer/2026-11-17/auth-service-throw-apperror-diff.md` (plan: `...-plan.md`)

## Verdict: SEAL

## Isolation proof
Fresh Agent-tool spawn "verify-460-auth-service-throw-r1 / Agent description 'Verify seal auth-service-throw-apperror'" — blank context, never saw the implementation pass; only the evidence notes, node row, MEMORY.md, CLAUDE.md, feature docs and code-comments.md were read. No diff opened.

## Re-run: none
Audit-only (default). Output in the note is verbatim summary lines, nothing cut; commands match `doctrine/MEMORY.md`; not outward-facing, not a release gate.

## Command check (step 4)
`npm test`, `npx jest <path>`, `npm run build` (Typecheck row = `inside Build`, `build_exit=0` cited), `npm run lint` (baseline 274 cited: `✖ 274 problems`) all match MEMORY.md. Run from the worktree `resume-nodejs-api-460` instead of the primary checkout path — same repo on the node's branch, accepted (dispatcher-confirmed).

## Acceptance (step 6)
| Criterion | Evidence in note | Met |
|---|---|---|
| (1) no `success: false` in `auth.service.ts`; controller no longer branches on service `success` | `grep -n "success: false" auth.service.ts` → no output, exit=1; removed `if (!success)`, `if (!_result.success)`, 2× `StatusCodes[success ? ...]` | yes |
| (2) contract tests assert envelope + 400 `BAD_REQUEST` for invalid reset/verify tokens | new `errorEnvelope.test.ts` `invalid %s token → 400 BAD_REQUEST envelope` (2 cases, real `errorsMiddleware`) inside `Tests: 83 passed, 83 total` | yes |
| (3) behavior unchanged: 409 `EMAIL_EXISTS`, 401 `INVALID_CREDENTIALS` (same message unknown email/wrong password), 400 bad token | service tests assert statusCode 409/401/400 + codes + message; contract test 400 end-to-end; same `InvalidCredentialsError` + message for both login paths | yes |
| (4) `npm test` + build green, lint ≤ baseline, none new in touched files | build_exit=0; `779 passed`, 4 failures only `atsPdfIntegration.test.ts` (Chrome missing), identical on base via `git stash` (`4 failed, 4 total`); lint 274 = baseline; per-file after|before identical (controller 19|19, service test 10|10 pre-existing, rest 0) — same per-file-unchanged reading as prior seals (e.g. `2026-11-08/cv-upload-temp-rename-seal.md`) | yes |
| comments per code-comments.md | one existing WHY `//` moved/reworded in a test file; no new comments in shipped `src/` | yes |
| Supersedes / Still open (6) | `## Supersedes: none`, grep `#460` → this node only | yes |

## Feature doc (6b)
`auth-register-login.md` Behavior #2 (409), #5 (401 identical message), #7 (verify token 400); `auth-password-reset.md` Behavior #4 (bad token 400) — each covered by rows (2)/(3) above. Doc-level test criteria (`auth.controller/service/v2AuthRoute/validate` tests) inside `src/__tests__/auth` run: 83 passed. No `## Feature doc changed`. Docs already `verified` — status untouched (refactor, not feat).

## Review (6b2)
`## Review` present. `/code-review medium` misfired onto the primary checkout's #475 diff; implementer did the recipe's inline fallback (touched files + callers), findings none. Issue label `refactor` (no `security`) → no `/security-review` required. Accepted.

## Doctrine proposal (6c): none

## Forbidden states (7)
ADHOC_WORK no (node on diagram, line 84) · NO_EVIDENCE no · EDIT_UNVERIFIED no (outputs cited, typecheck via build) · CODE_IN_HAVEN no · DIAGRAM_DRIFT no (PM status updated by this SEAL).

## Seal gate (8): none — no commit/push/external action.
## Proportionality (9): service throws + controller branch removal + matching tests only; `success` destructure leftover and controller `formatReturn` validation calls left alone (SmallestDiff). OK.

## PM update (11)
Row archived verbatim (state SEALED) to `haven/diagrams/dev-loop-archive.md`; active row → pointer; pointer count hit 21 → oldest pointer `ats-classic-not-applicable` (2026-11-08, already in archive) deleted. No Supersedes, no feature-doc status change, no MEMORY change.
