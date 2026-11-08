import { apiClient } from '@/lib/api';
import { ApiError } from '@/lib/api-errors';
import type { Order } from '@/types';

/** Mã đơn dạng BL-YYYY-NNNN do backend sinh (orders.service.ts › generateOrderCode). */
const ORDER_CODE = /^BL-\d{4}-\d+$/i;

export function isOrderCode(value: string): boolean {
  return ORDER_CODE.test(value);
}

/**
 * Tải một đơn của chính người đang đăng nhập, theo mã đơn (BL-…) hoặc theo id.
 *
 * - Ưu tiên `GET /orders/:code`: chỉ trả đúng một đơn và có kèm số điểm thưởng đã nhận.
 * - Nếu chỉ có id (link cũ), tìm trong `GET /orders/me` để lấy mã đơn rồi gọi lại theo mã.
 * - Trả `null` khi không tìm thấy. Backend trả cùng một lỗi 404 cho "không tồn tại" và
 *   "đơn của người khác", nên trang hiển thị cùng một thông báo an toàn (scenarios.md S-ORD-4).
 * - Lỗi khác (mạng, 401, 500) được ném ra để trang hiện trạng thái lỗi kèm nút "Thử lại".
 */
export async function loadOwnOrder(idOrCode: string): Promise<Order | null> {
  try {
    if (isOrderCode(idOrCode)) {
      return await apiClient.getOrderByCode(idOrCode);
    }
    const found = (await apiClient.getMyOrders()).find((order) => String(order.id) === idOrCode);
    if (!found) return null;
    return found.code ? await apiClient.getOrderByCode(found.code) : found;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
