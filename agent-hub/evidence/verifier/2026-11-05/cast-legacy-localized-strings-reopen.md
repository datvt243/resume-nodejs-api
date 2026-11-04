# 2026-11-05 - cast-legacy-localized-strings (verdict: REOPEN)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `cast-legacy-localized-strings` (#357)
- Graded: `evidence/implementer/2026-11-05/cast-legacy-localized-strings-diff.md` (plan alongside), plus the real diff (`git diff -- src/models/part/index.ts`, new `src/__tests__/models/localizedText.test.ts`) as the dispatcher asked
- New PM status: unchanged (PENDING). REOPEN does not move the ratchet.

## Isolation proof
Spawned fresh via the Agent tool as the "verifier worker ... running as an independent subagent (you have NO history of the implementation session)", task string naming node `cast-legacy-localized-strings` and both implementer notes. This context has no implementation history and did not write the diff.

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | Global plugin casts a legacy string at ANY `localizedTextSchema` path to `{ vi, en: '' }` on init; new models get it without opting in | Plugin collects paths via `schema.eachPath` but reads/writes them with `doc[path]` on the raw object. A dotted path (localized field inside a nested object, e.g. `a: { b: { type: localizedTextSchema } }`) has key `'a.b'`, which never exists on the raw doc. Verifier probe (temp test, deleted): `M.hydrate({ a: { b: 'nested' }, arr: [{ d: 'inarr' }], top: 'top' })` → `{"a":{"b":{"vi":"","en":""}}, "arr":[{"d":{"vi":"inarr","en":""}}], "top":{"vi":"top","en":""}}`. Top-level and array-subdoc paths work; the nested path is still silently blanked, which is the exact #357 failure for the next localized field | **Missing** |
| 2 | Hydrate test over every real localized model, string kept as `vi`, objects unchanged, doc valid | Re-ran `npx jest src/__tests__/models/localizedText.test.ts`: `Tests: 9 passed` (within `10 passed, 10 total` with the probe). All 10 current paths (grep of `localizedTextSchema` in `src/models`) are top-level and covered. Implementer's mutation → `8 failed, 1 passed` | Covered |
| 3 | `npm test` green (pre-existing only), build 0, lint ≤ 274 none in touched | Note: `5 failed, 505 passed, 510 total`; same 5 on base (`5 failed, 2 passed, 7 total` for the 2 suites, env: `.env` TOKEN_EXP_IN, no Chrome) — consistent with prior seals' pre-existing set; build exit 0 (typecheck inside build per MEMORY.md); lint `274` = baseline; touched files eslint exit 0. Not re-run | Covered |
| 4 | Comments per code-comments.md | One `/** */` WHY block, one `//` typing workaround, no issue refs — checked in the real diff, compliant | Covered |

- Commands match `doctrine/MEMORY.md`. No `...`/truncation in output.
- 6b: `## Supersedes: none` / `## Still open: none`; only this row references #357.
- Forbidden states (5): none hit.
- Seal gate: no outward action.
- Proportion: +26 lines + 1 test file — proportionate.

## Missing (for the implementer)
1. Criterion (1): support dotted paths. In the `pre('init')` hook, read/write the raw value by path segments instead of `doc[path]` (e.g. walk `path.split('.')`, or `mongoose`'s bundled `mpath` get/set if already resolvable without a new dependency).
2. Add one test: a throwaway schema with a nested localized path (`{ a: { b: { type: localizedTextSchema } } }`) hydrated from `{ a: { b: 'x' } }` → `{ vi: 'x', en: '' }`. Optionally an array-of-subdocs case (already works, but pins it).

## Re-run
partial — `npx jest src/__tests__/models/localizedText.test.ts` plus a temporary probe test (`src/__tests__/zz_tmp/nested.test.ts`, deleted after; no src file mutated). Reason: dispatcher instructed judging the real code, not only the note; the probe was needed to prove/disprove criterion (1)'s "ANY path" claim, which the note's tests cannot show.
