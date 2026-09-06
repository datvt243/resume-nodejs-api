# doctrine/domains/PROJECT.md — ground truth of Resume API Backend

## What is it
REST API backend (Node.js + TypeScript) for managing candidate CVs/resumes:
JWT auth, CRUD for 7 CV sections (education/experience/award/certificate/
project/reference/generalInformation), PDF export, Redis-backed rate
limiting + token blacklist (in-memory fallback), Winston logging.
Repo: `github.com/datvt243/resume-nodejs-api`. Author: DatVT.

## Stack + shape
| Thing | Value |
|---|---|
| Language/runtime | Node.js (`>=20.19.0 <23.0.0`) + TypeScript 5.5 (strict, CommonJS), Express 4.19 |
| Entry point | `src/server.ts` (Express setup, MongoDB connect, Redis init, dev port 3001 / prod port 3008) |
| Data store | MongoDB + Mongoose 8.4 (primary); Redis 4.6 for rate-limit + token blacklist (optional, in-memory fallback) |

## Invariants (things that never happen here)
- Every Mongo query goes through `QuerySafe` (`src/utils/querySafe.ts`) —
  blocks `$` operators and `javascript:` patterns before touching the DB.
  Never build a Mongo filter directly from user input without `QuerySafe`.
- Password is never stored or compared as plaintext — always bcrypt (12
  rounds) via `src/utils/bcrypt.ts`.
- A JWT is never trusted outright — `verifyToken.middleware.ts` always
  checks the blacklist (Redis/mem) before attaching `req.user._id`.
- Every CV section document (education/experience/award/certificate/
  project/reference/generalInformation) always carries `candidateId`;
  update/delete always check ownership via base ops in
  `src/services/index.ts`.
- `dist/` is always gitignored, never hand-edited — always rebuild with
  `npm run build`.

## Diagram-first
The diagram (`haven/diagrams/`) is the source of truth for progress — code
must match it.

## Forbidden states
See `CLAUDE.md` — `ADHOC_WORK`, `NO_EVIDENCE`, `EDIT_UNVERIFIED`,
`CODE_IN_HAVEN`, `DIAGRAM_DRIFT`.

## Traps (append when a new one is found)
> Source: `TODO.md` (repo root), last updated 2026-07-05.

| Trap | Why | What to do instead |
|---|---|---|
| Hardcoded Chrome executable path (`src/services/createPDF.ts:14-25`) | Breaks PDF export if Chrome isn't at the expected path (CI/Docker) | Use `puppeteer.executablePath()` or an env var |
| CORS `origin: '*'` (`src/config/cors.config.ts:8`) | Open to every origin in every environment, including prod | Restrict to a known origin list before calling it prod-ready |
| No `limit` on `bodyParser.json()` (`src/server.ts`) | Unbounded request body size — DoS risk | Add an explicit size limit before shipping |
| `auth.service.ts:40` skips Mongoose model-level validation before save (TODO comment in code) | Write path not fully validated | Call `validateModel()` (`src/utils/valid.ts`) before persisting |
| No `lint` script in `package.json` despite `.eslintrc.cjs` existing | `npm run lint` does NOT work — don't assume it does | Confirm the real command before filling it into `doctrine/MEMORY.md` (currently `<<FILL>>`) |
| Anything saved under `src/public/` is served unauthenticated via `express.static` (`server.ts` middleware step 7) — confirmed live for both `src/public/pdf/<email>.pdf` (PDF export) and `src/public/uploads/cv/<candidateId>-cv.pdf` (CV upload, `add-candidate-cv-upload` node) | Any personal document saved under `public/` is fetchable by anyone who can guess/obtain the filename — no auth check at the static-file layer, only at the API routes that happen to also serve the same data | Serve uploaded/generated personal files only through an authenticated route (already done for `GET /candidate/cv-file`), and consider moving the storage directory outside `public/` entirely so `express.static` can never reach it — bigger change, own node if picked up |
| `src/server.ts:127` — `const _portNumber = _env !== 'production' ? portNumber : 3008;` always hardcodes port 3008 in production, ignoring `LOCAL_PORT` entirely. Found live (2026-09-06) while building `docker-compose.prod.yml` for `add-docker-support` (#24): following the app's own `.env.example` (`LOCAL_PORT=3001`) and mapping the host port off that value produced an unreachable container, because the app inside actually bound 3008 regardless | A production deploy that sets `LOCAL_PORT` to anything other than 3008 silently has no effect — the operator's chosen port is ignored, only `3008` ever works | Either respect `LOCAL_PORT` in production too (drop the `_env !== 'production'` branch), or document that production always means 3008 and stop reading `LOCAL_PORT` for it at all — pick one, right now it's neither (env var exists, is documented in README/`.env.example`, and is silently ignored). Own node if picked up, e.g. `fix-prod-port-ignores-local-port`; the Docker compose files work around it today by hardcoding `3008` on both sides instead of depending on `LOCAL_PORT` |
| Three write paths are hardcoded as RELATIVE `src/public/...` strings regardless of `NODE_ENV`, not `dist/public/...` (what `express.static(path.join(__dirname, 'public'))` actually serves in production): `src/services/createPDF.ts:9` (`src/public/pdf/`), `src/middlewares/uploadCV.middleware.ts:22` (`src/public/uploads/cv/`), `src/middlewares/uploadImages.middleware.ts:19` (`src/public/uploads/images/`). Found live (2026-09-06) while live-testing `docker-compose.prod.yml` for `add-docker-support` (#24): PDF export 500'd with `ENOENT: src/public/pdf/<email>.pdf` — the minimal production image only ships `dist/`, no `src/` at all, so the literal relative path doesn't exist. Works today on the real Render deploy purely because that host's working directory happens to contain both `src/` and `dist/` side by side (full checkout, not a minimal image) — each of the 3 target directories only exists there because `.gitkeep` keeps it checked into git, not because the app creates it | Any deploy topology that doesn't keep a full `src/` tree alongside `dist/` (a proper minimal container image, a serverless bundle, anything that only ships build output) will 500 on PDF export / CV upload / image upload with `ENOENT` — this is incidental-works-by-accident-of-deploy-shape, not a real path resolution | Rewrite all 3 as `path.join(__dirname, 'public', ...)` (or an equivalent env-agnostic constant) so they resolve correctly whether `__dirname` is `src/` (dev, `ts-node`) or `dist/` (prod, compiled) — matches how `src/server.ts`'s own `express.static` already resolves `public` relative to `__dirname`, just not mirrored in these 3 write paths. Own node if picked up, e.g. `fix-hardcoded-src-public-write-paths`; the production Docker image works around it today by `mkdir -p`-ing the 3 literal `src/public/...` paths instead of fixing the app code |

## Decisions, with reasoning
> A decision recorded without its reason gets "cleaned up" by a future
> agent — the what is already in the code, only the why is load-bearing.

| Date | Decision | Why | Alternative rejected |
|---|---|---|---|
| `<<FILL>>` | `MONGO_URI` (full connection string) takes priority, but `MONGOBD_USER`/`MONGOBD_PASSWORD` remain as fallback | `.env.example` explicitly marks this "fallback - for backward compatibility" | Drop separate credentials entirely, accept only `MONGO_URI` |
| `<<FILL>>` | Alias `@/*` resolves via `tsconfig-paths` in dev, via `module-alias` in prod (`dist/`) | `tsc` doesn't rewrite path aliases on build, so dev and compiled output need two different resolution strategies | Rewrite every import as a relative path |
| 2026-08-30 | 2-tier release workflow: `staging` (integration) → `main` (production), both GitHub branch-protected (no direct push, `enforce_admins: true`), `required_approving_review_count: 0`. Default branch changed `develop` → `main`. `develop` retired (local refs deleted; `origin/develop` left as-is, not deleted). See `CONTRIBUTING.md` for the full workflow + rationale. | Operator-requested (solo maintainer using both a human account and Claude Code to merge PRs) — GitHub blocks self-approval, so `required_approving_review_count >= 1` would lock out the only maintainer; `0` still forces every change through a reviewable PR (no direct push/force-push/delete) without that lockout. Default branch must be `main` for `Closes #N` to auto-fire on release PRs (GitHub only auto-closes on merge into the default branch). | Keep `develop` as the integration branch (rejected: already the pre-existing pattern that produced today's ungated direct-push history — protection was the actual goal); require ≥1 review (rejected: self-locking for a solo maintainer) |
