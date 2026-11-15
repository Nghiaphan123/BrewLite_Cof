# BrewLite - Sprint Retrospective (Sprint 2: Giỏ hàng, đặt đơn và đăng nhập)

**Trạng thái:** biên bản **lập bổ sung** ngày 10/11/2026. File task ghi buổi "Sprint 2 Review & Retrospective" (#34) xong ngày 30/10, nhưng repo chưa có biên bản. Phần dữ kiện lấy từ file danh sách task và lịch sử Git; nhóm điền ý kiến trong buổi họp.  
**Người điều phối:** H.Tài (Scrum Master)  
**Thành viên tham dự:** ☐ H.Tài ☐ Nghĩa ☐ Luân ☐ P.Tài ☐ Bảo Trí  
**Liên quan:** [Kế hoạch Sprint](../diagrams/sprint-plan.md), [Product backlog](../requirements/product-backlog.md), Retro [Sprint 1](retro-sprint-1.md), [Sprint 3](retro-sprint-3.md)

## 1. Kết quả Sprint 2

**Sprint Goal:** Giỏ hàng, đặt đơn và đăng nhập (Task 5, 6, 7; 18 story points).

| Task | Nội dung                         | Người làm (theo file task)        | Ngày xong (theo file task) | Bằng chứng |
| ---- | -------------------------------- | --------------------------------- | -------------------------- | ---------- |
| 5    | Giỏ hàng Zustand, trang giỏ, tổng tiền, badge | Luân, Nghĩa, Bảo Trí | 27/10 | `store/cart.store.ts`, `app/cart/page.tsx` |
| 6    | `POST /orders` (class-validator, `PENDING`, mã đơn), schema, unit test | H.Tài, Nghĩa, Luân | 23/10–30/10 | `modules/orders/`, `test/orders-read.e2e-spec.ts` |
| 7    | Đăng ký / đăng nhập (bcrypt, JWT), guard tự viết, trang đăng nhập, unit test | H.Tài, Nghĩa, Bảo Trí, Luân | 24/10–28/10 | `modules/auth/`, `jwt-auth.guard.ts`, `test/auth.e2e-spec.ts` |
| —    | Tích hợp giỏ hàng gửi `POST /orders` kèm JWT, test thủ công, review | Luân, Nghĩa, Bảo Trí; Cả nhóm | 29/10 | |
| —    | Sprint Review và Retro           | H.Tài, Nghĩa                      | 30/10                      | Chưa có biên bản trong repo |

**Pull Request trong giai đoạn:** #6, #7 (merge 28/10), đều 0 lượt review.

## 2. Điều làm tốt

### Dữ kiện

- Đăng nhập bằng JWT và guard tự viết, không phụ thuộc thư viện ngoài; mật khẩu băm bằng bcrypt.
- Server tự tính lại giá khi tạo đơn, client không sửa được giá.
- Sau sprint, nhóm bổ sung đồng bộ giỏ hàng với server (`GET/PUT /cart`, commit `9fdf4ec`, 02/11), giúp giữ giỏ khi đổi máy.

### Ý kiến thành viên

| Thành viên | Điều làm tốt |
| ---------- | ------------ |
| H.Tài      |              |
| Nghĩa      |              |
| Luân       |              |
| P.Tài      |              |
| Bảo Trí    |              |

## 3. Điều cần cải thiện

### Dữ kiện

- **Không có biên bản Review và Retro lúc kết thúc sprint**, dù file task ghi đã xong.
- **PR không được review** (#6, #7); nhiều thay đổi khác được push thẳng vào `main`.
- **Lỗi của sprint này được phát hiện muộn:**
  - Ô "Họ và tên" khi đăng ký bị xoá ngày 29/10 (commit `1a795ea`) không ghi lý do, trong khi backlog Task 7 yêu cầu lưu tên khách; thêm lại ở PR #10 (08/11).
  - Sau khi đăng nhập, trang có thể chuyển hướng tới địa chỉ ngoài (open redirect); sửa ở PR #10.
- **Thay đổi chưa thống nhất:** nhánh `dev3` (kiểm tra dữ liệu trang đăng nhập) còn 2 commit chưa được quyết định gộp hay bỏ.

### Ý kiến thành viên

| Thành viên | Điều cần cải thiện |
| ---------- | ------------------ |
| H.Tài      |                    |
| Nghĩa      |                    |
| Luân       |                    |
| P.Tài      |                    |
| Bảo Trí    |                    |

## 4. Hành động cải tiến

**Hành động được chọn:** ………………………………  
**Người phụ trách:** ………………  
**Kết quả ở sprint sau:** ………………
