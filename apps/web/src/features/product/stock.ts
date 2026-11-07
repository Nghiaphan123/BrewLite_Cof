import type { CartItem, Product } from '@/types';

/** Giới hạn số lượng một dòng giỏ hàng, giống API (`PUT /cart`, `mergeCartItems`). */
export const MAX_LINE_QTY = 99;

/**
 * Tồn kho của món theo dữ liệu đã tải từ `GET /products`.
 * `undefined` nghĩa là API không gửi tồn kho: không chặn gì cả, để backend quyết định khi thanh toán.
 */
function knownStock(product: Pick<Product, 'stock'>): number | undefined {
  return typeof product.stock === 'number' ? Math.max(0, product.stock) : undefined;
}

export function isOutOfStock(product: Pick<Product, 'stock'>): boolean {
  return knownStock(product) === 0;
}

/** Tổng số ly của món này đang nằm trong giỏ, cộng mọi size và topping. */
export function qtyInCart(productId: string, items: CartItem[]): number {
  return items.reduce((sum, item) => (item.product.id === productId ? sum + item.qty : sum), 0);
}

/**
 * Giỏ đang có nhiều ly món này hơn số còn trong kho (ví dụ giỏ đồng bộ từ server sau khi kho giảm).
 * Thanh toán đơn như vậy chắc chắn bị backend từ chối với lỗi OUT_OF_STOCK.
 */
export function exceedsStock(product: Pick<Product, 'id' | 'stock'>, items: CartItem[]): boolean {
  const stock = knownStock(product);
  return stock !== undefined && qtyInCart(product.id, items) > stock;
}

/**
 * Còn thêm được bao nhiêu ly món này vào giỏ.
 * Backend chỉ trừ kho khi thanh toán (ADR 0004 D1) và từ chối cả đơn nếu `stock < qty`,
 * nên phải tính cả các ly cùng món đã có trong giỏ (khác size/topping vẫn trừ chung một kho).
 */
export function remainingForCart(product: Pick<Product, 'id' | 'stock'>, items: CartItem[]): number {
  const stock = knownStock(product);
  const limit = stock === undefined ? Number.POSITIVE_INFINITY : stock - qtyInCart(product.id, items);
  return Math.max(0, Math.min(limit, MAX_LINE_QTY));
}
