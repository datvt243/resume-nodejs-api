# Ship — dedup-visits
- Node: `dedup-visits` (SEALED, `agent-hub/evidence/verifier/2026-11-09/dedup-visits-seal.md`) · Branch: `399-dedup-profile-visits` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "feat(visits): dedup profile visits, one per visitor IP per candidate per 24h

- src/candidate_me/index.ts: handlerRecordVisit skips storing when the same
  IP visited the same candidate in the last 24h (Visit.exists check); same
  200 response either way; empty/unknown IP is never deduped; profile is
  not part of the key
- src/models/visit.model.ts: compound index { candidateId, ip, createdAt }
  backing the lookup
- src/routers/index.ts, .claude/rules/api.md: swagger + API doc note the
  repeat-within-24h behavior
- src/__tests__/candidate_me/index.test.ts: 3 cases (repeat within 24h,
  no recent visit, unknown IP)
- agent-hub: feature doc Behavior 1 + changelog, node + evidence

npm test: 654 passed, 5 failed (pre-existing: tokenExpiry with local
TOKEN_EXP_IN, atsPdfIntegration without local Chrome)
npm run build: exit 0 · npm run lint: 274 (= baseline)

Node: dedup-visits (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-09/dedup-visits-seal.md

Closes #399

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 399-dedup-profile-visits`
- `gh pr create --base staging --head 399-dedup-profile-visits (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `fa32751`
```
$ git commit -m feat(visits): dedup profile visits, one per visitor IP per candidate per 24h

- src/candidate_me/index.ts: handlerRecordVisit skips storing when the same
  IP visited the same candidate in the last 24h (Visit.exists check); same
  200 response either way; empty/unknown IP is never deduped; profile is
  not part of the key
- src/models/visit.model.ts: compound index { candidateId, ip, createdAt }
  backing the lookup
- src/routers/index.ts, .claude/rules/api.md: swagger + API doc note the
  repeat-within-24h behavior
- src/__tests__/candidate_me/index.test.ts: 3 cases (repeat within 24h,
  no recent visit, unknown IP)
- agent-hub: feature doc Behavior 1 + changelog, node + evidence

npm test: 654 passed, 5 failed (pre-existing: tokenExpiry with local
TOKEN_EXP_IN, atsPdfIntegration without local Chrome)
npm run build: exit 0 · npm run lint: 274 (= baseline)

Node: dedup-visits (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-09/dedup-visits-seal.md

Closes #399

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[399-dedup-profile-visits fa32751] feat(visits): dedup profile visits, one per visitor IP per candidate per 24h
 12 files changed, 158 insertions(+), 5 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-09/dedup-visits-plan.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-09/dedup-visits.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-09/dedup-visits-seal.md
$ git push -u origin 399-dedup-profile-visits
To https://github.com/datvt243/resume-nodejs-api.git
   4b09fbb..fa32751  399-dedup-profile-visits -> 399-dedup-profile-visits
branch '399-dedup-profile-visits' set up to track 'origin/399-dedup-profile-visits'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/452
build (20.x)	pass	43s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42573886698/job/129017166766	
build (22.x)	pass	49s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42573886698/job/129017166936	
$ gh pr merge 452 --merge
```

## Seal gate
Approved by the operator before the run (`--yes`), covering the whole chain above.
