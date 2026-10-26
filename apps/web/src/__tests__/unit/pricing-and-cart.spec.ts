// apps/web/src/__tests__/unit/pricing-and-cart.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateUnitPrice,
  calculateLineTotal,
  calculateDiscount,
  AVAILABLE_TOPPINGS,
} from '@/features/product/pricing';
import { useCartStore } from '@/store/cart.store';
import { Product } from '@/types';

const mockCappuccino: Product = {
  id: 'prod-1',
  name: 'Cappuccino',
  price: 45000,
};

describe('Unit Test: Tính giá theo Size / Topping & Khuyến mãi', () => {
  it('tính đúng giá cơ bản cho Size S không topping', () => {
    expect(calculateUnitPrice(45000, 'S', [])).toBe(45000);
  });

  it('cộng thêm phụ phí khi chọn Size M (+5k) hoặc Size L (+10k)', () => {
    expect(calculateUnitPrice(45000, 'M', [])).toBe(50000);
    expect(calculateUnitPrice(45000, 'L', [])).toBe(55000);
  });

  it('cộng đúng tiền khi chọn nhiều topping và nhân số lượng', () => {
    const toppings = [AVAILABLE_TOPPINGS[0], AVAILABLE_TOPPINGS[1]]; // 5k + 8k = 13k
    // (45k + 5k size M + 13k topping) * 2 ly = 126.000đ
    expect(calculateLineTotal(45000, 'M', toppings, 2)).toBe(126000);
  });

  it('áp dụng đúng mã giảm giá BREW10 (10%) và BREW20K', () => {
    expect(calculateDiscount(100000, 'brew10')).toBe(10000);
    expect(calculateDiscount(60000, 'BREW20K')).toBe(20000);
    expect(calculateDiscount(40000, 'BREW20K')).toBe(0); // chưa đủ 50k
  });
});

describe('Unit Test: Zustand Cart Store (Thêm / Sửa / Xóa / Tổng tiền)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('thêm sản phẩm mới và gộp số lượng nếu trùng product + size + topping', () => {
    const store = useCartStore.getState();
    store.addItem(mockCappuccino, 'M', [], 1);
    store.addItem(mockCappuccino, 'M', [], 2);

    const updated = useCartStore.getState();
    expect(updated.items).toHaveLength(1);
    expect(updated.getTotalItems()).toBe(3);
    expect(updated.getSubtotal()).toBe(50000 * 3); // 150.000đ
  });

  it('cập nhật số lượng và tự xóa khi số lượng <= 0', () => {
    const store = useCartStore.getState();
    store.addItem(mockCappuccino, 'S', [], 2);
    const itemId = useCartStore.getState().items[0].cartItemId;

    store.updateQty(itemId, 5);
    expect(useCartStore.getState().getSubtotal()).toBe(45000 * 5);

    store.updateQty(itemId, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});