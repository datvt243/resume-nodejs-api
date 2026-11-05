# 2026-11-02 - add-familiar-skills (ship --merge)
- Node: `add-familiar-skills` (SEALED — evidence/verifier/2026-11-02/add-familiar-skills-seal.md)
- Branch: `349-t-ng-t-mainskills` → `staging` · Remote: origin (datvt243/resume-nodejs-api)

## Commands
- `git add` <7 src files + node's implementer/verifier notes + worker-runs.log + 2 diagram files>
- `git commit -F -` (feat(general-information): add familiarSkills (no limit))
- `git push -u origin 349-t-ng-t-mainskills`
- `gh pr create --base staging --head 349-t-ng-t-mainskills ...`
- `gh pr checks 350 --watch`
- `gh pr merge 350 --merge --delete-branch`

## Output
- Commit: `d3d37da feat(general-information): add familiarSkills (no limit)`
- Push: `6474654..d3d37da  349-t-ng-t-mainskills -> 349-t-ng-t-mainskills`
- PR: https://github.com/datvt243/resume-nodejs-api/pull/350
- CI: `build (20.x) pass 51s`, `build (22.x) pass 52s`, `GitGuardian Security Checks pass 13s`
- Merge: `MERGED 088be74` → staging

## Seal gate
Operator typed `/ship --merge and /release` this turn — approval covers commit, push, PR, merge.
Left out (not this node): agent-hub/evidence/implementer/2026-11-01/check-education-i18n-plan.md, agent-hub/evidence/ship/2026-11-01/delete-all-visits-ship.md.
