# BrewLite - Cài đặt và Hướng dẫn nhập môn

**Trạng thái:** Sản phẩm bàn giao Giai đoạn 1
**Người phụ trách:** Nghĩa, H.Tài (Nhiệm vụ 1.0, Nhiệm vụ 12.0)
**Liên quan:** [Cấu trúc dự án](project-structure.md), [Cấu hình](config.md), [Thỏa thuận làm việc](working-agreement.md), [README](../README.md)

Hướng dẫn này đưa một thành viên từ máy sạch đến một stack BrewLite đang chạy: ứng dụng web, API, và cơ sở dữ liệu, với dữ liệu seed đã được nạp. Lần đầu hãy làm theo từ trên xuống dưới. Nếu một bước thất bại, hãy xem phần [Xử lý sự cố](#xử-lý-sự-cố) trước khi hỏi trong kênh nhóm.

> **Phạm vi:** tài liệu này chỉ bao gồm phát triển cục bộ. Docker Compose đầu-cuối và triển khai thuộc Giai đoạn 2+ (`docs/deployment.md`).

## 1. Yêu cầu tiên quyết

| Công cụ                      | Phiên bản            | Lệnh kiểm tra      | Ghi chú                                                                |
| ---------------------------- | -------------------- | ------------------ | ---------------------------------------------------------------------- |
| Node.js                      | 22 LTS hoặc 24 LTS   | `node --version`   | Phải ≥ 22. Các ứng dụng chưa ghim trường engine; dùng LTS.             |
| npm                          | 10+ (đi kèm Node)    | `npm --version`    | Trình quản lý gói là npm theo từng ứng dụng, không phải workspace gốc. |
| Docker Desktop               | Bản ổn định hiện tại | `docker --version` | Chỉ dùng cho container PostgreSQL trong Giai đoạn 1.                   |
| Git                          | 2.40+                | `git --version`    |                                                                        |
| PostgreSQL client (tùy chọn) | 16+                  | `psql --version`   | Chỉ cần cho việc kiểm tra DB thủ công.                                 |
| IDE                          | Khuyến nghị VS Code  | —                  | Cài extension Prisma và ESLint.                                        |

Người dùng Windows: chạy lệnh trong **PowerShell** trừ khi một bước nói khác. Các ví dụ dùng cú pháp PowerShell.

## 2. Clone và vào repository

```powershell
git clone <repository-url> BrewLite
cd BrewLite
```

Thư mục gốc **không có** `package.json` và không có npm workspace. Mọi lần cài đặt và mọi script chạy từ `apps/api` hoặc `apps/web`. Không chạy `npm install` ở thư mục gốc — nó sẽ thất bại hoặc tạo một lockfile lạc.

## 3. Khởi động cơ sở dữ liệu

Giai đoạn 1 dùng dịch vụ PostgreSQL từ `docker-compose.yml` ở thư mục gốc.

```powershell
docker compose up -d db
docker compose ps
```

Kỳ vọng: dịch vụ `db` ở trạng thái `running` và healthy. Nếu cổng `5432` đã bị một bản cài Postgres cục bộ chiếm, hãy dừng dịch vụ đó hoặc đổi cổng host trong `docker-compose.yml` và cập nhật `DATABASE_URL` trong `apps/api/.env` (xem [Cấu hình](config.md)).

Kiểm tra kết nối:

```powershell
docker compose exec db pg_isready -U brewlite
```

## 4. Cấu hình tệp môi trường

Mỗi ứng dụng có `.env` riêng. Sao chép các tệp mẫu, sau đó điền giá trị.

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Bảng biến đầy đủ, giá trị mặc định, và lý do cho từng biến nằm trong [Cấu hình](config.md). Tối thiểu bạn cần cho một lần chạy cục bộ:

- `apps/api/.env` — `DATABASE_URL`, `JWT_SECRET`, `PORT`, `WEB_ORIGIN`
- `apps/web/.env` — `NEXT_PUBLIC_API_URL`

**Không bao giờ commit `.env`.** Nó được bao bởi `.gitignore`; nếu bạn thấy mình cần chia sẻ một giá trị, hãy cập nhật `.env.example` thay vào đó.

## 5. Cài đặt phụ thuộc

Cài đặt riêng trong từng ứng dụng. Thứ tự không quan trọng, nhưng đừng trộn lẫn chúng.

```powershell
cd apps/api
npm install

cd ../web
npm install
```

Mỗi ứng dụng có `package-lock.json` riêng. Commit lockfile mỗi khi bạn thêm, xóa, hoặc nâng cấp một phụ thuộc trong ứng dụng đó.

## 6. Thiết lập schema cơ sở dữ liệu

Từ `apps/api`:

```powershell
cd apps/api
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

- `prisma generate` xây dựng client từ `prisma/schema.prisma`.
- `migrate dev` áp dụng các migration và tạo cơ sở dữ liệu nếu chưa có. Trong Giai đoạn 1, migration đầu tiên được tạo bởi người phụ trách Nhiệm vụ 1.0 / Nhiệm vụ 14.0 — nếu `prisma/migrations/` trống, hãy phối hợp trước khi chạy lệnh này.
- `db seed` nạp dữ liệu menu mẫu (Nhiệm vụ 9.0, Nhiệm vụ 14.0). Script seed là `apps/api/prisma/seed.ts`.

Để đặt lại về trạng thái sạch:

```powershell
npx prisma migrate reset
```

Lệnh này xóa schema, áp dụng lại migration, và chạy lại seed. **Nó xóa toàn bộ dữ liệu cục bộ.** Hãy xác nhận trước khi chạy.

## 7. Chạy các ứng dụng

Dùng hai terminal.

**Terminal 1 — API:**

```powershell
cd apps/api
npm run start:dev
```

Kỳ vọng: Nest ghi log banner khởi động và lắng nghe trên cổng API từ `apps/api/.env` (xem [Cấu hình](config.md) để biết cổng được gán; `3001` là mặc định tạm thời theo `config.md` §1.2). Kiểm tra endpoint mặc định là:

```powershell
curl http://localhost:3001/api/v1/health
```

**Terminal 2 — web:**

```powershell
cd apps/web
npm run dev
```

Kỳ vọng: Next.js in ra `Local: http://localhost:3000` (hoặc cổng trống tiếp theo — đọc log, đừng giả định). Mở nó trong trình duyệt.

## 8. Xác minh scaffold (kiểm tra "Hello")

Đây là tiêu chí chấp nhận cho Nhiệm vụ 1.0 và Nhiệm vụ 12.0. Cả bốn kiểm tra phải pass trước khi bạn coi việc cài đặt là hoàn tất.

| Kiểm tra         | Cách                                                    | Kỳ vọng                                                    |
| ---------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| Web khởi động    | Mở `http://localhost:3000`                              | Trang khởi đầu render không có lỗi console.                |
| Web gọi được API | Mở tab Network trong devtools trình duyệt khi tải trang | Yêu cầu đến `NEXT_PUBLIC_API_URL` thành công (200).        |
| API phản hồi     | `curl http://localhost:3001/api/v1/health`              | `{ "status": "ok", "version": "v1" }`                      |
| DB được kết nối  | `cd apps/api; npx prisma studio`                        | Prisma Studio mở và hiển thị các bảng đã seed với dữ liệu. |

Nếu bất kỳ kiểm tra nào thất bại, hãy dừng lại và dùng [Xử lý sự cố](#xử-lý-sự-cố). Một scaffold xanh là điều kiện thoát cho việc cài đặt Giai đoạn 1.

## 9. Chạy test

Từ từng ứng dụng:

```powershell
cd apps/api
npm test
npm run test:e2e
```

```powershell
cd apps/web
npm test
```

API dùng Vitest cho các lần chạy unit và e2e (`vitest.config.ts`, `vitest.config.e2e.ts`); ứng dụng web dùng runner được cấu hình trong `package.json` của nó. Test Playwright xuyên ứng dụng nằm trong `tests/e2e/` ở thư mục gốc và thuộc Giai đoạn 2+.

## 10. Quy trình làm việc hàng ngày

1. Pull `main` mới nhất, tạo branch từ đó: `git switch -c feat/<task-stt>-<slug>`.
2. Khởi động cơ sở dữ liệu: `docker compose up -d db`.
3. Khởi động API và web trong hai terminal (§7).
4. Thực hiện thay đổi; chạy bộ test liên quan (§9).
5. Commit tham chiếu STT nhiệm vụ, ví dụ `feat(api): products module (Task 2.0)` — xem [Thỏa thuận làm việc](working-agreement.md) để biết quy tắc commit và PR.
6. Mở PR dùng template của repository; checklist phản ánh Định nghĩa Hoàn thành.
7. Đánh dấu nhiệm vụ `● Xong` trong bảng tính **và** thêm ghi chú bằng chứng trong cùng PR. Xem [Thỏa thuận làm việc](working-agreement.md) § "Ghi chú bằng chứng nhiệm vụ".

## Xử lý sự cố

**`npm install` thất bại ở thư mục gốc repo**
Đúng như kỳ vọng. Hãy cài từ `apps/api` hoặc `apps/web`. Không có `package.json` ở gốc.

**Cổng 5432 đã được dùng**
Một PostgreSQL cục bộ đang chạy. Hoặc dừng nó, hoặc đổi cổng host trong `docker-compose.yml` (ví dụ `"5433:5432"`) và cập nhật `DATABASE_URL` thành `...@localhost:5433/...`.

**Prisma `P1001: Can't reach database server`**
Container `db` chưa lên hoặc không healthy. Chạy `docker compose ps` và `docker compose logs db`. Đồng thời xác nhận host của `DATABASE_URL` là `localhost` (không phải `db`) khi chạy API trên host.

**Prisma `P3005: database schema is not empty` khi `migrate dev`**
Cơ sở dữ liệu có các đối tượng nhưng không có lịch sử migration. Chạy `npx prisma migrate reset` trong `apps/api` (phá hủy dữ liệu cục bộ), sau đó chạy lại `migrate dev` và `db seed`.

**Web hiển thị lỗi CORS**
`WEB_ORIGIN` trong `apps/api/.env` phải khớp chính xác origin mà trình duyệt dùng (`http://localhost:3000`, bao gồm giao thức và cổng). Cập nhật nó và khởi động lại API.

**Web gọi sai URL API**
Các biến `NEXT_PUBLIC_*` được nhúng tại thời điểm build/khởi động. Sau khi sửa `apps/web/.env`, dừng và khởi động lại `npm run dev`.

**`prisma generate` "client not found"**
Chạy `npx prisma generate` từ `apps/api` sau bất kỳ `npm install` nào có đụng đến Prisma, và sau mỗi thay đổi schema.

**Seed thất bại với unique constraint**
Seed không idempotent với một DB đã được seed. Chạy `npx prisma migrate reset` và thử lại.

**Node version mismatch / unsupported engine**
Chuyển sang Node 22 hoặc 24 LTS (`nvm use 22` hoặc `fnm use 22`). Kiểm tra bằng `node --version`.

## Tham khảo

- [Cấu trúc dự án](project-structure.md) — tệp nằm ở đâu và tại sao.
- [Cấu hình](config.md) — mọi biến môi trường, cổng, và giả định lập kế hoạch.
- [Thỏa thuận làm việc](working-agreement.md) — ghi chú bằng chứng nhiệm vụ, đặt tên, quy tắc commit/PR.
- [Hợp đồng API](architecture/api-contract.md) — các endpoint và hình dạng payload.
- `README.md` ở gốc — tóm tắt dự án và quickstart trỏ đến đây.

---

## Ghi chú về các lựa chọn tôi đã đưa ra (để bạn chấp nhận hoặc ghi đè)

1. **Cổng API cố tình để là `<API_PORT>`.** Sheet `Cấu hình` và `.env.example` của bạn chưa cố định nó — đó chính là loại thứ mà `docs/config.md` được cho là phải khóa lại. Khi bạn viết `config.md`, hãy thay `<API_PORT>` ở đây trong một lần (có 4 lần xuất hiện). Nếu bạn muốn có mặc định ngay bây giờ, `3001` là lựa chọn Nest quy ước bên cạnh Next trên `3000`.

2. **Bảng kiểm tra "Hello" là cổng thoát thực sự của Giai đoạn 1.** Tôi làm nó thành một bảng với bốn dòng vì tiêu chí chấp nhận của Nhiệm vụ 1.0 đúng nghĩa là "cả hai ứng dụng chạy 'Hello'", và một checklist khó bỏ qua hơn văn xuôi. Nó cũng là bằng chứng demo bạn sẽ trích trong ghi chú `● Xong` của Nhiệm vụ 1.0.

3. **Phần Xử lý sự cố được giới hạn trong các lỗi mà một thành viên Giai đoạn 1 thực sự sẽ gặp** — lỗi `npm install` ở gốc (được nêu ba lần xuyên suốt các tài liệu vì đây là lỗi nhập môn số 1 cho một repo hai ứng dụng), Prisma `P1001`/`P3005`, CORS từ `WEB_ORIGIN` không khớp, và ngữ nghĩa khởi động lại `NEXT_PUBLIC_*`. Tôi không thêm lời khuyên chung chung kiểu "cài lại Node".

4. **Không có hướng dẫn Docker cho chính các ứng dụng.** `apps/api/Dockerfile` và `apps/web/Dockerfile` tồn tại trong scaffold, nhưng việc nối chúng vào Compose là Nhiệm vụ 57.0 (Giai đoạn 6) theo bảng tính. Tài liệu cài đặt nói rõ điều này để không ai giả định `docker compose up` chạy toàn bộ stack trong Giai đoạn 1 — chỉ dịch vụ `db`.

5. **Lệnh ưu tiên Windows.** Bảng tính và tài liệu cấu trúc của bạn dùng PowerShell (`cd apps/api; npm install`), nên các ví dụ dùng `Copy-Item` và cú pháp PowerShell. Tôi thêm một dòng ghi chú thay vì nhân đôi mọi lệnh trong bash.

6. **Hai tham chiếu chuyển tiếp bạn nên tôn trọng khi viết các tài liệu tiếp theo:** `config.md` phải định nghĩa `WEB_ORIGIN`, `JWT_SECRET`, `PORT`, `DATABASE_URL`, `NEXT_PUBLIC_API_URL`, và các cổng được chọn; `working-agreement.md` phải định nghĩa dòng bằng chứng `[DoD]` chính xác và định dạng commit `feat(<scope>): ... (Task <stt>)` được tham chiếu trong §10. Nếu một trong hai bị trôi dạt, tài liệu này sẽ hỏng.