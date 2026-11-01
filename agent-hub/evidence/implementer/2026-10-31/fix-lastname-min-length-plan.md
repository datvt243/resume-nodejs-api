# 2026-10-31 - fix-lastname-min-length (plan)

- Worker: implementer · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-lastname-min-length` (PENDING, appended)
- Task: `#333 Given name (lastName) requires 3+ characters, rejects names like An, Vy, Hà — src/config/joi.config.ts:52 lastName min(3) → min(1) like firstName; optionally align max (35 vs frontend 30).`
- Branch: `333-given-name-lastname` (off `staging`)

## Hub bytes before: 81374

## Acceptance
1. `lastName` in `src/config/joi.config.ts` is `min(1)`, same as `firstName`; `max(35)` kept.
2. Jest test: `An`, `Vy`, `Hà`, `Tú`, `Nguyễn` pass; `''` rejected.
3. `npm test` + `npm run build` green.
4. `npm run lint` adds zero new problems vs baseline.

## Anchors
- `src/config/joi.config.ts:52` — `lastName` rule.
- Only consumer: `src/candidate/candidate.validate.ts:8,25` (`grep -rn lastName src` — `auth.validate.ts` imports joi.config but not `lastName`).

## Decisions
- `max` stays 35: the issue marks aligning to the frontend's 30 as optional; the API being looser than the form rejects nothing real. Not changed (`SmallestDiff`).
- No slug collision in `dev-loop-archive.md`; no other open row cites #333.

## Blockers: none
