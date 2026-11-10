# BrewLite – Checklist đối chiếu đề bài

Đối chiếu đề bài `BrewLite-CongNghePhanMem.pdf` với code trên `main` (commit `bd43f56`, ngày 09/11/2026, gồm cả PR #14 sửa tồn kho ở trang admin).

- `[x]` đã có trong project (kèm bằng chứng)
- `[ ]` chưa có / mới có một phần (ghi rõ còn thiếu gì)

**Tóm tắt:** 10/10 task trong Product Backlog đều có code và test. Phần còn thiếu chủ yếu là **bằng chứng quy trình** (retro, review PR, burndown thực tế) và **kiểm chứng phi chức năng** (< 500ms, trình duyệt).

---

## 1. Product Backlog – 10 task (Mục 8)

### Task 1 – Khởi tạo dự án và cấu trúc
- [x] Monorepo 2 app: `apps/web` (Next.js) + `apps/api` (NestJS) – tên thư mục khác `frontend/backend` của đề nhưng đúng ý
- [x] Chạy được "Hello" – `apps/api/src/app.controller.ts` (`getHello`)
- [x] README – `README.md` (cài đặt, Docker, chạy dev, test, tài liệu)
- [x] Git + quy ước làm việc – `CONTRIBUTING.md`, `.github/pull_request_template.md`
- [x] `.env.example`

### Task 2 – API danh sách sản phẩm
- [x] `GET /products` trả id, tên, giá, ảnh từ CSDL – `modules/products/`
- [x] `GET /products/:id` (chi tiết + topping)
- [x] Test – `products.controller.spec.ts`, `products.service.spec.ts`, `test/products.e2e-spec.ts`

### Task 3 – Trang Menu (Frontend)
- [x] Gọi `/products`, render lưới sản phẩm – `features/menu/menu-page.tsx`, `ProductCard.tsx`
- [x] Trạng thái loading (skeleton) và empty

### Task 4 – Chi tiết và tùy chọn sản phẩm
- [x] Chọn size S/M/L và topping – `app/products/[id]/page.tsx`
- [x] Tính giá theo tùy chọn – `features/product/pricing.ts` (khớp `api/.../orders/pricing.ts`)
- [x] Hiển thị hết hàng, giới hạn số lượng theo tồn kho – `features/product/stock.ts`

### Task 5 – Giỏ hàng
- [x] Thêm / sửa số lượng / xóa – `app/cart/page.tsx`
- [x] Lưu state bằng Zustand (persist) – `store/cart.store.ts`
- [x] Tự tính tổng tiền + badge số lượng trên Navbar
- [x] (Thêm) Đồng bộ giỏ với server `GET/PUT /cart`

### Task 6 – API tạo đơn hàng
- [x] `POST /orders` nhận giỏ, validate bằng class-validator (`dto/`)
- [x] Lưu đơn `PENDING`, trả mã đơn (sequence Postgres `BL-…`)
- [x] Server tự tính lại giá (chống sửa giá từ client)

### Task 7 – Đăng ký / Đăng nhập (JWT)
- [x] `POST /auth/register`, `POST /auth/login`
- [x] Băm mật khẩu bcrypt – `auth.service.ts`
- [x] Phát JWT, guard bảo vệ route đặt đơn – `JwtAuthGuard` trên orders/payments/cart
- [ ] Bảng công nghệ ghi "JWT (Passport)": project dùng `@nestjs/jwt` + guard tự viết, **không dùng Passport** (chức năng vẫn đủ; ghi chú lý do vào ADR nếu giảng viên hỏi)

### Task 8 – Thanh toán không tiền mặt
- [x] Mock payment, chọn Ví (`WALLET`) / Thẻ (`CARD`) – `payments/dto`
- [x] `POST /payments` → `PAID` khi thành công, `PAYMENT_FAILED` khi lỗi
- [x] Lỗi thanh toán: giữ giỏ hàng, cho thanh toán lại chính đơn đó
- [x] Nút Thanh toán hiển thị tổng tiền (US-05)

### Task 9 – Xác nhận, lịch sử đơn & bàn giao
- [x] Màn hình xác nhận (mã đơn, trạng thái, điểm thưởng) – `app/orders/[id]/confirmation/page.tsx`
- [x] `GET /orders/me` + trang lịch sử `app/orders/page.tsx`
- [x] `docker-compose.yml` chạy cả 3: `db`, `api`, `web`
- [x] README hướng dẫn chạy
- [ ] Demo end-to-end trước lớp (sự kiện – chưa có biên bản / video demo trong repo)

### Task 10 – Nghiệp vụ backend (Mục 9)
- [x] Order State Machine + chặn chuyển sai – `orders/order-state-machine.ts` (`assertTransition`)
- [x] Thanh toán idempotent (`Idempotency-Key`, cùng key khác body → 409)
- [x] Tồn kho khi đặt đồng thời: transaction + optimistic lock (`Product.version`)
- [x] Mã giảm giá (`POST /promotions/validate`) + cộng điểm loyalty sau `PAID` (`floor(total/1000)`)
- [x] Test (a) chặn chuyển trạng thái sai – `test/order-state-machine.e2e-spec.ts` + unit
- [x] Test (b) 2 lần cùng Idempotency-Key chỉ 1 thanh toán – `test/payments.e2e-spec.ts`
- [x] Test (c) đặt đồng thời không vượt tồn kho – `test/orders-concurrent-stock.e2e-spec.ts`

---

## 2. Yêu cầu chức năng (Mục 4.1)
- [x] 1. Menu kèm hình, tên, giá
- [x] 2. Chi tiết sản phẩm, chọn size và topping
- [x] 3. Thêm/sửa/xóa giỏ hàng, tự tính tổng
- [x] 4. Đăng ký / đăng nhập (JWT)
- [x] 5. Tạo đơn và thanh toán không tiền mặt
- [x] 6. Xác nhận đơn (mã, trạng thái) và lịch sử đơn

## 3. Yêu cầu phi chức năng (Mục 4.2)
- [ ] API phản hồi < 500ms với dữ liệu mẫu – **chưa đo**; `docs/testing/test-strategy.md` và `traceability-matrix.md` (N1) vẫn ghi "TBD / Phase 2+"
- [x] Mật khẩu băm, JWT, validate đầu vào (`ValidationPipe` whitelist + DTO)
- [ ] Chạy tốt trên các trình duyệt – **chưa có kiểm chứng** (chưa có test Playwright / bảng thử Chrome, Edge, Firefox, mobile)

## 4. User Story US-05 (Mục 4.3)
- [x] Giỏ có ≥ 1 sản phẩm → nút Thanh toán hiển thị tổng tiền
- [x] Chọn Ví / Thẻ rồi xác nhận → đơn `PAID`
- [x] Thanh toán lỗi → `PAYMENT_FAILED`, giỏ giữ nguyên
- [x] Thành công → hiển thị mã đơn và màn hình xác nhận

## 5. Luồng nghiệp vụ & wireframe (Mục 5, 7)
- [x] Luồng Menu → Chi tiết → Giỏ → Đăng nhập → Thanh toán → Xác nhận
- [x] Kịch bản viết thành tài liệu – `docs/requirements/scenarios.md`
- [x] Wireframe 5 màn hình – `docs/design/wireframes.md`, `Wireframe-5.html`, `ui-decisions.md`

## 6. Kiến trúc & công nghệ (Mục 6)
- [x] Next.js + TypeScript + TailwindCSS + Zustand
- [x] NestJS + REST + class-validator + JWT
- [x] PostgreSQL + Prisma
- [x] Mock Payment Service
- [x] Docker Compose, Git, README
- [x] Tài liệu kiến trúc + ADR – `docs/architecture/` (ADR 0001–0005, `api-contract.md`)
- [x] ERD / sơ đồ luồng – `docs/diagrams/`

## 7. Endpoint & thực thể tối thiểu (Mục 12)
- [x] `GET /products`, `GET /products/:id`
- [x] `POST /auth/register`, `POST /auth/login`
- [x] `POST /orders`, `GET /orders/me`
- [x] `POST /payments` (idempotent)
- [x] Product (id, name, price, imageUrl, stock)
- [x] User (id, email, passwordHash, loyaltyPoints)
- [x] Order (id, userId, status, total, createdAt)
- [x] OrderItem (id, orderId, productId, size, qty, lineTotal)
- [x] Payment (id, orderId, idempotencyKey, amount, method)

## 8. Quy trình Agile Scrum (Mục 2)
- [x] Vai trò PO (Nghĩa), SM (H.Tài), Dev Team – `docs/working-agreement.md`
- [x] Họp khởi động – `docs/plans/kickoff-2026-10-22.md`
- [x] Product Backlog + User Story + Acceptance Criteria – `docs/requirements/product-backlog.md`
- [x] Kế hoạch 3 Sprint + Sprint Backlog – `docs/diagrams/sprint-plan.md`
- [x] Burndown chart mẫu – `docs/diagrams/sprint-plan.md` §4
- [ ] Burndown **thực tế** cập nhật cuối mỗi ngày – hiện chỉ có biểu đồ mẫu
- [ ] Biên bản Daily Scrum / Sprint Review – chưa có trong `docs/plans/`
- [ ] Biên bản Sprint Retrospective – `working-agreement.md` hẹn `docs/plans/retro-<sprint>.md` nhưng **chưa có file nào**

## 9. Definition of Done (Mục 10)
- [x] Code chạy được, build không lỗi (web: tsc + lint + build; api: unit + e2e)
- [x] Commit Git mô tả rõ ràng (Conventional Commits)
- [ ] **Được review trong nhóm** – các PR đã merge (#1, #3, #4, #6, #7, #10–#13) đều **0 lượt review** trên GitHub; cần approve PR trước khi merge
- [x] API validate đầu vào; UI có loading/lỗi cơ bản
- [x] Hướng dẫn chạy trong README

## 10. Bàn giao (Mục 11)
- [ ] Trình diễn luồng end-to-end (buổi Demo)
- [x] Bàn giao mã nguồn Git, `docker-compose` chạy được, README
- [ ] Trình bày Sprint Retrospective (điều làm tốt / cần cải thiện)
- [ ] Ghi nhận phản hồi khách hàng thành backlog phiên bản sau

---

## Việc nên làm tiếp (theo thứ tự ưu tiên)
1. [ ] Viết `docs/plans/retro-sprint-1.md`, `retro-sprint-2.md`, `retro-sprint-3.md` (làm tốt / cần cải thiện / 1 hành động)
2. [ ] Từ giờ mỗi PR cần ít nhất 1 thành viên **Approve** trước khi merge (đúng DoD và `CONTRIBUTING.md`)
3. [ ] Đo thời gian phản hồi API (vd `autocannon` hoặc test e2e đo `GET /products` < 500ms) và cập nhật N1 trong `traceability-matrix.md`
4. [ ] Cập nhật burndown thực tế từ lịch sử commit/PR vào `sprint-plan.md`
5. [ ] Thử giao diện trên Chrome, Edge, Firefox và điện thoại; ghi kết quả vào `docs/testing/`
6. [ ] Chuẩn bị kịch bản demo + ghi lại phản hồi sau buổi Sprint Review
7. [ ] (Tuỳ chọn) Ghi chú vì sao dùng `@nestjs/jwt` thay vì Passport
