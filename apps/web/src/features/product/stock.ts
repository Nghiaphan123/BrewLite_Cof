import type { CartItem, Product, Topping } from '@/types';

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

// ---------------------------------------------------------------- Topping (mục 2.1, 2.2)
// Backend trừ kho topping khi thanh toán: mỗi ly dùng 1 phần của mỗi topping đã chọn
// (apps/api/src/modules/orders/topping-usage.ts). Thiếu phần nào thì cả đơn bị từ chối OUT_OF_STOCK.

export function isToppingSoldOut(topping: Pick<Topping, 'stock'>): boolean {
  return knownStock(topping) === 0;
}

/** Số phần topping này mà cả giỏ đang cần: cộng số ly của mọi dòng có chọn topping đó. */
export function toppingPortionsInCart(toppingId: string, items: CartItem[]): number {
  return items.reduce(
    (sum, item) => (item.toppings.some((t) => t.id === toppingId) ? sum + item.qty : sum),
    0,
  );
}

/**
 * Còn thêm được bao nhiêu ly với bộ topping đang chọn, xét riêng phần topping.
 * Topping không có tồn kho (API không gửi) thì không giới hạn.
 */
export function remainingForToppings(toppings: Pick<Topping, 'id' | 'stock'>[], items: CartItem[]): number {
  let limit = MAX_LINE_QTY;
  for (const topping of toppings) {
    const stock = knownStock(topping);
    if (stock !== undefined) {
      limit = Math.min(limit, stock - toppingPortionsInCart(topping.id, items));
    }
  }
  return Math.max(0, limit);
}

/** Các topping của dòng này mà cả giỏ đang cần nhiều phần hơn số còn trong kho. */
export function shortToppings(item: CartItem, items: CartItem[]): Topping[] {
  return item.toppings.filter((topping) => {
    const stock = knownStock(topping);
    return stock !== undefined && toppingPortionsInCart(topping.id, items) > stock;
  });
}
