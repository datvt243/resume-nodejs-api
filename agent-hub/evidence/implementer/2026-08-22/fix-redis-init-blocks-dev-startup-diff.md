# 2026-08-22 — fix-redis-init-blocks-dev-startup

- Worker: implementer
- Version: 0.1.0
- Node: `fix-redis-init-blocks-dev-startup` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "fix redis init blocks dev startup — node fix-redis-init-blocks-dev-startup"

## Finding: no new diff needed — fix already in `main`

`pick_next` → `implement` steps: read node acceptance ("await
redisClient.connect() không timeout ... server treo vĩnh viễn"), located
code anchor `src/services/redis.ts`, read it before touching anything —
the fix described by the node is **already present**, committed in
`f355e2f` (2026-08-21, "fix: close broken access control, password leak,
and 3 other API bugs"), commit message explicitly says: "Also includes
the Redis startup fix from the prior session (bounded reconnectStrategy +
timeout so npm run dev no longer hangs forever when Redis is
unreachable)."

Current `src/services/redis.ts`:
```ts
redisClient = createClient({ url: REDIS_URL, socket: { reconnectStrategy: false } });
...
await withRedisTimeout(redisClient.connect());
```
`withRedisTimeout` = `withTimeout(promise, 2000)` (`src/utils/timeout.ts:6,30`).
`reconnectStrategy: false` stops the redis v4 default infinite retry
(`retries => Math.min(retries*50,500)`); `withRedisTimeout` bounds the
`connect()` call itself to 2s. Both pieces from the node description are
in place. `server.ts:130` still `await initRedis()` before `app.listen()`
(`server.ts:138`), but it's no longer unbounded.

**No code change made** — `SmallestDiff` means zero diff when the
acceptance criteria are already met. Writing a redundant "fix" here would
violate `NodeBeforeCode`/honesty, not honor it.

## Command

```
npm test
```

## Output

```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        5.448 s
Ran all test suites.
```

## Manual verification (live, `npm run dev` equivalent, Redis genuinely unreachable)

Confirmed local Redis is NOT running:
```
$ redis-cli -h localhost -p 6379 ping
Could not connect to Redis at localhost:6379: Connection refused
```
`.env` `REDIS_URL=redis://localhost:6379` (unreachable, real condition the
node describes). Started server directly (`NODE_ENV=development npx
ts-node -r tsconfig-paths/register ./src/server.ts`) against real MongoDB
Atlas + unreachable Redis, polled log every 1s:

```
info: [MongoDB] Connected!
error: [Redis] Connection error {"err":""...}
error: [Redis] Failed to initialize {"err":""...}
info: App listening on port: 3001 - development
```
`LISTENING after 6s` (dominated by ts-node/Mongo Atlas round-trip, not by
Redis — well under the old "hangs forever" behavior; `REDIS_TIMEOUT` caps
the connect attempt itself at 2s). Server reached `app.listen()` and
stayed responsive; process was killed manually after confirming the log
line, not because it hung.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-redis-init-blocks-dev-startup` |
| Smallest diff | Zero — fix already shipped in `f355e2f`, confirmed by reading `src/services/redis.ts` + `git log` before writing anything |
| Exact test command run + output read back | `npm test` → `Tests: 45 passed, 45 total` (verbatim above) |
| Live-tested real failure condition (Redis unreachable) | `redis-cli ping` refused; server still reached `app.listen()` in 6s, log excerpt above |
| Evidence note written | This file |

## Noticed, not done

- **PM status on this node is stale (DIAGRAM_DRIFT risk)**: diagram still
  lists `fix-redis-init-blocks-dev-startup` as `PENDING`, but the fix has
  been on `main`/`develop` since `f355e2f` (2026-08-21). Per `SOUL.md`
  invariant #5, implementer does not touch PM status — flagging for
  verifier to confirm and ratchet to `SEALED` (or explain why not, if some
  acceptance criterion still fails that this note missed).
- `server.ts:130` still calls `await initRedis()` before `app.listen()` —
  sequential, not parallel. Out of scope for this node (node only asks for
  *bounded* wait, not for removing the await entirely); noting in case a
  future node wants `initRedis()` to run concurrently with Mongo connect.

## Seal gate

No outward-facing action (no commit/push — nothing was changed). N/A.

## Status

`sealed_pending_verifier`
