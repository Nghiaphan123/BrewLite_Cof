// apps/web/src/app/products/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Product, SizeOption, Topping } from '@/types';
import {
  SIZE_SURCHARGE,
  calculateLineTotal,
} from '@/features/product/pricing';
import { isOutOfStock, isToppingSoldOut, remainingForCart, remainingForToppings } from '@/features/product/stock';
import { useCartStore } from '@/store/cart.store';
import { useUiStore } from '@/store/ui.store';
import { ProductDetailSkeleton } from '@/components/Skeleton';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const productId = String(params?.id || '');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [size, setSize] = useState<SizeOption>('M');
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [qty, setQty] = useState<number>(1);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const showToast = useUiStore((state) => state.showToast);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiClient.getProductById(productId);
        setProduct(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không tìm thấy sản phẩm');
      } finally {
        setLoading(false);
      }
    }
    if (productId) load();
  }, [productId]);

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) =>
      prev.some((t) => t.id === topping.id)
        ? prev.filter((t) => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-red-600">{error || 'Sản phẩm không tồn tại'}</p>
        <button
          type="button"
          onClick={() => router.push('/menu')}
          className="mt-4 inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          ← Quay lại Menu
        </button>
      </div>
    );
  }

  // Mục 5: không cho thêm quá số ly còn trong kho (đã trừ số ly cùng món đang có trong giỏ).
  const outOfStock = isOutOfStock(product);
  // Mục 2.1: mỗi ly còn dùng 1 phần của mỗi topping đã chọn, nên số ly thêm được cũng bị giới hạn
  // bởi topping còn ít nhất (đã trừ phần topping đó các dòng khác trong giỏ đang cần).
  const remainingDrink = remainingForCart(product, cartItems);
  const remaining = Math.min(remainingDrink, remainingForToppings(selectedToppings, cartItems));
  const limitedByTopping = remainingDrink > 0 && remaining === 0;
  const canAdd = remaining > 0;
  // Giỏ có thể đổi sau khi chọn số lượng, nên luôn kẹp lại trong khoảng 1..remaining.
  const effectiveQty = Math.max(1, Math.min(qty, remaining || 1));
  const totalPrice = calculateLineTotal(product.price, size, selectedToppings, effectiveQty);

  const handleAddToCart = () => {
    if (!canAdd) return;
    addItem(product, size, selectedToppings, effectiveQty);
    showToast(`Đã thêm ${product.name} vào giỏ`);
    router.push('/cart');
  };

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Quay lại Menu
      </button>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {/* Mục 6: ảnh món (wireframe màn 2, backlog Task 4). Alt là tên món theo ui-decisions.md. */}
        <div data-testid="product-detail-image" className="relative aspect-[4/3] bg-stone-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 448px) 100vw, 448px"
              unoptimized
              className={`object-cover ${outOfStock ? 'grayscale' : ''}`}
            />
          ) : (
            <span aria-hidden="true" className="flex h-full items-center justify-center text-6xl">
              ☕
            </span>
          )}
          {outOfStock && (
            <span className="absolute left-3 top-3 rounded-full bg-stone-900/85 px-3 py-1 text-xs font-bold text-white">
              Hết hàng
            </span>
          )}
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-stone-900">{product.name}</h1>
          <p className="mt-1 text-stone-600">
            Giá gốc: <span className="font-semibold">{product.price.toLocaleString('vi-VN')}₫</span>
          </p>
          {outOfStock ? (
            <p role="status" data-testid="stock-notice" className="mt-3 rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
              Món này tạm hết hàng. Bạn vui lòng chọn món khác nhé.
            </p>
          ) : limitedByTopping ? (
            <p role="status" data-testid="stock-notice" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              Topping bạn chọn không còn đủ cho thêm ly nào. Bạn bỏ bớt topping đó nhé.
            </p>
          ) : !canAdd ? (
            <p role="status" data-testid="stock-notice" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              Giỏ hàng của bạn đã có hết số ly còn lại của món này.
            </p>
          ) : null}

          {/* Chọn Size S / M / L */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
              Chọn Size
            </h2>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['S', 'M', 'L'] as SizeOption[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  data-testid={`size-${s}`}
                  onClick={() => setSize(s)}
                  className={`rounded-lg border py-2.5 text-sm font-semibold transition ${
                    size === s
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  {s} {SIZE_SURCHARGE[s] > 0 ? `(+${SIZE_SURCHARGE[s] / 1000}k)` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Chọn Topping */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
              Topping
            </h2>
            <div className="mt-2 space-y-2">
              {(product.toppings ?? []).map((topping) => {
                const checked = selectedToppings.some((t) => t.id === topping.id);
                // Mục 2.1: topping hết hàng không chọn được (vẫn bỏ chọn được nếu đã chọn trước đó).
                const soldOut = isToppingSoldOut(topping);
                return (
                  <label
                    key={topping.id}
                    className={`flex items-center justify-between rounded-lg border border-stone-200 p-3 ${
                      soldOut && !checked ? 'cursor-not-allowed bg-stone-50 opacity-60' : 'cursor-pointer hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        data-testid={`topping-${topping.id}`}
                        checked={checked}
                        disabled={soldOut && !checked}
                        onChange={() => toggleTopping(topping)}
                        className="h-4 w-4 accent-emerald-700"
                      />
                      <span className="text-sm font-medium text-stone-800">{topping.name}</span>
                      {soldOut && (
                        <span data-testid={`topping-soldout-${topping.id}`} className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                          Hết
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-stone-600">
                      +{topping.price.toLocaleString('vi-VN')}₫
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Số lượng */}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700">Số lượng</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Giảm số lượng"
                onClick={() => setQty(Math.max(1, effectiveQty - 1))}
                className="h-9 w-9 rounded-full border border-[#002C22] bg-white text-lg font-bold text-[#002C22] transition hover:bg-[#002C22] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002C22]"
              >
                −
              </button>
              <span data-testid="detail-qty" className="min-w-6 text-center font-bold text-black">
                {effectiveQty}
              </span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                disabled={effectiveQty >= remaining}
                onClick={() => setQty(Math.min(effectiveQty + 1, remaining))}
                className="h-9 w-9 rounded-full border border-[#002C22] bg-white text-lg font-bold text-[#002C22] transition hover:bg-[#002C22] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002C22] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#002C22]"
              >
                +
              </button>
            </div>
          </div>

          {/* Tổng giá & Nút Thêm vào giỏ */}
          <div className="mt-6 border-t border-stone-200 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-stone-600">Tạm tính:</span>
              <span data-testid="detail-total-price" className="text-xl font-bold text-emerald-800">
                {totalPrice.toLocaleString('vi-VN')}₫
              </span>
            </div>

            <button
              type="button"
              data-testid="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!canAdd}
              className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
            >
              {/* Task 4: nhãn nút ghi kèm tổng tiền để khách biết sẽ thêm bao nhiêu vào giỏ. */}
              {outOfStock
                ? 'Hết hàng'
                : canAdd
                  ? `Thêm vào giỏ · ${totalPrice.toLocaleString('vi-VN')}₫`
                  : limitedByTopping
                    ? 'Topping không đủ'
                    : 'Đã đủ số lượng còn lại'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailPage() {
  return (
    <React.Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent />
    </React.Suspense>
  );
}