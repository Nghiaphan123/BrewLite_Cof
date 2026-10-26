import { SizeOption, Topping } from '@/types';

export const SIZE_SURCHARGE: Record<SizeOption, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

export const AVAILABLE_TOPPINGS: Topping[] = [
  { id: 'pearl', name: 'Trân châu đen', price: 5000 },
  { id: 'cream', name: 'Kem cheese', price: 8000 },
  { id: 'jelly', name: 'Thạch cà phê', price: 5000 },
];

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
 * Tính giảm giá khuyến mãi [Task 10 - STT 53]
 */
export function calculateDiscount(subtotal: number, promoCode?: string): number {
  if (!promoCode) return 0;
  const code = promoCode.trim().toUpperCase();
  if (code === 'BREW10') {
    return Math.round(subtotal * 0.1); // Giảm 10%
  }
  if (code === 'BREW20K' && subtotal >= 50000) {
    return 20000; // Giảm 20.000đ cho đơn từ 50k
  }
  return 0;
}