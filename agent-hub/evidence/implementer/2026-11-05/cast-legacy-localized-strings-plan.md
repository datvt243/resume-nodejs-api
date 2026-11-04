# 2026-11-05 - cast-legacy-localized-strings (plan)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `cast-legacy-localized-strings` (new, PENDING; slug grep 0 hits in active + archive)
Task: `/todo #357` — "Localized fields: old string values read back as empty { vi, en } until the migration runs"

## Hub bytes before: 84566

## Current state
- `src/models/part/index.ts:46` `localizedTextSchema` used by 10 paths in 7 models (education ×3, candidate, generalInformation ×2, award, certificate, project, experience).
- `node_modules/mongoose/lib/schema/subdocument.js:156` `SchemaSubdocument.prototype.cast` throws `ObjectExpectedError` for a non-object → on init the value is dropped, defaults applied.
- Scratch repro: a path setter does NOT run on hydrate (`{ vi: '', en: '' }`); a parent `pre('init')` hook that rewrites the raw string does (`{ vi: 'Cao Thắng', en: '' }`, `validateSync()` undefined, `isModified` false → a save does not rewrite the stored string).

## Plan
Global `mongoose.plugin` registered in `src/models/part/index.ts` (imported by every model with a localized path before `model()` compiles): walk `schema.eachPath`, collect `Subdocument` paths whose `.schema === localizedTextSchema`, add one `pre('init')` that wraps a string into `{ vi, en: '' }`. Test in `src/__tests__/models/localizedText.test.ts` via `Model.hydrate` on all 7 real models (no DB).

## Files
`src/models/part/index.ts`, `src/__tests__/models/localizedText.test.ts` (new).
