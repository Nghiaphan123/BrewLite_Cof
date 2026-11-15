# BrewLite - Product Backlog

**Trạng thái:** Sản phẩm bàn giao Giai đoạn 1
**Người phụ trách:** H.Tài, Nghĩa (Nhiệm vụ 2.0)
**Liên quan:** [Thỏa thuận làm việc](../working-agreement.md), [Scenarios](scenarios.md), [Hợp đồng API](../architecture/api-contract.md), [Thiết kế: Wireframes](../design/wireframes.md), Bảng tính nhiệm vụ `BrewLite-DanhSachTask.xlsx`

Đây là Product Backlog cho MVP của BrewLite. Nó là danh sách có thẩm quyền về *cái gì* nhóm đang xây dựng, theo thứ tự ưu tiên, với tiêu chí chấp nhận làm cho "xong" có thể kiểm thử được. Bảng tính là góc nhìn lịch trình và trạng thái; tài liệu này là góc nhìn yêu cầu.

> **Phạm vi:** MVP từ chọn sản phẩm đến thanh toán và xác nhận, theo PDF bài tập §4.1. Ngoài phạm vi: quản lý đơn hàng phía barista/back-office, tích hợp cổng thanh toán thật, hỗ trợ đa cửa hàng, đổi điểm trung thành (chỉ tích lũy).

## 1. Tầm nhìn sản phẩm và các bên liên quan

Phần này ghi lại hai mục ngữ cảnh mà bài tập yêu cầu trước chính backlog: Tầm nhìn sản phẩm (PDF §3.1) và các bên liên quan (PDF §3.2). Chúng được lặp lại ở đây — không phải trong một tệp riêng — vì reviewer của Nhiệm vụ 2.0 nên thấy chúng bên cạnh các nhiệm vụ mà chúng biện minh. Nhiệm vụ 3.0 (kickoff) có thể tinh chỉnh tầm nhìn và phân công vai trò; các nhiệm vụ của backlog không thay đổi khi nó làm vậy.

### 1.1 Tầm nhìn sản phẩm

> **BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.**

Bằng tiếng Anh, cho các reviewer đọc code và tài liệu bằng tiếng Anh:

> BrewLite lets customers order and pay for drinks cashlessly in a few taps, reducing queue time and speeding up pickup at the counter.

Tầm nhìn giới hạn phạm vi MVP: **đặt → thanh toán → xác nhận**, không phải back-office, không phải giao hàng, không phải đổi điểm trung thành. Mọi nhiệm vụ trong §4–§13 truy nguyên đến một trong ba bước đó; bất cứ thứ gì không làm vậy được liệt kê là ngoài phạm vi trong §16.

### 1.2 Các bên liên quan

Sáu bên liên quan từ PDF §3.2, và mỗi bên kỳ vọng gì từ MVP:

| Bên liên quan                            | Họ kỳ vọng gì                                                                                    | Nó xuất hiện ở đâu trong backlog này                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Khách hàng (customer)**                | Đặt đồ uống, chọn kích cỡ/topping, thanh toán không tiền mặt, xem trạng thái và lịch sử đơn hàng | Nhiệm vụ 3–9; mọi User Story được viết từ góc nhìn của bên liên quan này                                                                                                                                     |
| **Nhân viên quầy / Barista**             | Nhận đơn hàng và cập nhật trạng thái pha chế                                                     | **Ngoài phạm vi MVP** (PDF §3.2: "nằm ngoài phạm vi MVP"). Enum `OrderStatus` dự trữ `PREPARING`/`READY`/`COMPLETED` cho UI barista tương lai, nhưng không màn hình nào được xây trong Giai đoạn 1. Xem §16. |
| **Quản lý cửa hàng / Product Owner**     | Định nghĩa yêu cầu, ưu tiên backlog, nghiệm thu từng increment                                   | Tài liệu này (chính backlog) + nghiệm thu Sprint Review trong `working-agreement.md` §2. Vai trò PO được phân công tại Nhiệm vụ 3.0.                                                                         |
| **Giảng viên nghiệm thu (lecturer)**     | Đánh giá quy trình, sản phẩm, và tiêu chí chấp nhận                                              | Các test được chấm trong Nhiệm vụ 10 (PDF §9), DoD trong `working-agreement.md` §5, ghi chú bằng chứng trong bảng tính, và truy nguyên của backlog này đến 10 nhiệm vụ của PDF.                              |
| **Nhóm phát triển (dev team)**           | Phân tích, thiết kế, xây dựng, kiểm thử, bàn giao                                                | Phân công nhiệm vụ của backlog, cột `Owner` trong §3, và cột `Người làm` của bảng tính.                                                                                                                      |
| **Đơn vị thanh toán (payment provider)** | Cung cấp hoặc được mô phỏng như cổng thanh toán                                                  | Nhiệm vụ 8 (thanh toán giả lập, ADR 0004). Mock chạy trong tiến trình; không tích hợp bên ngoài trong MVP.                                                                                                   |

**Vai trò vs. bên liên quan:** `working-agreement.md` §1 định nghĩa *vai trò* của nhóm (PO, SM, Dev Team) — ai làm việc. Bảng này định nghĩa *các bên liên quan* — ai quan tâm đến kết quả. Khách hàng và barista là bên liên quan, không phải vai trò nhóm; PO vừa là vai trò vừa là bên liên quan.

### 1.3 Cách đọc tài liệu này

- Mỗi mục backlog một phần, được đánh số `Task 1` … `Task 10` để khớp với PDF bài tập §8. Đây là cách đánh số **chấm điểm** (1 điểm mỗi nhiệm vụ, tổng 10).
- Mỗi nhiệm vụ liệt kê: User Story, Tiêu chí chấp nhận (có thể kiểm thử), ranh giới phạm vi (cái *không* được bao gồm), các dòng bảng tính triển khai nó, Sprint/Giai đoạn, người phụ trách, và tài liệu bằng chứng.
- **STT bảng tính** (ví dụ `1.0`, `10.0`) là cách đánh số **lập lịch** và không khớp với số nhiệm vụ. Một nhiệm vụ backlog có thể trải qua nhiều dòng bảng tính (ví dụ Nhiệm vụ 9 trải qua các dòng 38.0–43.0, 57.0–61.0). Bảng ánh xạ trong §15 là tham chiếu chéo.
- Tiêu chí chấp nhận được viết dưới dạng Given/When/Then khi hành vi có thể kiểm thử, và dưới dạng checklist khi nó mang tính cấu trúc (scaffolding, tài liệu).
- **Ưu tiên:** `P0` = bắt buộc cho demo MVP, `P1` = bắt buộc cho chấm điểm nhưng không chặn demo, `P2` = mở rộng. Cả 10 nhiệm vụ đều là P0 theo bài tập.
- **Truy nguyên:** dòng "Traces to" của mỗi nhiệm vụ trỏ đến các scenario trong `scenarios.md` (Nhiệm vụ 4.0) thực thi nó. Scenarios là *cách*; tài liệu này là *cái gì*.

## 2. Định nghĩa Sẵn sàng (Definition of Ready)

Một mục backlog sẵn sàng để được kéo vào Sprint khi:

- User Story và Tiêu chí chấp nhận đã được viết (tài liệu này).
- Các dòng bảng tính đã được tạo và ước lượng.
- Phụ thuộc đã được xác định và hoặc đã giải quyết hoặc đã lên lịch sớm hơn.
- ADR sở hữu (nếu có) đã được chấp nhận hoặc hoãn rõ ràng kèm ghi chú.

Các mục không đáp ứng điều này sẽ không được kéo. PO có thể kéo một mục chưa sẵn sàng theo quyết định của họ, và ghi lại lý do.

## 3. Tóm tắt backlog

| Nhiệm vụ | Tiêu đề                       | Ưu tiên | Sprint   | Dòng bảng tính                   | Người phụ trách chính |
| -------- | ----------------------------- | ------- | -------- | -------------------------------- | --------------------- |
| Task 1   | Khởi tạo dự án và cấu trúc    | P0      | Sprint 1 | 10.0–12.0                        | Nghĩa                 |
| Task 2   | API Sản phẩm                  | P0      | Sprint 1 | 14.0–15.0, 19.0                  | Nghĩa                 |
| Task 3   | Trang Menu (frontend)         | P0      | Sprint 1 | 16.0, 18.0                       | H.Tài (dự phòng)      |
| Task 4   | Chi tiết sản phẩm và tùy chọn | P0      | Sprint 1 | 13.0, 17.0                       | H.Tài (dự phòng)      |
| Task 5   | Giỏ hàng                      | P0      | Sprint 2 | 23.0, 29.0                       | Nghĩa                 |
| Task 6   | API Tạo đơn hàng              | P0      | Sprint 2 | 22.0, 25.0, 28.0                 | H.Tài                 |
| Task 7   | Đăng ký / đăng nhập (JWT)     | P0      | Sprint 2 | 24.0, 26.0, 27.0, 30.0, 31.0     | H.Tài                 |
| Task 8   | Thanh toán giả lập            | P0      | Sprint 3 | 35.0–37.0, 41.0                  | H.Tài                 |
| Task 9   | Xác nhận, lịch sử, bàn giao   | P0      | Sprint 3 | 38.0–40.0, 42.0, 57.0, 59.0–61.0 | Nghĩa                 |
| Task 10  | Quy tắc nghiệp vụ backend     | P0      | Sprint 3 | 44.0–55.0                        | H.Tài                 |

Phân công Sprint theo PDF bài tập §2.3. Các Giai đoạn 1–6 của bảng tính chia nhỏ thêm; xem §13.

## 4. Nhiệm vụ 1 — Khởi tạo dự án và cấu trúc

**Ưu tiên:** P0 · **Sprint:** 1 · **Người phụ trách:** Nghĩa

### User Story

> Là một lập trình viên trong nhóm, tôi muốn có một scaffold hai ứng dụng chạy được với tài liệu cài đặt, để tôi có thể bắt đầu công việc tính năng mà không mất một ngày cho các vấn đề môi trường.

### Tiêu chí chấp nhận

- [ ] `apps/api` là một ứng dụng NestJS phản hồi trên cổng được cấu hình; `apps/web` là một ứng dụng Next.js App Router render trang khởi đầu trên cổng 3000.
- [ ] Cả hai ứng dụng cài đặt và chạy từ thư mục riêng với các lệnh trong `docs/setup.md`; thư mục gốc không có `package.json`.
- [ ] `apps/api/.env.example` và `apps/web/.env.example` tồn tại và khớp với `docs/config.md` §2.
- [ ] `.gitignore` loại trừ `node_modules`, `.env`, `.next`, `dist`.
- [ ] `README.md` ở gốc và README từng ứng dụng tồn tại và liên kết đến `docs/setup.md`.
- [ ] Một thành viên clone trên máy sạch và đạt bảng kiểm tra "Hello" trong `docs/setup.md` §8 mà không cần hỏi trợ giúp.

### Ngoài phạm vi

Workflow CI, triển khai, Dockerfile production. `apps/api/Dockerfile` và `apps/web/Dockerfile` có thể tồn tại từ scaffold nhưng chưa được nối vào Compose cho đến Nhiệm vụ 9/Giai đoạn 6.

### Bằng chứng

`docs/setup.md`, `docs/config.md`, các tệp `.env.example`, `README.md`. Dòng bảng tính 10.0–12.0.

## 5. Nhiệm vụ 2 — API Sản phẩm

**Ưu tiên:** P0 · **Sprint:** 1 · **Người phụ trách:** Nghĩa

### User Story

> Là một khách hàng, tôi muốn ứng dụng tải menu đồ uống từ server, để menu có thể thay đổi mà không cần triển khai lại frontend.

### Tiêu chí chấp nhận

- [ ] `GET /products` trả về một mảng JSON; mỗi mục có `id`, `name`, `price`, `imageUrl`, `stock`.
- [ ] `GET /products/:id` trả về một sản phẩm hoặc `404` với phong bì lỗi chuẩn.
- [ ] `price` là số nguyên bằng VND (không dấu thập phân); xem `docs/config.md` §3.
- [ ] Dữ liệu đến từ PostgreSQL qua Prisma, được seed bởi `prisma/seed.ts` với ít nhất 6 đồ uống bao phủ mọi kích cỡ dùng trong demo.
- [ ] Unit test bao phủ service và controller happy path và trường hợp `404`.
- [ ] `GET /products` phản hồi trong < 500 ms với dữ liệu seed (PDF bài tập §4.2).

### Ngoài phạm vi

Phân trang, lọc, tìm kiếm, upload ảnh sản phẩm, thay đổi stock. Stock chỉ đọc ở đây; nó bị giảm trong Nhiệm vụ 10.

### Bằng chứng

`apps/api/src/modules/products/`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts`. Dòng bảng tính 14.0–15.0, 19.0.

## 6. Nhiệm vụ 3 — Trang Menu (frontend)

**Ưu tiên:** P0 · **Sprint:** 1 · **Người phụ trách:** H.Tài (dự phòng; chính sẽ được xác nhận tại Sprint Planning)

### User Story

> Là một khách hàng, tôi muốn duyệt menu dưới dạng lưới card, để tôi có thể chọn một đồ uống nhanh chóng.

### Tiêu chí chấp nhận

- [ ] Route menu (`/`) render một lưới các component `ProductCard` từ `GET /products`.
- [x] Mỗi card hiển thị ảnh, tên, và giá được định dạng VND.
- [x] Trang xử lý ba trạng thái rõ ràng: **loading** (skeleton hoặc spinner), **empty** (thông điệp), **error** (khả năng thử lại).
- [x] Click vào một card điều hướng đến route chi tiết sản phẩm.
- [ ] Layout responsive ở chiều rộng 360 px và 1280 px.
- [ ] Một header hiển thị huy hiệu giỏ hàng với số lượng mục (0 khi trống).

### Ngoài phạm vi

Infinite scroll, lọc theo danh mục, tìm kiếm, yêu thích.

### Bằng chứng

`apps/web/src/app/page.tsx`, `apps/web/src/features/menu/menu-page.tsx`, `apps/web/src/features/menu/ProductCard.tsx`. Wireframe: `docs/design/wireframes.md` (Menu). Dòng bảng tính 16.0, 18.0.

## 7. Nhiệm vụ 4 — Chi tiết sản phẩm và tùy chọn

**Ưu tiên:** P0 · **Sprint:** 1 · **Người phụ trách:** H.Tài (dự phòng; chính sẽ được xác nhận tại Sprint Planning)

### User Story

> Là một khách hàng, tôi muốn chọn kích cỡ và topping trên trang sản phẩm, để giá phản ánh những gì tôi đang đặt.

### Tiêu chí chấp nhận

- [ ] Route chi tiết sản phẩm (`/products/[id]`) hiển thị tên, ảnh, giá cơ sở, và bộ chọn kích cỡ S/M/L.
- [ ] Chọn kích cỡ cập nhật giá hiển thị một cách xác định; quy tắc nằm trong `docs/design/ui-decisions.md` và được phản chiếu trong hàm giá backend.
- [ ] Chọn topping là chọn nhiều; mỗi topping thêm một khoản cố định; tổng hiển thị cập nhật trên mỗi thay đổi.
- [ ] "Thêm vào giỏ" bị vô hiệu cho đến khi một kích cỡ được chọn; nhãn nút bao gồm tổng hiện tại.
- [ ] Tổng của frontend và `lineTotal` được tính bởi backend (Nhiệm vụ 6) khớp nhau cho cùng đầu vào. Điều này được xác minh bằng một fixture dùng chung, không phải bằng mắt.

### Ngoài phạm vi

Ghi chú theo mục, giảm giá theo số lượng, stock theo kích cỡ.

### Bằng chứng

`apps/web/src/app/products/[id]/page.tsx`, `apps/web/src/features/product/`, `docs/design/ui-decisions.md` (quy tắc giá). Wireframe: `docs/design/wireframes.md` (Chi tiết). Dòng bảng tính 13.0, 17.0.

## 8. Nhiệm vụ 5 — Giỏ hàng

**Ưu tiên:** P0 · **Sprint:** 2 · **Người phụ trách:** Nghĩa

### User Story

> Là một khách hàng, tôi muốn một giỏ hàng tồn tại qua điều hướng, để tôi có thể thêm vài đồ uống và thanh toán một lần.

### Tiêu chí chấp nhận

- [ ] Một Zustand store giữ các mục giỏ hàng với `productId`, `name`, `size`, `toppings`, `qty`, `lineTotal`.
- [ ] Thêm cùng sản phẩm với cùng kích cỡ và topping tăng số lượng thay vì tạo dòng trùng lặp.
- [ ] Trang giỏ hàng (`/cart`) liệt kê các mục với điều khiển số lượng và nút xóa; tổng tính lại trên mỗi thay đổi.
- [ ] Huy hiệu header phản ánh tổng số lượng, không phải số dòng.
- [ ] State giỏ hàng tồn tại qua điều hướng phía client nhưng không qua reload trang đầy đủ (lưu trữ ngoài phạm vi).
- [ ] Tổng giỏ hàng khớp với tổng backend cho cùng giỏ hàng; được xác minh bằng fixture giá dùng chung từ Nhiệm vụ 4.

### Ngoài phạm vi

Giỏ hàng phía server, gộp giỏ hàng giữa các thiết bị, giỏ hàng đã lưu, coupon (Nhiệm vụ 10 thêm *áp dụng* giảm giá, không phải lưu trữ giỏ hàng).

### Bằng chứng

`apps/web/src/store/cart-store.ts`, `apps/web/src/app/cart/page.tsx`, `apps/web/src/features/cart/`. Wireframe: `docs/design/wireframes.md` (Giỏ hàng). Dòng bảng tính 23.0, 29.0.

## 9. Nhiệm vụ 6 — API Tạo đơn hàng

**Ưu tiên:** P0 · **Sprint:** 2 · **Người phụ trách:** H.Tài

### User Story

> Là một khách hàng, tôi muốn giỏ hàng của mình trở thành một đơn hàng trên server, để nó có thể được thanh toán và sau đó tra cứu.

### Tiêu chí chấp nhận

- [ ] `POST /orders` nhận một payload giỏ hàng, validate nó với `class-validator`, và lưu một `Order` với trạng thái `PENDING` cùng các dòng `OrderItem` của nó.
- [ ] Server tính lại `total` và từng `lineTotal`; giá do client cung cấp bị bỏ qua. Một payload bị giả mạo cho ra giá của server, không phải của client.
- [ ] Phản hồi bao gồm `id` đơn hàng (mã đơn hàng dễ đọc theo `docs/design/ui-decisions.md`) và `status`.
- [ ] Payload không hợp lệ trả về `400` với thông điệp cấp trường; phong bì lỗi khớp với `docs/architecture/api-contract.md`.
- [ ] Unit test bao phủ: giỏ hàng hợp lệ, giỏ hàng trống, kích cỡ không hợp lệ, sản phẩm thiếu, giả mạo giá, tính tổng.
- [ ] Đơn hàng không được thanh toán ở đây; `PAID` được đặt bởi Nhiệm vụ 8.

### Ngoài phạm vi

Đặt trước stock (Nhiệm vụ 10), khuyến mãi (Nhiệm vụ 10), chuyển trạng thái đơn hàng ngoài `PENDING` (Nhiệm vụ 10).

### Bằng chứng

`apps/api/src/modules/orders/`, `apps/api/src/modules/orders/dto/create-order.dto.ts`. Hợp đồng API: `docs/architecture/api-contract.md` §`POST /orders`. Dòng bảng tính 22.0, 25.0, 28.0.

## 10. Nhiệm vụ 7 — Đăng ký / đăng nhập (JWT)

**Ưu tiên:** P0 · **Sprint:** 2 · **Người phụ trách:** H.Tài

### User Story

> Là một khách hàng quay lại, tôi muốn đăng ký và đăng nhập, để lịch sử đơn hàng của tôi gắn với tôi và đơn hàng của tôi được bảo vệ.

### Tiêu chí chấp nhận

- [ ] `POST /auth/register` tạo một người dùng với mật khẩu được hash bcrypt và trả về `201`; email trùng lặp trả về `409`.
- [ ] Đăng ký lưu tên khách hàng và trả về nó trong hồ sơ người dùng đã xác thực.
- [ ] `POST /auth/login` xác minh mật khẩu và trả về một JWT; mật khẩu sai trả về `401` với thông điệp chung (không liệt kê người dùng).
- [ ] `JWT_SECRET` và `JWT_EXPIRES_IN` được đọc từ env theo `docs/config.md` §2.1; không có bí mật hard-code.
- [ ] `JwtAuthGuard` bảo vệ `POST /orders`; một yêu cầu chưa xác thực trả về `401`. Guard được áp dụng đúng cho các route được nêu trong hợp đồng API.
- [ ] Frontend có các trang `/auth/register` và `/auth/login`; token được lưu phía client và đính kèm vào `POST /orders`.
- [ ] Unit test bao phủ: đăng ký hợp lệ, email trùng lặp, đăng nhập hợp lệ, mật khẩu sai, token sai định dạng.

### Ngoài phạm vi

Refresh token, đặt lại mật khẩu, xác minh email, OAuth, truy cập theo vai trò (barista ngoài phạm vi MVP theo PDF §3.2).

### Bằng chứng

`apps/api/src/modules/auth/`, `apps/api/src/common/guards/jwt-auth.guard.ts`, `apps/web/src/features/auth/`, `apps/web/src/app/auth/`. Hợp đồng API: `docs/architecture/api-contract.md` §`POST /auth/*`. Wireframe: `docs/design/wireframes.md` (màn hình xác thực — sẽ được thêm cùng với nhiệm vụ này). Dòng bảng tính 24.0, 26.0, 27.0, 30.0, 31.0.

## 11. Nhiệm vụ 8 — Thanh toán giả lập

**Ưu tiên:** P0 · **Sprint:** 3 · **Người phụ trách:** H.Tài

### User Story

> Là một khách hàng, tôi muốn thanh toán bằng mô phỏng ví hoặc thẻ và thấy kết quả ngay lập tức, để tôi biết đơn hàng của mình có thành công không.

### Tiêu chí chấp nhận

- [ ] Trang thanh toán (`/checkout`) hiển thị tổng, bộ chọn Wallet/Card, và nút xác nhận (wireframe: `docs/design/wireframes.md` — Thanh toán).
- [ ] `POST /payments` nhận id đơn hàng và một phương thức, và chuyển đơn hàng sang `PAID` khi thành công hoặc `PAYMENT_FAILED` khi thất bại.
- [ ] `PAYMENT_MOCK_MODE` trong `apps/api/.env` chọn `success`, `failure`, hoặc `random`; mock sống trong tiến trình (không cổng riêng, theo `docs/config.md` §1.1 và ADR 0004).
- [ ] Khi thất bại, giỏ hàng **không** bị xóa và đơn hàng vẫn có thể truy xuất; người dùng có thể thử lại.
- [ ] Khi thành công, phản hồi bao gồm mã đơn hàng và trạng thái; frontend điều hướng đến route xác nhận.
- [ ] Unit test bao phủ đường thành công và thất bại, bao gồm "thử lại sau thất bại thành công."

### Ngoài phạm vi

Tích hợp cổng thật, thanh toán một phần, hoàn tiền, thẻ đã lưu. Idempotency là Nhiệm vụ 10, không phải ở đây — nhiệm vụ này có thể tạo trùng lặp khi submit hai lần, và integration test của Nhiệm vụ 10 chứng minh cách sửa.

### Bằng chứng

`apps/api/src/modules/payments/`, `apps/web/src/app/checkout/page.tsx`, `apps/web/src/features/checkout/`, ADR 0004. Dòng bảng tính 35.0–37.0, 41.0.

## 12. Nhiệm vụ 9 — Xác nhận, lịch sử, bàn giao

**Ưu tiên:** P0 · **Sprint:** 3 · **Người phụ trách:** Nghĩa

### User Story

> Là một khách hàng, tôi muốn thấy xác nhận đơn hàng và các đơn hàng trước đây của mình, và nhóm muốn toàn bộ thứ chạy được từ một lệnh, để demo có thể tái lập.

### Tiêu chí chấp nhận

- **Xác nhận**
  - [ ] Route xác nhận (`/orders/[id]/confirmation`) hiển thị mã đơn hàng, trạng thái, và hành động "quay lại menu".
  - [ ] Trang xử lý "không tìm thấy đơn hàng" và "không phải đơn hàng của bạn" với thông điệp an toàn.
- **Lịch sử**
  - [ ] `GET /orders/me` trả về các đơn hàng của người gọi, được bảo vệ bởi JWT, mới nhất trước.
  - [ ] `/orders` (frontend) liệt kê các đơn hàng trước đây với mã, ngày, tổng, trạng thái; click một cái mở xác nhận/chi tiết của nó.
- **Bàn giao**
  - [ ] `docker-compose.yml` khởi động `db`, `api`, `web` với một `docker compose up`; stack sẵn sàng demo mà không cần cài Node cục bộ.
  - [ ] `README.md` có quickstart một lệnh và liên kết đến `docs/setup.md` cho đường không dùng Docker.
  - [ ] Checklist Định nghĩa Hoàn thành (PDF bài tập §10) được xác minh cho cả 10 nhiệm vụ và được ghi trong biên bản Retro.
  - [ ] Một script demo đầu-cuối (chọn → giỏ hàng → đăng nhập → thanh toán → xác nhận → lịch sử) chạy xanh trên máy sạch.

### Ngoài phạm vi

Quản lý đơn hàng admin, hoàn tiền, thông báo.

### Bằng chứng

`apps/web/src/app/orders/`, `apps/api/src/modules/orders/` (`GET /orders/me`), `docker-compose.yml`, `README.md`. Dòng bảng tính 38.0–40.0, 42.0, 57.0, 59.0–61.0.

## 13. Nhiệm vụ 10 — Quy tắc nghiệp vụ backend

**Ưu tiên:** P0 · **Sprint:** 3 · **Người phụ trách:** H.Tài

Đây là "Task 10 – nghiệp vụ backend" của bài tập (PDF §9), trị giá 1 điểm nhưng chứa bốn yêu cầu riêng biệt, mỗi yêu cầu có test riêng.

### User Story

> Là doanh nghiệp, tôi muốn backend thực thi vòng đời đơn hàng, idempotency, tính đúng đắn của stock, và khách hàng trung thành, để hệ thống đúng trong điều kiện thực, không chỉ trên happy path.

### Tiêu chí chấp nhận (bốn yêu cầu con)

**10a — State Machine đơn hàng**
- [ ] Trạng thái: `PENDING → PAID → PREPARING → READY → COMPLETED`; ngoại lệ `PAYMENT_FAILED`, `CANCELLED`. Đúng như PDF §9.1.
- [ ] `assertTransition(from, to)` ném lỗi cho bất kỳ chuyển đổi nào không có trong sơ đồ. `COMPLETED` và `CANCELLED` là trạng thái kết thúc.
- [ ] Được áp dụng trong `OrderService` để không đường code nào có thể vượt qua nó.
- [ ] **Unit test (a):** các chuyển đổi không hợp lệ bị từ chối; các chuyển đổi hợp lệ pass. Đây là một trong ba test được chấm rõ ràng (PDF §9).

**10b — Thanh toán idempotent**
- [ ] `POST /payments` tôn trọng header `Idempotency-Key`; cùng key hai lần tạo một thanh toán và trả về cùng kết quả, không phải khoản tính thứ hai.
- [ ] Key được lưu cùng bản ghi thanh toán; một lần phát lại với body khác nhưng cùng key bị từ chối với xung đột.
- [ ] **Integration test (b):** gửi cùng `Idempotency-Key` hai lần tạo đúng một đơn hàng/thanh toán. Một trong ba test được chấm.

**10c — Kiểm soát stock dưới đồng thời**
- [ ] Tạo đơn hàng (hoặc thanh toán, theo ADR) giảm stock trong một transaction với khóa lạc quan; trường `version` trên dòng mang stock.
- [ ] Khi stock không đủ, yêu cầu thất bại với một lỗi cụ thể, không phải `500` chung chung.
- [ ] **Integration test (c):** các đơn hàng đồng thời cho cùng sản phẩm không vượt quá stock có sẵn. Một trong ba test được chấm.

**10d — Khuyến mãi và khách hàng trung thành**
- [ ] Một mã khuyến mãi hợp lệ giảm tổng đơn hàng; một mã không hợp lệ hoặc hết hạn trả về lỗi cụ thể.
- [ ] Sau khi một đơn hàng đạt `PAID`, `loyaltyPoints` của người dùng tăng theo quy tắc được cấu hình.
- [ ] Frontend hiển thị giảm giá và điểm kiếm được (bổ sung wireframe được ghi trong `docs/design/wireframes.md`).
- [ ] Unit test bao phủ tính hợp lệ của promo, toán giảm giá, và tích lũy điểm.

### Ngoài phạm vi

Đa tiền tệ, khách hàng trung thành theo bậc, mã giới thiệu, xếp chồng promo. State machine **không** mô hình hóa hành động barista ngoài các chuyển đổi `PREPARING`/`READY` (những chuyển đổi đó được kích hoạt bởi API trong demo, không phải bởi UI barista, vốn ngoài MVP).

### Bằng chứng

`apps/api/src/modules/orders/` (state machine, `assertTransition`), `apps/api/src/modules/payments/` (idempotency), `apps/api/src/modules/promotions/`, `apps/api/src/modules/loyalty/`, `apps/api/prisma/schema.prisma` (version, promo, points). ADR 0004 cho state machine và quyết định idempotency. Dòng bảng tính 44.0–55.0.

## 14. Phụ thuộc giữa các nhiệm vụ

```text
Task 1 ──► Task 2 ──► Task 3 ──► Task 5 ──► Task 6 ──► Task 8 ──► Task 9
                └──► Task 4 ──► Task 5         ▲
Task 7 ─────────────────────────────────────────┘   (auth guards POST /orders)
Task 6, 8 ──► Task 10 (state machine, idempotency, stock)
```

- Task 4 và Task 2 độc lập và có thể chạy song song.
- Task 7 phải hoàn thành trước khi guard của Task 6 có thể được thực thi đầu-cuối; Task 6 có thể merge trước Task 7 với guard được stub, nhưng ghi chú `● Xong` của Task 6 phải nói rõ điều đó.
- Task 10 phụ thuộc vào Task 6 và Task 8 đã được merge; các test của nó thực thi cả hai.
- Phần bàn giao của Task 9 phụ thuộc vào Task 1–8.

Đồ thị này khớp với cột "Làm sau STT X" trong bảng tính; nếu chúng không khớp, bảng tính có thẩm quyền về lịch trình và tài liệu này được cập nhật để khớp.

## 15. Tham chiếu chéo bảng tính

| Nhiệm vụ backlog | Nhiệm vụ PDF | STT bảng tính (dòng)             | Giai đoạn |
| ---------------- | ------------ | -------------------------------- | --------- |
| Task 1           | 1            | 10.0–12.0                        | 2         |
| Task 2           | 2            | 14.0–15.0, 19.0                  | 2         |
| Task 3           | 3            | 16.0, 18.0                       | 2         |
| Task 4           | 4            | 13.0, 17.0                       | 2         |
| Task 5           | 5            | 23.0, 29.0                       | 3         |
| Task 6           | 6            | 22.0, 25.0, 28.0                 | 3         |
| Task 7           | 7            | 24.0, 26.0, 27.0, 30.0, 31.0     | 3         |
| Task 8           | 8            | 35.0–37.0, 41.0                  | 4         |
| Task 9           | 9            | 38.0–40.0, 42.0, 57.0, 59.0–61.0 | 4, 6      |
| Task 10          | 10           | 44.0–55.0                        | 5         |

Các dòng **1.0–9.0** (Giai đoạn 1) không phải nhiệm vụ backlog; chúng là công việc phân tích và cài đặt trước các mục backlog sản phẩm. Chúng được theo dõi trong bảng tính và có bằng chứng trong `docs/requirements/`, `docs/architecture/`, và `docs/design/`, nhưng chúng không được chấm theo rubric 10 nhiệm vụ.

## 16. Ngoài phạm vi (rõ ràng)

Được ghi lại để nhóm có thể nói "không" mà không tranh luận:

- Barista / kitchen display, UI chấp nhận đơn hàng (PDF §3.2: ngoài MVP).
- Cổng thanh toán thật (Stripe/VNPay/MoMo); chỉ mock.
- CRUD sản phẩm admin.
- Thông báo (email/SMS/push).
- UI đa ngôn ngữ.
- Chế độ offline / PWA.
- Phân tích, dashboard.
- Đổi điểm trung thành (tích lũy có trong Nhiệm vụ 10; tiêu điểm thì không).

## 17. Mục còn mở

| Mục                                                                                                                     | Người phụ trách | Đóng khi                                   |
| ----------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------ |
| Xác nhận người phụ trách chính cho Task 3 và Task 4                                                                     | H.Tài           | Sprint 1 Planning                          |
| Xác nhận phân công vai trò (PO = Nghĩa, SM = H.Tài) được phản chiếu trong `working-agreement.md` §1 và biên bản kickoff | H.Tài           | Nhiệm vụ 3.0 `● Xong` (đã đóng 2026-10-22) |
| Thêm màn hình xác thực vào `docs/design/wireframes.md`                                                                  | Luân            | Nhiệm vụ 7.0 `● Xong`                      |
| Phê chuẩn quyết định state-machine và idempotency trong ADR 0004                                                        | H.Tài           | ADR 0004 được chấp nhận                    |
| Thêm dòng promo/points vào chỉ mục wireframe                                                                            | -               | Nhiệm vụ 49.0 / 53.0 `● Xong`              |

---

## Ghi chú về các lựa chọn tôi đã đưa ra (để bạn chấp nhận hoặc ghi đè)

1. **Hai hệ thống đánh số, được dung hòa bằng một bảng.** PDF đánh số nhiệm vụ 1–10; bảng tính đánh số dòng `1.0`–`64.0`. Chúng trông đủ giống để người đọc nhầm lẫn (ví dụ "Task 10" nhiệm vụ PDF vs. `10.0` dòng scaffold). Tôi giữ cách đánh số PDF làm tiêu đề phần (§4–§13) và dùng "dòng bảng tính" ở mọi nơi khác, với §15 là ánh xạ duy nhất. Nếu bạn đổi tên phần để dùng cách đánh số bảng tính, tài liệu ngừng khớp với rubric bài tập — đó là thứ giảng viên kiểm tra.

2. **Task 10 là một phần với bốn yêu cầu con có chữ cái (10a–10d), không phải bốn nhiệm vụ.** Nó trị giá 1 điểm trong rubric, nhưng có bốn khối tiêu chí chấp nhận riêng biệt và ba test được chấm rõ ràng. Tách nó thành bốn mục backlog sẽ xuyên tạc cách chấm điểm; làm phẳng nó thành một danh sách bullet sẽ che giấu rằng mỗi yêu cầu con có test riêng. Các tiểu mục có chữ cái là thỏa hiệp, và 10a/10b/10c được gắn nhãn "một trong ba test được chấm" để không ai quên giảng viên tìm test nào.

3. **Tôi biến sự đồng ý về giá giữa Task 4 và Task 6 thành một tiêu chí chấp nhận rõ ràng** ("tổng của frontend và `lineTotal` được tính bởi backend khớp nhau ... được xác minh bằng một fixture dùng chung"). Đây là lỗi tích hợp có khả năng xảy ra nhất trong MVP này — frontend tính một tổng, backend tính lại, và chúng trôi dạt. Biến nó thành một tiêu chí với fixture là cơ chế chứng minh mạnh hơn "chúng nên khớp nhau."

4. **Task 8 nói rõ idempotency *không* ở đây.** Thật hấp dẫn khi gộp idempotency vào nhiệm vụ thanh toán, nhưng bài tập đặt nó trong Task 10 và chấm nó bằng một test cụ thể (PDF §9). Tiêu chí của Task 8 nói rằng trùng lặp khi submit hai lần là một lỗ hổng đã biết mà Task 10 sửa — điều này làm cho demo trung thực và cho test của Task 10 một thứ để chứng minh.

5. **§16 (Ngoài phạm vi) là phần ngăn scope creep trong Sprint Planning.** Phần bên liên quan của PDF (§3.2) nói chức năng barista ngoài MVP, nhưng không có gì trong tài liệu nhóm nói điều đó cho đến bây giờ. Liệt kê các "không" rõ ràng có nghĩa là một cuộc trò chuyện Sprint Planning có thể trỏ đến nó thay vì tranh luận lại.

6. **Đồ thị phụ thuộc của §14 và bảng tham chiếu chéo của §15 là hai thứ làm cho tài liệu này hữu ích trong các Sprint, không chỉ lúc đóng Task 2.0.** Đồ thị là cách bạn quyết định cái gì có thể chạy song song; bảng là cách bạn tìm các dòng bảng tính khi bạn đánh dấu một cái gì đó `● Xong`. Không có cả hai, tài liệu này là một sản phẩm một lần.

7. **Một tham chiếu chuyển tiếp cần chú ý:** §17 nói "thêm màn hình xác thực vào `docs/design/wireframes.md`" — tài liệu đó (Task 5.0) là tiếp theo trong thứ tự Giai đoạn 1, và 5 wireframe của PDF không bao gồm màn hình xác thực. Hoặc tài liệu wireframe thêm màn hình thứ 6/7 cho login/register, hoặc tiêu chí chấp nhận frontend của Task 7 bị yếu đi. Tôi đặt nó trong mục còn mở thay vì âm thầm mở rộng phạm vi wireframe — quyết định của bạn vào lúc Task 5.0.