---
name: ship
description: "Gộp bước 'git add đúng file thuộc diff đã duyệt → commit → push' thành 1 lệnh, thay cho việc gõ 'commit và push' mỗi lần sau khi một node đã SEAL. Thêm --merge để tự tạo PR develop→main và tự merge. Dùng: /ship [--merge]"
argument-hint: "[--merge]"
---

Base directory for this skill: `.claude/skills/ship`

# /ship [--merge]

> Không phải một pass tự-duyệt mới — `/ship` chỉ đóng gói bước git cho
> đúng diff đã được hiển thị + đã SEAL trong phiên hiện tại. Seal gate
> (`agent-hub/CLAUDE.md`) coi việc operator gõ `/ship` là hành động phê
> duyệt cho lần chạy đó — không dùng để tự động hoá lặp lại mà không có
> operator gõ lệnh mỗi lần. Cờ `--merge` là một hành động outward-facing
> RIÊNG, nặng hơn commit+push thường (đưa code lên `main`) — operator gõ
> `--merge` chính là phê duyệt CHO RIÊNG hành động đó, không suy ra từ
> việc đã phê duyệt diff trước đó.

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

6. **Nếu KHÔNG có `--merge`** → báo cáo đúng 3 dòng rồi dừng:
   ```
   📦 Commit: <hash> — <tiêu đề dòng đầu>
   🚀 Push: <old>..<new> → <remote>/<branch>
   🧹 Bỏ qua (nếu có): <file> — <lý do>
   ```

## Nếu có `--merge`: bước 7-9 (chỉ chạy sau khi bước 1-5 xong, chỉ áp dụng chiều `develop` → `main`)

7. **Điều kiện chặn trước khi làm bất kỳ gì thêm** — dừng và báo operator,
   không tự đoán/tự work around, nếu:
   - Branch hiện tại (`git branch --show-current`) không phải `develop`.
     `--merge` chỉ định nghĩa cho chiều `develop → main`; branch khác thì
     dừng, hỏi operator muốn gì.
   - `git log origin/main..develop --oneline` rỗng — không có gì để
     merge, không tạo PR rỗng.
   - `gh` chưa đăng nhập / không có quyền trên repo — báo lỗi thật từ
     `gh`, không tự bịa trạng thái.

8. **Tạo hoặc tái dùng PR `develop` → `main`**:
   - Check trước: `gh pr list --base main --head develop --state open`.
     Nếu đã có PR mở, dùng lại PR đó (không tạo trùng).
   - Nếu chưa có: `gh pr create --base main --head develop --title
     "<tiêu đề>" --body "<mô tả>"`. Title ngắn gọn kiểu
     `chore(release): merge develop into main`. Body liệt kê
     `git log origin/main..develop --oneline` (danh sách commit thật sẽ
     lên main) — không tự bịa danh sách node đã SEAL, lấy từ git log
     thật.

9. **Merge PR bằng merge commit**: `gh pr merge <số PR> --merge`.
   - KHÔNG dùng `--admin`/bypass branch protection để ép merge khi bị
     chặn (review bắt buộc, check CI fail...) — báo lỗi thật từ `gh`,
     dừng, để operator tự quyết định (tự duyệt PR trên GitHub, hoặc chờ
     CI).
   - KHÔNG tự xoá branch `develop` sau merge (`--delete-branch`) — đây là
     branch làm việc chính, không phải feature branch dùng 1 lần.
   - Nếu merge thành công, thêm 2 dòng vào báo cáo bước 6:
     ```
     🔀 PR: <url PR> (#<số>)
     ✅ Merged: <merge commit sha ngắn> → main
     ```
   - Nếu bị chặn không merge được (chưa CI xong, cần review...), báo rõ
     lý do `gh` trả về, dừng ở đó — PR vẫn ở trạng thái mở, không coi là
     lỗi của `/ship`, chỉ là "chưa merge được, PR đang chờ: <url>".

## Ràng buộc cứng
- KHÔNG tự chạy `/ship` thay cho operator — chỉ chạy khi operator gõ
  `/ship` (hoặc yêu cầu tương đương rõ ràng như "ship nó", "commit và
  push") trong lượt hiện tại.
- KHÔNG tự thêm `--merge` khi operator chỉ gõ `/ship` trơn — dù đã từng
  dùng `--merge` ở lần trước trong cùng phiên, mỗi lần merge lên `main`
  cần operator gõ lại cờ đó, không suy ra từ thói quen.
- `--merge` chỉ merge `develop` → `main`, bằng merge commit
  (`gh pr merge --merge`), không squash/rebase, không bypass branch
  protection, không xoá branch sau merge — đổi bất kỳ điều nào trong 4
  điều này là thay đổi thiết kế, cần hỏi lại operator, không tự quyết.
- KHÔNG gộp nhiều node SEAL không liên quan vào 1 commit nếu chúng không
  cùng nằm trong 1 phiên làm việc liên tục — mỗi `/ship` nên tương ứng
  1 đợt thay đổi đã duyệt, giữ lịch sử git dễ đọc.
- Nếu `git status --short` cho thấy có thay đổi KHÔNG liên quan gì đến
  node vừa SEAL (ví dụ ai đó sửa file khác ngoài phiên này) — dừng, báo
  operator, không tự gộp hay tự bỏ qua.
- Seal gate của `agent-hub/CLAUDE.md` vẫn là luật gốc — `/ship` không
  thay thế nó, chỉ là phím tắt cho đúng chuỗi hành động operator đã đồng
  ý (diff đã hiển thị + node đã SEAL) trong phiên đó.
