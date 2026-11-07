import { describe, expect, it } from 'vitest';
import { exceedsStock, isOutOfStock, qtyInCart, remainingForCart } from '@/features/product/stock';
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
