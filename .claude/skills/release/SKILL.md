---
name: release
description: "Merge staging → main bằng merge commit thật (không squash), chạy build+test thật trước khi merge, tự bump version (Conventional Commits), tạo git tag vX.Y.Z, đóng các issue được release, sync version ngược lại staging. Dùng: /release"
argument-hint: ""
---

Base directory for this skill: `.claude/skills/release`

# /release

> Đây là hành động outward-facing nặng nhất trong repo: đưa code lên
> `main` (branch production, có GitHub Action tự deploy Render khi có
> push). Operator gõ `/release` chính là go-ahead cho toàn bộ chuỗi bên
> dưới — không dừng hỏi lại giữa chừng — nhưng KHÔNG bỏ qua bất kỳ bước
> gate nào (build+test fail → dừng thật, không merge).

## Bối cảnh (đọc trước, đừng đoán lại mỗi lần)
- Model 2 tầng: `staging` (integration, mọi PR feature/fix/hotfix merge
  vào đây) → `main` (production, chỉ nhận code qua `/release`).
- Cả `main` và `staging` đều bật GitHub branch protection thật
  (`enforce_admins: true`, `required_approving_review_count: 0` — 0 vì
  GitHub không cho tự approve PR của chính mình, để ≥1 sẽ tự khoá luôn
  khả năng agent/CLI tự merge; `allow_force_pushes/deletions: false`;
  `required_status_checks: { strict: false, checks: ["build (20.x)",
  "build (22.x)"] }` — tên check thật lấy từ `.github/workflows/node.js.yml`
  (job `build`, matrix Node 20.x/22.x), gắn từ khi thêm real CI gate vào
  branch protection. `strict: false` — không bắt buộc branch phải
  up-to-date với `main`/`staging` trước khi merge, tránh phát sinh thao
  tác rebase/update-branch thủ công cho một maintainer duy nhất; cái cần
  gate là "CI có pass trên chính commit này không", không phải "branch
  có mới nhất không"). Đây là gate BỔ SUNG cho gate cục bộ ở bước 3 dưới
  đây (worktree cô lập) — không thay thế nó: bước 2 bắt lỗi sớm trước cả
  khi tạo PR, còn `required_status_checks` là lưới an toàn thật trên
  GitHub, quan trọng nhất cho đường `/ship --merge` (merge vào `staging`)
  vốn trước đây không có gate build+test nào cả trước khi merge. Nghĩa
  là **không ai push thẳng được vào 2 branch này, kể cả owner** — mọi
  thay đổi phải qua PR, kể cả version-bump commit của chính `/release`.
- Default branch trên GitHub là `main` (đổi từ `develop` khi dựng
  workflow này) — để "Closes #n" trong PR body tự đóng issue thật khi PR
  merge vào `main` (GitHub chỉ auto-close khi merge vào default branch).
- Deploy: `.github/workflows/deploy.yml` đã tự chạy khi có push vào
  `main` (Render, dùng secret `RENDER_SRV`/`RENDER_KEY` đã set thật).
  `/release` KHÔNG gọi thêm deploy hook nào khác — chỉ báo link Action.
- Version scheme: semver, tag `vX.Y.Z`, bump tự động theo Conventional
  Commits trên các commit nằm trong khoảng `origin/main..origin/staging`:
  có `feat` → minor; có `BREAKING CHANGE`/`!:` sau type → major; chỉ có
  `fix`/`chore`/`docs`/`refactor`/`perf`/`test`/`style`/`build`/`ci` →
  patch. Ưu tiên major > minor > patch nếu commit range có nhiều loại.
- Lệnh build/test THẬT (copy từ `agent-hub/doctrine/MEMORY.md`, không tự
  đoán): `npm run build`, `npm test`, chạy từ repo root. Không có lint
  script thật (`package.json` không có `"lint"` dù `.eslintrc.cjs` tồn
  tại) — bước gate SKIP lint, báo rõ "lint: chưa cấu hình, bỏ qua",
  không tự bịa lệnh, không fail vì thiếu.

## 13 bước, đúng thứ tự

1. **Fetch thật**: `git fetch origin main staging --tags --quiet`. Toàn
   bộ bước sau đọc từ `origin/main`/`origin/staging`, không dùng local
   branch có thể cũ.

2. **Có gì để release không?**
   `git log origin/main..origin/staging --oneline`. Rỗng → dừng, báo
   "staging không có gì mới so với main, không release." Không tạo PR
   rỗng.

3. **Gate build+test thật, cô lập bằng git worktree** (không đụng working
   tree hiện tại của operator):
   ```
   git worktree add /tmp/release-gate-check origin/staging --detach
   cd /tmp/release-gate-check && npm ci && npm run build && npm test
   ```
   Đọc verbatim output. **Fail bất kỳ lệnh nào → DỪNG NGAY, không tạo
   branch/PR/tag nào cả**, báo lỗi thật, dọn worktree
   (`git worktree remove --force /tmp/release-gate-check`) rồi thoát.
   Lint: không có script thật, báo "lint: chưa cấu hình, bỏ qua" — không
   fail vì việc này. Pass hết → dọn worktree, tiếp tục.

4. **Xác định version mới**:
   - `git tag -l 'v*' --sort=-v:refname | head -1` lấy tag mới nhất.
   - **Không có tag nào** (lần release đầu tiên) → dùng thẳng
     `version` hiện tại trong `package.json` ở `origin/staging`, KHÔNG
     bump, KHÔNG tạo commit bump (nhảy sang bước 6, bỏ qua bước 5).
   - **Có tag** → đọc `git log origin/main..origin/staging --format=%s`
     (ĐÚNG range là `main..staging`, KHÔNG phải `<tag>..staging` — tag
     cũ có thể lùi xa hơn nhiều so với `main` hiện tại nếu từng có commit
     merge thẳng vào `main` mà không tag lại, dùng sai range sẽ đếm nhầm
     hàng loạt commit đã release từ trước). Phân loại theo Conventional
     Commits (xem Bối cảnh), tính version mới bằng semver bump đúng
     loại. Không tự đoán nếu message không theo chuẩn
     `type(scope): ...`/`type: ...` — coi là `patch` mặc định (an toàn
     hơn major/minor sai).

5. **Tạo nhánh release + version-bump commit** (bỏ qua nếu bước 4 rơi
   vào case "lần đầu"):
   ```
   git checkout -b release/vX.Y.Z origin/staging
   ```
   Sửa `version` trong `package.json` VÀ `package-lock.json` (2 chỗ:
   field `version` gốc + field `version` trong object package gốc
   `""` nếu có) thành `X.Y.Z`. Commit:
   `chore(release): bump version to vX.Y.Z`. Push:
   `git push -u origin release/vX.Y.Z`.

6. **Thu thập issue sẽ đóng**: `gh pr list --base staging --state merged
   --json number,body,mergedAt` lấy các PR merge vào `staging` SAU thời
   điểm tag gần nhất (`git log -1 --format=%aI <tag>` nếu có tag, không
   có tag thì lấy hết). Regex trên `body` mỗi PR:
   `/\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\s+#(\d+)/gi` (case-
   insensitive), gom danh sách số issue, loại trùng. Không tự suy luận
   issue từ text mô tả không có từ khoá đóng (vd "liên quan #72" không
   tính) — chỉ lấy đúng pattern đóng issue.

7. **Tạo PR lên `main`**:
   - Head: `release/vX.Y.Z` nếu bước 5 chạy, hoặc thẳng `staging` nếu
     case "lần đầu" (bước 4).
   - Base: `main`.
   - Title: `release: vX.Y.Z`.
   - Body: liệt kê `git log origin/main..HEAD --oneline` (danh sách
     commit thật sẽ lên main) + 1 dòng `Closes #N.` cho MỖI issue thu
     thập ở bước 6 (để GitHub tự đóng khi merge vào default branch
     `main`). Không tự bịa thêm mô tả ngoài 2 phần này.
   - Check trước có PR mở trùng head/base chưa (`gh pr list --base main
     --head <head> --state open`) — có thì dùng lại, không tạo trùng.

8. **Chờ CI thật xong trước khi merge**: `gh pr checks <số PR> --watch
   --required`. Poll tới khi `build (20.x)`/`build (22.x)` xong, thoát
   khác 0 nếu fail. Đây là lưới an toàn THỨ HAI, sau gate cục bộ ở bước 3
   — bình thường sẽ pass ngay vì bước 3 đã build+test đúng commit này
   rồi, nhưng vẫn chờ thật thay vì giả định GitHub Actions chắc chắn
   xanh. Fail → DỪNG, không merge, báo log CI thật
   (`gh run view <run-id> --log-failed`).

9. **Merge PR bằng merge commit thật, không squash**:
   `gh pr merge <số PR> --merge`. Lý do merge thường thay vì squash:
   giữ nguyên lịch sử từng commit trên `staging` khi lên `main` (mỗi
   node/feature vẫn có commit riêng, dễ `git bisect`/audit sau này thay
   vì gộp thành 1 commit lớn mất chi tiết). KHÔNG `--admin`/bypass nếu
   bị chặn thật (CI fail, review thiếu...) — báo lỗi `gh` thật, dừng.

10. **Tag đúng merge commit vừa tạo**:
    ```
    git fetch origin main --quiet
    git tag -a vX.Y.Z origin/main -m "Release vX.Y.Z"
    git push origin vX.Y.Z
    ```
    (Version = version mới ở bước 4, kể cả case "lần đầu" dùng version
    hiện có trong `package.json`.)

11. **Deploy — không tự gọi gì thêm**: `main` vừa nhận push từ merge ở
    bước 9 → `.github/workflows/deploy.yml` tự kích hoạt (Render). Báo
    link theo dõi: `gh run list --branch main --workflow deploy.yml
    --limit 1` lấy run mới nhất, in URL.

12. **Sync version-bump ngược lại `staging`** (bỏ qua nếu bước 5 không
    chạy — case "lần đầu" không có gì để sync vì `staging` vốn đã là
    nguồn):
    - Check PR mở trùng chưa: `gh pr list --base staging --head
      release/vX.Y.Z --state open`.
    - Chưa có: `gh pr create --base staging --head release/vX.Y.Z
      --title "chore(release): sync vX.Y.Z version bump back to staging"
      --body "..."`.
    - `staging` cũng có `required_status_checks` — chờ CI xong trước khi
      merge: `gh pr checks <số PR> --watch --required`, fail thì dừng
      (cùng logic bước 8, không merge PR có CI đỏ dù chỉ là bump version).
    - Merge bằng merge commit: `gh pr merge <số PR> --merge` (nhánh này
      chỉ có đúng 1 commit bump, method nào cũng tương đương nhưng giữ
      merge commit cho nhất quán với bước 9).

13. **Dọn nhánh release tạm** (chỉ nhánh `release/vX.Y.Z`, KHÔNG đụng
    `staging`/`main`): sau khi CẢ 2 PR ở bước 9 và 12 đã merge xong,
    `git push origin --delete release/vX.Y.Z` + `git branch -D
    release/vX.Y.Z` (local, nếu có).

14. **Verify + đóng issue còn sót + báo cáo cuối**:
    - Với mỗi issue thu thập ở bước 6: `gh issue view <N> --json state`.
      Vẫn `OPEN` (auto-close không fire, ví dụ do PR không phải PR đầu
      tiên tham chiếu issue đó) → `gh issue close <N> --comment
      "Released in vX.Y.Z"` như lưới an toàn thủ công.
    - Báo cáo đúng format:
      ```
      🏷️  Release: vX.Y.Z (<bump-type: first-release|patch|minor|major>)
      🔀 PR main: <url> (#<số>) — merge commit <sha ngắn>
      🔀 PR staging sync: <url> (#<số>) — hoặc "n/a (lần đầu)"
      🚀 Deploy: <url gh run> (tự kích hoạt qua deploy.yml)
      ✅ Issues closed: #a (auto), #b (manual fallback), ... — hoặc "none"
      🧪 Gate: npm run build clean, npm test <X passed>/<X total>, lint skip (chưa cấu hình)
      ```

## Ràng buộc cứng
- KHÔNG bao giờ push thẳng vào `main`/`staging` — mọi thay đổi (kể cả
  version-bump commit của chính `/release`) đi qua PR + `gh pr merge`,
  đúng như branch protection đã bật thật.
- KHÔNG merge nếu bước 3 (gate build+test cục bộ) HOẶC bước 8/12 (CI
  thật trên GitHub, `required_status_checks`) fail — không có ngoại lệ,
  không "merge trước sửa sau", không dùng `--admin` để bypass check đỏ.
- KHÔNG squash/rebase ở bước 9 — bắt buộc merge commit thật để giữ lịch
  sử `staging` trên `main`.
- KHÔNG tự gọi thêm deploy hook nào ngoài GitHub Action có sẵn — tránh
  deploy 2 lần cho cùng 1 commit lên Render.
- KHÔNG tự suy luận issue để đóng nếu PR body không có từ khoá đóng
  chuẩn (`closes`/`fixes`/`resolves` + `#N`) — thiếu thì báo "không tìm
  thấy issue liên kết", không tự bịa số issue.
- Nếu bước 4 phân loại bump sai loại do commit message không theo chuẩn
  → mặc định `patch` (an toàn), không đoán major/minor.
- `/release` chỉ chạy khi operator gõ `/release` — không tự kích hoạt
  lặp lại, không tự chạy nền định kỳ.
