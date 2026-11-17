# Kiểm thử API bằng Postman

Collection `BrewLite.postman_collection.json` gồm 34 request, 64 kiểm tra tự động, chia 8 nhóm. Đường dẫn cơ sở là `/api` (ADR 0005, cập nhật 17/11/2026).

| Nhóm | Nội dung | Yêu cầu |
| --- | --- | --- |
| 00 API đang chạy | Gọi gốc `/api`, thời gian phản hồi < 500 ms | NFR-01 |
| 01 Products | Danh sách, chi tiết, id không tồn tại, id sai định dạng | FR-01, FR-02 |
| 02 Auth | Đăng ký, email trùng, mật khẩu ngắn, sai mật khẩu, đăng nhập, `/auth/me` | FR-04, NFR-02 |
| 03 Cart | Lưu giỏ (gộp dòng trùng), đọc giỏ, xóa giỏ | FR-03 |
| 04 Orders | Không token, giỏ rỗng, size sai, món lạ, giá client bị bỏ qua | FR-05, FR-09, NFR-06 |
| 05 Payments | Thiếu `Idempotency-Key`, thanh toán, gửi lại cùng key, cùng key khác body, trả lại đơn đã PAID | FR-06, FR-10 |
| 06 Order history | Lịch sử, chi tiết theo mã, cộng điểm, mã lạ, không token | FR-07, FR-13 |
| 07 Admin | Khách gọi API admin bị 403, admin xem tồn kho | Mở rộng |

## Cách collection chạy

Các request chạy nối tiếp và truyền dữ liệu cho nhau qua biến của collection: Products lưu `productId`, Auth tự đăng ký một email mới rồi lưu `token`, Orders lưu `orderId` và `orderCode`, Payments tạo `Idempotency-Key` ngẫu nhiên. Vì vậy phải chạy cả collection theo thứ tự; gửi lẻ một request ở giữa sẽ thiếu biến.

## Chạy trong Postman

1. Chạy database và API: `docker compose up -d db`, rồi trong `apps/api`: `npm run db:deploy`, `npm run db:seed`, `npm run start:dev`.
2. Postman → **Import** cả hai file `BrewLite.postman_collection.json` và `BrewLite.local.postman_environment.json`.
3. Chọn environment **BrewLite Local**. Điền `adminPassword` bằng mật khẩu admin trong `apps/api/prisma/seed.ts` (dữ liệu demo). Đổi `baseUrl` nếu API không chạy ở `http://localhost:3001/api`.
4. Chuột phải collection → **Run collection**.

## Chạy bằng dòng lệnh (Newman)

```bash
npx newman run docs/testing/postman/BrewLite.postman_collection.json -e docs/testing/postman/BrewLite.local.postman_environment.json --env-var "adminPassword=<mật khẩu admin seed>"
```

## Lưu ý

- Mỗi lần chạy thêm một tài khoản `postman_…@brewlite.test` và một đơn hàng vào database.
- Với `PAYMENT_MOCK_MODE=failure`, thanh toán trả `200` với `status: PAYMENT_FAILED`; nhóm 05–06 giả định chế độ `success`.
- Tạo đơn với món không tồn tại: code trả `404 PRODUCT_NOT_FOUND` và collection kiểm tra 404; API contract §8 hiện vẫn ghi `400`.
- Phản hồi `POST /payments` không có `loyaltyPointsEarned`; điểm tích lũy được kiểm tra qua `GET /orders/:code`.
