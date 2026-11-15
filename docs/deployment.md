# BrewLite - Hướng dẫn Triển khai Cục bộ

Hướng dẫn này mô tả việc triển khai Docker Compose cục bộ cho phát triển và demo trên lớp. Stack được định nghĩa trong [`docker-compose.yml`](../docker-compose.yml) (`S-04`) với các image trong `apps/api/Dockerfile` và `apps/web/Dockerfile`. Phần production và rollback được thêm trong `D-15` (P7).

## 1. Yêu cầu tiên quyết

- Docker Desktop với Docker Compose v2, chạy trên Windows/macOS/Linux.
- Git.
- Node.js là tùy chọn cho việc chỉ dùng container; cài nó nếu chạy ứng dụng ngoài container.
- PostgreSQL được cung cấp bởi Compose; không cần cài đặt PostgreSQL cục bộ riêng.

## 2. Các dịch vụ và cổng kỳ vọng

| Dịch vụ | Cổng container |                       Cổng host | Mục đích              |
| ------- | -------------: | ------------------------------: | --------------------- |
| `web`   |           3000 |                            3000 | Giao diện web Next.js |
| `api`   |           3001 |                            3001 | REST API NestJS       |
| `db`    |           5432 | `POSTGRES_PORT` (mặc định 5432) | PostgreSQL            |

Bên trong Compose, API kết nối đến host `db`, không phải `localhost`. Yêu cầu từ trình duyệt dùng URL API hiển thị trên host; cấu hình nó riêng biệt với URL cơ sở dữ liệu nội bộ của backend.

## 3. Cấu hình

1. Sao chép `.env.example` thành `.env` ở thư mục gốc repository.
2. Đặt giá trị phát triển cục bộ. Không bao giờ commit `.env` hoặc bí mật thật.
3. Cài đặt trong `.env.example`:

```dotenv
POSTGRES_DB=brewlite
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=change-me-local
POSTGRES_PORT=5432
DATABASE_URL=postgresql://brewlite:change-me-local@localhost:5432/brewlite
JWT_SECRET=replace-with-local-random-secret
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`DATABASE_URL` trong `.env` dành cho các lệnh Prisma chạy trên máy của bạn (host `localhost`). Docker Compose xây dựng `DATABASE_URL` riêng của container API từ các giá trị `POSTGRES_*` với host `db`, nên bạn không chỉnh sửa nó cho Compose. Prisma (ADR 002) đọc nó qua `apps/api/prisma.config.ts`. `CORS_ORIGIN` phải khớp với URL mà trình duyệt dùng cho frontend, vì trình duyệt gọi API trực tiếp. Dùng thông tin đăng nhập được mã hóa URL trong `DATABASE_URL` nếu mật khẩu chứa ký tự dành riêng cho URL; Compose chèn `POSTGRES_PASSWORD` vào URL của nó nguyên trạng, nên hãy chọn mật khẩu cục bộ không có chúng. Bí mật production phải đến từ môi trường triển khai hoặc kho bí mật.

## 4. Khởi động stack

Từ thư mục gốc repository:

```powershell
docker compose up --build -d
```

Kiểm tra trạng thái và log:

```powershell
docker compose ps
docker compose logs -f api
```

Container API áp dụng các migration đang chờ (`prisma migrate deploy`) mỗi lần khởi động. Nạp dữ liệu mẫu một lần (30 sản phẩm, 5 topping, 10 khách hàng demo, tài khoản admin `admin@brewlite.vn`, khuyến mãi `BREW10` và `WELCOME20K`); seed an toàn khi chạy lại:

```powershell
docker compose exec api npm run db:seed
```

Các script Prisma trong `apps/api` (chạy chúng trong container, hoặc trên máy của bạn với cơ sở dữ liệu Compose và `DATABASE_URL` trỏ đến `localhost`):

| Script                | Lệnh Prisma             | Công dụng                                        |
| --------------------- | ----------------------- | ------------------------------------------------ |
| `npm run db:generate` | `prisma generate`       | Sinh client vào `src/generated/`                 |
| `npm run db:validate` | `prisma validate`       | Kiểm tra `prisma/schema.prisma`                  |
| `npm run db:migrate`  | `prisma migrate dev`    | Tạo và áp dụng migration trong phát triển        |
| `npm run db:deploy`   | `prisma migrate deploy` | Áp dụng các migration đã commit (CI, production) |
| `npm run db:seed`     | `prisma db seed`        | Nạp dữ liệu mẫu                                  |
| `npm run db:reset`    | `prisma migrate reset`  | Xóa và xây dựng lại cơ sở dữ liệu cục bộ         |

Mở UI tại `http://localhost:3000`; nó hiển thị đăng nhập/đăng ký trước và mở menu tại `/menu` sau khi xác thực thành công. Tiêu đề menu hiển thị tên khách hàng bên cạnh giỏ hàng; dropdown tài khoản cung cấp chi tiết hồ sơ, đổi mật khẩu, và đăng xuất. Cơ sở API là `http://localhost:3001`.

## 5. Luồng smoke demo

1. Đăng ký hoặc đăng nhập.
2. Xác minh `GET /products` trả về menu mẫu và duyệt một đồ uống.
3. Chọn kích cỡ/topping và thêm vào giỏ hàng.
4. Tạo đơn hàng và xác minh `PENDING` cùng một định danh đơn hàng.
5. Thanh toán bằng Wallet/Card giả lập; xác minh xác nhận và `PAID`.
6. Mô phỏng thanh toán thất bại và thử lại; xác minh giỏ hàng vẫn khả dụng và hành vi idempotency đúng.
7. Xem `GET /orders/me` và xác nhận chỉ đơn hàng của người dùng đã đăng nhập xuất hiện.

## 6. Dừng và đặt lại

Dừng container trong khi giữ dữ liệu cơ sở dữ liệu:

```powershell
docker compose down
```

Để có cơ sở dữ liệu cục bộ mới, xóa volume Compose (thao tác này xóa nội dung DB cục bộ):

```powershell
docker compose down -v
```

Xây dựng lại sau khi thay đổi code hoặc phụ thuộc:

```powershell
docker compose up --build -d
```

## 7. Manifest Compose

- `db` có health check `pg_isready` và giữ dữ liệu trong volume có tên `db-data`.
- `api` chỉ khởi động sau khi `db` khỏe mạnh, chạy `prisma migrate deploy`, rồi khởi động NestJS. Health check của nó gọi `GET /api/v1` bên trong container. Trong lúc chạy migration, `docker compose ps` hiển thị `health: starting` (máy chậm có thể hiện `unhealthy` vài phút); khi NestJS đã khởi động xong thì chuyển sang `healthy`.
- `web` được build với `NEXT_PUBLIC_API_URL` như một build argument, vì Next.js nhúng nó tại thời điểm build. Build lại image web sau khi thay đổi nó.
- Tất cả dịch vụ chia sẻ mạng Compose riêng mặc định; chỉ cổng 3000, 3001, và cổng cơ sở dữ liệu được publish cho sử dụng cục bộ.
- Nhà cung cấp thanh toán là mock (`PAYMENT_PROVIDER=mock`); thông tin đăng nhập cục bộ là placeholder.
- `.env`, tệp cơ sở dữ liệu, và bí mật nằm ngoài Git (`.gitignore`, `.dockerignore`).

## 8. Xử lý sự cố

- **Docker daemon không khả dụng:** khởi động Docker Desktop và thử lại `docker compose ps`.
- **Cổng đã được dùng:** dừng dịch vụ xung đột hoặc thay đổi ánh xạ cổng host và URL API frontend cùng nhau.
- **API không thể đến DB:** dùng `db` làm hostname bên trong Compose; xác nhận sức khỏe DB và thông tin đăng nhập.
- **Thiếu schema/bảng:** kiểm tra `docker compose logs api` cho bước migration, sau đó chạy `docker compose exec api npm run db:seed`.
- **Trình duyệt không thể đến API:** publish cổng host API và đặt `NEXT_PUBLIC_API_URL` thành `localhost`, không phải tên dịch vụ chỉ có trong Compose.
- **Trình duyệt báo lỗi CORS:** đặt `CORS_ORIGIN` thành origin frontend chính xác (giao thức, host, và cổng), sau đó khởi động lại API (`docker compose up -d api`).
- **Web hiển thị menu trống:** kiểm tra log API, seed sản phẩm, và xác minh URL API.

## 9. Ghi chú production

Runbook này chỉ nhắm đến phát triển cục bộ và demo học thuật. Triển khai công khai cần TLS, bí mật được quản lý, mạng cơ sở dữ liệu bị hạn chế, sao lưu, giám sát, tích hợp thanh toán thật, và cấu hình nền tảng production đã được review.