# 2026-10-16 — add-public-ats-pdf-download (verifier verdict)

Worker: verifier (independent subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-public-ats-pdf-download` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row)
New PM status: **SEALED**

## Isolation proof
This was a fresh Agent spawn, briefed as "Verify add-public-ats-pdf-download seal". It was dispatched via `/worker verifier` from the main session after `/boot`, and the implementer pass ran in an earlier session. It received the verbatim verifier bundle (manifest, SOUL, verify_seal recipe). I have no memory of the implementer pass and wrote nothing under `src/`. I created no probe files (`ls src | grep -ci probe` → 0). `git status --short` was byte-identical before my runs and after the lint `git stash push -u -- src` / `pop` (diffed: `STATUS IDENTICAL`).

## Reasoning
I read both implementer notes (`evidence/implementer/2026-10-10/add-public-ats-pdf-download-{plan,diff}.md`) and checked them against the working tree with `git diff` and the two new untracked files. The diff table matches disk. The 5 modified and 2 new files under `src/`, docs and diagram are exactly the ones listed, and `atsPdfFilename` is a pure extraction (`createCVAts` header value unchanged). The commands match `doctrine/MEMORY.md`: `npm test`, `npm run build` (Typecheck row), and eslint before/after. Output in the note is not truncated. The SIGSEGV run is recorded honestly with full output, and so are two clean re-runs.

| Criterion | Evidence |
|---|---|
| 1. Public slug/email → 200 `application/pdf`, attachment, no auth; text == authenticated ATS export | Code: `fnDownloadPublicPdf` → `handlerGetAboutMe({identifier, lang, profileId})` → `renderAtsPdfBuffer(data,{lang})`. That is the same call `createCVAts` makes from `fnExportPDF`'s `template=ats` branch (`candidate_me/index.ts:349`), with the same `Content-Disposition` via the shared `atsPdfFilename`. Route `router.get('/api/me/:identifier/download-pdf')` has no auth middleware. Implementer live probe (real mongod + server, no header/cookie): `pub1`/`pubmail` `status=200 type=application/pdf`, `TEXT auth == pub1 (identical extracted text)` (287 chars each), `Content-Disposition: attachment; filename=...`. Unit "sends the ATS PDF as an attachment…" PASS in my re-run. |
| 2. Private → same response as unknown identifier | Code: `!_me.success \|\| !data \|\| data.isPublic === false` → `formatReturn(res, formatReturnFailed('Email không tồn tại'))`. That is the same value `handlerGetAboutMe` returns for an unknown identifier (`index.ts:107`) and the same branch `fnGetAboutMe` uses (`index.ts:57-58`). The render is never reached. Live probe: both `HTTP/1.1 400`, `private body == unknown body`, same Content-Type. Unit "answers a private profile exactly like an unknown identifier, without rendering" PASS. |
| 3. Repeat within cache window doesn't relaunch Puppeteer | Code: module Map keyed by sha256(lang + JSON(data)), storing the render promise, TTL 1h, cap 50, rejected render evicted. Live: `pub2` 0.006s vs `pub1` 0.52s, and `pub1 == pub2 byte-identical`. A fresh render would carry new metadata dates. Unit: cache hit (render ×1), concurrent dedupe (×1), data/lang change re-renders, TTL expiry, failed render not cached, eviction at cap. All PASS in my re-run. |
| 4. Rate-limited like other public routes | `src/server.ts:83` `app.use(rateLimitMiddleware)` precedes `:85` `app.use(router)`, so it covers every `/api/me/*` route. Live: `X-RateLimit-Limit: 100`, `Remaining: 96 → 95` on the new route. |
| 5. Swagger updated | `@swagger /api/me/{identifier}/download-pdf` block in `src/routers/index.ts` (path + 3 query params, 200 binary, 400, 429), confirmed in `git diff`. It compiles under my `npm run build`. |
| No PII on disk (pdf-export rule 10, `PERSIST_EXPORTED_PDF` off) | The new module has no `fs` import and no write. `template` ≠ `ats` → 400 before lookup, so the classic `createCV` (which does `page.pdf({ path: \`${URL}${email}.pdf\` })`, `createPDF.ts:73-74`) is unreachable publicly. I confirmed this, and the code comment's claim about it is accurate. Live: `find src/public dist/public -name "*.pdf" -newer probe` was empty. My own `find … -newer` showed only `dist/public/pdf/votan.it@gmail.com.pdf`, which is a pre-existing tracked `src/public/pdf/` file (mtime Aug 31) copied by the build's `cp -R`, not produced by this route. |
| pdf-export-standard 10 invariants | Renderer/template untouched (`createPDF.ats.ts` diff = filename extraction only). Rules 1–5 read back from the implementer's real `pdf-parse` extraction: no spaced letters, en/vi headings, `09/2021`/`12/2016`, `Stack: Vue.js, Nuxt`. Rules 6–9 are inherited unchanged from `renderAtsPdfBuffer`. Rule 10 is covered in the row above. `atsPdfIntegration.test.ts` (real Puppeteer + pdf-parse) PASS in my re-run (`CI_NO_CHROME` unset, so not skipped). |
| `npm test` | Verifier re-run ×2 on the final tree: `Test Suites: 40 passed, 40 total`, `Tests: 336 passed, 336 total`, TEST_EXIT=0 both times. `public-pdf.test.ts` PASS. The pre-existing jest "worker failed to exit gracefully" warning appeared, and the SIGSEGV did not reproduce. |
| Typecheck (`npm run build`) | Verifier re-run: BUILD_EXIT=0, ending in `cp -R ./src/views ./src/public ./dist/`. `dist/candidate_me/public-pdf.js` emitted. |
| Lint delta 0 | Verifier re-run: `npx eslint . --format json` on the tree vs a `git stash push -u -- src` baseline, diffed per file+ruleId. Result: `lint before 276 after 276`, no DELTA lines. |
| Docs | Root `CLAUDE.md` (structure, API, test-table rows) and `README.md` API row updated, per `git diff`. |
| comments per code-comments.md | `public-pdf.ts`: the file-overview JSDoc + `@author`/`@see` mirror the siblings. `/** */` on `cache` gives the WHY (content-hash key, promise dedupe). Each `//` is a single WHY sentence: insertion-order eviction, failed render not cached, ATS-only because classic writes to disk (verified true), and private == unknown. `createPDF.ats.ts`: `/** */` on exported `atsPdfFilename` (never-email contract). The test file header explains what is mocked. Swagger is a functional doc. No `(#N)` refs, no stacked `//`. No violations. |

Forbidden states: none apply.
- ADHOC_WORK: the node row is on the diagram and the worker identity is recorded.
- NO_EVIDENCE: the plan and diff notes exist.
- EDIT_UNVERIFIED: test, build and lint were re-run, and the results match the note.
- CODE_IN_HAVEN: the only `haven/` change is the diagram row.
- DIAGRAM_DRIFT: the row is now SEALED.

Seal gate: nothing was committed or pushed. `HEAD` == `origin/staging` == `origin/217-public-unauthenticated-ats` == `95227aa`. The remote branch exists at the base commit because `gh issue develop` ran in `/todo` step 0, which is part of the operator-invoked contract. No external call was made in either pass.

Proportion: the diff is limited to the new handler + cache, the route + swagger, a one-line filename helper extraction (needed so both paths share the filename), tests, and doc rows. There is no new dependency.

Noted, out of scope (not blocking):
- Pre-existing: `slugifyFilename` drops `Đ`/`đ` (`Võ Đạt` → `Vo_at`). The implementer flagged it as its own node.
- The cache is per-process. With 50 entries × ~86KB it stays at about 4MB.
- `fnExportPDF`'s ATS branch ignores `?profile=` while the public route honors it. Equality was proven on the unfiltered data. Per the issue, `profile` matches `GET /api/me`, not the owner export.

## Re-run
partial. I re-ran `npm test` (×2, because of the implementer's transient SIGSEGV), `npm run build`, and the eslint before/after comparison via `git stash` (status identical). These were justified because the node adds a new unauthenticated, outward-facing endpoint. I did not repeat the live mongod + Puppeteer probe. Criteria 1/3/4 rest on the implementer's recorded probe output, which is complete (status lines, byte equality, text equality, headers) and consistent with the code paths I read.
