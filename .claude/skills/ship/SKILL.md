---
name: ship
description: "Gộp bước 'git add đúng file thuộc diff đã duyệt → commit → push' thành 1 lệnh cho branch feature/fix hiện tại. Thêm --merge để tự tạo PR <branch>→staging và tự merge. Chặn chạy trực tiếp trên main/staging (2 branch đó đã protected — dùng /release để lên main). Dùng: /ship [--merge]"
argument-hint: "[--merge]"
---

Base directory for this skill: `.claude/skills/ship`

# /ship [--merge]

> Không phải một pass tự-duyệt mới — `/ship` chỉ đóng gói bước git cho
> đúng diff đã được hiển thị + đã SEAL trong phiên hiện tại. Seal gate
> (`agent-hub/CLAUDE.md`) coi việc operator gõ `/ship` là hành động phê
> duyệt cho lần chạy đó — không dùng để tự động hoá lặp lại mà không có
> operator gõ lệnh mỗi lần. Cờ `--merge` là một hành động outward-facing
> RIÊNG, nặng hơn commit+push thường (đưa code vào `staging`) — operator
> gõ `--merge` chính là phê duyệt CHO RIÊNG hành động đó, không suy ra từ
> việc đã phê duyệt diff trước đó.
>
> **Model 2 tầng**: mọi branch fix/feature/hotfix branch ra từ `staging`,
> PR merge VỀ `staging` — đây là việc của `/ship`. `staging → main` là
> việc RIÊNG của `/release` (merge commit, bump version, tag, đóng
> issue), không phải `/ship`. Cả `main` và `staging` đều bật GitHub
> branch protection thật (không ai push thẳng được, kể cả owner), kèm
> `required_status_checks` thật (`build (20.x)`, `build (22.x)` — CI
> Node.js CI, `strict: false`) — từ nay `gh pr merge` vào `staging` sẽ tự
> bị GitHub chặn nếu CI chưa xong/fail, không chỉ dựa vào việc operator
> tự nhớ chờ.

## Bước 0 — guard chặn trước khi làm bất kỳ gì

`git branch --show-current`. Nếu kết quả là `main` hoặc `staging` →
**DỪNG NGAY, không chạy bước nào khác**, báo:
```
⛔ /ship không chạy trên `<branch>` — branch này đã protected (không push
   thẳng được) và không phải nơi /ship thao tác.
   - Muốn đưa code vào staging: checkout 1 branch feature/fix mới từ
     staging (`git checkout -b <tên> staging`), làm việc ở đó, /ship từ
     branch đó.
   - Muốn đưa staging lên main (release thật): dùng /release, không phải
     /ship.
```
Chỉ tiếp tục bước 1 khi branch hiện tại KHÁC `main` và `staging`.

## 6 bước, đúng thứ tự (sau khi qua guard ở Bước 0)

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
   (`git branch --show-current`, đã xác nhận khác `main`/`staging` ở
   Bước 0). Lần đầu push branch mới thì thêm `-u`.

6. **Nếu KHÔNG có `--merge`** → báo cáo đúng 3 dòng rồi dừng:
   ```
   📦 Commit: <hash> — <tiêu đề dòng đầu>
   🚀 Push: <old>..<new> → <remote>/<branch>
   🧹 Bỏ qua (nếu có): <file> — <lý do>
   ```

## Nếu có `--merge`: bước 7-10 (chỉ chạy sau khi bước 1-5 xong, chỉ áp dụng chiều `<branch-hiện-tại>` → `staging`)

7. **Điều kiện chặn trước khi làm bất kỳ gì thêm** — dừng và báo operator,
   không tự đoán/tự work around, nếu:
   - `git log origin/staging..<branch-hiện-tại> --oneline` rỗng — không
     có gì để merge, không tạo PR rỗng.
   - `gh` chưa đăng nhập / không có quyền trên repo — báo lỗi thật từ
     `gh`, không tự bịa trạng thái.
   (Không cần check branch hiện tại nữa — Bước 0 đã đảm bảo nó khác
   `main`/`staging` rồi.)

8. **Tạo hoặc tái dùng PR `<branch-hiện-tại>` → `staging`**:
   - Check trước: `gh pr list --base staging --head <branch-hiện-tại>
     --state open`. Nếu đã có PR mở, dùng lại PR đó (không tạo trùng).
   - Nếu chưa có: `gh pr create --base staging --head <branch-hiện-tại>
     --title "<tiêu đề>" --body "<mô tả>"`. Title lấy từ dòng đầu commit
     message ở bước 3. Body liệt kê `git log origin/staging..HEAD
     --oneline` (danh sách commit thật sẽ vào staging) — không tự bịa.
     Nếu commit/PR này thực sự đóng 1 issue, thêm dòng `Closes #N.` (chỉ
     khi chắc chắn, không đoán số issue) — lưu ý: merge vào `staging`
     KHÔNG tự đóng issue (không phải default branch), dòng `Closes #N`
     ở đây chỉ để tham chiếu, việc đóng issue thật xảy ra ở `/release`
     khi PR release lên `main`.

9. **Chờ CI thật xong trước khi merge** (từ khi `staging` có
   `required_status_checks` — xem `CONTRIBUTING.md`): `gh pr checks
   <số PR> --watch --required`. Lệnh này tự poll tới khi 2 check
   `build (20.x)`/`build (22.x)` xong, thoát khác 0 nếu có check fail.
   Fail → DỪNG, báo lỗi/log CI thật (`gh run view <run-id> --log-failed`
   nếu cần chi tiết), không merge, không tự sửa code để "cho qua" CI —
   đó là việc của một `/ship` lần sau sau khi fix.

10. **Merge PR bằng merge commit**: `gh pr merge <số PR> --merge`.
    - KHÔNG dùng `--admin`/bypass branch protection để ép merge khi bị
      chặn (review bắt buộc, check CI fail...) — báo lỗi thật từ `gh`,
      dừng, để operator tự quyết định (tự duyệt PR trên GitHub, hoặc chờ
      CI).
    - Sau khi merge xong, branch feature/fix đã hoàn thành vòng đời — có
      thể xoá (`gh pr merge --merge --delete-branch` HOẶC xoá thủ công
      sau) vì đây là branch dùng 1 lần cho 1 task, khác `develop` cũ.
    - Nếu merge thành công, thêm 2 dòng vào báo cáo bước 6:
      ```
      🔀 PR: <url PR> (#<số>)
      ✅ Merged: <merge commit sha ngắn> → staging
      ```
    - Nếu bị chặn không merge được (chưa CI xong, cần review...), báo rõ
      lý do `gh` trả về, dừng ở đó — PR vẫn ở trạng thái mở, không coi là
      lỗi của `/ship`, chỉ là "chưa merge được, PR đang chờ: <url>".

## Ràng buộc cứng
- KHÔNG tự chạy `/ship` thay cho operator — chỉ chạy khi operator gõ
  `/ship` (hoặc yêu cầu tương đương rõ ràng như "ship nó", "commit và
  push") trong lượt hiện tại.
- KHÔNG bao giờ chạy trên `main`/`staging` — Bước 0 chặn trước, không có
  ngoại lệ, kể cả khi operator quên đang đứng ở branch nào.
- KHÔNG tự thêm `--merge` khi operator chỉ gõ `/ship` trơn — dù đã từng
  dùng `--merge` ở lần trước trong cùng phiên, mỗi lần merge vào
  `staging` cần operator gõ lại cờ đó, không suy ra từ thói quen.
- `--merge` chỉ merge `<branch-hiện-tại>` → `staging`, bằng merge commit
  (`gh pr merge --merge`), không squash/rebase, không bypass branch
  protection — đổi điều này là thay đổi thiết kế, cần hỏi lại operator.
- KHÔNG bao giờ tự chạy phần việc của `/release` (merge `staging` →
  `main`, bump version, tạo tag) — 2 command tách biệt, không gộp.
- KHÔNG gộp nhiều node SEAL không liên quan vào 1 commit nếu chúng không
  cùng nằm trong 1 phiên làm việc liên tục — mỗi `/ship` nên tương ứng
  1 đợt thay đổi đã duyệt, giữ lịch sử git dễ đọc.
- Nếu `git status --short` cho thấy có thay đổi KHÔNG liên quan gì đến
  node vừa SEAL (ví dụ ai đó sửa file khác ngoài phiên này) — dừng, báo
  operator, không tự gộp hay tự bỏ qua.
- Seal gate của `agent-hub/CLAUDE.md` vẫn là luật gốc — `/ship` không
  thay thế nó, chỉ là phím tắt cho đúng chuỗi hành động operator đã đồng
  ý (diff đã hiển thị + node đã SEAL) trong phiên đó.
