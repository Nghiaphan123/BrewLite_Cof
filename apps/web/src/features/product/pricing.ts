import { Promotion, SizeOption, Topping } from '@/types';

export const SIZE_SURCHARGE: Record<SizeOption, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

/**
 * Tính đơn giá 1 ly dựa trên giá gốc, size và danh sách topping
 */
export function calculateUnitPrice(
  basePrice: number,
  size: SizeOption,
  toppings: Topping[] = []
): number {
  if (basePrice < 0) throw new Error('Giá sản phẩm không hợp lệ');
  const sizeExtra = SIZE_SURCHARGE[size] ?? 0;
  const toppingExtra = toppings.reduce((sum, t) => sum + t.price, 0);
  return basePrice + sizeExtra + toppingExtra;
}

/**
 * Tính thành tiền cho số lượng ly và giảm giá (nếu có)
 */
export function calculateLineTotal(
  basePrice: number,
  size: SizeOption,
  toppings: Topping[],
  qty: number
): number {
  if (qty <= 0) return 0;
  return calculateUnitPrice(basePrice, size, toppings) * qty;
}

/**
 * Tính giảm giá để hiển thị theo quy tắc lấy từ API, giống computeDiscount ở backend.
 * Số tiền thật do POST /orders tính.
 */
export function calculateDiscount(subtotal: number, promotion?: Promotion | null): number {
  if (!promotion || subtotal < promotion.minOrderTotal) return 0;
  const discount =
    promotion.type === 'PERCENT'
      ? Math.floor((subtotal * promotion.value) / 100)
      : promotion.value;
  return Math.min(discount, subtotal);
}
