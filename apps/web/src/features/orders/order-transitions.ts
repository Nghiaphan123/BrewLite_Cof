import type { OrderStatus } from '@/types';

/**
 * Các trạng thái nhân viên được chuyển đơn tới bằng tay, theo sơ đồ PDF §9.1.
 *
 * Bản sao của `nextManualStatuses` ở backend (apps/api/src/modules/orders/order-state-machine.ts).
 * Không có PENDING, PAID, PAYMENT_FAILED: các trạng thái đó chỉ do POST /payments đặt.
 * Backend vẫn là nơi kiểm tra cuối cùng; danh sách này chỉ để ô chọn ở trang admin
 * không đưa ra lựa chọn chắc chắn bị từ chối.
 */
const MANUAL_NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CANCELLED'],
  PAYMENT_FAILED: ['CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function nextManualStatuses(from: OrderStatus): OrderStatus[] {
  return MANUAL_NEXT[from] ?? [];
}
