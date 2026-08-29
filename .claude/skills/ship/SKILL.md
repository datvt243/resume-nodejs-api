---
name: ship
description: "Gộp bước 'git add đúng file thuộc diff đã duyệt → commit → push' thành 1 lệnh, thay cho việc gõ 'commit và push' mỗi lần sau khi một node đã SEAL. Dùng: /ship"
argument-hint: ""
---

Base directory for this skill: `.claude/skills/ship`

# /ship

> Không phải một pass tự-duyệt mới — `/ship` chỉ đóng gói bước git cho
> đúng diff đã được hiển thị + đã SEAL trong phiên hiện tại. Seal gate
> (`agent-hub/CLAUDE.md`) coi việc operator gõ `/ship` là hành động phê
> duyệt cho lần chạy đó — không dùng để tự động hoá lặp lại mà không có
> operator gõ lệnh mỗi lần.

## 6 bước, đúng thứ tự

1. **Soát rác trước khi soát diff**: `git status --short`. Bất kỳ file
   nào rõ ràng là output tạm của live-test (PDF/ảnh sinh ra trong
   `src/public/pdf/`, `src/public/uploads/`, file test account, log tạm
   trong `/tmp` đã lỡ copy vào repo...) — xoá trước khi add, không commit
   rác. Không chắc file nào là rác vs file thật của diff → dừng, hỏi
   operator, không tự đoán.

2. **Chỉ `git add` đúng phạm vi diff đã duyệt** trong phiên — không bao
   giờ `git add -A`/`git add .` mù quáng. Phạm vi thường gồm:
   - File `src/` đã hiển thị diff cho operator xem (theo seal gate).
   - `package.json`/`package-lock.json` nếu task có thêm dependency thật
     (`npm install`, không tự sửa tay).
   - `.gitignore` nếu task có sửa.
   - `agent-hub/evidence/implementer/...` + `agent-hub/evidence/verifier/...`
     của (các) node vừa SEAL trong phiên.
   - `agent-hub/haven/diagrams/*.md` (PM status vừa cập nhật).
   - `agent-hub/doctrine/**` nếu task có thêm Trap/Decision mới.
   File KHÔNG thuộc phạm vi trên (file cấu hình cá nhân như `.nvmrc`
   không do task này tạo ra, file scratch, file không rõ nguồn gốc) —
   để ngoài, nói rõ trong báo cáo cuối tại sao bỏ qua.

3. **Viết commit message** theo đúng format đã dùng trong repo này (xem
   `git log` các commit gần nhất làm mẫu):
   - Dòng tiêu đề: `type(scope): mô tả ngắn` (`feat`/`fix`/`refactor`/...).
   - Thân bài: tóm tắt thay đổi theo từng nhóm file, kết quả
     `npm test`/`npm run build` (verbatim ngắn gọn, không bịa số liệu —
     lấy đúng số đã có trong evidence note của node vừa SEAL).
   - Dòng cuối: tên node đã SEAL + đường dẫn evidence.
   - Kết thúc bằng đúng dòng:
     `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`

4. **`git commit`** với message ở bước 3.

5. **`git push origin <branch-hiện-tại>`** — đọc branch hiện tại thật
   (`git branch --show-current`), không hard-code `develop`/`main`.

6. **Báo cáo đúng 3 dòng**:
   ```
   📦 Commit: <hash> — <tiêu đề dòng đầu>
   🚀 Push: <old>..<new> → <remote>/<branch>
   🧹 Bỏ qua (nếu có): <file> — <lý do>
   ```

## Ràng buộc cứng
- KHÔNG tự chạy `/ship` thay cho operator — chỉ chạy khi operator gõ
  `/ship` (hoặc yêu cầu tương đương rõ ràng như "ship nó", "commit và
  push") trong lượt hiện tại.
- KHÔNG gộp nhiều node SEAL không liên quan vào 1 commit nếu chúng không
  cùng nằm trong 1 phiên làm việc liên tục — mỗi `/ship` nên tương ứng
  1 đợt thay đổi đã duyệt, giữ lịch sử git dễ đọc.
- Nếu `git status --short` cho thấy có thay đổi KHÔNG liên quan gì đến
  node vừa SEAL (ví dụ ai đó sửa file khác ngoài phiên này) — dừng, báo
  operator, không tự gộp hay tự bỏ qua.
- Seal gate của `agent-hub/CLAUDE.md` vẫn là luật gốc — `/ship` không
  thay thế nó, chỉ là phím tắt cho đúng chuỗi hành động operator đã đồng
  ý (diff đã hiển thị + node đã SEAL) trong phiên đó.
