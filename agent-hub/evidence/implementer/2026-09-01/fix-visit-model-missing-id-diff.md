# 2026-09-01 — fix-visit-model-missing-id (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-visit-model-missing-id` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "test thử endpoint /api/me/:email/visit trên production
  luôn" — operator's test of the just-released (v1.2.0) production
  endpoint surfaced this bug directly; this note covers the fix.

## Investigation (before touching code)

1. Operator asked to test `POST /api/me/:email/visit` on the live
   production URL right after `/release` deployed v1.2.0. Ran:
   ```
   curl -sS -X POST -w '\nHTTP_STATUS:%{http_code}\n' \
     "https://nodejs-resume-api-ts.onrender.com/api/me/votan.it@gmail.com/visit"
   ```
   Real response:
   ```
   {"success":false,"errorCode":"INTERNAL_SERVER_ERROR","message":"document must have an _id before saving"}
   HTTP_STATUS:500
   ```
2. `grep -rn "_id before saving" node_modules/mongoose/lib` →
   `node_modules/mongoose/lib/model.js:312`, inside the `$save` path:
   fires when `this.$isNew` and `obj._id === void 0` at save time (obj is
   `this.toObject(...)`).
3. Compared `src/models/visit.model.ts` (as shipped in `add-visit-tracking`)
   against `src/models/award.model.ts` — both declare a bare `_id: ObjectId`
   field in the schema. Read `src/services/index.ts`'s `baseCreateDocument`
   (the codepath used by every existing CV-section create route) — it has
   an existing, commented workaround: `MODEL.create({ _id: null, ...document })`,
   with a comment explicitly describing that models with an explicit
   `_id` redeclaration don't get Mongoose's normal auto-generated id.
   `handlerRecordVisit` (candidate_me/index.ts) calls `MODEL.Visit.create(...)`
   directly — bypassing `baseCreateDocument` entirely, so it never gets
   that `_id: null` workaround, and `_id` is left fully unset.
4. **Reproduced in isolation, no DB touched** (repo's real Mongo is a
   shared prod Atlas cluster — `davidapi.jhhu4ml.mongodb.net`, per
   `src/database/mongo.db.ts` and this machine's own `.env`, so no local
   throwaway DB exists to test against safely). Wrote a standalone script
   (`test-schema.js`, deleted after use — not committed, not left under
   `haven/`) constructing `new mongoose.Schema(...)`/`new Model(...)` with
   no DB connection, just checking in-memory `_id` assignment:
   ```
   Visit (with explicit _id: ObjectId in schema) -> doc._id: undefined
   Award-style (no _id passed) -> doc._id: undefined
   Award-style (_id: null passed, matches baseCreateDocument workaround) -> doc._id: null | toObject()._id: null
   Visit FIXED (no _id field in schema) -> doc._id: new ObjectId('6a96bd9d61846adc6c7d626f')
   ```
   Confirms: the bare `_id: ObjectId` redeclaration is exactly what
   disables Mongoose's normal `auto: true` `_id` generation (matching the
   `undefined` result, which is the precise trigger condition for the
   production error at `model.js:305`). Removing the `_id` field from the
   schema entirely restores Mongoose's default auto-generating `_id` path
   — confirmed real `ObjectId` assigned at document-construction time,
   before any DB round-trip.

## Scope decision
`Visit` is a brand-new model with no existing documents and no
back-compat constraint, so the fix is to simply **not** redeclare `_id`
in its schema — letting Mongoose's default behavior apply — rather than
replicating the `_id: null` workaround `baseCreateDocument` needs for the
older models (which is itself a documented quirk, not something to
propagate to new code). Smallest diff: 1 line removed from
`src/models/visit.model.ts`, replaced with an explanatory comment; no
other file touched.

## Diff
| File | Why |
|---|---|
| `src/models/visit.model.ts` | Removed the `_id: ObjectId,` schema field. Added a comment explaining why (contrasting with `award.model.ts`'s pattern + `baseCreateDocument`'s `_id: null` workaround, and pointing at this node). |

## Command
```
npm run build
```
Output: `tsc && npm run copy` — clean, no errors.

```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, copied verbatim from `doctrine/MEMORY.md`)

Output (tail):
```
Test Suites: 10 passed, 10 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        5.766 s, estimated 6 s
Ran all test suites.
```
Same 10/54 baseline, unchanged — no existing test covered this path
(Visit has no test file, matching the precedent already noted in
`add-visit-tracking`'s own evidence note).

## Acceptance
| Criterion | Evidence |
|---|---|
| Root cause identified with a real, cited error (not guessed) | Live `curl` 500 response quoted above, `grep` pinpointing the exact Mongoose source line |
| Fix verified to actually change `_id` assignment behavior, not just "should work" | In-memory before/after schema reproduction script output (quoted above) — no DB write, no risk to production data |
| `npm run build` clean | See Command/Output above |
| `npm test` — 54/54, unchanged | See Command/Output above |
| Regression tracked as a new node, not a reopen of the SEALED `add-visit-tracking` | This node, `fix-visit-model-missing-id`, per LAI-13 |

## Noticed, not done
- Live production re-test of the actual `POST /api/me/:email/visit`
  endpoint (end-to-end, through the real deploy) is NOT done in this
  note — that only makes sense after this fix ships through `/ship` →
  `/release` and Render redeploys. Flagging for the operator/verifier as
  the real final proof once deployed.
- `baseCreateDocument`'s own `_id: null` workaround (services/index.ts)
  is a pre-existing quirk affecting Award/Certificate/Education/etc. —
  not touched here, out of scope for this node (would be its own,
  larger, cross-cutting fix).

## Seal gate
No outward-facing action taken — no `commit`/`push`. Diff to be shown to
operator in-session for review; deferred to `/ship`/`/release`.
