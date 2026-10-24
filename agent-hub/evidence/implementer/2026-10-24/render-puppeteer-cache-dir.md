# 2026-10-24 - fix-render-puppeteer-cache-dir

- Worker: implementer (run from the resume-vuejs-website `/todo` session for frontend issue datvt243/resume-vuejs-website#291; the operator chose "fix both frontend and backend")
- Node: `fix-render-puppeteer-cache-dir` in `haven/diagrams/dev-loop.prime-mermaid.md` (appended row)
- Task: Download CV fails (frontend #291). Find and fix the backend cause. Backend issue: #298.

## Branch
`298-download-pdf-chrome`, cut from `origin/staging` (91cfaf2, v2.0.2) in a separate worktree `/Users/_david/Workspace/Project/resume/resume-nodejs-api-298`. The main checkout `/Users/_david/Workspace/Project/resume/resume-nodejs-api` was left untouched: it was on `294-chore-remove-unused` with 48 uncommitted changes that weren't mine.

## Diagnosis (Render, read-only, operator-approved workspace "David's Workspace")
- Service `srv-cqp0podds78s73e275og` ("Resume API - Nodejs Express"): runtime `node` (not Docker), build `npm ci --include=dev && npm run build`, start `NODE_ENV=production node dist/server.js`, cache profile `no-cache`.
- App logs, every `download-pdf` request (owner classic/ATS, vi/en, public `api/me/:id/download-pdf?template=ats`), from 2026-10-20 19:18 through 2026-10-24 03:33 UTC:
  `Could not find Chrome (ver. 127.0.6533.88). … 2. your cache path is incorrectly configured (which is: /opt/render/.cache/puppeteer).` at `ChromeLauncher.resolveExecutablePath`, from `createCV` (`dist/services/createPDF.js:46`) and `renderAtsPdfBuffer` (`dist/services/createPDF.ats.js:336`).
- After the v2.0.2 deploy (live 03:42 UTC), `curl …/api/me/votan.it@gmail.com/download-pdf?template=ats` still returned `500 application/json 89B` `{"success":false,"error":{"code":"INTERNAL_SERVER_ERROR","message":"Lỗi hệ thống"}}`.
- Cause: puppeteer's postinstall downloads Chrome to the default `~/.cache/puppeteer` at build time. Render's native runtime only ships the project directory, so that cache is gone at runtime.

## Diff
| File | Why |
|---|---|
| `.puppeteerrc.cjs` (new) | `cacheDirectory: join(__dirname, '.cache', 'puppeteer')`, so the build-time Chrome download lives inside the shipped project dir. Puppeteer's documented configuration file, read by both the postinstall download and `launch()`. |
| `.gitignore` | Ignore `/.cache` (456 MB Chrome download). |
| `.dockerignore` | Ignore `.cache` so a local download never enters the Docker build context. Docker itself is unaffected: it installs system Chromium and sets `PUPPETEER_EXECUTABLE_PATH`. |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | Node row appended. |

## Command
From the worktree root (same checkout contents as the repo root in `doctrine/MEMORY.md`):
- `npm ci --include=dev` (same as the Render build command's install step)
- Reproduction: `/private/tmp/claude-501/-Users--david-Workspace-Project-resume-resume-vuejs-website/08fba796-0fda-47d1-815a-b43c7c140756/scratchpad/launch.cjs` runs `puppeteer.launch()` with no `executablePath` (same resolution path as `createCV`/`renderAtsPdfBuffer`, which only pass one when `PUPPETEER_EXECUTABLE_PATH` is set) and `page.pdf()`, with `HOME` pointed at an empty directory, which is what Render's runtime looks like.
- `npm test`, `npm run build`, `npm run lint`
- Typecheck: inside `npm run build` (`tsc`), per `doctrine/MEMORY.md`

## Output
- `npm ci`: Chrome downloaded to `.cache/puppeteer/chrome/mac_arm-127.0.6533.88` at 10:44:48 local, during this install (`du -sh .cache` → `456M`). The version matches the one the Render error asks for. Local npm 11.17.0 printed an `allow-scripts` warning for `puppeteer@22.15.0 (postinstall)`, but the download still ran (timestamp). Render uses its own npm.
- Reproduction, control (`.puppeteerrc.cjs` moved away, empty HOME): `FAIL Could not find Chrome (ver. 127.0.6533.88). This can occur if either`, the same error as Render.
- Reproduction, with `.puppeteerrc.cjs` (empty HOME): `OK pdf bytes 7775 header %PDF-`
- `npm test`: `Test Suites: 49 passed, 49 total` / `Tests: 454 passed, 454 total`
- `npm run build`: exit 0, ends with `cp -R ./src/public ./dist/`
- `npm run lint`: `✖ 275 problems (275 errors, 0 warnings)`. The same `✖ 275 problems` on bare `origin/staging` in this worktree (`git stash -u`). All in `src/**/*.ts` (`no-unsafe-assignment` 67, `no-unsafe-member-access` 61, …), none in files this diff touches (root config files aren't linted per `eslint.config.mjs`). Pre-existing, not fixed here.

## Acceptance
| Criterion | Evidence |
|---|---|
| Root cause identified from real logs | Render app log lines quoted above |
| Fix makes Chrome resolvable without the home-dir cache | Control FAIL vs fixed `%PDF-` 7775 bytes, same empty-HOME setup |
| No regressions | 454/454 tests, build exit 0, lint count equal to staging baseline |
| Comments per code-comments.md | One JSDoc on the config explaining why (Render ships only the project dir) |

**Not verified:** the Render deploy itself. It only happens after this branch is merged to `staging` and released to `main` (Render auto-deploys `main`). After the release: check the deploy's build log shows the Chrome download under `/opt/render/project/src/.cache/puppeteer`, then `curl` the public `download-pdf` for a 200 `application/pdf`. Also confirm Render's free-tier slug size limit isn't hit by the ~170 MB linux Chrome (Puppeteer downloads only the platform's own build).

## Noticed, not done
- 275 pre-existing lint errors on `staging` (see Output). `doctrine/MEMORY.md`'s Lint row may be stale.
- `Dockerfile` uses `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`, the pre-v22 name (v22 reads `PUPPETEER_SKIP_DOWNLOAD`), so Docker builds probably download Chrome needlessly. Harmless (it uses `PUPPETEER_EXECUTABLE_PATH`).
- `doctrine/domains/PROJECT.md` Traps row "Hardcoded Chrome executable path" says "Resolved … otherwise use Puppeteer's bundled Chrome". It was resolved in code, but the bundled Chrome was never reachable on Render's native runtime.

## Seal gate
None crossed here: no commit, push or Render change. Render was read-only (services, logs, deploys).
