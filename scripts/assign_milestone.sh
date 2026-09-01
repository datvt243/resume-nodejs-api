#!/usr/bin/env bash
# Script gán milestone cho tất cả issues của repository
# Cách dùng: ./scripts/assign_milestone.sh

set -euo pipefail

REPO="datvt243/resume-nodejs-api"
MILESTONE_TITLE="v1.0.0 - Hardening"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh cli chưa cài. Cài: https://cli.github.com/"
  exit 1
fi

if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "Chưa đăng nhập gh. Chạy: gh auth login"
  exit 1
fi

echo "Lấy danh sách issues và gán milestone '$MILESTONE_TITLE'..."

# Lấy milestone ID
MILESTONE_ID=$(gh api repos/$REPO/milestones --jq ".[] | select(.title==\"$MILESTONE_TITLE\") | .number" 2>/dev/null | head -1)

if [ -z "$MILESTONE_ID" ]; then
  echo "Không tìm thấy milestone '$MILESTONE_TITLE'. Tạo milestone trước bằng:"
  echo "  ./scripts/create_labels_milestones.sh"
  exit 1
fi

echo "Found milestone ID: $MILESTONE_ID"

# Lấy danh sách issues mở (open)
ISSUES=$(gh issue list --repo "$REPO" --state open --json number,title --jq '.[].number')

count=0
for issue_num in $ISSUES; do
  echo "Gán milestone $MILESTONE_ID cho issue #$issue_num"
  gh api repos/$REPO/issues/$issue_num \
    -X PATCH \
    -f milestone=$MILESTONE_ID \
    2>/dev/null && ((count++)) || echo "Failed for issue #$issue_num"
  sleep 0.5
done

echo "Hoàn tất: gán milestone cho $count issues"
