# BrewLite - Kịch bản demo bàn giao

**Dùng cho:** buổi Sprint Review / Demo cuối Sprint 3 (Mục 11 đề Assignment 1)  
**Cập nhật theo:** `main` ngày 10/11/2026 (có PR #14, #15 và chọn size trên thẻ món)  
**Liên quan:** [README](../README.md), [Local deployment](deployment.md), [Scenarios](requirements/scenarios.md), [Test strategy §7](testing/test-strategy.md), [Checklist đề bài](brewlite-checklist.md), Retro [Sprint 1](plans/retro-sprint-1.md), [Sprint 2](plans/retro-sprint-2.md), [Sprint 3](plans/retro-sprint-3.md)

Mục 11 của đề yêu cầu buổi bàn giao gồm 4 phần. Tài liệu này đi theo đúng thứ tự đó:

1. Trình diễn luồng end-to-end: chọn sản phẩm → giỏ hàng → thanh toán → xác nhận đơn (§3, §4).
2. Bàn giao mã nguồn (Git), `docker-compose` chạy được, README (§6).
3. Trình bày Sprint Retrospective (các file `docs/plans/retro-sprint-*.md`).
4. Nhận phản hồi của "khách hàng" và ghi vào backlog cho phiên bản sau (§7).

## 1. Phân công

Nhóm điền trước buổi demo.

| Phần                                      | Người trình bày | Người hỗ trợ (máy, terminal) |
| ----------------------------------------- | --------------- | ---------------------------- |
| Giới thiệu sản phẩm và kiến trúc (2 phút) |                 |                              |
| Luồng chính (§3)                          |                 |                              |
| Tình huống phụ (§4.1–§4.3)                |                 |                              |
| Trang quản trị (§4.4)                     |                 |                              |
| Chứng minh nghiệp vụ Task 10 (§5)         |                 |                              |
| Bàn giao Git, Docker, README (§6)         |                 |                              |
| Sprint Retrospective                      |                 |                              |
| Ghi nhận phản hồi (§7)                    |                 |                              |

## 2. Chuẩn bị trước buổi demo

### 2.1 Trước 1 ngày

- [ ] Kéo code mới nhất của `main`: `git switch main` rồi `git pull`.
- [ ] Build lại image: `docker compose up --build -d`. **Bắt buộc có `--build`**: image cũ không có các chức năng mới. Lần build đầu rất lâu trên máy ít RAM (máy 8 GB đo được khoảng 80 phút), **không để đến lúc demo mới build**. API tự chạy migration mới (`add_user_blocked`) khi khởi động.
- [ ] Nạp dữ liệu mẫu: `docker compose exec api npm run db:seed`.
- [ ] Chạy thử toàn bộ kịch bản này một lần và ghi kết quả vào §8.
- [ ] Ổ đĩa còn trống ít nhất vài GB (image web và API chiếm khoảng 2,2 GB).

**Cách dự phòng nhanh hơn (không build image):** chạy database trong Docker, API và web trên máy (README, mục "Run the apps on your machine"): `docker compose up -d db`, rồi trong `apps/api` chạy `npm run db:deploy`, `npm run db:generate`, `npm run start:dev`, và trong `apps/web` chạy `npm run dev`. Lần đầu mở mỗi trang sẽ chậm vài chục giây vì trang được biên dịch lúc đó, nên **mở trước tất cả các trang một lần**.

### 2.2 Trước 30 phút

- [ ] `.env` có `PAYMENT_MOCK_MODE=success`.
- [ ] Bật hệ thống, đợi `docker compose ps` báo `api` là `(healthy)`.
- [ ] Đưa dữ liệu về trạng thái sạch (các lần tập demo trước có thể đã đổi tồn kho, giá, khoá tài khoản hoặc huỷ mã). Seed không tự đặt lại những thứ này:

  ```powershell
  docker compose exec db psql -U brewlite -d brewlite -c "UPDATE products SET stock = 1, version = version + 1 WHERE name = 'Cà phê phin giới hạn'; UPDATE toppings SET stock = 50, price = 5000; UPDATE users SET blocked = false; UPDATE promotions SET active = true;"
  ```

  Nếu `.env` đổi `POSTGRES_USER` hoặc `POSTGRES_DB`, thay `brewlite` bằng giá trị trong `.env`.
- [ ] Mở sẵn trình duyệt:
  - Tab 1: http://localhost:3000, chưa đăng nhập.
  - Tab 2: cửa sổ ẩn danh để đăng nhập admin ở http://localhost:3000/admin.
  - Bật chế độ thiết bị di động (F12 → Toggle device toolbar) vì BrewLite là web mobile-first.
- [ ] Mở sẵn 1 terminal ở thư mục `apps/api` nếu sẽ chạy test ở §5.
- [ ] Đóng các ứng dụng nặng khác để máy không bị chậm.

### 2.3 Tài khoản dùng khi demo

| Vai trò     | Email                      | Mật khẩu       |
| ----------- | -------------------------- | -------------- |
| Khách hàng  | `customer01@brewlite.test` | `Brewlite@123` |
| Khách dự bị | `customer02@brewlite.test` | `Brewlite@123` |
| Quản trị    | `admin@brewlite.vn`        | `123456`       |

Mã khuyến mãi: `WELCOME20K` (giảm 20.000₫ cho đơn từ 50.000₫), `BREW10` (giảm 10%).

## 3. Luồng chính (khoảng 5 phút)

Giá dùng trong kịch bản: Latte size S 45.000₫, size M cộng 5.000₫, size L cộng 10.000₫, mỗi topping 5.000₫.

| #   | Thao tác                                                                                     | Điều cần chỉ cho thầy                                                                   | Kết quả mong đợi                                     |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | Mở http://localhost:3000                                                                     | Chưa đăng nhập thì được đưa đến trang đăng nhập/đăng ký                                 | Trang đăng nhập hiện ra                              |
| 2   | (Tuỳ chọn) Bấm đăng ký, nhập họ tên, email mới, mật khẩu ngắn hoặc thiếu số                 | Form kiểm tra dữ liệu, mật khẩu cần ít nhất 8 ký tự gồm chữ và số                       | Báo lỗi rõ ràng, không gửi form                      |
| 3   | Đăng nhập `customer01`                                                                       | JWT được cấp, tên khách hiện ở header                                                   | Chuyển đến `/menu`                                   |
| 4   | Xem menu                                                                                     | Trạng thái đang tải rồi lưới sản phẩm có ảnh, tên, giá                                 | 30 món hiển thị                                      |
| 5   | Trên thẻ một món, bấm chọn size **L**                                                        | Giá trên thẻ đổi theo size ngay tại menu                                                | Giá tăng 10.000₫ so với size S                       |
| 6   | Bấm **"Thêm vào giỏ"** trên thẻ đó                                                           | Thông báo "Đã thêm … (size L) vào giỏ", badge giỏ hàng tăng                             | Badge = 1                                            |
| 7   | Mở **Latte**, chọn size **M**, thêm 2 topping (ví dụ Trân châu đen, Kem cheese), số lượng 2 | Giá cập nhật ngay khi đổi tuỳ chọn: (45.000 + 5.000 + 10.000) × 2                       | Tạm tính **120.000₫**                                |
| 8   | Thêm vào giỏ, mở giỏ hàng, đổi số lượng một món                                              | Tổng tiền tự tính lại                                                                   | Tổng đúng                                            |
| 9   | Nhập mã `WELCOME20K`, bấm **Áp dụng**                                                        | Giảm giá áp dụng và hiện trên tổng                                                      | Giảm 20.000₫                                         |
| 10  | Chỉ vào nút **Thanh toán**                                                                   | Nút hiện tổng tiền (tiêu chí US-05)                                                     | `Thanh toán · <tổng>₫`                               |
| 11  | Bấm Thanh toán, chọn **Ví điện tử** (hoặc **Thẻ ngân hàng**), làm theo bước xác nhận demo   | Cổng thanh toán là mô phỏng, không dùng tiền thật                                       | Thanh toán thành công                                |
| 12  | Màn hình xác nhận                                                                            | Mã đơn dạng `BL-2026-xxxx`, trạng thái **PAID**, danh sách món, tổng tiền, điểm tích luỹ | "Đặt hàng thành công"                                |
| 13  | Mở **Lịch sử đơn** (`/orders`)                                                               | Đơn vừa đặt nằm đầu danh sách, cùng mã đơn                                              | Bấm vào đơn mở được chi tiết                         |
| 14  | Mở trang tài khoản                                                                           | Điểm tích luỹ tăng (1 điểm cho mỗi 1.000₫ đã thanh toán)                                | Điểm khớp với tổng đơn                               |
| 15  | (Tuỳ chọn) Về menu, bấm **"Mua ngay"** trên một thẻ món                                      | Lối tắt: thêm món vào giỏ và đi thẳng tới trang thanh toán                              | Mở `/checkout` với món vừa chọn                       |

## 4. Tình huống phụ (chọn theo thời gian còn lại)

### 4.1 Thanh toán thất bại, giỏ hàng được giữ, thử lại thành công

Khởi động lại API mất vài phút trên máy chậm, nên làm phần này cuối buổi hoặc đổi chế độ trước khi bắt đầu.

1. Sửa `.env`: `PAYMENT_MOCK_MODE=failure`, rồi chạy `docker compose up -d api` (chạy kiểu phát triển thì tắt rồi chạy lại `npm run start:dev`). Đợi API sẵn sàng.
2. Đặt một đơn mới và bấm thanh toán.
   - Kết quả mong đợi: thông báo "Thanh toán thất bại. Giỏ hàng của bạn vẫn được giữ nguyên…", và đơn ở trạng thái `PAYMENT_FAILED`.
   - Mở giỏ hàng: các món vẫn còn.
3. Sửa lại `PAYMENT_MOCK_MODE=success`, khởi động lại API, rồi bấm xác nhận lại trên cùng đơn đó.
   - Kết quả mong đợi: đơn chuyển `PAYMENT_FAILED → PENDING → PAID`, đúng sơ đồ §9.1 của đề, và giỏ hàng được xoá.

### 4.2 Món hết hàng

1. Mua món **Cà phê phin giới hạn** (tồn kho 1) với số lượng 1 và thanh toán thành công.
2. Mở lại món đó từ menu: nút thêm vào giỏ đổi thành **Hết hàng** và không bấm được.

### 4.3 Topping hết hàng

1. Ở trang admin, tab **Topping & Tồn kho**, đặt "Kem cheese" = 0, bấm **Lưu**.
2. Ở tab khách, mở lại một món: "Kem cheese" có nhãn **"Hết"** và không chọn được.
3. (Giải thích nếu thầy hỏi) Khi thanh toán, mỗi ly có topping dùng 1 phần topping đó. Nếu không đủ, cả đơn bị từ chối và không trừ gì; hai khách cùng mua phần cuối thì chỉ một người mua được.

### 4.4 Trang quản trị

Ở tab ẩn danh, đăng nhập `admin@brewlite.vn` và mở `/admin`.

| Tab                    | Thao tác                                                                                           | Kết quả mong đợi                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Món & Tồn kho          | Tìm "phin giới hạn", nhập 5, bấm **Lưu**                                                           | Thông báo xanh, trạng thái đổi sang "Sắp hết"                                                          |
| Topping & Tồn kho      | Đổi giá "Thạch cà phê" thành 7000, bấm **Lưu giá**; mở món ở tab khách                              | Trang món hiện +7.000₫; đơn đã đặt trước đó vẫn giữ giá cũ                                              |
| Người dùng             | Bấm **Khoá** ở `customer02`, xác nhận; ở tab khách đăng nhập `customer02`                          | Báo "Tài khoản của bạn đã bị khoá…". Dòng quản trị viên không có nút Khoá                               |
| Người dùng             | Bấm **Mở khoá** `customer02`, đăng nhập lại                                                        | Đăng nhập được                                                                                          |
| Mã khuyến mãi          | Bấm **Huỷ mã** ở `BREW10`, xác nhận; ở tab khách áp mã `BREW10` rồi đặt đơn                        | Mã bị từ chối "Mã khuyến mãi không còn hiệu lực."; bấm **Kích hoạt lại** để dùng tiếp                  |
| Lịch sử đơn hàng       | Tìm đơn vừa đặt (`PAID`), chuyển lần lượt `PREPARING → READY → COMPLETED`                           | Ô chọn chỉ đưa ra bước hợp lệ tiếp theo (không nhảy cóc); khách tải lại trang chi tiết đơn thấy trạng thái mới |
| Lịch sử đơn hàng       | (Tuỳ chọn) Huỷ một đơn `PAID`                                                                      | Tồn kho món, tồn kho topping và điểm tích luỹ được trả lại                                              |

Xong phần này thì **đưa dữ liệu về như cũ** bằng lệnh ở §2.2 (hoặc bấm ngược lại trên trang admin).

## 5. Chứng minh nghiệp vụ Task 10 bằng test

Đây là 3 bài test đề dùng để chấm Task 10. Chạy trong `apps/api` (cần `npm install` và database đang chạy; test dùng database riêng `brewlite_test` nên không ảnh hưởng dữ liệu demo):

```powershell
npx vitest run src/modules/orders/order-state-machine.spec.ts
npx vitest run --config ./vitest.config.e2e.ts test/order-state-machine.e2e-spec.ts test/payments.e2e-spec.ts test/orders-concurrent-stock.e2e-spec.ts
```

| Yêu cầu của đề                                            | Test cần chỉ ra                                                                          |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| (a) Chuyển trạng thái sai bị từ chối                      | `COMPLETED → PAID`, `CANCELLED → PENDING`, `PAID → READY` đều trả 409                    |
| (b) Gửi 2 lần cùng `Idempotency-Key` chỉ tạo 1 thanh toán | "same Idempotency-Key + same body -> one payment, same paymentId"                        |
| (c) Đặt đồng thời không bán quá tồn kho                   | "two parallel payments for stock 1: one PAID, one 409 OUT_OF_STOCK, stock 0"             |

Nếu thầy hỏi thêm về phần mở rộng: `test/admin-stock.e2e-spec.ts` (tồn kho món và topping) và `test/admin-management.e2e-spec.ts` (khoá tài khoản, huỷ mã, giá topping).

Nếu không kịp chạy test trực tiếp, chụp sẵn kết quả chạy xanh để trình chiếu.

## 6. Bàn giao

| Hạng mục       | Chỉ cho thầy                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Mã nguồn (Git) | https://github.com/Nghiaphan123/BrewLite_Cof : nhánh `main`, các Pull Request, lịch sử commit                 |
| docker-compose | `docker compose ps`: 3 dịch vụ `db`, `api`, `web` đang chạy, `db` và `api` báo `healthy`                    |
| README         | Mục "Quick start with Docker Compose", tài khoản demo, cách chạy test                                        |
| Tài liệu       | `docs/`: backlog, wireframe, sơ đồ, ADR, API contract, kế hoạch Sprint, checklist đề bài, retro 3 sprint     |

## 7. Ghi nhận phản hồi của khách hàng

Một người ghi lại trong buổi demo, sau đó chép vào mục "Phản hồi của giảng viên" trong [retro Sprint 3](plans/retro-sprint-3.md) và đưa vào [product backlog](requirements/product-backlog.md) cho phiên bản sau.

| #   | Phản hồi của giảng viên | Ưu tiên (Cao/TB/Thấp) | Ghi vào backlog (mục/task) |
| --- | ----------------------- | --------------------- | -------------------------- |
| 1   |                         |                       |                            |
| 2   |                         |                       |                            |
| 3   |                         |                       |                            |

## 8. Kết quả chạy thử kịch bản

Theo [test strategy §7](testing/test-strategy.md), kết quả chạy kịch bản được ghi lại và đưa vào Retro note. Bước 12 (xác nhận đơn `PAID`) thất bại thì phải sửa trước buổi demo.

Hai dòng đầu là các lần kiểm tra đã làm trong lúc phát triển (gọi API trực tiếp và chụp màn hình, không bấm đủ mọi bước trên giao diện). Nhóm cần chạy đầy đủ kịch bản trên giao diện ít nhất một lần và ghi vào các dòng sau.

| Ngày  | Người chạy | Môi trường | Luồng chính (§3) | Thất bại và thử lại (§4.1) | Hết hàng (§4.2, §4.3) | Admin (§4.4) | Test Task 10 (§5) | Ghi chú |
| ----- | ---------- | ---------- | ---------------- | -------------------------- | --------------------- | ------------ | ----------------- | ------- |
| 08/11 | P.Tài | Docker (`main` lúc đó) | Đạt (qua API) | Chưa chạy | Chưa chạy | Chặn khách đổi trạng thái đơn: đạt | Đạt (e2e) | Tạo đơn, mã `WELCOME20K`, Ví → `PAID`, gửi lại cùng key không tạo thanh toán mới |
| 09/11 | P.Tài | Chạy trên máy (nhánh PR #14, #15) | Chưa chạy | Chưa chạy | Đạt (qua API và ảnh) | Đạt (qua API và ảnh) | Đạt (e2e) | Tồn kho topping, khoá tài khoản, huỷ mã, giá topping |
|       |            |            |                  |                            |                       |              |                   |         |

## 9. Phương án dự phòng

| Sự cố                                     | Xử lý                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Docker không chạy hoặc build quá lâu      | Chạy kiểu phát triển (xem §2.1, "Cách dự phòng nhanh hơn")                                                                    |
| Docker đang chạy code cũ                  | Thiếu `--build`: chạy `docker compose up --build -d`                                                                          |
| API báo `unhealthy` lúc mới bật           | Đợi thêm vài phút (đang chạy migration); xem `docker compose logs api`                                                       |
| API lỗi khi đăng nhập sau khi `git pull`  | Database thiếu migration mới: chạy `npm run db:deploy` trong `apps/api` (Docker tự chạy khi khởi động lại API)               |
| Menu trống                                | Chạy lại `docker compose exec api npm run db:seed`                                                                            |
| Lỗi CORS trên trình duyệt                 | Kiểm tra `CORS_ORIGIN=http://localhost:3000` trong `.env`, rồi `docker compose up -d api`                                    |
| Cổng 3000, 3001 hoặc 5432 bị chiếm        | Tắt chương trình đang dùng cổng, hoặc đổi cổng trong `.env` (xem README)                                                     |
| Máy demo hỏng                             | Dùng video quay sẵn luồng chính và ảnh chụp kết quả test                                                                      |
