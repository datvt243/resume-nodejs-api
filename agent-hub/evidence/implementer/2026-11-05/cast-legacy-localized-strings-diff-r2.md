# 2026-11-05 - cast-legacy-localized-strings (diff, round 2 after REOPEN)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `cast-legacy-localized-strings` · Task: `/todo #357`
Status: sealed_pending_verifier · Branch: `357-localized-fields-old`
REOPEN addressed: `evidence/verifier/2026-11-05/cast-legacy-localized-strings-reopen.md` — plugin used `raw[path]` with dotted `eachPath` paths, so a localized field under a nested object (`a.b`) still read back empty.

## Hub bytes before
84566

## Diff (on top of round 1, see `cast-legacy-localized-strings-diff.md`)
| file | why |
|---|---|
| `src/models/part/index.ts` | init hook walks `path.split('.')` down the raw doc to the parent object and rewrites the last key; non-object parent → skip. No new dependency (`mpath` is only transitive via mongoose). |
| `src/__tests__/models/localizedText.test.ts` | +1 test: throwaway model `{ a: { b: localizedTextSchema }, arr: [subschema { d: localizedTextSchema }] }` hydrated from `{ a: { b: 'nested' }, arr: [{ d: 'inarr' }] }` → both `{ vi, en: '' }`. |

## Command
`npx jest src/__tests__/models/localizedText.test.ts` · `npm test` · `npm run build` · `npm run lint` · `npx eslint <2 touched files>`

## Output
- New test file: `Tests:       10 passed, 10 total`
- Mutation (walk disabled → `keys = []`, `last = path`, i.e. round-1 behavior): `✕ casts a legacy string at a nested path and inside an array of subdocuments` / `Tests:       1 failed, 9 passed, 10 total`; restored, shasum `77d91b6b13e38ed33f54e016d52be80f147a4efd` before = after.
- `npm test`: `Test Suites: 2 failed, 54 passed, 56 total` / `Tests:       5 failed, 506 passed, 511 total` — same 2 files/5 tests as round 1 (`tokenExpiry.test.ts` local `.env` TOKEN_EXP_IN, `atsPdfIntegration.test.ts` no Chrome), shown identical on base code in round 1.
- `npm run build`: exit 0.
- `npm run lint`: `✖ 274 problems (274 errors, 0 warnings)` = baseline; touched files eslint exit 0.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) ANY localizedTextSchema path incl. nested + array subdocs | nested/array test passes; mutation to flat lookup fails it |
| (2) hydrate test over all real localized models | 7 model cases still pass (`10 passed`) |
| (3) npm test / build / lint | 506 passed, 5 pre-existing env failures; build 0; lint 274, touched 0 |
| (4) comments per code-comments.md | added one `//` WHY on the dotted-path walk; no issue refs |

## Supersedes: none
## Still open: none

## Noticed, not done
Same as round 1 (`.lean()` search reads, deploy-time migration option, tokenExpiry env isolation).

## Seal gate
none (no commit/push).
