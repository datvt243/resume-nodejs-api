#!/usr/bin/env bash
# Commit + push the STAGED changes of a SEALED node.
# Usage: ship.sh <node-slug> "<type(scope): summary>" [--merge[=<branch>]] [--yes]
# Stage the node's files yourself first (git add <files>) — never blind add.
# Main working branch comes from ship.env next to this script.
# Exit: 0 shipped, 1 refused/failed, 3 declined at the seal gate.
set -euo pipefail

die() { echo "ship: $*" >&2; exit 1; }

SHIP_MAIN_BRANCH=""
SHIP_MERGE_VIA=git # pr = merge through a GitHub PR (protected target branch)
env_file="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ship.env"
# shellcheck source=/dev/null
[ -f "$env_file" ] && . "$env_file"

slug="" msg="" merge="" yes=false
for a in "$@"; do
  case $a in
    --merge) merge=main ;;
    --merge=*) merge=${a#--merge=} ;;
    --yes) yes=true ;;
    *) if [ -z "$slug" ]; then slug=$a; elif [ -z "$msg" ]; then msg=$a; else die "unexpected arg: $a"; fi ;;
  esac
done
[ -n "$slug" ] && [ -n "$msg" ] || die "usage: ship.sh <node-slug> \"<commit message>\" [--merge[=<branch>]] [--yes]"
[ -n "$SHIP_MAIN_BRANCH" ] || die "SHIP_MAIN_BRANCH not set in $env_file — don't guess the main branch"
[ "$merge" = main ] && merge=$SHIP_MAIN_BRANCH
[[ $SHIP_MERGE_VIA =~ ^(git|pr)$ ]] || die "SHIP_MERGE_VIA must be git or pr, got: $SHIP_MERGE_VIA"
[ -z "$merge" ] || [ "$SHIP_MERGE_VIA" = git ] || command -v gh >/dev/null || die "gh not found (SHIP_MERGE_VIA=pr)"

cd "$(git rev-parse --show-toplevel)"
hub=agent-hub

# 1. SealedOnly
grep -qE "^\| \`$slug\` \| SEALED \|" "$hub/haven/diagrams/dev-loop.prime-mermaid.md" \
  || die "node \`$slug\` is not SEALED — run /worker verifier first"
# 2. NO_EVIDENCE
impl=$(find "$hub/evidence/implementer" -name "*$slug*.md" 2>/dev/null | sort | tail -1)
seal=$(find "$hub/evidence/verifier" -name "*$slug*-seal.md" 2>/dev/null | sort | tail -1)
[ -n "$impl" ] || die "NO_EVIDENCE: no implementer note for $slug"
[ -n "$seal" ] || die "NO_EVIDENCE: no verifier seal note for $slug"
git diff --cached --quiet && die "nothing staged — git add the node's files first"

# 2b. BranchBeforeCommit
branch=$(git branch --show-current)
[ -n "$branch" ] || die "detached HEAD"
created=""
if [ "$branch" = "$SHIP_MAIN_BRANCH" ]; then
  # created after approval, so a declined run leaves nothing behind
  created="fix/$slug"
  git rev-parse -q --verify "refs/heads/$created" >/dev/null && die "branch $created already exists"
  branch=$created
fi

# 3. What is about to be committed (agent-hub/ collapsed)
code=$(git diff --cached --stat -- . ":(exclude)$hub")
echo "$code"
git diff --cached --quiet -- "$hub" || echo "📝 agent-hub: updated"
git diff --quiet || echo "(unstaged changes stay out of this commit)"

# 5. SEAL GATE — show the full chain, one approval
cmds=()
[ -n "$created" ] && cmds+=("git checkout -b $created")
cmds+=("git commit -m \"$msg\"" "git push -u origin $branch")
if [ -n "$merge" ] && [ "$SHIP_MERGE_VIA" = pr ]; then
  # --delete-branch removes the remote + local branch itself
  cmds+=("gh pr create --base $merge --head $branch (reuse an open one)" "gh pr checks <pr> --watch --required" "gh pr merge <pr> --merge${created:+ --delete-branch}")
elif [ -n "$merge" ]; then
  cmds+=("git checkout $merge" "git pull --ff-only origin $merge" "git merge --no-ff --no-edit $branch" "git push origin $merge")
  [ -n "$created" ] && cmds+=("git branch -d $created" "git push origin --delete $created")
fi
end=${merge:-$branch}
[ "$SHIP_MERGE_VIA" = pr ] && [ -n "$merge" ] && end=$branch
[ "$end" = "$SHIP_MAIN_BRANCH" ] || cmds+=("git checkout $SHIP_MAIN_BRANCH")
[ "$SHIP_MERGE_VIA" = pr ] && [ "$merge" = "$SHIP_MAIN_BRANCH" ] && cmds+=("git pull --ff-only origin $SHIP_MAIN_BRANCH")
echo; echo "node $slug → remote origin, branch $branch"
printf '  %s\n' "${cmds[@]}"
if ! $yes; then
  [ -t 0 ] || { echo "ship: approval needed — rerun with --yes once approved" >&2; exit 3; }
  read -rp "run these? [y/N] " ok
  [[ $ok =~ ^[yY]$ ]] || { echo "not approved — nothing run"; exit 3; }
fi

# 6. Run + read back (NoForce: no --force/--no-verify/amend anywhere)
out=$(mktemp)
run() { echo "\$ $*" | tee -a "$out"; "$@" 2>&1 | tee -a "$out"; return "${PIPESTATUS[0]}"; }
[ -n "$created" ] && run git checkout -b "$created"
run git commit -m "$msg"
hash=$(git rev-parse --short HEAD)
run git push -u origin "$branch"
pushed=true
pr_url=""
if [ -n "$merge" ] && [ "$SHIP_MERGE_VIA" = pr ]; then
  git fetch -q origin "$merge"
  pr_url=$(gh pr list --base "$merge" --head "$branch" --state open --json url --jq '.[0].url')
  [ -n "$pr_url" ] || pr_url=$(gh pr create --base "$merge" --head "$branch" --title "${msg%%$'\n'*}" \
    --body "$(git log --oneline "origin/$merge..$branch")")
  pr=${pr_url##*/}
  echo "PR: $pr_url" | tee -a "$out"
  sleep 15 # let CI register its checks on the new PR
  gh pr checks "$pr" --watch --required --interval 30 >/dev/null 2>&1 || true
  rc=0; checks=$(gh pr checks "$pr" --required 2>&1) || rc=$?
  echo "$checks" | tee -a "$out"
  [ "$rc" -eq 0 ] || grep -q "no required checks" <<<"$checks" \
    || die "required checks failed on $pr_url — not merged (gh run view <run-id> --log-failed)"
  # never --admin: a blocked merge stops here, the PR stays open
  run gh pr merge "$pr" --merge ${created:+--delete-branch}
elif [ -n "$merge" ]; then
  run git checkout "$merge"
  run git pull --ff-only origin "$merge"
  run git merge --no-ff --no-edit "$branch"
  run git push origin "$merge"
  if [ -n "$created" ]; then
    run git branch -d "$created" || echo "ship: kept $created (delete failed, never -D)" | tee -a "$out"
    run git push origin --delete "$created" || true
  fi
fi

# 7. Ship note
day=$(date +%F); note="$hub/evidence/ship/$day/$slug-ship.md"
mkdir -p "$(dirname "$note")"
{
  echo "# Ship — $slug"
  echo "- Node: \`$slug\` (SEALED, \`$seal\`) · Branch: \`$branch\` · Remote: \`$(git remote get-url origin)\`"
  [ -n "$created" ] && echo "- Auto-created \`$created\` from \`$SHIP_MAIN_BRANCH\` (BranchBeforeCommit)"
  echo; echo "## Commands"; printf -- '- `%s`\n' "${cmds[@]}"
  echo; echo "## Output"; echo "Commit: \`$hash\`"; echo '```'; cat "$out"; echo '```'
  echo; echo "## Seal gate"
  if $yes; then echo "Approved by the operator before the run (\`--yes\`), covering the whole chain above."
  else echo "Approved interactively (y) by the operator before the run, covering the whole chain above."; fi
} >> "$note"
rm -f "$out"

# 10. ReturnToWorkingBranch
$pushed && [ "$(git branch --show-current)" != "$SHIP_MAIN_BRANCH" ] && git checkout -q "$SHIP_MAIN_BRANCH"
# the PR merge happened on GitHub — bring the local main branch up to it
[ "$SHIP_MERGE_VIA" = pr ] && [ "$merge" = "$SHIP_MAIN_BRANCH" ] && git pull -q --ff-only origin "$SHIP_MAIN_BRANCH"
echo; echo "shipped $slug: $hash on $branch${merge:+, merged into $merge}"
echo "note: $note (uncommitted — goes in with the next commit)"
echo "now on: $(git branch --show-current)"
