/**
 * Số điểm thưởng dự kiến cho một đơn: 1 điểm cho mỗi 1.000₫ đã trả.
 *
 * Bản sao của `loyaltyPointsFor` ở backend (apps/api/src/modules/payments/loyalty.ts, ADR 0004 D7),
 * giống cách `features/product/pricing.ts` sao chép công thức giá. Chỉ dùng để HIỂN THỊ trước khi trả tiền;
 * số điểm thật luôn lấy từ API (`loyaltyPointsEarned`). Nếu backend đổi quy tắc thì phải sửa cả hai nơi.
 */
export function estimateLoyaltyPoints(orderTotal: number): number {
  if (orderTotal < 0) return 0;
  return Math.floor(orderTotal / 1000);
}
