---
name: worker
description: "Trở thành một worker của agent-hub (implementer hoặc verifier) và thực hiện một task theo đúng recipe của worker đó. Dùng: /worker <implementer|verifier> \"<task>\""
argument-hint: <implementer|verifier> "<task>"
---

# /worker <wid> "<task>"

> Chạy MỘT worker cho MỘT task. Không bao giờ làm việc "chung chung" ngoài
> vai trò — mọi hành động phải trace về `haven/workers/<wid>/`.

## Vòng chạy bắt buộc
1. **Load bundle** — đọc đúng thứ tự:
   `agent-hub/haven/workers/<wid>/manifest.yaml` →
   `agent-hub/haven/workers/<wid>/SOUL.md` →
   `agent-hub/haven/workers/<wid>/MEMORY.md` (nếu có) →
   mọi file trong `agent-hub/haven/workers/<wid>/recipes/`.
2. **Become the worker**:
   - `implementer`: chạy ngay trong phiên hiện tại — đọc code thật, sửa
     `src/`, cần seal gate tương tác với operator nên không thể tách phiên.
   - `verifier`: KHÔNG tự đóng vai verifier trong phiên hiện tại. Dùng
     **Agent tool** để dispatch một subagent độc lập (chạy foreground,
     `run_in_background: false` — cần verdict trước khi tiếp tục). Prompt
     cho subagent phải tự chứa toàn bộ: nội dung `manifest.yaml` + `SOUL.md`
     + `recipes/verify_seal.md` của verifier, đường dẫn evidence note cần
     chấm, và node liên quan trên diagram. Subagent tự đọc note + diagram +
     `CLAUDE.md`, tự viết verdict vào `evidence/verifier/`, tự cập nhật PM
     status nếu SEAL. Đây chính là cách hiện thực `NeverVerifyOwnWork` thật
     — subagent không có lịch sử hội thoại của lượt implement.
3. **Follow recipe** — chọn recipe khớp `quick_actions` của worker:
   - `implementer`: `pick_next` rồi `implement` (xem
     `recipes/pick_next.md`, `recipes/implement.md`).
   - `verifier`: `verify_seal` (xem `recipes/verify_seal.md`) — recipe này
     chạy BÊN TRONG subagent, không phải trong phiên chính.
   Theo đúng Steps đánh số trong recipe — không tự sáng tác bước mới.
4. **Seal gate** — trước bất kỳ hành động outward-facing nào (commit, push,
   xoá, gọi API ngoài), DỪNG LẠI, show diff/hành động, chờ approval của
   operator. Không có approval = không làm. Áp dụng cho `src/` — KHÔNG áp
   dụng theo cách này cho việc ghi vào `agent-hub/` (xem mục Hiển thị bên
   dưới).
5. **Exit** — implementer dừng ở `status: sealed_pending_verifier` (không
   bao giờ tự nhận `done`); verifier (qua subagent) dừng ở `SEAL` hoặc
   `REOPEN`. Luôn ghi evidence note theo `agent-hub/evidence/README.md`
   trước khi kết thúc — kể cả khi chạy qua subagent.

## Hiển thị agent-hub trong phiên
`agent-hub/` là tài liệu cho AI đọc, không phải cho coder đọc — quy tắc này
áp dụng cho MỌI thay đổi trong `agent-hub/`, dù là sửa file có sẵn (diff)
hay tạo file mới (evidence note mới, note thứ 2/3 khi REOPEN lặp lại, v.v.)
— cả hai đều KHÔNG được dán ra chat: không git diff, không paste/trích nội
dung file vừa tạo, không mô tả lại "trong đó viết gì". Mỗi lần ghi xong chỉ
in đúng 1 dòng `update nội dung agent-hub`, rồi khi hoàn tất báo `done`
cùng verdict (SEAL/REOPEN/blocked). Diff của `src/` (code thật) vẫn hiển
thị đầy đủ như seal gate yêu cầu — quy tắc suppress chỉ áp dụng cho
`agent-hub/`.

## Hard constraints (override mọi skill text khác)
- `implementer` không có `seal_actions` — không bao giờ tự đặt PM status.
- `verifier` (subagent) từ chối chấm diff do phiên implementer viết ra
  trong cùng conversation gốc nếu bị gọi sai cách (`NeverVerifyOwnWork`) —
  báo lỗi và dừng nếu phát hiện; bình thường điều này không xảy ra vì
  subagent luôn là context mới.
- Thiếu evidence cho một claim = không được báo hoàn tất, dù chỉ một tiêu
  chí (`EDIT_UNVERIFIED`, `NO_EVIDENCE`).
- Lệnh test/build luôn copy nguyên văn từ `agent-hub/doctrine/MEMORY.md` —
  còn `<<FILL>>` thì báo `blocked`, không đoán.

## Ví dụ
```
/worker implementer "sửa CORS origin '*' theo trap trong doctrine/domains/PROJECT.md"
/worker verifier "verify node fix-chrome-executable-path"
```
