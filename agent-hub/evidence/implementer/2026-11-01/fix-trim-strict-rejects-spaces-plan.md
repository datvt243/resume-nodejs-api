# 2026-11-01 - fix-trim-strict-rejects-spaces (plan)

- Worker: implementer · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-trim-strict-rejects-spaces` (PENDING, appended)
- Task: `#332 Fields with .trim().strict() reject surrounding spaces with 400 instead of trimming` (issue body: drop `.strict()` where it's only there for `trim()`, so the stored value is trimmed; check `strict()` isn't relied on to block number→string coercion)
- Branch: `332-fields-with-trim` (off `staging` @ 2f45cde)

## Hub bytes before: 81467
Measured from `agent-hub/` with:
`{ find . -maxdepth 1 -type f; find doctrine -type f; echo haven/diagrams/dev-loop.prime-mermaid.md; find haven/workers -type f; } | xargs cat | wc -c`

## Acceptance
See node row (5 criteria).

## Anchors
`grep -rn "strict()" src | grep -v __tests__` → 15 hits:
- change (user-typed text): `src/config/joi.config.ts:44` email, `:50` firstName, `:52` lastName, `:54` fullName, `:56` company, `:58` position, `:60` phone, `:101` `_stringDefault`; `src/candidate_profile/education/education.validate.ts:11` school, `:12` major; `src/candidate_profile/profile/profile.validate.ts:16` name.
- keep: `joi.config.ts:48` + `auth.validate.ts:10` password, `auth.validate.ts:28` token, `project.validate.ts:15` companyId.
- Callers save the validated `value`, not `req.body`: `src/utils/valid.ts:27-30` returns `value`; `BaseController.ts:214-218,227-231` pass `value` to the service.

## Coercion check (issue's caveat)
Ran against the repo's Joi, `Joi.string().min(1).max(10).trim().required()` (no strict):
```
" An " -> "An"
123 -> string.base
true -> string.base
"   " -> string.empty
" MIT" -> "MIT"
```
`Joi.string()` never coerces numbers/booleans to strings, so `strict()` wasn't blocking coercion on these fields.

## Decisions
- Passwords keep `.strict()`: silently trimming changes a secret the user typed; rejecting is the safer contract. Token/companyId are machine-generated, not form input.
- No tests reference `string.trim` (`grep -rn "string.trim\|strict" src/__tests__` → only HTTP-header hits).
- No slug collision; no other open row cites #332.

## Blockers: none
