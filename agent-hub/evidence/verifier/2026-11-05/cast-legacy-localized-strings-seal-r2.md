# 2026-11-05 - cast-legacy-localized-strings (verdict: SEAL, round 2)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `cast-legacy-localized-strings` (#357)
- Graded: `evidence/implementer/2026-11-05/cast-legacy-localized-strings-diff-r2.md` (round 1 note + plan alongside), plus the real diff (`git diff -- src/models/part/index.ts`, untracked `src/__tests__/models/localizedText.test.ts`) as the dispatcher asked
- Prior verdict: `evidence/verifier/2026-11-05/cast-legacy-localized-strings-reopen.md` (dotted nested paths not cast)
- New PM status: SEALED (row archived to `haven/diagrams/dev-loop-archive.md`, pointer left on the active diagram; oldest pointer `docs-wiki-api-response-standard` dropped to keep 20, its full row already in the archive)

## Isolation proof
Spawned fresh via the Agent tool as the "verifier worker of this repo's agent-hub, running as an independent subagent", task string "round 2 after a REOPEN ... confirm the REOPEN reason is actually fixed", naming `...-diff-r2.md`. No implementation history in this context; this context did not write the diff.

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | One global plugin in `src/models/part/index.ts` casts a legacy string at ANY `localizedTextSchema` path to `{ vi, en: '' }` on init | Real diff: `pre('init')` now walks `path.split('.')` to the parent object and rewrites the last key. Committed test `casts a legacy string at a nested path and inside an array of subdocuments` passes. Verifier probe (temp `src/__tests__/zz_tmp/probe.test.ts`, deleted): 3-level `x.y.z: 'deep'` → `{"vi":"deep","en":""}`; nested path inside a single-nested subdoc `s.n.inner: 'sub'` → `{"vi":"sub","en":""}`; absent path → default `{"vi":"","en":""}`; non-object parent `x: 'garbage'` → no throw. REOPEN reason fixed | Covered |
| 2 | Hydrate test over every real localized model keeps string as `vi`, objects unchanged, doc valid | Re-ran: `Tests: 11 passed, 11 total` (10 committed + 1 probe); 7 model cases cover all 10 paths, plus unchanged-object and `validateSync` cases. Implementer mutation to round-1 lookup → `1 failed, 9 passed` | Covered |
| 3 | `npm test` green (pre-existing only), build 0, lint ≤ 274 and none in touched files | Re-ran `npm test`: `Test Suites: 2 failed, 54 passed, 56 total` / `Tests: 5 failed, 506 passed, 511 total`, failures only `tokenExpiry.test.ts` + `atsPdfIntegration.test.ts` (both untouched by the diff; same set accepted in round 1 as pre-existing on base). `npx eslint` on 2 touched files: exit 0. Build exit 0 and lint `274` = baseline per note (typecheck inside build per MEMORY.md), not re-run | Covered |
| 4 | Comments per code-comments.md | Diff: one `/** */` WHY block, two `//` single-sentence WHY notes (typing workaround, dotted-path walk); no issue refs or history | Covered |

- Commands match `doctrine/MEMORY.md`. No `...`/truncation in output.
- 6b: `## Supersedes: none` / `## Still open: none`; only this row references #357 on the active diagram.
- Forbidden states (5): none hit.
- Seal gate: no outward action (no commit/push).
- Proportion: round 2 adds ~8 lines to the hook + 1 test — proportionate.
- Integrity: `src/models/part/index.ts` shasum `77d91b6b13e38ed33f54e016d52be80f147a4efd` before = after my probe, matches the implementer's recorded hash; test file `bfadfb0b...` unchanged; probe dir removed (`git status --short src` shows only the reviewed changes).

## Missing
none

## Re-run
partial — `npx jest src/__tests__/models/localizedText.test.ts` + temp probe, `npm test`, `npx eslint` on the 2 touched files. Reason: dispatcher instructed judging the real code (round 2 of a REOPEN on the "ANY path" claim); build and full lint not re-run.
