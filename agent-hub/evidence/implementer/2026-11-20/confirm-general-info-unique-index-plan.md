# confirm-general-info-unique-index — plan (implementer, blocked)

- Date: 2026-11-20
- Issue: #408 https://github.com/datvt243/resume-nodejs-api/issues/408
- Branch: `408-general-information-confirm` (existing linked branch, fast-forwarded to `staging` @ 3b7e793)
- Node: `confirm-general-info-unique-index` (new row, PENDING) in `haven/diagrams/dev-loop.prime-mermaid.md`
- Outcome: **sealed_pending_verifier** (first pass this session was blocked — see "First attempt" below; resumed after the operator ran the check in MongoDB Compass)

## Hub bytes before: 99107

## Feature doc: doctrine/features/general-information.md

## Task type
devops / ops check — no `src/` change expected unless the index is missing.

## Acceptance criteria
1. On prod: `db.getCollection('general-informations').getIndexes()` includes `{ candidateId: 1 }` with `unique: true` — output cited verbatim.
2. Only if missing: duplicate `candidateId` aggregation (`$group` count > 1) cited, duplicates resolved with operator approval (destructive, seal gate), index built, step 1 re-run.

## Code anchor
- `src/models/generalInformation.model.ts:14` — `candidateId: { type: ObjectId, ..., ref: 'candidate', unique: true }` (grep, 2026-11-20).

## First attempt (blocked)
- `mcp__claude_ai_MongoDB_Atlas__atlas-list-clusters` →
  `Error running atlas-list-clusters: MCP access is disabled for every MongoDB Atlas organization this user belongs to (1 total), so no Atlas data is reachable over MCP. Retrying or re-authenticating will not change this — report it to the user so an Organization Owner can enable AI client access`

## Blocker (first attempt)
No AI-client access to the prod Atlas cluster. Not routed around (e.g. via the prod `MONGO_URI` in `.env.production` + `mongosh`): the org has explicitly disabled AI access, and connecting to prod with stored credentials is the operator's call.

## Unblock options offered (operator picked: run the check themselves in Compass)
- An Atlas Organization Owner enables AI client (MCP) access, then re-run `/todo #408`.
- Operator runs it themselves (read-only) and pastes the output:
  `! mongosh "$MONGO_URI" --quiet --eval 'printjson(db.getCollection("general-informations").getIndexes())'`
- Operator explicitly authorizes using the prod `MONGO_URI` from this session.

## Result — criterion 1
Operator connected MongoDB Compass to the prod cluster and opened the
Indexes tab of the collection. Screenshot (operator-supplied, copied
verbatim): `evidence/implementer/2026-11-20/confirm-general-info-unique-index-compass.png`
(source `~/Desktop/Screenshot 2026-11-20 at 19.50.07.png`). It shows:
- Breadcrumb: `davidapi.jhhu4ml.mongodb.net > resume-api > general-informations`
- `Documents 4`, `Indexes 2`
- `_id_` — REGULAR — 36.9 kB — UNIQUE — UNKNOWN
- `candidateId_1` — REGULAR — 36.9 kB — UNIQUE — UNKNOWN

`candidateId_1` is the default Mongoose name for `{ candidateId: 1 }`;
the UNIQUE property matches `unique: true` at
`src/models/generalInformation.model.ts:14`. Status `UNKNOWN` is Compass
not reporting a build state on this tier (the `_id_` index shows the
same); an index is only listed once it exists, and a failed unique build
is never listed. → Criterion 1 **met**.

Identification of the cluster as prod rests on the operator: they were
asked to connect with the prod `MONGO_URI` (the one Render uses) and the
database name `resume-api` matches the app. Not independently
re-checkable from this session (Atlas MCP disabled, `.env.production`
read blocked by a deny rule).

## Criterion 2
Not applicable — index present, so no duplicate scan / cleanup / build.

## Diff
`src/`: none (`git diff -- src | wc -l` → `0`). Only agent-hub files
(this note, the screenshot, the diagram row, the worker-runs.log line from
the blocked first attempt).

## Commands (verbatim from doctrine/MEMORY.md, run from repo root)
- `npm test` →
  ```
  Test Suites: 76 passed, 76 total
  Tests:       826 passed, 826 total
  Snapshots:   0 total
  Time:        24.988 s
  Ran all test suites.
  ```
- Typecheck row = `inside Build`: `npm run build` → exit 0 (tail:
  `> resume-nodejs-api@2.10.0 copy` / `> cp -R ./src/public ./dist/`).
- Lint: skipped — no changed files in `src/`.

## Review: skipped — no code diff (ops check only)

## Comments per code-comments.md: n/a — no code touched

## Feature doc changed: no — matches `general-information.md` Behavior #3 (409 on a 2nd record); the index is the DB-level backstop for it.

## Supersedes: none
(grep `#408` in the active diagram: only this row.)

## Noticed, not done
- The `blocked` line in `evidence/worker-runs.log` for this node is from
  the first attempt; this pass reaches the verifier, which logs its own.
