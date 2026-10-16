# 2026-10-10 — add-visit-referrer-source (verifier verdict)

Worker: verifier (independent subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-visit-referrer-source` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row)
New PM status: **SEALED**

## Isolation proof
Fresh Agent spawn, briefed as "Verify add-visit-referrer-source seal" (round 2 of `/todo "#248"`). It received the verbatim verifier bundle (manifest, SOUL, verify_seal recipe) and the `hub_bytes_before=229877` hand-off; neither was part of the implementer pass. I have no memory of that pass and wrote no code under `src/`. My temporary probe `src/__vprobe248.ts` was deleted (`find src -name '*probe*' | wc -l` → 0). `git status --short` was identical before and after the lint stash and after the probe.

## Reasoning
I read both implementer notes (`evidence/implementer/2026-10-10/add-visit-referrer-source-{plan,diff}.md`) and checked them against the working tree with `git diff` (all 10 modified files). The diff table matches disk. The commands match `doctrine/MEMORY.md`: `npm test`, `npm run build` (Typecheck row), and eslint before/after. Output is not truncated.

| Criterion | Evidence |
|---|---|
| `Visit.referrer` optional, default null, hostname only | `visit.model.ts`: `referrer: { type: String, default: null }`. `normalizeReferrer` returns `url.hostname`, so path, query, fragment and port are dropped. My probe: `HTTPS://M.GitHub.com:8443/a?b=c#d` was stored as `github.com`. |
| Read from body `referrer` only; Referer header ignored (operator decision) | `handlerRecordVisit` reads only `req.body?.referrer`. Unit test "ignoring the Referer header" PASS. My probe sent the header `https://cv.example/` on every call, and it never appears in the stored values or in `sources`. |
| Normalize: lowercase + strip leading `www.`/`m.` | Regex `/^(www\|m)\./` applied once to the lowercased WHATWG hostname. Unit table PASS. Probe: `M.GitHub.com` → `github.com`; `https://www.` → `''` → null. |
| Malformed / non-http(s) / oversized → null, never an error | Guards cover non-string, empty, > 2048 chars, `new URL` throwing, and non-http(s) protocols. Probe: array body, `ftp://`, a raw-string body and `https://www.` were all stored as null, with every `record` returning `success: true`. The unit "returns null for %p" table PASS (it has 9 cases; the diff note says 10, a miscount in the note that does not affect the result) plus the oversized case. |
| `/visits/stats` `sources` from the same `$facet`, sorted like `countries`, old visits → null, own data only | The `$facet.sources` stage `$group _id '$referrer'` + `$sort { count: -1, _id: 1 }` sits inside the existing pipeline after the unchanged `$match`. Unit test for the facet stage PASS. Probe on a real mongod 127.0.0.1:27994: a legacy doc with no `referrer` field was counted under `source: null` (5 = legacy + 4 invalid). The other candidate's `github.com` visit was NOT counted (`github.com: 1`, mine only). `total` was 7. |
| No regression to `POST /visit` (no body) or `GET /visits` | Unit test "no body → referrer null, still success" PASS. The existing fail-closed test PASS. `fnGetVisits`/`handlerGetVisits` are untouched in `git diff`. `body-parser` json/urlencoded is global in `server.ts:41-42`, so the body is available on this route. |
| Tests added; `npm test` | Verifier re-run: `Test Suites: 39 passed, 39 total`, `Tests: 324 passed, 324 total`, TEST_EXIT=0 (the pre-existing jest "worker failed to exit gracefully" warning was also present). |
| Typecheck (`npm run build`) | Verifier re-run: BUILD_EXIT=0, ending in `cp -R ./src/views ./src/public ./dist/`. |
| Lint delta 0 | Verifier re-run: `npx eslint . --format json` on the tree vs a `git stash push -u` baseline, diffed by file and rule. Result: `lint before 276 after 276`, no DELTA lines. |
| Docs: CLAUDE.md / README / swagger | Root `CLAUDE.md` rows updated (structure, POST visit, `/visits/stats`, Visit model, test table). README updated. Swagger: `requestBody.referrer` in `routers/index.ts`, `sources` schema in `candidate.route.ts`. |
| comments per code-comments.md | `visit.model.ts`: one `//` giving a WHY (path/query may carry personal data). `normalizeReferrer`: `/** */` JSDoc on an exported function, giving the WHY of body-not-header and the never-fail contract. `visitStats.service.ts`: one `//` giving a WHY (`$group` turns a missing field into null), and the file overview was corrected to drop the now-false "no schema change". The swagger blocks are functional docs. No `(#N)` refs were added (the `(issue #135)` describe label is pre-existing), and there are no stacked `//`. No violations. |

Forbidden states: none apply.
- ADHOC_WORK: the node is on the diagram and the worker identity is recorded.
- NO_EVIDENCE: the plan and diff notes exist.
- EDIT_UNVERIFIED: test, build and lint were re-run, and the note's results match.
- CODE_IN_HAVEN: the only `haven/` change is the diagram row.
- DIAGRAM_DRIFT: the row is now SEALED.

Seal gate: there was no commit, push or external call in either pass. The branch was created by `/todo` step 0, which is part of the operator-invoked contract.

Proportion: the diff is limited to the schema field, the normalizer, the facet stage, swagger and doc rows, and tests. There is no new dependency, and 127+/17- lines changed in total.

Noted, out of scope (not blocking):
- A trailing-dot FQDN (`https://linkedin.com./`) is kept as `linkedin.com.`, separate from `linkedin.com`. Only one prefix is stripped, so `www.m.example.com` → `m.example.com`. Both are rare and consistent with the decided normalization rule.
- The frontends don't forward `referrer` yet (the implementer already noted this; separate repos).

## Re-run
partial. I re-ran `npm test`, `npm run build` and an eslint before/after comparison via `git stash` (status identical). The unit tests mock `Visit`, so they cannot prove that Mongoose persists `referrer` or that `$group` turns a missing field into null under the real `$match`. I therefore also ran an independent real-`mongod` probe (127.0.0.1 only, temp dbpath in the session scratchpad, shut down and removed afterwards) with inputs the implementer did not use: uppercase `M.` + port + fragment, IPv6, an array body, `ftp:`, a raw-string body, and a bare `www.`.
