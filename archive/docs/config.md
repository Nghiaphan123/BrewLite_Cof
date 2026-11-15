# BrewLite - Cấu hình

**Trạng thái:** Sản phẩm bàn giao Giai đoạn 1
**Người phụ trách:** Nghĩa (Nhiệm vụ 1.0, Nhiệm vụ 11.0, Nhiệm vụ 12.0)
**Liên quan:** [Cài đặt](setup.md), [Cấu trúc dự án](project-structure.md), [ADR 0003 Cơ sở dữ liệu](architecture/adr/0003-database-postgres-prisma.md), [ADR 0004 Thanh toán giả lập](architecture/adr/0004-payment-mock-method.md), [Thỏa thuận làm việc](working-agreement.md)

Tài liệu này là hợp đồng bằng văn bản cho mọi biến môi trường, cổng, và hằng số dự án trong BrewLite. Nếu một giá trị ở đây khác với `.env.example`, tài liệu này thắng; nếu tài liệu này khác với một ứng dụng đang chạy, một trong hai sai và phải được sửa trong cùng PR.

> **Độ ổn định:** các giá trị được đánh dấu **🔒 Đã khóa** là đã chốt và chỉ có thể thay đổi qua một ADR. Các giá trị được đánh dấu **🟡 Tạm thời** đang được dùng nhưng chưa được phê chuẩn — mỗi giá trị đi kèm một gợi ý sửa và một người ra quyết định. Các giá trị được đánh dấu **⬜ Mở** chưa được quyết định; không hard-code chúng.

## 1. Cổng

### 1.1 Bảng cổng

| Dịch vụ                 | Cổng               | Trạng thái | Binding     | Ghi chú                                                                            |
| ----------------------- | ------------------ | ---------- | ----------- | ---------------------------------------------------------------------------------- |
| Web (Next.js)           | `3000`             | 🔒 Đã khóa  | `localhost` | Mặc định Next.js; cũng là origin dùng trong CORS.                                  |
| API (NestJS)            | `3001`             | 🟡 Tạm thời | `localhost` | Mặc định Nest quy ước. Xem §1.2 để biết rủi ro và cách sửa.                        |
| PostgreSQL              | `5432`             | 🔒 Đã khóa  | `localhost` | Bên trong container `db`; cổng host có thể được ánh xạ lại (§1.3).                 |
| Prisma Studio           | `5555`             | 🔒 Đã khóa  | `localhost` | Cổng mặc định của Prisma Studio; chỉ dùng khi phát triển.                          |
| Cổng thanh toán giả lập | *trong tiến trình* | 🔒 Đã khóa  | —           | Mock Giai đoạn 1 chạy bên trong tiến trình API; không có cổng riêng. Xem ADR 0004. |

**Cách các giá trị này được tiêu thụ:**

- Web đọc cổng của chính nó từ Next.js (`npm run dev -p <port>` nếu bị ghi đè); `NEXT_PUBLIC_API_URL` phải trỏ đến cổng API.
- API đọc `PORT` từ `apps/api/.env`; `main.ts` gọi `app.listen(process.env.PORT)`.
- Danh sách cho phép CORS của API đọc `WEB_ORIGIN` (phải bao gồm cổng web).
- `DATABASE_URL` trong `apps/api/.env` phải khớp với cổng Postgres được ánh xạ trên host.
- `docker-compose.yml` ánh xạ cổng host↔container chỉ cho `db`.

### 1.2 Rủi ro và cách sửa cổng API (🟡 Tạm thời → 🔒)

**Tại sao `3001` là tạm thời:** đây là lựa chọn NestJS quy ước đi kèm với `3000` của Next, nhưng không có gì trong bài tập hoặc bảng tính ghim nó. Hai chế độ lỗi đủ phổ biến để lập kế hoạch:

1. **Xung đột trên máy của lập trình viên.** Một dịch vụ cục bộ khác (một ứng dụng Nest thứ hai, một bảng điều khiển Docker, một plugin IDE nào đó) đã giữ `3001`. API không bind được và lỗi dễ bị bỏ sót nếu bạn chỉ nhìn terminal web.
2. **Xung đột với một dịch vụ tương lai.** Nếu Giai đoạn 2+ thêm một tiến trình backend thứ hai (ví dụ một queue worker hoặc một mock gateway trên cổng riêng), `3001` là cổng đầu tiên nó sẽ muốn.

**Gợi ý sửa, theo thứ tự ưu tiên:**

| Lựa chọn                             | Khi nào chọn                                              | Thay đổi gì                                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Giữ `3001`, ghi chú ở mọi nơi** | Nhóm tin chắc không có gì khác cần `3001`                 | Phê chuẩn trong một ADR; không thay đổi code.                                                                                                 |
| **B. Chuyển API sang `4000`**        | Bạn muốn cổng API khác biệt rõ ràng và không liền kề Next | `PORT=4000`, `NEXT_PUBLIC_API_URL=http://localhost:4000`, `WEB_ORIGIN` không đổi, cập nhật `docker-compose.yml` nếu API được container hóa.   |
| **C. Cấp phát lúc runtime**          | Bạn kỳ vọng sự khác biệt giữa các lập trình viên          | API đọc `PORT` (mặc định `3001`); web đọc `NEXT_PUBLIC_API_URL` — đã là thiết kế hiện tại. Không hard-code cổng trong code, chỉ trong `.env`. |

**Điều không được xảy ra:** hard-code cổng API trong các lệnh gọi fetch của frontend, trong healthcheck của `docker-compose.yml`, hoặc trong bất kỳ tài liệu nào khác ngoài tài liệu này và `.env.example`. Cách sửa cho xung đột cổng phải là một chỉnh sửa `.env` một dòng, không bao giờ là thay đổi code.

**Người ra quyết định:** Nghĩa. **Hạn chót:** trước khi Nhiệm vụ 11.0 (backend Hello) được đánh dấu `● Xong`. Cho đến lúc đó, hãy coi `3001` là mặc định trong tài liệu và `.env.example`, và ghi lại cổng thực tế được bind trong ghi chú bằng chứng Nhiệm vụ 11.0.

### 1.3 Ánh xạ lại cổng host PostgreSQL

Dịch vụ `db` luôn lắng nghe trên `5432` **bên trong** container. Trên host nó ánh xạ `5432:5432` theo mặc định. Nếu `5432` đã bị một bản cài Postgres cục bộ chiếm:

```yaml
# docker-compose.yml (db service)
ports:
  - "5433:5432"   # host:container
```

Sau đó cập nhật `apps/api/.env`:

```dotenv
DATABASE_URL="postgresql://brewlite:brewlite@localhost:5433/brewlite?schema=public"
```

Bên trong mạng Compose (nếu API được container hóa), host là `db` và cổng luôn là `5432` — việc ánh xạ lại chỉ ảnh hưởng đến kết nối từ host. Ghi lại bất kỳ ánh xạ lại nào trong ghi chú bằng chứng Nhiệm vụ 11.0.

## 2. Biến môi trường

Hai tệp env, mỗi ứng dụng một tệp. Không tệp nào được commit. Cả hai đều có tệp anh em `.env.example` **được** commit và phải luôn đồng bộ với bảng này.

### 2.1 `apps/api/.env`

| Biến                | Trạng thái | Bắt buộc | Mặc định / ví dụ                                                       | Mục đích                                                                                                |
| ------------------- | ---------- | -------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`          | 🔒          | có       | `development`                                                          | Chế độ runtime Nest. `production` tắt log đẹp và bật validate nghiêm ngặt hơn.                          |
| `PORT`              | 🟡          | có       | `3001`                                                                 | Cổng lắng nghe API. Xem §1.2.                                                                           |
| `WEB_ORIGIN`        | 🔒          | có       | `http://localhost:3000`                                                | Mục trong danh sách cho phép CORS. Phải là origin chính xác — không dấu gạch chéo cuối, không wildcard. |
| `DATABASE_URL`      | 🔒          | có       | `postgresql://brewlite:brewlite@localhost:5432/brewlite?schema=public` | Chuỗi kết nối Prisma. Host là `localhost` cho API chạy trên host, `db` cho API trong container (§1.3).  |
| `JWT_SECRET`        | 🟡          | có       | *(chỉ dev)* `change-me-in-dev-only-32-chars-min`                       | Khóa ký HMAC. ≥ 32 ký tự. Không bao giờ commit giá trị thật. Xem §4.                                    |
| `JWT_EXPIRES_IN`    | 🔒          | có       | `1d`                                                                   | TTL token. Ngắn hơn cho bản demo cũng được.                                                             |
| `BCRYPT_ROUNDS`     | 🔒          | có       | `10`                                                                   | Chi phí hash mật khẩu.                                                                                  |
| `PAYMENT_MOCK_MODE` | 🟡          | có       | `success`                                                              | Bộ chọn hành vi mock: `success` \| `failure` \| `random`. Xem ADR 0004.                                 |
| `LOG_LEVEL`         | 🔒          | không    | `debug`                                                                | Mức logger Nest. `info` trong bản demo.                                                                 |

### 2.2 `apps/web/.env`

| Biến                  | Trạng thái | Bắt buộc | Mặc định / ví dụ        | Mục đích                                                                                         |
| --------------------- | ---------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | 🟡          | có       | `http://localhost:3001` | URL cơ sở trình duyệt dùng để đến API. Phải bao gồm giao thức và cổng, không dấu gạch chéo cuối. |
| `NEXT_PUBLIC_APP_ENV` | 🔒          | không    | `development`           | Huy hiệu môi trường UI / cổng feature-flag.                                                      |

**Ngữ nghĩa `NEXT_PUBLIC_*`:** các biến này được nhúng tại thời điểm build/khởi động. Sửa `apps/web/.env` yêu cầu khởi động lại dev-server; trong một bản build production nó yêu cầu build lại. Không bao giờ đặt bí mật trong một biến `NEXT_PUBLIC_*`.

### 2.3 Quy tắc đồng bộ với `.env.example`

`.env.example` phải chứa **mọi** biến trong các bảng trên, với một giá trị placeholder an toàn và một bình luận một dòng. Khi một biến được thêm, xóa, hoặc đổi tên:

1. Cập nhật bảng này trong cùng PR.
2. Cập nhật `.env.example` tương ứng.
3. Grep repo để tìm tên cũ và sửa những chỗ còn sót.

Một PR đụng đến biến env mà không đụng đến tài liệu này sẽ trượt review. Đây là điểm thực thi.

## 3. Các hằng số không phải biến env

Một số giá trị là quyết định của dự án, không phải cài đặt theo môi trường. Chúng nằm trong code, và bảng này là nguồn chân lý của chúng.

| Hằng số                             | Giá trị                                                                 | Trạng thái | Ở đâu                                                                     | Tại sao là tài liệu mà không phải bình luận                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Ngày bắt đầu dự án                  | `2026-10-26` (Thứ Hai)                                                  | 🔒          | bảng tính `Cấu hình!B3`                                                   | Điều khiển mọi phép toán lịch trình; xem §5.                                                                                                 |
| Ngày làm việc                       | Thứ Hai–Thứ Sáu                                                         | 🔒          | bảng tính `Cấu hình!B4`                                                   | Không có ngày lễ trong kế hoạch.                                                                                                             |
| Giờ tối đa/ngày: H.Tài, Nghĩa, Luân | `5.0`                                                                   | 🔒          | bảng tính `Cấu hình!E8:E10`                                               | Giả định năng lực nhóm.                                                                                                                      |
| Giờ tối đa/ngày: P.Tài, Trí         | `3.0`                                                                   | 🔒          | bảng tính `Cấu hình!E11:E12`                                              | Giả định năng lực bán thời gian.                                                                                                             |
| Kích thước nhiệm vụ chuẩn           | `6.0` điểm                                                              | 🔒          | bảng tính `Cấu hình!B5`                                                   | Mốc hiệu chuẩn cho ước lượng nỗ lực.                                                                                                         |
| Trạng thái đơn hàng                 | `PENDING, PAID, PAYMENT_FAILED, PREPARING, READY, COMPLETED, CANCELLED` | 🔒          | ADR 0004 + `orders.service.ts` + enum `OrderStatus` trong `schema.prisma` | Từ vựng State Machine; phải khớp PDF §9.1. Enum đầy đủ nằm trong ERD Nhiệm vụ 1.0 (ADR 0003 D-ERD-scope), không được thêm trong Giai đoạn 5. |
| Header idempotency                  | `Idempotency-Key`                                                       | 🟡          | `api-contract.md`                                                         | Tên header cho `POST /payments`. Tạm thời cho đến khi Nhiệm vụ 7.0 đóng.                                                                     |
| Tiền tệ                             | VND, số nguyên, không đơn vị lẻ                                         | 🔒          | Prisma schema (`price Int`, `total Int`, `lineTotal Int`, `amount Int`)   | Không dùng số thực cho tiền. Xem ADR 0003 D-ERD-scope.                                                                                       |
| Phong bì lỗi API                    | `{ "statusCode", "message", "error" }`                                  | 🟡          | `api-contract.md`                                                         | Mặc định Nest; có thể mở rộng với `code`.                                                                                                    |

Nếu một giá trị ở đây phải thay đổi, hãy thay đổi nó ở đây **và** ở nơi lưu trữ trong code/bảng tính trong cùng PR. Đừng để hai bên trôi dạt.

### 3.1 Quyết định schema được ghi trong ADR 0003 (theo lô, Nhiệm vụ 1.0 + Nhiệm vụ 10)

ERD Nhiệm vụ 1.0 gộp thiết kế năm thực thể với nhu cầu schema của Nhiệm vụ 10. Các trường sau có trong schema từ migration đầu tiên, không được thêm sau:

| Trường                                                               | Thực thể  | Nhiệm vụ | Tại sao gộp                                                         |
| -------------------------------------------------------------------- | --------- | -------- | ------------------------------------------------------------------- |
| `stock Int`, `version Int @default(0)`                               | `Product` | 10c      | Backfill enum và version rất khó sau seed; xem ADR 0003 D-ERD-scope |
| `idempotencyKey String @unique`, `requestHash String`, `status` enum | `Payment` | 10b      | Ràng buộc unique phải tồn tại trước dòng thanh toán đầu tiên        |
| `loyaltyPoints Int @default(0)`                                      | `User`    | 10d      | Một cột; miễn phí để gộp                                            |
| `status` enum (7 giá trị)                                            | `Order`   | 10a      | Thay đổi enum là migration Postgres khó nhất                        |

**Hoãn lại** (bảng mới, không phải cột): `Promotion` (Giai đoạn 5), `LoyaltyLedger` (Giai đoạn 2+), bảng nối `OrderItemTopping` (Giai đoạn 2+). Mỗi bảng có phiên bản ERD riêng (`erd-core-v2`) khi giai đoạn của nó đến.

## 4. Bí mật và phát triển cục bộ

- **Được commit:** `.env.example` chỉ với giá trị placeholder. Không bao giờ bí mật thật.
- **Không bao giờ commit:** `.env`, `.env.local`, bất kỳ tệp nào khớp với quy tắc env của `.gitignore`.
- **`JWT_SECRET` dev:** chấp nhận được khi dùng một placeholder rõ ràng trong `.env` cục bộ (ví dụ `change-me-in-dev-only-32-chars-min`). **Không** chấp nhận được trong bất kỳ tệp được commit, ảnh chụp màn hình, hoặc mô tả PR. Nếu bạn dán một bản ghi terminal vào PR, hãy che nó đi.
- **Xoay vòng:** nếu một bí mật thật từng bị commit, hãy coi nó đã bị rò rỉ — xoay vòng ngay lập tức và ghi lại trong nhật ký sự cố của `docs/working-agreement.md` (được tạo khi sự cố đầu tiên xảy ra, không phải trước đó).
- **Production:** Giai đoạn 2+ (`docs/deployment.md`) định nghĩa cách bí mật production được tiêm vào. Tài liệu này chỉ bao gồm dev cục bộ.

## 5. Giả định lập kế hoạch (từ bảng tính)

Những điều này được ghi ở đây vì bảng tính là một công cụ làm việc không thể diff trong review code. Nếu một reviewer hỏi "tại sao lịch trình lại như vậy," câu trả lời phải đọc được trong Git.

- **Ngày bắt đầu:** Thứ Hai `2026-10-26`. Mọi công thức `WORKDAY` trong bảng tính neo vào `Cấu hình!B3`. Thay đổi nó sẽ tính lại mọi ngày được tính toán; thay đổi nó không tính lại các ngày gõ tay trong cột `Ngày` của `Danh sách task` (chúng được tính một lần) — **nếu bạn thay đổi ngày bắt đầu, hãy tính lại các ngày đó**, hoặc hai sheet sẽ không khớp.
- **Tuần làm việc:** Thứ Hai–Thứ Sáu. Không áp dụng lịch ngày lễ công cộng. Nếu nhóm nghỉ lễ, đó là một ngày nghỉ không kế hoạch; kế hoạch hấp thụ nó qua bộ đệm bên dưới.
- **Năng lực:** H.Tài / Nghĩa / Luân ở `5.0 h/ngày`; P.Tài / Trí ở `3.0 h/ngày` (bán thời gian). Sheet `Giờ làm mỗi ngày` đánh dấu đỏ bất kỳ ngày nào vượt các giới hạn này; một ô đỏ là lỗi lập kế hoạch, không phải lỗi runtime.
- **Mô hình nỗ lực:** một "nhiệm vụ chuẩn" là `6.0` điểm ≈ `0.5` giờ cho thành viên nhanh (weight 10) và ≈ `2.0` giờ cho thành viên chậm (weight 5); xem `Cấu hình!C8:C12`. Đây là giả định hiệu chuẩn, không phải đo lường.
- **Lịch trình tuần tự theo giai đoạn:** một giai đoạn chỉ bắt đầu sau khi Định nghĩa Hoàn thành của giai đoạn trước được đáp ứng. Trong một giai đoạn, các nhiệm vụ được đánh dấu "Làm song song" có thể chạy đồng thời.
- **Bộ đệm:** kế hoạch **không** mang bộ đệm rõ ràng. Quy tắc 7 của bảng tính nói giữ **20–30%** dư địa trong thực tế cho các nghi lễ Scrum, lỗi tích hợp, và chờ review. Hãy coi mọi ngày được tính toán là lạc quan bởi biên độ đó.
- **Ước lượng vs. thực tế:** cột `Giờ hoàn thành (tích lũy)` là một *ước lượng* tích lũy; thực tế không được theo dõi trong sheet. Nếu cần thực tế cho Retrospective, hãy thêm chúng vào `docs/plans/` trong Giai đoạn 2+, không thêm vào bảng tính.

## 6. Cách thay đổi một giá trị trong tài liệu này

1. Mở một ADR nếu giá trị là 🔒 hoặc nếu một mục 🟡 đang được phê chuẩn. Tham chiếu số phần của tài liệu này.
2. Sửa tài liệu này và code/`.env.example`/bảng tính trong cùng PR.
3. Thêm một dòng vào nhật ký thay đổi của `docs/working-agreement.md` nếu thay đổi ảnh hưởng đến bất kỳ ai ngoài tác giả.
4. Nếu thay đổi ảnh hưởng đến bảng cổng (§1) hoặc một biến env (§2), grep repo để tìm giá trị cũ và sửa mọi chỗ khớp — bao gồm các placeholder `<API_PORT>` trong `docs/setup.md`.

## 7. Mục còn mở (theo dõi ở đây cho đến khi đóng)

| Mục                                                                            | Trạng thái | Người phụ trách | Đóng khi                                                                          |
| ------------------------------------------------------------------------------ | ---------- | --------------- | --------------------------------------------------------------------------------- |
| Phê chuẩn cổng API (`3001` vs `4000` vs runtime)                               | 🟡          | Nghĩa           | ADR được ghi; bằng chứng `● Xong` của Nhiệm vụ 11.0 trích cổng được bind          |
| Phê chuẩn chính sách placeholder `JWT_SECRET`                                  | 🟡          | Nghĩa           | Được ghi trong ADR 0005 hoặc một quyết định một dòng trong `working-agreement.md` |
| Phê chuẩn phong bì lỗi (trường `code` hay không)                               | ✅          | H.Tài           | Đã đóng: ADR 0005 C3, `api-contract.md` §3                                        |
| Phê chuẩn cách viết/viết hoa header `Idempotency-Key`                          | ✅          | H.Tài           | Đã đóng: ADR 0005 C5, `api-contract.md` §9                                        |
| Phê chuẩn các giá trị `PAYMENT_MOCK_MODE`                                      | 🟡          | H.Tài           | ADR 0004 đóng                                                                     |
| **Quyết định theo lô: ERD Nhiệm vụ 1.0 bao gồm các cột của Nhiệm vụ 10**       | ✅          | H.Tài           | Đã đóng: ADR 0003 D-ERD-scope                                                     |
| **Phạm vi ERD Nhiệm vụ 1.0 (5 thực thể + cột Nhiệm vụ 10, bảng mới hoãn lại)** | ✅          | H.Tài           | Đã đóng: `erd-core-v1` được commit                                                |

---

## Ghi chú về các lựa chọn tôi đã đưa ra (để bạn chấp nhận hoặc ghi đè)

1. **Bộ từ vựng trạng thái 🟡/🔒/⬜ là quyết định thiết kế cốt lõi ở đây.** Bạn nói các cổng có thể chưa sẵn sàng và 3001 có khả năng nhưng chưa chắc chắn. Thay vì giả vờ `3001` đã được khóa (điều sẽ buộc phải sửa tài liệu ngay khi nó thay đổi) hoặc để nó mở (điều khiến `<API_PORT>` không thể điền trong `setup.md`), tôi biến "tạm thời với một người ra quyết định và một hạn chót" thành một trạng thái hạng nhất. Đây là cùng một mẫu mà ADR dùng cho "đề xuất" vs "chấp nhận," áp dụng ở cấp giá trị.

2. **§1.2 cố tình dài hơn mức một bảng cổng cần.** Nó liệt kê hai chế độ lỗi và ba lựa chọn sửa, và nó nêu tên anti-pattern ("hard-code cổng API trong các lệnh gọi fetch của frontend") vì đó là rủi ro thực sự khi một cổng là tạm thời — ai đó hard-code nó, rồi cổng thay đổi, và bây giờ một thay đổi "cấu hình" là một thay đổi code. Các gợi ý sửa được sắp xếp theo chi phí, và lựa chọn C ("cấp phát lúc runtime") là lựa chọn khiến toàn bộ câu hỏi trở nên vô nghĩa — đáng cân nhắc.

3. **Tôi giữ hằng số "VND, số nguyên không đơn vị lẻ"** vì wireframe của PDF hiển thị `35k`, `45.000đ` v.v., và Prisma schema sẽ cần một quyết định về `Int` vs `Decimal` trước khi ERD của Nhiệm vụ 1.0 được chốt. Gắn cờ nó ở đây có nghĩa là người phụ trách ERD sẽ thấy nó.

4. **§5 (giả định lập kế hoạch) là phần trả lời "tại sao lịch trình lại như vậy."** Quy tắc 7 của bảng tính nói giữ 20–30% bộ đệm, nhưng kế hoạch không mang bộ đệm nào — đó là một sự khác biệt đáng ghi lại, không phải che giấu. Tôi cũng gắn cờ rủi ro trôi dạt cột `Ngày`: những ngày đó được tính một lần và sẽ không tính lại nếu `Cấu hình!B3` thay đổi. Đó là một cái bẫy thực sự.

5. **§7 (mục còn mở) là phần giữ cho tài liệu này không bị mục nát.** Mọi 🟡 trong tài liệu có một dòng ở đây với một người phụ trách và một điều kiện đóng, để "tạm thời" không thể trở thành "vĩnh viễn do bỏ mặc." Khi bạn phê chuẩn cổng API, bạn xóa dòng của nó — tài liệu thu nhỏ lại khi các quyết định được đưa ra.

6. **Một điều cần sửa trong `setup.md` sau tài liệu này:** nó có bốn placeholder `<API_PORT>` và hai tham chiếu `<port>`. Với tài liệu này đã được viết, hãy thay chúng bằng `3001` và thêm "(xem [Cấu hình §1.2](config.md#12-api-port-risk-and-fix--provisional--locked) nếu máy bạn cần một cổng khác)". Tôi đã để chúng là placeholder ở lượt trước chính xác để lượt này có thể giải quyết chúng trong một lần.