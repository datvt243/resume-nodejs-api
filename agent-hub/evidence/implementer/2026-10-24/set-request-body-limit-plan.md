# 2026-10-24 - set-request-body-limit (plan)

- Worker: implementer · Version: 0.1.0
- Node: `set-request-body-limit` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #291): "fix(security): set an explicit request body size limit" — "Carried over from the retired `TODO.md` (item 5.8). `src/server.ts:46-47` calls `bodyParser.urlencoded()` / `bodyParser.json()` with no explicit `limit`, relying on the 100kb default implicitly. Make the limit explicit and deliberate (DoS surface)."
- Branch: `291-fix-security-set` (from freshly pulled `staging`, linked via `gh issue develop`)

## Hub bytes before: 81129

## Node
No prior node for #291 in active diagram or archive (slug `set-request-body-limit` free in both). New row appended at end of file (AppendOnly), state PENDING.

## Sizing decision
- Largest legit JSON body: `POST /{education,experience}/bulk` — `MAX_BULK_ITEMS = 100` (`src/candidate_profile/BaseController.ts:30`), each with `description` = localized `{vi,en}` object with no max length (`src/config/joi.config.ts:95`). 100 items x ~2 KB (vi+en paragraph, UTF-8) ≈ 200 KB > 100kb default → the implicit default can already reject a legit bulk import.
- File uploads (CV PDF, images, LinkedIn ZIP) go through multer with their own `limits`, not body-parser — unaffected.
- Pick `1mb`: ~5x headroom over the bulk worst case, still a hard bound (DoS surface stays small). Same value for urlencoded (no legit large form posts, but one constant keeps it deliberate and in one place).

## Acceptance criteria (on node)
1. Both parsers in `src/server.ts` pass `limit: REQUEST_BODY_LIMIT`.
2. Real-HTTP test with the same parser config: over-limit → 413 `PAYLOAD_TOO_LARGE`; between 100kb and limit → 200 (JSON + urlencoded).
3. `npm test` + `npm run build` green; `npm run lint` 0 new problems vs staging.
4. PROJECT.md trap row (#291) resolved; root `CLAUDE.md` middleware stack names the limit.
5. Comments per code-comments.md.

## Anchors
- `src/server.ts:47-48` — the two parser mounts.
- `src/config/index.ts` — config barrel to re-export from (pattern: `cors.config.ts`, `helmet.config.ts`).
- `src/__tests__/middlewares/errors.test.ts:28,70-74` — existing real-HTTP 413 test using its own `bodyParser.json()`, titled "100kb default" → switch to the shared constant.
- `src/utils/helper.ts:79-80` — `entity.too.large` → `PAYLOAD_TOO_LARGE` mapping already exists (no change).

## Blockers: none
