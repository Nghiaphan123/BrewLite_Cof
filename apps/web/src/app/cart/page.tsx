// apps/web/src/app/cart/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    promoCode,
    updateQty,
    removeItem,
    setPromoCode,
    getSubtotal,
    getDiscount,
    getTotalPrice,
  } = useCartStore();
  const token = useAuthStore((state) => state.token);
  const [promoInput, setPromoInput] = useState(promoCode);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoCode(promoInput);
  };

  const handleProceedCheckout = () => {
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-stone-800">Giỏ hàng trống</h1>
        <p className="mt-2 text-sm text-stone-500">Bạn chưa chọn đồ uống nào.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Xem Menu
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-900">Giỏ hàng</h1>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.cartItemId}
            data-testid={`cart-item-${item.cartItemId}`}
            className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
          >
            <div>
              <h3 className="font-semibold text-stone-900">
                {item.product.name} ({item.size})
              </h3>
              {item.toppings.length > 0 && (
                <p className="text-xs text-stone-500">
                  Topping: {item.toppings.map((t) => t.name).join(', ')}
                </p>
              )}
              <p className="mt-1 text-sm font-bold text-emerald-700">
                {item.lineTotal.toLocaleString('vi-VN')}₫
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Giảm số lượng"
                onClick={() => updateQty(item.cartItemId, item.qty - 1)}
                className="h-7 w-7 rounded border border-stone-300 text-sm font-bold"
              >
                -
              </button>
              <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                onClick={() => updateQty(item.cartItemId, item.qty + 1)}
                className="h-7 w-7 rounded border border-stone-300 text-sm font-bold"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.cartItemId)}
                className="ml-2 text-xs text-red-600 hover:underline"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* [Task 10 - STT 53] Ô nhập mã giảm giá */}
      <form onSubmit={handleApplyPromo} className="mt-6 flex gap-2">
        <input
          type="text"
          placeholder="Nhập mã giảm giá (VD: BREW10)"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
          data-testid="promo-input"
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          data-testid="apply-promo-btn"
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900"
        >
          Áp dụng
        </button>
      </form>

      {/* Tổng tiền */}
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex justify-between text-sm text-stone-600">
          <span>Tạm tính:</span>
          <span>{getSubtotal().toLocaleString('vi-VN')}₫</span>
        </div>
        {getDiscount() > 0 && (
          <div className="mt-1 flex justify-between text-sm text-emerald-700">
            <span>Giảm giá ({promoCode.toUpperCase()}):</span>
            <span data-testid="cart-discount">-{getDiscount().toLocaleString('vi-VN')}₫</span>
          </div>
        )}
        <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold text-stone-900">
          <span>Tổng cộng:</span>
          <span data-testid="cart-total">{getTotalPrice().toLocaleString('vi-VN')}₫</span>
        </div>

        <button
          type="button"
          data-testid="proceed-checkout-btn"
          onClick={handleProceedCheckout}
          className="mt-4 w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800"
        >
          Thanh toán ({getTotalPrice().toLocaleString('vi-VN')}₫)
        </button>
      </div>
    </main>
  );
}