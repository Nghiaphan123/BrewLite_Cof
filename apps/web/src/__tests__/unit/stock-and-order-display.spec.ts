import { describe, expect, it } from 'vitest';
import { exceedsStock, isOutOfStock, qtyInCart, remainingForCart } from '@/features/product/stock';
import { getOrderDiscount, getOrderSubtotal, isPaidStatus } from '@/features/orders/order-display';
import { estimateLoyaltyPoints } from '@/features/checkout/loyalty';
import type { CartItem, Product } from '@/types';

const latte: Product = { id: 'p1', name: 'Latte', price: 45000, imageUrl: '', stock: 5 };

function line(product: Product, qty: number, size: CartItem['size'] = 'M'): CartItem {
  return { cartItemId: `${product.id}__${size}__`, product, size, toppings: [], qty, unitPrice: 50000, lineTotal: 50000 * qty };
}

describe('tồn kho (mục 5)', () => {
  it('chỉ coi là hết hàng khi API báo stock = 0', () => {
    expect(isOutOfStock({ stock: 0 })).toBe(true);
    expect(isOutOfStock({ stock: 3 })).toBe(false);
    expect(isOutOfStock({})).toBe(false); // API không gửi tồn kho thì không chặn
  });

  it('cộng mọi dòng cùng món (khác size) khi tính số ly trong giỏ', () => {
    const items = [line(latte, 2, 'M'), line(latte, 1, 'L'), line({ ...latte, id: 'p2' }, 4)];
    expect(qtyInCart('p1', items)).toBe(3);
    expect(remainingForCart(latte, items)).toBe(2);
  });

  it('không bao giờ âm và không vượt giới hạn 99 ly của một dòng', () => {
    expect(remainingForCart(latte, [line(latte, 7)])).toBe(0);
    expect(remainingForCart({ id: 'x', stock: 500 }, [])).toBe(99);
    expect(remainingForCart({ id: 'x' }, [])).toBe(99);
  });

  it('phát hiện giỏ đang nhiều hơn số còn trong kho', () => {
    expect(exceedsStock(latte, [line(latte, 6)])).toBe(true);
    expect(exceedsStock(latte, [line(latte, 5)])).toBe(false);
    expect(exceedsStock({ id: 'p1' }, [line(latte, 50)])).toBe(false);
  });
});

describe('giảm giá và điểm thưởng (mục 8)', () => {
  const items = [
    { productId: 'p1', size: 'M' as const, qty: 1, lineTotal: 50000 },
    { productId: 'p2', size: 'L' as const, qty: 1, lineTotal: 40000 },
  ];

  it('dùng subtotal/discountAmount nếu API trả sẵn (POST /orders)', () => {
    const order = { subtotal: 90000, discountAmount: 20000, total: 70000, items };
    expect(getOrderSubtotal(order)).toBe(90000);
    expect(getOrderDiscount(order)).toBe(20000);
  });

  it('tự tính từ các dòng khi API không trả (GET /orders/:code)', () => {
    const order = { total: 70000, items };
    expect(getOrderSubtotal(order)).toBe(90000);
    expect(getOrderDiscount(order)).toBe(20000);
  });

  it('không có dòng nào thì không suy ra giảm giá', () => {
    expect(getOrderDiscount({ total: 70000 })).toBe(0);
  });

  it('điểm dự kiến giống quy tắc backend: 1 điểm / 1.000₫, làm tròn xuống', () => {
    expect(estimateLoyaltyPoints(70000)).toBe(70);
    expect(estimateLoyaltyPoints(45999)).toBe(45);
    expect(estimateLoyaltyPoints(999)).toBe(0);
    expect(estimateLoyaltyPoints(-1)).toBe(0);
  });

  it('nhận ra các trạng thái đã thanh toán', () => {
    expect(isPaidStatus('PAID')).toBe(true);
    expect(isPaidStatus('READY')).toBe(true);
    expect(isPaidStatus('PAYMENT_FAILED')).toBe(false);
    expect(isPaidStatus(null)).toBe(false);
  });
});
