# 2026-09-01 — add-visit-tracking (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-visit-tracking` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim, paraphrased operator intent across 2 messages): "source
  này có dùng API cho /Users/_david/Workspace/Project/resume/datvt243.github.io
  tôi muốn bổ sung API đếm số lần 'ghé thăm' của user, ghi nhận thời gian,
  địa điểm và IP máy" + follow-up "bổ sung thêm, ghi nhận theo email, phân
  biệt được các candidate".

## Investigation (before touching code)

1. Confirmed the actual coupling to `datvt243.github.io` (separate repo,
   read-only for this session): its `.env` sets `NODE_API=https://nodejs-resume-api-ts.onrender.com`,
   and `server/api/resume.ts` / `server/api/generate-pdf.ts` both call
   `${NODE_API}/api/me/${MY_EMAIL}` — i.e. this backend's existing public
   `GET /api/me/:email` (`candidate_me/index.ts`). Each candidate is keyed
   by their own email (`MY_EMAIL` per deployment).
2. Critical finding: `server/api/resume.ts` wraps that call in Nuxt's
   `defineCachedEventHandler` with `maxAge: 60 * 60 * 24 * 12` (12 days).
   Hooking visit-recording onto the existing `GET /api/me/:email` would
   silently undercount by orders of magnitude — most real visits never
   reach this backend at all. Surfaced to operator via `AskUserQuestion`;
   operator picked a **dedicated, uncached** endpoint instead.
3. Second `AskUserQuestion`: location-from-IP method — offline `geoip-lite`
   (no external call/key) vs an external geo API. Operator picked
   `geoip-lite`.
4. Read `src/candidate_me/index.ts`, `src/routers/index.ts`,
   `src/routers/api/v1/{index,candidate}.route.ts`,
   `src/candidate/{candidate.controller,candidate.service}.ts`,
   `src/models/{award.model,index}.ts`, `src/services/index.ts`,
   `src/utils/{helper,querySafe,i18n}.ts`, `src/locales/{vi,en}.ts`,
   `src/config/swagger.config.ts`, `src/middlewares/rateLimit.middleware.ts`
   (for the existing `req.ip || req.socket.remoteAddress || 'unknown'` IP
   pattern, reused verbatim), `src/server.ts` (confirmed no `trust proxy`
   is set — noted as a pre-existing, out-of-scope limitation, not
   introduced by this change).
5. `npm view geoip-lite@2.0.3 engines` → requires Node `>=24`, but this
   project's `package.json.engines` pins `>=20.19.0 <23.0.0` (current
   `node -v` = 20.19.0) — installing 2.0.3 printed an `EBADENGINE`
   warning. Checked older majors: `geoip-lite@1.4.10` engines `>=10.3.0`,
   installs clean, no warning. Used `1.4.10`, not latest.

## Scope resolved (operator, via `AskUserQuestion`)
1. **Trigger**: new `POST /api/me/:email/visit`, public, not the existing
   cached `GET /api/me/:email`.
2. **Geo lookup**: offline `geoip-lite`, no external API/key.

## Diff
| File | Why |
|---|---|
| `package.json` / `package-lock.json` | Added `geoip-lite@^1.4.10` (real `npm install`, pinned to the 1.x line for Node <23 compat — see Investigation #5) + `@types/geoip-lite@^1.4.4` (devDependency). |
| `src/models/visit.model.ts` (new) | `Visit` model: `candidateId` (ObjectId, ref `candidate`, required, indexed), `ip` (String), `location` (String), `timestamps: true` — one document per visit, `createdAt` is the visit timestamp. Same shape/style as `src/models/award.model.ts`. |
| `src/models/index.ts` | Export `Visit` alongside the other models. |
| `src/candidate_me/index.ts` | `fnRecordVisit` + `handlerRecordVisit(email, req)`: resolves the candidate by email via `candidateQuerySafe.safeQuery` (same pattern as `handlerGetAboutMe`), extracts IP via the same `req.ip \|\| req.socket.remoteAddress \|\| 'unknown'` pattern already used by `rateLimit.middleware.ts`, does an offline `geoip.lookup(ip)` and joins `city, region, country` into `location` (empty string if no match, e.g. localhost/private IP), then `MODEL.Visit.create(...)`. "Email not found" returns `formatReturnFailed(...)` — same response shape (success:false, no throw, no 404) as the sibling `handlerGetAboutMe`'s own "Email không tồn tại" branch, kept consistent rather than introducing a different error convention for one route. |
| `src/routers/index.ts` | Added `POST /api/me/:email/visit` (public, no auth — same middleware chain as the existing `GET /api/me/:email`) + Swagger doc. |
| `src/candidate/candidate.service.ts` | `handlerGetVisits(candidateId, lang)` — `MODEL.Visit.find({ candidateId }).sort({ createdAt: -1 })`, returns `{ count, visits }`. `candidateId` is always `req.user._id` from the verified JWT (never client input), so no `QuerySafe` wrapping — same trusted-id pattern `handlerDelete` already uses for its `CV_SECTION_MODELS.deleteMany` calls. |
| `src/candidate/candidate.controller.ts` | `fnGetVisits` — calls `handlerGetVisits((req as any).user?._id, ...)`, never a client-supplied id (same IDOR-safe pattern as `fnUpdate`/`fnDelete`/`fnDownloadCV`). |
| `src/routers/api/v1/candidate.route.ts` | Added `GET /visits` + Swagger doc. **Placement matters**: registered before `GET /:email`, same wildcard-swallow reasoning already documented in this file for `/upload-cv` and `/cv-file` (Express matches same-method routes in registration order). |
| `src/config/swagger.config.ts` | Added a `Visit` schema (`_id`, `candidateId`, `ip`, `location`, `createdAt`), referenced by the new `GET /visits` doc block. |
| `src/locales/{vi,en}.ts` | Added `candidate.getVisitsSuccess` (both languages) — used by `handlerGetVisits`. `handlerRecordVisit`'s own messages stay as raw Vietnamese strings, matching `candidate_me/index.ts`'s own pre-existing convention (that file does not use `t()` anywhere, unlike `candidate.service.ts`). |

## Command
```
npm run build
```
Output: `tsc && npm run copy` — clean, no errors, `cp -R ./src/views ./src/public ./dist/` completed.

```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, copied verbatim from `doctrine/MEMORY.md`)

Output (tail):
```
Test Suites: 10 passed, 10 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        5.938 s
Ran all test suites.
```
Same 10 suites / 54 tests as the last recorded baseline (`agent-hub-token-cleanup-20260830` row) — unchanged, no new test file added for this feature (matches precedent: `add-candidate-cv-upload` and `add-project-cert-award-image-upload` also shipped without new test files).

## Acceptance
| Criterion | Evidence |
|---|---|
| New `Visit` model records candidateId + ip + location + timestamp, one doc per visit | `src/models/visit.model.ts`, wired into `handlerRecordVisit`'s `MODEL.Visit.create(...)` call |
| Dedicated public endpoint, not the cached `GET /api/me/:email` | `router.post('/api/me/:email/visit', fnRecordVisit)` in `src/routers/index.ts` |
| Geo-location via offline geoip-lite, no external call | `geoip.lookup(ip)` in `src/candidate_me/index.ts`, `geoip-lite@1.4.10` added as a real dependency |
| Visits distinguishable per candidate/email | `Visit.candidateId` resolved from the `:email` param via `Candidate.findOne` before create |
| Authenticated, IDOR-safe read endpoint | `GET /api/v1/candidate/visits` → `fnGetVisits` → `handlerGetVisits((req as any).user?._id, ...)`, registered before the `/:email` wildcard route |
| Swagger updated | `Visit` schema + both new route doc blocks in `src/config/swagger.config.ts` / `routers/index.ts` / `candidate.route.ts` |
| `npm run build` clean | See Command/Output above |
| `npm test` — 54/54, unchanged | See Command/Output above |

## Noticed, not done
- No `trust proxy` configured on the Express app (`src/server.ts`) — behind
  a reverse proxy (e.g. Render, where this backend is actually deployed
  per `datvt243.github.io`'s `.env`), `req.ip` may resolve to the proxy's
  address rather than the real client IP. Pre-existing (same gap already
  present in `rateLimit.middleware.ts`'s IP handling, not introduced
  here) — out of this task's scope, flagging for a future node.
- Frontend call site (`datvt243.github.io` calling the new
  `POST /api/me/:email/visit` client-side on page load) is a separate
  repo/session with its own `agent-hub` — not touched here.
- `geoip-lite`'s bundled IP database is a point-in-time snapshot bundled
  at install time, not live-updated — city/region accuracy will drift
  over time unless the dependency is bumped periodically. Accepted
  tradeoff per the operator's own choice of the offline option.

## Seal gate
No outward-facing action taken — no `commit`/`push`. Diff shown to
operator in-session for review; deferred to `/ship` or a manual commit.
