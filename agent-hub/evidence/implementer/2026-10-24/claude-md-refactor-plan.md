# 2026-10-24 - claude-md-refactor (plan)
- Worker: implementer · Version: 0.1.0
- Node: `claude-md-refactor` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended)
- Task: "docs: refactor CLAUDE.md theo best practices của Anthropic" — issue #305, branch `305-docs-refactor-claude` (off `staging` bc094ef)

## Hub bytes before: 81279

## Acceptance criteria
1. Root `CLAUDE.md` < 200 lines (`wc -l`).
2. Removed: content derivable from code (src/ file tree, test-file table, error-class tree, logging internals, version/author line) and stale content (middleware list — missing helmet + notFoundHandler vs `src/server.ts:36-95`; "both respect LOCAL_PORT" wording replaced by actual rule from `src/server.ts:107`).
3. API endpoint tables + auth flow → `.claude/rules/api.md`; models table + service layer → `.claude/rules/models.md`; both verbatim, with `paths:` frontmatter.
4. Content-retention grep: every non-derivable key fact of the old file appears ≥1 time across new `CLAUDE.md` + `.claude/rules/*.md`.
5. `npm test` / `npm run lint` counts identical before vs after (docs-only diff).
6. `.claude/rules/` not gitignored (`git check-ignore` rc=1).

## Anchors
`CLAUDE.md` (old: 459 lines, copy at agent-hub-init session scratchpad), `src/server.ts:36-107`, `package.json` scripts, `src/__tests__/services/atsPdfIntegration.test.ts` (`CI_NO_CHROME`).

## Blockers: none
