# 2026-09-06 — fix-hardcoded-src-public-write-paths — verifier verdict

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-hardcoded-src-public-write-paths` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED (was PENDING)

## Isolation proof
Dispatched as a fresh Agent-tool subagent with the identity/task string
"You are acting as the `verifier` worker for the agent-hub ... This is a
genuinely independent verification pass — you have NOT seen any prior
conversation about this task." No implementation history in this
session's context; the diff under review was written by a separate
implementer pass on 2026-09-06 whose note I read cold. Session was
interrupted once mid-pass (API session-limit) and resumed by the
orchestrator with a status update, not by the implementer — orchestrator
confirmed and I independently re-confirmed `docker ps -a` (only the
pre-existing unrelated `nifty_maxwell` container) before resuming, so the
resumed pass is still the same independent verifier context, not a
self-report.

## Re-run
`full` — re-ran `npx tsc --noEmit`, `npm run build`, `npm test` from
repo root myself and read the output back; independently rebuilt and ran
the production Docker target (`docker compose -f docker-compose.prod.yml
up -d --build`) from a clean `docker ps -a` state (twice — once before
the mid-task interruption, torn down by the orchestrator while I was
cut off, then rebuilt from scratch a second time after resuming) and
reproduced the full live round trip with my own throwaway account, my
own generated test image, and my own test PDF (not the implementer's
files). Reason: this is a real `src/` behavior change with zero Jest
coverage, and the note's load-bearing claim (byte-identical fetch of an
uploaded image from inside a minimal container with no `src/`) is
exactly the class of claim `doctrine/domains/PROJECT.md`'s trap history
for this node calls out as previously "worked by accident of deploy
shape" — matches the "class of change PROJECT.md names as needing
independent re-run" exception in `recipes/verify_seal.md`'s Re-run scope
section.

## Reasoning

**Code matches the note's description, read directly (all 3 files +
Dockerfile):**
- `src/services/createPDF.ts:19` — `PDF_OUTPUT_DIR = path.join(__dirname,
  '..', 'public', 'pdf')`, plus new `fs.existsSync`/`mkdirSync`
  self-heal at line 23 (Puppeteer doesn't auto-create directories).
- `src/middlewares/uploadCV.middleware.ts:25` — `CV_UPLOAD_DIR =
  path.join(__dirname, '..', 'public', 'uploads', 'cv')`.
- `src/middlewares/uploadImages.middleware.ts:28` — `IMAGE_UPLOAD_DIR =
  path.join(__dirname, '..', 'public', 'uploads', 'images')`.
- `Dockerfile` — the round-2 `RUN mkdir -p src/public/...` workaround is
  gone; replaced with a comment explaining the real fix (lines 51-59).
- `src/server.ts:105` — `express.static(path.join(__dirname, 'public'))`
  confirms the exact anchor these 3 constants now match.

**Downstream call sites verified directly, not just cited:**
`grep` for `CV_UPLOAD_DIR`/`IMAGE_UPLOAD_DIR` across `src/` shows both
constants imported and reused as-is (`path.join(CV_UPLOAD_DIR, ...)` /
`path.join(IMAGE_UPLOAD_DIR, ...)`) by
`src/candidate/candidate.controller.ts:103` (CV download) and
`src/candidate/candidate.service.ts:136,141` (CV + image cleanup on
account delete) — confirms the note's claim that fixing the constant's
definition in one place was sufficient, no other file needed editing.

**Command output, independently re-run and read back:**
```
npx tsc --noEmit    → exit 0, no output (clean)
npm run build       → tsc && npm run copy — clean
npm test             Test Suites: 13 passed, 13 total
                      Tests:       77 passed, 77 total
                      Snapshots:   0 total
                      Time:        4.251 s
```
Matches the note's cited numbers exactly (13/13 suites, 77/77 tests).
`find dist/public/pdf dist/public/uploads` (my own run, not the note's):
`dist/public/pdf/.gitkeep`, `dist/public/uploads/cv/.gitkeep`,
`dist/public/uploads/images/.gitkeep` all present.

**Live Docker reproduction (my own full round trip, own test files,
independent of the note's):**
- Clean baseline: `docker ps -a` showed only the pre-existing
  `nifty_maxwell` container before starting.
- `docker compose -f docker-compose.prod.yml up -d --build` → both
  `mongo` and `api` reached `healthy`; `api` bound `0.0.0.0:3001` (this
  branch also carries the already-SEALED `fix-prod-port-ignores-local-port`
  fix, consistent with the note).
- `POST /api/v1/auth/register` + `GET /api/v1/auth/login` → `200`, real
  JWT pair, own throwaway account.
- `GET /api/v1/download-pdf?token=...` → `200`; `file` confirmed `PDF
  document, version 1.4, 1 pages` — the ENOENT-crashing case, fixed.
- `POST /api/v1/project/create` → `200`, real project `_id`.
- `POST /api/v1/project/<id>/images` with my own generated 2×2 PNG
  (MD5 `7b8a70c6721ea1568c92b444599441ee`) → `200`, returned
  `/uploads/images/<filename>`.
- **Load-bearing check**: `GET http://localhost:3001/uploads/images/<filename>`
  → `200`, `Content-Type: image/png`, `Content-Length: 73`, `cmp`
  byte-identical against my own uploaded file, MD5 matches
  (`7b8a70c6721ea1568c92b444599441ee` both sides).
- `docker exec resume-nodejs-api-api-1 ls /app/src` → `No such file or
  directory` (exit 2) — `src/` genuinely absent from this image;
  `docker exec ... find /app/dist/public/uploads/images -type f` showed
  both uploaded files physically present at the `__dirname`-anchored
  path. Rules out "worked by accident via leftover `src/`".
- `DELETE /api/v1/candidate` (self) → `200`; re-checked with `find` that
  both the CV file and image files were actually removed from disk
  (only `.gitkeep` remained afterward), not just the DB record.

**CV upload/download — the note's explicitly-flagged gap, independently
tested here rather than accepted on the note's reasoning alone:** since
the running container and a throwaway account were already available,
I judged the extra check cheap enough to be worth doing rather than
trusting "same code pattern" by inference. `POST
/api/v1/candidate/upload-cv` (multipart, field `cv`, a real PDF) → `200`;
`GET /api/v1/candidate/cv-file` (authenticated) → `200`,
`Content-Type: application/pdf`, `cmp` byte-identical, MD5 match
(`9a0b32c5de286949adaf2d65694d9a24` both sides); `docker exec ... find
/app/dist/public/uploads/cv` confirmed the file physically at the
`__dirname`-anchored path. This closes the one gap the note itself
flagged under "Noticed, not done" — both upload classes (CV and images)
are now independently live-proven, not just the images path.

**Render production-bug claim, sanity-checked, not just accepted:**
`package.json`'s `start` script is `npm run build && NODE_ENV=production
node dist/server.js` — the same execution shape (compiled `dist/`, no
Docker) a bare-metal/Render deploy would use. `__dirname` in CommonJS is
resolved by the module loader from the executing file's own path, not
from the process CWD or the host environment — this is standard Node
semantics, true identically whether `node dist/server.js` runs inside a
container or directly on Render's host. The note's claim that this also
silently fixes a latent production bug on the real Render deploy (not
just Docker) holds up under this reasoning, independent of Docker
specifically.

**Acceptance criteria** (against the diagram node's description at
`dev-loop.prime-mermaid.md` line 83 and the trap's remediation in
`doctrine/domains/PROJECT.md`):

| Criterion | Evidence |
|---|---|
| PDF export no longer ENOENTs in a minimal (no `src/`) production image | My own live step — `200`, real PDF, `docker exec ls /app/src` confirms no `src/` |
| Uploaded images are actually fetchable via their own returned static URL | My own live steps — byte-identical fetch (MD5 match on both sides), confirmed served from `dist/public/...`, confirmed `src/` absent |
| CV upload/download round trip also fixed (not just "same pattern" by inference) | My own independent live test — byte-identical fetch, confirmed served from `dist/public/uploads/cv/` |
| No longer relies on the Docker-specific `mkdir -p` workaround | `Dockerfile` read directly — workaround removed, replaced with an explanatory comment |
| `npx tsc --noEmit` / `npm run build` / `npm test` clean | Re-run myself, output above, matches note's cited numbers |
| Fix also applies to the real Render deploy, not just Docker | `package.json`'s `start` script + CommonJS `__dirname` semantics checked directly, holds independent of Docker |
| No other file needed editing beyond the Diff table | `grep` for both exported constants across `src/` confirms both downstream read/cleanup call sites reuse the constant unchanged |

**Seal gate**: no outward-facing action in the note or in this
verification pass — no `commit`/`push`. All Docker/curl activity this
pass ran against local throwaway containers/data, torn down afterward.

**Proportion (`SmallestDiff`)**: diff is exactly the 3 `src/` write-path
fixes + the now-dead `Dockerfile` workaround removal — matches the
node's scope with no extra refactor.

## Cleanup performed this pass
- `DELETE /api/v1/candidate` (self) on the throwaway test account.
- `docker compose -f docker-compose.prod.yml down -v` — containers,
  network, and volume all removed.
- `docker ps -a` back to only the pre-existing unrelated `nifty_maxwell`
  container.
- Removed the throwaway `.env` at repo root and all scratch files
  (`verifier_test.pdf`, `verifier_test_image.png`,
  `verifier_test_cv.pdf`, JSON response captures) from the session
  scratchpad.
- Removed the stray `dist/public/pdf/<email>.pdf` generated by my own
  `npm run build`/live-test pass (`dist/` is gitignored and build
  output, but removed for cleanliness anyway).
- `git status --porcelain` re-checked after cleanup: exactly the files
  the note's Diff table lists (`Dockerfile`,
  `src/services/createPDF.ts`, `src/middlewares/uploadCV.middleware.ts`,
  `src/middlewares/uploadImages.middleware.ts`), plus
  `docker-compose.prod.yml`/`src/server.ts` (pre-existing, from the
  already-SEALED sibling node `fix-prod-port-ignores-local-port` on this
  same branch) and the diagram file — no stray files from this
  verification pass.
