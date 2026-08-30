#!/usr/bin/env bash
# Script tạo issues trên GitHub bằng `gh` (GitHub CLI)
# Cách dùng: chỉnh biến REPO nếu cần, sau đó chạy: ./scripts/create_issues.sh

set -euo pipefail

REPO="datvt243/resume-nodejs-api"
# nếu muốn override khi chạy: REPO=your/org-repo ./scripts/create_issues.sh

if ! command -v gh >/dev/null 2>&1; then
  echo "gh cli chưa cài hoặc không tìm thấy. Cài: https://cli.github.com/"
  exit 1
fi

# kiểm tra auth
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "Chưa đăng nhập gh. Chạy: gh auth login"
  exit 1
fi

# Danh sách issues
titles=(
  "Add input sanitization to prevent NoSQL injection"
  "Implement rate limiting on API endpoints"
  "Enhance password security requirements"
  "Implement custom error classes and global error handler"
  "Add structured logging with Winston"
  "Complete & test verifyToken.middleware.ts"
  "Add unit tests for auth service and controllers"
  "Audit and fix all async/await patterns"
  "Refactor repeated code patterns to follow DRY"
  "Add Swagger/OpenAPI documentation"
  "Optimize MongoDB queries with indexes"
  "Add Docker support for development and production"
)

bodies=(
  "Add input sanitization (mongo-sanitize), use helmet, and stricter Joi validations to prevent NoSQL injection."
  "Use express-rate-limit; limit login attempts to 5 per 15 minutes and general endpoints to reasonable rates."
  "Enforce password strength (min 8, uppercase, number, special char), add reset flow and secure storage."
  "Create AppError/ValidationError/AuthError, update middleware to handle different error types and map to HTTP codes."
  "Install winston, add request/response logging middleware and error log file; configure transports."
  "Finish implementation of verifyToken.middleware.ts: token verify/refresh, error handling, token blacklist for logout."
  "Write unit tests for register/login flows, jwt generation, and controller error cases (jest)."
  "Use express-async-errors or wrap async handlers, audit all async functions and fix missing awaits."
  "Refactor utilities and repeated logic (e.g., getSelectFields -> Object.keys, consolidate validation)."
  "Add swagger-jsdoc + swagger-ui-express and document all endpoints with request/response schemas."
  "Add index on email field; review queries and add compound indexes where needed; enable pooling."
  "Add Dockerfile and docker-compose.yml (include Mongo) for dev and production."
)

labels=(
  "security"
  "security"
  "security"
  "refactor"
  "enhancement"
  "bug"
  "testing"
  "refactor"
  "refactor"
  "documentation"
  "performance"
  "devops"
)

count=${#titles[@]}
for ((i=0; i<count; i++)); do
  title="${titles[$i]}"
  body="${bodies[$i]}"
  label="${labels[$i]}"

  echo "Creating issue $((i+1))/$count: $title"
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$label"
  sleep 1
done

echo "Hoàn tất tạo $count issues trong repo $REPO"
