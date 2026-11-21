# Kiểm thử API bằng Postman

Collection `BrewLite.postman_collection.json` kiểm thử toàn bộ API của nhánh `main`, đường dẫn cơ sở `/api`: 66 request, 115 kiểm tra tự động, chia 9 nhóm.

| Nhóm | Nội dung | Yêu cầu |
| --- | --- | --- |
| 00 Kiểm tra API | Gốc `/api` trả lời, thời gian phản hồi < 500 ms | NFR-01 |
| 01 Sản phẩm | Danh sách, chi tiết, id không tồn tại, id sai định dạng | FR-01, FR-02 |
| 02 Tài khoản | Đăng ký, email trùng, mật khẩu yếu, tên ngắn, đăng nhập sai/đúng, `/auth/me`, đổi mật khẩu | FR-04, NFR-02 |
| 03 Khuyến mãi | Kiểm tra mã `BREW10`, mã chưa đủ đơn tối thiểu, mã không tồn tại | FR-12 |
| 04 Giỏ hàng | Lưu giỏ (gộp dòng trùng), đọc, món không tồn tại, xóa giỏ, không token | FR-03 |
| 05 Đặt đơn | Không token, giỏ rỗng, size sai, số lượng 0, món lạ, đơn có mã giảm giá, giá client bị bỏ qua | FR-05, FR-09, FR-12, NFR-06 |
| 06 Thanh toán | Thiếu `Idempotency-Key`, `orderId` sai định dạng, thanh toán Ví, gửi lại cùng key, cùng key khác body, trả lại đơn đã PAID | FR-06, FR-10 |
| 07 Lịch sử đơn | Lịch sử, chi tiết theo mã, cộng điểm, chi tiết theo id bị 404, mã lạ, không token, khách tự đổi trạng thái bị 403 | FR-07, FR-08, FR-13 |
| 08 Quản trị | Khách bị 403; admin xem/cập nhật tồn kho, giá và tồn kho topping, khóa/mở khóa tài khoản, tạo/tắt mã khuyến mãi, đổi trạng thái đơn PAID → PREPARING → READY → COMPLETED, chuyển sai bị 409, hủy đơn | Quản trị |

## Cách collection chạy

- Collection dùng **Bearer `{{token}}`** cho mọi request; request công khai đặt *No Auth*, request quản trị dùng `{{adminToken}}`.
- Các request chạy nối tiếp và truyền dữ liệu qua biến của collection (`productId`, `token`, `orderId`, `orderCode`…), nên phải **chạy cả collection theo thứ tự**.
- Mỗi lần chạy tự đăng ký một tài khoản `postman_…@brewlite.test`, tạo 2 đơn hàng và 1 mã khuyến mãi `POSTMAN…` (đã tắt). Tồn kho và giá chỉ được ghi lại đúng giá trị cũ; tài khoản test bị khóa rồi được mở khóa lại.

## Chạy trong Postman

1. Chạy database và API: `docker compose up -d db`, rồi trong `apps/api`: `npm run db:deploy`, `npm run db:seed`, `npm run start:dev`.
2. Postman → **Import** cả hai file `BrewLite.postman_collection.json` và `BrewLite.local.postman_environment.json`.
3. Chọn environment **BrewLite Local**, điền `adminPassword` bằng mật khẩu admin trong `apps/api/prisma/seed.ts` (dữ liệu demo). Đổi `baseUrl` nếu API không chạy ở `http://localhost:3001/api`.
4. Chuột phải collection → **Run collection**.

## Chạy bằng dòng lệnh (Newman)

```bash
npx newman run docs/testing/postman/BrewLite.postman_collection.json -e docs/testing/postman/BrewLite.local.postman_environment.json --env-var "adminPassword=<mật khẩu admin seed>"
```

## Lưu ý

- Các nhóm 06–08 giả định `PAYMENT_MOCK_MODE=success`. Với `failure`, thanh toán vẫn trả `200` nhưng `status: PAYMENT_FAILED`.
- Mật khẩu đăng ký phải có ít nhất 8 ký tự, gồm cả chữ và số (`password`, `newPassword` trong environment đã đáp ứng).
- Kết quả ngày 21/11/2026 trên `main` (`16752db`): 66 request, 115/115 kiểm tra đạt, chạy lại lần hai trên cùng database vẫn đạt.
