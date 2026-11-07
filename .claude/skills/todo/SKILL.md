---
name: todo
description: "Resolve/tạo GitHub issue + checkout branch riêng của issue đó, rồi gộp /worker analyst (feature, hoặc bug chưa có feature doc), /worker implementer và /worker verifier thành 1 lệnh gõ cho một task — vẫn chạy 2 lượt tách biệt bên trong, tự lặp lại khi REOPEN. Dùng: /todo \"[task]\"|#[số-issue] [--ship]"
argument-hint: "<task>|#<số-issue> [--ship]"
disable-model-invocation: true
---

# /todo "<task>"|#<số-issue> [--ship]

> Orchestrate lại đúng skill `worker` 2 lần, ở 2 lượt tách biệt. KHÔNG tự
> triển khai lại logic implement/verify riêng — chỉ gọi `/worker` theo
> đúng thứ tự bên dưới.

## Bước 0 — resolve issue + checkout branch (chạy TRƯỚC bất kỳ worker nào)
1. **Resolve issue**:
   - Tham số khớp `^#?\d+$` (issue mode) → `gh issue view <số> --json
     number,title,url`. Không tìm thấy / `gh` chưa đăng nhập → dừng, báo
     lỗi thật, không tự đoán tiếp.
   - Ngược lại (free-text) → `gh issue create --title "<dòng đầu của
     task>" --body "<toàn bộ task>"` để mở issue mới, lấy `<số>`/`<title>`/
     `<url>` thật từ output lệnh. Lỗi (không có `gh`, chưa auth, chưa có
     remote) → dừng, báo lỗi, KHÔNG tự chạy tiếp không có issue.
   - Từ đây `<task>` cho phần còn lại của lượt `/todo` này là title + body
     của issue đã resolve, không chỉ đúng chuỗi CLI gốc.
2. **Tính tên branch**: [sync 2026-10-07] check `doctrine/domains/PROJECT.md`
   first for a documented branch-naming convention — use it exactly if
   present. Otherwise `<số>-<slug>`, `<slug>` = 3 từ đầu của issue title,
   viết thường, ký tự không phải chữ/số gộp thành `-`.
3. **Base branch**: `staging` (theo `doctrine/domains/PROJECT.md` — mô hình
   2 tầng `staging` → `main`, mọi branch fix/feature branch ra từ
   `staging`).
4. **Sync base branch thật**: `git fetch origin`, `git checkout staging`,
   `git pull origin staging` — luôn làm trước khi branch ra, không bao giờ
   branch từ bản local cũ. Lỗi pull/conflict → dừng, báo lỗi thật, không tự
   force/stash/discard.
5. **Checkout branch của issue**: `gh issue develop <số> --list` trước —
   nếu đã có branch liên kết (đang làm tiếp) → checkout branch đó rồi
   `git pull` trên đó luôn, không tạo branch thứ 2 cho cùng issue. Chưa có
   → `gh issue develop <số> --checkout --base staging --name <số>-<slug>`.
   Lỗi git (dirty tree, base ref không tồn tại...) → dừng, báo lỗi thật,
   không tự force/stash/discard.
6. **Báo cáo** issue (`#<số>`, URL) + tên branch trước khi qua Lượt 1 —
   đây là report, KHÔNG phải gate phê duyệt thứ 2 (gate thật duy nhất
   trong toàn chuỗi `/todo` vẫn là push của `/ship`).

## Quy trình
0. **Pass 0 — analyst** (kit 2026-11-06): run `/worker analyst "<task>"`
   (separate subagent) BEFORE pass 1 when:
   - the issue is a feature (label `enhancement`/`feature`, else title
     starts with add/implement/support; unclear → ask) — spec mode; skip when resuming and the issue's doc in
     `agent-hub/doctrine/features/` already exists with no unanswered open
     question;
   - the issue is a bug (label `bug`, else title starts with fix/bug) and
     `agent-hub/doctrine/features/INDEX.md` has no row for the area/issue —
     backfill mode (`"document the feature touched by: <task>"`);
   - anything else → skip.
   `spec_ready`/`no_feature` → continue. `needs_input` → show its
   questions to the operator verbatim, wait, re-run pass 0 with the
   answers — never answer them yourself, never start pass 1 with a
   question open. `blocked` → stop, report.
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
   `evidence/verifier/`. (kit 2026-11-07) Keep the verifier's agent id
   from the Agent tool result — step 3 reuses it.
3. **Verdict = REOPEN** → tự động quay lại Lượt 1 với đúng lý do REOPEN
   trích từ evidence note của subagent verifier. Lặp tối đa **3 lần**. Chạm
   giới hạn → dừng, báo operator tự quyết định, không tự lặp thêm.
   (kit 2026-11-07) Lượt 2 của vòng REOPEN: resume the SAME verifier with
   `SendMessage` to its agent id — "round <N>: re-read `<note path>` from
   disk, re-run `verify_seal` steps 2-12, write a new verdict note + log
   line" — instead of a fresh spawn. It never saw the implementer's
   reasoning, so isolation holds; it skips the bundle reload. Resume fails
   (no id, agent gone, error) → fresh spawn as in step 2 — never verify
   inline. Implementer `failed` with `## Loop guard` → stop, no REOPEN retry.
4. **Verdict = SEAL** → báo kết quả (node, evidence, issue + branch ở Bước
   0) plus one spawn line read back from
   `grep "role=verifier.*node=<slug> " evidence/worker-runs.log`:
   `spawns: verifier <N> (<F> fresh, <R> resumed), REOPEN <k>`. A REOPEN
   round logged `fresh` means step 3's resume fell back — say why. Same
   line on a retry-limit stop.
   - **Không có `--ship`** (mặc định): dừng ở đây. KHÔNG tự
     `commit`/`push` — seal gate trong `CLAUDE.md` vẫn áp dụng cho mọi
     hành động outward-facing trên `src/`, kể cả khi gọi qua `/todo`.
   - **Có `--ship`**: gọi ngay `/ship "<task>"` đúng như skill đó định
     nghĩa — KHÔNG tự triển khai lại logic của `/ship` ở đây. `/ship` vẫn
     chạy TOÀN BỘ hợp đồng của chính nó (guard chặn main/staging, show
     git commands thật, chờ approval, evidence note riêng) — `--ship` chỉ
     bỏ bước gõ `/ship` làm lệnh thứ 2, KHÔNG bỏ qua seal gate của
     `/ship`. Muốn `--merge` (mở PR vào staging) thì gõ `/ship --merge`
     riêng sau, hoặc `/todo "<task>" --ship` rồi tự thêm `--merge` — cờ
     `--ship` ở đây không tự suy ra `--merge`.

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
- `--ship` KHÔNG BAO GIỜ tự chạy khi vòng lặp dừng ở `blocked`/thất bại
  test/chạm giới hạn 3 lần REOPEN — không có SEAL thì không có gì để
  ship.

## Ví dụ
```
/todo "sửa CORS origin '*' theo trap trong doctrine/domains/PROJECT.md"
# Lượt 1 (implementer, phiên chính): pick_next → implement → evidence → sealed_pending_verifier
# Lượt 2 (verifier, subagent độc lập qua Agent tool): đọc evidence → SEAL (hoặc REOPEN kèm lý do cụ thể)
# REOPEN → tự lặp lượt 1 với lý do đó, tối đa 3 lần → nếu vẫn REOPEN, dừng
# SEAL → dừng, báo kết quả, không tự commit
```
