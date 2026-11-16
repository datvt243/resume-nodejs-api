# 2026-11-16 - translate-vietnamese-docs — SEAL

Worker: verifier · Version: 0.1.0 · Node: `translate-vietnamese-docs` (#478, branch `chore/478-translate-vietnamese-content`)
Note graded: `evidence/implementer/2026-11-16/translate-vietnamese-docs-plan.md`

## Isolation proof
Fresh Agent-tool spawn; dispatch prompt began "You are the agent-hub VERIFIER for the repo at ..." and told me to judge the scoping decision and compare against `git diff` / `git show HEAD:<file>` — instructions the implementer pass did not carry. No memory of the implement pass.

## Re-run: full
`npm test` + `npm run build`, from the repo root. Reason: the dispatcher explicitly ordered "re-run commands yourself" (none of the recipe's 3 default exceptions applies; docs-only node). Also read `git diff` of the 4 translated files at the dispatcher's request (beyond the recipe's note-only default), to check meaning line by line.
```
Test Suites: 72 passed, 72 total
Tests:       781 passed, 781 total
> resume-nodejs-api@2.8.0 copy
> cp -R ./src/public ./dist/
build_rc=0
```

## Criteria
| Criterion | Verdict | Evidence |
|---|---|---|
| (1) no Vietnamese prose in the 4 files | met | my own diacritic grep on README.md, CONTRIBUTING.md, todo/SKILL.md, worker/SKILL.md → only `README.md:106` `**Đạt Võ**` (author's proper name) |
| (2) meaning preserved | met | read each hunk of `git diff` side by side: every heading, numbered step, command (`gh issue view/create/develop`, `git fetch/checkout/pull`), path, flag (`--ship`, `--merge`, `--list`, `--checkout --base staging`), limit (3 REOPENs), status name and kit tag survives; README TOC anchors match the new headings; the only marker change (`update nội dung agent-hub` → `agent-hub content updated`) has no other reference (grep of repo outside evidence/, node_modules/, dist/ → none) |
| (3) evidence/archive/feature docs unchanged | met, scoping agreed | remaining hits outside evidence/: `cv-profiles.md` `Tổng hợp` (literal default profile name), `cv-section-crud.md` `"Đã thêm X/Y mục"` (literal vi API message), `.claude/rules/api.md:66` `"Tổng hợp"` (same literal, not in the note's survey but also a literal value), `dev-loop-archive.md` 12 lines (verbatim operator quotes, names, branch names, school names). Evidence notes are append-only audit records. Translating any of these would falsify literal values or history. |
| (4) `npm test` + `npm run build` green | met | note output, matched by my own re-run above |
| comments per code-comments.md | n/a | no code touched |

Command matches `doctrine/MEMORY.md` (Test `npm test`, Typecheck `inside Build` → `npm run build`); output not truncated.
Feature doc: `none` — fine for a docs-only task. Review: `skipped — docs` on a docs task — allowed. Supersedes/Still open: none; no other open #478 row.
Forbidden states: none hit. Seal gate: no outward-facing action. Proportionality: diff limited to the 4 files + node row; the other working-tree edits (`<type>/<n>-<desc>` branch wording in CONTRIBUTING/todo, issues-ls/release/ship, PROJECT.md) predate the task per the dispatcher and the note's `## Noticed, not done`, and they were not graded.
Doctrine proposal: none.

## Verdict: SEAL
PM status: row collapsed to a pointer and the full row archived to `haven/diagrams/dev-loop-archive.md`. The 2 oldest pointer rows (`visit-skip-private`, `soft-deleted-writes-404`; their full rows already in the archive) were dropped to keep 20 pointers.
