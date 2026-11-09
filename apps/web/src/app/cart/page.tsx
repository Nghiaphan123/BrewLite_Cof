// apps/web/src/app/cart/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';
import { Spinner } from '@/components/Skeleton';
import {
  exceedsStock,
  isOutOfStock,
  isToppingSoldOut,
  remainingForCart,
  remainingForToppings,
  shortToppings,
} from '@/features/product/stock';

const REMOVE_ANIMATION_MS = 220;

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    promoCode,
    updateQty,
    removeItem,
    setPromotion,
    getSubtotal,
    getDiscount,
    getTotalPrice,
  } = useCartStore();
  const token = useAuthStore((state) => state.token);
  const [promoInput, setPromoInput] = useState(promoCode);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);

  const handleRemove = (cartItemId: string) => {
    setRemovingIds((ids) => [...ids, cartItemId]);
    setTimeout(() => removeItem(cartItemId), REMOVE_ANIMATION_MS);
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    setPromoError(null);
    if (!code) {
      setPromotion(null);
      return;
    }

    setPromoLoading(true);
    try {
      setPromotion(await apiClient.validatePromotion(code, getSubtotal()));
      setPromoInput(code);
    } catch (error) {
      setPromotion(null);
      setPromoError(error instanceof Error ? error.message : 'Không thể áp dụng mã giảm giá.');
    } finally {
      setPromoLoading(false);
    }
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
            <Link href="/menu" className="text-lg font-bold text-emerald-950">☕ BrewLite</Link>
            <Link href="/menu" className="text-sm font-semibold text-emerald-800 hover:underline">
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
            href="/menu"
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
          <Link href="/menu" className="text-lg font-bold text-emerald-950">☕ BrewLite</Link>
          <Link href="/menu" className="text-sm font-semibold text-emerald-800 hover:underline">
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
                className={`flex gap-4 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4 ${
                  removingIds.includes(item.cartItemId) ? 'pointer-events-none animate-item-out' : 'animate-rise-in'
                }`}
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
                    {exceedsStock(item.product, items) && (
                      <p role="alert" data-testid={`stock-warning-${item.cartItemId}`} className="mt-1 text-xs font-medium text-red-600">
                        {isOutOfStock(item.product)
                          ? 'Món này đã hết hàng, vui lòng xóa khỏi giỏ.'
                          : `Chỉ còn ${item.product.stock} ly, vui lòng giảm số lượng.`}
                      </p>
                    )}
                    {/* Mục 2.2: tồn kho topping lấy từ GET /cart (giỏ đã lưu) hoặc trang chi tiết món. */}
                    {shortToppings(item, items).map((topping) => (
                      <p
                        key={topping.id}
                        role="alert"
                        data-testid={`topping-warning-${item.cartItemId}-${topping.id}`}
                        className="mt-1 text-xs font-medium text-red-600"
                      >
                        {isToppingSoldOut(topping)
                          ? `Topping ${topping.name} đã hết, vui lòng xóa ly này rồi chọn lại.`
                          : `Topping ${topping.name} chỉ còn ${topping.stock} phần, vui lòng giảm số lượng.`}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="flex items-center gap-2 rounded-full border border-black bg-white p-1">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        onClick={() =>
                          item.qty === 1
                            ? handleRemove(item.cartItemId)
                            : updateQty(item.cartItemId, item.qty - 1)
                        }
                        className="h-8 w-8 rounded-full bg-white text-lg font-bold text-[#002C22] transition hover:bg-[#002C22] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002C22]"
                      >
                        −
                      </button>
                      <span key={item.qty} className="w-5 animate-pop text-center text-sm font-bold text-black">{item.qty}</span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        // Mục 5: đã lấy hết số ly còn trong kho (tính chung mọi dòng cùng món) thì khoá nút +.
                        // Mục 2.1: cũng khoá khi một topping của ly này đã hết phần.
                        disabled={
                          remainingForCart(item.product, items) <= 0 ||
                          remainingForToppings(item.toppings, items) <= 0
                        }
                        onClick={() => updateQty(item.cartItemId, item.qty + 1)}
                        className="h-8 w-8 rounded-full bg-white text-lg font-bold text-[#002C22] transition hover:bg-[#002C22] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002C22] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#002C22]"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Xóa ${item.product.name} khỏi giỏ`}
                      onClick={() => handleRemove(item.cartItemId)}
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
                  disabled={promoLoading}
                  className="rounded-xl bg-[#002C22] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#014034] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002C22] disabled:opacity-60"
                >
                  {promoLoading && <Spinner />}
                  Áp dụng
                </button>
              </div>
              {promoError && (
                <p role="alert" data-testid="promo-error" className="mt-2 text-sm text-red-600">
                  {promoError}
                </p>
              )}
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
              {/* US-05: nút Thanh toán hiển thị tổng tiền (đã trừ giảm giá). */}
              Thanh toán · {getTotalPrice().toLocaleString('vi-VN')}₫
            </button>
            <p className="mt-3 text-center text-xs text-stone-500">Thanh toán an toàn · Hỗ trợ ví và thẻ</p>
          </aside>
        </div>
      </main>
    </div>
  );
}