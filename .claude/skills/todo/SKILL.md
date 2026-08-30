---
name: todo
description: "Gộp /worker implementer và /worker verifier thành 1 lệnh gõ cho một task — vẫn chạy 2 lượt tách biệt bên trong, tự lặp lại khi REOPEN. Dùng: /todo \"<task>\""
argument-hint: "<task>"
---

# /todo "<task>"

> Orchestrate lại đúng skill `worker` 2 lần, ở 2 lượt tách biệt. KHÔNG tự
> triển khai lại logic implement/verify riêng — chỉ gọi `/worker` theo
> đúng thứ tự bên dưới.

## Quy trình
1. **Lượt 1 — implementer**: chạy tương đương `/worker implementer "<task>"`,
   trong phiên chính. Dừng ở `status: sealed_pending_verifier` (hoặc
   `blocked` / `reopened_by_test` nếu test tại chỗ fail — xem
   `recipes/implement.md`).
2. **Lượt 2 — verifier**: KHÔNG tự đóng vai verifier trong phiên chính.
   Ngay sau khi implementer ghi xong evidence note, tự động dùng **Agent
   tool** để dispatch một subagent độc lập chạy `verify_seal` (bundle đầy
   đủ `manifest.yaml`/`SOUL.md`/`recipes/verify_seal.md` của verifier vào
   prompt, cùng đường dẫn evidence note vừa tạo + node liên quan).
   `run_in_background: false` — chờ verdict trước khi tiếp tục. Đây là
   lượt suy luận thật sự tách biệt (subagent không thấy hội thoại lượt 1),
   không phải roleplay trong cùng context — `NeverVerifyOwnWork` được đảm
   bảo bằng cơ chế, không phải bằng lời hứa. Subagent tự viết verdict vào
   `evidence/verifier/`.
3. **Verdict = REOPEN** → tự động quay lại Lượt 1 với đúng lý do REOPEN
   trích từ evidence note của subagent verifier. Lặp tối đa **3 lần**. Chạm
   giới hạn → dừng, báo operator tự quyết định, không tự lặp thêm.
4. **Verdict = SEAL** → dừng, báo kết quả. KHÔNG tự `commit`/`push` —
   seal gate trong `CLAUDE.md` vẫn áp dụng cho mọi hành động
   outward-facing trên `src/`, kể cả khi gọi qua `/todo`.

## Hiển thị agent-hub trong phiên
`agent-hub/` (evidence note của cả 2 lượt, PM status, MEMORY.md) là tài
liệu cho AI đọc — áp dụng cho MỌI thay đổi, dù sửa file có sẵn hay tạo file
mới (kể cả note thứ 2/3 khi REOPEN lặp lại nhiều vòng). KHÔNG dán git diff,
KHÔNG paste/trích nội dung file vừa tạo, KHÔNG mô tả lại nội dung, dù ở
lượt nào. Mỗi lần ghi xong chỉ in đúng 1 dòng `update nội dung agent-hub`.
Chỉ báo kết quả cuối: verdict (SEAL/REOPEN/blocked) + lý do ngắn gọn nếu
REOPEN. Diff của `src/` vẫn hiển thị đầy đủ khi implementer đụng code thật.

## Ràng buộc cứng
- Đây KHÔNG phải 1 pass tự viết tự chấm — luôn là implementer (phiên
  chính) → verifier (subagent độc lập), đúng tinh thần gọi `/worker` 2
  lần nhưng lượt verifier chạy bằng cơ chế subagent thật thay vì roleplay.
- Mỗi lượt đều phải để lại evidence note riêng
  (`evidence/implementer/...`, `evidence/verifier/...`) — không gộp note,
  kể cả khi verifier chạy qua subagent.
- Nếu `doctrine/MEMORY.md` còn `<<FILL>>` khiến implementer `blocked` ngay
  từ lượt 1, dừng và báo blocker — không cố gắng "đoán qua" để tiếp tục
  vòng lặp, và không dispatch subagent verifier khi chưa có gì để chấm.

## Ví dụ
```
/todo "sửa CORS origin '*' theo trap trong doctrine/domains/PROJECT.md"
# Lượt 1 (implementer, phiên chính): pick_next → implement → evidence → sealed_pending_verifier
# Lượt 2 (verifier, subagent độc lập qua Agent tool): đọc evidence → SEAL (hoặc REOPEN kèm lý do cụ thể)
# REOPEN → tự lặp lượt 1 với lý do đó, tối đa 3 lần → nếu vẫn REOPEN, dừng
# SEAL → dừng, báo kết quả, không tự commit
```
