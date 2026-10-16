# 2026-10-16 — add-application-profile-link (implementer plan)

Worker: implementer · Version 0.1.0
Node: `add-application-profile-link` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended row, PENDING)
Task (verbatim): `#256 Link each application to a CV profile (Application.profileId)` (via `/todo #256`; the operator first typed `/todo #165`, which was already SEALED + merged — confirmed via AskUserQuestion that #256 was meant)
Branch: `256-link-each-application` off `staging` @ `b13a314`

## Hub bytes before: 234872
(measured with `/hub-tokens` per-session formula BEFORE adding the diagram row and this note)

## Operator decisions (AskUserQuestion, 2026-10-16)
1. Not-owned/foreign/deleted/malformed `profileId` → **reject with 400**, save nothing (authenticated owner form, unlike #253's public visit).
2. Profile soft-deleted later → **keep the id** on the application (no cascade).
3. `GET /application` → **id only**, through the shared `baseGetAll`; no name join.

## Acceptance
1. `Application.profileId` optional ObjectId, default null, ref `profile`.
2. `schemaApplication` accepts `profileId` as 24-hex, `null`, or `''` (→ null); anything else → Joi 400.
3. Create/update with a well-formed id that is not a non-deleted Profile with `candidateId` = authenticated user → 400 (localized vi/en), nothing written, no DB write call.
4. Owned id → stored and returned; `null`/`''` on update → unlinks; omitted on update → unchanged.
5. Existing applications (no field) unaffected; GET returns it via existing path.
6. No regression to application CRUD/soft-delete/restore.
7. Tests; `npm test`, `npm run build`, lint delta 0; swagger `Application` schema + CLAUDE.md/README.
8. comments per code-comments.md.

## Code anchors
- `src/models/application.model.ts`
- `src/candidate_profile/application/application.validate.ts` (`schemaApplication`)
- `src/candidate_profile/application/application.service.ts` (wraps `createCrudService`); `createCrudController` (`BaseController.ts:196-233`) spreads the service result after `statusCode: CREATED`, so a returned `statusCode: 400` wins
- `src/services/index.ts:210-260` (`baseUpdateDocument` — `updateOne({_id}, fields)`: omitted field = unchanged)
- `src/locales/{vi,en}.ts`, `src/config/swagger.config.ts:251` (`Application` schema)
- no application bulk route exists (`application.route.ts`: get/create/update/delete/restore only)

## Blockers
none — commands in `doctrine/MEMORY.md` have no `<<FILL>>`.
