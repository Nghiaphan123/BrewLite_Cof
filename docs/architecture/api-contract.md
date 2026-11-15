# BrewLite - Hợp đồng API

**Trạng thái:** Sản phẩm bàn giao Giai đoạn 1
**Người phụ trách:** H.Tài (Nhiệm vụ 7.0)
**Liên quan:** [ADR 0005 (quy ước)](adr/0005-api-contract-conventions.md), [ADR 0004 (thanh toán/vòng đời)](adr/0004-payment-mock-and-order-lifecycle.md), [ADR 0003 (cơ sở dữ liệu)](adr/0003-database-postgres-prisma.md), [Scenarios](../requirements/scenarios.md), [Product Backlog](../requirements/product-backlog.md), [Cấu hình](../config.md), [Quyết định UI](../design/ui-decisions.md), [Wireframes](../design/wireframes.md)

Tài liệu này quy định mọi endpoint HTTP trong MVP của BrewLite. Nó là hợp đồng giữa `apps/api` và `apps/web`: API triển khai nó, web client tiêu thụ nó, và các test e2e trong `scenarios.md` §12 khẳng định nó. Các endpoint không được liệt kê ở đây không thuộc MVP.

> **Quy ước nằm trong [ADR 0005](adr/0005-api-contract-conventions.md).** Tài liệu này không lặp lại C1–C10; nó trích dẫn chúng. Nếu một quy tắc ở đây xung đột với một ADR, ADR thắng và tài liệu này sai.

## 1. Phạm vi và URL cơ sở

- **Đường dẫn cơ sở:** `/api/v1` (C1). Mọi endpoint dưới đây là tương đối so với nó.
- **URL cơ sở trong dev:** `http://localhost:3001/api/v1` (cổng API; xem `config.md` §1.2). Frontend đọc `NEXT_PUBLIC_API_URL` bao gồm `/api/v1`.
- **Content type:** `application/json` cho mọi body yêu cầu và phản hồi, trừ `204`.
- **Mã hóa ký tự:** UTF-8. Văn bản tiếng Việt trong phản hồi là UTF-8, không bị HTML-escape.
- **Xác thực:** `Authorization: Bearer <jwt>` trên các route được bảo vệ (C4). Các route công khai được ghi chú theo từng endpoint.

Các endpoint trong bài tập (PDF §12.1): `GET /products`, `GET /products/:id`, `POST /auth/register`, `POST /auth/login`, `POST /orders`, `POST /payments`, `GET /orders/me`. Cộng với `GET /orders/:code` (cần cho màn hình xác nhận, `wireframes.md` §8) và `GET /health` (dùng bởi `setup.md` §8). Task 10 thêm các endpoint promo/loyalty (không thuộc các endpoint Giai đoạn 1 dưới đây; được liệt kê trong §9 như dự trữ).

## 2. Tóm tắt endpoint

| Method        | Đường dẫn                                                                             | Xác thực  | Thành công                                     | Tham chiếu |
| ------------- | ------------------------------------------------------------------------------------- | --------- | ---------------------------------------------- | ---------- |
| `GET`         | `/health`                                                                             | Công khai | `200 { status, version }`                      | §3         |
| `GET`         | `/products`                                                                           | Công khai | `200 { items, total }`                         | §4         |
| `GET`         | `/products/:id`                                                                       | Công khai | `200 Product` / `404`                          | §5         |
| `POST`        | `/auth/register`                                                                      | Công khai | `201 { user }` / `409`                         | §6         |
| `POST`        | `/auth/login`                                                                         | Công khai | `200 { accessToken, expiresIn, user }` / `401` | §7         |
| `GET`         | `/auth/me`                                                                            | **JWT**   | `200 UserProfile` / `401`                      | §7.1       |
| `PATCH`       | `/auth/password`                                                                      | **JWT**   | `200 { message }` / `400` / `401`              | §7.2       |
| `POST`        | `/orders`                                                                             | **JWT**   | `201 Order` / `400` / `401`                    | §8         |
| `POST`        | `/payments`                                                                           | **JWT**   | `200 PaymentResult` / `400` / `401` / `409`    | §9         |
| `GET`         | `/orders/me`                                                                          | **JWT**   | `200 { items, total }` / `401`                 | §10        |
| `GET`         | `/orders/:code`                                                                       | **JWT**   | `200 Order` / `404`                            | §11        |
| `GET`         | `/cart`                                                                               | **JWT**   | `200 Cart` / `401`                             | §11.1      |
| `PUT`         | `/cart`                                                                               | **JWT**   | `200 Cart` / `400` / `401` / `404`             | §11.1      |
| `GET`/`PATCH` | `/admin/products`, `/admin/toppings` (stock)                                          | **Admin** | `200` / `400` / `403` / `404`                  | §11.2      |
| `PATCH`       | `/admin/users/:id/block`, `/admin/promotions/:id/active`, `/admin/toppings/:id/price` | **Admin** | `200` / `400` / `403` / `404` / `409`          | §11.3      |

`/health`, `GET /products`, `GET /products/:id`, `POST /auth/register`, và `POST /auth/login` là công khai. Hồ sơ người dùng và thay đổi mật khẩu, đơn hàng, thanh toán, và giỏ hàng đã lưu yêu cầu JWT.

## 3. `GET /api/v1/health`

**Xác thực:** Công khai.
**Mục đích:** kiểm tra liveness và phiên bản (`setup.md` §8).

**Phản hồi `200`:**
```json
{ "status": "ok", "version": "v1" }
```

Không có phản hồi khác. Không cache; không giới hạn tốc độ trong Giai đoạn 1.

## 4. `GET /api/v1/products`

**Xác thực:** Công khai.
**Mục đích:** danh sách menu (`scenarios.md` S-MAIN-1 bước 1; `product-backlog.md` Task 2/3).
**Tham số truy vấn:** không trong Giai đoạn 1. Phân trang được dự trữ (C9) nhưng chưa triển khai.

**Phản hồi `200` (bộ sưu tập C2):**
```json
{
  "items": [
    {
      "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
      "name": "Cà phê sữa",
      "price": 35000,
      "imageUrl": "https://cdn.example.com/ca-phe-sua.jpg",
      "stock": 20
    },
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Americano",
      "price": 40000,
      "imageUrl": "https://cdn.example.com/americano.jpg",
      "stock": 15
    }
  ],
  "total": 2
}
```

**Quy tắc:**
- `price` và `stock` là số nguyên (`config.md` §3; C7).
- `total` là độ dài mảng trong Giai đoạn 1 (C9).
- Thứ tự các mục ổn định (theo `name` tăng dần, hoặc theo cột `sortOrder` nếu được thêm trong ERD của Task 1.0). Frontend không sắp xếp lại.
- Menu trống trả về `{ "items": [], "total": 0 }` với `200`, không phải `404`. UI hiển thị trạng thái trống (`wireframes.md` §4).
- `imageUrl` là tuyệt đối; frontend render trực tiếp. Ảnh sản phẩm được lưu trong `apps/web/public/images/products/` dưới dạng `1.jpg` đến `30.jpg`. Trong `apps/api/prisma/seed.ts`, mỗi sản phẩm được seed dùng `/images/products/<n>.jpg`, trong đó `<n>` là vị trí 1-based của nó trong mảng `products`. Giữ thứ tự seed và tên tệp khớp nhau khi thêm hoặc sắp xếp lại sản phẩm.

**Lỗi:** không có lỗi kỳ vọng cho một yêu cầu hợp lệ. Lỗi DB trả về `500` (C3) với `requestId` (C10).

## 5. `GET /api/v1/products/:id`

**Xác thực:** Công khai.
**Mục đích:** chi tiết sản phẩm (`scenarios.md` S-MAIN-1 bước 2; `product-backlog.md` Task 4).

**Tham số đường dẫn:** `id` — UUID của sản phẩm. Phải là UUID hợp lệ; id sai định dạng trả về `404` (không phải `400`) để tránh rò rỉ thông tin định dạng id.

**Phản hồi `200` (tài nguyên đơn C2):**
```json
{
  "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
  "name": "Cà phê sữa",
  "price": 35000,
  "imageUrl": "https://cdn.example.com/ca-phe-sua.jpg",
  "stock": 20,
  "sizes": ["S", "M", "L"],
  "toppings": [
    { "id": "t1", "name": "Trân châu", "price": 5000, "stock": 40 },
    { "id": "t2", "name": "Kem", "price": 7000, "stock": 0 }
  ]
}
```

**Quy tắc:**
- `sizes` và `toppings` được trả về ở đây, không phải trên endpoint danh sách, để giữ phản hồi menu nhỏ. Trang chi tiết dùng chúng để render bộ chọn (`wireframes.md` §5).
- `price` cơ sở là giá size **S**. Giá theo size được tính bởi quy tắc giá (`ui-decisions.md` §4.2), không được trả về dưới dạng bảng. Nếu nhóm sau này muốn một bảng giá theo size, thêm `sizePrices: { S: 35000, M: 40000, L: 45000 }` — bổ sung không phá vỡ.
- `toppings` là danh mục đầy đủ; một sản phẩm có thể hạn chế topping sau này (Giai đoạn 2+). Trong Giai đoạn 1 mọi sản phẩm chấp nhận mọi topping.
- `toppings[].stock` là số phần còn lại. Mỗi ly có topping dùng một phần, được lấy tại thanh toán (§9). Web vô hiệu hóa một topping có `stock` là `0`.

**Phản hồi `404` (C3):**
```json
{ "statusCode": 404, "error": "Not Found", "message": "Product not found", "code": "PRODUCT_NOT_FOUND" }
```

**Lỗi:** `404` cho id không tồn tại; `500` cho lỗi DB. UUID sai định dạng → `404` (xem ở trên).

## 6. `POST /api/v1/auth/register`

**Xác thực:** Công khai.
**Mục đích:** tạo tài khoản (`scenarios.md` S-AUTH-1, S-AUTH-2; `product-backlog.md` Task 7).

**Body yêu cầu:**
```json
{ "name": "An Nguyen", "email": "an@example.com", "password": "correct-horse-battery" }
```

**Validate (`class-validator`):**
- `name`: 2–80 ký tự sau khi trim.
- `email`: định dạng email hợp lệ, được chuẩn hóa thành chữ thường trước khi lưu.
- `password`: ≥ 8 ký tự, ít nhất một chữ cái và một chữ số. Cùng quy tắc được thực thi phía client (`wireframes.md` §10); nếu một cái thay đổi, cả hai thay đổi.

**Phản hồi `201`:**
```json
{
  "user": { "id": "a3f1...", "name": "An Nguyen", "email": "an@example.com", "loyaltyPoints": 0 }
}
```

Không có token được trả về ở đây. Client gọi `POST /auth/login` sau khi đăng ký (`scenarios.md` S-AUTH-1 bước 3). Tự động đăng nhập khi đăng ký không thuộc hợp đồng; nếu nhóm thêm nó, nó trả về cùng body như `/auth/login` và phần này được cập nhật.

**Phản hồi `400` (C3):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "email must be an email" },
    { "field": "password", "message": "password must be at least 8 characters" }
  ]
}
```

**Phản hồi `409` (C3):**
```json
{ "statusCode": 409, "error": "Conflict", "message": "Email already registered", "code": "EMAIL_TAKEN" }
```

**Quy tắc:**
- Mật khẩu được hash bcrypt với `BCRYPT_ROUNDS` (`config.md` §2.1). Hash không bao giờ xuất hiện trong bất kỳ phản hồi nào.
- Email trùng lặp trả về `409`, không bao giờ `200` với body "user exists" (không liệt kê tài khoản ngoài email rõ ràng mà người yêu cầu đã biết).
- `loyaltyPoints` bắt đầu từ `0`.

## 7. `POST /api/v1/auth/login`

**Xác thực:** Công khai.
**Mục đích:** xác thực và nhận JWT (`scenarios.md` S-AUTH-1, S-AUTH-3; `product-backlog.md` Task 7).

**Body yêu cầu:**
```json
{ "email": "an@example.com", "password": "correct-horse-battery" }
```

**Phản hồi `200`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": { "id": "a3f1...", "name": "An Nguyen", "email": "an@example.com", "loyaltyPoints": 12 }
}
```

**Quy tắc:**
- `expiresIn` là giây, khớp với `JWT_EXPIRES_IN=1d` (`config.md` §2.1). Frontend có thể dùng nó để cảnh báo trước khi hết hạn; Giai đoạn 1 không refresh.
- Payload JWT chứa `sub` (id người dùng), `email`, và `iat`/`exp`. Nó **không** chứa `loyaltyPoints` (sẽ bị cũ); frontend lấy người dùng qua `GET /auth/me` tương lai nếu cần. Giai đoạn 1 chỉ đọc `loyaltyPoints` từ phản hồi login/register.

**Phản hồi `401` (C3):**
```json
{ "statusCode": 401, "error": "Unauthorized", "message": "Invalid credentials", "code": "AUTH_INVALID" }
```

**Phản hồi `403`** khi một admin đã chặn tài khoản (§11.3). Nó chỉ được trả về sau khi mật khẩu đã được kiểm tra, nên mật khẩu sai vẫn trả lời `401`:
```json
{ "statusCode": 403, "error": "Forbidden", "message": "This account has been blocked", "code": "ACCOUNT_BLOCKED" }
```

## 7.1. `GET /api/v1/auth/me`

**Xác thực:** JWT. Chỉ trả về hồ sơ của người dùng đã xác thực; hash mật khẩu không bao giờ được chọn.

**Phản hồi `200`:**
```json
{
  "id": "a3f1...",
  "name": "An Nguyen",
  "email": "an@example.com",
  "loyaltyPoints": 12,
  "createdAt": "2026-01-15T00:00:00.000Z"
}
```

## 7.2. `PATCH /api/v1/auth/password`

**Xác thực:** JWT.

**Body yêu cầu:**
```json
{ "currentPassword": "correct-horse-battery", "newPassword": "another-correct-password" }
```

Mật khẩu hiện tại phải được xác minh trước khi lưu một hash bcrypt của mật khẩu mới. Mật khẩu mới phải có ít nhất 8 ký tự và chứa một chữ cái và một chữ số. Mật khẩu hiện tại không đúng trả về `401 CURRENT_PASSWORD_INVALID`.

**Quy tắc:**
- Body `401` là **giống hệt** cho "email không tồn tại" và "sai mật khẩu" (`scenarios.md` S-AUTH-3). Không trả về "email not found."
- Không giới hạn tốc độ trong Giai đoạn 1; một mục Giai đoạn 2+.

## 8. `POST /api/v1/orders`

**Xác thực:** **Yêu cầu JWT** (C4). Token thiếu hoặc không hợp lệ → `401` với `code: "AUTH_REQUIRED"` hoặc `"AUTH_EXPIRED"`.
**Mục đích:** tạo một đơn hàng `PENDING` từ giỏ hàng (`scenarios.md` S-MAIN-1 bước 8, S-ORD-1..3; `product-backlog.md` Task 6).

**Body yêu cầu:**
```json
{
  "items": [
    { "productId": "0f8fad5b-...", "size": "M", "toppingIds": ["t1", "t2"], "qty": 2 },
    { "productId": "7c9e6679-...", "size": "S", "toppingIds": [], "qty": 1 }
  ]
}
```

**Validate (`class-validator`):**
- `items`: mảng không rỗng; mỗi mục có `productId` (UUID), `size` (`S`|`M`|`L`), `toppingIds` (mảng chuỗi, có thể rỗng), `qty` (số nguyên ≥ 1, ≤ 99).
- `productId` không tồn tại → `400` với `code: "PRODUCT_NOT_FOUND"` (cụ thể, không phải lỗi validate chung).
- `toppingId` không tồn tại cho một sản phẩm hợp lệ → `400` với `code: "TOPPING_NOT_FOUND"`.
- `size` không nằm trong `sizes` của sản phẩm → `400` với `code: "INVALID_SIZE"`.

**Hành vi server:**
- **Tính lại `total` và từng `lineTotal` từ DB.** Giá do client cung cấp bị bỏ qua (`scenarios.md` S-ORD-1). Quy tắc giá là fixture dùng chung (`ui-decisions.md` §4.2): giá đơn vị = giá S + phụ phí size (S 0, M 5.000, L 10.000) + giá topping.
- Tạo `Order` với `status = "PENDING"`, `userId` từ JWT, `createdAt`, và `code` (D3). **Không giảm stock** (ADR 0004 D1).
- Tạo các dòng `OrderItem` với `productId`, `size`, `qty`, `lineTotal`, và các id topping.
- Trả về `201` với tóm tắt đơn hàng; client sau đó gọi `POST /payments` (`scenarios.md` S-MAIN-1 bước 8).

**Phản hồi `201`:**
```json
{
  "id": "8a1c...",
  "code": "BL-2026-0001",
  "status": "PENDING",
  "total": 95000,
  "items": [
    { "productId": "0f8fad5b-...", "name": "Cà phê sữa", "size": "M", "qty": 2, "lineTotal": 80000 },
    { "productId": "7c9e6679-...", "name": "Americano", "size": "S", "qty": 1, "lineTotal": 15000 }
  ],
  "createdAt": "2026-10-22T14:30:00.000Z"
}
```

**Quy tắc:**
- Định dạng `code` đơn hàng là `BL-YYYY-NNNN` (năm + số thứ tự zero-padded theo năm). Số thứ tự được server tạo, duy nhất, bất biến. Được ghi ở đây như quyết định đóng câu hỏi mở của ADR 0004.
- `id` là UUID, được bao gồm để liên kết nội bộ nhưng **không** được dùng trong URL hướng đến người dùng (D3: route xác nhận khóa bằng `code`).
- `items` rỗng → `400` với `code: "CART_EMPTY"` (`scenarios.md` S-ORD-2).
- Phản hồi bao gồm `items` với `name` được resolve cho màn hình xác nhận; client không cần gọi thứ hai để render tóm tắt xác nhận.
- **Không có idempotency key ở đây** (ADR 0004 D4). Submit hai lần tạo hai đơn hàng; đây là hạn chế đã ghi (`scenarios.md` S-PAY-4), không phải vi phạm hợp đồng.

**Lỗi:**
- `400` validate (`code: "VALIDATION_FAILED"` với `details`).
- `400` `CART_EMPTY`, `PRODUCT_NOT_FOUND`, `TOPPING_NOT_FOUND`, `INVALID_SIZE`.
- `401` thiếu/hết hạn JWT.
- `500` bất ngờ (C3, C10).

## 9. `POST /api/v1/payments`

**Xác thực:** **Yêu cầu JWT**. Đơn hàng phải thuộc về người gọi; một đơn hàng chéo người dùng trả về `404` (không phải `403`, để tránh rò rỉ sự tồn tại — `scenarios.md` S-ORD-4).
**Mục đích:** thanh toán một đơn hàng `PENDING` hoặc `PAYMENT_FAILED` (`scenarios.md` S-MAIN-1 bước 8–9, S-PAY-1..6; `product-backlog.md` Task 8, Task 10b).

**Header:**
- `Idempotency-Key: <uuid>` — **bắt buộc** (C5, ADR 0004 D4). Thiếu → `400` với `code: "IDEMPOTENCY_KEY_REQUIRED"`.

**Body yêu cầu:**
```json
{ "orderId": "8a1c...", "method": "WALLET" }
```

`method` ∈ `WALLET` | `CARD`. `orderId` là `id` DB từ `POST /orders` (không phải `code`; code dành cho URL).

**Hành vi server (ADR 0004):**
- Bên trong một `prisma.$transaction`:
  1. Tra cứu đơn hàng; nếu không tìm thấy hoặc không thuộc người gọi → `404`.
  2. Khẳng định trạng thái hiện tại là `PENDING` hoặc `PAYMENT_FAILED`; nếu không → `409` với `code: "INVALID_STATE_TRANSITION"` (Task 10a).
  3. Kiểm tra stock cho mọi mục dưới khóa lạc quan (`version`); nếu không đủ → `409` với `code: "OUT_OF_STOCK"` (Task 10c). Stock topping được kiểm tra cho toàn bộ đơn hàng (một phần mỗi ly, cộng dồn qua các dòng) với cập nhật có điều kiện (`stock >= needed`); nếu một topping bị thiếu → `409` `OUT_OF_STOCK` và không có gì bị giảm.
  4. Gọi cổng mock (`PAYMENT_MOCK_MODE`; `config.md` §2.1).
  5. Khi thành công: giảm stock đồ uống và topping, chuyển sang `PAID`, tích lũy điểm trung thành (ADR 0004 D1, D7). Hủy một đơn hàng `PAID` trả lại cả hai.
  6. Khi thất bại: chuyển sang `PAYMENT_FAILED`, không thay đổi stock, không điểm.
  7. Lưu dòng `Payment` với `idempotencyKey`, `requestHash`, `method`, `amount`, `status`.
- Nếu `idempotencyKey` đã tồn tại:
  - Cùng `requestHash` → trả về phản hồi đã lưu (cùng payment id, cùng trạng thái đơn hàng).
  - Khác `requestHash` → `409` với `code: "IDEMPOTENCY_CONFLICT"` (ADR 0004 D4; `scenarios.md` S-PAY-6).

**Phản hồi `200` (thành công):**
```json
{
  "orderId": "8a1c...",
  "orderCode": "BL-2026-0001",
  "status": "PAID",
  "paymentId": "p_9f2a...",
  "amount": 95000,
  "method": "WALLET",
  "paidAt": "2026-10-22T14:31:00.000Z",
  "loyaltyPointsEarned": 95,
  "userLoyaltyPoints": 107
}
```

**Phản hồi `200` (thanh toán thất bại — ADR 0004 D2):**
```json
{
  "orderId": "8a1c...",
  "orderCode": "BL-2026-0001",
  "status": "PAYMENT_FAILED",
  "paymentId": "p_9f2b...",
  "reason": "MOCK_DECLINED",
  "retryable": true
}
```

**Quy tắc:**
- Thất bại là `200` với `status: "PAYMENT_FAILED"`, không phải `402` (ADR 0004 D2). Frontend kiểm tra `status` trong body, không phải `res.ok`.
- Đơn hàng vẫn có thể truy xuất; giỏ hàng được bảo toàn (`scenarios.md` S-PAY-2). Người dùng thử lại với một `Idempotency-Key` **mới** (ADR 0004 D5); đơn hàng đi `PAYMENT_FAILED → PENDING → PAID` khi thành công, hoặc trở lại `PAYMENT_FAILED` nếu lần thử lại cũng thất bại (PDF §9.1). Một lần phát lại key của lần thử trước đó trả lời kết quả của chính lần thử đó.
- `loyaltyPointsEarned` = `floor(amount / 1000)` (ADR 0004 D7). `userLoyaltyPoints` là tổng sau tích lũy.
- Một lần phát lại với cùng key và cùng body trả về **cùng** body phản hồi (bao gồm `paymentId`), ngay cả khi lần gốc là thất bại. Idempotency bao gồm cả hai kết quả, không chỉ thành công.

**Lỗi:**
- `400` body thiếu/không hợp lệ, thiếu `Idempotency-Key` (`IDEMPOTENCY_KEY_REQUIRED`).
- `401` thiếu/hết hạn JWT.
- `404` đơn hàng không tìm thấy hoặc không thuộc (`ORDER_NOT_FOUND`).
- `409` `INVALID_STATE_TRANSITION`, `OUT_OF_STOCK`, `IDEMPOTENCY_CONFLICT`.
- `500` bất ngờ.

## 10. `GET /api/v1/orders/me`

**Xác thực:** **Yêu cầu JWT**.
**Mục đích:** lịch sử đơn hàng (`scenarios.md` S-ORD-4; `product-backlog.md` Task 9; `wireframes.md` §11).

**Tham số truy vấn:** không trong Giai đoạn 1. Phân trang dự trữ (C9).

**Phản hồi `200` (bộ sưu tập C2):**
```json
{
  "items": [
    {
      "id": "8a1c...",
      "code": "BL-2026-0001",
      "status": "PAID",
      "total": 95000,
      "items": [
        {
          "productId": "0f8fad5b-...",
          "name": "Cà phê sữa",
          "size": "M",
          "qty": 2,
          "lineTotal": 90000,
          "toppings": [{ "id": "20000000-...", "name": "Trân châu đen", "price": 5000 }]
        }
      ],
      "createdAt": "2026-10-22T14:30:00.000Z"
    },
    {
      "id": "7b0d...",
      "code": "BL-2026-0000",
      "status": "PAYMENT_FAILED",
      "total": 45000,
      "items": [],
      "createdAt": "2026-10-21T09:00:00.000Z"
    }
  ],
  "total": 2
}
```

**Quy tắc:**
- Sắp xếp theo `createdAt` **giảm dần** (mới nhất trước; `wireframes.md` §11). Sắp xếp phía server, không phải phía client.
- Chỉ đơn hàng của người gọi. Đơn hàng chéo người dùng vắng mặt, không phải `403`.
- Mỗi đơn hàng bao gồm các dòng mục của nó với tên sản phẩm và topping, vì màn hình lịch sử hiển thị những gì đã mua. `toppings[].price` là ảnh chụp giá từ thời điểm đặt hàng.
- Lịch sử trống trả về `{ "items": [], "total": 0 }` với `200`; UI hiển thị trạng thái trống.

**Lỗi:** `401` thiếu/hết hạn JWT; `500` bất ngờ.

## 11. `GET /api/v1/orders/:code`

**Xác thực:** **Yêu cầu JWT**. Theo phạm vi chủ sở hữu.
**Mục đích:** xác nhận và chi tiết đơn hàng (`scenarios.md` S-MAIN-1 bước 10, S-ORD-4; `wireframes.md` §8).

**Tham số đường dẫn:** `code` — mã đơn hàng dễ đọc (`BL-YYYY-NNNN`), không phải UUID (ADR 0004 D3).

**Phản hồi `200`:**
```json
{
  "id": "8a1c...",
  "code": "BL-2026-0001",
  "status": "PAID",
  "total": 95000,
  "items": [
    { "productId": "0f8fad5b-...", "name": "Cà phê sữa", "size": "M", "qty": 2, "lineTotal": 80000 },
    { "productId": "7c9e6679-...", "name": "Americano", "size": "S", "qty": 1, "lineTotal": 15000 }
  ],
  "payment": {
    "method": "WALLET",
    "paidAt": "2026-10-22T14:31:00.000Z",
    "loyaltyPointsEarned": 95
  },
  "createdAt": "2026-10-22T14:30:00.000Z"
}
```

**Quy tắc:**
- `payment` là `null` nếu đơn hàng chưa từng có thanh toán thành công (ví dụ `PENDING` hoặc tất cả lần thử `PAYMENT_FAILED`). Màn hình xác nhận (`wireframes.md` §8) render huy hiệu trạng thái tương ứng.
- Mã đơn hàng là khóa URL; `id` được bao gồm để liên kết nội bộ nhưng không được dùng trong URL hướng đến người dùng.
- **Không tìm thấy và không phải của bạn đều trả về `404`** với `code: "ORDER_NOT_FOUND"` (`scenarios.md` S-ORD-4 bước 2). UI hiển thị cùng thông điệp an toàn cho cả hai (`wireframes.md` §8).

**Lỗi:** `401` thiếu/hết hạn JWT; `404` không tìm thấy hoặc không thuộc; `500` bất ngờ.

## 11.1. `GET` và `PUT /api/v1/cart`

**Xác thực:** **Yêu cầu JWT** (C4). Người dùng đến từ token; có một giỏ hàng mỗi người dùng.
**Mục đích:** giữ giỏ hàng của khách hàng đã đăng nhập qua các thiết bị. Giỏ hàng của khách vãng lai chỉ ở trong trình duyệt. Ứng dụng web gộp nó vào giỏ hàng đã lưu khi đăng nhập và xóa bản sao trong trình duyệt khi đăng xuất.

**Body yêu cầu `PUT`** (thay thế toàn bộ giỏ hàng; `items: []` xóa nó):
```json
{
  "items": [
    { "productId": "0f8fad5b-...", "size": "M", "toppingIds": ["20000000-..."], "qty": 2 }
  ],
  "promoCode": "BREW10"
}
```

**Validate:** `items` là một mảng tối đa 100 dòng; mỗi dòng có `productId` (UUID), `size` (`S`|`M`|`L`), `toppingIds` (tùy chọn, tối đa 20 chuỗi), và `qty` (số nguyên 1..99). `promoCode` là chuỗi tùy chọn tối đa 40 ký tự. Các dòng có cùng sản phẩm, size, và topping được gộp, với `qty` giới hạn ở 99.

**Phản hồi `200`** (cả hai phương thức; một người dùng không có giỏ hàng đã lưu nhận `items: []`, `promoCode: ""`, và `promotion: null`):
```json
{
  "items": [
    {
      "productId": "0f8fad5b-...",
      "size": "M",
      "qty": 2,
      "toppingIds": ["pearl"],
      "toppings": [{ "id": "pearl", "name": "Trân châu đen", "price": 5000, "stock": 12 }],
      "product": { "id": "0f8fad5b-...", "name": "Latte", "price": 45000, "imageUrl": "/images/products/10.jpg", "stock": 3 }
    }
  ],
  "promoCode": "BREW10",
  "promotion": { "code": "BREW10", "type": "PERCENT", "value": 10, "minOrderTotal": 0 }
}
```

**Quy tắc:**
- Giỏ hàng không đặt trước stock và không validate `promoCode`. Cả hai được kiểm tra bởi luồng đơn hàng và thanh toán (§8, §9).
- `product.stock` và `toppings[].stock` được đọc trực tiếp trên mỗi `GET`, để web có thể cảnh báo về một đồ uống hoặc topping đã hết sau khi giỏ hàng được lưu. Chúng chỉ là thông tin; thanh toán thực thi stock.
- `promotion` là quy tắc web dùng để xem trước giảm giá. Nó là `null` khi mã không xác định, không hoạt động, hết hạn, hoặc đã dùng hết.
- Giỏ hàng không lưu giá. `POST /orders` tính số tiền từ giá server.
- `toppingIds` không có khóa ngoại: một topping bị xóa hoặc không hoạt động sẽ rơi khỏi phản hồi.

**Lỗi:** `400` validate; `401` thiếu/hết hạn JWT; `404` với `code: "PRODUCT_NOT_FOUND"` cho một sản phẩm không xác định (giỏ hàng đã lưu không đổi); `500` bất ngờ.

## 11.2. Endpoint stock admin

**Xác thực:** JWT với vai trò `ADMIN` (C4); người dùng khác nhận `403`.

| Method  | Đường dẫn                   | Body              | Thành công                                   |
| ------- | --------------------------- | ----------------- | -------------------------------------------- |
| `GET`   | `/admin/products`           | —                 | `200 [{ id, name, price, imageUrl, stock }]` |
| `PATCH` | `/admin/products/:id/stock` | `{ "stock": 25 }` | `200 { id, name, price, imageUrl, stock }`   |
| `GET`   | `/admin/toppings`           | —                 | `200 [{ id, name, price, stock, active }]`   |
| `PATCH` | `/admin/toppings/:id/stock` | `{ "stock": 50 }` | `200 { id, name, price, stock, active }`     |

**Quy tắc:**
- `stock` là số tuyệt đối mới (ly cho đồ uống, phần cho topping), một số nguyên từ `0`; đồ uống chấp nhận tối đa `100000`.
- Đặt stock của đồ uống cũng tăng `Product.version`, để một thanh toán đã đọc stock cũ không thể ghi đè giá trị mới (ADR 0004 D1).

**Lỗi:** `400` validate (âm, không phải số nguyên); `401`; `403` không phải admin; `404` `PRODUCT_NOT_FOUND` / `TOPPING_NOT_FOUND` cho một id không xác định hoặc sai định dạng.

## 11.3. Endpoint quản lý admin

**Xác thực:** JWT với vai trò `ADMIN` (C4); người dùng khác nhận `403`.

| Method  | Đường dẫn                      | Body                  | Thành công                                                                   |
| ------- | ------------------------------ | --------------------- | ---------------------------------------------------------------------------- |
| `GET`   | `/admin/users`                 | —                     | `200 [{ id, name, email, role, blocked, loyaltyPoints, createdAt, _count }]` |
| `PATCH` | `/admin/users/:id/block`       | `{ "blocked": true }` | `200 { id, name, email, role, blocked }`                                     |
| `PATCH` | `/admin/promotions/:id/active` | `{ "active": false }` | `200 Promotion`                                                              |
| `PATCH` | `/admin/toppings/:id/price`    | `{ "price": 7000 }`   | `200 { id, name, price, stock, active }`                                     |

**Quy tắc:**
- **Chặn:** một người dùng bị chặn nhận `403 ACCOUNT_BLOCKED` khi đăng nhập (§7), và `JwtAuthGuard` từ chối các token họ đã giữ với cùng lỗi, nên việc chặn có hiệu lực ngay lập tức. `blocked: false` mở lại tài khoản. Một tài khoản `ADMIN` không thể bị chặn (`409 CANNOT_BLOCK_ADMIN`), để một admin không thể tự khóa mình ra ngoài.
- **Hủy khuyến mãi:** `active: false` hủy mã; đơn hàng mới dùng nó nhận `400 PROMO_INACTIVE` và bản xem trước giỏ hàng trả về `promotion: null`. Các đơn hàng đã dùng nó giữ giảm giá của chúng. `active: true` bật lại.
- **Giá topping:** toàn bộ VND, `0..100000`. Đơn hàng mới dùng nó ngay lập tức; đơn hàng trước đây giữ giá được lưu trong `order_item_toppings.unit_price`.

**Lỗi:** `400` validate; `401`; `403` không phải admin; `404` `USER_NOT_FOUND` / `PROMOTION_NOT_FOUND` / `TOPPING_NOT_FOUND`; `409` `CANNOT_BLOCK_ADMIN`.

## 12. Endpoint dự trữ (Task 10, không phải Giai đoạn 1)

Những endpoint này được liệt kê để frontend và API đồng ý về hình dạng trước khi Task 10 thêm chúng. Chúng **không** được triển khai trong Giai đoạn 1 và không thuộc tiêu chí chấp nhận của Task 7.0.

| Method | Đường dẫn                | Mục đích                                                 | Ghi chú                                                                                                                                                                                                                                                                       |
| ------ | ------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/orders/:code/cancel`   | Hủy một đơn hàng `PENDING`                               | ADR 0004 D6 nói không tự động hủy; hủy rõ ràng là một bổ sung Giai đoạn 2 khả thi.                                                                                                                                                                                            |
| `POST` | `/orders/:id/transition` | Điều khiển chuyển trạng thái đơn hàng (test được chấm a) | Chỉ nhân viên: JWT với vai trò `ADMIN` (khách hàng nhận `403`). Chỉ các cạnh không phải thanh toán của PDF §9.1 được phép; `→ PENDING`, `→ PAID`, `→ PAYMENT_FAILED` trả lời `409 INVALID_STATE_TRANSITION` (ADR 0004, "Chuyển đổi thủ công"). Không thuộc API MVP công khai. |
| `POST` | `/promotions/validate`   | Validate một mã khuyến mãi                               | Task 10d; `product-backlog.md` §13 10d.                                                                                                                                                                                                                                       |
| `GET`  | `/loyalty/me`            | Số dư điểm hiện tại                                      | Task 10d; phản hồi login/register mang `loyaltyPoints` trong Giai đoạn 1.                                                                                                                                                                                                     |

Nếu bất kỳ cái nào được thêm, nó tuân theo quy ước ADR 0005 và được thêm vào cuối tài liệu này.

## 13. Hành vi xuyên suốt

Đây là các quy ước từ ADR 0005 áp dụng cho mọi endpoint; được liệt kê ở đây để tiện.

- **Phong bì lỗi:** C3. Mọi body `4xx`/`5xx` khớp với nó.
- **Dấu thời gian:** C6. ISO 8601 UTC với mili giây.
- **Tiền:** C7. Số nguyên VND.
- **Correlation id:** C10. Mọi phản hồi có `X-Request-Id`; body `500` bao gồm nó.
- **Không có wrapper `{ data }`:** C2. Tài nguyên đơn được trả về trực tiếp; bộ sưu tập là `{ items, total }`.
- **Xác thực:** C4. `Authorization: Bearer <jwt>`.
- **Idempotency:** C5. `Idempotency-Key` bắt buộc chỉ cho `POST /payments`.

## 14. Ghi chú tích hợp frontend

- **Client:** `apps/web/src/lib/api.ts` có một `request<T>(path, init)` đặt URL cơ sở, đính kèm JWT khi có, đặt `Content-Type`, đính kèm `Idempotency-Key` cho thanh toán, và ánh xạ phong bì lỗi C3 thành một `ApiError` có kiểu. Mọi tính năng gọi hàm này; không tính năng nào gọi `fetch` trực tiếp.
- **Xử lý thanh toán:** vì thất bại là `200 + status` (ADR 0004 D2), trình xử lý thanh toán kiểm tra `body.status === "PAID"` và không phải `res.ok`. Đây là nơi duy nhất mà phản xạ "kiểm tra `res.ok`" là sai.
- **Lưu trữ token:** `localStorage` dưới `brewlite.token` (`ui-decisions.md` §5.2). Client xóa nó khi `401` `code: "AUTH_EXPIRED"` và chuyển hướng đến `/auth/login`.
- **URL cơ sở:** `NEXT_PUBLIC_API_URL` bao gồm `/api/v1` (`config.md` §2.2). Không nối `/api/v1` trong `api.ts`; biến env sở hữu nó.

## 15. Mục còn mở

| Mục                                                                                                 | Người phụ trách | Đóng khi                                  |
| --------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------- |
| Xác nhận `GET /products` bao gồm `sizes`/`toppings` chỉ trên chi tiết, không phải danh sách         | Nghĩa           | Task 2.0/4.0 `● Xong`                     |
| Xác nhận phản hồi `POST /orders` bao gồm `name` của mục đã resolve (tránh gọi thứ hai cho xác nhận) | H.Tài           | Task 6.0 `● Xong`                         |
| Xác nhận chuỗi code `BL-YYYY-NNNN` là theo năm và do server tạo                                     | Nghĩa           | ERD Task 1.0 (sequence/unique constraint) |
| Xác nhận thử lại thanh toán dùng `Idempotency-Key` mới (ADR 0004 D5)                                | H.Tài           | Task 8.0 `● Xong`                         |
| Quyết định liệu `GET /orders/me` có phân trang trong Giai đoạn 1 (hiện không)                       | H.Tài           | Sprint 3 Planning                         |
| Cập nhật `config.md` §7 (phong bì lỗi, `Idempotency-Key`) để trỏ đến tài liệu này                   | H.Tài           | Cùng PR chấp nhận ADR 0005                |
| Cập nhật `scenarios.md` §13 (D2, D3 đã đóng) để trỏ đến tài liệu này                                | H.Tài           | Cùng PR                                   |
| Cập nhật `wireframes.md` §8 và `ui-decisions.md` §2 cho route `[code]` (ADR 0004 D3)                | Nghĩa           | Cùng PR chấp nhận ADR 0004                |
| Thêm `HttpExceptionFilter` (C3) trong Task 7.0 hoặc Task 11.0                                       | H.Tài           | Task 7.0 `● Xong`                         |

## 16. Tham khảo

- PDF bài tập §12.1 (danh sách endpoint), §12.2 (thực thể), §4.3 (US-05), §9.2 (idempotency).
- [ADR 0005](adr/0005-api-contract-conventions.md) — các quy ước C1–C10 mà tài liệu này tham chiếu.
- [ADR 0004](adr/0004-payment-mock-and-order-lifecycle.md) — D1 (stock tại `PAID`), D2 (`200 + status`), D3 (`code` đơn hàng), D4 (idempotency), D5 (thử lại), D7 (loyalty).
- [ADR 0003](adr/0003-database-postgres-prisma.md) — `price Int`, `version` cho khóa.
- [Cấu hình](../config.md) §2.1 (`JWT_EXPIRES_IN`, `PAYMENT_MOCK_MODE`), §2.2 (`NEXT_PUBLIC_API_URL`), §3 (tiền tệ, trạng thái, `Idempotency-Key`).
- [Scenarios](../requirements/scenarios.md) §3–§10 (các luồng mà hợp đồng này phục vụ), §13 (D2, D3 đã đóng ở đây).
- [Product Backlog](../requirements/product-backlog.md) Task 6, 7, 8, 9, 10 (tiêu chí chấp nhận).
- [Quyết định UI](../design/ui-decisions.md) §2 (route), §4 (tiền), §5 (xác thực).
- [Wireframes](../design/wireframes.md) §4–§11 (màn hình tiêu thụ các endpoint này).

---

## Ghi chú về các lựa chọn tôi đã đưa ra (để bạn chấp nhận hoặc ghi đè)

1. **Tài liệu trích dẫn ADR 0005 theo ID phần (`C3`, `C7`) thay vì lặp lại quy ước.** Đây là quyết định cấu trúc quan trọng nhất: nếu `api-contract.md` lặp lại phong bì lỗi, dòng "error envelope" của `config.md` §7 sẽ có hai nguồn chân lý, và một thay đổi ở một cái sẽ âm thầm phân kỳ. Trích dẫn `C3` có nghĩa là có đúng một nơi để thay đổi phong bì, và tài liệu này vẫn là một spec *hình dạng*, không phải spec *quy ước*.

2. **Các phần endpoint theo một template cố định: Auth / Purpose / Request / Response / Rules / Errors.** Điều đó nhàm chán và đó là điểm — một reviewer hoặc dev frontend có thể nhảy đến bất kỳ phần nào và biết tìm ở đâu. Dòng `Purpose` trích các ID `scenarios.md` và nhiệm vụ `product-backlog.md`, nên mọi endpoint truy nguyên đến một yêu cầu. Đây là "truy nguyên" mà ghi chú bằng chứng của bảng tính sẽ trỏ đến.

3. **Phản hồi `POST /orders` bao gồm `name` của mục đã resolve, và tôi đã gắn cờ nó như một mục còn mở.** Đây là một ngã ba thiết kế thực sự: trả về tên có nghĩa là phản hồi tạo đơn hàng tự đủ cho màn hình xác nhận; không trả về chúng có nghĩa là client cần gọi thứ hai. Phiên bản tự đủ là thứ mà `wireframes.md` §8 giả định (trang xác nhận render mà không cần fetch thứ hai), nên tôi viết nó theo cách đó — nhưng nếu nhóm thích một `POST /orders` gọn hơn và một fetch thứ hai khi xác nhận, đây là nơi để lật. Mục còn mở cho quyết định đó một chỗ.

4. **`GET /orders/:code` được thêm dù PDF §12.1 không liệt kê nó.** PDF liệt kê `GET /orders/me` nhưng màn hình xác nhận (`wireframes.md` §8) cần chi tiết một đơn hàng. `GET /orders/me` trả về tóm tắt; không có endpoint chi tiết, màn hình xác nhận sẽ phải lọc lịch sử phía client, điều này hỏng cho một đơn hàng mới mà lịch sử chưa refresh. Endpoint chi tiết là một phương thức controller Nest và nó đóng tham chiếu chuyển tiếp "render `GET /orders/:id`" của `wireframes.md` §8 (được cập nhật thành `:code` theo ADR 0004 D3).

5. **Định dạng code `BL-YYYY-NNNN` được quyết định ở đây, không phải trong ADR 0004.** ADR 0004 D3 nói "định dạng được quyết định trong `api-contract.md`" — đây là quyết định đó. Đặt nó ở đây thay vì trong ADR giữ ADR về *quyết định dùng một code*, và tài liệu này về *định dạng*. Nếu định dạng cần thay đổi (ví dụ thành `BL-26-0001`), đó là một chỉnh sửa một dòng cho tài liệu này và dòng mục còn mở của nó.

6. **`GET /products` trả về danh sách không có `sizes`/`toppings`, và `GET /products/:id` trả về chúng.** Điều này giữ phản hồi menu nhỏ (một lưới card cần tên/giá/ảnh, không phải bảng size) và khớp với `wireframes.md` §4 (card menu chỉ hiển thị giá cơ sở) và §5 (màn hình chi tiết hiển thị bộ chọn). Nếu menu sau này cần lọc theo size, sự phân tách này là thứ cần xem lại — nhưng đó là mối quan tâm Giai đoạn 2.

7. **Đường thất bại của `POST /payments` trả về `200` với `status: "PAYMENT_FAILED"`, và phần này nói *hai lần* rằng frontend phải kiểm tra `body.status`, không phải `res.ok`.** ADR 0004 D2 là *quyết định*; đây là *hệ quả hợp đồng*, và đây là nơi có khả năng cao nhất cho một lỗi frontend. Nêu nó trong phần endpoint và một lần nữa trong §14 là sự dư thừa có chủ ý — trình xử lý thanh toán là nơi duy nhất mà phản xạ "kiểm tra `res.ok`" là sai, và một dev junior sẽ làm sai trừ khi được nói hai lần.

8. **§12 (endpoint dự trữ) là một thiết bị kiểm soát phạm vi.** Task 10 thêm khuyến mãi và loyalty, và frontend cuối cùng sẽ cần một endpoint validate promo. Liệt kê chúng là "dự trữ, không phải Giai đoạn 1" có nghĩa là frontend có thể được thiết kế theo hình dạng mà không ai nghĩ chúng thuộc phạm vi. Nó cũng ngăn một reviewer hỏi "endpoint promo đâu?" — câu trả lời là "§12, Task 10, không phải bây giờ."

9. **§15 (mục còn mở) có chín dòng, và ba trong số đó là cập nhật chéo tài liệu** (`config.md` §7, `scenarios.md` §13, `wireframes.md`/`ui-decisions.md` cho route `[code]`). Đó là nhiều cho một tài liệu, nhưng chúng đều là hệ quả của bốn ADR mà hợp đồng này được xây trên — khi một ADR được chấp nhận, các tài liệu phụ thuộc của nó phải được cập nhật, và bảng này là checklist. Lựa chọn thay thế (cập nhật chúng âm thầm trong PR của ADR mà không có checklist) là cách tài liệu trôi dạt.

10. **Một điểm không nhất quán nhỏ cần sửa trong `wireframes.md` sau tài liệu này:** §8 của `wireframes.md` nói route xác nhận render `GET /orders/:id`; với ADR 0004 D3 và tài liệu này, nó là `GET /orders/:code`. Điều đó đã có trên bảng mục còn mở (dòng thứ tám của §15), nhưng đáng gắn cờ ở đây vì cả kiểm kê màn hình §1 và layout §8 của `wireframes.md` đều nói `[id]`. Việc cập nhật là máy móc: `:id` → `:code` ở ba nơi trong `wireframes.md` và hai nơi trong `ui-decisions.md` §2.