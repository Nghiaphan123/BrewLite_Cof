import { describe, expect, it } from 'vitest';
import {
  isToppingSoldOut,
  remainingForToppings,
  shortToppings,
  toppingPortionsInCart,
} from '@/features/product/stock';
import { stockLevel } from '@/features/admin/stock-level';
import { fromServerCart } from '@/features/cart/cart-sync';
import type { CartItem, Topping } from '@/types';

const pearl: Topping = { id: 'pearl', name: 'Trân châu đen', price: 5000, stock: 3 };
const cheese: Topping = { id: 'cheese', name: 'Kem cheese', price: 5000, stock: 0 };
const noStockInfo: Topping = { id: 'jelly', name: 'Thạch đào', price: 5000 };

function line(id: string, qty: number, toppings: Topping[]): CartItem {
  return {
    cartItemId: id,
    product: { id: `p-${id}`, name: 'Latte', price: 45000, imageUrl: '', stock: 50 },
    size: 'M',
    toppings,
    qty,
    unitPrice: 50000,
    lineTotal: 50000 * qty,
  };
}

describe('tồn kho topping (mục 2.1, 2.2)', () => {
  it('topping hết khi tồn kho là 0; không có số tồn kho thì không coi là hết', () => {
    expect(isToppingSoldOut(cheese)).toBe(true);
    expect(isToppingSoldOut(pearl)).toBe(false);
    expect(isToppingSoldOut(noStockInfo)).toBe(false);
  });

  it('mỗi ly dùng 1 phần topping, cộng trên mọi dòng của giỏ', () => {
    const items = [line('a', 2, [pearl]), line('b', 1, [pearl, cheese]), line('c', 4, [])];
    expect(toppingPortionsInCart('pearl', items)).toBe(3);
    expect(toppingPortionsInCart('cheese', items)).toBe(1);
  });

  it('số ly thêm được bị giới hạn bởi topping còn ít nhất', () => {
    const items = [line('a', 1, [pearl])];
    // Trân châu còn 3 phần, giỏ đã dùng 1 -> thêm tối đa 2 ly có trân châu.
    expect(remainingForToppings([pearl], items)).toBe(2);
    expect(remainingForToppings([pearl, cheese], items)).toBe(0);
    expect(remainingForToppings([noStockInfo], items)).toBe(99);
    expect(remainingForToppings([], items)).toBe(99);
  });

  it('chỉ ra topping của dòng đang thiếu phần', () => {
    const lineA = line('a', 2, [pearl, cheese]);
    const lineB = line('b', 2, [pearl]);
    const items = [lineA, lineB];
    // Trân châu cần 4 phần nhưng còn 3; kem cheese đã hết.
    expect(shortToppings(lineA, items).map((t) => t.id)).toEqual(['pearl', 'cheese']);
    expect(shortToppings(lineB, items).map((t) => t.id)).toEqual(['pearl']);
    expect(shortToppings(line('c', 1, [pearl]), [line('c', 1, [pearl])])).toEqual([]);
  });

  it('giỏ lấy từ server giữ nguyên tồn kho của món và topping (mục 2.2)', () => {
    const items = fromServerCart({
      items: [
        {
          productId: 'p1',
          size: 'M',
          qty: 2,
          toppingIds: ['pearl'],
          toppings: [{ ...pearl, stock: 1 }],
          product: { id: 'p1', name: 'Latte', price: 45000, imageUrl: '', stock: 1 },
        },
      ],
      promoCode: '',
      promotion: null,
    });
    expect(items[0].product.stock).toBe(1);
    expect(items[0].toppings[0].stock).toBe(1);
    expect(shortToppings(items[0], items)).toHaveLength(1);
  });
});

describe('mức tồn kho trên trang admin', () => {
  it('0 là hết hàng, 1–10 là sắp hết, trên 10 là còn hàng', () => {
    expect(stockLevel(0)).toBe('out');
    expect(stockLevel(1)).toBe('low');
    expect(stockLevel(10)).toBe('low');
    expect(stockLevel(11)).toBe('ok');
  });
});
