// apps/web/src/app/cart/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      <div className="min-h-full bg-[#faf8f3]">
        <header className="border-b border-stone-200 bg-white/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="text-lg font-bold text-emerald-950">☕ BrewLite</Link>
            <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">
              ← Quay lại menu
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24">
          <div aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
            🛒
          </div>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-stone-900">Giỏ hàng đang chờ món ngon</h1>
          <p className="mt-3 text-stone-600">Bạn chưa chọn thức uống nào. Khám phá menu và chọn món yêu thích nhé.</p>
          <Link
            href="/"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Khám phá menu
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#faf8f3]">
      <header className="border-b border-stone-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold text-emerald-950">☕ BrewLite</Link>
          <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">
            ← Tiếp tục chọn món
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Sẵn sàng cho một ngụm ngon</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900">Giỏ hàng của bạn</h1>
          <p className="mt-2 text-sm text-stone-500">{items.reduce((sum, item) => sum + item.qty, 0)} món đã chọn</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <section aria-label="Các món đã chọn" className="space-y-3">
            {items.map((item) => (
              <article
                key={item.cartItemId}
                data-testid={`cart-item-${item.cartItemId}`}
                className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-28 sm:w-32">
                  {item.product.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      sizes="128px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span aria-hidden="true" className="flex h-full items-center justify-center text-3xl">☕</span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-stone-900">
                      {item.product.name} <span className="text-sm font-medium text-stone-500">· Size {item.size}</span>
                    </h2>
                    {item.toppings.length > 0 && (
                      <p className="mt-1 text-xs text-stone-500">
                        Topping: {item.toppings.map((t) => t.name).join(', ')}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-bold text-emerald-800">
                      {item.lineTotal.toLocaleString('vi-VN')}₫
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="flex items-center gap-2 rounded-full border border-black bg-white p-1">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        onClick={() => updateQty(item.cartItemId, item.qty - 1)}
                        className="h-8 w-8 rounded-full bg-white text-lg font-bold text-black transition hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-black">{item.qty}</span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        onClick={() => updateQty(item.cartItemId, item.qty + 1)}
                        className="h-8 w-8 rounded-full bg-white text-lg font-bold text-black transition hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Xóa ${item.product.name} khỏi giỏ`}
                      onClick={() => removeItem(item.cartItemId)}
                      className="rounded-lg px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold text-stone-900">Tóm tắt đơn hàng</h2>
            <form onSubmit={handleApplyPromo} className="mt-4">
              <label htmlFor="promo-code" className="mb-2 block text-sm font-medium text-stone-700">
                Mã giảm giá
              </label>
              <div className="flex gap-2">
                <input
                  id="promo-code"
                  type="text"
                  placeholder="VD: BREW10"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  data-testid="promo-input"
                  className="min-w-0 flex-1 rounded-xl border border-black bg-white px-3 py-2.5 text-sm font-medium text-black outline-none transition placeholder:text-stone-500 focus:ring-2 focus:ring-stone-300"
                />
                <button
                  type="submit"
                  data-testid="apply-promo-btn"
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  Áp dụng
                </button>
              </div>
            </form>

            <div className="mt-5 space-y-3 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Tạm tính</span>
                <span>{getSubtotal().toLocaleString('vi-VN')}₫</span>
              </div>
              {getDiscount() > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Giảm giá ({promoCode.toUpperCase()})</span>
                  <span data-testid="cart-discount">−{getDiscount().toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-4 text-base font-bold text-stone-900">
                <span>Tổng cộng</span>
                <span data-testid="cart-total" className="text-emerald-900">
                  {getTotalPrice().toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            <button
              type="button"
              data-testid="proceed-checkout-btn"
              onClick={handleProceedCheckout}
              className="mt-5 min-h-12 w-full rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
            >
              Tiến hành thanh toán
            </button>
            <p className="mt-3 text-center text-xs text-stone-500">Thanh toán an toàn · Hỗ trợ ví và thẻ</p>
          </aside>
        </div>
      </main>
    </div>
  );
}