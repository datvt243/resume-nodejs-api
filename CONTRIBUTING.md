# Contributing — Branching & Release Workflow

2 tầng: **`staging`** (integration) → **`main`** (production). Áp dụng
từ 2026-08-30.

```
feature/fix/hotfix branch  →  PR  →  staging  →  /release  →  main  →  deploy tự động
      (branch từ staging)      (/ship)                (merge commit + tag)
```

## Quy tắc

1. **Không bao giờ branch từ `main`.** Mọi branch fix/feature/hotfix
   branch ra từ `staging`:
   ```
   git checkout -b <ten-branch> staging
   ```
2. **PR luôn merge về `staging`**, không bao giờ merge thẳng vào `main`.
3. **`main` chỉ nhận code qua bước release chính thức** (`/release` nếu
   dùng Claude Code, hoặc tương đương thủ công — xem "Release process"
   bên dưới) — không PR trực tiếp nào từ branch feature được base vào
   `main`.
4. **Cả `main` và `staging` đều bật GitHub branch protection thật**:
   không ai push thẳng được, kể cả owner/admin (`enforce_admins: true`).
   Mọi thay đổi — kể cả 1 dòng version-bump — đi qua PR.
5. **Cả 2 branch đều gate bằng CI thật** (`required_status_checks`):
   PR không được merge (kể cả bởi owner) nếu `build (20.x)`/`build
   (22.x)` (job `build` trong `.github/workflows/node.js.yml`, chạy
   `npm ci && npm run build && npm test`) chưa xong hoặc fail trên chính
   commit đó. `strict: false` — không bắt buộc branch phải rebase lên
   mới nhất của base trước khi merge, tránh thao tác thủ công không cần
   thiết cho 1 maintainer duy nhất; điều được gate là "commit này có pass
   CI không", không phải "branch có mới nhất không".

## Vì sao `required_approving_review_count = 0`?

Nghe ngược đời cho một branch "protected", nhưng đây là lựa chọn có chủ
đích: repo này hiện chỉ có 1 người duy trì, dùng cả người thật lẫn agent
(Claude Code) để merge PR. GitHub **không cho một tài khoản tự approve
PR của chính mình** — nếu đặt `required_approving_review_count >= 1`,
sẽ không ai (kể cả owner) tự merge được PR của chính mình nữa, khoá
cứng toàn bộ quy trình. Đặt `0` vẫn giữ được phần quan trọng của branch
protection (không ai push thẳng, không force-push, không xoá branch —
mọi thay đổi bắt buộc phải là 1 PR có thể xem lại diff trước khi merge)
mà không tự khoá chân mình. Khi repo có thêm người maintain, đây là giá
trị đầu tiên nên nâng lên `>= 1`.

## Vì sao thêm `required_status_checks` (CI thật) vào branch protection?

Ban đầu (2026-08-30) branch protection KHÔNG gate theo CI check
(`required_status_checks: null`) — lý do lúc đó: `/release` đã tự chạy
`npm run build`/`npm test` cục bộ (trong 1 git worktree cô lập) trước
khi tạo PR lên `main`, nên coi như đã có gate.

Nhưng gate đó chỉ tồn tại trên đường `/release` (`staging → main`).
Đường `/ship --merge` (PR feature/fix → `staging`) **không có gate build
+test nào cả** trước khi merge — chỉ dựa vào việc operator tự nhớ đã
chạy test trước đó trong phiên. Thêm `required_status_checks` (check
`build (20.x)`/`build (22.x)`, đúng job/matrix thật trong
`.github/workflows/node.js.yml`) vào CẢ 2 branch bịt lỗ hổng này: mọi PR
vào `staging` HOẶC `main`, dù qua `/ship`, `/release`, hay merge tay trên
GitHub UI, đều bắt buộc CI thật (chạy trên máy GitHub, không phải máy
local của operator) phải xanh trước khi `gh pr merge` được chấp nhận —
kể cả `enforce_admins: true` nên owner cũng không bypass được.

`strict: false` (không phải `true`): không bắt buộc nhánh đang merge
phải chứa commit mới nhất của base trước khi merge. Vì repo chỉ có 1
maintainer, những PR chồng lấn hiếm khi xảy ra — bật `strict: true` chỉ
thêm thao tác "update branch" thủ công không cần thiết mỗi lần base
nhích lên, mà không mua thêm an toàn tương xứng.

## Release process

Mỗi lần muốn đưa `staging` lên `main` (production):

1. Chạy build + test thật trên `staging` — merge nếu fail là không được
   phép.
2. Merge `staging` → `main` bằng **merge commit thật, không squash**.
3. Bump version (semver, tự động theo Conventional Commits trong các
   commit message), tạo git tag `vX.Y.Z`.
4. Push vào `main` tự kích hoạt deploy (`.github/workflows/deploy.yml`
   → Render, đã cấu hình secret sẵn — không cần thao tác thêm).
5. Sync version-bump ngược lại `staging` để 2 branch không lệch version.
6. Đóng các issue mà release này thực sự đưa lên `main`.

Nếu dùng Claude Code, toàn bộ 6 bước trên chạy qua `/release`.

### Vì sao merge commit thật, không squash, ở bước release?

Squash sẽ gộp toàn bộ commit của `staging` (có thể là hàng chục commit
từ nhiều PR khác nhau) thành 1 commit duy nhất trên `main` — mất hoàn
toàn ranh giới từng thay đổi. Merge commit thật giữ nguyên từng commit
gốc trên `main`, nên `git bisect`/`git blame`/audit sau này vẫn thấy
đúng commit nào làm gì, thay vì một khối "release" không thể chẻ nhỏ.

### Vì sao issue không tự đóng khi PR merge vào `staging`?

GitHub chỉ tự đóng issue (`Closes #N` trong PR body) khi PR đó merge
vào **default branch** của repo — hiện là `main`. PR feature/fix merge
vào `staging` (không phải default branch) sẽ **không** tự đóng issue dù
body có ghi `Closes #N` — issue chỉ thực sự đóng khi PR release
(`staging → main`) merge, mang theo đúng các `Closes #N` cho những issue
đã thực sự lên `main` trong đợt đó.

## Command tương ứng (Claude Code)

| Việc | Command |
|---|---|
| Commit + push branch feature/fix hiện tại | `/ship` |
| Commit + push, rồi tự tạo PR + merge vào `staging` | `/ship --merge` |
| Release `staging` → `main` (build+test gate, bump version, tag, deploy-check, đóng issue) | `/release` |

`/ship` từ chối chạy nếu branch hiện tại là `main`/`staging` (dùng
`/release` thay cho trường hợp đó).
