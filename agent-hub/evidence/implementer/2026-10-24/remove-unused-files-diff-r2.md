# 2026-10-24 - remove-unused-files (diff, round 2)

- Worker: implementer · Version: 0.1.0
- Node: `remove-unused-files` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: GitHub issue #294 — answering verifier REOPEN `evidence/verifier/2026-10-24/remove-unused-files-reopen.md`
- Supersedes nothing: round-1 note `remove-unused-files-diff.md` stays; this note adds the missing citations. No `src/` change in round 2.

## Hub bytes before: 249128

## Diff (round 2)
| File | Why |
|---|---|
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | Node row text only (PM status untouched, still PENDING): appended acceptance (7) covering the PROJECT.md Traps edits — chosen over reverting them, because reverting would put back two traps the code below shows are already fixed |
| `.idea/**` | Re-confirmed staged as deleted (`git status --short .idea` → `D  .idea/.gitignore`, `D  .idea/codeStyles/Project.xml`, …) |

## Command
`doctrine/MEMORY.md` commands unchanged from round 1 (`npm test`, `npm run build`, `npm run lint`); round 2 adds the read-only evidence commands below. No code changed, so test/build output from round 1 still applies.

## Output — REOPEN item 1 (criterion 1: unreachable / unreferenced)
```
$ node reach.js   # BFS import walk from src/server.ts + src/scripts/migrate-localize-text-fields.ts, run on staging tree (git stash)
src/constant/constant.ts

$ grep -rn "res.render\|renderFile\|compileFile" src --include="*.ts"
(exit 1)

$ git show staging:<file> refs — grep on STAGING tree for asset names outside src/views:
(exit 1)

$ grep -rnE "views|pug" src --include="*.ts" (current tree)
(exit 1)
```
Reading: the import walk on the staging tree finds exactly one unreachable non-test module (`src/constant/constant.ts`); no Pug rendering call exists; on `staging`, outside `src/views`/`TODO.md`/`agent-hub`, nothing references `styles.css`, `script_module`, `js/index.js`, `code_flow`, `BarlowMedium` or `constant/constant` — so every deleted asset was referenced only by the deleted `.pug` views or by nothing.

## Output — REOPEN items 2, 3, 4 (criteria 2, 4, 7)
```
$ shasum package-lock.json; npm install --package-lock-only; shasum package-lock.json
7f7cdde01716e1816f957c76e3bc6f2b7a938948  package-lock.json
npm warn allow-scripts   puppeteer@22.15.0 (postinstall: node install.mjs)
npm warn allow-scripts
npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
7f7cdde01716e1816f957c76e3bc6f2b7a938948  package-lock.json

$ npm ls pug pdfkit @babel/runtime @babel/cli @babel/core @babel/eslint-parser @babel/node @babel/plugin-transform-runtime @babel/preset-env babel-plugin-module-resolver --depth=0
resume-nodejs-api@2.0.1 /Users/_david/Workspace/Project/resume/resume-nodejs-api
└── (empty)

(exit 1)

$ grep -rnE "from ['\"](pug|pdfkit|@babel)|require\(['\"](pug|pdfkit|@babel)" src | wc -l
       0

$ gh issue view N --json number,title,state,url (290-294)
#290 OPEN feat(security): add HTTP security headers (helmet) https://github.com/datvt243/resume-nodejs-api/issues/290
#291 OPEN fix(security): set an explicit request body size limit https://github.com/datvt243/resume-nodejs-api/issues/291
#292 OPEN feat(security): HTTPS enforcement / HSTS https://github.com/datvt243/resume-nodejs-api/issues/292
#293 OPEN feat(server): graceful shutdown — close MongoDB + Redis on SIGTERM https://github.com/datvt243/resume-nodejs-api/issues/293
#294 OPEN chore: remove unused files and dependencies https://github.com/datvt243/resume-nodejs-api/issues/294

$ grep -n executablePath src/services/createPDF.ts src/services/createPDF.ats.ts
src/services/createPDF.ats.ts:408:  const executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'];
src/services/createPDF.ats.ts:410:    ...(executablePath ? { executablePath } : {}),
src/services/createPDF.ts:54:    const executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'];
src/services/createPDF.ts:57:      ...(executablePath ? { executablePath } : {}),
src/services/createPDF.ts:100:  const executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'];
src/services/createPDF.ts:102:    ...(executablePath ? { executablePath } : {}),

$ grep -nE "origin|CORS_ORIGIN|\*" src/config/cors.config.ts
6:import { CORS_ORIGIN, NODE_ENV } from '@/config/process.config';
8:const allowedOrigins = (CORS_ORIGIN || '')
10:  .map((origin) => origin.trim())
14: * `origin: '*'` cannot be combined with `credentials: true` (browsers
17: * explicit allow-list instead. With no `CORS_ORIGIN`
18: * configured: reflect the caller's origin in development (so local
23:  origin: allowedOrigins.length > 0 ? allowedOrigins : NODE_ENV !== 'production',

$ grep -nE "bodyParser\.(json|urlencoded)" src/server.ts
46:  app.use(bodyParser.urlencoded({ extended: true }));
47:  app.use(bodyParser.json());
```

## Acceptance (round 2 additions)
| Criterion | Evidence |
|---|---|
| (1) | `node reach.js` → only `src/constant/constant.ts`; `res.render` grep exit 1; staging asset-name grep exit 1 |
| (2) lock from npm, deps gone | `npm install --package-lock-only` leaves `package-lock.json` sha1 `7f7cdde0…` unchanged (lock is npm-consistent with `package.json`); `npm ls …` → `└── (empty)`; import grep → `0` |
| (4) issues filed | `#290`–`#293` OPEN with URLs above |
| (7) Traps edits | Chrome path: both renderers read `PUPPETEER_EXECUTABLE_PATH` (`createPDF.ts:54,100`, `createPDF.ats.ts:408`), no hardcoded path → Resolved holds. CORS: `cors.config.ts:23` allow-list from `CORS_ORIGIN`, no `'*'` → Resolved holds. Body limit: `server.ts:46-47` still no `limit` → kept open, tracked in #291 |
| Comments per code-comments.md | No code comments added/changed |

## Noticed, not done
Same as round 1.

## Seal gate
none new in round 2 (read-only `gh issue view`, local `npm install --package-lock-only` that changed nothing).
