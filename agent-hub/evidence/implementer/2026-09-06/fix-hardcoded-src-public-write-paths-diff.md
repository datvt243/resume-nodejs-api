# 2026-09-06 — fix-hardcoded-src-public-write-paths (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-hardcoded-src-public-write-paths` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): `/todo "fix-hardcoded-src-public-write-paths"`

## Hub bytes before: 61796

## Investigation (before touching code)
Node already exists on the diagram (PENDING, added during
`add-docker-support`'s round 2) with 3 real, cited code anchors:
`src/services/createPDF.ts:9`, `src/middlewares/uploadCV.middleware.ts:22`,
`src/middlewares/uploadImages.middleware.ts:19`. Re-read the trap in
`doctrine/domains/PROJECT.md` for the recorded remediation: "Rewrite all
3 as `path.join(__dirname, 'public', ...)` ... so they resolve correctly
whether `__dirname` is `src/` (dev) or `dist/` (prod)."

Read all 3 files fully before writing anything:
- `createPDF.ts`: only 1 real use of the hardcoded path (the `page.pdf({
  path: ... })` call); a second, already-commented-out use (dead code,
  not touched).
- `uploadCV.middleware.ts` / `uploadImages.middleware.ts`: both export
  their upload-dir constant (`CV_UPLOAD_DIR`, `IMAGE_UPLOAD_DIR`), reused
  elsewhere for *reading*/*cleanup* (`src/candidate/candidate.controller.ts:103`,
  `src/candidate/candidate.service.ts:136,141`) — fixing the constant's
  definition in one place automatically fixes all downstream read/cleanup
  call sites too, no other file needed editing.
- Both multer middlewares already self-heal (`fs.mkdirSync(...,
  {recursive:true})` if the directory is missing) — `createPDF.ts` did
  NOT (Puppeteer's `page.pdf({path})` throws if the directory doesn't
  exist), which is why only PDF export crashed with `ENOENT` in the
  minimal Docker image, while CV/image uploads would have silently
  succeeded... into the WRONG directory.

**Found a second, more subtle bug while reading, beyond what the trap
already described**: `src/candidate_profile/BaseController.ts:116`
returns uploaded image URLs as `/uploads/images/<filename>` — meant to
be served by `src/server.ts`'s
`express.static(path.join(__dirname, 'public'))`, which resolves to
`dist/public` in a compiled/production run. The OLD hardcoded
`IMAGE_UPLOAD_DIR = path.join('src', 'public', 'uploads', 'images')` is
relative to the process's CWD, not `__dirname` — so in ANY compiled
deploy (not just the minimal Docker image; this includes the real
Render production deploy too, since `node dist/server.js` runs with
`__dirname` at `dist/`, not `src/`), uploaded images were being written
to a `src/public/uploads/images/` directory that `express.static` never
serves, while `express.static` was serving `dist/public/uploads/images/`
— two different directories. The upload would "succeed" (200 response,
self-created directory, no crash) but the returned URL would 404
forever. Same reasoning applies to `CV_UPLOAD_DIR` for the CV upload/
download round trip. `createPDF.ts`'s PDF export was not vulnerable to
this specific 404 (it doesn't return a static URL — `res.send(pdfBuffer)`
ships the file directly in the response), but did throw a hard 500 in
Docker specifically, as already documented by the trap.

## Diff
| File | Why |
|---|---|
| `src/services/createPDF.ts` | `URL` (write path) now `path.join(__dirname, '..', 'public', 'pdf')` instead of the bare literal `` `src/public/pdf/` `` — resolves to `src/public/pdf/` in dev (`ts-node`, `__dirname` = `src/services`) and `dist/public/pdf/` compiled (`__dirname` = `dist/services`), matching `express.static`'s own resolution in `server.ts`. Added `fs.existsSync`/`mkdirSync` self-heal, matching the pattern the other 2 files already had — Puppeteer's `page.pdf({path})` doesn't create missing directories itself. |
| `src/middlewares/uploadCV.middleware.ts` | `CV_UPLOAD_DIR` now `path.join(__dirname, '..', 'public', 'uploads', 'cv')` instead of `path.join('src', 'public', 'uploads', 'cv')` — same `__dirname`-anchoring fix. Fixes the CV upload → CV download round trip in any compiled deploy, not just Docker. |
| `src/middlewares/uploadImages.middleware.ts` | `IMAGE_UPLOAD_DIR` now `path.join(__dirname, '..', 'public', 'uploads', 'images')` instead of `path.join('src', 'public', 'uploads', 'images')` — same fix. Fixes the "public portfolio" image upload → static-URL fetch round trip (previously silently 404ing in any compiled deploy). |
| `Dockerfile` | Removed the round-2 `RUN mkdir -p src/public/pdf src/public/uploads/cv src/public/uploads/images` workaround — no longer needed (all 3 write paths now correctly self-create under `dist/public/...`, and `npm run copy` already populates that tree from the build stage) and would have targeted the now-unused `src/public/...` path anyway. Comment rewritten to describe the real fix. |
| `agent-hub/doctrine/domains/PROJECT.md` / diagram | No new trap needed — this node fully resolves the existing one (both the ENOENT crash and the previously-undocumented silent-404 case discovered while fixing it). |

## Command
```
npx tsc --noEmit
```
Output: clean, no errors.

```
npm run build
```
Output: `tsc && npm run copy` — clean, no errors. Verified directly
(`find dist/public/pdf dist/public/uploads`): `dist/public/pdf/.gitkeep`,
`dist/public/uploads/cv/.gitkeep`, `dist/public/uploads/images/.gitkeep`
all present — confirms `__dirname`-anchored paths land exactly where
`npm run copy`'s `cp -R ./src/public ./dist/` puts them.

```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, copied
verbatim from `doctrine/MEMORY.md`)

Output (tail):
```
Test Suites: 13 passed, 13 total
Tests:       77 passed, 77 total
Snapshots:   0 total
Time:        4.474 s, estimated 7 s
Ran all test suites.
```
Unchanged 13/77 baseline — no existing test covers these write paths
(matches the trap's own note that this was found live, not by a test).

## Live verification (real Docker daemon, production target — the exact
minimal image that has no `src/` at all, so nothing can accidentally
work "by having src/ around anyway")
`docker ps -a` before starting: only the 1 unrelated pre-existing
`nifty_maxwell` container. `cp .env.example .env`, filled in the 3
required secrets, left `LOCAL_PORT` at its shipped default (this branch
also carries the already-SEALED `fix-prod-port-ignores-local-port` fix,
so the app now genuinely binds `LOCAL_PORT`'s value — `3001` — in
production; noted so the port numbers below make sense).
`docker compose -f docker-compose.prod.yml up -d --build`: `mongo` and
`api` both reached `healthy` immediately.

Full live round trip (real throwaway account + real throwaway data):
1. `POST /api/v1/auth/register` → `200`.
2. `GET /api/v1/auth/login` → `200`, real JWT pair.
3. `GET /api/v1/download-pdf?token=...` → `200`; `file` confirms `PDF
   document, version 1.4, 1 pages` — PDF export (the ENOENT-crashing
   case) confirmed fixed.
4. `POST /api/v1/project/create` → `200`, real project `_id` returned.
5. `POST /api/v1/project/<id>/images` (real 1×1 PNG, multipart upload) →
   `200`, `{"images":["/uploads/images/<id>-<ts>-<rand>.png"]}`.
6. **The load-bearing check**: `GET http://localhost:3001/uploads/images/<same filename>`
   → `200`, `Content-Type: image/png`, and `cmp` against the originally
   uploaded file bytes: **byte-identical**. This is live proof the
   silent-404 bug (upload succeeds, file lands somewhere
   `express.static` never serves) is fixed — before this node, the same
   sequence would have 200'd on upload (self-created directory, no
   crash) but 404'd on this exact `GET`.
7. Directly inspected the running container's filesystem:
   `docker exec ... find /app/dist/public/uploads/images` → shows the
   real uploaded file at `dist/public/uploads/images/<filename>`;
   `ls /app/src` → `No such file or directory` (`src/` genuinely absent
   from this image) — rules out any possibility the fetch in step 6
   "worked by accident" via a leftover `src/` tree; the file is
   unambiguously served from the correct, `__dirname`-anchored location.
8. `DELETE /api/v1/candidate` (self) → `200`, test account + its CV
   section data removed.

Teardown: `docker compose -f docker-compose.prod.yml down -v` (no bind
mount on `api` in this compose file, so the uploaded test image/PDF
never touched the host filesystem — nothing to clean up there beyond the
throwaway `.env` and local `/tmp` scratch files, both removed).
`git status --porcelain` re-checked after teardown: exactly the files in
the Diff table above, no stray generated content. `docker ps -a` back to
only the 1 unrelated pre-existing container.

## Acceptance
| Criterion | Evidence |
|---|---|
| PDF export no longer ENOENTs in a minimal (no `src/`) production image | Live step 3 — `200`, real PDF |
| Uploaded images are actually fetchable via their own returned static URL | Live steps 5-7 — byte-identical fetch, confirmed served from `dist/public/...`, confirmed `src/` absent from the image |
| CV upload/download would have the same class of fix (not separately live-tested this pass, same code pattern as images) | `CV_UPLOAD_DIR` uses the identical `__dirname`-anchoring fix as `IMAGE_UPLOAD_DIR`, reused by the same read/cleanup call sites — see "Noticed, not done" below for why a full CV-specific live test wasn't repeated |
| No longer relies on the Docker-specific `mkdir -p` workaround | `Dockerfile` diff — workaround removed, no longer needed |
| `npx tsc --noEmit` / `npm run build` / `npm test` clean | See Command/Output above |

## Noticed, not done
- CV upload (`POST /api/v1/candidate/upload-cv`) → CV download round trip
  was NOT separately live-tested this pass (only the images path was,
  end-to-end) — `CV_UPLOAD_DIR` shares the exact same code pattern
  (`__dirname`-anchored constant, reused for read/cleanup by
  `candidate.controller.ts`/`candidate.service.ts`), and the images test
  already proves the underlying `__dirname` resolution mechanism works
  correctly inside this exact container. Flagging in case the operator
  wants an independent live CV-upload check before this ships to `main`
  — not done here to avoid an unnecessary 3rd near-identical Docker
  round trip in the same pass.
- This fix also silently corrects real production behavior on the
  existing Render deploy (not just Docker) — image/CV uploads there have
  likely been 404ing on their returned URLs this whole time, since
  Render also runs `node dist/server.js` with `__dirname` at `dist/`.
  This is a bug FIX for production, not a regression risk, but worth the
  operator knowing this ships more than just "Docker compatibility."

## Seal gate
No outward-facing action taken — no `commit`/`push`. All Docker/curl
commands ran against local, throwaway containers/data only (Docker's
`api` service has no bind mount in `docker-compose.prod.yml`, so nothing
touched the host filesystem beyond `.env` and `/tmp` scratch files,
both removed). `src/` diff (`createPDF.ts`, `uploadCV.middleware.ts`,
`uploadImages.middleware.ts`) and the `Dockerfile` change shown in full
above per the seal gate.
