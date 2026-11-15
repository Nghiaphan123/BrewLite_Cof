# BrewLite - Đo thời gian phản hồi API (N1)

**Yêu cầu:** đề Assignment 1 §4.2, "Thời gian phản hồi API < 500ms với dữ liệu mẫu" (task #65 trong file danh sách task)  
**Ngày đo:** 15/11/2026  
**Kết quả:** **Đạt.** Cả 4 endpoint có p95 dưới 500 ms ở cả 2 lần đo; không request nào vượt 500 ms.  
**Liên quan:** [Traceability matrix N1](../traceability-matrix.md), [Test strategy](test-strategy.md), script [`apps/api/scripts/measure-response-time.mjs`](../../apps/api/scripts/measure-response-time.mjs)

## 1. Cách đo

- **Endpoint:** `GET /products`, `GET /products/:id`, `POST /auth/login`, `GET /orders/me` (4 endpoint ghi trong task #65).
- **Môi trường:** stack `docker compose` (db, api, web) chạy trên máy cá nhân; script gọi API qua `http://localhost:3001/api/v1`.
  - Máy: Intel Core i5-6300HQ 2,3 GHz, RAM 8 GB, Windows 10, Docker Desktop.
  - Node v24 (máy chạy script); `BCRYPT_ROUNDS` mặc định 10.
- **Dữ liệu mẫu:** seed của dự án (`npm run db:seed`): 30 món, 5 topping. Tài khoản `customer01@brewlite.test` có 1 đơn.
- **Cách gửi:** mỗi endpoint 5 lần làm nóng (không tính) rồi 50 lần đo, gửi lần lượt từng request (một người dùng). Thời gian tính từ lúc gửi tới lúc đọc xong body.
- **Tiêu chí đạt:** p95 < 500 ms cho từng endpoint. Bảng có kèm Max để thấy request chậm nhất.

Chạy lại:

```bash
docker compose up -d          # hoặc chạy API bằng npm run start:dev
cd apps/api
node scripts/measure-response-time.mjs
```

Script in bảng Markdown như bên dưới và thoát với mã 1 nếu có endpoint không đạt.

## 2. Kết quả

### Lần 1 (21:30, 15/11/2026)

| Endpoint | Min (ms) | Trung vị (ms) | TB (ms) | p95 (ms) | Max (ms) | Đạt (p95 < 500 ms) |
| --- | ---: | ---: | ---: | ---: | ---: | :---: |
| `GET /products` | 4.1 | 12.6 | 43.7 | 189.5 | 338.9 | Đạt |
| `GET /products/:id` | 4.7 | 8.1 | 27.6 | 136.1 | 323.5 | Đạt |
| `POST /auth/login` | 162.2 | 302.1 | 282.5 | 335.7 | 419.1 | Đạt |
| `GET /orders/me` | 7.9 | 15.1 | 18.4 | 47.8 | 61.6 | Đạt |

### Lần 2 (ngay sau lần 1)

| Endpoint | Min (ms) | Trung vị (ms) | TB (ms) | p95 (ms) | Max (ms) | Đạt (p95 < 500 ms) |
| --- | ---: | ---: | ---: | ---: | ---: | :---: |
| `GET /products` | 3.5 | 4.3 | 10.2 | 46.0 | 71.3 | Đạt |
| `GET /products/:id` | 4.4 | 6.4 | 10.2 | 27.1 | 44.9 | Đạt |
| `POST /auth/login` | 151.9 | 280.5 | 263.4 | 349.0 | 368.1 | Đạt |
| `GET /orders/me` | 6.9 | 14.8 | 20.5 | 41.6 | 168.4 | Đạt |

## 3. Nhận xét

- **Đọc dữ liệu rất nhanh:** `GET /products`, `GET /products/:id`, `GET /orders/me` có trung vị dưới 20 ms. Các lần chậm hơn ở lần 1 (Max khoảng 330 ms) rơi vào lúc máy đang bận chạy Docker Desktop; lần 2 Max dưới 170 ms.
- **`POST /auth/login` chậm nhất** (trung vị khoảng 280–300 ms) vì phải so mật khẩu bằng bcrypt với 10 vòng băm. Đây là chủ ý để chống dò mật khẩu (yêu cầu bảo mật §4.2), và vẫn dưới 500 ms với khoảng cách hơn 80 ms. Mỗi vòng bcrypt thêm vào làm thời gian băm tăng gấp đôi, nên nếu tăng `BCRYPT_ROUNDS` lên 12 (gấp 4 lần) thì đăng nhập dễ vượt 500 ms trên máy này; nên giữ mức 10.
- **Giới hạn của phép đo:** chỉ đo một người dùng gửi lần lượt, trên một máy, với dữ liệu mẫu (30 món, 1 đơn). Phép đo không phải kiểm thử tải nhiều người dùng cùng lúc.
