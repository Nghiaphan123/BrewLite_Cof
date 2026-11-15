# BrewLite – Sequence diagrams

Sơ đồ tuần tự cho từng chức năng, vẽ lại từ code nhánh `Assignment-2` (10/11/2026) sau khi chạy test:
API unit 124/124, API e2e 87/87, web 115/115.

Mỗi sơ đồ có hai file cùng tên: `.puml` là nguồn (PlantUML), `.svg` là hình để chèn vào báo cáo.

| Chức năng | Hình | Nguồn | Code chính |
|---|---|---|---|
| Đăng ký | [register-sequence-diagram.svg](register-sequence-diagram.svg) | [.puml](register-sequence-diagram.puml) | `auth.service.ts` `register`, `app/login/page.tsx` |
| Đăng nhập | [login-sequence-diagram.svg](login-sequence-diagram.svg) | [.puml](login-sequence-diagram.puml) | `auth.service.ts` `login`, `store/auth.store.ts` |
| Xem menu | [view-menu-sequence-diagram.svg](view-menu-sequence-diagram.svg) | [.puml](view-menu-sequence-diagram.puml) | `products.service.ts` `list`, `features/menu/menu-page.tsx` |
| Chi tiết món, thêm vào giỏ | [product-detail-sequence-diagram.svg](product-detail-sequence-diagram.svg) | [.puml](product-detail-sequence-diagram.puml) | `products.service.ts` `findOne`, `store/cart.store.ts` |
| Đồng bộ giỏ hàng | [cart-sync-sequence-diagram.svg](cart-sync-sequence-diagram.svg) | [.puml](cart-sync-sequence-diagram.puml) | `cart.service.ts`, `features/cart/cart-sync.ts`, `components/CartSync.tsx` |
| Áp mã khuyến mãi | [apply-promo-sequence-diagram.svg](apply-promo-sequence-diagram.svg) | [.puml](apply-promo-sequence-diagram.puml) | `promotions.service.ts` `validate`, `promotion.ts` |
| Tạo đơn hàng | [create-order-sequence-diagram.svg](create-order-sequence-diagram.svg) | [.puml](create-order-sequence-diagram.puml) | `orders.service.ts` `create`, `pricing.ts` |
| Thanh toán (idempotent) | [payment-sequence-diagram.svg](payment-sequence-diagram.svg) | [.puml](payment-sequence-diagram.puml) | `payments.service.ts`, `app/checkout/page.tsx` |
| Xác nhận đơn | [order-confirmation-sequence-diagram.svg](order-confirmation-sequence-diagram.svg) | [.puml](order-confirmation-sequence-diagram.puml) | `orders.service.ts` `findByCode`, `features/orders/load-order.ts` |
| Lịch sử, chi tiết đơn | [order-history-sequence-diagram.svg](order-history-sequence-diagram.svg) | [.puml](order-history-sequence-diagram.puml) | `orders.service.ts` `listMine`, `app/orders/` |
| Đổi mật khẩu | [change-password-sequence-diagram.svg](change-password-sequence-diagram.svg) | [.puml](change-password-sequence-diagram.puml) | `auth.service.ts` `changePassword`, `app/profile/page.tsx` |
| Admin đổi trạng thái đơn | [admin-update-order-status-sequence-diagram.svg](admin-update-order-status-sequence-diagram.svg) | [.puml](admin-update-order-status-sequence-diagram.puml) | `orders.service.ts` `transition`, `order-state-machine.ts` |
| Admin sửa tồn kho | [admin-update-stock-sequence-diagram.svg](admin-update-stock-sequence-diagram.svg) | [.puml](admin-update-stock-sequence-diagram.puml) | `admin.service.ts` `updateProductStock`, `updateToppingStock` |
| Admin khoá tài khoản | [admin-block-user-sequence-diagram.svg](admin-block-user-sequence-diagram.svg) | [.puml](admin-block-user-sequence-diagram.puml) | `admin.service.ts` `setUserBlocked`, `jwt-auth.guard.ts` |

Sơ đồ UC-01 tổng hợp (đặt hàng + thanh toán) của Assignment 2 vẫn là [../sequence-checkout.puml](../sequence-checkout.puml).

## Sửa và xuất lại

Cả `.puml` và `.svg` được sinh từ cùng một mô tả trong [src/diagrams.py](src/diagrams.py), nên hai file luôn khớp nhau.
`.svg` được vẽ bằng [src/seqgen.py](src/seqgen.py) (Python thuần, không cần PlantUML hay Java).

```bash
cd docs/diagrams/sequence/src
python diagrams.py ..
```

Có thể mở file `.puml` bằng PlantUML (VS Code extension hoặc plantuml.jar). Hình PlantUML vẽ ra khác về kiểu dáng nhưng cùng nội dung.
