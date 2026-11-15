# BrewLite - Các Kịch bản Nghiệp vụ

**Trạng thái:** Sản phẩm bàn giao Giai đoạn 1, đóng 2026-10-22
**Người phụ trách:** H.Tài (Nhiệm vụ 4.0)
**Liên quan:** [Product Backlog](product-backlog.md), [Wireframes](../design/wireframes.md), [Hợp đồng API](../architecture/api-contract.md), [ADR 0004](../architecture/adr/0004-payment-mock-and-order-lifecycle.md), [Cấu hình](../config.md), PDF bài tập §5

Tài liệu này quy định các luồng nghiệp vụ mà BrewLite phải hỗ trợ. Nó là cầu nối giữa Product Backlog (xây cái gì) và Hợp đồng API (gọi như thế nào): mỗi kịch bản nêu các tác nhân, điều kiện kích hoạt, trình tự bước, và kết quả quan sát được. Kịch bản là nguồn cho các script test thủ công (Sprint review) và cho các hành trình Playwright trong `tests/e2e/` (Giai đoạn 2+).

> **Phạm vi:** các luồng từ mở ứng dụng đến xác nhận đơn hàng và lịch sử, cộng với các nhánh lỗi và hủy. Ngoài phạm vi: luồng phía barista, hoàn tiền, và bất cứ thứ gì được liệt kê trong `product-backlog.md` §16.

## 1. Cách đọc tài liệu này

- **ID kịch bản:** `S-<area><n>` — `S-MAIN`, `S-PAY`, `S-AUTH`, `S-CART`, `S-ORD`, `S-EDGE`. Ổn định; không bao giờ tái sử dụng.
- **Loại:** `Main` (happy path), `Alternative` (hợp lệ nhưng không mặc định), `Error` (thất bại kỳ vọng với kết quả cụ thể), `Cancel` (người dùng hủy).
- **Tiền điều kiện:** trạng thái hệ thống yêu cầu trước bước 1.
- **Các bước:** tác nhân làm gì và hệ thống làm gì, theo thứ tự.
- **Kết quả:** trạng thái cuối quan sát được — HTTP status, trạng thái đơn hàng, trạng thái giỏ hàng, route UI. Đây là thứ test khẳng định.
- **Traces to:** tiêu chí chấp nhận trong `product-backlog.md` mà kịch bản này chứng minh.

Một kịch bản không có kết quả kiểm thử được không phải là kịch bản; nó là một điều ước. Nếu một luồng được quy định bằng văn xuôi nhưng không có khẳng định, nó được gắn cờ trong §13.

## 2. Bảng thuật ngữ tác nhân và tiền điều kiện

| Tác nhân    | Mô tả                                                  |
| ----------- | ------------------------------------------------------ |
| Khách hàng  | Người dùng ẩn danh hoặc đã đăng nhập của ứng dụng web. |
| Ẩn danh     | Chưa đăng nhập; không có JWT.                          |
| Đã xác thực | Có JWT hợp lệ từ `POST /auth/login`.                   |
| Hệ thống    | API + DB + dịch vụ thanh toán giả lập.                 |

| Trạng thái     | Ý nghĩa                                 |
| -------------- | --------------------------------------- |
| Giỏ hàng trống | Zustand cart có 0 mục.                  |
| Còn stock      | Dòng stock của sản phẩm `quantity > 0`. |
| Hết stock      | Dòng stock của sản phẩm `quantity = 0`. |

## 3. Luồng chính — S-MAIN-1: Chọn, giỏ hàng, thanh toán, xác nhận

**Loại:** Main
**Traces to:** PDF §5 happy path; product-backlog Tasks 3, 4, 5, 6, 7, 8, 9.
**Sơ đồ:** `docs/diagrams/flows/flow-main-v1.mmd`.

**Tiền điều kiện:** Khách hàng đã xác thực. Menu đã tải. Còn stock cho mọi sản phẩm được chọn.

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                                                                                                                                      |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Khách hàng | Mở `/`. Hệ thống render lưới menu từ `GET /api/v1/products`.                                                                                                                       |
| 2   | Khách hàng | Click một sản phẩm. Hệ thống điều hướng đến `/products/[id]` và hiển thị tên, ảnh, giá cơ sở.                                                                                      |
| 3   | Khách hàng | Chọn size M và hai topping. Hệ thống cập nhật giá hiển thị một cách xác định (quy tắc Task 4, `ui-decisions.md` §4.2).                                                             |
| 4   | Khách hàng | Click "Thêm vào giỏ". Hệ thống thêm dòng vào Zustand cart và tăng huy hiệu header.                                                                                                 |
| 5   | Khách hàng | Lặp lại bước 2–4 cho sản phẩm thứ hai. Hệ thống hiển thị hai dòng trong giỏ hàng.                                                                                                  |
| 6   | Khách hàng | Mở `/cart`. Hệ thống liệt kê cả hai dòng với số lượng và tổng; tổng khớp với tổng các `lineTotal`.                                                                                 |
| 7   | Khách hàng | Click "Thanh toán". Hệ thống route đến `/checkout`, hiển thị cùng tổng và bộ chọn Wallet/Card.                                                                                     |
| 8   | Khách hàng | Chọn Wallet, xác nhận. Frontend gọi `POST /api/v1/orders` với giỏ hàng, rồi `POST /api/v1/payments` với id đơn hàng, phương thức, và một `Idempotency-Key`.                        |
| 9   | Hệ thống   | Đơn hàng được tạo `PENDING`; mock thanh toán trả về thành công; đơn hàng chuyển `PENDING → PAID`; stock giảm và `loyaltyPoints` tích lũy trong cùng transaction (ADR 0004 D1, D7). |
| 10  | Khách hàng | Hệ thống điều hướng đến `/orders/[code]/confirmation`, hiển thị mã đơn hàng và trạng thái `PAID` (route khóa bằng `code`, ADR 0004 D3).                                            |
| 11  | Khách hàng | Mở `/orders`. Hệ thống liệt kê đơn hàng với mã, ngày, tổng, trạng thái.                                                                                                            |

**Kết quả:** Đơn hàng được lưu với trạng thái `PAID`; trang xác nhận hiển thị mã; lịch sử liệt kê nó; giỏ hàng trống.

**Khẳng định cho test e2e:**
- `POST /api/v1/orders` trả về `201` với `id`, `code`, và `status: "PENDING"` của đơn hàng.
- `POST /api/v1/payments` trả về `200` với `status: "PAID"` và một `paymentId`.
- Route xác nhận chứa chuỗi `code` của đơn hàng.
- `GET /api/v1/orders/me` bao gồm đơn hàng mới.
- Cart store trống sau khi thành công.
- `User.loyaltyPoints` tăng thêm `floor(order.total / 1000)` (ADR 0004 D7).

## 4. Luồng xác thực — S-AUTH-*

### S-AUTH-1: Đăng ký rồi đăng nhập

**Loại:** Alternative
**Traces to:** Task 7 AC; `api-contract.md` §6–§7.

**Tiền điều kiện:** Ẩn danh. Email chưa được đăng ký.

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                                      |
| --- | ---------- | ---------------------------------------------------------------------------------- |
| 1   | Khách hàng | Mở `/auth/register`, submit tên, email, và mật khẩu đáp ứng chính sách.            |
| 2   | Hệ thống   | Hash mật khẩu với bcrypt, tạo người dùng, trả về `201`.                            |
| 3   | Khách hàng | Submit cùng email trên `/auth/login` với mật khẩu đúng.                            |
| 4   | Hệ thống   | Xác minh hash, trả về JWT. Frontend lưu token, đính kèm vào `POST /api/v1/orders`. |

**Kết quả:** Phiên đã xác thực; `POST /api/v1/orders` tiếp theo thành công.

**Khẳng định:** `201` khi đăng ký; `200` + `accessToken` khi đăng nhập; `POST /api/v1/orders` không token trả về `401`, có token trả về `201`.

### S-AUTH-2: Email trùng lặp

**Loại:** Error
**Traces to:** Task 7 AC ("email trùng lặp trả về 409").

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                                                                                              |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Khách hàng | Đăng ký với email đã tồn tại.                                                                                                              |
| 2   | Hệ thống   | Trả về `409` với `code: "EMAIL_TAKEN"` (`api-contract.md` §6). Thông điệp không cho phép liệt kê ngoài email mà người yêu cầu đã cung cấp. |

**Kết quả:** Không có người dùng mới; người dùng hiện có không bị ảnh hưởng.

**Khẳng định:** `409` với `code: "EMAIL_TAKEN"`; số lượng người dùng không đổi.

### S-AUTH-3: Sai mật khẩu

**Loại:** Error
**Traces to:** Task 7 AC ("sai mật khẩu trả về 401 với thông điệp chung").

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                                      |
| --- | ---------- | ---------------------------------------------------------------------------------- |
| 1   | Khách hàng | Submit email hợp lệ với mật khẩu sai.                                              |
| 2   | Hệ thống   | Trả về `401` với `code: "AUTH_INVALID"` và thông điệp chung "Invalid credentials". |

**Kết quả:** Không cấp token. Lỗi không phân biệt "email không tìm thấy" với "sai mật khẩu."

**Khẳng định:** `401`; body phản hồi giống hệt cho "sai mật khẩu" và "email không tồn tại."

## 5. Luồng giỏ hàng — S-CART-*

### S-CART-1: Thêm, đổi số lượng, xóa

**Loại:** Alternative
**Traces to:** Task 5 AC.

**Tiền điều kiện:** Giỏ hàng có một dòng, qty 1.

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                                                                                                    |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Khách hàng | Thêm lại cùng sản phẩm với cùng size và topping. Hệ thống tăng qty lên 2 (không tạo dòng trùng; quy tắc nhận dạng trong `ui-decisions.md` §5.1). |
| 2   | Khách hàng | Tăng qty lên 3 qua điều khiển giỏ hàng. Hệ thống cập nhật `lineTotal` và tổng.                                                                   |
| 3   | Khách hàng | Xóa dòng. Hệ thống xóa nó, huy hiệu về 0, tổng là 0.                                                                                             |

**Kết quả:** Giỏ hàng phản ánh mỗi thay đổi ngay lập tức; tổng tính lại trên mọi mutation.

**Khẳng định:** số dòng sau bước 1 là 1; `lineTotal = unitPrice × 3` sau bước 2; giỏ hàng trống sau bước 3.

### S-CART-2: Giỏ hàng tồn tại qua điều hướng

**Loại:** Alternative
**Traces to:** Task 5 AC ("tồn tại qua điều hướng phía client").

**Tiền điều kiện:** Giỏ hàng có mục.

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                       |
| --- | ---------- | --------------------------------------------------- |
| 1   | Khách hàng | Điều hướng từ `/cart` đến `/` rồi `/products/[id]`. |
| 2   | Hệ thống   | Huy hiệu giỏ hàng và nội dung `/cart` không đổi.    |

**Kết quả:** State tồn tại qua điều hướng phía client. **Không** qua reload đầy đủ — reload với giỏ hàng không trống hiển thị trạng thái trống; đây là hạn chế đã biết của Giai đoạn 1 (`ui-decisions.md` §5.1).

**Khẳng định:** sau khi điều hướng, `items.length` của cart store không đổi.

## 6. Luồng tạo đơn hàng — S-ORD-*

### S-ORD-1: Server tính lại giá (chống giả mạo)

**Loại:** Error (bảo mật)
**Traces to:** Task 6 AC ("server tính lại tổng; giá client bị bỏ qua").

**Tiền điều kiện:** Đã xác thực. Giỏ hàng hợp lệ.

| #   | Tác nhân    | Hành động / Phản hồi hệ thống                                                                                                |
| --- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | Kẻ tấn công | Gửi `POST /api/v1/orders` với `lineTotal` và `total` thấp hơn giá thật.                                                      |
| 2   | Hệ thống    | Tính lại từ giá sản phẩm; lưu tổng của server; phản hồi phản ánh tổng của server, không phải payload (`api-contract.md` §8). |

**Kết quả:** Tổng đơn hàng bằng giá do server tính. Payload bị giả mạo không có tác dụng.

**Khẳng định:** `order.total` được lưu bằng giá trị do fixture tính (`ui-decisions.md` §4.2); không phải giá trị của kẻ tấn công.

### S-ORD-2: Giỏ hàng trống

**Loại:** Error
**Traces to:** Task 6 AC ("giỏ hàng trống → 400").

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                 |
| --- | ---------- | ------------------------------------------------------------- |
| 1   | Khách hàng | `POST /api/v1/orders` với `items: []`.                        |
| 2   | Hệ thống   | Trả về `400` với `code: "CART_EMPTY"` (`api-contract.md` §8). |

**Kết quả:** Không có đơn hàng được tạo.

**Khẳng định:** `400` với `code: "CART_EMPTY"`; số lượng đơn hàng không đổi.

### S-ORD-3: Size không hợp lệ hoặc sản phẩm không tồn tại

**Loại:** Error
**Traces to:** Task 6 AC.

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                                            |
| --- | ---------- | ---------------------------------------------------------------------------------------- |
| 1   | Khách hàng | `POST /api/v1/orders` với `size: "XL"` hoặc một `productId` không có trong DB.           |
| 2   | Hệ thống   | Trả về `400` với `code: "INVALID_SIZE"` hoặc `"PRODUCT_NOT_FOUND"`, không bao giờ `500`. |

**Kết quả:** Không có đơn hàng được tạo; phong bì lỗi khớp với `api-contract.md` §8.

**Khẳng định:** mã trạng thái và `code` khớp với hợp đồng; không có `500`.

## 7. Luồng thanh toán — S-PAY-*

### S-PAY-1: Thanh toán thành công

**Loại:** Main (được bao trong S-MAIN-1 bước 8–9; được liệt kê riêng để nhắm mục tiêu test)
**Traces to:** Task 8 AC; ADR 0004 D1.

**Tiền điều kiện:** Đơn hàng `PENDING`. `PAYMENT_MOCK_MODE=success`.

**Kết quả:** `POST /api/v1/payments` → `200` với `status: "PAID"`; stock giảm; điểm trung thành tích lũy; xác nhận được hiển thị.

**Khẳng định:** trạng thái đơn hàng `PAID`; `loyaltyPointsEarned = floor(amount / 1000)` (ADR 0004 D7).

### S-PAY-2: Thanh toán thất bại — giỏ hàng được bảo toàn

**Loại:** Error
**Traces to:** Task 8 AC; PDF US-05 acceptance criteria; ADR 0004 D2.

**Tiền điều kiện:** Đơn hàng `PENDING`. `PAYMENT_MOCK_MODE=failure`.

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                                                                                                       |
| --- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Khách hàng | Xác nhận thanh toán. Hệ thống gọi `POST /api/v1/payments`; mock trả về thất bại.                                                                    |
| 2   | Hệ thống   | Đơn hàng → `PAYMENT_FAILED`; trả về **`200`** với body `{ status: "PAYMENT_FAILED", reason, retryable: true }` (ADR 0004 D2, `api-contract.md` §9). |
| 3   | Khách hàng | Hệ thống giữ nguyên giỏ hàng và hiển thị khả năng thử lại.                                                                                          |

**Kết quả:** Đơn hàng `PAYMENT_FAILED`; giỏ hàng không đổi; người dùng có thể thử lại. Không thay đổi stock, không có điểm.

**Khẳng định:** `items.length` của giỏ hàng không đổi; trạng thái đơn hàng `PAYMENT_FAILED`; stock không đổi; `loyaltyPoints` không đổi. Frontend phải kiểm tra `status` trong body, không phải `res.ok` (`api-contract.md` §14).

### S-PAY-3: Thử lại sau thất bại thành công

**Loại:** Alternative
**Traces to:** Task 8 AC ("thử lại sau thất bại thành công"); ADR 0004 D5.

**Tiền điều kiện:** Đơn hàng trước đó ở `PAYMENT_FAILED`. `PAYMENT_MOCK_MODE` được chuyển sang `success` (hoặc quy tắc thất bại của mock đã cạn, theo ADR 0004).

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                                                                                                                                                      |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Khách hàng | Click "thử lại" trên đơn hàng thất bại.                                                                                                                                                            |
| 2   | Hệ thống   | Tạo một **lần thử thanh toán mới** cho cùng đơn hàng, với một `Idempotency-Key` **mới** (ADR 0004 D5). Đơn hàng đi lại qua `PENDING` (PDF §9.1): khi thành công `PAYMENT_FAILED → PENDING → PAID`. |

**Kết quả:** Đơn hàng `PAID`. Lịch sử hiển thị một đơn hàng, không phải hai.

**Khẳng định:** một dòng đơn hàng; trạng thái `PAID`; hai dòng thanh toán (một `FAILED`, một `SUCCESS`).

### S-PAY-4: Submit hai lần trước Task 10b

**Loại:** Error (lỗ hổng đã biết)
**Traces to:** Ghi chú ngoài phạm vi Task 8; Task 10b sửa nó.

**Tiền điều kiện:** Chưa có thực thi idempotency key (Task 10b chưa merge).

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                       |
| --- | ---------- | --------------------------------------------------- |
| 1   | Khách hàng | Double-click "xác nhận thanh toán."                 |
| 2   | Hệ thống   | Có thể tạo hai lần thử thanh toán / hai khoản tính. |

**Kết quả:** Đây là một **lỗi đã biết** cho đến khi Task 10b hoàn thành. Script demo không được double-click. Được ghi ở đây để demo trung thực và để test của Task 10b có một trạng thái "trước" được ghi lại.

**Khẳng định (trước sửa):** được ghi lại, không được khẳng định. **Sau sửa (Task 10b):** S-PAY-5.

### S-PAY-5: Thanh toán idempotent (sau Task 10b)

**Loại:** Error (đồng thời)
**Traces to:** Task 10b AC; PDF §9 test (b); ADR 0004 D4.

**Tiền điều kiện:** Đơn hàng `PENDING`. Task 10b đã merge.

| #   | Tác nhân | Hành động / Phản hồi hệ thống                                                                                                  |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Client   | Gửi `POST /api/v1/payments` hai lần với **cùng** `Idempotency-Key` và cùng body.                                               |
| 2   | Hệ thống | Yêu cầu đầu tạo một thanh toán; yêu cầu thứ hai trả về **cùng** phản hồi (cùng `paymentId`), không tính hai lần (ADR 0004 D4). |

**Kết quả:** Một thanh toán, một khoản tính, một lần chuyển trạng thái đơn hàng.

**Khẳng định:** số lượng thanh toán cho đơn hàng là 1; cả hai phản hồi mang cùng `paymentId`; trạng thái đơn hàng `PAID` đúng một lần.

### S-PAY-6: Idempotency key được dùng lại với body khác

**Loại:** Error
**Traces to:** Task 10b AC ("phát lại với body khác nhưng cùng key bị từ chối"); ADR 0004 D4.

| #   | Tác nhân | Hành động / Phản hồi hệ thống                                                  |
| --- | -------- | ------------------------------------------------------------------------------ |
| 1   | Client   | Dùng lại một `Idempotency-Key` với `orderId` hoặc `amount` khác.               |
| 2   | Hệ thống | Trả về `409` với `code: "IDEMPOTENCY_CONFLICT"`; không tạo thanh toán thứ hai. |

**Kết quả:** Không có tác dụng phụ.

**Khẳng định:** `409` với `code: "IDEMPOTENCY_CONFLICT"`; số lượng thanh toán không đổi.

## 8. Luồng lịch sử đơn hàng — S-ORD-4

### S-ORD-4: Lịch sử và kiểm soát truy cập

**Loại:** Main + Error
**Traces to:** Task 9 AC; Task 7 guard AC; ADR 0004 D3.

**Tiền điều kiện:** Hai người dùng A và B, mỗi người có ít nhất một đơn hàng.

| #   | Tác nhân        | Hành động / Phản hồi hệ thống                                                                                                                                                                                    |
| --- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A (đã xác thực) | `GET /api/v1/orders/me` trả về các đơn hàng của A, mới nhất trước.                                                                                                                                               |
| 2   | A               | Cố mở trực tiếp route xác nhận của B `/orders/[code]/confirmation`. Hệ thống trả về `404` với `code: "ORDER_NOT_FOUND"` — cùng phản hồi như một code không tồn tại, để sự tồn tại đơn hàng của B không bị rò rỉ. |
| 3   | Ẩn danh         | `GET /api/v1/orders/me` → `401`.                                                                                                                                                                                 |

**Kết quả:** A chỉ thấy đơn hàng của A; truy cập chéo người dùng bị từ chối không rò rỉ thông tin.

**Khẳng định:** tập phản hồi của A loại trừ mã đơn hàng của B; yêu cầu ẩn danh `401`; route chéo người dùng render cùng thông điệp "không tìm thấy" an toàn (`wireframes.md` §8).

## 9. Luồng state machine — S-ORD-5 (sau Task 10a)

### S-ORD-5: Chuyển đổi không hợp lệ bị từ chối

**Loại:** Error
**Traces to:** Task 10a AC; PDF §9 test (a); ADR 0004 D1, D5.

**Tiền điều kiện:** Đơn hàng `COMPLETED` (kết thúc).

| #   | Tác nhân | Hành động / Phản hồi hệ thống                                                                                                              |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Client   | Yêu cầu chuyển đổi `COMPLETED → PAID` (hoặc bất kỳ cạnh nào không có trong sơ đồ).                                                         |
| 2   | Hệ thống | `assertTransition` ném lỗi; API trả về `409` với `code: "INVALID_STATE_TRANSITION"` và `from`/`to` vi phạm. Trạng thái đơn hàng không đổi. |

**Kết quả:** Đơn hàng vẫn `COMPLETED`; lỗi cụ thể, không phải `500` chung chung.

**Khẳng định:** trạng thái đơn hàng không đổi; body phản hồi nêu tên chuyển đổi. Sơ đồ: `docs/diagrams/flows/flow-order-state-v1.mmd`.

## 10. Stock đồng thời — S-ORD-6 (sau Task 10c)

### S-ORD-6: Đơn hàng đồng thời không bán quá

**Loại:** Error (đồng thời)
**Traces to:** Task 10c AC; PDF §9 test (c); ADR 0004 D1.

**Tiền điều kiện:** Stock sản phẩm = 1.

| #   | Tác nhân             | Hành động / Phản hồi hệ thống                                                                                                                      |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Client A và Client B | Cả hai submit thanh toán cho cùng sản phẩm, gần như đồng thời.                                                                                     |
| 2   | Hệ thống             | Transaction + khóa lạc quan trên `Product.version`: đúng một cái thành công; cái kia thất bại với `409` `code: "OUT_OF_STOCK"` (không phải `500`). |
| 3   | Hệ thống             | Stock cuối cùng = 0.                                                                                                                               |

**Kết quả:** Một đơn hàng `PAID`; một thanh toán bị từ chối; stock không bao giờ âm.

**Khẳng định:** số thanh toán thành công cho sản phẩm đó = 1; stock cuối cùng = 0; trạng thái yêu cầu bị từ chối là `409` với `code: "OUT_OF_STOCK"`.

## 11. Luồng hủy — S-CANCEL-1

**Loại:** Cancel
**Traces to:** PDF §5 flowchart ("Hủy / thanh toán lỗi"); ADR 0004 D1, D6.

**Tiền điều kiện:** Đơn hàng `PENDING`.

| #   | Tác nhân   | Hành động / Phản hồi hệ thống                                                                           |
| --- | ---------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Khách hàng | Bỏ checkout (điều hướng đi) mà không thanh toán.                                                        |
| 2   | Hệ thống   | Đơn hàng `PENDING` vẫn còn; **không có stock nào được đặt trước** (stock giảm tại `PAID`, ADR 0004 D1). |
| 3   | Hệ thống   | Không có dọn dẹp TTL trong Giai đoạn 1 (ADR 0004 D6); đơn hàng ở `PENDING` vô thời hạn.                 |

**Kết quả:** Không thanh toán, không ảnh hưởng stock, không điểm. Đơn hàng hiển thị trong lịch sử là `PENDING`.

**Khẳng định:** trạng thái đơn hàng `PENDING`; không có dòng thanh toán; stock không đổi.

## 12. Ma trận truy nguyên (kịch bản → backlog → test)

| Kịch bản   | Nhiệm vụ backlog | Test được chấm? | Playwright spec (Giai đoạn 2+)         | Thủ công (demo Giai đoạn 1) |
| ---------- | ---------------- | --------------- | -------------------------------------- | --------------------------- |
| S-MAIN-1   | 3,4,5,6,7,8,9    | —               | `checkout-journey.spec.ts`             | ✅                           |
| S-AUTH-1   | 7                | —               | `auth-register-login.spec.ts`          | ✅                           |
| S-AUTH-2   | 7                | —               | `auth-duplicate-email.spec.ts`         | —                           |
| S-AUTH-3   | 7                | —               | `auth-wrong-password.spec.ts`          | —                           |
| S-CART-1   | 5                | —               | `cart-mutations.spec.ts`               | ✅                           |
| S-CART-2   | 5                | —               | `cart-persistence.spec.ts`             | —                           |
| S-ORD-1    | 6                | —               | `orders-price-tamper.spec.ts`          | —                           |
| S-ORD-2    | 6                | —               | `orders-empty-cart.spec.ts`            | —                           |
| S-ORD-3    | 6                | —               | `orders-invalid-input.spec.ts`         | —                           |
| S-PAY-1    | 8                | —               | (bên trong `checkout-journey`)         | ✅                           |
| S-PAY-2    | 8                | —               | `payment-failure.spec.ts`              | ✅                           |
| S-PAY-3    | 8                | —               | `payment-retry.spec.ts`                | —                           |
| S-PAY-4    | 8                | —               | *lỗ hổng đã ghi*                       | —                           |
| S-PAY-5    | 10b              | **có (b)**      | `payment-idempotency.spec.ts`          | ✅                           |
| S-PAY-6    | 10b              | —               | `payment-idempotency-conflict.spec.ts` | —                           |
| S-ORD-4    | 7,9              | —               | `orders-history-acl.spec.ts`           | ✅                           |
| S-ORD-5    | 10a              | **có (a)**      | `order-state-machine.spec.ts`          | ✅                           |
| S-ORD-6    | 10c              | **có (c)**      | `orders-concurrent-stock.spec.ts`      | ✅                           |
| S-CANCEL-1 | 10a              | —               | `order-abandon.spec.ts`                | —                           |

Ba test được chấm (PDF §9) là S-PAY-5, S-ORD-5, S-ORD-6. Chúng phải pass trong CI và được trình diễn tại Sprint Review. Xem `test-strategy.md` §4 để biết cấp độ mà mỗi cái được chứng minh.

## 13. Các quyết định được đóng bởi ADR 0004

Khi tài liệu này lần đầu được soạn, sáu quyết định còn mở. Chúng hiện đã được đóng bởi ADR 0004 và hợp đồng API. Bảng này ghi lại việc đóng để người đọc tương lai không mở lại chúng.

| #   | Quyết định                                                 | Đóng bởi                           | Câu trả lời hiện tại                                                                           |
| --- | ---------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| D1  | Stock giảm khi tạo đơn hàng hay khi thanh toán thành công? | ADR 0004 D1                        | Khi thanh toán thành công (`PAID`), dưới khóa lạc quan trên `Product.version`.                 |
| D2  | `POST /payments` thất bại trả về `402` hay `200 + status`? | ADR 0004 D2; `api-contract.md` §9  | `200` với body `status: "PAYMENT_FAILED"`.                                                     |
| D3  | Route xác nhận khóa bằng `id` hay `code` của đơn hàng?     | ADR 0004 D3; `api-contract.md` §11 | Bằng `code`: `/orders/[code]/confirmation`.                                                    |
| D4  | Quy tắc tích lũy điểm trung thành là gì?                   | ADR 0004 D7                        | `floor(order.total / 1000)` điểm mỗi đơn hàng đã thanh toán; không đổi điểm trong Giai đoạn 1. |
| D5  | Thử lại tạo thanh toán mới hay dùng lại cái thất bại?      | ADR 0004 D5                        | Một lần thử thanh toán mới với `Idempotency-Key` mới; đơn hàng giữ nguyên.                     |
| D6  | Đơn hàng `PENDING` cũ có bị tự động hủy không?             | ADR 0004 D6                        | Không có TTL trong Giai đoạn 1; đơn hàng vẫn `PENDING`.                                        |

Bất kỳ quyết định mới nào phát sinh từ một kịch bản phải được ghi trong ADR liên quan (theo quy tắc 5 của ADR 0001) và bảng này được cập nhật trong cùng PR.

## 14. Những gì tài liệu này không bao gồm

- **Hành vi thị giác UI** (animation, copy chính xác) — `docs/design/ui-decisions.md`.
- **Hình dạng yêu cầu/phản hồi API** — `docs/architecture/api-contract.md`; kịch bản tham chiếu nó, không sao chép.
- **Kịch bản phi chức năng** (tải, độ trễ) — Giai đoạn 2+ `docs/testing/`.
- **Luồng barista/back-office** — ngoài MVP, `product-backlog.md` §16.