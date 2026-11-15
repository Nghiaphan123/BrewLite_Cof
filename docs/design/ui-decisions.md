# BrewLite - Các Quyết định UI

<<<<<<< HEAD
**Status:** Phase 1 deliverable  
**Owner:** Nghĩa (Task 5.0)  
**Related:** [Wireframes](wireframes.md), [Product Backlog](../requirements/product-backlog.md), [Scenarios](../requirements/scenarios.md), [Configuration](../../archive/docs/config.md), [Project Structure](../../archive/docs/architecture/architecture.md), assignment PDF §6, §7
=======
**Trạng thái:** Sản phẩm bàn giao Giai đoạn 1
**Người phụ trách:** Nghĩa (Nhiệm vụ 5.0)
**Liên quan:** [Wireframes](wireframes.md), [Product Backlog](../requirements/product-backlog.md), [Scenarios](../requirements/scenarios.md), [Cấu hình](../config.md), [Cấu trúc dự án](../project-structure.md), PDF bài tập §6, §7
>>>>>>> main

Tài liệu này ghi lại các quyết định UI định hình mọi màn hình trong MVP của BrewLite. Nó không phải là một design system và không phải là một component library — nó là tập hợp các lựa chọn phải nhất quán xuyên suốt năm màn hình MVP và mà một reviewer có thể trích dẫn khi một PR vi phạm một trong số đó.

> **Phạm vi:** năm màn hình MVP (Menu, Chi tiết sản phẩm, Giỏ hàng, Thanh toán, Xác nhận) cộng với các màn hình xác thực được thêm trong Nhiệm vụ 7. Bất cứ thứ gì không được liệt kê ở đây đều tự do cho đến khi một màn hình cần nó — sau đó nó có một quyết định và một dòng trong tài liệu này, trong cùng PR.

## 1. Stack và framework

| Quyết định        | Giá trị                                                                                | Lý do                                                                                                      | ADR?                             |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Framework         | Next.js App Router (đã được scaffold)                                                  | PDF bài tập §6 bắt buộc Next.js; App Router là thứ scaffold dùng.                                          | —                                |
| Ngôn ngữ          | TypeScript, strict                                                                     | Khớp với `tsconfig.json` của scaffold; không `any` trong code tính năng mà không có bình luận `// why:`.   | —                                |
| Styling           | TailwindCSS                                                                            | PDF bài tập §6; đã có trong scaffold.                                                                      | —                                |
| Mô hình component | React Server Components theo mặc định; `"use client"` chỉ khi state hoặc event yêu cầu | Giữ bundle nhỏ; giỏ hàng và xác thực là những khu vực nặng client.                                         | —                                |
| State (giỏ hàng)  | Zustand                                                                                | PDF §6 gợi ý Zustand; nhỏ hơn Redux, không có cây provider.                                                | ADR 0006 (sẽ tạo với Nhiệm vụ 5) |
| Lấy dữ liệu       | `fetch` gốc từ Server Components cho đọc; `fetch` client cho ghi                       | Next 16 hỗ trợ cả hai; không có phụ thuộc React Query trong Giai đoạn 1. Xem lại nếu caching thành vấn đề. | —                                |
| Form              | Validate HTML gốc + `class-validator` phía server                                      | Tránh phụ thuộc thư viện form trong Giai đoạn 1; xem lại nếu form phình to.                                | —                                |
| Icon              | SVG nội tuyến hoặc `lucide-react` nếu nhóm đồng ý                                      | Không phải vấn đề chặn Giai đoạn 1; chọn khi cần icon đầu tiên.                                            | —                                |

**Quy tắc:** thêm một phụ thuộc UI (component library, animation library, form library) yêu cầu một ghi chú một dòng ở đây và một thay đổi `package.json` trong cùng PR. "Tôi cần nó" không phải là lý do; "cái gì hỏng nếu không có nó" mới là.

## 2. Các route

Cấu trúc thư mục App Router dưới `apps/web/src/app/` là bản đồ URL. Nó phải khớp với `wireframes.md` và các hành trình e2e trong `scenarios.md`.

| Màn hình          | Route                       | Rendering                            | Xác thực                                | Ghi chú                                                                                   |
| ----------------- | --------------------------- | ------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| Menu              | `/`                         | Server Component                     | Công khai                               | Tải `GET /products`; huy hiệu từ client cart store.                                       |
| Chi tiết sản phẩm | `/products/[id]`            | Vỏ Server Component + bộ chọn client | Công khai                               | Chọn kích cỡ/topping ở phía client.                                                       |
| Giỏ hàng          | `/cart`                     | Client Component                     | Công khai (thanh toán yêu cầu xác thực) | Chỉ đọc Zustand store.                                                                    |
| Đăng nhập         | `/auth/login`               | Client Component                     | Công khai                               | Chuyển hướng đến `/checkout` khi thành công nếu có đường dẫn trả về được lưu.             |
| Đăng ký           | `/auth/register`            | Client Component                     | Công khai                               | Cùng quy tắc chuyển hướng.                                                                |
| Thanh toán        | `/checkout`                 | Client Component                     | **Đã xác thực**                         | Chuyển hướng đến `/auth/login?next=/checkout` khi không có token.                         |
| Xác nhận          | `/orders/[id]/confirmation` | Server Component                     | **Đã xác thực**                         | Render `GET /orders/:id` (theo chủ sở hữu); "không tìm thấy" an toàn với người dùng khác. |
| Lịch sử           | `/orders`                   | Server Component                     | **Đã xác thực**                         | Render `GET /orders/me`.                                                                  |

**Quy tắc đặt tên route:**
- Chữ thường, phân đoạn có gạch nối; không `_underscore` (Next dành `_` cho thư mục riêng tư).
- Phân đoạn động là `[id]`; không `[orderId]` trừ khi tham số cụ thể là id đơn hàng (khi đó `[orderId]` được phép).
- Route groups `(group)` được phép cho tổ chức layout nhưng không xuất hiện trong URL; không dùng chúng để ẩn route khỏi cấu trúc URL theo cách gây nhầm lẫn cho `wireframes.md`.

**Quyết định mở (D3 từ `scenarios.md`):** liệu route xác nhận được khóa bằng `id` DB hay một mã đơn hàng dễ đọc. Hình dạng route ở trên dùng `[id]`; nếu nhóm chọn mã, phân đoạn trở thành `[code]` và bảng này được cập nhật trong cùng PR. **Người phụ trách:** Nghĩa. **Đóng khi:** `api-contract.md` §`POST /orders` được chốt.

## 3. Design tokens

Giai đoạn 1 giữ tokens tối thiểu: đủ để giữ các màn hình nhất quán, không đủ để trở thành một design system. Tokens sống dưới dạng phần mở rộng theme Tailwind trong `apps/web/tailwind.config.ts` (hoặc block `@theme` của `globals.css` cho Tailwind v4 — chọn một và ghi lại).

### 3.1 Màu sắc

| Token               | Giá trị                | Công dụng                            | Ghi chú tương phản                                                     |
| ------------------- | ---------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `--color-brand`     | `#6F4E37` (nâu cà phê) | Nút chính, nav đang hoạt động        | AA trên trắng cho chữ ≥ 18px; dùng `--color-brand-ink` cho chữ nhỏ hơn |
| `--color-brand-ink` | `#3B2A1E`              | Chữ thân trên bề mặt tông brand      | AA trên `--color-brand` ở 14px+                                        |
| `--color-bg`        | `#FAF7F2`              | Nền ứng dụng                         |                                                                        |
| `--color-surface`   | `#FFFFFF`              | Card, dialog                         |                                                                        |
| `--color-border`    | `#E5DED4`              | Đường phân cách, viền input          |                                                                        |
| `--color-muted`     | `#6B6B6B`              | Chữ phụ, placeholder                 | AA trên `--color-bg`                                                   |
| `--color-success`   | `#1F7A4D`              | Huy hiệu `PAID`, toast thành công    |                                                                        |
| `--color-warn`      | `#B36B00`              | Huy hiệu `PENDING`, `PAYMENT_FAILED` |                                                                        |
| `--color-danger`    | `#B3261E`              | Lỗi form, hành động phá hủy          |                                                                        |

**Quy tắc:** không có giá trị hex thô trong component. Mọi màu đến từ một token. Nếu cần một màu mà không có token, hãy thêm token trong cùng PR và ghi lại trong bảng này.

### 3.2 Kiểu chữ

| Token           | Giá trị                                                    | Công dụng           |
| --------------- | ---------------------------------------------------------- | ------------------- |
| `font-sans`     | `ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif` | Toàn bộ chữ UI      |
| `text-xs`       | `0.75rem / 1rem`                                           | Huy hiệu, metadata  |
| `text-sm`       | `0.875rem / 1.25rem`                                       | Chữ phụ             |
| `text-base`     | `1rem / 1.5rem`                                            | Thân                |
| `text-lg`       | `1.125rem / 1.75rem`                                       | Tiêu đề card        |
| `text-xl`       | `1.25rem / 1.75rem`                                        | Tiêu đề phần        |
| `text-2xl`      | `1.5rem / 2rem`                                            | Tiêu đề trang       |
| `font-semibold` | `600`                                                      | Nút, tiêu đề card   |
| `font-bold`     | `700`                                                      | Tiêu đề trang, tổng |

**Dấu tiếng Việt:** font stack được chọn phải render tiếng Việt đúng. `system-ui` trên Windows/macOS/Linux thì đúng; nếu nhóm sau này thêm webfont, hãy xác minh `ễ`, `ữ`, `đ` trước khi merge. Đây là một rủi ro thực sự với một số font hiển thị.

### 3.3 Khoảng cách và layout

- Đơn vị cơ sở `0.25rem` (thang Tailwind mặc định). Chỉ dùng tiện ích khoảng cách Tailwind; không `style={{ padding: 13 }}` tùy ý.
- Container trang: `max-w-5xl mx-auto px-4` (web), với `max-w-3xl` hẹp hơn cho thanh toán/xác nhận.
- Breakpoints: mặc định Tailwind. Lưới menu là `grid-cols-2` ở cơ sở và `grid-cols-3 md:grid-cols-4` ở `md`+.

### 3.4 Hình dạng và độ nổi

- Bo góc: `rounded-lg` (0.5rem) cho card và input, `rounded-md` cho nút, `rounded-full` cho huy hiệu giỏ hàng.
- Đổ bóng: `shadow-sm` cho card; không `shadow-lg` hoặc lớn hơn trong Giai đoạn 1 (giữ UI phẳng và dễ đọc).

## 4. Định dạng giá và tiền

Đây là quyết định quan trọng nhất trong tài liệu, vì sự không khớp ở đây là lỗi tích hợp số 1 (`scenarios.md` S-ORD-1, `product-backlog.md` Nhiệm vụ 4 và Nhiệm vụ 6).

### 4.1 Biểu diễn tiền

- **Mọi khoản tiền là số nguyên bằng VND.** Không số thực, không số thập phân, không đơn vị lẻ. `35,000` VND là `35000` trong code và JSON.
- Lý do: PDF bài tập hiển thị giá như `35k`, `45.000đ`; đồng Việt Nam không có đơn vị lẻ thực tế. Dùng `Int` trong Prisma và `number` (số nguyên) trong JSON tránh hoàn toàn sự trôi dạt số thực.
- Quy tắc này được phản chiếu trong `config.md` §3 ("Tiền tệ: VND, số nguyên không đơn vị lẻ"). Cả hai tài liệu phải đồng ý.

### 4.2 Tính giá — một quy tắc, hai cách triển khai, một fixture

Frontend tính giá hiển thị; backend tính lại giá có thẩm quyền. Chúng **phải** đồng ý cho mọi tổ hợp (sản phẩm, kích cỡ, topping) hợp lệ. Cơ chế đảm bảo sự đồng ý là một **fixture giá dùng chung**:

- **Tệp:** `apps/web/src/lib/pricing.ts` xuất `computeLineTotal(selection: CartSelection): number`; nó chứa bảng kích cỡ và topping.
- **Bản sao backend:** `apps/api/src/modules/orders/pricing.ts` xuất cùng hàm với cùng bảng.
- **Fixture:** `tests/fixtures/pricing-cases.json` liệt kê ít nhất 20 trường hợp (mỗi kích cỡ hợp lệ, mỗi topping, tổ hợp, số lượng > 1). Cả hai ứng dụng đều có test đọc fixture và khẳng định `computeLineTotal` của chúng khớp với giá trị kỳ vọng.
- **Quy tắc:** nếu giá trị kỳ vọng của fixture thay đổi, cả hai cách triển khai và fixture thay đổi trong cùng PR. Một PR thay đổi một mà không thay đổi cái kia sẽ trượt review.

### 4.3 Định dạng hiển thị

- Bộ định dạng sống trong `apps/web/src/lib/format.ts`: `formatVnd(n: number): string` trả về ví dụ `45.000đ`.
- Quy tắc: dấu phân cách hàng nghìn tiếng Việt (`.`), không số thập phân, hậu tố `đ` không dấu cách (`45.000đ`, không `45.000 đ`).
- Không dùng `Intl.NumberFormat` với kiểu currency — nó chèn dấu cách không ngắt và có thể render `₫` không nhất quán giữa các nền tảng. Dùng một bộ định dạng tùy chỉnh nhỏ và test nó.
- **Không bao giờ** phân tích lại một chuỗi đã định dạng thành số. Định dạng là một chiều; nguồn chân lý luôn là số nguyên.

## 5. Quản lý state

### 5.1 Cart store (Zustand)

- **Tệp:** `apps/web/src/store/cart-store.ts`.
- **Hình dạng:**
  ```ts
  type CartSelection = { productId: string; size: "S" | "M" | "L"; toppingIds: string[] };
  type CartItem = CartSelection & { name: string; qty: number; lineTotal: number };
  type CartState = {
    items: CartItem[];
    add: (s: CartSelection, name: string) => void;
    increment: (index: number) => void;
    decrement: (index: number) => void;
    remove: (index: number) => void;
    clear: () => void;
    totalQty: () => number;
    totalPrice: () => number;
  };
  ```
- **Quy tắc nhận dạng:** hai dòng là "giống nhau" khi và chỉ khi `productId`, `size`, và *tập hợp* `toppingIds` đều khớp. Thứ tự topping không tạo dòng mới; tập hợp được sắp xếp trước khi so sánh.
- **Lưu trữ:** chỉ trong bộ nhớ trong Giai đoạn 1 (tồn tại qua điều hướng, không qua reload). Được ghi là hạn chế đã biết trong `scenarios.md` S-CART-2.
- **Không async trong store.** Store không bao giờ gọi `fetch`. Các mutation đánh API (`POST /orders`) sống trong tính năng, không phải store.

### 5.2 State xác thực

- Token lưu trong `localStorage` dưới `brewlite.token`; danh tính người dùng được giải mã từ payload JWT (`email`, `sub`) mà không tin chữ ký ở phía client.
- Một hook `useAuth()` đọc token và xuất `{ isAuthenticated, email, logout }`.
- **Không có auth store** trong Giai đoạn 1; hook là đủ. Nếu sau này thêm refresh token, xem lại.
- **Ghi chú bảo mật:** `localStorage` dễ bị XSS; lựa chọn thay thế (`httpOnly` cookie) yêu cầu xử lý CSRF. Giai đoạn 1 chấp nhận rủi ro vì bài tập giới hạn cổng mock và không có dữ liệu nhạy cảm ngoài đơn hàng của chính người dùng. Ghi lại trong ADR 0006 cùng với quyết định giỏ hàng.

## 6. Quy ước trạng thái UI

Mọi màn hình gắn dữ liệu phải xử lý bốn trạng thái một cách rõ ràng. Đây là tiêu chí chấp nhận trong Nhiệm vụ 3, 5, 7, và 9, và là bình luận review phổ biến nhất.

| Trạng thái | Người dùng thấy gì                                          | Mẫu component                            |
| ---------- | ----------------------------------------------------------- | ---------------------------------------- |
| Loading    | Skeleton cho lưới và danh sách; spinner cho hành động       | `<MenuSkeleton />`, `<Button loading />` |
| Empty      | Hình minh họa hoặc icon + thông điệp ngắn + hành động chính | `<EmptyState title action />`            |
| Error      | Thông điệp + nút thử lại; thông điệp cụ thể nếu API trả về  | `<ErrorState onRetry message />`         |
| Success    | Dữ liệu                                                     | —                                        |

**Quy tắc:**
- Không màn hình nào được render một vùng trống trong khi loading. Nếu dữ liệu mất > 200 ms, hiển thị skeleton (lưới) hoặc spinner (một mục).
- Thông điệp lỗi hướng đến người dùng: không stack trace, không `TypeError: fetch failed` thô. Ánh xạ lỗi API đã biết sang văn bản thân thiện; log lỗi thô vào console trong dev.
- Thử lại phải thực sự thử lại (phát lại yêu cầu), không chỉ reload trang.
- Toast (nếu dùng) dành cho mutation, không dành cho lần tải ban đầu; lần tải ban đầu dùng trạng thái nội tuyến.

## 7. Chuẩn tiếp cận tối thiểu

Giai đoạn 1 nhắm đến WCAG AA cho năm màn hình MVP. Quy tắc tối thiểu:

- Mọi phần tử tương tác là một `<button>`, `<a>`, `<input>`, hoặc `<select>` thực sự — không phải `<div onClick>`.
- Mọi input form có một `<label>` liên kết; lỗi được liên kết với `aria-describedby`.
- Focus hiển thị: `focus-visible:outline-2 focus-visible:outline-brand`. Không xóa outline.
- Huy hiệu giỏ hàng và huy hiệu trạng thái đơn hàng không chỉ dựa vào màu: bao gồm văn bản (`PAID`, `PENDING`) bên cạnh màu.
- Ảnh có `alt`; ảnh sản phẩm dùng tên sản phẩm làm alt.
- Bàn phím: toàn bộ luồng (menu → chi tiết → giỏ hàng → thanh toán → xác nhận) có thể hoàn thành chỉ với bàn phím. Script demo bao gồm một lượt bàn phím.

**Không trong Giai đoạn 1:** luồng đã xác minh bằng screen-reader, reduced-motion, theme tương phản cao. Đây là ứng viên backlog Giai đoạn 2, không phải thất bại Giai đoạn 1.

## 8. Quy ước đặt tên cho code UI

| Thứ                            | Quy tắc                             | Ví dụ                                      |
| ------------------------------ | ----------------------------------- | ------------------------------------------ |
| Component (tệp)                | `kebab-case.tsx`                    | `product-card.tsx`                         |
| Component (xuất)               | `PascalCase`                        | `export function ProductCard()`            |
| Component dùng chung           | `apps/web/src/components/`          | `apps/web/src/components/empty-state.tsx`  |
| Component tính năng            | `apps/web/src/features/<feature>/`  | `apps/web/src/features/cart/cart-line.tsx` |
| Hook                           | `use-<verb>-<noun>.ts`, xuất `useX` | `use-auth.ts` → `useAuth`                  |
| Tệp store                      | `<domain>-store.ts`                 | `cart-store.ts`                            |
| Tiện ích                       | `apps/web/src/lib/<topic>.ts`       | `format.ts`, `pricing.ts`                  |
| Kiểu dùng chung giữa tính năng | `apps/web/src/types/<domain>.ts`    | `types/order.ts`                           |

**Quy tắc:** một component được dùng bởi đúng một tính năng sống trong thư mục của tính năng đó, không phải trong `components/`. Chỉ nâng lên `components/` khi một tính năng thứ hai dùng nó (điều này phản chiếu `project-structure.md`).

## 9. Quyết định theo từng màn hình (tóm tắt)

Wireframes đầy đủ nằm trong `wireframes.md`; bảng này ghi lại các quyết định không hiển nhiên từ wireframe.

| Màn hình          | Quyết định                                                                                               | Ghi chú                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Menu              | Lưới card; mỗi card là link đến chi tiết; thân card không phải button                                    | Tiếp cận §7                                                            |
| Menu              | Giá trên card là giá **cơ sở**, không phải khoảng                                                        | Giá theo kích cỡ chỉ có trên màn hình chi tiết                         |
| Menu              | Huy hiệu giỏ hàng ở header, luôn hiển thị                                                                | 0 ẩn huy hiệu thay vì hiển thị "0"                                     |
| Chi tiết sản phẩm | Bộ chọn kích cỡ mặc định là **M**                                                                        | Người dùng có thể đổi trước khi thêm; nút thêm phản ánh tổng hiện tại  |
| Chi tiết sản phẩm | Topping là checkbox, không phải dropdown                                                                 | Chọn nhiều, khớp với mô hình tư duy quán cà phê                        |
| Chi tiết sản phẩm | Giá cập nhật trực tiếp trên mỗi lựa chọn                                                                 | Không có nút "tính"                                                    |
| Giỏ hàng          | Điều khiển số lượng là `− qty +` với `−` bị vô hiệu ở 1, và một link "xóa" riêng                         | Hai hành động riêng biệt; xóa không cần bấm `−` nhiều lần              |
| Giỏ hàng          | Giỏ hàng trống hiển thị `<EmptyState>` với hành động "Duyệt menu"                                        | `scenarios.md` S-CART-1                                                |
| Thanh toán        | Bộ chọn phương thức là hai card radio lớn (Wallet / Card), không phải `<select>`                         | Wireframe PDF hiển thị hai card lựa chọn; radio giữ nó tiếp cận được   |
| Thanh toán        | "Xác nhận" bị vô hiệu trong khi yêu cầu đang bay                                                         | Ngăn S-PAY-4 double-submit trước Nhiệm vụ 10b                          |
| Xác nhận          | Hiển thị mã đơn hàng, huy hiệu trạng thái, và hành động chính "Quay lại menu"                            | Định dạng mã đơn hàng là D3 trong `scenarios.md`                       |
| Xác nhận          | Khi lỗi (không tìm thấy / không phải của bạn), hiển thị thông điệp an toàn với hành động "Quay lại menu" | Không rò rỉ thông tin; `scenarios.md` S-ORD-4                          |
| Lịch sử           | Mỗi dòng hiển thị mã, ngày, tổng, huy hiệu trạng thái; click mở xác nhận/chi tiết                        | Mới nhất trước                                                         |
| Xác thực          | Form đăng nhập có gợi ý "quay lại thanh toán" khi bị chuyển hướng từ checkout                            | Dùng tham số truy vấn `?next=`, được validate là đường dẫn cùng origin |

## 10. Những gì *không* được quyết định ở đây

Hoãn lại, với nhiệm vụ sẽ quyết định chúng:

- **Triển khai component chính xác** (skeleton, toast) — Nhiệm vụ 3 và sau đó, theo màn hình.
- **Animation / transition** — Giai đoạn 2; không phải yêu cầu Giai đoạn 1.
- **Bộ icon** — chọn khi cần icon đầu tiên; xem §1.
- **Chế độ tối** — ngoài phạm vi MVP.
- **Quốc tế hóa** — chỉ tiếng Việt trong MVP; không có framework i18n.
- **Tách design system** — nếu nhóm phát triển vượt 5 màn hình, tách token vào Storybook; không trước đó.

## 11. Mục còn mở

| Mục                                                         | Người phụ trách | Đóng khi                                          |
| ----------------------------------------------------------- | --------------- | ------------------------------------------------- |
| Tạo ADR 0006 (trạng thái UI + lưu trữ token xác thực)       | Nghĩa           | Nhiệm vụ 5.0 `● Xong`                             |
| Tạo `tests/fixtures/pricing-cases.json`                     | H.Tài           | Nhiệm vụ 4.0 hoặc Nhiệm vụ 6.0 `● Xong`           |
| Chọn `tailwind.config.ts` vs `@theme` trong `globals.css`   | Nghĩa           | PR component đầu tiên                             |
| Giải quyết D3 (khóa route xác nhận: id vs code)             | Nghĩa           | `api-contract.md` chốt                            |
| Thêm wireframe màn hình xác thực                            | Nghĩa           | Cập nhật `wireframes.md` trong Nhiệm vụ 7.0       |
| Xác minh render dấu tiếng Việt với bất kỳ webfont tương lai | Nghĩa           | PR webfont đầu tiên (có thể không bao giờ xảy ra) |

---

## Ghi chú về các lựa chọn tôi đã đưa ra (để bạn chấp nhận hoặc ghi đè)

1. **Phần giá (§4) là phần dài nhất của tài liệu, và điều đó là có chủ ý.** `scenarios.md` S-ORD-1 và `product-backlog.md` Nhiệm vụ 4/6 đều nêu rõ rằng frontend và backend phải tính cùng một tổng. Điều đó không xảy ra bằng cách viết "chúng nên khớp nhau" — nó xảy ra bằng cách đặt bảng giá trong hai tệp sao chép và buộc một fixture dùng chung (§4.2). Đây là quyết định duy nhất trong tài liệu ngăn một lỗi thực sự; mọi thứ khác là tính nhất quán.

2. **Ghi chú dấu tiếng Việt của §3.2 không phải là filler.** Bài tập bằng tiếng Việt, UI có văn bản tiếng Việt, và `system-ui` render `ễ`/`ữ`/`đ` đúng trong khi nhiều font hiển thị thời thượng không làm được. Gắn cờ nó bây giờ có nghĩa là một PR webfont có một mục checklist thay vì một lỗi production.

3. **Quy tắc "thêm một phụ thuộc yêu cầu một lý do một dòng ở đây" của §1 là cơ chế quản trị.** Không có nó, người đầu tiên muốn `react-hook-form` hoặc `framer-motion` sẽ thêm nó và không ai nhận ra. Với nó, lý do nằm trong Git và một reviewer có thể nói "cái gì hỏng nếu không có nó?" — đó là câu hỏi duy nhất quan trọng.

4. **Tôi đã thêm một tham chiếu chuyển tiếp ADR 0006** (trạng thái UI + lưu trữ token xác thực) vì lựa chọn `localStorage` của §5.2 là một quyết định bảo mật, không chỉ là sở thích. Nó xứng đáng có một ADR nêu rõ sự đánh đổi XSS, và bảng mục còn mở có dòng đó. Nếu bạn không muốn tạo ADR thứ 6, hãy gộp nó vào ADR 0002 (monorepo) hoặc ADR 0005 (quy ước API) — nhưng đừng để nó không được ghi lại, vì "tại sao token lại ở trong localStorage?" sẽ được hỏi trong review.

5. **Bảng theo từng màn hình của §9 là cầu nối đến `wireframes.md`.** Tài liệu tiếp theo sẽ nhúng năm hình wireframe và chỉ định các route và tiêu chí chấp nhận mà mỗi hình phục vụ; bảng này ghi lại *các lựa chọn* trong những màn hình đó mà hình ảnh không thể hiển thị (kích cỡ mặc định M, checkbox không phải dropdown, `−` bị vô hiệu ở 1). Tách quyết định khỏi hình ảnh giữ cho tài liệu wireframe không trở thành một bức tường văn bản và giữ cho tài liệu này không chỉ là hình ảnh.

6. **§6 (trạng thái UI) được viết dưới dạng bảng bốn dòng với quy tắc "không màn hình nào được render một vùng trống trong khi loading."** Đó là cách diễn đạt mạnh nhất tôi có thể dùng trong khi vẫn trung thực với tiêu chí chấp nhận "loading/empty state" của PDF. Đây cũng là bình luận review phổ biến nhất trên các dự án sinh viên — biến nó thành một quy ước được đánh số có nghĩa là một reviewer có thể trích "§6" thay vì giải thích lại.

7. **Một điểm không nhất quán cần kiểm tra:** bảng route của §2 liệt kê `/orders/[id]/confirmation` trong khi `scenarios.md` S-MAIN-1 bước 10 và `product-backlog.md` Nhiệm vụ 9 đều nói `/orders/[id]/confirmation` — tốt, chúng đồng ý. Nhưng D3 trong `scenarios.md` §13 nói route có thể được khóa bằng code thay vì id. Nếu D3 giải quyết thành "code," hãy cập nhật §2 ở đây, `scenarios.md` §12, và `product-backlog.md` §12 trong cùng PR. Đó là ba tài liệu — đó chính xác là lý do D3 là một mục còn mở thay vì một mặc định âm thầm.