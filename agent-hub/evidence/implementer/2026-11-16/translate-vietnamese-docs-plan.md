# 2026-11-16 - translate-vietnamese-docs

Worker: implementer · Version: 0.1.0 · Node: `translate-vietnamese-docs` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS) · Issue #478 · Branch `chore/478-translate-vietnamese-content`
Task (verbatim): "kiểm tra các file skill md, agent-hub và các file md ở root, nếu content là tiếng Việt, hãy đưa về tiếng Anh"

## Hub bytes before: 98753
(measured after the node row was appended, before any doc diff; command from `evidence/README.md`)

## Feature doc: none
Docs-only task, touches no documented feature.

## Scope survey
Command (repo root): for every `./*.md`, `.claude/skills/**/*.md`, `agent-hub/**/*.md`: `grep -c '[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹĂÂĐÊÔƠƯ]'`.
Hits outside `evidence/`:
```
88 .claude/skills/todo/SKILL.md
82 CONTRIBUTING.md
63 .claude/skills/worker/SKILL.md
58 README.md
12 agent-hub/haven/diagrams/dev-loop-archive.md
3 agent-hub/doctrine/features/cv-profiles.md
1 agent-hub/doctrine/features/cv-section-crud.md
0 API-STANDARD.md, CLAUDE.md
```
`evidence/`: 182 of 504 notes, 1240 lines.
Out of scope, left unchanged (criterion 3):
- `cv-profiles.md` (`Tổng hợp` = the literal default profile name the code creates), `cv-section-crud.md` (`"Đã thêm X/Y mục"` = literal `vi` API message) — English docs quoting real data values.
- `dev-loop-archive.md` — English rows quoting verbatim operator prompts, the author name, branch names; cold storage, verbatim history.
- `evidence/**` — committed audit records ("bad notes are kept"), largely i18n diffs quoting literal Vietnamese strings; rewriting them would falsify the history the verifier cites.

## Diff
| file | why |
|---|---|
| `README.md` | full Vietnamese → English; TOC anchors updated to the new English headings |
| `CONTRIBUTING.md` | full Vietnamese → English (translated on top of the pre-existing uncommitted edits in the working tree, which are preserved) |
| `.claude/skills/todo/SKILL.md` | frontmatter description/argument-hint + body → English; "Bước 0"/"Lượt 1/2" → "Step 0"/"Pass 1/2"; print marker `update nội dung agent-hub` → `agent-hub content updated` (only defined in these 2 skills — grep confirmed) |
| `.claude/skills/worker/SKILL.md` | frontmatter description + body → English; same marker change |
| `haven/diagrams/dev-loop.prime-mermaid.md` | node row added (NodeBeforeCode) |

Structure preserved: same headings order, same numbered steps, every command/path/flag/kit date tag unchanged.

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (copied from `doctrine/MEMORY.md`): `npm test`; Typecheck row = `inside Build` → `npm run build`. Lint: no `.ts`/`.js` file touched → not run.

## Output
```
Test Suites: 72 passed, 72 total
Tests:       781 passed, 781 total
Snapshots:   0 total
Time:        13.067 s
Ran all test suites.
```
(preceded by the known jest "worker process has failed to exit gracefully" warning)
```
> resume-nodejs-api@2.8.0 copy
> cp -R ./src/public ./dist/
```
(`build` = `tsc && npm run copy`; `copy` only runs after `tsc` exits 0)

Residual check after diff:
```
$ grep -n '<VN chars>' README.md CONTRIBUTING.md .claude/skills/todo/SKILL.md .claude/skills/worker/SKILL.md
README.md:106:**Đạt Võ** — [@datvt243](https://github.com/datvt243)
```
Stale-reference check: `grep -rn -e "Bước 0" -e "Lượt [12]" -e "#bắt-đầu" -e "#tính-năng" -e "Quy trình" -e "Ràng buộc cứng" .claude agent-hub/haven agent-hub/doctrine ./*.md` → no output.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) no Vietnamese prose in the 4 files, literals kept | residual grep → only `README.md:106` author name `Đạt Võ` (a proper name) |
| (2) meaning preserved | same headings/steps/commands; stale-ref grep empty; README anchors re-pointed |
| (3) evidence/archive/feature docs unchanged | scope survey above; `git diff --stat` touches none of them |
| (4) tests + build green | `Tests: 781 passed, 781 total`; build reached `npm run copy` |
| comments per code-comments.md | n/a — no code touched |

## Supersedes: none
## Still open: none

## Review: skipped — docs

## Noticed, not done
- Working tree carried pre-existing uncommitted edits into this branch (`.claude/skills/{issues-ls,release,ship}/…`, `ship.sh`, `CONTRIBUTING.md`, `todo/SKILL.md`, `doctrine/domains/PROJECT.md`, untracked ship evidence). Not mine; `/ship` would commit them together — operator should decide.

## Seal gate: none (no outward-facing action)
