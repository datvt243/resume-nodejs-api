# 2026-10-20 — docs-wiki-api-response-standard (implementer)

Worker: implementer · Version 0.1.0
Node: `docs-wiki-api-response-standard` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING, appended at table end on this branch)
Task: GitHub issue #272 (body verbatim in the issue) — original CLI text: "tạo 1 page gitwiki cho các quy tắc / quy định này, sau đó ở 2 project kia tạo issue yêu cẩu cập nhật và điều chỉnh theo cho đồng bộ". Mid-task operator addition: "tạo 1 file md cho cả 3 project , làm quy chuẩn chung" → acceptance (4) added to the node row.
Branch: `272-docs-wiki-trang` (from fresh `staging`). Prior node's uncommitted work isolated first: `git stash push -u -m "audit-response-error-handling-sealed-pending-ship"` (stash@{0}, made on `271-audit-ton-bo`), per doctrine/MEMORY.md branch-isolation rule.

## Hub bytes before: 240173
Honest caveat: measured AFTER the node row was appended on this branch (the 239528 in the #271 note was that branch's pre-diff value); difference is the single new row.

## Diff
| Where | What | Why |
|---|---|---|
| `resume-nodejs-api.wiki.git` master | commit `5df6bee` new `API-Response-and-Error-Standard.md` + links in `_Sidebar.md`, `Home.md`; commit `9d2ba90` replaced page body with the shared file | criterion (1), (4) |
| `datvt243/resume-vuejs-website#252` | new issue (label enhancement) + comment asking to commit the shared file | criterion (2), (4) |
| `datvt243/datvt243.github.io#244` | new issue + same comment | criterion (2), (4) |
| this repo `API-STANDARD.md` (root, untracked → for /ship) | shared standard | criterion (4) |
| `resume-vuejs-website/API-STANDARD.md`, `datvt243.github.io/API-STANDARD.md` | untracked working-tree file only, no git op in those repos | criterion (4) |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | +1 PENDING row (later acceptance (4) appended to same row) | NodeBeforeCode |
| `src/**` | none | criterion (3) |

## Command
```
git -C <scratchpad>/wiki push origin master          # x2
curl -s -o /dev/null -w "%{http_code}" https://github.com/datvt243/resume-nodejs-api/wiki/API-Response-and-Error-Standard
gh issue create -R datvt243/resume-vuejs-website ... ; gh issue create -R datvt243/datvt243.github.io ...
git show origin/main:<file> (vue) / git diff --stat origin/staging -- <files> (portfolio)   # line-number check
shasum */API-STANDARD.md <scratchpad>/wiki/API-Response-and-Error-Standard.md
npm test ; npm run build ; git status --short
```

## Output
- wiki: `5df6bee docs: add API Response & Error Standard page (#272)`; `git ls-remote origin master` → `5df6bee4915c...`; then `9d2ba90 docs: sync API standard page with shared API-STANDARD.md (#272)`
- page HTTP: `200`
- issues: `https://github.com/datvt243/resume-vuejs-website/issues/252`, `https://github.com/datvt243/datvt243.github.io/issues/244`; comments `#issuecomment-6290130045`, `#issuecomment-6290130415`
- vue touch points: `git diff --stat origin/main -- src/services/axios.ts src/services/base.ts src/types/api.type.ts` → empty (working tree == main for those files); `origin/main` axios.ts:46 `if (err.response?.status === 401 && !originalRequest?._retry) {`, :95 `reject(err.response?.data ?? { message: 'Lỗi kết nối, vui lòng thử lại', errors: {}, invalidToken: false })`; base.ts:31-34 `.then(res => { callback?.(res) __helper.success(res) })`, :74 `const { message = '', errors = {}, invalidToken = false } = err`, :107 `if (invalidToken) {` (issue body first said 74,104 → corrected to 74,107 via `gh issue edit 252`)
- portfolio touch points: `git diff --stat origin/staging -- server/api/resume.ts server/api/generate-pdf.ts types/resume-api.ts plugins/VisitTracker.client.ts` → empty; resume.ts:12 `const { success = false, data } = await $fetch<ResumeAPIResponse>(`${NODE_API}/api/me/${MY_EMAIL}`)` (no try/catch); generate-pdf.ts:66 same call, :68-69 `if (!success || !data) { throw createError({ statusCode: 502 ...`; types/resume-api.ts:8-11 `success: boolean / message: string / errors: string[]`; VisitTracker.client.ts:21 `$fetch(...visit, { method: 'POST' }).catch(`
- `shasum` of the 4 copies → 1 unique hash (`5494136c3f8a2530c0c2a71a8d1e09714d93bf5e`)
- `git status --short API-STANDARD.md` in vue / portfolio → `?? API-STANDARD.md` each
- `npm test`:
```
Test Suites: 44 passed, 44 total
Tests:       398 passed, 398 total
Snapshots:   0 total
Time:        11.48 s, estimated 12 s
Ran all test suites.
```
- `npm run build`: exit=0, tail `> cp -R ./src/views ./src/public ./dist/`, `grep -c "error TS"` → 0
- `git status --short` (this repo, before API-STANDARD.md was added): ` M agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` only

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) wiki page with envelope, status map, code catalog, handler rules, rollout, client impact; traces to #271 | page sections §1 Envelope, §2 Status codes, §3 Error codes, §4 Backend rules, §5 Client rules, §6 Nitro, Rollout table has an "Audit #271 findings" column, Current deviations; HTTP 200 |
| (2) one issue per client repo with verified touch points | #252, #244 URLs above; line numbers checked against origin/main / origin/staging above |
| (3) no `src/` change | git status above; tests 398/398, build exit 0 |
| (4) shared md in all 3 repos, identical to wiki | shasum → 1 unique hash; untracked in both client repos; comments on #252/#244 |
| comments per code-comments.md | n/a — no code comments added (no code diff) |

## Noticed, not done
- Wiki Home still says Version 1.7.0 (repo is 1.14.0) — pre-existing drift, not touched.
- `datvt243.github.io` VisitTracker doesn't send `referrer`/`profile` to `/visit` (noted inside #244 as FYI, not part of the standard).

## Seal gate
Outward-facing actions taken: wiki push x2, 2 issues created, 1 issue body edit, 2 comments — all explicitly requested by the operator in this task ("tạo 1 page gitwiki…", "tạo issue…"). No commit/push to this repo or to the 2 client repos' git.
