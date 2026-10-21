# 2026-10-20 — audit-response-error-handling (implementer plan)

Worker: implementer · Version 0.1.0
Node: `audit-response-error-handling` (`haven/diagrams/dev-loop.prime-mermaid.md:153`, PENDING, appended at table end)
Task: GitHub issue #271 "Audit toàn bộ cách API trả về response và xử lý lỗi" (via `/todo`, branch `271-audit-ton-bo`) — full body in the issue. Operator: "Chưa sửa code vội, chỉ báo cáo trước để tôi duyệt."

## Hub bytes before: 239528
(root 11551 + doctrine 43703 + active diagram 163481 + worker bundles 20793)

## Plan
- READ-ONLY. Deliverable is a report, zero `src/` diff.
- Anchors read: `src/errors/AppError.ts`, `src/middlewares/errors.middleware.ts`, `src/utils/helper.ts`, `src/utils/valid.ts`, `src/services/index.ts`, `src/candidate_profile/BaseController.ts`, `src/candidate_profile/BaseService.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/candidate/candidate.controller.ts`, `src/candidate_me/{index,ats-check,public-pdf}.ts`, `src/services/{createPDF,createPDF.ats,createDocx}.ts`, `src/middlewares/{verifyToken,rateLimit}.middleware.ts`, `src/routers/{index,api/v1/index,api/v2/index}.ts`, `src/server.ts`, section controllers.
- Runtime-prove the most severe claims with a throwaway jest probe (copied into `src/__tests__/` only for the run, deleted right after; `git status` re-checked).
- Baseline `npm test` + `npm run build` to prove nothing changed.

## Blockers: none (no `<<FILL>>` in doctrine/MEMORY.md)
