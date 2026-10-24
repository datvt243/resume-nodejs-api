# 2026-10-24 - add-graceful-shutdown (plan)

- Worker: implementer · Version: 0.1.0
- Node: `add-graceful-shutdown` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #293): "feat(server): graceful shutdown — close MongoDB + Redis on SIGTERM" — "Carried over from the retired `TODO.md` (items 7.7 / 10.4). `src/server.ts` has no `SIGTERM`/`SIGINT` handler: on deploy/restart the HTTP server, Mongo connection and Redis client are killed mid-flight instead of draining."
- Branch: `293-feat-server-graceful` (from freshly pulled `staging`, linked via `gh issue develop`)

## Hub bytes before: 81444

## Node
No prior node for #293 / slug `add-graceful-shutdown` in active diagram or archive. New row appended at end (AppendOnly), PENDING.

## Design
- Reuse existing close primitives: `closeRedis()` (`src/services/redis.ts:64`, already no-op when not connected, logs its own errors) and `MongoDBConnection.getInstance().disconnect()` (`src/database/mongo.db.ts:62`, catches + logs). Nothing new needed there.
- New `src/utils/gracefulShutdown.ts`: one exported `createShutdown(server)` returning the signal handler — kept out of `server.ts` because `server.ts` boots on import and can't be unit-tested.
- Order: `server.close()` first (stop new requests, let in-flight finish — they may still use Mongo/Redis), then Redis, then Mongo, then `process.exit(0)`.
- Hard timeout 10s → `process.exit(1)`, `.unref()`. Render sends SIGKILL ~30s after SIGTERM; 10s keeps us well inside. Node >=20 `server.close()` already drops idle keep-alive sockets, so the timeout only covers genuinely hung requests.
- Idempotent via a closure flag (SIGINT + SIGTERM, or repeated Ctrl-C).
- Other module-level `setInterval`s (tokenBlacklist etc.) don't matter — we `process.exit` explicitly.

## Acceptance criteria
On node (1)-(6).

## Anchors
- `src/server.ts:118-122` — `app.listen` (return value discarded today) + stale TODO.
- `src/services/redis.ts:64` `closeRedis`; `src/database/mongo.db.ts:62` `disconnect`.

## Blockers: none
