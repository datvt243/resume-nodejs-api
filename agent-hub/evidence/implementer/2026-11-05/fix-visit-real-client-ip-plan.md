# 2026-11-05 - fix-visit-real-client-ip (plan)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-visit-real-client-ip` · Task: `/todo #371` — "Visit tracking stores the proxy's IP/location, not the visitor's (no trust proxy)"

## Hub bytes before: 84459

## Node
New PENDING node (no prior row for #371; slug not in archive). Branch `371-visit-tracking-stores` off `staging`.

## Operator decisions (AskUserQuestion, 2026-11-05)
- IP source: leftmost `X-Forwarded-For` entry, read in the visit handler only — no global `trust proxy`.
- Rate-limit key: unchanged (`req.ip`).
- Spoof risk: a direct caller can forge XFF; documented + accepted since the endpoint is public and unauthenticated (a whole visit is already forgeable).

## Acceptance
See node row (4 criteria, each mapped to a unit test / `npm test` / `npm run build` / `npm run lint`).

## Code anchors
- `src/candidate_me/index.ts` — `handlerRecordVisit` (`const ip = req.ip || ...`)
- `src/__tests__/candidate_me/index.test.ts` — `describe('handlerRecordVisit')`
- `src/middlewares/rateLimit.middleware.ts` — NOT touched (criterion 3)

## Lint baseline (staging, this session)
`✖ 274 problems (274 errors, 0 warnings)`
