# 2026-10-24 - remove-unused-files (plan)

- Worker: implementer · Version: 0.1.0
- Node: `remove-unused-files` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended PENDING)
- Task: `/todo` — "chore: remove unused files — TODO.md (moved open items to #290–#293), Pug views + static css/js/img/fonts, unused fonts, constant/constant.ts, babel config/scripts/deps, pug/pdfkit deps, tracked generated CV PDF, .idea/ from git" → GitHub issue #294
- Branch: `294-chore-remove-unused` (from `staging` @ c026265, linked via `gh issue develop`)

## Hub bytes before: 249128
(Measured after the `doctrine/domains/PROJECT.md` Traps edit was already in the working tree — see "Process deviation".)

## Process deviation (recorded honestly)
The diff was produced in the operator's main session BEFORE this node existed (operator asked directly: check TODO.md, delete it; find unused files, delete them, re-check). That is `ADHOC_WORK` by the letter of `NodeBeforeCode`. Operator then ran `/ship --merge`, which stopped at the `staging` guard + SealedOnly, and asked to retro-fit the process: branch + `/todo`. This node + notes document the already-made diff; the verifier judges it on the evidence, not on trust.

## How "unused" was established
- Import-reachability walk (BFS over `import`/`require` specifiers, resolving `@/` and relative paths) from `src/server.ts` and `src/scripts/migrate-localize-text-fields.ts` → only `src/constant/constant.ts` unreachable among non-test `src/**/*.ts`.
- Non-TS assets: `grep` for `res.render` → none (only `app.set('view engine','pug')` / `app.set('views','./views')` at `src/server.ts:94-95`); classic PDF builds HTML inline (`src/services/createPDF.ts` `page.setContent`, fonts from Google Fonts at `:489-491`); `public/{css,js}` only referenced from `.pug` files; `src/services/fonts/BarlowMedium.ttf` and `public/img/code_flow.png` referenced nowhere.
- Deps: no `src/` import of `pug` or `pdfkit` (`PDFDocument` in `src/services/pdfMetadata.ts` is from `pdf-lib`); babel only used by `.babelrc` + `babel-*` scripts pointing at non-existent `src/server.js`; no babel ref in `eslint.config.mjs`/`jest.config.ts`/`tsconfig.json`/`nodemon.json`.
- `TODO.md`: stale 2026-07-05 snapshot; spot-checked against code; still-missing items filed as #290 (helmet), #291 (body limit), #292 (HSTS), #293 (graceful shutdown).

## Files
- delete: `TODO.md`, `.babelrc`, `jsconfig.json`, `src/api/.gitkeep`, `src/constant/constant.ts`, `src/views/**` (17), `src/public/{css,js,img,fonts}/**` (5), `src/services/fonts/BarlowMedium.ttf`, `src/public/pdf/votan.it@gmail.com.pdf`
- untrack: `.idea/**` (9, already in `.gitignore:38`)
- edit: `package.json` + `package-lock.json` (via `npm uninstall`), `src/server.ts`, `Dockerfile`, `README.md`, `CLAUDE.md`, `agent-hub/doctrine/domains/PROJECT.md`

## Blocked by
none — `doctrine/MEMORY.md` has real Test/Build/Lint commands.
