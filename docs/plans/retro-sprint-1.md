# BrewLite - Sprint Retrospective (Sprint 1: Nền tảng và hiển thị menu)

**Trạng thái:** biên bản **lập bổ sung** ngày 10/11/2026. File task ghi buổi "Sprint 1 Review & Retrospective" (#21) xong ngày 31/10, nhưng repo chưa có biên bản. Phần dữ kiện lấy từ file danh sách task và lịch sử Git; nhóm điền ý kiến trong buổi họp.  
**Người điều phối:** H.Tài (Scrum Master)  
**Thành viên tham dự:** ☐ H.Tài ☐ Nghĩa ☐ Luân ☐ P.Tài ☐ Bảo Trí  
**Liên quan:** [Kế hoạch Sprint](../diagrams/sprint-plan.md), [Product backlog](../requirements/product-backlog.md), Retro [Sprint 2](retro-sprint-2.md), [Sprint 3](retro-sprint-3.md)

## 1. Kết quả Sprint 1

**Sprint Goal:** Nền tảng và hiển thị menu (Task 1, 2, 3, 4; 18 story points).

| Task | Nội dung                         | Người làm (theo file task)        | Ngày xong (theo file task) | Bằng chứng |
| ---- | -------------------------------- | --------------------------------- | -------------------------- | ---------- |
| 1    | Khởi tạo web, API, README, `.env.example` | Luân, Bảo Trí; Nghĩa, H.Tài | 23/10 | `apps/web`, `apps/api`, `README.md` |
| 2    | API `GET /products`, `GET /products/:id`, schema, seed, unit test | Nghĩa | 24/10–27/10 | `modules/products/`, `products.*.spec.ts` |
| 3    | Trang Menu, ProductCard, trạng thái tải / trống / lỗi | Bảo Trí, Luân, P.Tài | 25/10–26/10 | `features/menu/` |
| 4    | Trang chi tiết, chọn size và topping, tính giá | Luân, Bảo Trí | 27/10 | `app/products/[id]/page.tsx`, `features/product/pricing.ts` |
| —    | Test thủ công, code review, Sprint Review | Cả nhóm; H.Tài, Nghĩa | 31/10 | Chưa có biên bản trong repo |

**Pull Request trong giai đoạn:** #1, #3, #4 (merge 26/10), đều 0 lượt review.

## 2. Điều làm tốt

### Dữ kiện

- Đủ 4 task của sprint có code; API sản phẩm có unit test và e2e (`test/products.e2e-spec.ts`).
- Giá được tính theo một quy tắc chung ở cả web (`features/product/pricing.ts`) và API (`orders/pricing.ts`).
- Tài liệu nền tảng có trước khi code: backlog có tiêu chí chấp nhận, wireframe 5 màn hình, API contract.

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
- **PR không được review** (#1, #3, #4).
- **Lỗi của sprint này được phát hiện muộn ở các sprint sau:**
  - Chữ tiếng Việt trên menu bị lỗi, sửa ngày 02/11 (commit `9cc4046`).
  - Trang chi tiết món thiếu ảnh, nút thêm vào giỏ chưa hiện giá theo số lượng, chưa giới hạn theo tồn kho: sửa ngày 07–08/11 (PR #10).
- **Ranh giới sprint không rõ:** cùng ngày 23/10, file task ghi xong cả việc khởi tạo của Sprint 1 lẫn nhiều việc của Sprint 3 (thanh toán, state machine).

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
