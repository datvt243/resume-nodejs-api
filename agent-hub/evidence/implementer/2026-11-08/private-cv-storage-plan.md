# 2026-11-08 - private-cv-storage (plan)
- Worker: implementer · Version: 0.1.0
- Node: `private-cv-storage` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug grep active + archive: 0 hits; no prior active row for #383
- Task: `/todo #383` — "Generated PDFs and uploaded CVs are served from `public/` without auth"
- Branch: `383-generated-pdfs-uploaded` (off `staging` @ a965a05, via `gh issue develop`)

## Hub bytes before
96414

## Feature doc: `doctrine/features/cv-export.md`
Behavior #8 ("also written to `public/pdf/<email>.pdf`") contradicts the fix; open question answered 2026-11-07 "Bug — #383" → Behavior #8 + Changelog updated in this diff. The issue's second half (uploaded CVs out of `public/`) has a data question not covered by any doc → asked operator (AskUserQuestion 2026-11-08: "what should happen to CVs already uploaded to the old public folder?") → **"Move them at startup (Recommended)"**.

## Acceptance
1. `createCV` calls `page.pdf` without `path` and creates no `public/pdf` dir; response unchanged (buffer streamed).
2. `CV_UPLOAD_DIR` resolves outside `public/` (`<src|dist>/storage/cv`); its two readers (`candidate.controller.ts:106` `/cv-file`, `candidate.service.ts:157` account delete) follow the constant.
3. `moveLegacyCvUploads` moves `*-cv.pdf` from the old dir, deletes the legacy file if the new dir already has one, ignores other files, no-op when the old dir is missing; called once in `runServer` before `listen`, failure logged, never crashes boot.
4. Tests via `npx jest src/__tests__/services/createPDF.test.ts src/__tests__/middlewares/uploadCV.middleware.test.ts`.
5. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/services/createPDF.ts:40-49,73` (`PDF_OUTPUT_DIR`, `path:`)
- `src/middlewares/uploadCV.middleware.ts:27` (`CV_UPLOAD_DIR`)
- `src/server.ts:112` (boot, after `initRedis`)
- `.gitignore:48-49`, `.dockerignore:21-22` (new `src/storage/cv/`)
- `doctrine/domains/PROJECT.md:53` (trap: anything under `src/public/` is unauthenticated)
