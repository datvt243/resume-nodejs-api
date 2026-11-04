# 2026-11-05 - cast-legacy-localized-strings (diff)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `cast-legacy-localized-strings` · Task: `/todo #357`
Status: sealed_pending_verifier · Branch: `357-localized-fields-old`

## Hub bytes before
84566

## Diff
| file | why |
|---|---|
| `src/models/part/index.ts` | +26: global `mongoose.plugin` — collects every `Subdocument` path whose `.schema === localizedTextSchema`, adds one `pre('init')` that rewrites a raw string to `{ vi: str, en: '' }` before Mongoose casts it. `raw: unknown` + object narrowing because Mongoose typings type the init hook's 1st arg as `next` (TS2769 otherwise). |
| `src/__tests__/models/localizedText.test.ts` | new, 9 tests: `Model.hydrate` on all 7 real models / 10 localized paths keeps the string as `vi`, `isModified` false; object value unchanged; `validateSync` clean. |

## Command
`npx jest src/__tests__/models/localizedText.test.ts` · `npm test` · `npm run build` · `npm run lint` · `npx eslint <2 touched files>`

## Output
- New test: `Tests:       9 passed, 9 total`
- Mutation (part/index.ts reverted via `git checkout`, test kept): `Tests:       8 failed, 1 passed, 9 total` — restored from scratch backup, `git diff --stat` shows +26 again.
- `npm test`: `Test Suites: 2 failed, 54 passed, 56 total` / `Tests:       5 failed, 505 passed, 510 total`
  - Failing: `auth/tokenExpiry.test.ts` (1: `Expected: 3600 Received: 10800` — local `.env` sets `TOKEN_EXP_IN`), `services/atsPdfIntegration.test.ts` (4: `Could not find Chrome (ver. 127.0.6533.88)`).
  - Same 2 files with `src/models/part/index.ts` stashed (base code): `Tests:       5 failed, 2 passed, 7 total` — identical, pre-existing local-env failures, not introduced.
- `npm run build`: exit 0 (tail `cp -R ./src/public ./dist/`).
- `npm run lint`: `✖ 274 problems (274 errors, 0 warnings)` = baseline 274; `npx eslint` on the 2 touched files: exit 0.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) global plugin casts legacy string at any localizedTextSchema path | `src/models/part/index.ts` plugin; no model file touched |
| (2) hydrate test over all real localized models | `Tests: 9 passed, 9 total`; mutation → `8 failed` |
| (3) npm test green / build 0 / lint ≤274, none in touched | 505 passed, 5 failed = same 5 on base (env: `.env` TOKEN_EXP_IN, no Chrome); build exit 0; lint 274; touched files eslint exit 0 |
| (4) comments per code-comments.md | one `/** */` WHY block above plugin, one `//` on typing workaround; no issue refs |

## Supersedes: none
## Still open: none

## Noticed, not done
- `src/candidate_me/search.ts:77,88` use `.lean()` → bypass hydration; a legacy string in `school`/`major` would not match the `school.vi` search filter until migrated. Not a data-loss path; out of scope.
- Issue's 2nd option (run migrations on deploy / refuse to start) not done — casting removes the empty-read and blank-overwrite failure (`isModified` false → save leaves stored string alone).
- Local `.env` `TOKEN_EXP_IN` breaks `tokenExpiry.test.ts`'s "unset" case — test doesn't isolate env.

## Seal gate
none (no commit/push).
