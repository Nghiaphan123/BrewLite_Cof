# BrewLite - Thỏa thuận làm việc

**Trạng thái:** Sản phẩm bàn giao Giai đoạn 1
**Người phụ trách:** H.Tài (Vai trò Scrum Master, Nhiệm vụ 3.0)
**Liên quan:** [Cài đặt](setup.md), [Cấu hình](config.md), [Cấu trúc dự án](project-structure.md), [Product Backlog](requirements/product-backlog.md)

Tài liệu này là hợp đồng quy trình của nhóm. Nó định nghĩa cách chúng ta theo dõi công việc, bằng chứng nào để đóng một nhiệm vụ, cách đặt tên tệp và commit, và điều gì xảy ra khi có sự cố. Mọi quy tắc ở đây đều có thể được thực thi trong quá trình review code. Nếu một quy tắc không đáng để thực thi, nó không nên nằm trong tài liệu này.

> **Thẩm quyền:** bảng tính nhiệm vụ (`BrewLite-DanhSachTask.xlsx`) là công cụ theo dõi. Tài liệu này là hợp đồng về bằng chứng và quy trình mà bảng tính trỏ tới. Khi chúng xung đột, tài liệu này thắng về *quy trình* và bảng tính thắng về *trạng thái*.

## 1. Vai trò

Được phân công tại buổi kickoff (Nhiệm vụ 3.0, 2026-10-22). Biên bản kickoff là `docs/plans/kickoff-2026-10-22.md`.

| Vai trò               | Trách nhiệm                                                                 | Người đảm nhận   |
| --------------------- | --------------------------------------------------------------------------- | ---------------- |
| Product Owner (PO)    | Sở hữu Product Backlog, ưu tiên hóa, nghiệm thu increment tại Sprint Review | **Nghĩa**        |
| Scrum Master (SM)     | Sở hữu quy trình, điều hành các nghi lễ, gỡ chặn, bảo vệ tài liệu này       | **H.Tài**        |
| Nhóm Phát triển       | Xây dựng, kiểm thử, review; cả năm thành viên                               | Tất cả           |
| Reviewer (luân phiên) | Review PR của thành viên có nhiệm vụ đang được merge                        | Ghi theo từng PR |

**PO và SM là hai người khác nhau.** Nghĩa sở hữu Product Backlog và nghiệm thu increment; H.Tài điều hành quy trình và gỡ chặn. Sự tách biệt này giữ cho hai phép kiểm tra độc lập — "đây có phải là thứ đúng không?" (PO) và "chúng ta có đang làm đúng cách không?" (SM) — và khớp với cấu trúc không chính thức của nhóm (Nghĩa là trưởng nhóm, H.Tài là trợ lý; theo `config.md` §8 sheet `Cấu hình`).

**Phương án dự phòng:** nếu PO không có mặt tại Sprint Review, SM nghiệm thu dựa trên tiêu chí chấp nhận bằng văn bản trong `product-backlog.md` §4–§13 và ghi lại trong biên bản retro. Nếu SM không có mặt, PO điều hành nghi lễ. Ghi ở đây để không vai trò nào âm thầm bị bỏ trống.

**Quy tắc:** không ai được tự merge PR của mình. Nếu nhóm chỉ còn một reviewer khả dụng, PR phải chờ. Điều này không thương lượng được — đây là thứ duy nhất làm cho ghi chú bằng chứng `● Xong` có ý nghĩa. Khi tác giả là người duy nhất có thể review ngang hàng, SM (H.Tài) review; khi tác giả là SM, PO (Nghĩa) review.

## 2. Các nghi lễ và giờ làm việc

### 2.1 Khung giờ làm việc

Khung giờ làm việc của nhóm là **09:00–22:00 giờ TP.HCM (Việt Nam)**. Công việc có thể diễn ra bất kỳ lúc nào trong khung đó; không ai bắt buộc phải online vào một thời điểm cụ thể trừ các nghi lễ ở §2.3.

### 2.2 Daily Scrum (bất đồng bộ)

- **Hình thức:** bất đồng bộ, trong kênh của nhóm. Mỗi thành viên đăng ba câu trả lời (đã làm gì, sẽ làm gì, đang bị chặn gì) trước **12:00 ICT** mỗi ngày làm việc.
- **Thời lượng:** luồng thảo luận chỉ đọc trong ngày sau 12:00; SM tóm tắt các điểm chặn trước 13:00.
- **Ai điều hành:** SM (§1). Nếu SM không có mặt, SM chỉ định người thay thế cho ngày đó.
- **Leo thang:** nếu một điểm chặn không thể giải quyết trong luồng thảo luận, SM lên lịch một cuộc gọi đồng bộ trong ngày. Luồng thảo luận không thay thế cho cuộc gọi khi cần gọi.
- **Tại sao bất đồng bộ:** lịch của nhóm không trùng nhau đủ để có một buổi đồng bộ 15 phút đáng tin cậy. Hạn 12:00 giữ cho standup kịp thời mà không cần đồng thời.

### 2.3 Các nghi lễ Sprint (đồng bộ)

| Nghi lễ              | Khi nào                    | Thời lượng | Đầu ra                                                     |
| -------------------- | -------------------------- | ---------- | ---------------------------------------------------------- |
| Sprint Planning      | Đầu mỗi Sprint (Giai đoạn) | 30 phút    | Sprint Backlog, bảng tính được cập nhật                    |
| Sprint Review        | Cuối mỗi Sprint            | 20 phút    | Demo, PO nghiệm thu, backlog được cập nhật                 |
| Sprint Retrospective | Sau Review                 | 20 phút    | Biên bản retro trong `docs/plans/`, một hành động cải tiến |

Nếu một nghi lễ đồng bộ không thể tổ chức (ví dụ: một thành viên không có mặt), nó được lên lịch lại trong vòng 2 ngày làm việc, không chuyển sang bất đồng bộ. Review cần demo; Retro cần thảo luận.

### 2.4 Quy tắc ranh giới Sprint

Một Sprint chỉ kết thúc khi mọi nhiệm vụ trong đó đều `● Xong` với ghi chú bằng chứng, hoặc được PO chuyển rõ ràng sang Sprint tiếp theo kèm lý do được ghi lại. "Gần xong" không phải là trạng thái Sprint.

## 3. Từ vựng trạng thái nhiệm vụ

Cột trạng thái của bảng tính dùng đúng ba giá trị. Hãy sao chép ký tự; không gõ lại.

| Ký tự        | Ý nghĩa                           | Ai đặt       | Khi nào                                  |
| ------------ | --------------------------------- | ------------ | ---------------------------------------- |
| `○ Chưa làm` | Chưa bắt đầu                      | Chủ nhiệm vụ | Trạng thái mặc định                      |
| `◐ Đang làm` | Đang thực hiện                    | Chủ nhiệm vụ | Khi bắt đầu công việc (tạo branch)       |
| `● Xong`     | Xong — đạt DoD, đã ghi bằng chứng | Chủ nhiệm vụ | Chỉ khi ghi chú bằng chứng §4 hoàn chỉnh |

## 4. Ghi chú bằng chứng nhiệm vụ (hợp đồng `● Xong`)

Một nhiệm vụ chỉ là `● Xong` khi dòng của nó có ghi chú bằng chứng đúng định dạng này:

```text
[DoD] PR #<n> | commit <short-sha> | files: <path>, <path> | doc: <path> | demo: <date>
```

**Quy tắc trường:**

| Trường               | Bắt buộc                         | Định dạng                                         | Ghi chú                                                                                                                |
| -------------------- | -------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `PR #<n>`            | có                               | `PR #42`                                          | PR đã merge. PR chưa merge không phải bằng chứng.                                                                      |
| `commit <short-sha>` | có                               | 7–12 ký tự hex                                    | Commit merge hoặc commit cuối trên branch. Phải tồn tại trong `main`.                                                  |
| `files:`             | có                               | đường dẫn tương đối repo, phân tách bằng dấu phẩy | Mọi tệp nhiệm vụ tạo ra hoặc thay đổi mà quan trọng. Không phải mọi tệp trong PR — chỉ những tệp reviewer sẽ kiểm tra. |
| `doc:`               | nếu nhiệm vụ tạo ra tài liệu     | một đường dẫn                                     | Bắt buộc cho mọi nhiệm vụ có tiêu chí chấp nhận đề cập đến tài liệu.                                                   |
| `demo:`              | nếu nhiệm vụ có đầu ra chạy được | `YYYY-MM-DD` hoặc một liên kết                    | Ngày demo được trình bày, hoặc liên kết đến bản ghi.                                                                   |

**Ghi chú nằm ở đâu:** ô `Ghi chú` của bảng tính (cột D) hiện chứa nội dung lập kế hoạch hỗn hợp (đề xuất, độ khó, ước lượng). **Quyết định:** nối ghi chú bằng chứng vào ô đó sau dấu phân cách ` | EVIDENCE: `, ví dụ:

```text
Đề xuất: Nghĩa | Dự phòng: H.Tài | Độ khó: Trung bình | ... | EVIDENCE: [DoD] PR #12 | commit a1b2c3d | files: apps/api/src/modules/products/products.module.ts, apps/api/src/modules/products/products.service.ts | demo: 2026-11-02
```

Điều này giữ nguyên các công thức `COUNTIF` và tránh thêm cột làm dịch chuyển các cột ẩn `G–H` (mà các công thức ngày phụ thuộc vào). **Không** chèn hoặc sắp xếp lại cột trong `Danh sách task` mà không cập nhật mọi công thức tham chiếu `$E`, `$G`, `$H` — đó là thay đổi toàn bảng tính, không phải chỉnh sửa từng nhiệm vụ.

**Ví dụ — Nhiệm vụ 6.0 (đã `● Xong`):**

```text
[DoD] PR #3 | commit 7f2e9a1 | files: CONTRIBUTING.md, .github/PULL_REQUEST_TEMPLATE.md, docs/working-agreement.md | doc: docs/working-agreement.md | demo: 2026-10-21
```

**Ví dụ — Nhiệm vụ 2.0 (khi đóng):**

```text
[DoD] PR #9 | commit 4c1d8f2 | files: docs/requirements/product-backlog.md | doc: docs/requirements/product-backlog.md | demo: 2026-10-28
```

**Việc của reviewer:** trước khi phê duyệt một PR mà nhiệm vụ của nó sẽ được đánh dấu `● Xong`, hãy xác minh ghi chú bằng chứng khớp với PR. Bằng chứng không khớp là bình luận chặn. SM kiểm tra ngẫu nhiên một ghi chú mỗi Sprint tại Review.

## 5. Định nghĩa Hoàn thành (Definition of Done)

Từ PDF bài tập §10. Một nhiệm vụ đạt DoD khi **tất cả** các điều sau đúng:

1. Code build và chạy; tiêu chí chấp nhận của nhiệm vụ được đáp ứng.
2. Có commit trên Git với thông điệp rõ ràng; PR được một thành viên khác (không phải tác giả) review.
3. Đầu vào API được validate; UI xử lý trạng thái loading và lỗi.
4. README (hoặc tài liệu liên quan) giải thích cách chạy/sử dụng thứ đã xây dựng.

Ghi chú bằng chứng §4 của tài liệu này là cách DoD được *chứng minh*. Một nhiệm vụ có thể đạt DoD và vẫn trượt review nếu ghi chú bằng chứng không chứng minh được điều đó.

## 6. Quy ước đặt tên

Mọi tên tệp đều là `kebab-case`. Không dấu cách, không dấu tiếng Việt, không viết hoa lẫn, không `final`, `v2`, `new`, `copy`, `(1)`.

| Sản phẩm                   | Mẫu                                                                       | Ví dụ                                                 |
| -------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Tệp tính năng API          | `apps/api/src/modules/<feature>/<feature>.{module,controller,service}.ts` | `apps/api/src/modules/products/products.service.ts`   |
| DTO API                    | `.../dto/<verb>-<noun>.dto.ts`                                            | `apps/api/src/modules/orders/dto/create-order.dto.ts` |
| Unit test API              | `*.spec.ts` đặt cùng chỗ                                                  | `products.service.spec.ts`                            |
| E2e test API               | `apps/api/test/*.e2e-spec.ts`                                             | `orders.e2e-spec.ts`                                  |
| Tệp tính năng Web          | `apps/web/src/features/<feature>/...`                                     | `apps/web/src/features/cart/cart-store.ts`            |
| Route Web                  | chỉ dưới `apps/web/src/app/`                                              | `apps/web/src/app/checkout/page.tsx`                  |
| Component Web (dùng chung) | `apps/web/src/components/<name>.tsx`                                      | `product-card.tsx`                                    |
| Tài liệu                   | `docs/<area>/<topic>.md`                                                  | `docs/requirements/scenarios.md`                      |
| ADR                        | `docs/architecture/adr/NNNN-slug.md`                                      | `0004-payment-mock-method.md`                         |
| Biểu đồ (nguồn)            | `docs/diagrams/<type>/<type>-<topic>-v<n>.mmd`                            | `erd-core-v1.mmd`                                     |
| Biểu đồ (xuất)             | cùng stem, `.svg` / `.png`                                                | `wf-menu-v2.png`                                      |
| Test Playwright            | `tests/e2e/<journey>.spec.ts`                                             | `checkout-journey.spec.ts`                            |

**Tên branch:** `feat/<task-stt>-<slug>`, `fix/<task-stt>-<slug>`, `docs/<slug>`, `chore/<slug>`. Ví dụ: `feat/15-products-api`, `fix/26-auth-login-email-dup`, `docs/setup-config`.

**Tệp môi trường:** `.env` và `.env.local` không bao giờ được commit. `.env.example` thì có. Xem [Cấu hình §2.3](config.md).

## 7. Quy ước commit và PR

### 7.1 Thông điệp commit

Định dạng: `<type>(<scope>): <summary> (Task <stt>)`

| Trường       | Giá trị cho phép                                                       |
| ------------ | ---------------------------------------------------------------------- |
| `type`       | `feat`, `fix`, `docs`, `test`, `refactor`, `chore`                     |
| `scope`      | module hoặc khu vực — `api`, `web`, `orders`, `auth`, `docs`, `config` |
| `summary`    | thức mệnh lệnh, ≤ 72 ký tự, không dấu chấm cuối                        |
| `Task <stt>` | STT trong bảng tính, hoặc `Task 0` cho công việc xuyên suốt            |

Ví dụ:
- `feat(api): products module (Task 2.0)`
- `feat(web): menu grid with loading state (Task 3.0)`
- `test(api): idempotent payment integration (Task 52.0)`
- `docs: setup and config guides (Task 12.0)`
- `chore: bump prisma to 6.x (Task 0)`

**Thân:** bắt buộc khi thay đổi không tự giải thích. Giải thích *tại sao*, không phải *cái gì* (diff cho thấy *cái gì*). Tham chiếu số ADR nếu commit thực hiện một quyết định.

**Trailer:** thêm `Refs: Task <stt>` trên dòng riêng ở cuối khi nhiệm vụ trải qua nhiều commit. Đây là cách tìm mọi commit cho một nhiệm vụ.

### 7.2 Pull request

Mọi PR dùng template của repository (được tạo trong Nhiệm vụ 6.0). Checklist phản ánh DoD §5:

```markdown
## Task
Task <stt> — <task name>

## What
<one paragraph>

## How to verify
<commands / steps>

## DoD checklist
- [ ] Builds and runs
- [ ] Acceptance criteria met
- [ ] Reviewed by a teammate (not the author)
- [ ] API input validated / UI loading + error states handled (if applicable)
- [ ] README or doc updated (if applicable)
- [ ] Evidence note ready for the spreadsheet (§4)

## Screenshots / recordings
<if UI change>
```

**Kích thước PR:** nhắm ≤ 400 dòng thay đổi không tính lockfile và code sinh tự động. PR lớn hơn cần lý do trong mô tả hoặc bị tách. Đây là hướng dẫn, không phải cổng chặn — reviewer thực thi nó.

**SLA review:** reviewer phản hồi trong vòng một ngày làm việc. Nếu không thể, họ nói ra và tác giả tìm reviewer khác. PR để không review trong hai ngày làm việc là điểm chặn nêu tại standup.

**Merge:** squash-merge vào `main`, xóa branch. Tiêu đề commit squashed theo §7.1. SHA commit merge là thứ được ghi trong ghi chú bằng chứng.

## 8. Cơ chế bảng tính

Bảng tính là công cụ làm việc với công thức sống. Ba quy tắc giữ cho nó không bị hỏng:

1. **Không chèn hoặc sắp xếp lại cột** trong `Danh sách task` hoặc `Giờ làm mỗi ngày`. Các cột ẩn `G–H` và công thức `WORKDAY`/`SUMIF` tham chiếu phạm vi cố định. Chèn cột sẽ dịch chuyển mọi phạm vi và âm thầm làm hỏng phép đếm tiến độ.
2. **Không sửa các dòng công thức.** Các dòng bắt đầu bằng `="Phase …"` và `="Tiến độ chung: …"` là được tính toán. Sửa các dòng dữ liệu, không sửa phần đầu.
3. **Ký tự trạng thái được sao chép, không gõ** (§3). Công thức tiến độ khớp trên chuỗi chính xác.

**Nếu bạn phải thay đổi ngày bắt đầu** (`Cấu hình!B3`): mọi ngày dẫn xuất từ `WORKDAY` tự động tính lại, nhưng các ngày được gõ tay trong cột `Ngày` của `Danh sách task` (ví dụ `2026-10-21 20:26:03.922000` trên Nhiệm vụ 6.0) được tính một lần và **không** tính lại. Hãy tính lại chúng hoặc hai sheet sẽ không khớp. Xem [Cấu hình §5](config.md).

**Sao lưu:** trước bất kỳ chỉnh sửa cấu trúc nào của bảng tính, commit một bản sao vào `docs/plans/` (ví dụ `backlog-2026-10-26.xlsx`). Lịch sử Git là cơ chế phục hồi.

## 9. Checklist review (reviewer thực sự kiểm tra gì)

Theo thứ tự, dừng ở lỗi đầu tiên:

1. **Liên kết nhiệm vụ:** tiêu đề và mô tả PR tham chiếu đúng STT; bản nháp ghi chú bằng chứng khớp với PR.
2. **Phạm vi:** PR làm đúng những gì nhiệm vụ nói và không hơn. Refactor nhân tiện là PR riêng.
3. **DoD §5:** build, tiêu chí chấp nhận, validate/trạng thái, tài liệu.
4. **Đặt tên §6:** tệp, branch, commit theo mẫu.
5. **Không có bí mật:** không `.env`, không token, không `JWT_SECRET` thật trong diff.
6. **Không chỉnh sửa cấu trúc bảng tính:** chèn cột, sửa công thức, gõ lại ký tự.
7. **Test:** hành vi mới có test; bộ test liên quan pass trong CI (khi CI tồn tại — Giai đoạn 2+).

Reviewer để lại bình luận cho từng lỗi, không phải "cần làm lại" chung chung. Tác giả giải quyết và yêu cầu review lại; reviewer không review lại từ đầu.

## 10. Điểm chặn và leo thang

Điểm chặn là bất cứ thứ gì ngăn một nhiệm vụ đạt `● Xong` trong vòng ước lượng + 25% (quy tắc 2 của bảng tính). Khi điểm chặn xuất hiện:

1. Nêu tại Daily Scrum tiếp theo (hoặc ngay lập tức trong kênh nhóm nếu nghiêm trọng).
2. SM ghi lại: cái gì, ai, từ khi nào, cần gì để gỡ chặn.
3. Nếu không giải quyết trong một ngày làm việc, SM leo thang lên PO, người có thể chuyển nhiệm vụ cho thành viên `Dự phòng` (backup) được nêu trong bảng tính.
4. Nếu nhiệm vụ được chuyển giao, ghi chú bằng chứng ghi lại cả chủ cũ và chủ mới, cùng lý do.

**Không âm thầm chuyển giao.** Cột `Người làm` của bảng tính và ghi chú bằng chứng phải khớp nhau.

## 11. Nhật ký thay đổi của tài liệu này

Thay đổi tài liệu này ảnh hưởng đến tất cả mọi người. Mỗi thay đổi có một dòng ở đây và một mục trong mô tả PR.

| Ngày         | Thay đổi      | Tác giả | ADR / PR |
| ------------ | ------------- | ------- | -------- |
| *2026-10-22* | Phiên bản đầu | H.Tài   | —        |

## 12. Ghi Chú

| Mục                                                    | Người phụ trách | Đóng khi                                                       |
| ------------------------------------------------------ | --------------- | -------------------------------------------------------------- |
| Phê chuẩn phân công vai trò (PO, SM)                   | H.Tài           | Nhiệm vụ 3.0 `● Xong`                                          |
| Tạo tệp PR template `.github/PULL_REQUEST_TEMPLATE.md` | Nghĩa           | Ghi chú bằng chứng Nhiệm vụ 6.0 được cập nhật để tham chiếu nó |
| Quyết định nhà cung cấp CI (giả định GitHub Actions)   | H.Tài           | Workflow đầu tiên trong `.github/workflows/`                   |
| Vị trí biên bản retro (`docs/plans/retro-<sprint>.md`) | H.Tài           | Sprint Review đầu tiên                                         |
