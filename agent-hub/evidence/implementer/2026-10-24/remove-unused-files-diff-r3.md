# 2026-10-24 - remove-unused-files (diff, round 3)

- Worker: implementer · Version: 0.1.0
- Node: `remove-unused-files` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: GitHub issue #294 — answering verifier REOPEN `evidence/verifier/2026-10-24/remove-unused-files-reopen-r2.md`
- Rounds 1–2 notes stay as-is. No `src/` change in round 3.

## Hub bytes before: 249128

## Diff (round 3)
| File | Why |
|---|---|
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | Node row `Implementer:` pointer now lists `diff-r2` + `diff-r3` (non-blocking note from REOPEN r2). PM status untouched |

## Command
Read-only `git grep` against the `staging` ref (the pre-diff tree), so anyone can re-run them verbatim from repo root. They replace round 2's placeholder line and the non-reproducible `node reach.js` citation for criterion (1).

## Output — criterion (1)
```
$ git grep -nE "styles\.css|script_module|js/index\.js|code_flow|BarlowMedium|constant/constant" staging -- . ":!src/views" ":!TODO.md" ":!agent-hub"
(exit 1)

$ git grep -nE "styles\.css|script_module|js/index\.js|code_flow|BarlowMedium" staging -- src/views   # control: same names DO match inside the deleted views
staging:src/views/_layouts/_render.pug:23:		link(rel="stylesheet", href=path+"/css/styles.css")
staging:src/views/_parts/_head.pug:13:    link(rel="stylesheet", href=path+"/css/styles.css")
staging:src/views/information/index.pug:60:	script(src="./js/index.js")
staging:src/views/register.pug:31:    script(src="./js/index.js")
(exit 0)

$ git grep -nE "constant/constant|from ['\"]\./constant['\"]|from ['\"]@/constant['\"]" staging -- src
(exit 1)

$ git grep -nE "constant/atsKeywords" staging -- src   # control: the kept sibling module IS imported
staging:src/services/keywordMatcher.ts:3: * Matches against the curated dictionary in `constant/atsKeywords.ts`,
staging:src/services/keywordMatcher.ts:12:import { ALL_ATS_KEYWORDS } from '@/constant/atsKeywords';
(exit 0)

$ git grep -nE "res\.render|renderFile|compileFile" staging -- src
(exit 1)
```

Reading:
- Asset names of every deleted non-code file (`public/css/styles.css`, `public/js/{index,script_module}.js`, `public/img/code_flow.png`, both `BarlowMedium.ttf`) have zero references on `staging` outside `src/views`/`TODO.md`/`agent-hub` (exit 1). The control grep shows the only references that exist are inside the deleted `.pug` views (`styles.css`, `js/index.js`); `script_module`, `code_flow`, `BarlowMedium` match nowhere at all.
- `src/constant/constant.ts`: no `constant/constant`, `./constant` or `@/constant` import anywhere in `src` on `staging` (exit 1); control shows the kept sibling `constant/atsKeywords` IS imported (`keywordMatcher.ts:12`), so the pattern would have matched an importer.
- No Pug rendering call in `src` on `staging` (exit 1) → `src/views/**` unreachable.

## Acceptance (round 3)
| Criterion | Evidence |
|---|---|
| (1) | The three `git grep … staging` commands above, exit 1 each, with matching exit-0 controls |
| (2), (4), (7) | Unchanged — accepted in REOPEN r2 |
| (3), (5), (6) | Unchanged — round 1 note |
| Comments per code-comments.md | No code comments added/changed |

## Noticed, not done
Same as round 1.

## Seal gate
none new in round 3 (read-only `git grep`).
