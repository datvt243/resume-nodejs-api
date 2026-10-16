# 2026-10-16 — add-visit-profile-tracking (verifier verdict)

Worker: verifier (independent subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-visit-profile-tracking` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row), GitHub issue #253
New PM status: **SEALED**

## Isolation proof
This was a fresh Agent spawn, briefed as "Verify add-visit-profile-tracking seal" (round 2 of `/todo #253`). The main session dispatched it after the implementer pass. I have none of that pass's context. I wrote nothing under `src/`. My only probe file was `$S/vprobe253.ts` in the session scratchpad, with a throwaway mongod dbpath `$S/vdb` on port 27995. After the run the server was shut down (`pgrep -fl mongod` returned `none`) and both were removed (`cleaned`). `git status --short` was diffed at three points: before my runs, after the lint `git stash push -- src`/`pop`, and after the probe. All three were `STATUS_IDENTICAL`.

## Reasoning
I read both implementer notes (`evidence/implementer/2026-10-16/add-visit-profile-tracking-{plan,diff}.md`) and checked them against `git diff`. The diff table matches disk: 7 `src/` files (149+/7-), `CLAUDE.md`, `README.md`, and the diagram row. Nothing is missing from the table, and the table lists nothing extra. The commands match `doctrine/MEMORY.md`: `npm test`, `npm run build` (Typecheck row), and the eslint before/after comparison via `git stash`. The note's output is not truncated. It records the lint first pass (276→278) honestly, along with the fix.

| Criterion | Evidence |
|---|---|
| 1. `Visit.profileId` optional ObjectId, default null, ref `profile` | `visit.model.ts` diff: `profileId: { type: ObjectId, default: null, ref: 'profile' }`. My probe's `absent` case stored `null`. |
| 2. Only an owned, existing, non-deleted profile id is stored. Anything else becomes null and never errors (issue AC 1; operator decision: body `profile` only) | Code: `resolveVisitProfileId` returns null unless `candidateId` is set, `raw` is a string matching `/^[a-f\d]{24}$/i`, and `idQuerySafe` keeps `_id`. It then runs `Profile.findOne({ _id, candidateId, deletedAt: null })`, the same pattern as `handlerGetAboutMe:117-124`. Only `req.body.profile` is read. Unit tests (exact `findOne` filter, foreign/deleted → null, an 8-value `it.each` with no Profile query) PASS in my re-run. My independent live probe on mongod 8.0.1, through the real `handlerRecordVisit`, gave: `REC own true <pa>`, `REC ownUpper true <pa>`, `REC deleted true null`, `REC foreign true null` (another candidate's profile), `REC op true null` (`{ $ne: null }`), `REC malformed true null`, `REC absent true null`. Every visit succeeded, and only the owned live id was stored. |
| 3. `/visits/stats` `profiles` comes from the same `$facet` and stays own-data-only. Legacy/default visits go to null. A soft-deleted profile keeps its row with `deleted: true` (issue AC 2; operator decision 2) | Code: a new `$facet.profiles` under the existing `$match` (`$group` → `$sort` → `$lookup` → `$project`), mapped to `{ profileId, name, deleted, count }`. Facet-stage and row-mapping unit tests PASS. Live probe: `A [{"profileId":null,"name":null,"deleted":false,"count":5},{"profileId":"<pa>","name":"A-live","deleted":true,"count":2}]`. `pa` was soft-deleted after its visits were recorded, so the name was kept and the row flagged. `B [{"profileId":"<pb>","name":"B-own","deleted":false,"count":1}]`: B's visit appears only in B's stats. The implementer's probe also covers a hard-missing profile (`name: null, deleted: true`) and the legacy doc with no field → null. |
| 4. No regression to `POST visit`, `GET /visits`, `countries`, `sources` (issue AC 3) | `fnGetVisits` is untouched. The existing referrer and no-body tests are unchanged and PASS. The zero-fill test only gains `profiles: []`. Full suite: 348/348. |
| 5. Tests, `npm test`, build, lint delta 0 | My re-run: `Test Suites: 40 passed, 40 total`, `Tests: 348 passed, 348 total`, TEST_EXIT=0. The pre-existing jest "worker failed to exit gracefully" warning appeared, as it did in the sibling seal. `npm run build` gave BUILD_EXIT=0, ending in `cp -R ./src/views ./src/public ./dist/`. For lint I ran `npx eslint . --format json` on the tree and on a `git stash push -- src` baseline, diffed per file+ruleId: `lint before 276 after 276`, no DELTA lines. |
| 6. Docs | Root `CLAUDE.md` (structure rows, `/visits/stats` + `POST visit` rows, Visit model row, test-table rows), `README.md` (feature line + 2 API rows), and swagger (`requestBody.profile` in `routers/index.ts`, `profiles` schema + description in `candidate.route.ts`), all checked in `git diff`. |
| comments per code-comments.md | `visit.model.ts`: one single-sentence `//` WHY. `resolveVisitProfileId`: a `/** */` JSDoc on an exported function, giving the WHY (public route, no planted ids, never fail the visit, CastError). `visitStats.service.ts`: a multi-sentence `/** */` WHY (lookup by `_id` alone is safe because of the write-time check; a deleted profile keeps its row) and a file-overview line updated to stay true. Swagger blocks are functional docs. No `(#N)` refs and no stacked `//`. No violations. |

Forbidden states: none apply.
- ADHOC_WORK: the node row is on the diagram and the worker identity is recorded.
- NO_EVIDENCE: the plan and diff notes exist.
- EDIT_UNVERIFIED: test, build and lint were re-run and match the note.
- CODE_IN_HAVEN: the only `haven/` change is the diagram row.
- DIAGRAM_DRIFT: the row is now SEALED.

Seal gate: nothing was committed or pushed. `HEAD` == `origin/staging` == `origin/253-record-which-cv` == `89360fc`. The remote branch sits at the base commit from `/todo`'s `gh issue develop`. I made no external calls; `gh issue view` was read-only.

Proportion: the diff covers one model field, a helper plus a 3-line handler change, one facet plus its mapping and types, swagger, tests, and doc rows. There is no new dependency and no unrelated edit.

Noted, out of scope (not blocking):
- `$lookup` joins on `_id` alone, without `candidateId`. That is safe only because of the write-time ownership check, and the code comment documents this. A visit written before this node can't carry a `profileId`, so no legacy hole exists.
- This was flagged by the implementer and not verified here: `handlerGetAboutMe` may throw a CastError on a malformed `?profile=`. It could become its own node.

## Re-run
partial. I re-ran `npm test`, `npm run build`, and the eslint before/after comparison via `git stash` (status identical). I also ran an independent live mongod 8.0.1 probe of the real `handlerRecordVisit` + `handlerGetVisitStats`. This was justified because the node changes a public, unauthenticated write path with a security property (no foreign or planted ids), and because the mocked-aggregate unit tests can't prove the `$lookup` inside `$facet`.
