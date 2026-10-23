# BrewLite — Đặc tả Giao diện & Wireframe (Wireframes Index)

**Trạng thái:** Sản phẩm bàn giao Phase 1 (Sprint 0)
**Phụ trách:** Nghĩa (Task 5)
**Tài liệu liên quan:** [UI Decisions](ui-decisions.md), [Product Backlog](../requirements/product-backlog.md), [Scenarios](../requirements/scenarios.md), [API Contract](../architecture/api-contract.md), [Kế hoạch 3 Sprint](../diagrams/sprint-plan.md), Đề bài PDF Mục 7
**Bản chạy tương tác (HTML Prototype):** 👉 [Mở giao diện 5 màn hình MVP (`wireframe-5.html`)](./wireframe-5.html)

Tài liệu này là danh mục quản lý toàn bộ wireframe của dự án **BrewLite**. Với mỗi màn hình, tài liệu quy định rõ đường dẫn (route), nguồn giao diện tham chiếu, các trạng thái UI bắt buộc phải xử lý, tiêu chí chấp nhận (Acceptance Criteria) và kịch bản kiểm thử tương ứng.

> **Quy tắc đối chiếu nguồn thiết kế:**
> - **5 màn hình MVP cốt lõi (Màn hình 1–5):** Được chuẩn hóa từ **Mục 7 của đề bài PDF** và hiện thực hóa trực tiếp tại file **[`wireframe-5.html`](./wireframe-5.html)** (đặt cùng thư mục `docs/design/`).
> - **Hình ảnh tĩnh & Nguồn chỉnh sửa (Figma/Excalidraw):** Lưu tại `docs/diagrams/wireframes/` và ghi nhận tại **Mục 12 (§12)**. Nếu có sự khác biệt giữa hình ảnh/HTML và văn bản đặc tả này, **văn bản này là chuẩn quyết định** về route/trạng thái/nghiệp vụ, còn hình ảnh/HTML là chuẩn tham chiếu về bố cục hiển thị.

---

## 1. Danh mục màn hình (Screen inventory)

|   #   | Màn hình (Screen)         | Route (Next.js)             | Quyền truy cập (Auth) | Tên file ảnh chuẩn         | Nguồn chạy thử / Chỉnh sửa                     | Tiêu chí chấp nhận |
| :---: | :------------------------ | :-------------------------- | :-------------------- | :------------------------- | :--------------------------------------------- | :----------------- |
|   1   | **Menu**                  | `/`                         | Public                | `wf-menu-v1.png`           | [`wireframe-5.html`](./wireframe-5.html) (§12) | Task 3             |
|   2   | **Chi tiết sản phẩm**     | `/products/[id]`            | Public                | `wf-product-detail-v1.png` | [`wireframe-5.html`](./wireframe-5.html) (§12) | Task 4             |
|   3   | **Giỏ hàng (Cart)**       | `/cart`                     | Public                | `wf-cart-v1.png`           | [`wireframe-5.html`](./wireframe-5.html) (§12) | Task 5             |
|   4   | **Thanh toán (Checkout)** | `/checkout`                 | Authenticated         | `wf-checkout-v1.png`       | [`wireframe-5.html`](./wireframe-5.html) (§12) | Task 8             |
|   5   | **Xác nhận đơn**          | `/orders/[id]/confirmation` | Authenticated         | `wf-confirmation-v1.png`   | [`wireframe-5.html`](./wireframe-5.html) (§12) | Task 9             |
|   6   | **Đăng nhập (Login)**     | `/auth/login`               | Public                | `wf-login-v1.png`          | *Chờ bổ sung Figma (§12)*                      | Task 7             |
|   7   | **Đăng ký (Register)**    | `/auth/register`            | Public                | `wf-register-v1.png`       | *Chờ bổ sung Figma (§12)*                      | Task 7             |
|   8   | **Lịch sử đơn hàng**      | `/orders`                   | Authenticated         | `wf-history-v1.png`        | *Chờ bổ sung Figma (§12)*                      | Task 9             |

* **Hàng 1–5:** Là 5 màn hình cốt lõi trong luồng MVP từ chọn món đến thanh toán theo Mục 7 đề bài PDF (đã có sẵn trong [`wireframe-5.html`](./wireframe-5.html)).
* **Hàng 6–8:** Là 3 màn hình bổ sung theo yêu cầu của Product Backlog (Task 7 và Task 9) để đảm bảo mọi tính năng khi lập trình đều có đặc tả giao diện rõ ràng.

---

## 2. Quy ước xuất file & Phối hợp tài liệu

* **Sự bổ trợ giữa `wireframes.md` và `wireframe-5.html`:**
  * Mở [`wireframe-5.html`](./wireframe-5.html) trên trình duyệt để xem **Chế độ 1 (Xem toàn bộ 5 màn hình ngang chuẩn PDF)** hoặc **Chế độ 2 (Bấm tương tác từng bước từ chọn món đến thanh toán)**.
  * Đọc `wireframes.md` (tài liệu này) để nắm rõ các ràng buộc kỹ thuật, xử lý lỗi và trạng thái tải dữ liệu khi dựng UI bằng Next.js.
* **Định dạng ảnh xuất (khi cập nhật vào `docs/diagrams/wireframes/`):** PNG, tỷ lệ 2x, nền trắng, đặt tên theo mẫu `wf-<screen>-v<n>.png`. Khi thay đổi thiết kế sẽ tăng phiên bản lên `v2` và cập nhật lại bảng ở §1 và §12.
* **Ngôn ngữ hiển thị:** Toàn bộ nhãn hiển thị cho người dùng cuối (user-facing labels) sử dụng tiếng Việt đúng theo đề bài PDF.

---

## 3. Bố cục dùng chung & Sơ đồ luồng 5 màn hình MVP

### 3.1. Thành phần bố cục dùng chung (Cross-cutting layout)
* **Header:** Logo/Chữ `BrewLite` (bấm vào về `/`), nút/badge giỏ hàng (hiển thị số lượng món), và mục tài khoản (Đăng nhập/Đăng ký hoặc Email + Đăng xuất). Cố định khi cuộn trang (sticky).
* **Page container:** `max-w-5xl mx-auto px-4` cho trang Menu, Giỏ hàng, Lịch sử đơn; `max-w-3xl` cho trang Thanh toán, Xác nhận, Đăng nhập/Đăng ký.
* **Footer:** Tối giản — hiển thị tên dự án BrewLite và liên kết tới README.
* **Responsive:** Tương thích tốt ở cả màn hình di động (`360px`) và máy tính (`1280px`). Lưới sản phẩm hiển thị `grid-cols-2` trên mobile và `md:grid-cols-3` / `md:grid-cols-4` trên desktop.

### 3.2. Sơ đồ trực quan 5 màn hình MVP (Chuẩn Mục 7 đề bài PDF & `wireframe-5.html`)

```text
+--------------------+    +--------------------+    +--------------------+    +--------------------+    +--------------------+
|    BrewLite  ≡     |    |   <- Cappuccino    |    |      Giỏ hàng      |    |     Thanh toán     |    |         ✓          |
|                    |    |                    |    |                    |    |                    |    | Đặt hàng thành công|
| [Cà phê sữa   35k] |    |   Giá: 45.000đ     |    | [Cappuccino M  x1] |    |  Tổng: 123.000đ    |    |                    |
| [Americano    40k] | -> |       Size         | -> | [Trà đào L     x2] | -> |    Phương thức     | -> |  [Mã đơn: #1042]   |
| [Cappuccino   45k] |    |   [ S   M   L ]    |    |  ----------------  |    |  [(o) Ví điện tử]  |    | [Trạng thái: PAID] |
| [Trà đào      39k] |    |      Topping       |    |  Tổng: 123.000đ    |    |  [( ) Thẻ NH    ]  |    |                    |
|                    |    | [Trân châu / Kem]  |    |                    |    | Không dùng tiền mặt|    | Mời tới quầy lấy   |
| [Xem giỏ hàng (0)] |    |  [ Thêm vào giỏ ]  |    |   [ Thanh toán ]   |    |  [ Xác nhận trả ]  |    |  [ Về trang chủ ]  |
+--------------------+    +--------------------+    +--------------------+    +--------------------+    +--------------------+
       (1) Menu                (2) Chi tiết              (3) Giỏ hàng             (4) Thanh toán             (5) Xác nhận
```

---

## 4. Màn hình 1 — Menu (`/`)

* **Mục tiêu:** Duyệt danh sách đồ uống và bắt đầu luồng đặt hàng.
* **Truy vết:** `product-backlog.md` Task 3; `scenarios.md` S-MAIN-1 (bước 1–2); Màn hình `(1) Menu` trong `wireframe-5.html`.
* **Bố cục:** Header $\rightarrow$ Tiêu đề "Menu" $\rightarrow$ Lưới sản phẩm (`ProductCard` gồm ảnh, tên, giá cơ bản như *Cà phê sữa 35k, Americano 40k, Cappuccino 45k, Trà đào 39k*) $\rightarrow$ Nút/thanh "Xem giỏ hàng (0)". Bấm vào thẻ sản phẩm sẽ chuyển sang `/products/[id]`.

| Trạng thái (State) | Cách hiển thị (Rendering)                                             | Kịch bản kiểm thử (Test)              |
| :----------------- | :-------------------------------------------------------------------- | :------------------------------------ |
| **Loading**        | Hiển thị `MenuSkeleton` gồm 6 khung thẻ xám trên lưới                 | —                                     |
| **Empty**          | Hiển thị `<EmptyState>` *"Menu đang cập nhật"*                        | —                                     |
| **Error**          | Hiển thị `<ErrorState>` kèm nút *"Thử lại"* (gọi lại `GET /products`) | `scenarios.md` S-MAIN-1 (nhánh retry) |
| **Success**        | Hiển thị lưới sản phẩm; badge giỏ hàng phản ánh đúng `totalQty()`     | `scenarios.md` S-MAIN-1 bước 1        |

---

## 5. Màn hình 2 — Chi tiết sản phẩm (`/products/[id]`)

* **Mục tiêu:** Xem thông tin đồ uống, chọn Size (`S`/`M`/`L`), chọn Topping (`Trân châu`/`Kem`), xem giá tính tự động và thêm vào giỏ.
* **Truy vết:** `product-backlog.md` Task 4; `scenarios.md` S-MAIN-1 (bước 2–4); Màn hình `(2) Chi tiết` trong `wireframe-5.html`.
* **Bố cục:** Header / Nút quay lại (`← Cappuccino`) $\rightarrow$ Ảnh sản phẩm & Giá (`45.000đ`) $\rightarrow$ Bộ chọn Size (`S` / `M` / `L`, mặc định chọn **M**) $\rightarrow$ Checkbox chọn Topping (`Trân châu`, `Kem`) $\rightarrow$ Tổng tiền tạm tính $\rightarrow$ Nút chính *"Thêm vào giỏ"*.

| Trạng thái (State)    | Cách hiển thị (Rendering)                                          | Kịch bản kiểm thử (Test)       |
| :-------------------- | :----------------------------------------------------------------- | :----------------------------- |
| **Loading**           | Khung skeleton cho ảnh và khối tùy chọn                            | —                              |
| **Empty / Not found** | `<EmptyState>` *"Không tìm thấy sản phẩm"* + nút *"Quay lại menu"* | —                              |
| **Error**             | `<ErrorState>` kèm nút *"Thử lại"*                                 | —                              |
| **Success**           | Giá tiền cập nhật tức thì mỗi khi đổi Size hoặc bật/tắt Topping    | `scenarios.md` S-MAIN-1 bước 3 |

---

## 6. Màn hình 3 — Giỏ hàng (`/cart`)

* **Mục tiêu:** Kiểm tra danh sách món đã chọn, tăng/giảm số lượng, xóa món và chuyển sang bước thanh toán.
* **Truy vết:** `product-backlog.md` Task 5; `scenarios.md` S-CART-1, S-CART-2; Màn hình `(3) Giỏ hàng` trong `wireframe-5.html`.
* **Bố cục:** Header $\rightarrow$ Danh sách các dòng sản phẩm (ví dụ: *Cappuccino M x1*, *Trà đào L x2*, mỗi dòng có tên, size, topping, nút `- qty +`, thành tiền, nút xóa) $\rightarrow$ Đường kẻ phân cách $\rightarrow$ Tổng tiền (`Tổng: 123.000đ`) $\rightarrow$ Nút chính *"Thanh toán"* & liên kết *"Tiếp tục mua"*.

| Trạng thái (State)    | Cách hiển thị (Rendering)                                                         | Kịch bản kiểm thử (Test)         |
| :-------------------- | :-------------------------------------------------------------------------------- | :------------------------------- |
| **Empty**             | `<EmptyState>` *"Giỏ hàng trống"* + nút *"Xem menu"*                              | `scenarios.md` S-CART-1 bước 3   |
| **Non-empty**         | Hiển thị danh sách món + tổng tiền; nút `-` vô hiệu hóa khi số lượng = 1          | `scenarios.md` S-CART-1 bước 1–2 |
| **Invalid selection** | Nếu món trong giỏ không còn tồn tại trong menu, hiển thị cảnh báo kèm nút *"Xóa"* | —                                |

* **Lưu ý:** Nếu người dùng chưa đăng nhập mà bấm *"Thanh toán"*, hệ thống điều hướng sang `/auth/login?next=/checkout`.

---

## 7. Màn hình 4 — Thanh toán (`/checkout`)

* **Mục tiêu:** Chọn phương thức thanh toán không tiền mặt (`Ví điện tử` / `Thẻ ngân hàng`), kiểm tra tổng tiền và xác nhận thanh toán.
* **Truy vết:** `product-backlog.md` Task 8; Đề bài PDF Mục 4.3 (US-05); `scenarios.md` S-MAIN-1 (bước 7–10), S-PAY-1..4; Màn hình `(4) Thanh toán` trong `wireframe-5.html`.
* **Bố cục:** Header $\rightarrow$ Tóm tắt đơn hàng (`Tổng: 123.000đ`) $\rightarrow$ Bộ chọn phương thức gồm 2 thẻ radio lớn (*"Ví điện tử"*, *"Thẻ ngân hàng"*) $\rightarrow$ Ghi chú *"Không dùng tiền mặt"* $\rightarrow$ Nút chính *"Xác nhận trả"* (hoặc *"Xác nhận thanh toán"*) $\rightarrow$ Liên kết *"Quay lại giỏ"*.

| Trạng thái (State)   | Cách hiển thị (Rendering)                                                                      | Kịch bản kiểm thử (Test)        |
| :------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------ |
| **Unauthenticated**  | Tự động chuyển hướng sang `/auth/login?next=/checkout`                                         | `scenarios.md` S-AUTH-1         |
| **Loading (Submit)** | Nút bấm hiện vòng xoay (spinner) và bị khóa để chống bấm đúp                                   | `scenarios.md` S-PAY-4          |
| **Payment failure**  | Hiển thị lỗi `<ErrorState>` (`PAYMENT_FAILED`) + nút *"Thử lại"*; **giỏ hàng được giữ nguyên** | `scenarios.md` S-PAY-2, S-PAY-3 |
| **Success**          | Đơn chuyển sang `PAID`, điều hướng sang màn hình Xác nhận                                      | `scenarios.md` S-MAIN-1 bước 10 |

---

## 8. Màn hình 5 — Xác nhận đơn hàng (`/orders/[id]/confirmation`)

* **Mục tiêu:** Hiển thị xác nhận đặt hàng thành công kèm mã đơn, trạng thái đơn và hướng dẫn nhận nước.
* **Truy vết:** `product-backlog.md` Task 9; `scenarios.md` S-MAIN-1 bước 10, S-ORD-4; Màn hình `(5) Xác nhận` trong `wireframe-5.html`.
* **Bố cục:** Header $\rightarrow$ Biểu tượng hoàn thành (`✓`) & Tiêu đề *"Đặt hàng thành công"* $\rightarrow$ Khung thông tin gồm Mã đơn (`#1042`) và Badge trạng thái (`PAID`) $\rightarrow$ Lời nhắc *"Mời tới quầy lấy nước"* $\rightarrow$ Nút chính *"Về trang chủ"* & liên kết *"Xem lịch sử đơn"*.

| Trạng thái (State)        | Cách hiển thị (Rendering)                                          | Kịch bản kiểm thử (Test)        |
| :------------------------ | :----------------------------------------------------------------- | :------------------------------ |
| **Success (`PAID`)**      | Banner thành công, badge xanh `PAID`, mã đơn, tổng tiền, thời gian | `scenarios.md` S-MAIN-1 bước 10 |
| **Not found / Not yours** | `<EmptyState>` *"Không tìm thấy đơn hàng"* + nút *"Về trang chủ"*  | `scenarios.md` S-ORD-4 bước 2   |
| **Error**                 | `<ErrorState>` kèm nút *"Thử lại"*                                 | —                               |

---

## 9. Màn hình 6 — Đăng nhập (`/auth/login`)

* **Mục tiêu:** Xác thực người dùng (JWT) trước khi đặt đơn/thanh toán hoặc xem lịch sử đơn hàng.
* **Truy vết:** `product-backlog.md` Task 7; `scenarios.md` S-AUTH-1, S-AUTH-3.
* **Bố cục:** Khung thẻ căn giữa (`max-w-md`) $\rightarrow$ Tiêu đề *"Đăng nhập"* $\rightarrow$ Ô nhập Email $\rightarrow$ Ô nhập Mật khẩu $\rightarrow$ Nút chính *"Đăng nhập"* $\rightarrow$ Liên kết *"Chưa có tài khoản? Đăng ký"*.

| Trạng thái (State)      | Cách hiển thị (Rendering)                                             | Kịch bản kiểm thử (Test) |
| :---------------------- | :-------------------------------------------------------------------- | :----------------------- |
| **Default**             | Biểu mẫu trống                                                        | —                        |
| **Submitting**          | Nút bấm hiện spinner và tạm khóa                                      | —                        |
| **Invalid credentials** | Báo lỗi chung trên biểu mẫu (không tiết lộ email đã tồn tại hay chưa) | `scenarios.md` S-AUTH-3  |
| **Success**             | Điều hướng về đường dẫn tại tham số `?next=` (nếu hợp lệ) hoặc về `/` | `scenarios.md` S-AUTH-1  |

---

## 10. Màn hình 7 — Đăng ký (`/auth/register`)

* **Mục tiêu:** Tạo tài khoản khách hàng mới.
* **Truy vết:** `product-backlog.md` Task 7; `scenarios.md` S-AUTH-1, S-AUTH-2.
* **Bố cục:** Khung thẻ căn giữa $\rightarrow$ Tiêu đề *"Đăng ký"* $\rightarrow$ Ô nhập Email $\rightarrow$ Ô nhập Mật khẩu $\rightarrow$ Ô Xác nhận mật khẩu $\rightarrow$ Nút chính *"Đăng ký"* $\rightarrow$ Liên kết *"Đã có tài khoản? Đăng nhập"*.

| Trạng thái (State)    | Cách hiển thị (Rendering)                                                   | Kịch bản kiểm thử (Test) |
| :-------------------- | :-------------------------------------------------------------------------- | :----------------------- |
| **Default**           | Biểu mẫu trống                                                              | —                        |
| **Client validation** | Cảnh báo định dạng email, độ dài mật khẩu và khớp mật khẩu trước khi gửi    | —                        |
| **Duplicate email**   | Báo lỗi trực tiếp khi API trả về mã `409 Conflict`                          | `scenarios.md` S-AUTH-2  |
| **Success**           | Chuyển sang trang đăng nhập (hoặc tự động đăng nhập) và giữ nguyên `?next=` | `scenarios.md` S-AUTH-1  |

---

## 11. Màn hình 8 — Lịch sử đơn hàng (`/orders`)

* **Mục tiêu:** Xem danh sách các đơn hàng đã đặt (`GET /orders/me`) và bấm vào xem chi tiết từng đơn.
* **Truy vết:** `product-backlog.md` Task 9; `scenarios.md` S-ORD-4.
* **Bố cục:** Header $\rightarrow$ Tiêu đề *"Đơn hàng của tôi"* $\rightarrow$ Danh sách đơn hàng xếp từ mới nhất đến cũ nhất (mỗi dòng gồm mã đơn, ngày đặt, tổng tiền, badge trạng thái) $\rightarrow$ Nút *"Về trang chủ"*.

| Trạng thái (State)  | Cách hiển thị (Rendering)                                    | Kịch bản kiểm thử (Test)      |
| :------------------ | :----------------------------------------------------------- | :---------------------------- |
| **Unauthenticated** | Tự động chuyển hướng sang `/auth/login?next=/orders`         | `scenarios.md` S-ORD-4 bước 3 |
| **Loading**         | Các dòng skeleton                                            | —                             |
| **Empty**           | `<EmptyState>` *"Chưa có đơn hàng"* + nút *"Xem menu"*       | —                             |
| **Error**           | `<ErrorState>` kèm nút *"Thử lại"*                           | —                             |
| **Success**         | Hiển thị danh sách đơn hàng theo thứ tự `createdAt` giảm dần | `scenarios.md` S-ORD-4 bước 1 |

---

## 12. Thư viện hình ảnh và Nguồn chỉnh sửa (Image gallery & Editable sources)

> **Lưu ý quan trọng (Trạng thái hình ảnh `.png` và link Figma ở Sprint 0):**
> - **Đã có bản mẫu HTML tương tác:** Toàn bộ 5 màn hình MVP cốt lõi (Màn hình 1–5 theo Mục 7 đề bài PDF) đã được xây dựng hoàn chỉnh trong file **[`wireframe-5.html`](./wireframe-5.html)**. Giảng viên và các thành viên trong nhóm có thể mở trực tiếp file này để đối chiếu bố cục hoặc chạy thử luồng thao tác.
> - **Hình ảnh cắt rời (`wf-*-v1.png`) và Link Figma:** Các file ảnh tĩnh `.png` trong thư mục `docs/diagrams/wireframes/` và link thiết kế Figma hiện **chưa khởi tạo** ở Sprint 0. Danh sách thẻ ảnh bên dưới được giữ ở dạng khung chờ (placeholder) và sẽ được cập nhật khi nhóm xuất ảnh chi tiết ở các Sprint tiếp theo.

```markdown
<!-- Nhúng trực tiếp khi các file PNG được commit vào docs/diagrams/wireframes/ -->

### 1. Menu
![Menu wireframe](../diagrams/wireframes/wf-menu-v1.png)

### 2. Product detail
![Product detail wireframe](../diagrams/wireframes/wf-product-detail-v1.png)

### 3. Cart
![Cart wireframe](../diagrams/wireframes/wf-cart-v1.png)

### 4. Checkout
![Checkout wireframe](../diagrams/wireframes/wf-checkout-v1.png)

### 5. Confirmation
![Confirmation wireframe](../diagrams/wireframes/wf-confirmation-v1.png)

### 6. Login
![Login wireframe](../diagrams/wireframes/wf-login-v1.png)

### 7. Register
![Register wireframe](../diagrams/wireframes/wf-register-v1.png)

### 8. Order history
![Order history wireframe](../diagrams/wireframes/wf-history-v1.png)
```

**Bảng quản lý nguồn thiết kế (Editable & Prototype sources):**

| Màn hình              | Công cụ / Định dạng    | Liên kết / Trạng thái nguồn                                          | Phụ trách |
| :-------------------- | :--------------------- | :------------------------------------------------------------------- | :-------: |
| **1. Menu**           | HTML Prototype / Figma | [`wireframe-5.html`](./wireframe-5.html) *(Link Figma cập nhật sau)* |   Nghĩa   |
| **2. Product detail** | HTML Prototype / Figma | [`wireframe-5.html`](./wireframe-5.html) *(Link Figma cập nhật sau)* |   Nghĩa   |
| **3. Cart**           | HTML Prototype / Figma | [`wireframe-5.html`](./wireframe-5.html) *(Link Figma cập nhật sau)* |   Nghĩa   |
| **4. Checkout**       | HTML Prototype / Figma | [`wireframe-5.html`](./wireframe-5.html) *(Link Figma cập nhật sau)* |   Nghĩa   |
| **5. Confirmation**   | HTML Prototype / Figma | [`wireframe-5.html`](./wireframe-5.html) *(Link Figma cập nhật sau)* |   Nghĩa   |
| **6. Login**          | Figma / Excalidraw     | *Chưa có (bổ sung ở Sprint 2 — Task 7)*                              |   Nghĩa   |
| **7. Register**       | Figma / Excalidraw     | *Chưa có (bổ sung ở Sprint 2 — Task 7)*                              |   Nghĩa   |
| **8. Order history**  | Figma / Excalidraw     | *Chưa có (bổ sung ở Sprint 3 — Task 9)*                              |   Nghĩa   |

---

## 13. Ma trận truy vết (Traceability)

| Màn hình              | Task trong Backlog | Kịch bản kiểm thử (Scenarios) | Kiểm thử chấm điểm nâng cao? |
| :-------------------- | :----------------- | :---------------------------- | :--------------------------: |
| **Menu**              | Task 3 (Sprint 1)  | `S-MAIN-1`                    |              —               |
| **Chi tiết sản phẩm** | Task 4 (Sprint 1)  | `S-MAIN-1`                    |              —               |
| **Giỏ hàng**          | Task 5 (Sprint 2)  | `S-CART-1`, `S-CART-2`        |              —               |
| **Thanh toán**        | Task 8 (Sprint 3)  | `S-MAIN-1`, `S-PAY-1..4`      |              —               |
| **Xác nhận đơn**      | Task 9 (Sprint 3)  | `S-MAIN-1`, `S-ORD-4`         |              —               |
| **Đăng nhập**         | Task 7 (Sprint 2)  | `S-AUTH-1`, `S-AUTH-3`        |              —               |
| **Đăng ký**           | Task 7 (Sprint 2)  | `S-AUTH-1`, `S-AUTH-2`        |              —               |
| **Lịch sử đơn hàng**  | Task 9 (Sprint 3)  | `S-ORD-4`                     |              —               |

*(Ba kịch bản chấm điểm backend ở Task 10 gồm `S-PAY-5`, `S-ORD-5`, `S-ORD-6` được kiểm thử ở tầng API/Integration test và mô tả trong `scenarios.md`).*

---

## 14. Phạm vi không nằm trong tài liệu này

* **Quy ước màu sắc, font chữ, khoảng cách, công thức tính giá:** Quy định tại `ui-decisions.md`.
* **Cấu trúc JSON Request/Response và mã lỗi API:** Quy định tại `docs/architecture/api-contract.md`.
* **Giao diện nhập mã khuyến mãi & điểm thưởng (Task 10):** Sẽ được bổ sung vào bản `v2` của màn hình Thanh toán và Xác nhận ở Sprint 3.
* **Giao diện dành cho nhân viên pha chế (Barista):** Nằm ngoài phạm vi MVP (theo Mục 3.2 đề bài PDF).

---

## 15. Các hạng mục mở (Open items)

| Hạng mục                                                                    | Phụ trách | Thời điểm đóng (Closes when)                                                                   |
| :-------------------------------------------------------------------------- | :-------: | :--------------------------------------------------------------------------------------------- |
| Xuất và commit 8 ảnh `.png` (`wf-*-v1.png`) vào `docs/diagrams/wireframes/` |   Nghĩa   | Khi dựng UI chi tiết ở từng Sprint (Sprint 0 dùng `wireframe-5.html`)                          |
| Cập nhật link Figma/Excalidraw vào bảng ở §12                               |   Nghĩa   | Khi nhóm khởi tạo xong workspace Figma                                                         |
| Chốt tham số D3 (dùng `[id]` hay `[code]` cho route màn hình Xác nhận)      |   Nghĩa   | Khi chốt `api-contract.md`; cập nhật đồng bộ tại §1, `ui-decisions.md` và `product-backlog.md` |
| Bổ sung ô nhập mã giảm giá & điểm tích lũy (Checkout `v2`)                  |   H.Tài   | Khi thực hiện Task 10 ở Sprint 3                                                               |