# 2026-11-08 - trust-proxy-hops (plan)
- Worker: implementer · Version: 0.1.0
- Node: `trust-proxy-hops` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug grep active + archive: 0 hits; no prior active row for #386
- Task: #386 — "Global rate limit is likely shared by every client behind Render's proxy" (operator chose "Fix #386 first, then #387" during `/todo … #387`, 2026-11-08)
- Branch: `386-global-rate-limit` (off `staging` @ bd993b3, via `gh issue develop`)

## Hub bytes before
96406

## Feature doc: `doctrine/features/public-profile.md`
Open question answered 2026-11-07 "Bug — #386" (set `trust proxy` with the right hop count). Behavior #1 ("the global rate limit applies") unchanged in wording — no contradiction. Hop count not in any doc → operator answer 2026-11-08: "browser gọi thẳng Render URL, không qua relay" (browser calls the Render URL directly, no relay) → 1 hop (Render's own proxy).

## Acceptance
1. `TRUST_PROXY_HOPS=1` → `req.ip` = rightmost `X-Forwarded-For` entry (client-supplied entries to its left ignored); unset / `0` / non-numeric → `trust proxy` not set, `req.ip` = socket address (current behavior).
2. Tests in `src/__tests__/config/proxy.config.test.ts` via `npx jest src/__tests__/config/proxy.config.test.ts`.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.
4. Live check (two clients → separate `x-ratelimit-remaining`) after deploy with `TRUST_PROXY_HOPS=1` set on Render — operator follow-up, reported, not claimed.

## Anchors
- `src/server.ts:35` (`const app = express()`)
- `src/middlewares/rateLimit.middleware.ts:65` (`req.ip` key)
- `src/middlewares/httpsRedirect.middleware.ts:1-5`, `src/candidate_me/index.ts:285-292` (comments that say `trust proxy` is never set → updated)
- `CLAUDE.md` env list (new optional var)
