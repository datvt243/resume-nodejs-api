# 2026-08-22 — fix-redis-init-blocks-dev-startup (re-verify after REOPEN)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-redis-init-blocks-dev-startup` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "fix redis init blocks dev startup — node fix-redis-init-blocks-dev-startup"

## Context: responding to verifier REOPEN

`evidence/verifier/2026-08-22/fix-redis-init-blocks-dev-startup-reopen.md`
REOPENED the prior note (`.../fix-redis-init-blocks-dev-startup-diff.md`)
for one reason: criterion 4 ("live-tested real failure condition") was not
cleanly evidenced — the pasted log had a literal `...` inside the two
load-bearing lines, and the "LISTENING after 6s" claim had no raw
timestamped citation (no curl/lsof).

Re-read `src/services/redis.ts` and `src/utils/timeout.ts` before touching
anything — **no code change**, same conclusion as before: the fix
(`reconnectStrategy: false` + `withRedisTimeout` wrapping `connect()`) is
already on `develop`/`main` since `f355e2f`. What was missing was clean
evidence, not a diff. Re-ran the manual verification from scratch, this
time capturing the raw log to a file instead of pasting from memory/prose.

## Command

```
npm test
```

## Output

```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        3.893 s, estimated 6 s
Ran all test suites.
```

## Manual verification (live, Redis genuinely unreachable)

Confirmed Redis down before starting anything:
```
$ redis-cli -h localhost -p 6379 ping
Could not connect to Redis at localhost:6379: Connection refused
```
`.env` `REDIS_URL=redis://localhost:6379` (unreachable — the exact
condition the node describes). Confirmed port 3001 free before start
(`lsof -i :3001` → no output).

Started server, redirected stdout+stderr straight to a file (no manual
retyping), polled the file every 1s for the listen line:
```
$ (NODE_ENV=development npx ts-node -r tsconfig-paths/register ./src/server.ts > /tmp/redis-verify-server.log 2>&1 &)
$ for i in $(seq 1 20); do grep -q "App listening" /tmp/redis-verify-server.log && echo "LISTENING detected after ${i}s" && break; sleep 1; done
LISTENING detected after 3s
```

Full, untruncated file contents (`cat /tmp/redis-verify-server.log`, no
edits, no `...` inserted by me anywhere):
```
info: [MongoDB] Connected! {"service":"resume-api-backend","timestamp":"2026-08-22 02:06:06"}
error: [Redis] Connection error {"err":"","service":"resume-api-backend","stack":"AggregateError\n    at internalConnectMultiple (node:net:1118:18)\n    at afterConnectMultiple (node:net:1685:7)","timestamp":"2026-08-22 02:06:06"}
error: [Redis] Failed to initialize {"err":"","service":"resume-api-backend","stack":"AggregateError\n    at internalConnectMultiple (node:net:1118:18)\n    at afterConnectMultiple (node:net:1685:7)","timestamp":"2026-08-22 02:06:06"}
info: App listening on port: 3001 - development {"service":"resume-api-backend","timestamp":"2026-08-22 02:06:06"}
```
Note: `"err":""` is genuinely empty in the real log — that's a Node.js
quirk (`AggregateError` from `internalConnectMultiple` has an empty
`.message`; the real detail is in `stack`, which IS captured above). The
prior note's `...` was an artifact of how that note was written, not
something actually present in the log — this run proves the log was never
truncated by the code, only by the previous note's prose.

Timestamped proof the server was actually up and responsive, not just that
a log line printed:
```
$ curl -sS -m 3 http://localhost:3001/health
{"status":"ok","timestamp":"2026-08-21T19:06:11.904Z","uptime":10.502010583}

$ lsof -i :3001 -sTCP:LISTEN
COMMAND   PID   USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    71687 _david   28u  IPv6 0x2f1bb36d2b7326cf      0t0  TCP *:redwood-broker (LISTEN)
```
(`redwood-broker` is just `/etc/services`'s name for port 3001 on this
machine — `lsof` prints the service name, not a different port.)

Server process killed manually after confirming (`pkill -f "ts-node -r
tsconfig-paths/register ./src/server.ts"`), not because it hung.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-redis-init-blocks-dev-startup` |
| Smallest diff | Zero — same conclusion as prior note, re-confirmed by reading `src/services/redis.ts` before writing anything |
| Exact test command run + output read back | `npm test` → `Tests: 45 passed, 45 total` (verbatim above) |
| Live-tested real failure condition (Redis unreachable), untruncated | Full log file pasted above, no `...` anywhere, real `stack` field present |
| Timestamped proof server reached listening state promptly | `curl /health` with real `timestamp`/`uptime` fields + `lsof -sTCP:LISTEN` confirmation, both above |
| Evidence note written | This file |

## Noticed, not done

- Same as prior note: `server.ts:130` still runs `await initRedis()`
  sequentially before `app.listen()` — bounded now (2s timeout), not
  parallelized. Out of scope for this node.

## Seal gate

No outward-facing action (no commit/push — nothing was changed). N/A.

## Status

`sealed_pending_verifier`
