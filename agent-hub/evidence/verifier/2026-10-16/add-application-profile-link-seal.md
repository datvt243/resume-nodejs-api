# 2026-10-16 — add-application-profile-link (verifier verdict)

Worker: verifier (independent subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-application-profile-link` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row), GitHub issue #256
New PM status: **SEALED**

## Isolation proof
This was a fresh Agent spawn, briefed as "Verify add-application-profile-link seal" (round 2 of `/todo #256`). The main session dispatched it after the implementer pass. I have none of that pass's context. I wrote nothing under `src/` except temporary mutations of `application.service.ts`. Each mutation was restored from a scratchpad copy (`$S/svc.orig`). Afterwards `SVC_RESTORED` (sha matches the original), `SRC_SHA_IDENTICAL` (sha of all 203 `src/` files vs the pre-run snapshot) and `STATUS_IDENTICAL` (`git status --short` vs the pre-run snapshot). The same three checks passed after both lint `git stash push -u -- src`/`pop` cycles. I did not run a mongod probe.

## Reasoning
I read both implementer notes (`evidence/implementer/2026-10-16/add-application-profile-link-{plan,diff}.md`) and checked them against `git diff`. The diff table matches disk: 6 `src/` files (+ the new test file), `CLAUDE.md`, `README.md`, and the diagram row. Nothing is missing from the table, and it lists nothing extra. The commands match `doctrine/MEMORY.md`: `npm test`, `npm run build` (Typecheck row), and the eslint before/after comparison via `git stash`. The note's output is not truncated. It records the first failing run of the new file (fixture lacked `_id: null`, test-only fix) honestly.

I also confirmed the trust anchor for the ownership check: `checkProfileLink` takes the candidate from `item.candidateId`. `/application` is mounted behind `verifyToken` (`routers/api/v1/index.ts:34`), which overwrites `req.body.candidateId` with the authenticated id (`verifyToken.middleware.ts:71`). So the check uses the authenticated candidate, not a client-supplied one.

| Criterion | Evidence |
|---|---|
| 1. `Application.profileId` optional ObjectId, default null, ref `profile` (issue proposal) | `application.model.ts` diff: `profileId: { type: ObjectId, default: null, ref: 'profile' }`. The implementer's live probe shows `plain.profileId= null` and `HYDRATED profileId= null`. |
| 2. Joi allows a 24-hex id, `null` or `''`, and rejects anything else (issue AC "malformed never stored") | `Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '')`. In my re-run, the `it.each` accepts (id/null/'') and the rejects (`abc`, 25-hex, `$ne`, 42, `{ $ne: null }`, `[id]`) PASS. |
| 3. A foreign, deleted or missing id → 400 (localized), nothing written, on create AND update (issue AC "foreign/deleted never stored"; operator decision 1) | Code: `idQuerySafe.safeQuery` keeps both `_id` and `candidateId`, then `ProfileModel.exists({ _id, candidateId, deletedAt: null })`. On a miss it returns `{ success:false, statusCode:400, message: t('application.profileNotFound') }` and never calls the CRUD handler. Unit tests PASS: exact `exists` filter, 400 result on create and update, CRUD not called, controller `res.status(400)`. **Adversarial mutations (mine), run against the new test file:** M1 drop the `candidateId` condition → 2 FAIL. M2 drop `deletedAt: null` → 1 FAIL. M3 `if (owned \|\| true)` → 4 FAIL. M4 call `crud.handlerUpdate(props)` on failure → 1 FAIL. All four compiled (tests ran 17 each) and were restored by checksum. The implementer's live mongod probe also shows `apps=` unchanged on rejected creates and the stored id unchanged on a rejected update. |
| 4. An owned id is stored and returned; `null`/`''` unlinks; omitted on update keeps the link (issue AC "owned stores and returns") | Unit tests PASS: owned id forwarded to CRUD, `''`/null → `profileId: null` with no lookup, omit → item passed through untouched. Implementer probe: `CREATE owned 201`, `UPDATE '' → null`, `UPDATE omit → id kept`. |
| 5. Existing applications keep working with `profileId` = null (issue AC) | Model default null. Implementer probe: `HYDRATED profileId= null in JSON= true` via the non-lean `baseFindDocument` path. |
| 6. No regression to application CRUD/soft-delete/restore (issue AC) | `handlerGet`/`handlerDelete` are re-exported unchanged. Delete/restore routes use the untouched `baseDelete`/`baseRestore`. Full suite: 378/378 PASS. |
| Operator decision 2: profile soft-deleted later → id kept | No cascade code was added (diff). Implementer probe: `UPDATE relink ... after profile soft-delete` kept the id. |
| Operator decision 3: GET returns the id only, through shared `baseGetAll` | `application.route.ts` GET is unchanged (`baseGetAll`). No join was added. |
| 7. Tests, `npm test`, build, lint delta 0, swagger + docs | My re-run: `Test Suites: 43 passed, 43 total`, `Tests: 378 passed, 378 total`, TEST_EXIT=0. The pre-existing jest "worker failed to exit gracefully" warning appeared, as in sibling seals. `npm run build` gave BUILD_EXIT=0, ending in `cp -R ./src/views ./src/public ./dist/`. For lint, `npx eslint . -f json` on the tree vs a `git stash push -u -- src` baseline, compared per file+ruleId: before 276, after 276, 0 diff lines. Swagger `Application.profileId`, CLAUDE.md (3 rows + test-table row) and the README feature line are all checked in `git diff`. |
| comments per code-comments.md | Model: one single-sentence `//` WHY (kept on profile delete). Validate: one single-sentence `//` (unlink + where ownership lives). Service: a multi-sentence `/** */` WHY on `checkProfileLink`. Test file: an overview JSDoc. Swagger description is functional docs. No `(#N)` refs and no stacked `//`. No violations. |

Forbidden states: none apply.
- ADHOC_WORK: the node row is on the diagram.
- NO_EVIDENCE: the plan and diff notes exist and cover every criterion.
- EDIT_UNVERIFIED: test, build and lint were re-run and match the note exactly (378/378, 276→276).
- CODE_IN_HAVEN: the only `haven/` change is the diagram row text.
- DIAGRAM_DRIFT: the row text ("on create and update", no bulk) matches the routes. The row is now SEALED.

Seal gate: nothing was committed or pushed. `HEAD` == `origin/staging` == remote `256-link-each-application` == `b13a314`. I made no external calls; `gh issue view` was read-only.

Proportion: the diff covers one model field, one Joi key, a ~30-line service wrapper, 2 locale strings, a swagger property, one new test file, and doc rows. There is no new dependency and no unrelated edit.

Noted, out of scope (not blocking):
- The time-of-check gap the implementer flagged (a profile deleted between `exists` and save stays linked) is consistent with operator decision 2.
- Issue's optional "profile `name` in GET" was declined by operator decision 3. The frontend needs a second lookup if it wants names.

## Re-run
partial. I re-ran `npm test`, `npm run build`, and the eslint before/after comparison via `git stash -u` (status + src checksums identical). I also ran 4 independent mutations of the ownership check against `src/__tests__/candidate_profile/application.service.test.ts`, each caught. This was justified because the node adds an IDOR-style ownership check on an authenticated write path. I did not re-run a live mongod probe. I rely on the implementer's verbatim probe output for the Mongoose casting/default and `apps=` count claims, which are consistent with the code I read.
