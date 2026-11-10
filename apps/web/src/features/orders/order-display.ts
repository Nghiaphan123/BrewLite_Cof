import type { Order } from '@/types';

/** Tên trạng thái đơn bằng tiếng Việt, dùng chung cho lịch sử, chi tiết và xác nhận đơn. */
export const STATUS_LABELS: Record<Order['status'], string> = {
  PENDING: 'Chờ xử lý',
  PAID: 'Đã thanh toán',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  PREPARING: 'Đang pha chế',
  READY: 'Sẵn sàng lấy',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

/** Các trạng thái có nghĩa là đơn đã được trả tiền thành công (ADR 0004 D1). */
export const PAID_STATUSES: Order['status'][] = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

export function isOrderStatus(value: string | null | undefined): value is Order['status'] {
  return !!value && value in STATUS_LABELS;
}

export function isPaidStatus(status: Order['status'] | null | undefined): boolean {
  return !!status && PAID_STATUSES.includes(status);
}

/**
 * Tạm tính của đơn (trước giảm giá).
 * `POST /orders` trả sẵn `subtotal`; `GET /orders/me` và `GET /orders/:code` thì không,
 * nhưng backend tính subtotal đúng bằng tổng `lineTotal` các dòng (orders.service.ts), nên cộng lại được.
 */
export function getOrderSubtotal(order: Pick<Order, 'subtotal' | 'items' | 'total'>): number {
  if (typeof order.subtotal === 'number') return order.subtotal;
  if (!order.items?.length) return order.total;
  return order.items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
}

/** Số tiền được giảm nhờ mã khuyến mãi: total = subtotal − discountAmount (orders.service.ts). */
export function getOrderDiscount(order: Pick<Order, 'subtotal' | 'items' | 'total' | 'discountAmount'>): number {
  if (typeof order.discountAmount === 'number') return order.discountAmount;
  return Math.max(0, getOrderSubtotal(order) - order.total);
}

export function formatVnd(value: number): string {
  return `${Number(value || 0).toLocaleString('vi-VN')}₫`;
}
